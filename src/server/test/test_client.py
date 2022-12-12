import pytest
import json
from unittest.mock import MagicMock, mock_open, patch

import src.kukulkan as k

@pytest.fixture
def setup():
    flask_app = k.create_app()
    db = lambda: None
    db.close = MagicMock()
    with flask_app.app_context() as c:
        c.g.db = db

        yield flask_app, db

    db.close.assert_called_once()

def test_accounts(setup):
    app, db = setup

    app.config.custom["accounts"] = "foo"
    with app.test_client() as test_client:
        response = test_client.get('/api/accounts/')
        assert response.status_code == 200
        assert b'"foo"\n' == response.data

def test_tags(setup):
    app, db = setup

    db.get_all_tags = MagicMock(return_value = ['foo', 'bar', '(null)'])
    with app.test_client() as test_client:
        response = test_client.get('/api/tags/')
        assert response.status_code == 200
        assert b'["foo", "bar"]\n' == response.data

    db.get_all_tags.assert_called_once()

def test_raw_message(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value = "foo")

    mq = lambda: None
    mq.search_messages = MagicMock(return_value = iter([mf]))

    with patch("notmuch.Query", return_value = mq) as q:
        with patch("builtins.open", mock_open(read_data = "This is a test.")):
            with app.test_client() as test_client:
                response = test_client.get('/api/raw_message/foo')
                assert response.status_code == 200
                assert b'This is a test.' == response.data
        q.assert_called_once_with(db, "id:foo")

    mf.get_filename.assert_called_once()
    mq.search_messages.assert_called_once()

def test_tag_add_message(setup):
    app, db = setup

    dbw = lambda: None
    dbw.close = MagicMock()
    dbw.begin_atomic = MagicMock()
    dbw.end_atomic = MagicMock()

    mf = lambda: None
    mf.add_tag = MagicMock()
    mf.tags_to_maildir_flags = MagicMock()

    mq = lambda: None
    mq.search_messages = MagicMock(return_value = iter([mf]))

    with patch("notmuch.Database", return_value = dbw):
        with patch("notmuch.Query", return_value = mq) as q:
            with app.test_client() as test_client:
                response = test_client.get('/api/tag/add/message/foo/bar')
                assert response.status_code == 200
                assert b'bar' == response.data
            q.assert_called_once_with(dbw, "id:foo")

    mf.add_tag.assert_called_once()
    mf.tags_to_maildir_flags.assert_called_once()

    mq.search_messages.assert_called_once()

    dbw.begin_atomic.assert_called_once()
    dbw.end_atomic.assert_called_once()
    dbw.close.assert_called_once()

def test_tag_add_thread(setup):
    app, db = setup

    dbw = lambda: None
    dbw.close = MagicMock()
    dbw.begin_atomic = MagicMock()
    dbw.end_atomic = MagicMock()

    mf = lambda: None
    mf.add_tag = MagicMock()
    mf.tags_to_maildir_flags = MagicMock()

    mq = lambda: None
    mq.search_messages = MagicMock(return_value = iter([mf]))

    with patch("notmuch.Database", return_value = dbw):
        with patch("notmuch.Query", return_value = mq) as q:
            with app.test_client() as test_client:
                response = test_client.get('/api/tag/add/thread/foo/bar')
                assert response.status_code == 200
                assert b'bar' == response.data
            q.assert_called_once_with(dbw, "thread:foo")

    mf.add_tag.assert_called_once()
    mf.tags_to_maildir_flags.assert_called_once()

    mq.search_messages.assert_called_once()

    dbw.begin_atomic.assert_called_once()
    dbw.end_atomic.assert_called_once()
    dbw.close.assert_called_once()

