"""Flask web app providing API to notmuch. Based on API from netviel (https://github.com/DavidMStraub/netviel)."""

import email
import email.headerregistry
import email.mime.multipart
import email.mime.text
import email.policy

import datetime
import io
import logging
import os
import subprocess
import threading
import queue

import json
import re
import hashlib
import base64

from tempfile import mkstemp, NamedTemporaryFile

import notmuch
from flask import Flask, Response, abort, current_app, g, render_template, request, send_file, send_from_directory
from markupsafe import escape
from werkzeug.utils import safe_join

import icalendar
from dateutil import tz
from dateutil.rrule import rrulestr
from recurrent.event_parser import RecurringEvent

from asn1crypto import core, pem, cms
from cryptography import x509
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding, ec
from cryptography.hazmat.primitives.serialization import load_pem_private_key, pkcs7, Encoding
from cryptography.hazmat.backends import default_backend
from cryptography.x509.verification import PolicyBuilder, Store

from bs4 import BeautifulSoup

import lxml
from lxml_html_clean import Cleaner

from PIL import Image

from gnupg import GPG

cleaner = Cleaner(javascript=True,
                  scripts=True,
                  page_structure=True,
                  processing_instructions=True,
                  style=True,
                  meta=True,
                  embedded=True,
                  frames=True,
                  forms=True,
                  remove_unknown_tags=True,
                  safe_attrs_only=False,
                  add_nofollow=True)


send_queue = queue.Queue()

policy = email.policy.default.clone(utf8=True)


# claude helped with this
def feed_input(process, buffer, bytes_written):
    """Feeds input from a buffer to a process, monitoring how much is written."""
    processed = 0
    while True:
        chunk = buffer.read(1024)
        if not chunk:
            break
        processed += len(chunk)
        process.stdin.write(chunk)
        process.stdin.flush()
        bytes_written.put(processed)


# claude helped with this as well
def email_addresses_header(emails):
    """Encodes email names and addresses from list of addresses separated by newline."""
    tmp = []
    if len(emails) > 0:
        for mail in [x.strip() for x in emails.split('\n')]:
            try:
                display_name, address = mail.rsplit('<', 1)
                local_part, domain = address.strip('>').rsplit('@', 1)
                # strip any surrounding quotes from the display name
                display_name = display_name.strip('" ')
                tmp.append(email.headerregistry.Address(display_name or "", local_part, domain))
            except ValueError:  # only email address, no name
                local_part, domain = mail.rsplit('@', 1)
                tmp.append(email.headerregistry.Address("", local_part, domain))

    return ", ".join(str(addr) for addr in tmp)


def extract_name_from_email(email_str):
    """Extracts the name part from an email address, or the address if there is
    no name part."""
    if email_str is None:
        return "(no author)"
    pts = email_str.replace('\t', ' ').strip().split(' ')
    if len(pts) == 1:
        return pts[0].strip('<>')
    name = ' '.join(pts[:-1])
    return name.strip('"\',')


def split_email_addresses(header):
    """Returns all email addresses (without the names) in a string."""
    addresses = re.findall(r'([^,][^@]*@[^,]+)', header.replace('\t', ' '))
    return [addr.strip() for addr in addresses]

def get_db():
    """Get a new `Database` instance. Called before every request. Cached on first call."""
    if "db" not in g:
        g.db = notmuch.Database(None, create=False)
    return g.db


def get_query(query_string, db=None, exclude=True):
    """Get a Query with config set."""
    db = get_db() if db is None else db
    query = notmuch.Query(db, query_string)
    if exclude:
        for tag in db.get_config("search.exclude_tags").split(';'):
            if tag != '':
                query.exclude_tag(tag)
    return query


def get_message(message_id):
    """Get a single message."""
    msgs = list(get_query(f'id:{message_id}', exclude=False).search_messages())
    if not msgs:
        abort(404)
    if len(msgs) > 1:
        abort(500)
    return msgs[0]


# pylint: disable=unused-argument
def close_db(e=None):
    """Close the Database. Called after every request."""
    g.db.close()


def get_globals():
    """Get global configuration variables."""
    try:
        accts = current_app.config.custom["accounts"]
    except KeyError:
        accts = []
    tags = [tag for tag in get_db().get_all_tags() if tag != "(null)"]
    try:
        cmp = current_app.config.custom["compose"]
    except KeyError:
        cmp = []
    return {"accounts": accts, "allTags": tags, "compose": cmp}


def email_address_complete(query_string):
    """Returns list of email addresses from messages that match the
    query_string."""
    qs = query_string.casefold()
    addrs = {}
    i = 0
    for msg in get_query(f"from:{query_string} or to:{query_string}").search_messages():
        for header in ['from', 'to', 'cc', 'bcc']:
            value = msg.get_header(header)
            if value and qs in value.casefold():
                for addr in split_email_addresses(value):
                    acf = addr.casefold()
                    if qs in acf:
                        email_addr = re.search(r'[^ "\'<>]+@[^ >"\']+', acf).group()
                        # keep first one (i.e. most recent)
                        try:
                            addrs[email_addr]
                        except KeyError:
                            addrs[email_addr] = addr
        if i > 1000 or len(addrs) > 14:
            break
        i += 1
    return addrs


