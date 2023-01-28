import pytest
import json
import io
from M2Crypto import SMIME
from unittest.mock import MagicMock, mock_open, patch, call

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

    db.get_all_tags = MagicMock(return_value=['foo', 'bar', '(null)'])
    with app.test_client() as test_client:
        response = test_client.get('/api/tags/')
        assert response.status_code == 200
        assert b'["foo", "bar"]\n' == response.data

    db.get_all_tags.assert_called_once()


def test_query(setup):
    app, db = setup

    mm1 = lambda: None
    mm1.get_date = MagicMock(return_value="foodate")
    mm1.get_tags = MagicMock(return_value=["footag"])
    mm2 = lambda: None
    mm2.get_date = MagicMock(return_value="bardate")
    mm2.get_tags = MagicMock(return_value=["bartag"])
    mm3 = lambda: None
    mm3.get_date = MagicMock(return_value="foobardate")
    mm3.get_tags = MagicMock(return_value=["foobartag"])

    mt = lambda: None
    mt.get_messages = MagicMock(return_value=iter([mm1, mm2, mm3]))
    mt.get_authors = MagicMock(return_value="foo bar")
    mt.get_matched_messages = MagicMock(return_value=23)
    mt.get_subject = MagicMock(return_value="foosub")
    mt.get_thread_id = MagicMock(return_value="id")
    mt.get_total_messages = MagicMock(return_value=50)

    mq = lambda: None
    mq.search_threads = MagicMock(return_value=iter([mt]))

    db.get_config = MagicMock(return_value="")

    with patch("notmuch.Query", return_value=mq) as q:
        with app.test_client() as test_client:
            response = test_client.get('/api/query/foo')
            assert response.status_code == 200
            thrds = json.loads(response.data.decode())
            assert len(thrds) == 1
            assert thrds[0]["authors"] == "foo bar"
            assert thrds[0]["matched_messages"] == 23
            assert thrds[0]["newest_date"] == "foobardate"
            assert thrds[0]["oldest_date"] == "foodate"
            assert thrds[0]["subject"] == "foosub"
            assert thrds[0]["tags"] == ["bartag", "foobartag", "footag"]
            assert thrds[0]["thread_id"] == "id"
            assert thrds[0]["total_messages"] == 50

        q.assert_called_once_with(db, "foo")

    mm1.get_date.assert_called_once()
    mm1.get_tags.assert_called_once()
    assert mm2.get_date.call_count == 0
    mm2.get_tags.assert_called_once()
    mm3.get_date.assert_called_once()
    mm3.get_tags.assert_called_once()

    mt.get_messages.assert_called_once()
    assert mt.get_authors.call_count == 2
    mt.get_matched_messages.assert_called_once()
    mt.get_subject.assert_called_once()
    mt.get_thread_id.assert_called_once()
    mt.get_total_messages.assert_called_once()

    mq.search_threads.assert_called_once()
    db.get_config.assert_called_once_with("search.exclude_tags")


def test_query_none(setup):
    app, db = setup

    mq = lambda: None
    mq.search_threads = MagicMock(return_value=iter([]))

    db.get_config = MagicMock(return_value="")

    with patch("notmuch.Query", return_value=mq) as q:
        with app.test_client() as test_client:
            response = test_client.get('/api/query/foo')
            assert response.status_code == 200
            assert b'[]\n' == response.data
        q.assert_called_once_with(db, "foo")

    mq.search_threads.assert_called_once()
    db.get_config.assert_called_once_with("search.exclude_tags")


def test_query_exclude_tags(setup):
    app, db = setup

    mq = lambda: None
    mq.search_threads = MagicMock(return_value=iter([]))
    mq.exclude_tag = MagicMock()

    db.get_config = MagicMock(return_value="foo;bar")

    with patch("notmuch.Query", return_value=mq) as q:
        with app.test_client() as test_client:
            response = test_client.get('/api/query/foo')
            assert response.status_code == 200
            assert b'[]\n' == response.data
        q.assert_called_once_with(db, "foo")

    mq.exclude_tag.assert_has_calls([call("foo"), call("bar")])
    mq.search_threads.assert_called_once()
    db.get_config.assert_called_once_with("search.exclude_tags")


def test_get_message_none(setup):
    app, db = setup

    mq = lambda: None
    mq.search_messages = MagicMock(return_value=iter([]))

    with patch("notmuch.Query", return_value=mq) as q:
        with app.test_client() as test_client:
            response = test_client.get('/api/message/foo')
            assert response.status_code == 404
        q.assert_called_once_with(db, "id:foo")

    mq.search_messages.assert_called_once()


def test_get_message_multiple(setup):
    app, db = setup

    mq = lambda: None
    mq.search_messages = MagicMock(return_value=iter([1, 2]))

    with patch("notmuch.Query", return_value=mq) as q:
        with app.test_client() as test_client:
            response = test_client.get('/api/message/foo')
            assert response.status_code == 500
        q.assert_called_once_with(db, "id:foo")

    mq.search_messages.assert_called_once()


def test_raw_message(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value="foo")

    mq = lambda: None
    mq.search_messages = MagicMock(return_value=iter([mf]))

    with patch("notmuch.Query", return_value=mq) as q:
        with patch("builtins.open", mock_open(read_data="This is a test.")):
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
    mq.search_messages = MagicMock(return_value=iter([mf]))

    with patch("notmuch.Database", return_value=dbw):
        with patch("notmuch.Query", return_value=mq) as q:
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
    mq.search_messages = MagicMock(return_value=iter([mf]))

    with patch("notmuch.Database", return_value=dbw):
        with patch("notmuch.Query", return_value=mq) as q:
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
    mq.search_messages = MagicMock(return_value=iter([mf]))

    with patch("notmuch.Database", return_value=dbw):
        with patch("notmuch.Query", return_value=mq) as q:
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
    mq.search_messages = MagicMock(return_value=iter([mf]))

    with patch("notmuch.Database", return_value=dbw):
        with patch("notmuch.Query", return_value=mq) as q:
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
    mf.get_filename = MagicMock(return_value="test/mails/simple.eml")

    mq = lambda: None
    mq.search_messages = MagicMock(return_value=iter([mf]))

    with patch("notmuch.Query", return_value=mq) as q:
        with app.test_client() as test_client:
            response = test_client.get('/api/attachment/foo/0')
            assert response.status_code == 404
        q.assert_called_once_with(db, "id:foo")

    mf.get_filename.assert_called_once()
    mq.search_messages.assert_called_once()