def test_tag_remove_message(setup):
    app, db = setup

    dbw = lambda: None
    dbw.close = MagicMock()
    dbw.begin_atomic = MagicMock()
    dbw.end_atomic = MagicMock()

    mf = lambda: None
    mf.remove_tag = MagicMock()
    mf.tags_to_maildir_flags = MagicMock()

    mq = lambda: None
    mq.search_messages = MagicMock(return_value = iter([mf]))

    with patch("notmuch.Database", return_value = dbw):
        with patch("notmuch.Query", return_value = mq) as q:
            with app.test_client() as test_client:
                response = test_client.get('/api/tag/remove/message/foo/bar')
                assert response.status_code == 200
                assert b'bar' == response.data
            q.assert_called_once_with(dbw, "id:foo")

    mf.remove_tag.assert_called_once()
    mf.tags_to_maildir_flags.assert_called_once()

    mq.search_messages.assert_called_once()

    dbw.begin_atomic.assert_called_once()
    dbw.end_atomic.assert_called_once()
    dbw.close.assert_called_once()

def test_tag_remove_thread(setup):
    app, db = setup

    dbw = lambda: None
    dbw.close = MagicMock()
    dbw.begin_atomic = MagicMock()
    dbw.end_atomic = MagicMock()

    mf = lambda: None
    mf.remove_tag = MagicMock()
    mf.tags_to_maildir_flags = MagicMock()

    mq = lambda: None
    mq.search_messages = MagicMock(return_value = iter([mf]))

    with patch("notmuch.Database", return_value = dbw):
        with patch("notmuch.Query", return_value = mq) as q:
            with app.test_client() as test_client:
                response = test_client.get('/api/tag/remove/thread/foo/bar')
                assert response.status_code == 200
                assert b'bar' == response.data
            q.assert_called_once_with(dbw, "thread:foo")

    mf.remove_tag.assert_called_once()
    mf.tags_to_maildir_flags.assert_called_once()

    mq.search_messages.assert_called_once()

    dbw.begin_atomic.assert_called_once()
    dbw.end_atomic.assert_called_once()
    dbw.close.assert_called_once()

def test_attachment_no_attachment(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value = "test/mails/simple.eml")

    mq = lambda: None
    mq.search_messages = MagicMock(return_value = iter([mf]))

    with patch("notmuch.Query", return_value = mq) as q:
        with app.test_client() as test_client:
            response = test_client.get('/api/attachment/foo/0')
            assert response.status_code == 404
        q.assert_called_once_with(db, "id:foo")

    mf.get_filename.assert_called_once()
    mq.search_messages.assert_called_once()

def test_attachment_invalid_index(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value = "test/mails/attachment.eml")

    mq = lambda: None
    mq.search_messages = MagicMock(return_value = iter([mf]))

    with patch("notmuch.Query", return_value = mq) as q:
        with app.test_client() as test_client:
            response = test_client.get('/api/attachment/foo/1')
            assert response.status_code == 404
        q.assert_called_once_with(db, "id:foo")

    mf.get_filename.assert_called_once()
    mq.search_messages.assert_called_once()

def test_attachment_single(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value = "test/mails/attachment.eml")

    mq = lambda: None
    mq.search_messages = MagicMock(return_value = iter([mf]))

    with patch("notmuch.Query", return_value = mq) as q:
        with app.test_client() as test_client:
            response = test_client.get('/api/attachment/foo/0')
            assert response.status_code == 200
            assert 5368 == len(response.data)
            assert type(response.data) is bytes
            assert "application/x-gtar-compressed" == response.mimetype
            assert "inline; filename=zendesk-email-loop2.tgz" == response.headers['Content-Disposition']
        q.assert_called_once_with(db, "id:foo")

    mf.get_filename.assert_called_once()
    mq.search_messages.assert_called_once()

def test_attachment_multiple(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value = "test/mails/attachments.eml")

    mq = lambda: None
    mq.search_messages = MagicMock()
    mq.search_messages.side_effect = [iter([mf]), iter([mf]), iter([mf])]

    with patch("notmuch.Query", return_value = mq) as q:
        with app.test_client() as test_client:
            response = test_client.get('/api/attachment/foo/0')
            assert response.status_code == 200
            assert 445 == len(response.data)
            assert type(response.data) is bytes
            assert "text/plain" == response.mimetype
            assert "inline; filename=text.txt" == response.headers['Content-Disposition']

            response = test_client.get('/api/attachment/foo/1')
            assert response.status_code == 200
            assert 7392 == len(response.data)
            assert type(response.data) is bytes
            assert "application/pdf" == response.mimetype
            assert "inline; filename=document.pdf" == response.headers['Content-Disposition']

            response = test_client.get('/api/attachment/foo/2')
            assert response.status_code == 200
            assert 2391 == len(response.data)
            assert type(response.data) is bytes
            assert "text/plain" == response.mimetype
            assert "inline; filename=test.csv" == response.headers['Content-Disposition']
        assert q.call_count == 3
        q.assert_called_with(db, "id:foo")

    assert mf.get_filename.call_count == 3
    assert mq.search_messages.call_count == 3

