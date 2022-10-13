"""Flask web app providing API to notmuch. Based on API from netviel (https://github.com/DavidMStraub/netviel)."""

import email
import email.policy
import io
import itertools
import logging
import os
import subprocess

import json
import re

import notmuch
from flask import Flask, current_app, g, send_file, send_from_directory, request
from werkzeug.utils import safe_join
from flask_restful import Api, Resource

import icalendar
from dateutil import tz

import M2Crypto
from M2Crypto import SMIME, BIO, X509

import bleach
from bs4 import BeautifulSoup

import lxml
from lxml.html.clean import Cleaner

cleaner = Cleaner()
cleaner.javascript = True
cleaner.scripts = True
cleaner.page_structure = True
cleaner.meta = True
cleaner.embedded = True
cleaner.frames = True
cleaner.forms = True
cleaner.remove_unknown_tags = True
cleaner.safe_attrs_only = False
cleaner.add_nofollow = True

def get_db():
    """Get a new `Database` instance. Called before every request. Cached on first call."""
    if "db" not in g:
        g.db = notmuch.Database(None, create = False)
    return g.db


def get_query(query_string, db = None, exclude = True):
    """Get a Query with config set."""
    db = get_db() if db == None else db
    query = notmuch.Query(db, query_string)
    if exclude:
        for tag in db.get_config("search.exclude_tags").split(';'):
            query.exclude_tag(tag)
    return query

def close_db(e = None):
    """Close the Database. Called after every request."""
    g.db.close()


def email_header(emails):
    """Encodes email names and addresses as email header from list of addresses separated by newline."""
    tmp = email.header.Header()
    if len(emails) > 0:
        parts = emails.split('\n')
        for i in range(0, len(parts)):
            try:
                [ name, address ] = parts[i].split('<')
                if name.isascii():
                    tmp.append(name.strip(), 'ascii')
                else:
                    tmp.append(name.strip(), 'utf8')
                address = '<' + address
            except ValueError: # only email address, no name
                address = parts[i]
            tmp.append(address.strip() + ("," if i < (len(parts) - 1) else ""), 'ascii')

    return tmp