def test_attachment_invalid_index(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value="test/mails/attachment.eml")

    mq = lambda: None
    mq.search_messages = MagicMock(return_value=iter([mf]))

    with patch("notmuch.Query", return_value=mq) as q:
        with app.test_client() as test_client:
            response = test_client.get('/api/attachment/foo/1')
            assert response.status_code == 404
        q.assert_called_once_with(db, "id:foo")

    mf.get_filename.assert_called_once()
    mq.search_messages.assert_called_once()


def test_attachment_single(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value="test/mails/attachment.eml")

    mq = lambda: None
    mq.search_messages = MagicMock(return_value=iter([mf]))

    with patch("notmuch.Query", return_value=mq) as q:
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
    mf.get_filename = MagicMock(return_value="test/mails/attachments.eml")

    mq = lambda: None
    mq.search_messages = MagicMock()
    mq.search_messages.side_effect = [iter([mf]), iter([mf]), iter([mf])]

    with patch("notmuch.Query", return_value=mq) as q:
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
    mf.get_filename = MagicMock(return_value="test/mails/simple.eml")
    mf.get_header = MagicMock(return_value="  foo\tbar  ")
    mf.get_message_id = MagicMock(return_value="foo")
    mf.get_tags = MagicMock(return_value=["foo", "bar"])

    mq = lambda: None
    mq.search_messages = MagicMock(return_value=iter([mf]))

    with patch("notmuch.Query", return_value=mq) as q:
        with app.test_client() as test_client:
            response = test_client.get('/api/message/foo')
            assert response.status_code == 200
            msg = json.loads(response.data.decode())
            assert msg["from"] == "foo bar"
            assert msg["to"] == "foo bar"
            assert msg["cc"] == "foo bar"
            assert msg["bcc"] == "foo bar"
            assert msg["date"] == "foo\tbar"
            assert msg["subject"] == "foo bar"
            assert msg["message_id"] == "foo\tbar"
            assert msg["in_reply_to"] == "foo\tbar"
            assert msg["references"] == "foo\tbar"
            assert msg["reply_to"] == "foo\tbar"
            assert msg["delivered_to"] == "foo\tbar"

            assert "With the new notmuch_message_get_flags() function" in msg["body"]["text/plain"]
            assert msg["body"]["text/html"] == ''

            assert msg["notmuch_id"] == "foo"
            assert msg["tags"] == ["foo", "bar"]
            assert msg["attachments"] == []
            assert msg["signature"] is None
        q.assert_called_once_with(db, "id:foo")

    mf.get_filename.assert_called_once()
    mf.get_message_id.assert_called_once()
    mf.get_tags.assert_called_once()
    assert mf.get_header.call_count == 15

    mq.search_messages.assert_called_once()


def test_message_attachments(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value="test/mails/attachments.eml")
    mf.get_header = MagicMock(return_value="  foo\tbar  ")
    mf.get_message_id = MagicMock(return_value="foo")
    mf.get_tags = MagicMock(return_value=["foo", "bar"])

    mq = lambda: None
    mq.search_messages = MagicMock(return_value=iter([mf]))

    with patch("notmuch.Query", return_value=mq) as q:
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
    assert mf.get_header.call_count == 15

    mq.search_messages.assert_called_once()


def test_message_attachment_calendar_preview(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value="test/mails/calendar.eml")
    mf.get_header = MagicMock(return_value="  foo\tbar  ")
    mf.get_message_id = MagicMock(return_value="foo")
    mf.get_tags = MagicMock(return_value=["foo", "bar"])

    mq = lambda: None
    mq.search_messages = MagicMock(return_value=iter([mf]))

    with patch("notmuch.Query", return_value=mq) as q:
        with app.test_client() as test_client:
            response = test_client.get('/api/message/foo')
            assert response.status_code == 200
            msg = json.loads(response.data.decode())
            assert msg["attachments"][0]['content_type'] == 'text/calendar'
            assert msg["attachments"][0]['filename'] == 'unnamed attachment'
            assert msg["attachments"][0]['preview']['summary'] == "testevent"
            assert msg["attachments"][0]['preview']['location'] == "kskdcsd"
            assert msg["attachments"][0]['preview']['tz'] == "Europe/Berlin"
            assert msg["attachments"][0]['preview']['dtstart'] == "20111101T090000"
            assert msg["attachments"][0]['preview']['dtend'] == "20111101T100000"
            assert "Tue Nov  1 " in msg["attachments"][0]['preview']['start']
            assert "2011" in msg["attachments"][0]['preview']['start']
            assert "Tue Nov  1 " in msg["attachments"][0]['preview']['end']
            assert "2011" in msg["attachments"][0]['preview']['end']
            assert msg["attachments"][0]['preview']['attendees'] == "unittest, TRUE"
        q.assert_called_once_with(db, "id:foo")

    mf.get_filename.assert_called_once()
    mf.get_message_id.assert_called_once()
    mf.get_tags.assert_called_once()
    assert mf.get_header.call_count == 15

    mq.search_messages.assert_called_once()