def create_app():
    """Flask application factory."""
    if os.getenv("FLASK_DEBUG"):
        app = Flask(__name__, static_folder="static", template_folder="../../client/")
    else:
        app = Flask(__name__, static_folder="static", template_folder="static")
    app.config["PROPAGATE_EXCEPTIONS"] = True
    app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 900

    config_path = os.getenv("XDG_CONFIG_HOME") if os.getenv("XDG_CONFIG_HOME") else os.getenv("HOME") + os.path.sep + ".config"
    try:
        with open(f"{config_path}{os.path.sep}kukulkan{os.path.sep}config", "r", encoding="utf8") as f:
            app.config.custom = json.load(f)
    except FileNotFoundError:
        app.logger.warning("Configuration file not found, setting empty config.")
        app.config.custom = {}

    app.logger.setLevel(logging.INFO)

    @app.before_request
    def before_request():
        get_db()

    app.teardown_appcontext(close_db)

    @app.route("/", methods=['GET', 'POST'])
    def send_index():
        globs = get_globals()
        if(query_string := request.args.get("query")):
            globs["threads"] = query(query_string)
        return render_template("index.html", data=globs)

    @app.route("/<path:path>", methods=['GET', 'POST'])
    def send_js(path):
        if path and os.path.exists(safe_join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        globs = get_globals()
        if path == "todo":
            globs["threads"] = query("tag:todo")
        elif path == "thread":
            globs["thread"] = thread(request.args.get("id"))
        elif path == "message":
            if(attach_num := request.args.get("attachNum")):
                globs["message"] = attachment_message(request.args.get("id"),
                                                      int(attach_num))
            else:
                globs["message"] = message(request.args.get("id"))
        elif path == "write":
            if(wid := request.args.get("id")):
                globs["baseMessage"] = message(wid)
        return render_template("index.html", data=globs)

    @app.after_request
    def security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"

        if os.getenv("FLASK_DEBUG") or ("allow-cross-origin-write" in current_app.config.custom and current_app.config.custom["allow-cross-origin-write"] == "true" and (request.path.startswith("/write") or request.path.startswith("/api/edit_external"))):
            response.headers["Access-Control-Allow-Origin"] = "*"
            response.headers["Cross-Origin-Opener-Policy"] = "cross-origin"
            response.headers["Cross-Origin-Resource-Policy"] = "cross-origin"
            response.headers["X-Frame-Options"] = "CROSSORIGIN"
        else:
            response.headers["Cross-Origin-Resource-Policy"] = "same-origin"
            response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
            response.headers["X-Frame-Options"] = "SAMEORIGIN"
        return response

    @app.route("/api/query/<string:query_string>")
    def query(query_string):
        threads = get_query(query_string).search_threads()
        return [thread_to_json(t) for t in threads]

    @app.route("/api/address/<string:query_string>")
    def address_complete(query_string):
        return list(email_address_complete(query_string).values())

    @app.route("/api/email/<string:query_string>")
    def email_complete(query_string):
        return list(email_address_complete(query_string).keys())

    @app.route("/api/thread/<string:thread_id>")
    def thread(thread_id):
        threads = list(get_query(f'thread:"{thread_id}"', exclude=False).search_threads())
        if not threads:
            abort(404)
        if len(threads) > 1:
            abort(500)
        messages = threads[0].get_messages()
        return messages_to_json(messages)

    @app.route("/api/attachment/<string:message_id>/<int:num>")
    @app.route("/api/attachment/<string:message_id>/<int:num>/<int:scale>")
    def attachment(message_id, num, scale=0):
        msg = get_message(message_id)
        d = message_attachment(msg, num)
        if not d:
            abort(404)
        if isinstance(d["content"], str):
            f = io.BytesIO(io.StringIO(d["content"]).getvalue().encode("utf8"))
        else:
            f = io.BytesIO(bytes(d["content"]))
            if "image" in d["content_type"] and scale != 0:
                img = Image.open(f)

                w, h = img.size
                sf = min(500 / max(w, h), 1)
                resized_img = img.resize((int(w * sf), int(h * sf)), Image.Resampling.LANCZOS)
                f = io.BytesIO()
                resized_img.save(f, format=img.format if img.format else 'JPEG')
                f.seek(0)
        return send_file(f, mimetype=d["content_type"], as_attachment=False,
                         download_name=d["filename"].replace('\n', ''))

    @app.route("/api/attachment_message/<string:message_id>/<int:num>")
    def attachment_message(message_id, num):
        msg = get_message(message_id)
        d = message_attachment(msg, num)
        if not d:
            abort(404)
        return eml_to_json(bytes(d["content"]))

    @app.route("/api/message/<string:message_id>")
    def message(message_id):
        msg = get_message(message_id)
        return message_to_json(msg)

    @app.route("/api/raw_message/<string:message_id>")
    def raw_message(message_id):
        msg = get_message(message_id)
        with open(msg.get_filename(), "r", encoding="utf8") as f:
            content = f.read()
        return content

    @app.route("/api/auth_message/<string:message_id>")
    def auth_message(message_id):
        msg = get_message(message_id)
        # https://npm.io/package/mailauth
        return json.loads(os.popen(f"mailauth {msg.get_filename()}").read())['arc']['authResults']

    @app.route("/api/tag_batch/<string:typ>/<string:nids>/<string:tags>")
    def change_tags(typ, nids, tags):
        for nid in nids.split(' '):
            for tag in tags.split(' '):
                if(tag[0] == '-'):
                    change_tag("remove", typ, nid, tag[1:])
                else:
                    change_tag("add", typ, nid, tag)
        return f"{escape(nids)}/{escape(tags)}"

    @app.route("/api/tag/<op>/<string:typ>/<string:nid>/<string:tag>")
    def change_tag(op, typ, nid, tag):
        # pylint: disable=no-member
        id_type = 'id' if typ == "message" else typ
        tag_prefix = 'not ' if op == "add" else ''
        query = f"{id_type}:{nid} and {tag_prefix}tag:{tag}"
        db_write = notmuch.Database(None, create=False, mode=notmuch.Database.MODE.READ_WRITE)
        msgs = list(get_query(query, db_write, False).search_messages())
        try:
            db_write.begin_atomic()
            for msg in msgs:
                if op == "add":
                    msg.add_tag(tag)
                elif op == "remove":
                    msg.remove_tag(tag)
                msg.tags_to_maildir_flags()
            db_write.end_atomic()
        finally:
            db_write.close()
        return escape(tag)

    @app.route('/api/edit_external', methods=['POST'])
    def edit_external():
        try:
            editcmd = current_app.config.custom["compose"]["external-editor"]
            if not editcmd:
                abort(404)
        except KeyError:
            abort(404)

        # pylint: disable=consider-using-with
        tmp = NamedTemporaryFile(mode="w", delete=False, prefix="kukulkan-tmp-")
        try:
            tmp.write(request.values['body'])
            tmp.close()
            subprocess.run(editcmd.split(' ') + [tmp.name], check=True)
            # pylint: disable=consider-using-with
            tmp = open(tmp.name, encoding="utf8")
            return tmp.read()
        finally:
            tmp.close()
            os.unlink(tmp.name)

    @app.route('/api/send', methods=['GET', 'POST'])
    def send():
        try:
            accounts = current_app.config.custom["accounts"]
            account = [acct for acct in accounts if acct["id"] == request.values['from']][0]
        except (KeyError, IndexError) as e:
            raise ValueError("Unable to find matching account in config!") from e

        msg = email.message.EmailMessage()
        msg.set_content(request.values['body'])

        if request.values['action'] == "forward":
            # attach attachments and HTML from original mail
            ref_msg = get_message(request.values['refId'])
            ref_atts = message_attachment(ref_msg)
            for key in request.values.keys():
                if key.startswith("attachment-") and key not in request.files:
                    try:
                        att = next(tmp for tmp in ref_atts if tmp["filename"] == request.values[key])
                        typ = att["content_type"].split('/', 1)
                        if isinstance(att["content"], bytes):
                            msg.add_attachment(att["content"], maintype=typ[0], subtype=typ[1], filename=att["filename"])
                        else:
                            msg.add_attachment(att["content"], subtype=typ[1], filename=att["filename"])
                    except StopIteration:
                        # original HTML
                        email_msg = email_from_notmuch(ref_msg)
                        for part in email_msg.walk():
                            if part.get_content_type() == "text/html":
                                html = part.get_content()
                                msg.add_attachment(html, subtype="html")

        if request.values['action'].startswith("reply-cal-"):
            # create new calendar reply attachment
            action = request.values['action'].split('-')[2].capitalize()
            ref_msg = get_message(request.values['refId'])
            ref_atts = message_attachment(ref_msg)
            for key in request.values.keys():
                if key.startswith("attachment-") and key not in request.files:
                    att = [tmp for tmp in ref_atts if tmp["filename"] == request.values[key]][0]
                    typ = att["content_type"].split('/', 1)
                    gcal = icalendar.Calendar.from_ical(att["content"])
                    for component in gcal.walk("VEVENT"):
                        rcal = icalendar.Calendar()
                        rcal["method"] = "REPLY"
                        event = icalendar.Event()
                        event["uid"] = component["uid"]
                        event["dtstamp"] = datetime.datetime.now().strftime("%Y%m%dT%H%M%SZ")
                        event["sequence"] = component["sequence"]
                        event["dtstart"] = component["dtstart"]
                        event["dtend"] = component["dtend"]
                        event["organizer"] = component["organizer"]
                        event["description"] = component["description"]
                        event["location"] = component["location"]
                        event["summary"] = f"{action}: {component['summary']}"
                        attendee = icalendar.vCalAddress(f'MAILTO:{account["email"]}')
                        attendee.params['cn'] = icalendar.vText(account["name"])
                        if action == "Accept":
                            attendee.params['partstat'] = icalendar.vText('ACCEPTED')
                        elif action == "Decline":
                            attendee.params['partstat'] = icalendar.vText('DECLINED')
                        else:
                            attendee.params['partstat'] = icalendar.vText(action.upper())
                        event.add('attendee', attendee)
                        rcal.add_component(event)
                        msg.add_attachment(rcal.to_ical().decode("utf8"),
                                           subtype=typ[1],
                                           filename=att["filename"])
                        msg.attach(email.mime.text.MIMEText(rcal.to_ical().decode("utf8"),
                                                                       "calendar;method=REPLY"))

        for att in request.files:
            content = request.files[att].read()
            typ = request.files[att].mimetype.split('/', 1)
            msg.add_attachment(content, maintype=typ[0], subtype=typ[1],
                               filename=request.files[att].filename)

        if "key" in account and "cert" in account:
            # using as_bytes directly doesn't seem to trigger content transfer
            # encoding etc, so the computed digest will be different from what's
            # sent
            with open(account["key"], 'rb') as key_data:
                key = load_pem_private_key(key_data.read(), password=None)
            with open(account["cert"], 'rb') as cert_data:
                cert = x509.load_pem_x509_certificate(cert_data.read())

            out = pkcs7.PKCS7SignatureBuilder().set_data(
                msg.as_string(policy=policy).encode("utf8")
            ).add_signer(
                cert, key, hashes.SHA512(), rsa_padding=padding.PKCS1v15()
            ).sign(
                Encoding.SMIME, [pkcs7.PKCS7Options.DetachedSignature]
            )
            msg = email.message_from_bytes(out)

        msg['Subject'] = request.values['subject']
        msg['From'] = f'{account["name"]} <{account["email"]}>'
        msg['To'] = email_addresses_header(request.values['to'])
        msg['Cc'] = email_addresses_header(request.values['cc'])
        msg['Bcc'] = email_addresses_header(request.values['bcc'])
        msg['Date'] = email.utils.formatdate(localtime=True)

        msg_id = email.utils.make_msgid("kukulkan")
        msg['Message-ID'] = msg_id

        if request.values['action'] == "reply" or request.values['action'].startswith("reply-cal-"):
            ref_msg = get_message(request.values['refId'])
            ref_msg = message_to_json(ref_msg)
            msg['In-Reply-To'] = f"<{ref_msg['message_id']}>"
            if ref_msg['references']:
                msg['References'] = f"{ref_msg['references']} <{ref_msg['message_id']}>"
            else:
                msg['References'] = f"<{ref_msg['message_id']}>"

        # need to extract the request values for testing
        ra = request.values['action']
        if ra == "reply" or ra == "forward" or ra.startswith("reply-cal-"):
            rr = request.values['refId']
        else:
            rr = ""
        rt = request.values['tags']

        # claude helped with this
        def worker(send_id):
            sendcmd = account["sendmail"]
            bytes_msg = msg.as_string(policy=policy).encode("utf8")
            bytes_total = len(bytes_msg)
            bytes_written = queue.Queue()
            with subprocess.Popen(sendcmd.split(' '), stdin=subprocess.PIPE,
                                  stdout=subprocess.PIPE,
                                  stderr=subprocess.PIPE) as p:
                input_thread = threading.Thread(target=feed_input, args=(p, io.BytesIO(bytes_msg), bytes_written))
                input_thread.start()

                while True:
                    send_queue.put({"send_id": send_id, "send_status": "sending", "progress": bytes_written.get() / bytes_total})
                    if input_thread.is_alive() is False:
                        break
                out, err = p.communicate()
                send_output = out.decode("utf8") + err.decode("utf8")

                if p.returncode == 0:
                    fname = f'{account["save_sent_to"]}{msg_id[1:-1]}:2,S'
                    with open(fname, "w", encoding="utf8") as f:
                        f.write(msg.as_string(policy=policy))

                    # pylint: disable=no-member
                    db_write = notmuch.Database(None, create=False, mode=notmuch.Database.MODE.READ_WRITE)
                    try:
                        db_write.begin_atomic()
                        if ra == "reply" or ra.startswith("reply-cal-"):
                            ref_msgs = get_query(f"id:{rr}", db_write, False).search_messages()
                            for ref_msg in ref_msgs:
                                ref_msg.add_tag("replied")
                                ref_msg.tags_to_maildir_flags()
                        elif ra == "forward":
                            ref_msgs = get_query(f"id:{rr}", db_write, False).search_messages()
                            for ref_msg in ref_msgs:
                                ref_msg.add_tag("passed")
                                ref_msg.tags_to_maildir_flags()

                        (notmuch_msg, _) = db_write.index_file(fname, True)
                        notmuch_msg.maildir_flags_to_tags()
                        for tag in rt.split(',') + account["additional_sent_tags"]:
                            if tag != "":
                                notmuch_msg.add_tag(tag)
                        notmuch_msg.add_tag("sent")
                        notmuch_msg.tags_to_maildir_flags()
                        db_write.end_atomic()
                    finally:
                        db_write.close()
                else:
                    print(f"Error in send: {send_output}")

                send_queue.put({"send_id": send_id, "send_status": p.returncode, "send_output": send_output})

        send_id = str(datetime.datetime.now().timestamp())
        threading.Thread(target=worker, args=(send_id,)).start()
        return {"send_id": send_id}, 202

    # claude helped with this
    @app.route("/api/send_progress/<send_id>")
    def task_progress(send_id):
        def generate():
            run = True
            while run:
                try:
                    progress = send_queue.get()
                    if progress["send_id"] == send_id:
                        if progress["send_status"] != "sending":
                            run = False
                        yield f"data: {json.dumps(progress)}\n\n"
                    else:
                        send_queue.put(progress)
                except queue.Empty:
                    yield f"data: {json.dumps({'send_id': send_id, 'progress': '0'})}\n\n"
                    run = False
        return Response(generate(), mimetype='text/event-stream')

    return app


def thread_to_json(thread):
    """Converts a `notmuch.threads.Thread` instance to a JSON object."""
    # necessary to get accurate tags and metadata, work around the notmuch API
    # only considering the matched messages
    messages = list(thread.get_messages())
    tags = list({tag for msg in messages for tag in msg.get_tags()})
    authors = [extract_name_from_email(msg.get_header("from")) for msg in messages]
    authors = list(dict.fromkeys(authors))
    return {
        "authors": authors,
        "matched_messages": thread.get_matched_messages(),
        "newest_date": messages[-1].get_date(),
        "oldest_date": messages[0].get_date(),
        "subject": thread.get_subject().replace('\t', ' ') if thread.get_subject() else "(no subject)",
        "tags": tags,
        "thread_id": thread.get_thread_id(),
        "total_messages": thread.get_total_messages(),
    }


def strip_tags(soup):
    """Strip HTML tags."""
    for typ in ["a", "span", "em", "strong", "u", "i", "font", "mark", "label",
                "s", "sub", "sup", "tt", "bdo", "button", "cite", "del", "b"]:
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
            except KeyError:
                pass
            except Exception as e:
                current_app.logger.error(f"Exception when replacing text content: {str(e)}")
            content_plain += tmp
        elif part.get_content_type() == "text/html":
            tmp = part.get_content()
            try:
                repl = current_app.config.custom["filter"]["content"]["text/html"]
                tmp = re.sub(repl[0], repl[1], tmp)
            except KeyError:
                pass
            except Exception as e:
                current_app.logger.error(f"Exception when replacing HTML content: {str(e)}")
            content_html += tmp
        elif part.get_content_type() == "application/pkcs7-mime":
            # https://stackoverflow.com/questions/58427642/how-to-extract-data-from-application-pkcs7-mime-using-the-email-module-in-pyth
            content_info = cms.ContentInfo.load(part.get_payload(decode=True))
            compressed_data = content_info['content']
            smime = compressed_data['encap_content_info']['content'].native
            tmp = email.message_from_bytes(smime, policy=policy)
            tmp_plain, tmp_html = get_nested_body(tmp)
            content_plain += tmp_plain
            content_html += tmp_html

    if content_html:
        # remove any conflicting document encodings
        html = lxml.html.fromstring(re.sub("<[?]xml[^>]+>", "", content_html))
        for tag in html.xpath('//*[@*[contains(.,"http")]]'):
            for name, value in tag.items():
                if "http" in value and not name == "href":
                    del tag.attrib[name]
        content_html = lxml.html.tostring(cleaner.clean_html(html), encoding=str)
        content_html = re.sub(r'(?i)background-image:.*http.*?;', '', content_html)
    else:
        content_html = ""

    # "plain" text might be HTML...
    if content_plain:
        content = content_plain
        if "<html" in content_plain:
            soup = BeautifulSoup(content_plain, features='html.parser')
            strip_tags(soup)
            content = ''.join(soup.get_text("\n\n", strip=True))
    else:
        soup = BeautifulSoup(content_html, features='html.parser')
        strip_tags(soup)
        content = ''.join(soup.get_text("\n\n", strip=True))

    return content, content_html


def attendee_matches_addr(c, message):
    """Check if a meeting attendee marches an address."""
    forwarded_to = message.get("X-Forwarded-To").strip() if message.get("X-Forwarded-To") else None
    try:
        addr = str(c).split(':')[1]
    except IndexError:
        addr = c
    try:
        accounts = current_app.config.custom["accounts"]
        for acct in accounts:
            if acct["email"] == addr or forwarded_to == acct["email"]:
                return True
        if forwarded_to == addr:
            return True
    except KeyError:
        pass
    return False


def get_attachments(email_msg, content=False):
    """Returns all attachments for an email message."""
    attachments = []
    for part in email_msg.walk():
        if part.get_content_maintype() == "multipart":
            continue
        if (part.get_content_disposition() in ["attachment", "inline"] or part.get_content_type() == "text/calendar") and not (part.get_content_disposition() == "inline" and part.get_content_type() == "text/plain"):
            ctnt = part.get_content()
            preview = None
            if part.get_content_type() == "text/calendar" or part.get_content_type() == "text/x-vcalendar":
                # create "preview"
                try:
                    if "BEGIN:VCALENDAR" in ctnt and "END:VCALENDAR" not in ctnt:
                        ctnt += "END:VCALENDAR"  # thanks outlook!
                    gcal = icalendar.Calendar.from_ical(ctnt)
                    timezone = None
                    status = None
                    for component in gcal.walk("VEVENT"):
                        if component.get("organizer"):
                            try:
                                people = [component.get("organizer").params["CN"]]
                            except KeyError:
                                people = []
                        else:
                            people = []
                        try:
                            a = component.get("attendee")
                            if isinstance(a, list):
                                for c in a:
                                    people.append(c.params["CN"])
                                    if attendee_matches_addr(c, email_msg):
                                        status = c.params["PARTSTAT"]
                            elif a:
                                people.append(a.params["CN"])
                                if attendee_matches_addr(a, email_msg):
                                    status = a.params["PARTSTAT"]
                        except KeyError:
                            pass

                        try:
                            dtstart = component.get("dtstart").dt.astimezone(tz.tzlocal()).strftime("%c")
                            dtend = component.get("dtend").dt.astimezone(tz.tzlocal()).strftime("%c")

                            # this assumes that start and end are the same timezone
                            timezone = str(component.get("dtstart").dt.tzinfo)
                        except AttributeError:  # only date, no time
                            try:
                                dtstart = component.get("dtstart").dt.strftime("%c")
                                dtend = component.get("dtend").dt.strftime("%c")
                            except AttributeError:  # nothing?
                                pass
                        try:
                            rrule = component.get("rrule").to_ical().decode("utf8")
                            recur = RecurringEvent().format(rrulestr(component.get("rrule").to_ical().decode("utf8")))
                        except AttributeError:
                            rrule = None
                            recur = ""
                        try:
                            method = gcal["method"]
                        except KeyError:
                            method = None
                        preview = {
                            "method": method,
                            "status": status,
                            "summary": component.get("summary"),
                            "location": component.get("location"),
                            "start": dtstart,
                            "dtstart": component.get("dtstart").to_ical().decode("utf8") if component.get("dtstart") else None,
                            "end": dtend,
                            "dtend": component.get("dtend").to_ical().decode("utf8") if component.get("dtend") else None,
                            "attendees": ", ".join(people),
                            "recur": recur,
                            "rrule": rrule
                        }
                except ValueError:
                    pass

                if preview and timezone:
                    preview["tz"] = timezone

            attachments.append({
                "filename": part.get_filename() if part.get_filename() else "unnamed attachment",
                "content_type": part.get_content_type(),
                "content_size": len(bytes(ctnt, "utf8")) if isinstance(ctnt, str) else len(bytes(ctnt)),
                "content": ctnt if content else None,
                "preview": preview
            })

            # "nested" attachments
            if part.get_content_type() == "application/pkcs7-mime":
                # https://stackoverflow.com/questions/58427642/how-to-extract-data-from-application-pkcs7-mime-using-the-email-module-in-pyth
                content_info = cms.ContentInfo.load(part.get_payload(decode=True))
                compressed_data = content_info['content']
                smime = compressed_data['encap_content_info']['content'].native
                tmp = email.message_from_bytes(smime, policy=policy)
                att_tmp = get_attachments(tmp, content)
                attachments += att_tmp
    return attachments


def messages_to_json(messages):
    """Converts a list of `notmuch.message.Message` instances to a JSON object."""
    return [message_to_json(m) for m in messages]


def smime_verify(part, accts):
    """Verify S/MIME signature of signed part, considering CAs in accounts."""
    try:
        trusted_certs = []
        if 'ca-bundle' in current_app.config.custom:
            with open(current_app.config.custom['ca-bundle'], "rb") as f:
                trusted_certs.append(x509.load_pem_x509_certificate(f.read()))
        for acct in accts:
            if 'ca' in acct:
                for ca in acct['ca']:
                    with open(ca, "rb") as f:
                        trusted_certs.append(x509.load_pem_x509_certificate(f.read()))

        signature_data = None
        signed_content = None

        for pt in part.walk():
            content_type = pt.get_content_type()
            if "pkcs7-signature" in content_type:
                signature_data = pt.get_payload(decode=True)
            elif "pkcs7-mime" in content_type:
                pkcs7_data = base64.b64decode(pt.get_payload())
                try:
                    signature_data = pkcs7_data
                    signed_content = cms.ContentInfo.load(pkcs7_data)["content"]["encap_content_info"]["content"].contents
                except Exception as e:
                    raise ValueError(f"Failed to parse PKCS#7 data: {str(e)}") from e
            # take the first part that is not the key -- there may be nested parts under it that we don't want
            elif content_type != 'multipart/signed' and signed_content is None:
                # S/MIME needs CRLF line endings
                signed_content = bytes(pt).replace(b'\r\n', b'\n').replace(b'\n', b'\r\n')

        if signature_data is None or signed_content is None:
            raise ValueError("unable to find signature and signed content")

        message = None

        # parts of this code taken from endesive
        signed_data_content = cms.ContentInfo.load(signature_data)["content"]
        signature = signed_data_content["signer_infos"][0]["signature"].native
        algo = signed_data_content["digest_algorithms"][0]["algorithm"].native
        attrs = signed_data_content["signer_infos"][0]["signed_attrs"]
        md_data = getattr(hashlib, algo)(signed_content).digest()
        if attrs is not None and not isinstance(attrs, core.Void):
            md_signed = None
            for attr in attrs:
                if attr["type"].native == "message_digest":
                    md_signed = attr["values"].native[0]
            signed_data = attrs.dump()
            signed_data = b"\x31" + signed_data[1:]
        else:
            md_signed = md_data
            signed_data = signed_content
        hashok = md_data == md_signed
        if not hashok:
            message = "digests don't match"
        cert = None
        serial = signed_data_content["signer_infos"][0]["sid"].native["serial_number"]
        for tmpcert in signed_data_content["certificates"]:
            if serial == tmpcert.native["tbs_certificate"]["serial_number"]:
                cert = tmpcert.chosen
        x509cert = x509.load_pem_x509_certificate(pem.armor("CERTIFICATE", cert.dump()), default_backend())
        public_key = x509cert.public_key()

        sigalgo = signed_data_content["signer_infos"][0]["signature_algorithm"]
        sigalgoname = sigalgo.signature_algo
        if isinstance(public_key, ec.EllipticCurvePublicKey):
            try:
                public_key.verify(
                    signature,
                    signed_data,
                    ec.ECDSA(getattr(hashes, algo.upper())()),
                )
                signatureok = True
            except Exception as e:
                signatureok = False
                message = str(e)
        elif sigalgoname == "rsassa_pss":
            parameters = sigalgo["parameters"]
            salgo = parameters["hash_algorithm"].native["algorithm"].upper()
            mgf = getattr(padding, parameters["mask_gen_algorithm"].native["algorithm"].upper())(getattr(hashes, salgo)())
            salt_length = parameters["salt_length"].native
            try:
                public_key.verify(
                    signature,
                    signed_data,
                    padding.PSS(mgf, salt_length),
                    getattr(hashes, salgo)(),
                )
                signatureok = True
            except Exception as e:
                signatureok = False
                message = str(e)
        elif sigalgoname == "rsassa_pkcs1v15":
            try:
                public_key.verify(
                    signature,
                    signed_data,
                    padding.PKCS1v15(),
                    getattr(hashes, algo.upper())(),
                )
                signatureok = True
            except Exception as e:
                signatureok = False
                message = str(e)
        else:
            raise ValueError("unknown signature algorithm")

        certok = False
        try:
            store = Store(trusted_certs)
            builder = PolicyBuilder().store(store)
            verifier = builder.build_client_verifier()
            verifier.verify(x509cert, [])
            certok = True
        except Exception as e:
            certok = False
            message = str(e)

        if certok is False and message is None:
            message = f"signed by {x509cert.issuer}"

        if(hashok and signatureok and certok):
            return {"valid": True}
        if(hashok and signatureok):
            return {"valid": None, "message": f"self-signed or unavailable certificate(s): {message}"}
        return {"valid": False, "message": f"invalid signature: {message}"}

    except ValueError as e:
        current_app.logger.error(f"Exception in smime_verify: {str(e)}")
        return {"valid": False, "message": f"An internal error has occurred: {str(e)}"}


def eml_to_json(message_bytes):
    """Converts an eml attachment (represented as bytes) to a JSON object."""
    email_msg = email.message_from_bytes(message_bytes, policy=policy)
    body, html_body = get_nested_body(email_msg)
    res = {
        "from": email_msg["from"].strip().replace('\t', ' ') if "from" in email_msg else "",
        "to": split_email_addresses(email_msg["to"]) if "to" in email_msg else [],
        "cc": split_email_addresses(email_msg["cc"]) if "cc" in email_msg else [],
        "bcc": split_email_addresses(email_msg["bcc"]) if "bcc" in email_msg else [],
        "date": email_msg["date"].strip() if "date" in email_msg else "",
        "subject": email_msg["subject"].strip().replace('\t', ' ') if "subject" in email_msg else "",
        "message_id": email_msg["Message-ID"].strip() if "Message-ID" in email_msg else "",
        "in_reply_to": email_msg["In-Reply-To"].strip() if "In-Reply-To" in email_msg else None,
        "references": email_msg["References"].strip() if "References" in email_msg else None,
        "reply_to": email_msg["Reply-To"].strip() if "Reply-To" in email_msg else None,
        "forwarded_to": email_msg["X-Forwarded-To"].strip() if "X-Forwarded-To" in email_msg else None,
        "delivered_to": email_msg["Delivered-To"].strip() if "Delivered-To" in email_msg else None,
        "body": {
            "text/plain": body,
            "text/html": html_body
        },
        "attachments": [],
        "notmuch_id": None,
        "tags": [],
        "signature": None
    }
    return res


def message_to_json(message):
    """Converts a `notmuch.message.Message` instance to a JSON object."""
    email_msg = email_from_notmuch(message)

    attachments = get_attachments(email_msg)
    body, html_body = get_nested_body(email_msg)

    signature = None
    # signature verification
    # https://gist.github.com/russau/c0123ef934ef88808050462a8638a410
    for part in email_msg.walk():
        if part.get('Content-Type') and "signed" in part.get('Content-Type'):
            if "pkcs7-signature" in part.get('Content-Type') or "pkcs7-mime" in part.get('Content-Type'):
                try:
                    accounts = current_app.config.custom["accounts"]
                    accts = [acct for acct in accounts if acct["email"] in
                             message.get_header("from").strip().replace('\t', ' ')]
                except KeyError:
                    accts = []
                signature = smime_verify(part, accts)
            elif "pgp-signature" in part.get('Content-Type'):
                signed_content = bytes(part.get_payload()[0])
                sig = bytes(part.get_payload()[1])
                gpg = GPG()
                public_keys = gpg.list_keys()
                from_addr = message.get_header("from")
                try:
                    [_, address] = from_addr.split('<')
                    from_addr = address.split('>')[0]
                except ValueError:
                    pass

                found = False
                for pkey in public_keys:
                    for uid in pkey.get('uids'):
                        if from_addr in uid:
                            found = True
                if not found and 'gpg-keyserver' in current_app.config.custom:
                    current_app.logger.info(f"Key for {from_addr} not found, attempting to download...")
                    # TODO: handle case where server is unreachable
                    keys = gpg.search_keys(from_addr, current_app.config.custom['gpg-keyserver'])
                    if len(keys) > 0:
                        for key in keys:
                            current_app.logger.info(f"Getting key {key.get('keyid')}")
                            gpg.recv_keys(current_app.config.custom['gpg-keyserver'], key.get('keyid'))
                osfile, path = mkstemp()
                try:
                    with os.fdopen(osfile, 'wb') as fd:
                        fd.write(sig)
                        fd.close()
                        verified = gpg.verify_data(path, signed_content)
                        if verified.valid:
                            signature = {"valid": True}
                        else:
                            signature = {"valid": False, "message": verified.trust_text}
                except Exception as e:
                    current_app.logger.error(f"Exception in gpg_verify: {str(e)}")
                    signature = {"valid": False, "message": "An internal error has occurred."}
                finally:
                    os.unlink(path)

    res = {
        "from": message.get_header("from").strip().replace('\t', ' '),
        "to": split_email_addresses(message.get_header("to")),
        "cc": split_email_addresses(message.get_header("cc")),
        "bcc": split_email_addresses(message.get_header("bcc")),
        "date": message.get_header("date").strip(),
        "subject": message.get_header("subject").strip().replace('\t', ' '),
        "message_id": message.get_header("Message-ID").strip(),
        "in_reply_to": message.get_header("In-Reply-To").strip() if message.get_header("In-Reply-To") else None,
        "references": message.get_header("References").strip() if message.get_header("References") else None,
        "reply_to": message.get_header("Reply-To").strip() if message.get_header("Reply-To") else None,
        "forwarded_to": message.get_header("X-Forwarded-To").strip() if message.get_header("X-Forwarded-To") else None,
        "delivered_to": message.get_header("Delivered-To").strip() if message.get_header("Delivered-To") else None,
        "body": {
            "text/plain": body,
            "text/html": html_body
        },
        "attachments": attachments,
        "notmuch_id": message.get_message_id(),
        "tags": list(message.get_tags()),
        "signature": signature
    }
    if f"<{res['message_id']}>" == res['in_reply_to']:
        # this should never happen, but apparently does
        res['in_reply_to'] = None
    return res


def message_attachment(message, num=-1):
    """Returns attachment no. `num` of a `notmuch.message.Message` instance."""
    email_msg = email_from_notmuch(message)
    attachments = get_attachments(email_msg, True)
    if num == -1:
        return attachments
    if not attachments or num > len(attachments) - 1:
        return None
    return attachments[num]


def email_from_notmuch(message):
    """Returns the email message corresponding to a `notmuch.message.Message` instance."""
    with open(message.get_filename(), "rb") as f:
        email_msg = email.message_from_binary_file(f, policy=policy)
        return email_msg