def create_app():
    """Flask application factory."""
    app = Flask(__name__, static_folder = "static")
    app.config["PROPAGATE_EXCEPTIONS"] = True

    configPath = os.getenv("XDG_CONFIG_HOME") if os.getenv("XDG_CONFIG_HOME") else os.getenv("HOME") + os.path.sep + ".config"
    with open(configPath + os.path.sep + "kukulkan" + os.path.sep + "config", "r") as f:
        app.config.custom = json.load(f)

    app.logger.setLevel(logging.INFO)

    api = Api(app)

    @app.route("/", methods=['GET', 'POST'])
    def send_index():
        return send_from_directory(app.static_folder, "index.html")

    @app.route("/<path:path>", methods=['GET', 'POST'])
    def send_js(path):
        if path and os.path.exists(safe_join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        return send_from_directory(app.static_folder, "index.html")

    @app.before_request
    def before_request():
        get_db()

    app.teardown_appcontext(close_db)

    @app.after_request
    def security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"

        if os.getenv("FLASK_ENV") == "development":
            response.headers["Access-Control-Allow-Origin"] = "*"
            response.headers["Cross-Origin-Opener-Policy"] = "cross-origin"
            response.headers["Cross-Origin-Resource-Policy"] = "cross-origin"
            response.headers["X-Frame-Options"] = "CROSSORIGIN"
        else:
            response.headers["Cross-Origin-Resource-Policy"] = "same-origin"
            response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
            response.headers["X-Frame-Options"] = "SAMEORIGIN"
        return response

    class Query(Resource):
        def get(self, query_string):
            threads = get_query(query_string).search_threads()
            return threads_to_json(threads, number = None)

    class Address(Resource):
        def get(self, query_string):
            # not supported by API...
            addrs = os.popen("notmuch address " + query_string).read()
            return [ addr for addr in addrs.split('\n') if addr ]

    class Thread(Resource):
        def get(self, thread_id):
            threads = get_query("thread:{}".format(thread_id), exclude = False).search_threads()
            thread = next(threads)  # there can be only 1
            messages = thread.get_messages()
            return messages_to_json(messages)
    
    class Tags(Resource):
        def get(self):
            tags = [ tag for tag in get_db().get_all_tags() if tag != "(null)" ]
            return tags

    class Accounts(Resource):
        def get(self):
            return current_app.config.custom["accounts"]

    # all requests that return lists must be defined this way
    api.add_resource(Query, "/api/query/<path:query_string>")
    api.add_resource(Address, "/api/address/<path:query_string>")
    api.add_resource(Thread, "/api/thread/<path:thread_id>")
    api.add_resource(Tags, "/api/tags/")
    api.add_resource(Accounts, "/api/accounts/")

    @app.route("/api/attachment/<path:message_id>/<int:num>")
    def download_attachment(message_id, num):
        msgs = get_query("mid:{}".format(message_id), exclude = False).search_messages()
        msg = next(msgs)  # there can be only 1
        d = message_attachment(msg, num)
        if not d:
            return None
        if isinstance(d["content"], str):
            f = io.BytesIO(io.StringIO(d["content"]).getvalue().encode())
        else:
            f = io.BytesIO(bytes(d["content"]))
        return send_file(f, mimetype = d["content_type"], as_attachment = True,
            download_name = d["filename"])

    @app.route("/api/message/<path:message_id>")
    def download_message(message_id):
        msgs = get_query("mid:{}".format(message_id), exclude = False).search_messages()
        msg = next(msgs)  # there can be only 1
        return message_to_json(msg)

    @app.route("/api/raw_message/<path:message_id>")
    def download_raw_message(message_id):
        msgs = get_query("mid:{}".format(message_id), exclude = False).search_messages()
        msg = next(msgs)  # there can be only 1
        with open(msg.get_filename(), "r") as f:
            content = f.read()
        return content

    @app.route("/api/auth_message/<path:message_id>")
    def auth_message(message_id):
        msgs = get_query("mid:{}".format(message_id), exclude = False).search_messages()
        msg = next(msgs)  # there can be only 1
        # https://npm.io/package/mailauth
        return json.loads(os.popen("mailauth " + msg.get_filename()).read())['arc']['authResults']

    @app.route("/api/tag/add/<string:typ>/<path:nid>/<tag>")
    def tag_add(typ, nid, tag):
        db_write = notmuch.Database(None, create = False, mode = notmuch.Database.MODE.READ_WRITE)
        msgs = get_query(("mid" if typ == "message" else typ) + ":" + nid, db_write, False).search_messages()
        try:
            db_write.begin_atomic()
            for msg in msgs:
                msg.add_tag(tag)
                msg.tags_to_maildir_flags()
            db_write.end_atomic()
        finally:
            db_write.close()
        return tag

    @app.route("/api/tag/remove/<string:typ>/<path:nid>/<tag>")
    def tag_remove(typ, nid, tag):
        db_write = notmuch.Database(None, create = False, mode = notmuch.Database.MODE.READ_WRITE)
        msgs = get_query(("mid" if typ == "message" else typ) + ":" + nid, db_write, False).search_messages()
        try:
            db_write.begin_atomic()
            for msg in msgs:
                msg.remove_tag(tag)
                msg.tags_to_maildir_flags()
            db_write.end_atomic()
        finally:
            db_write.close()
        return tag

    @app.route('/api/send', methods=['GET', 'POST'])
    def parse_request():
        accounts = current_app.config.custom["accounts"]
        account = [ acct for acct in accounts if acct["id"] == request.values['from'] ][0]

        msg = email.message.EmailMessage()
        msg.set_content(request.values['body'])

        if request.values['action'] == "forward":
            # attach attachments from original mail
            refMsgs = get_query("mid:{}".format(request.values['refId']), exclude = False).search_messages()
            refMsg = next(refMsgs)
            refAtts = message_attachment(refMsg)
            for key in request.values.keys():
                if key.startswith("attachment-") and key not in request.files:
                    att = [ tmp for tmp in refAtts if tmp["filename"] == request.values[key] ][0]
                    typ = att["content_type"].split('/', 1)
                    msg.add_attachment(att["content"], maintype = typ[0], subtype = typ[1], filename = att["filename"])

        for att in request.files:
            content = request.files[att].read()
            typ = request.files[att].mimetype.split('/', 1)
            msg.add_attachment(content, maintype = typ[0], subtype = typ[1],
                    filename = request.files[att].filename)

        if "key" in account and "cert" in account:
            buf = BIO.MemoryBuffer(bytes(msg))
            smime = SMIME.SMIME()
            smime.load_key(account["key"], account["cert"])
            p7 = smime.sign(buf, SMIME.PKCS7_DETACHED)

            out = BIO.MemoryBuffer()
            buf = BIO.MemoryBuffer(bytes(msg))
            smime.write(out, p7, buf)
            msg = email.message_from_bytes(out.read())

        msg['Subject'] = request.values['subject']
        msg['From'] = account["name"] + " <" + account["email"] + ">"
        msg['To'] = email_header(request.values['to'])
        msg['Cc'] = email_header(request.values['cc'])
        msg['Bcc'] = email_header(request.values['bcc'])
        msg['Date'] = email.utils.formatdate(localtime = True)

        msg_id = email.utils.make_msgid("kukulkan")
        msg['Message-ID'] = msg_id

        if request.values['action'] == "reply":
            refMsgs = get_query("mid:{}".format(request.values['refId']), exclude = False).search_messages()
            refMsg = next(refMsgs)
            refMsg = message_to_json(refMsg)
            msg['In-Reply-To'] = '<' + refMsg['message_id'] + '>'
            if refMsg['references']:
                msg['References'] = refMsg['references'] + ' <' + refMsg['message_id'] + '>'
            else:
                msg['References'] = '<' + refMsg['message_id'] + '>'

        sendcmd = account["sendmail"]
        p = subprocess.Popen(sendcmd.split(' '), stdin = subprocess.PIPE, stdout = subprocess.PIPE, stderr = subprocess.PIPE)
        (out, err) = p.communicate(input = str(msg).encode())
        sendOutput = out.decode() + err.decode()

        if p.returncode == 0:
            fname = account["save_sent_to"] + msg_id[1:-1] + ":2,S"
            with open(fname, "w") as f:
                f.write(str(msg))

            db_write = notmuch.Database(None, create = False, mode = notmuch.Database.MODE.READ_WRITE)
            try:
                db_write.begin_atomic()
                if request.values['action'] == "reply":
                    refMsgs = get_query("mid:" + request.values['refId'], db_write, False).search_messages()
                    for refMsg in refMsgs:
                        refMsg.add_tag("replied")
                        refMsg.tags_to_maildir_flags()
                elif request.values['action'] == "forward":
                    refMsgs = get_query("mid:" + request.values['refId'], db_write, False).search_messages()
                    for refMsg in refMsgs:
                        refMsg.add_tag("passed")
                        refMsg.tags_to_maildir_flags()

                (notmuch_msg, status) = db_write.index_file(fname, True)
                notmuch_msg.maildir_flags_to_tags()
                for tag in request.values['tags'].split(',') + account["additional_sent_tags"]:
                    if tag != "":
                        notmuch_msg.add_tag(tag)
                notmuch_msg.add_tag("sent")
                notmuch_msg.tags_to_maildir_flags()
                db_write.end_atomic()
            finally:
                db_write.close()
        else:
            print(sendOutput)

        return { "sendStatus": p.returncode, "sendOutput": sendOutput }

    return app


def threads_to_json(threads, start = 0, number = None):
    """Converts a list of `notmuch.threads.Threads` instances to a JSON object."""
    if number is None:
        stop = None
    else:
        stop = start + number
    my_threads = itertools.islice(threads, start, stop)
    return [thread_to_json(t) for t in my_threads]


def thread_to_json(thread):
    """Converts a `notmuch.threads.Thread` instance to a JSON object."""
    # necessary to get accurate tags and metadata, work around the notmuch API
    # only considering the matched messages
    messages = thread.get_messages()
    msglist = list(messages)
    return {
        "authors": thread.get_authors() if thread.get_authors() else "(no author)",
        "matched_messages": thread.get_matched_messages(),
        "newest_date": msglist[-1].get_date(),
        "oldest_date": msglist[0].get_date(),
        "subject": thread.get_subject(),
        "tags": list(set([ tag for msg in msglist for tag in msg.get_tags() ])),
        "thread_id": thread.get_thread_id(),
        "total_messages": thread.get_total_messages(),
    }


def strip_tags(soup):
    for typ in ["a","span","em","strong","u","i","font","mark","label","s","sub","sup","tt","bdo","button","cite","del","b"]:
        for t in soup.find_all(typ):
            t.unwrap()
    soup.smooth()


def get_nested_body(email_msg):
    """Gets all, potentially MIME-nested bodies."""
    content_plain = ""
    content_html = ""
    for part in email_msg.walk():
        if part.get_content_type() == "text/plain":
            tmp = part.get_content()
            try:
                repl = current_app.config.custom["filter"]["content"]["text/plain"]
                tmp = re.sub(repl[0], repl[1], tmp)
            except Exception as e:
                print(e)
            content_plain += tmp
        elif part.get_content_type() == "text/html":
            tmp = part.get_content()
            try:
                repl = current_app.config.custom["filter"]["content"]["text/html"]
                tmp = re.sub(repl[0], repl[1], tmp)
            except Exception as e:
                print(e)
            content_html += tmp
        elif part.get_content_type() == "application/pkcs7-mime":
            from asn1crypto import cms
            content_info = cms.ContentInfo.load(part.get_payload(decode = True))
            compressed_data = content_info['content']
            smime = compressed_data['encap_content_info']['content'].native
            tmp = email.message_from_bytes(smime, policy = email.policy.default)
            tmp_plain, tmp_html = get_nested_body(tmp)
            content_plain += tmp_plain
            content_html += tmp_html

    if content_html:
        # remove any conflicting document encodings
        html = lxml.html.fromstring(re.sub("\<\?xml[^>]+>", "", content_html))
        for tag in html.xpath('//*[@*[contains(.,"http")]]'):
            for name, value in tag.items():
                if "http" in value and not name == "href":
                    del tag.attrib[name]
        content_html = lxml.html.tostring(cleaner.clean_html(html), encoding = str)
    else:
        content_html = ""

    # "plain" text might be HTML...
    if content_plain:
        content = content_plain
        if "<html" in content_plain:
            soup = BeautifulSoup(content_plain, features = 'html.parser')
            strip_tags(soup)
            content = ''.join(soup.get_text("\n\n", strip = True))
    else:
        soup = BeautifulSoup(content_html, features = 'html.parser')
        strip_tags(soup)
        content = ''.join(soup.get_text("\n\n", strip = True))

    return content, content_html

def get_attachments(email_msg, content = False):
    """Returns all attachments for an email message."""
    attachments = []
    for part in email_msg.walk():
        if part.get_content_maintype() == "multipart":
            continue
        if (part.get_content_disposition() in ["attachment", "inline"] or part.get_content_type() == "text/calendar") and not (part.get_content_disposition() == "inline" and part.get_content_type() == "text/plain"):
            ctnt = part.get_content()
            preview = None
            if part.get_content_type() == "text/calendar":
                # create "preview"
                gcal = icalendar.Calendar.from_ical(ctnt)
                for component in gcal.walk():
                    if component.name == "VEVENT":
                        people = [component.get("organizer").params["CN"]]
                        a = component.get("attendee")
                        if type(a) == list:
                            people += [ c.params["CN"] for c in a ]
                        else:
                            people.append(a.params["CN"])
                        preview = {
                            "summary": component.get("summary"),
                            "location": component.get("location"),
                            "start": component.get("dtstart").dt.astimezone(tz.tzlocal()).strftime("%c"),
                            "end": component.get("dtend").dt.astimezone(tz.tzlocal()).strftime("%c"),
                            "attendees": ", ".join(people)
                        }

            attachments.append({
                "filename": part.get_filename() if part.get_filename() else "unnamed attachment",
                "content_type": part.get_content_type(),
                "content_size": len(bytes(ctnt, "utf8")) if isinstance(ctnt, str) else len(bytes(ctnt)),
                "content": ctnt if content else None,
                "preview": preview
            })
    return attachments


def messages_to_json(messages):
    """Converts a list of `notmuch.message.Message` instances to a JSON object."""
    return [ message_to_json(m) for m in messages ]


def message_to_json(message):
    """Converts a `notmuch.message.Message` instance to a JSON object."""
    with open(message.get_filename(), "rb") as f:
        email_msg = email.message_from_binary_file(f, policy = email.policy.default)

    attachments = get_attachments(email_msg)
    body, html_body = get_nested_body(email_msg)

    # signature verification
    # https://gist.github.com/russau/c0123ef934ef88808050462a8638a410
    for part in email_msg.walk():
        if 'signed' in part.get_content_type() or part.get_content_type() == "application/pkcs7-mime":
            try:
                p7, data_bio = SMIME.smime_load_pkcs7_bio(BIO.MemoryBuffer(bytes(part)))

                s = SMIME.SMIME()
                store = X509.X509_Store()
                certStack = p7.get0_signers(X509.X509_Stack())
                accounts = current_app.config.custom["accounts"]
                accts = [ acct for acct in accounts if acct["email"] in message.get_header("from").strip().replace('\t', ' ') ]
                if accts and accts[0]["cert"]:
                    cert = M2Crypto.X509.load_cert(accts[0]["cert"])
                    store.load_info(accts[0]["cert"])
                s.set_x509_store(store)
                s.set_x509_stack(certStack)
                try:
                    s.verify(p7, data_bio, flags = M2Crypto.SMIME.PKCS7_DETACHED)
                    signature = { "valid": True }
                except M2Crypto.SMIME.PKCS7_Error as e:
                    if str(e) == "certificate verify error (Verify error:self signed certificate)" or str(e) == "certificate verify error (Verify error:self signed certificate in certificate chain)" or str(e) == "certificate verify error (Verify error:unable to get local issuer certificate)":
                        try:
                            s.verify(p7, data_bio, flags = M2Crypto.SMIME.PKCS7_NOVERIFY | M2Crypto.SMIME.PKCS7_DETACHED)
                            signature = { "valid": True, "message": "self-signed or unavailable certificate(s)" }
                        except M2Crypto.SMIME.PKCS7_Error as e:
                            signature = { "valid": False, "message": str(e) }
                    else:
                        signature = { "valid": False, "message": str(e) }
            except Exception as e:
                signature = { "valid": False, "message": str(e) }
            break
        else:
            signature = None

    return {
        "from": message.get_header("from").strip().replace('\t', ' '),
        "to": message.get_header("to").strip().replace('\t', ' '),
        "cc": message.get_header("cc").strip().replace('\t', ' '),
        "bcc": message.get_header("bcc").strip().replace('\t', ' '),
        "date": message.get_header("date").strip(),
        "subject": message.get_header("subject").strip(),
        "message_id": message.get_header("Message-ID").strip(),
        "in_reply_to": message.get_header("In-Reply-To").strip() if message.get_header("In-Reply-To") else None,
        "references": message.get_header("References").strip() if message.get_header("References") else None,
        "reply_to": message.get_header("Reply-To").strip() if message.get_header("Reply-To") else None,
        "body": {
            "text/plain": body,
            "text/html": html_body
        },
        "attachments": attachments,
        "notmuch_id": message.get_message_id(),
        "tags": [ tag for tag in message.get_tags() ],
        "signature": signature
    }


def message_attachment(message, num = -1):
    """Returns attachment no. `num` of a `notmuch.message.Message` instance."""
    with open(message.get_filename(), "rb") as f:
        email_msg = email.message_from_binary_file(f, policy = email.policy.default)
    attachments = get_attachments(email_msg, True)
    if not attachments:
        return {}
    if num == -1:
        return attachments
    return attachments[num]