def test_message_attachment_calendar_preview_no_people(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value="test/mails/calendar-nopeople.eml")
    mf.get_header = MagicMock(return_value="  foo\tbar  ")
    mf.get_message_id = MagicMock(return_value="foo")
    mf.get_tags = MagicMock(return_value=["foo", "bar"])

    mq = lambda: None
    mq.search_messages = MagicMock(return_value=iter([mf]))

    with patch("notmuch.Query", return_value=mq) as q:
        with app.test_client() as test_client:
            response = test_client.get('/api/message/foo')
            assert response.status_code == 200
            msg = json.loads(response.data.decode())
            assert msg["attachments"][0]['content_type'] == 'text/calendar'
            assert msg["attachments"][0]['filename'] == 'unnamed attachment'
            assert msg["attachments"][0]['preview']['summary'] == "testevent"
            assert msg["attachments"][0]['preview']['location'] == "kskdcsd"
            assert msg["attachments"][0]['preview']['tz'] == "Europe/Berlin"
            assert msg["attachments"][0]['preview']['dtstart'] == "20111101T090000"
            assert msg["attachments"][0]['preview']['dtend'] == "20111101T100000"
            assert "Tue Nov  1 " in msg["attachments"][0]['preview']['start']
            assert "2011" in msg["attachments"][0]['preview']['start']
            assert "Tue Nov  1 " in msg["attachments"][0]['preview']['end']
            assert "2011" in msg["attachments"][0]['preview']['end']
            assert msg["attachments"][0]['preview']['attendees'] == ""
        q.assert_called_once_with(db, "id:foo")

    mf.get_filename.assert_called_once()
    mf.get_message_id.assert_called_once()
    mf.get_tags.assert_called_once()
    assert mf.get_header.call_count == 15

    mq.search_messages.assert_called_once()


def test_message_signed(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value="test/mails/signed.eml")
    mf.get_header = MagicMock(return_value="  foo\tbar  ")
    mf.get_message_id = MagicMock(return_value="foo")
    mf.get_tags = MagicMock(return_value=["foo", "bar"])

    mq = lambda: None
    mq.search_messages = MagicMock(return_value=iter([mf]))

    app.config.custom["accounts"] = []

    with patch("notmuch.Query", return_value=mq) as q:
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
    assert mf.get_header.call_count == 15

    mq.search_messages.assert_called_once()


def test_message_signed_attachment(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value="test/mails/signed-attachment.eml")
    mf.get_header = MagicMock(return_value="  foo\tbar  ")
    mf.get_message_id = MagicMock(return_value="foo")
    mf.get_tags = MagicMock(return_value=["foo", "bar"])

    mq = lambda: None
    mq.search_messages = MagicMock(return_value=iter([mf]))

    app.config.custom["accounts"] = []

    with patch("notmuch.Query", return_value=mq) as q:
        with app.test_client() as test_client:
            response = test_client.get('/api/message/foo')
            assert response.status_code == 200
            msg = json.loads(response.data.decode())
            assert "Invio messaggio SMIME (signed and clear text)" in msg["body"]["text/plain"]

            assert msg["signature"] == {'message': 'self-signed or unavailable certificate(s)', 'valid': True}
        q.assert_called_once_with(db, "id:foo")

    mf.get_filename.assert_called_once()
    mf.get_message_id.assert_called_once()
    mf.get_tags.assert_called_once()
    assert mf.get_header.call_count == 15

    mq.search_messages.assert_called_once()


def test_message_signed_invalid(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value="test/mails/signed-invalid.eml")
    mf.get_header = MagicMock(return_value="  foo\tbar  ")
    mf.get_message_id = MagicMock(return_value="foo")
    mf.get_tags = MagicMock(return_value=["foo", "bar"])

    mq = lambda: None
    mq.search_messages = MagicMock(return_value=iter([mf]))

    app.config.custom["accounts"] = []

    with patch("notmuch.Query", return_value=mq) as q:
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
    assert mf.get_header.call_count == 15

    mq.search_messages.assert_called_once()


def test_message_html_only(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value="test/mails/html-only.eml")
    mf.get_header = MagicMock(return_value="  foo\tbar  ")
    mf.get_message_id = MagicMock(return_value="foo")
    mf.get_tags = MagicMock(return_value=["foo", "bar"])

    mq = lambda: None
    mq.search_messages = MagicMock(return_value=iter([mf]))

    with patch("notmuch.Query", return_value=mq) as q:
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
    assert mf.get_header.call_count == 15

    mq.search_messages.assert_called_once()


def test_message_html_broken(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value="test/mails/broken-text.eml")
    mf.get_header = MagicMock(return_value="  foo\tbar  ")
    mf.get_message_id = MagicMock(return_value="foo")
    mf.get_tags = MagicMock(return_value=["foo", "bar"])

    mq = lambda: None
    mq.search_messages = MagicMock(return_value=iter([mf]))

    with patch("notmuch.Query", return_value=mq) as q:
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
    assert mf.get_header.call_count == 15

    mq.search_messages.assert_called_once()


def test_message_link_scrubbing(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value="test/mails/clean-html.eml")
    mf.get_header = MagicMock(return_value="  foo\tbar  ")
    mf.get_message_id = MagicMock(return_value="foo")
    mf.get_tags = MagicMock(return_value=["foo", "bar"])

    mq = lambda: None
    mq.search_messages = MagicMock(return_value=iter([mf]))

    with patch("notmuch.Query", return_value=mq) as q:
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
    assert mf.get_header.call_count == 15

    mq.search_messages.assert_called_once()


def test_message_filter_html(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value="test/mails/html-only.eml")
    mf.get_header = MagicMock(return_value="  foo\tbar  ")
    mf.get_message_id = MagicMock(return_value="foo")
    mf.get_tags = MagicMock(return_value=["foo", "bar"])

    mq = lambda: None
    mq.search_messages = MagicMock(return_value=iter([mf]))

    app.config.custom["accounts"] = []
    try:
        app.config.custom["filter"]["content"]["text/html"] = ['<input value="a>swordfish">', "meat"]
    except KeyError:
        app.config.custom["filter"] = {}
        app.config.custom["filter"]["content"] = {}
        app.config.custom["filter"]["content"]["text/html"] = ['<input value="a>swordfish">', "meat"]

    with patch("notmuch.Query", return_value=mq) as q:
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
    assert mf.get_header.call_count == 15

    mq.search_messages.assert_called_once()