def test_message_simple(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value = "test/mails/simple.eml")
    mf.get_header = MagicMock(return_value = "  foo\tbar  ")
    mf.get_message_id = MagicMock(return_value = "foo")
    mf.get_tags = MagicMock(return_value = ["foo", "bar"])

    mq = lambda: None
    mq.search_messages = MagicMock(return_value = iter([mf]))

    with patch("notmuch.Query", return_value = mq) as q:
        with app.test_client() as test_client:
            response = test_client.get('/api/message/foo')
            assert response.status_code == 200
            msg = json.loads(response.data.decode())
            assert msg["from"] == "foo bar"
            assert msg["to"] == "foo bar"
            assert msg["cc"] == "foo bar"
            assert msg["bcc"] == "foo bar"
            assert msg["date"] == "foo\tbar"
            assert msg["subject"] == "foo\tbar"
            assert msg["message_id"] == "foo\tbar"
            assert msg["in_reply_to"] == "foo\tbar"
            assert msg["references"] == "foo\tbar"
            assert msg["reply_to"] == "foo\tbar"

            assert "With the new notmuch_message_get_flags() function" in msg["body"]["text/plain"]
            assert msg["body"]["text/html"] == ''

            assert msg["notmuch_id"] == "foo"
            assert msg["tags"] == ["foo", "bar"]
            assert msg["attachments"] == []
            assert msg["signature"] == None
        q.assert_called_once_with(db, "id:foo")

    mf.get_filename.assert_called_once()
    mf.get_message_id.assert_called_once()
    mf.get_tags.assert_called_once()
    assert mf.get_header.call_count == 13

    mq.search_messages.assert_called_once()

def test_message_attachments(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value = "test/mails/attachments.eml")
    mf.get_header = MagicMock(return_value = "  foo\tbar  ")
    mf.get_message_id = MagicMock(return_value = "foo")
    mf.get_tags = MagicMock(return_value = ["foo", "bar"])

    mq = lambda: None
    mq.search_messages = MagicMock(return_value = iter([mf]))

    with patch("notmuch.Query", return_value = mq) as q:
        with app.test_client() as test_client:
            response = test_client.get('/api/message/foo')
            assert response.status_code == 200
            msg = json.loads(response.data.decode())
            assert msg["attachments"] == [{'content': None, 'content_size': 445, 'content_type': 'text/plain', 'filename': 'text.txt', 'preview': None},
                 {'content': None, 'content_size': 7392, 'content_type': 'application/pdf', 'filename': 'document.pdf', 'preview': None},
                 {'content': None, 'content_size': 2391, 'content_type': 'text/plain', 'filename': 'test.csv', 'preview': None}]
        q.assert_called_once_with(db, "id:foo")

    mf.get_filename.assert_called_once()
    mf.get_message_id.assert_called_once()
    mf.get_tags.assert_called_once()
    assert mf.get_header.call_count == 13

    mq.search_messages.assert_called_once()

