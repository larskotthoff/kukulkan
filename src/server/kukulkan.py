"""Flask web app providing a REST API to notmuch. Based on API from netviel (https://github.com/DavidMStraub/netviel)."""

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
from flask import Flask, current_app, g, send_file, send_from_directory
from werkzeug.utils import safe_join
from flask_restful import Api, Resource

import M2Crypto
from M2Crypto import SMIME, BIO, X509
import dkim

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


def create_app():
    """Flask application factory."""
    app = Flask(__name__, static_folder = "client")
    app.config["PROPAGATE_EXCEPTIONS"] = True

    configPath = os.getenv("XDG_CONFIG_HOME") if os.getenv("XDG_CONFIG_HOME") else os.getenv("HOME") + os.path.sep + ".config"
    with open(configPath + os.path.sep + "kukulkan" + os.path.sep + "config", "r") as f:
        app.config.custom = json.load(f)

    app.logger.setLevel(logging.INFO)

    api = Api(app)

    @app.route("/")
    def send_index():
        return send_from_directory(app.static_folder, "index.html")

    @app.route("/<path:path>")
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
        #response.headers["Cross-Origin-Resource-Policy"] = "same-origin"
        #response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        #response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["X-Content-Type-Options"] = "nosniff"

        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Cross-Origin-Opener-Policy"] = "cross-origin"
        response.headers["Cross-Origin-Resource-Policy"] = "cross-origin"
        response.headers["X-Frame-Options"] = "CORSSORIGIN"
        return response

    class Query(Resource):
        def get(self, query_string):
            threads = get_query(query_string).search_threads()
            return threads_to_json(threads, number = None)

    class Address(Resource):
        def get(self, query_string):
            messages = get_query(query_string).search_messages()
            addresses = [ msg.get_header("to") for msg in messages ]
            return list(set([ addr for addr in addresses if addr ]))

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

    # all requests that return lists must be defined this way
    api.add_resource(Query, "/api/query/<path:query_string>")
    api.add_resource(Address, "/api/address/<path:query_string>")
    api.add_resource(Thread, "/api/thread/<path:thread_id>")
    api.add_resource(Tags, "/api/tags/")

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
            f = io.BytesIO(d["content"])
        return send_file(f, mimetype = d["content_type"], as_attachment = True,
            attachment_filename = d["filename"])

    @app.route("/api/message/<path:message_id>")
    def download_message(message_id):
        msgs = get_query("mid:{}".format(message_id), exclude = False).search_messages()
        msg = next(msgs)  # there can be only 1
        return message_to_json(msg)

    @app.route("/api/raw_message/<path:message_id>")
    def download_raw_message(message_id):
        msgs = get_query("mid:{}".format(message_id), exclude = False).search_messages()
        msg = next(msgs)  # there can be only 1
        return send_file(msg.get_filename(), mimetype = "message/rfc822",
            as_attachment = True, attachment_filename = message_id+".eml")

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


def get_nested_body(email_msg, html_only = False):
    """Gets all, potentially MIME-nested bodies."""
    content_plain = ""
    for part in email_msg.walk():
        if part.get_content_type() == "text/plain":
            tmp = part.get_content()
            try:
                repl = current_app.config.custom["filter"]["content"]["text/plain"]
                tmp = re.sub(repl[0], repl[1], tmp)
            except Exception as e:
                print(e)
            content_plain += tmp

    content_html = ""
    for part in email_msg.walk():
        if part.get_content_type() == "text/html":
            tmp = part.get_content()
            try:
                repl = current_app.config.custom["filter"]["content"]["text/html"]
                tmp = re.sub(repl[0], repl[1], tmp)
            except Exception as e:
                print(e)
                None
            content_html += tmp

    if html_only:
        if content_html:
            # remove any conflicting document encodings
            html = lxml.html.fromstring(re.sub("\<\?xml[^>]+>", "", content_html))
            for tag in html.xpath('//img'):
                if 'src' in tag.attrib:
                    tag.attrib.pop('src')
            for tag in html.xpath('//link'):
                if 'src' in tag.attrib:
                    tag.attrib.pop('src')
            content = lxml.html.tostring(cleaner.clean_html(html), encoding = str)
        else:
            content = ""
    else:
        # always clean up "plain" text -- sometimes it's HTML...
        soup = BeautifulSoup(content_plain if content_plain else content_html, features = 'html.parser')
        content = ''.join(soup.get_text("\n\n", strip = True))
        content = bleach.linkify(content)

    return content

def get_attachments(email_msg, content = False):
    """Returns all attachments for an email message."""
    attachments = []
    for part in email_msg.walk():
        if part.get_content_maintype() == "multipart":
            continue
        if part.get_content_disposition() in ["attachment", "inline"] or part.get_content_type() == "text/calendar":
            attachments.append({
                "filename": part.get_filename() if part.get_filename() else "unnamed attachment",
                "content_type": part.get_content_type(),
                "content": part.get_content() if content else None
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
    body = get_nested_body(email_msg)
    html_body = get_nested_body(email_msg, True)

    # signature verification
    # https://gist.github.com/russau/c0123ef934ef88808050462a8638a410
    try:
        # detached signature
        attachments.index({ "filename": "smime.p7s", "content_type": "application/pkcs7-signature", "content": None })
        p7, data_bio = SMIME.smime_load_pkcs7_bio(BIO.MemoryBuffer(bytes(email_msg)))

        s = SMIME.SMIME()
        s.set_x509_store(X509.X509_Store())

        certStack = p7.get0_signers(X509.X509_Stack())
        s.set_x509_stack(certStack)
        try:
            s.verify(p7, data_bio, flags = M2Crypto.SMIME.PKCS7_DETACHED)
            signature = { "valid": True }
        except M2Crypto.SMIME.PKCS7_Error as e:
            if str(e) == "certificate verify error (Verify error:self signed certificate)":
                try:
                    s.verify(p7, data_bio, flags = M2Crypto.SMIME.PKCS7_NOVERIFY | M2Crypto.SMIME.PKCS7_DETACHED)
                    signature = { "valid": True, "message": "self-signed certificate" }
                except M2Crypto.SMIME.PKCS7_Error as e:
                    signature = { "valid": False, "message": str(e) }
            else:
                signature = { "valid": False, "message": str(e) }
    except ValueError:
        signature = None

    return {
        "from": message.get_header("from").strip(),
        "to": message.get_header("to").strip(),
        "cc": message.get_header("cc").strip(),
        "bcc": message.get_header("bcc").strip(),
        "date": message.get_header("date").strip(),
        "subject": message.get_header("subject").strip(),
        "message_id": message.get_header("Message-ID").strip(),
        "in_reply_to": message.get_header("In-Reply-To").strip() if message.get_header("In-Reply-To") else None,
        "body": {
            "text/plain": body,
            "text/html": html_body
        },
        "attachments": attachments,
        "notmuch_id": message.get_message_id(),
        "tags": [ tag for tag in message.get_tags() ],
        "signature": signature,
        "dkim": dkim.verify(bytes(email_msg))
    }


def message_attachment(message, num):
    """Returns attachment no. `num` of a `notmuch.message.Message` instance."""
    with open(message.get_filename(), "rb") as f:
        email_msg = email.message_from_binary_file(f, policy = email.policy.default)
    attachments = get_attachments(email_msg, True)
    if not attachments:
        return {}
    return attachments[num]