def test_message_filter_text(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value="test/mails/simple.eml")
    mf.get_header = MagicMock(return_value="  foo\tbar  ")
    mf.get_message_id = MagicMock(return_value="foo")
    mf.get_tags = MagicMock(return_value=["foo", "bar"])

    mq = lambda: None
    mq.search_messages = MagicMock(return_value=iter([mf]))

    try:
        app.config.custom["filter"]["content"]["text/plain"] = ["notmuch_message_get_flags", "somefunc"]
    except KeyError:
        app.config.custom["filter"] = {}
        app.config.custom["filter"]["content"] = {}
        app.config.custom["filter"]["content"]["text/plain"] = ["notmuch_message_get_flags", "somefunc"]

    with patch("notmuch.Query", return_value=mq) as q:
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
    assert mf.get_header.call_count == 15

    mq.search_messages.assert_called_once()


def test_thread(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value="test/mails/simple.eml")
    mf.get_header = MagicMock(return_value="  foo\tbar  ")
    mf.get_message_id = MagicMock(return_value="foo")
    mf.get_tags = MagicMock(return_value=["foo", "bar"])

    mt = lambda: None
    mt.get_messages = MagicMock(return_value=iter([mf]))

    mq = lambda: None
    mq.search_threads = MagicMock(return_value=iter([mt]))

    with patch("notmuch.Query", return_value=mq) as q:
        with app.test_client() as test_client:
            response = test_client.get('/api/thread/foo')
            assert response.status_code == 200
            thread = json.loads(response.data.decode())
            assert len(thread) == 1
            msg = thread[0]
            assert msg["from"] == "foo bar"
            assert msg["to"] == "foo bar"
            assert msg["cc"] == "foo bar"
            assert msg["bcc"] == "foo bar"
            assert msg["date"] == "foo\tbar"
            assert msg["subject"] == "foo bar"
            assert msg["message_id"] == "foo\tbar"
            assert msg["in_reply_to"] == "foo\tbar"
            assert msg["references"] == "foo\tbar"
            assert msg["reply_to"] == "foo\tbar"

            assert "With the new notmuch_message_get_flags() function" in msg["body"]["text/plain"]
            assert msg["body"]["text/html"] == ''

            assert msg["notmuch_id"] == "foo"
            assert msg["tags"] == ["foo", "bar"]
            assert msg["attachments"] == []
            assert msg["signature"] is None
        q.assert_called_once_with(db, "thread:foo")

    mf.get_filename.assert_called_once()
    mf.get_message_id.assert_called_once()
    mf.get_tags.assert_called_once()
    assert mf.get_header.call_count == 15

    mt.get_messages.assert_called_once()

    mq.search_threads.assert_called_once()


def test_thread_none(setup):
    app, db = setup

    mq = lambda: None
    mq.search_threads = MagicMock(return_value=iter([]))

    with patch("notmuch.Query", return_value=mq) as q:
        with app.test_client() as test_client:
            response = test_client.get('/api/thread/foo')
            assert response.status_code == 404
        q.assert_called_once_with(db, "thread:foo")

    mq.search_threads.assert_called_once()


def test_thread_duplicate(setup):
    app, db = setup

    mq = lambda: None
    mq.search_threads = MagicMock(return_value=iter([1, 2]))

    with patch("notmuch.Query", return_value=mq) as q:
        with app.test_client() as test_client:
            response = test_client.get('/api/thread/foo')
            assert response.status_code == 500
        q.assert_called_once_with(db, "thread:foo")

    mq.search_threads.assert_called_once()


def test_send(setup):
    app, db = setup

    mm = lambda: None
    mm.maildir_flags_to_tags = MagicMock()
    mm.add_tag = MagicMock()
    mm.tags_to_maildir_flags = MagicMock()

    dbw = lambda: None
    dbw.close = MagicMock()
    dbw.begin_atomic = MagicMock()
    dbw.end_atomic = MagicMock()
    dbw.index_file = MagicMock(return_value=(mm, 0))

    pd = {"from": "foo", "to": "bar", "cc": "", "bcc": "", "subject": "test", "body": "foobar", "action": "compose", "tags": "foo,bar"}

    app.config.custom["accounts"] = [{"id": "foo",
                                      "name": "Foo Bar",
                                      "email": "foo@bar.com",
                                      "sendmail": "true",
                                      "save_sent_to": "folder",
                                      "additional_sent_tags": ["test"]}]

    with patch("notmuch.Database", return_value=dbw):
        with patch("builtins.open", mock_open()) as m:
            with app.test_client() as test_client:
                response = test_client.post('/api/send', data=pd)
                assert response.status_code == 200
                assert response.json["sendStatus"] == 0
                assert response.json["sendOutput"] == ""
            m.assert_called_once()
            args = m.call_args.args
            assert "kukulkan" in args[0]
            assert "folder" in args[0]
            assert ":2,S" in args[0]
            assert args[1] == "w"
            hdl = m()
            hdl.write.assert_called_once()
            args = hdl.write.call_args.args
            assert "Content-Type: text/plain; charset=\"utf-8\"" in args[0]
            assert "Content-Transfer-Encoding: 7bit" in args[0]
            assert "MIME-Version: 1.0" in args[0]
            assert "Subject: test" in args[0]
            assert "From: Foo Bar <foo@bar.com>" in args[0]
            assert "To: bar" in args[0]
            assert "Cc:" in args[0]
            assert "Bcc:" in args[0]
            assert "Date: " in args[0]
            assert "Message-ID: <"
            assert "\n\nfoobar\n" in args[0]

    mm.maildir_flags_to_tags.assert_called_once()
    mm.tags_to_maildir_flags.assert_called_once()
    mm.add_tag.assert_has_calls([call("foo"), call("bar"), call("test"), call("sent")])

    dbw.begin_atomic.assert_called_once()
    dbw.end_atomic.assert_called_once()
    dbw.close.assert_called_once()