def test_message_attachment_calendar_preview(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value = "test/mails/calendar.eml")
    mf.get_header = MagicMock(return_value = "  foo\tbar  ")
    mf.get_message_id = MagicMock(return_value = "foo")
    mf.get_tags = MagicMock(return_value = ["foo", "bar"])

    mq = lambda: None
    mq.search_messages = MagicMock(return_value = iter([mf]))

    with patch("notmuch.Query", return_value = mq) as q:
        with app.test_client() as test_client:
            response = test_client.get('/api/message/foo')
            assert response.status_code == 200
            msg = json.loads(response.data.decode())
            assert msg["attachments"][0]['content_type'] == 'text/calendar'
            assert msg["attachments"][0]['filename'] == 'unnamed attachment'
            assert msg["attachments"][0]['preview']['summary'] == "testevent"
            assert msg["attachments"][0]['preview']['location'] == "kskdcsd"
            # this will break if you're not in Mountain Time
            assert msg["attachments"][0]['preview']['start'] == "Tue Nov  1 02:00:00 2011"
            assert msg["attachments"][0]['preview']['end'] == "Tue Nov  1 03:00:00 2011"
            assert msg["attachments"][0]['preview']['attendees'] == "unittest, TRUE"
        q.assert_called_once_with(db, "id:foo")

    mf.get_filename.assert_called_once()
    mf.get_message_id.assert_called_once()
    mf.get_tags.assert_called_once()
    assert mf.get_header.call_count == 13

    mq.search_messages.assert_called_once()

def test_message_signed(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value = "test/mails/signed.eml")
    mf.get_header = MagicMock(return_value = "  foo\tbar  ")
    mf.get_message_id = MagicMock(return_value = "foo")
    mf.get_tags = MagicMock(return_value = ["foo", "bar"])

    mq = lambda: None
    mq.search_messages = MagicMock(return_value = iter([mf]))

    app.config.custom["accounts"] = []

    with patch("notmuch.Query", return_value = mq) as q:
        with app.test_client() as test_client:
            response = test_client.get('/api/message/foo')
            assert response.status_code == 200
            msg = json.loads(response.data.decode())
            assert "Bob, we need to cancel this contract." in msg["body"]["text/plain"]

            assert msg["signature"] == {'message': 'self-signed or unavailable certificate(s)', 'valid': True}
        q.assert_called_once_with(db, "id:foo")

    mf.get_filename.assert_called_once()
    mf.get_message_id.assert_called_once()
    mf.get_tags.assert_called_once()
    assert mf.get_header.call_count == 13

    mq.search_messages.assert_called_once()

def test_message_signed_invalid(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value = "test/mails/signed-invalid.eml")
    mf.get_header = MagicMock(return_value = "  foo\tbar  ")
    mf.get_message_id = MagicMock(return_value = "foo")
    mf.get_tags = MagicMock(return_value = ["foo", "bar"])

    mq = lambda: None
    mq.search_messages = MagicMock(return_value = iter([mf]))

    app.config.custom["accounts"] = []

    with patch("notmuch.Query", return_value = mq) as q:
        with app.test_client() as test_client:
            response = test_client.get('/api/message/foo')
            assert response.status_code == 200
            msg = json.loads(response.data.decode())
            assert "Bob, we need to cancel this contract." in msg["body"]["text/plain"]
            assert msg["signature"] == {'message': 'bad signature', 'valid': False}
        q.assert_called_once_with(db, "id:foo")

    mf.get_filename.assert_called_once()
    mf.get_message_id.assert_called_once()
    mf.get_tags.assert_called_once()
    assert mf.get_header.call_count == 13

    mq.search_messages.assert_called_once()

def test_message_html_only(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value = "test/mails/html-only.eml")
    mf.get_header = MagicMock(return_value = "  foo\tbar  ")
    mf.get_message_id = MagicMock(return_value = "foo")
    mf.get_tags = MagicMock(return_value = ["foo", "bar"])

    mq = lambda: None
    mq.search_messages = MagicMock(return_value = iter([mf]))

    with patch("notmuch.Query", return_value = mq) as q:
        with app.test_client() as test_client:
            response = test_client.get('/api/message/foo')
            assert response.status_code == 200
            msg = json.loads(response.data.decode())
            assert "hunter2" == msg["body"]["text/plain"]
            assert "hunter2" in msg["body"]["text/html"]
        q.assert_called_once_with(db, "id:foo")

    mf.get_filename.assert_called_once()
    mf.get_message_id.assert_called_once()
    mf.get_tags.assert_called_once()
    assert mf.get_header.call_count == 13

    mq.search_messages.assert_called_once()