def test_send_addresses(setup):
    app, db = setup

    mm = lambda: None
    mm.maildir_flags_to_tags = MagicMock()
    mm.add_tag = MagicMock()
    mm.tags_to_maildir_flags = MagicMock()

    dbw = lambda: None
    dbw.close = MagicMock()
    dbw.begin_atomic = MagicMock()
    dbw.end_atomic = MagicMock()
    dbw.index_file = MagicMock(return_value=(mm, 0))

    pd = {"from": "foo", "to": "Foo bar <foo@bar.com>", "cc": "Föö Bår <foo@bar.com>",
          "bcc": "Føø Bär <foo@bar.com>", "subject": "test", "body": "foobar", "action": "compose", "tags": "foo,bar"}

    app.config.custom["accounts"] = [{"id": "foo",
                                      "name": "Foo Bar",
                                      "email": "foo@bar.com",
                                      "sendmail": "true",
                                      "save_sent_to": "folder",
                                      "additional_sent_tags": ["test"]}]

    with patch("notmuch.Database", return_value=dbw):
        with patch("builtins.open", mock_open()) as m:
            with app.test_client() as test_client:
                response = test_client.post('/api/send', data=pd)
                assert response.status_code == 200
                assert response.json["sendStatus"] == 0
                assert response.json["sendOutput"] == ""
            m.assert_called_once()
            args = m.call_args.args
            assert "kukulkan" in args[0]
            assert "folder" in args[0]
            assert ":2,S" in args[0]
            assert args[1] == "w"
            hdl = m()
            hdl.write.assert_called_once()
            args = hdl.write.call_args.args
            assert "Content-Type: text/plain; charset=\"utf-8\"" in args[0]
            assert "Content-Transfer-Encoding: 7bit" in args[0]
            assert "MIME-Version: 1.0" in args[0]
            assert "Subject: test" in args[0]
            assert "From: Foo Bar <foo@bar.com>" in args[0]
            assert "To: Foo bar <foo@bar.com>" in args[0]
            assert "Cc: Föö Bår <foo@bar.com>" in args[0]
            assert "Bcc: Føø Bär <foo@bar.com>" in args[0]
            assert "Date: " in args[0]
            assert "Message-ID: <"
            assert "\n\nfoobar\n" in args[0]

    mm.maildir_flags_to_tags.assert_called_once()
    mm.tags_to_maildir_flags.assert_called_once()
    mm.add_tag.assert_has_calls([call("foo"), call("bar"), call("test"), call("sent")])

    dbw.begin_atomic.assert_called_once()
    dbw.end_atomic.assert_called_once()
    dbw.close.assert_called_once()


def test_send_fail(setup):
    app, db = setup

    pd = {"from": "foo", "to": "bar", "cc": "", "bcc": "", "subject": "test", "body": "foobar", "action": "compose", "tags": "foo,bar"}

    app.config.custom["accounts"] = [{"id": "foo",
                                      "name": "Foo Bar",
                                      "email": "foo@bar.com",
                                      "sendmail": "false",
                                      "save_sent_to": "folder",
                                      "additional_sent_tags": ["test"]}]

    with app.test_client() as test_client:
        response = test_client.post('/api/send', data=pd)
        assert response.status_code == 200
        assert response.json["sendStatus"] == 1
        assert response.json["sendOutput"] == ""


def test_send_attachment(setup):
    app, db = setup

    mm = lambda: None
    mm.maildir_flags_to_tags = MagicMock()
    mm.add_tag = MagicMock()
    mm.tags_to_maildir_flags = MagicMock()

    dbw = lambda: None
    dbw.close = MagicMock()
    dbw.begin_atomic = MagicMock()
    dbw.end_atomic = MagicMock()
    dbw.index_file = MagicMock(return_value=(mm, 0))

    pd = {"from": "foo", "to": "bar", "cc": "", "bcc": "", "subject": "test",
          "body": "foobar", "action": "compose", "tags": "foo,bar"}
    pd = {key: str(value) for key, value in pd.items()}
    pd['file'] = (io.BytesIO(b"This is a file."), 'test.txt')

    app.config.custom["accounts"] = [{"id": "foo",
                                      "name": "Foo Bar",
                                      "email": "foo@bar.com",
                                      "sendmail": "true",
                                      "save_sent_to": "folder",
                                      "additional_sent_tags": ["test"]}]

    with patch("notmuch.Database", return_value=dbw):
        with patch("builtins.open", mock_open()) as m:
            with app.test_client() as test_client:
                response = test_client.post('/api/send', data=pd)
                assert response.status_code == 200
                assert response.json["sendStatus"] == 0
                assert response.json["sendOutput"] == ""
            assert m.call_count == 2
            args = m.call_args.args
            assert "kukulkan" in args[0]
            assert "folder" in args[0]
            assert ":2,S" in args[0]
            assert args[1] == "w"
            hdl = m()
            hdl.write.assert_called_once()
            args = hdl.write.call_args.args
            assert "Content-Type: text/plain; charset=\"utf-8\"" in args[0]
            assert "Content-Transfer-Encoding: 7bit" in args[0]
            assert "MIME-Version: 1.0" in args[0]
            assert "Subject: test" in args[0]
            assert "From: Foo Bar <foo@bar.com>" in args[0]
            assert "To: bar" in args[0]
            assert "Cc:" in args[0]
            assert "Bcc:" in args[0]
            assert "Date: " in args[0]
            assert "Message-ID: <"
            assert "\n\nfoobar\n" in args[0]
            assert "Content-Transfer-Encoding: base64" in args[0]
            assert "Content-Disposition: attachment; filename=\"test.txt\"" in args[0]
            assert "\nVGhpcyBpcyBhIGZpbGUu\n" in args[0]

    mm.maildir_flags_to_tags.assert_called_once()
    mm.tags_to_maildir_flags.assert_called_once()
    mm.add_tag.assert_has_calls([call("foo"), call("bar"), call("test"), call("sent")])

    dbw.begin_atomic.assert_called_once()
    dbw.end_atomic.assert_called_once()
    dbw.close.assert_called_once()


def test_send_reply(setup):
    app, db = setup

    mm = lambda: None
    mm.maildir_flags_to_tags = MagicMock()
    mm.add_tag = MagicMock()
    mm.tags_to_maildir_flags = MagicMock()

    dbw = lambda: None
    dbw.close = MagicMock()
    dbw.begin_atomic = MagicMock()
    dbw.end_atomic = MagicMock()
    dbw.index_file = MagicMock(return_value=(mm, 0))

    pd = {"from": "foo", "to": "bar", "cc": "", "bcc": "", "subject": "test",
          "body": "foobar", "action": "reply", "tags": "foo,bar", "refId": "oldFoo"}

    app.config.custom["accounts"] = [{"id": "foo",
                                      "name": "Foo Bar",
                                      "email": "foo@bar.com",
                                      "sendmail": "true",
                                      "save_sent_to": "folder",
                                      "additional_sent_tags": ["test"]}]

    mf = lambda: None
    mf.add_tag = MagicMock()
    mf.tags_to_maildir_flags = MagicMock()

    mq = lambda: None
    mq.search_messages = MagicMock()
    mq.search_messages.side_effect = [iter([mf]), iter([mf])]

    with patch("notmuch.Query", return_value=mq) as q:
        with patch("src.kukulkan.message_to_json", return_value={"message_id": "oldFoo", "references": None}) as mtj:
            with patch("notmuch.Database", return_value=dbw):
                with patch("builtins.open", mock_open()) as m:
                    with app.test_client() as test_client:
                        response = test_client.post('/api/send', data=pd)
                        assert response.status_code == 200
                        assert response.json["sendStatus"] == 0
                        assert response.json["sendOutput"] == ""
                    m.assert_called_once()
                    args = m.call_args.args
                    assert "kukulkan" in args[0]
                    assert "folder" in args[0]
                    assert ":2,S" in args[0]
                    assert args[1] == "w"
                    hdl = m()
                    hdl.write.assert_called_once()
                    args = hdl.write.call_args.args
                    assert "Content-Type: text/plain; charset=\"utf-8\"" in args[0]
                    assert "Content-Transfer-Encoding: 7bit" in args[0]
                    assert "MIME-Version: 1.0" in args[0]
                    assert "Subject: test" in args[0]
                    assert "From: Foo Bar <foo@bar.com>" in args[0]
                    assert "To: bar" in args[0]
                    assert "Cc:" in args[0]
                    assert "Bcc:" in args[0]
                    assert "Date: " in args[0]
                    assert "Message-ID: <"
                    assert "In-Reply-To: <oldFoo>" in args[0]
                    assert "References: <oldFoo>" in args[0]
                    assert "\n\nfoobar\n" in args[0]

            mtj.assert_called_once_with(mf)

        q.assert_has_calls([call(db, "id:oldFoo"), call(dbw, "id:oldFoo")])

    assert mq.search_messages.call_count == 2

    mf.add_tag.assert_called_once_with("replied")
    mf.tags_to_maildir_flags.assert_called_once()

    mm.maildir_flags_to_tags.assert_called_once()
    mm.tags_to_maildir_flags.assert_called_once()
    mm.add_tag.assert_has_calls([call("foo"), call("bar"), call("test"), call("sent")])

    dbw.begin_atomic.assert_called_once()
    dbw.end_atomic.assert_called_once()
    dbw.close.assert_called_once()


def test_send_reply_more_refs(setup):
    app, db = setup

    mm = lambda: None
    mm.maildir_flags_to_tags = MagicMock()
    mm.add_tag = MagicMock()
    mm.tags_to_maildir_flags = MagicMock()

    dbw = lambda: None
    dbw.close = MagicMock()
    dbw.begin_atomic = MagicMock()
    dbw.end_atomic = MagicMock()
    dbw.index_file = MagicMock(return_value=(mm, 0))

    pd = {"from": "foo", "to": "bar", "cc": "", "bcc": "", "subject": "test",
          "body": "foobar", "action": "reply", "tags": "foo,bar", "refId": "oldFoo"}

    app.config.custom["accounts"] = [{"id": "foo",
                                      "name": "Foo Bar",
                                      "email": "foo@bar.com",
                                      "sendmail": "true",
                                      "save_sent_to": "folder",
                                      "additional_sent_tags": ["test"]}]

    mf = lambda: None
    mf.add_tag = MagicMock()
    mf.tags_to_maildir_flags = MagicMock()

    mq = lambda: None
    mq.search_messages = MagicMock()
    mq.search_messages.side_effect = [iter([mf]), iter([mf])]

    with patch("notmuch.Query", return_value=mq) as q:
        with patch("src.kukulkan.message_to_json", return_value={"message_id": "oldFoo", "references": "olderFoo"}) as mtj:
            with patch("notmuch.Database", return_value=dbw):
                with patch("builtins.open", mock_open()) as m:
                    with app.test_client() as test_client:
                        response = test_client.post('/api/send', data=pd)
                        assert response.status_code == 200
                        assert response.json["sendStatus"] == 0
                        assert response.json["sendOutput"] == ""
                    m.assert_called_once()
                    args = m.call_args.args
                    assert "kukulkan" in args[0]
                    assert "folder" in args[0]
                    assert ":2,S" in args[0]
                    assert args[1] == "w"
                    hdl = m()
                    hdl.write.assert_called_once()
                    args = hdl.write.call_args.args
                    assert "Content-Type: text/plain; charset=\"utf-8\"" in args[0]
                    assert "Content-Transfer-Encoding: 7bit" in args[0]
                    assert "MIME-Version: 1.0" in args[0]
                    assert "Subject: test" in args[0]
                    assert "From: Foo Bar <foo@bar.com>" in args[0]
                    assert "To: bar" in args[0]
                    assert "Cc:" in args[0]
                    assert "Bcc:" in args[0]
                    assert "Date: " in args[0]
                    assert "Message-ID: <"
                    assert "In-Reply-To: <oldFoo>" in args[0]
                    assert "References: olderFoo <oldFoo>" in args[0]
                    assert "\n\nfoobar\n" in args[0]

            mtj.assert_called_once_with(mf)

        q.assert_has_calls([call(db, "id:oldFoo"), call(dbw, "id:oldFoo")])

    assert mq.search_messages.call_count == 2

    mf.add_tag.assert_called_once_with("replied")
    mf.tags_to_maildir_flags.assert_called_once()

    mm.maildir_flags_to_tags.assert_called_once()
    mm.tags_to_maildir_flags.assert_called_once()
    mm.add_tag.assert_has_calls([call("foo"), call("bar"), call("test"), call("sent")])

    dbw.begin_atomic.assert_called_once()
    dbw.end_atomic.assert_called_once()
    dbw.close.assert_called_once()