def test_message_html_broken(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value = "test/mails/broken-text.eml")
    mf.get_header = MagicMock(return_value = "  foo\tbar  ")
    mf.get_message_id = MagicMock(return_value = "foo")
    mf.get_tags = MagicMock(return_value = ["foo", "bar"])

    mq = lambda: None
    mq.search_messages = MagicMock(return_value = iter([mf]))

    with patch("notmuch.Query", return_value = mq) as q:
        with app.test_client() as test_client:
            response = test_client.get('/api/message/foo')
            assert response.status_code == 200
            msg = json.loads(response.data.decode())
            assert "hunter2" == msg["body"]["text/plain"]
            assert '' == msg["body"]["text/html"]
        q.assert_called_once_with(db, "id:foo")

    mf.get_filename.assert_called_once()
    mf.get_message_id.assert_called_once()
    mf.get_tags.assert_called_once()
    assert mf.get_header.call_count == 13

    mq.search_messages.assert_called_once()

def test_message_link_scrubbing(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value = "test/mails/clean-html.eml")
    mf.get_header = MagicMock(return_value = "  foo\tbar  ")
    mf.get_message_id = MagicMock(return_value = "foo")
    mf.get_tags = MagicMock(return_value = ["foo", "bar"])

    mq = lambda: None
    mq.search_messages = MagicMock(return_value = iter([mf]))

    with patch("notmuch.Query", return_value = mq) as q:
        with app.test_client() as test_client:
            response = test_client.get('/api/message/foo')
            assert response.status_code == 200
            msg = json.loads(response.data.decode())
            assert "foo" == msg["body"]["text/plain"]
            assert "https://example.com" in msg["body"]["text/html"]
            assert "https://tracking.com" not in msg["body"]["text/html"]
        q.assert_called_once_with(db, "id:foo")

    mf.get_filename.assert_called_once()
    mf.get_message_id.assert_called_once()
    mf.get_tags.assert_called_once()
    assert mf.get_header.call_count == 13

    mq.search_messages.assert_called_once()

def test_message_filter_html(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value = "test/mails/html-only.eml")
    mf.get_header = MagicMock(return_value = "  foo\tbar  ")
    mf.get_message_id = MagicMock(return_value = "foo")
    mf.get_tags = MagicMock(return_value = ["foo", "bar"])

    mq = lambda: None
    mq.search_messages = MagicMock(return_value = iter([mf]))

    app.config.custom["accounts"] = []
    app.config.custom["filter"]["content"]["text/html"] = [ '<input value="a>swordfish">', "meat" ]

    with patch("notmuch.Query", return_value = mq) as q:
        with app.test_client() as test_client:
            response = test_client.get('/api/message/foo')
            assert response.status_code == 200
            msg = json.loads(response.data.decode())
            assert "meat\n\nhunter2" == msg["body"]["text/plain"]
            assert "meat" in msg["body"]["text/html"]
            assert "swordfish" not in msg["body"]["text/html"]
        q.assert_called_once_with(db, "id:foo")

    mf.get_filename.assert_called_once()
    mf.get_message_id.assert_called_once()
    mf.get_tags.assert_called_once()
    assert mf.get_header.call_count == 13

    mq.search_messages.assert_called_once()

def test_message_filter_text(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value = "test/mails/simple.eml")
    mf.get_header = MagicMock(return_value = "  foo\tbar  ")
    mf.get_message_id = MagicMock(return_value = "foo")
    mf.get_tags = MagicMock(return_value = ["foo", "bar"])

    mq = lambda: None
    mq.search_messages = MagicMock(return_value = iter([mf]))

    app.config.custom["filter"]["content"]["text/plain"] = [ "notmuch_message_get_flags", "somefunc" ]

    with patch("notmuch.Query", return_value = mq) as q:
        with app.test_client() as test_client:
            response = test_client.get('/api/message/foo')
            assert response.status_code == 200
            msg = json.loads(response.data.decode())
            assert "somefunc" in msg["body"]["text/plain"]
            assert "notmuch_message_get_flags" not in msg["body"]["text/plain"]
        q.assert_called_once_with(db, "id:foo")

    mf.get_filename.assert_called_once()
    mf.get_message_id.assert_called_once()
    mf.get_tags.assert_called_once()
    assert mf.get_header.call_count == 13

    mq.search_messages.assert_called_once()