def test_send_forward(setup):
    app, db = setup

    mm = lambda: None
    mm.maildir_flags_to_tags = MagicMock()
    mm.add_tag = MagicMock()
    mm.tags_to_maildir_flags = MagicMock()

    dbw = lambda: None
    dbw.close = MagicMock()
    dbw.begin_atomic = MagicMock()
    dbw.end_atomic = MagicMock()
    dbw.index_file = MagicMock(return_value=(mm, 0))

    pd = {"from": "foo", "to": "bar", "cc": "", "bcc": "", "subject": "test",
          "body": "foobar", "action": "forward", "tags": "foo,bar",
          "refId": "oldFoo", "attachment-0": "testfile"}

    app.config.custom["accounts"] = [{"id": "foo",
                                      "name": "Foo Bar",
                                      "email": "foo@bar.com",
                                      "sendmail": "true",
                                      "save_sent_to": "folder",
                                      "additional_sent_tags": ["test"]}]

    mf = lambda: None
    mf.add_tag = MagicMock()
    mf.tags_to_maildir_flags = MagicMock()

    mq = lambda: None
    mq.search_messages = MagicMock()
    mq.search_messages.side_effect = [iter([mf]), iter([mf])]

    with patch("notmuch.Query", return_value=mq) as q:
        with patch("src.kukulkan.message_attachment", return_value=[{"filename": "testfile", "content_type": "text/plain", "content": b"This is content."}]) as ma:
            with patch("notmuch.Database", return_value=dbw):
                with patch("builtins.open", mock_open()) as m:
                    with app.test_client() as test_client:
                        response = test_client.post('/api/send', data=pd)
                        assert response.status_code == 200
                        assert response.json["sendStatus"] == 0
                        assert response.json["sendOutput"] == ""
                    m.assert_called_once()
                    args = m.call_args.args
                    assert "kukulkan" in args[0]
                    assert "folder" in args[0]
                    assert ":2,S" in args[0]
                    assert args[1] == "w"
                    hdl = m()
                    hdl.write.assert_called_once()
                    args = hdl.write.call_args.args
                    assert "Content-Type: text/plain; charset=\"utf-8\"" in args[0]
                    assert "Content-Transfer-Encoding: 7bit" in args[0]
                    assert "MIME-Version: 1.0" in args[0]
                    assert "Subject: test" in args[0]
                    assert "From: Foo Bar <foo@bar.com>" in args[0]
                    assert "To: bar" in args[0]
                    assert "Cc:" in args[0]
                    assert "Bcc:" in args[0]
                    assert "Date: " in args[0]
                    assert "Message-ID: <"
                    assert "Content-Transfer-Encoding: base64" in args[0]
                    assert "Content-Disposition: attachment; filename=\"testfile\"" in args[0]
                    assert "\nVGhpcyBpcyBjb250ZW50Lg==\n" in args[0]
                    assert "\n\nfoobar\n" in args[0]

            ma.assert_called_once_with(mf)

        q.assert_has_calls([call(db, "id:oldFoo"), call(dbw, "id:oldFoo")])

    assert mq.search_messages.call_count == 2

    mf.add_tag.assert_called_once_with("passed")
    mf.tags_to_maildir_flags.assert_called_once()

    mm.maildir_flags_to_tags.assert_called_once()
    mm.tags_to_maildir_flags.assert_called_once()
    mm.add_tag.assert_has_calls([call("foo"), call("bar"), call("test"), call("sent")])

    dbw.begin_atomic.assert_called_once()
    dbw.end_atomic.assert_called_once()
    dbw.close.assert_called_once()


def test_send_forward_text_attachment(setup):
    app, db = setup

    mm = lambda: None
    mm.maildir_flags_to_tags = MagicMock()
    mm.add_tag = MagicMock()
    mm.tags_to_maildir_flags = MagicMock()

    dbw = lambda: None
    dbw.close = MagicMock()
    dbw.begin_atomic = MagicMock()
    dbw.end_atomic = MagicMock()
    dbw.index_file = MagicMock(return_value=(mm, 0))

    pd = {"from": "foo", "to": "bar", "cc": "", "bcc": "", "subject": "test",
          "body": "foobar", "action": "forward", "tags": "foo,bar",
          "refId": "oldFoo", "attachment-0": "unnamed attachment"}

    app.config.custom["accounts"] = [{"id": "foo",
                                      "name": "Foo Bar",
                                      "email": "foo@bar.com",
                                      "sendmail": "true",
                                      "save_sent_to": "folder",
                                      "additional_sent_tags": ["test"]}]

    mf = lambda: None
    mf.add_tag = MagicMock()
    mf.tags_to_maildir_flags = MagicMock()

    mq = lambda: None
    mq.search_messages = MagicMock()
    mq.search_messages.side_effect = [iter([mf]), iter([mf])]

    with patch("notmuch.Query", return_value=mq) as q:
        with patch("src.kukulkan.message_attachment", return_value=[{"filename": "unnamed attachment", "content_type": "text/plain", "content": "This is content."}]) as ma:
            with patch("notmuch.Database", return_value=dbw):
                with patch("builtins.open", mock_open()) as m:
                    with app.test_client() as test_client:
                        response = test_client.post('/api/send', data=pd)
                        assert response.status_code == 200
                        assert response.json["sendStatus"] == 0
                        assert response.json["sendOutput"] == ""
                    m.assert_called_once()
                    args = m.call_args.args
                    assert "kukulkan" in args[0]
                    assert "folder" in args[0]
                    assert ":2,S" in args[0]
                    assert args[1] == "w"
                    hdl = m()
                    hdl.write.assert_called_once()
                    args = hdl.write.call_args.args
                    print(args[0])
                    assert "Content-Type: text/plain; charset=\"utf-8\"" in args[0]
                    assert "Content-Transfer-Encoding: 7bit" in args[0]
                    assert "MIME-Version: 1.0" in args[0]
                    assert "Subject: test" in args[0]
                    assert "From: Foo Bar <foo@bar.com>" in args[0]
                    assert "To: bar" in args[0]
                    assert "Cc:" in args[0]
                    assert "Bcc:" in args[0]
                    assert "Date: " in args[0]
                    assert "Message-ID: <"
                    assert "\n\nfoobar\n" in args[0]
                    assert "Content-Type: text/plain; charset=\"utf-8\"" in args[0]
                    assert "Content-Transfer-Encoding: 7bit" in args[0]
                    assert "Content-Disposition: attachment; filename=\"unnamed attachment\"" in args[0]
                    assert "MIME-Version: 1.0" in args[0]
                    assert "\n\nThis is content.\n" in args[0]

            ma.assert_called_once_with(mf)

        q.assert_has_calls([call(db, "id:oldFoo"), call(dbw, "id:oldFoo")])

    assert mq.search_messages.call_count == 2

    mf.add_tag.assert_called_once_with("passed")
    mf.tags_to_maildir_flags.assert_called_once()

    mm.maildir_flags_to_tags.assert_called_once()
    mm.tags_to_maildir_flags.assert_called_once()
    mm.add_tag.assert_has_calls([call("foo"), call("bar"), call("test"), call("sent")])

    dbw.begin_atomic.assert_called_once()
    dbw.end_atomic.assert_called_once()
    dbw.close.assert_called_once()


def test_send_sign(setup):
    app, db = setup

    mm = lambda: None
    mm.maildir_flags_to_tags = MagicMock()
    mm.add_tag = MagicMock()
    mm.tags_to_maildir_flags = MagicMock()

    dbw = lambda: None
    dbw.close = MagicMock()
    dbw.begin_atomic = MagicMock()
    dbw.end_atomic = MagicMock()
    dbw.index_file = MagicMock(return_value=(mm, 0))

    pd = {"from": "foo", "to": "bar", "cc": "", "bcc": "", "subject": "test",
          "body": "foobar", "action": "compose", "tags": "foo,bar"}

    app.config.custom["accounts"] = [{"id": "foo",
                                      "name": "Foo Bar",
                                      "email": "foo@bar.com",
                                      "key": "test/mails/cert.key",
                                      "cert": "test/mails/cert.crt",
                                      "sendmail": "true",
                                      "save_sent_to": "folder",
                                      "additional_sent_tags": ["test"]}]

    # need to create this here because open() is mocked later
    smime = SMIME.SMIME()
    smime.load_key(app.config.custom["accounts"][0]["key"],
                   app.config.custom["accounts"][0]["cert"])

    with patch("notmuch.Database", return_value=dbw):
        with patch("builtins.open", mock_open()) as m:
            with patch("M2Crypto.SMIME.SMIME", return_value=smime) as smim:
                with patch.object(smime, "load_key") as smimload:
                    with app.test_client() as test_client:
                        response = test_client.post('/api/send', data=pd)
                        assert response.status_code == 200
                        assert response.json["sendStatus"] == 0
                        assert response.json["sendOutput"] == ""
                    smimload.assert_called_once()
                smim.assert_called_once()
            m.assert_called_once()
            args = m.call_args.args
            assert "kukulkan" in args[0]
            assert "folder" in args[0]
            assert ":2,S" in args[0]
            assert args[1] == "w"
            hdl = m()
            hdl.write.assert_called_once()
            args = hdl.write.call_args.args
            assert "Content-Type: text/plain; charset=\"utf-8\"" in args[0]
            assert "Content-Transfer-Encoding: 7bit" in args[0]
            assert "MIME-Version: 1.0" in args[0]
            assert "Subject: test" in args[0]
            assert "From: Foo Bar <foo@bar.com>" in args[0]
            assert "To: bar" in args[0]
            assert "Cc:" in args[0]
            assert "Bcc:" in args[0]
            assert "Date: " in args[0]
            assert "Message-ID: <"
            assert "\n\nfoobar\n" in args[0]

            assert "\n\nThis is an S/MIME signed message\n" in args[0]
            assert "Content-Type: application/x-pkcs7-signature; name=\"smime.p7s\"" in args[0]
            assert "Content-Transfer-Encoding: base64" in args[0]
            assert "Content-Disposition: attachment; filename=\"smime.p7s\"" in args[0]

    mm.maildir_flags_to_tags.assert_called_once()
    mm.tags_to_maildir_flags.assert_called_once()
    mm.add_tag.assert_has_calls([call("foo"), call("bar"), call("test"), call("sent")])

    dbw.begin_atomic.assert_called_once()
    dbw.end_atomic.assert_called_once()
    dbw.close.assert_called_once()
