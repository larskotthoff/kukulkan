import pytest
import json
import io
import os
import email
from unittest.mock import MagicMock, mock_open, patch, call, ANY

import notmuch2

from PIL import Image

import src.kukulkan as k

IN_GITHUB_ACTIONS = os.getenv("GITHUB_ACTIONS") == "true"

def test_split_email_addresses():
    assert ["foo@bar.com"] == k.split_email_addresses("foo@bar.com")
    assert ["foo@bar.com", "bar@foo.com"] == k.split_email_addresses("foo@bar.com, bar@foo.com")
    assert ["Foo Bar <foo@bar.com>", "Bar Foo <bar@foo.com>"] == k.split_email_addresses("Foo Bar <foo@bar.com>, Bar Foo <bar@foo.com>")
    assert ["\"Bar, Foo\" <foo@bar.com>", "\"Foo, Bar\" <bar@foo.com>"] == k.split_email_addresses("\"Bar, Foo\" <foo@bar.com>, \"Foo, Bar\" <bar@foo.com>")
    assert ["Bar, Foo <foo@bar.com>", "Foo, Bar <bar@foo.com>"] == k.split_email_addresses("Bar, Foo <foo@bar.com>, Foo, Bar <bar@foo.com>")


def test_email_addresses_header():
    assert "foo@bar.com" == k.email_addresses_header("foo@bar.com")
    assert "foo@bar.com, bar@foo.com" == k.email_addresses_header("foo@bar.com\nbar@foo.com")
    assert "Foo Bar <foo@bar.com>" == k.email_addresses_header("Foo Bar <foo@bar.com>")
    assert "\"Bar, Foo\" <foo@bar.com>" == k.email_addresses_header("Bar, Foo <foo@bar.com>")
    assert "\"Bar, Foo\" <foo@bar.com>" == k.email_addresses_header("\"Bar, Foo\" <foo@bar.com>")
    assert "Foo Bar <foo@bar.com>" == k.email_addresses_header("\"Foo Bar\" <foo@bar.com>")
    assert "Föö Bär <foo@bar.com>" == k.email_addresses_header("Föö Bär <foo@bar.com>")


@pytest.fixture
def setup():
    flask_app = k.create_app()
    db = lambda: None
    db.close = MagicMock()
    with flask_app.app_context() as c:
        c.g.db = db
        yield flask_app, db

    db.close.assert_called_once()


def test_globals(setup):
    app, db = setup

    db.tags = ['foo', 'bar', '(null)', 'due:2222-22-22']

    app.config.custom["accounts"] = "foo"
    app.config.custom["compose"] = {}
    app.config.custom["compose"]["templates"] = "foo"
    app.config.custom["compose"]["external-editor"] = "bar"

    globs = k.get_globals()
    assert "foo" == globs["accounts"]
    assert {"external-editor": "bar", "templates": "foo"} == globs["compose"]
    assert ["foo", "bar"] == globs["allTags"]


def test_query(setup):
    app, db = setup

    mm1 = lambda: None
    mm1.tags = ["footag"]
    mm1.date = 0
    mm1.header = MagicMock()
    mm1.header.side_effect = ["foo bar <foo@bar.com>", "foosubject"]
    mm2 = lambda: None
    mm2.date = 1
    mm2.tags = ["footag", "bartag"]
    mm2.header = MagicMock()
    mm2.header.side_effect = ["bar foo <bar@foo.com>"]
    mm3 = lambda: None
    mm3.date = 2
    mm3.tags = ["foobartag"]
    mm3.header = MagicMock()
    mm3.header.side_effect = ["bar\tfoo <bar@foo.com>"]

    mt = MagicMock()
    mt.threadid = "id"

    db.config = {}
    db.messages = MagicMock()
    db.messages.side_effect = [iter([mt]), iter([mm1, mm2, mm3])]

    with app.test_client() as test_client:
        response = test_client.get('/api/query/foo')
        assert response.status_code == 200
        thrds = json.loads(response.data.decode())
        assert thrds[0]["authors"] == ["foo bar <foo@bar.com>", "bar foo <bar@foo.com>"]
        assert thrds[0]["newest_date"] == "Wed Dec 31 17:00:02 1969"
        assert thrds[0]["oldest_date"] == "Wed Dec 31 17:00:00 1969"
        assert thrds[0]["subject"] == "foosubject"
        thrds[0]["tags"].sort()
        assert thrds[0]["tags"] == ["bartag", "foobartag", "footag"]
        assert thrds[0]["thread_id"] == "id"
        assert thrds[0]["total_messages"] == 3

    assert db.messages.mock_calls == [
        call('foo', exclude_tags=[], sort=notmuch2.Database.SORT.NEWEST_FIRST),
        call('thread:id', exclude_tags=[], sort=notmuch2.Database.SORT.OLDEST_FIRST)
    ]

    mm1.header.assert_has_calls([call("from"), call("subject")])
    mm2.header.assert_has_calls([call("from")])
    mm3.header.assert_has_calls([call("from")])


def test_query_empty(setup):
    app, db = setup

    mm1 = lambda: None
    mm1.tags = ["footag"]
    mm1.date = 0
    mm1.header = MagicMock()
    mm1.header.side_effect = [None, None]

    mt = MagicMock()
    mt.threadid = "id"

    db.config = {}
    db.messages = MagicMock()
    db.messages.side_effect = [iter([mt]), iter([mm1])]

    with app.test_client() as test_client:
        response = test_client.get('/api/query/foo')
        assert response.status_code == 200
        thrds = json.loads(response.data.decode())
        assert thrds[0]["authors"] == [None]
        assert thrds[0]["newest_date"] == "Wed Dec 31 17:00:00 1969"
        assert thrds[0]["oldest_date"] == "Wed Dec 31 17:00:00 1969"
        assert thrds[0]["subject"] == "(no subject)"
        assert thrds[0]["tags"] == ["footag"]
        assert thrds[0]["thread_id"] == "id"
        assert thrds[0]["total_messages"] == 1

    assert db.messages.mock_calls == [
        call('foo', exclude_tags=[], sort=notmuch2.Database.SORT.NEWEST_FIRST),
        call('thread:id', exclude_tags=[], sort=notmuch2.Database.SORT.OLDEST_FIRST)
    ]

    mm1.header.assert_has_calls([call("from"), call("subject")])


def test_query_none(setup):
    app, db = setup

    db.config = {}
    db.messages = MagicMock(return_value=iter([]))

    with app.test_client() as test_client:
        response = test_client.get('/api/query/foo')
        assert response.status_code == 200
        assert b'[]\n' == response.data

    db.messages.assert_called_once_with("foo", exclude_tags=[],
                                        sort=notmuch2.Database.SORT.NEWEST_FIRST)


def test_query_exclude_tags(setup):
    app, db = setup

    db.config = {"search.exclude_tags": "foo;bar"}
    db.messages = MagicMock(return_value=iter([]))

    with app.test_client() as test_client:
        response = test_client.get('/api/query/foo')
        assert response.status_code == 200
        assert b'[]\n' == response.data

    db.messages.assert_called_once_with("foo", exclude_tags=["foo", "bar"],
                                        sort=notmuch2.Database.SORT.NEWEST_FIRST)


def test_address(setup):
    app, db = setup

    mf = lambda: None
    mf.header = MagicMock()
    mf.header.side_effect = ["foo@bar.com", "\"bar foo\" bar@foo.com", "bar@foo.com", None]
    mf.tags = ["foo", "bar"]

    db.config = {}
    db.messages = MagicMock(return_value=iter([mf]))

    with app.test_client() as test_client:
        response = test_client.get('/api/address/foo')
        assert response.status_code == 200
        addrs = json.loads(response.data.decode())
        assert len(addrs) == 2
        assert addrs[0] == "foo@bar.com"
        assert addrs[1] == "\"bar foo\" bar@foo.com"

    mf.header.assert_has_calls([call("from"), call("to"), call("cc"), call("bcc")])
    db.messages.assert_called_once_with("from:foo or to:foo", exclude_tags=[],
                                       sort=notmuch2.Database.SORT.NEWEST_FIRST)


def test_get_message_none(setup):
    app, db = setup

    db.config = {}
    db.find = MagicMock()
    db.find.side_effect = LookupError("foo")

    with app.test_client() as test_client:
        response = test_client.get('/api/message/foo')
        assert response.status_code == 404
    db.find.assert_called_once_with("foo")


def test_raw_message(setup):
    app, db = setup

    mf = lambda: None
    mf.path = "foofile"

    db.config = {}
    db.find = MagicMock(return_value=mf)

    with patch("builtins.open", mock_open(read_data="This is a test.")) as o:
        with app.test_client() as test_client:
            response = test_client.get('/api/raw_message/foo')
            assert response.status_code == 200
            assert b'This is a test.' == response.data
        o.assert_called_once_with("foofile", "r", encoding="utf8")
    db.find.assert_called_once_with("foo")


def test_tag_add_message(setup):
    app, db = setup

    mf = lambda: None
    mf.frozen = MagicMock()
    mf.tags = lambda: None
    mf.tags.add = MagicMock()

    dbw = lambda: None
    dbw.close = MagicMock()
    dbw.messages = MagicMock(return_value=iter([mf]))
    dbw.config = {}

    with patch("notmuch2.Database", return_value=dbw) as nmdb:
        with app.test_client() as test_client:
            response = test_client.get('/api/tag/add/message/foo/bar')
            assert response.status_code == 200
            assert b'bar' == response.data
        nmdb.assert_called_once()
    dbw.messages.assert_called_once_with("id:foo and not tag:bar", exclude_tags=[], sort=ANY)

    mf.tags.add.assert_called_once_with("bar")
    mf.frozen.assert_called_once()

    dbw.close.assert_called_once()


def test_tag_add_thread(setup):
    app, db = setup

    mf = lambda: None
    mf.frozen = MagicMock()
    mf.tags = lambda: None
    mf.tags.add = MagicMock()

    dbw = lambda: None
    dbw.close = MagicMock()
    dbw.messages = MagicMock(return_value=iter([mf]))
    dbw.config = {}

    with patch("notmuch2.Database", return_value=dbw) as nmdb:
        with app.test_client() as test_client:
            response = test_client.get('/api/tag/add/thread/foo/bar')
            assert response.status_code == 200
            assert b'bar' == response.data
        nmdb.assert_called_once()
    dbw.messages.assert_called_once_with("thread:foo and not tag:bar", exclude_tags=[], sort=ANY)

    mf.tags.add.assert_called_once_with("bar")
    mf.frozen.assert_called_once()

    dbw.close.assert_called_once()


def test_tag_remove_message(setup):
    app, db = setup

    mf = lambda: None
    mf.frozen = MagicMock()
    mf.tags = lambda: None
    mf.tags.discard = MagicMock()

    dbw = lambda: None
    dbw.close = MagicMock()
    dbw.messages = MagicMock(return_value=iter([mf]))
    dbw.config = {}

    with patch("notmuch2.Database", return_value=dbw) as nmdb:
        with app.test_client() as test_client:
            response = test_client.get('/api/tag/remove/message/foo/bar')
            assert response.status_code == 200
            assert b'bar' == response.data
        nmdb.assert_called_once()
    dbw.messages.assert_called_once_with("id:foo and tag:bar", exclude_tags=[], sort=ANY)

    mf.tags.discard.assert_called_once_with("bar")
    mf.frozen.assert_called_once()

    dbw.close.assert_called_once()


def test_tag_remove_thread(setup):
    app, db = setup

    mf = lambda: None
    mf.frozen = MagicMock()
    mf.tags = lambda: None
    mf.tags.discard = MagicMock()

    dbw = lambda: None
    dbw.close = MagicMock()
    dbw.messages = MagicMock(return_value=iter([mf]))
    dbw.config = {}

    with patch("notmuch2.Database", return_value=dbw) as nmdb:
        with app.test_client() as test_client:
            response = test_client.get('/api/tag/remove/thread/foo/bar')
            assert response.status_code == 200
            assert b'bar' == response.data
        nmdb.assert_called_once()
    dbw.messages.assert_called_once_with("thread:foo and tag:bar", exclude_tags=[], sort=ANY)

    mf.tags.discard.assert_called_once_with("bar")
    mf.frozen.assert_called_once()

    dbw.close.assert_called_once()


def test_tags_change_message_batch(setup):
    app, db = setup

    mf = lambda: None
    mf.frozen = MagicMock()
    mf.tags = lambda: None
    mf.tags.add = MagicMock()
    mf.tags.discard = MagicMock()

    dbw = lambda: None
    dbw.close = MagicMock()
    dbw.messages = MagicMock()
    dbw.messages.side_effect = [iter([mf]), iter([mf]), iter([mf]), iter([mf])]
    dbw.config = {}

    with patch("notmuch2.Database", return_value=dbw) as nmdb:
        with app.test_client() as test_client:
            response = test_client.get('/api/tag_batch/message/foo1 foo2/bar1 -bar2')
            assert response.status_code == 200
            assert b'foo1 foo2/bar1 -bar2' == response.data
        assert nmdb.call_count == 1

    assert dbw.messages.mock_calls == [
        call('id:foo1 and not tag:bar1', exclude_tags=[], sort=ANY),
        call('id:foo1 and tag:bar2', exclude_tags=[], sort=ANY),
        call('id:foo2 and not tag:bar1', exclude_tags=[], sort=ANY),
        call('id:foo2 and tag:bar2', exclude_tags=[], sort=ANY)
    ]
    assert dbw.close.call_count == 1

    assert mf.tags.add.mock_calls == [
        call('bar1'),
        call('bar1')
    ]
    assert mf.tags.discard.mock_calls == [
        call('bar2'),
        call('bar2')
    ]
    assert mf.frozen.call_count == 4


def test_tags_add_thread_batch(setup):
    app, db = setup

    mf = lambda: None
    mf.frozen = MagicMock()
    mf.tags = lambda: None
    mf.tags.add = MagicMock()
    mf.tags.discard = MagicMock()

    dbw = lambda: None
    dbw.close = MagicMock()
    dbw.messages = MagicMock()
    dbw.messages.side_effect = [iter([mf]), iter([mf]), iter([mf]), iter([mf])]
    dbw.config = {}

    with patch("notmuch2.Database", return_value=dbw) as nmdb:
        with app.test_client() as test_client:
            response = test_client.get('/api/tag_batch/thread/foo1 foo2/bar1 -bar2')
            assert response.status_code == 200
            assert b'foo1 foo2/bar1 -bar2' == response.data
        assert nmdb.call_count == 1

    assert dbw.messages.mock_calls == [
        call('thread:foo1 and not tag:bar1', exclude_tags=[], sort=ANY),
        call('thread:foo1 and tag:bar2', exclude_tags=[], sort=ANY),
        call('thread:foo2 and not tag:bar1', exclude_tags=[], sort=ANY),
        call('thread:foo2 and tag:bar2', exclude_tags=[], sort=ANY)
    ]
    assert dbw.close.call_count == 1

    assert mf.tags.add.mock_calls == [
        call('bar1'),
        call('bar1')
    ]
    assert mf.tags.discard.mock_calls == [
        call('bar2'),
        call('bar2')
    ]
    assert mf.frozen.call_count == 4


def test_attachment_no_attachment(setup):
    app, db = setup

    mf = lambda: None
    mf.path = "test/mails/simple.eml"

    db.config = {}
    db.find = MagicMock(return_value=mf)

    with app.test_client() as test_client:
        response = test_client.get('/api/attachment/foo/0')
        assert response.status_code == 404

    db.find.assert_called_once_with("foo")


def test_attachment_invalid_index(setup):
    app, db = setup

    mf = lambda: None
    mf.path = "test/mails/attachment.eml"

    db.config = {}
    db.find = MagicMock(return_value=mf)

    with app.test_client() as test_client:
        response = test_client.get('/api/attachment/foo/1')
        assert response.status_code == 404

    db.find.assert_called_once_with("foo")


def test_attachment_single(setup):
    app, db = setup

    mf = lambda: None
    mf.path = "test/mails/attachment.eml"

    db.config = {}
    db.find = MagicMock(return_value=mf)

    with app.test_client() as test_client:
        response = test_client.get('/api/attachment/foo/0')
        assert response.status_code == 200
        assert 5368 == len(response.data)
        assert type(response.data) is bytes
        assert "application/x-gtar-compressed" == response.mimetype
        assert "inline; filename=zendesk-email-loop2.tgz" == response.headers['Content-Disposition']

    db.find.assert_called_once_with("foo")


def test_attachment_multiple(setup):
    app, db = setup

    mf = lambda: None
    mf.path = "test/mails/attachments.eml"

    db.config = {}
    db.find = MagicMock()
    db.find.side_effect = [mf, mf, mf]

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

    assert db.find.mock_calls == [
        call('foo'),
        call('foo'),
        call('foo')
    ]


def test_attachment_image_resize(setup):
    app, db = setup

    mf = lambda: None
    mf.path = "test/mails/attachment-image.eml"

    db.config = {}
    db.find = MagicMock(return_value=mf)

    with app.test_client() as test_client:
        response = test_client.get('/api/attachment/foo/0/1')
        assert response.status_code == 200
        assert 25053 == len(response.data)
        assert type(response.data) is bytes
        assert "image/png" == response.mimetype
        assert "inline; filename=filename.png" == response.headers['Content-Disposition']
        img = Image.open(io.BytesIO(response.data))
        assert (499, 402) == img.size

    db.find.assert_called_once_with("foo")


def test_attachment_image_no_resize(setup):
    app, db = setup

    mf = lambda: None
    mf.path = "test/mails/attachment-image.eml"

    db.config = {}
    db.find = MagicMock(return_value=mf)

    with app.test_client() as test_client:
        response = test_client.get('/api/attachment/foo/0/0')
        assert response.status_code == 200
        assert 94590 == len(response.data)
        assert type(response.data) is bytes
        assert "image/png" == response.mimetype
        assert "inline; filename=filename.png" == response.headers['Content-Disposition']
        img = Image.open(io.BytesIO(response.data))
        assert (1584, 1274) == img.size

    db.find.assert_called_once_with("foo")


def test_message_simple(setup):
    app, db = setup

    mf = lambda: None
    mf.path = "test/mails/simple.eml"
    mf.messageid = "foo"
    mf.tags = ["foo", "bar"]
    mf.header = MagicMock(return_value="  foo@bar  ")

    db.config = {}
    db.find = MagicMock(return_value=mf)

    with app.test_client() as test_client:
        response = test_client.get('/api/message/foo')
        assert response.status_code == 200
        msg = json.loads(response.data.decode())
        assert msg["from"] == "foo@bar"
        assert msg["to"] == ["foo@bar"]
        assert msg["cc"] == ["foo@bar"]
        assert msg["bcc"] == ["foo@bar"]
        assert msg["date"] == "foo@bar"
        assert msg["subject"] == "foo@bar"
        assert msg["message_id"] == "foo@bar"
        assert msg["in_reply_to"] == "foo@bar"
        assert msg["reply_to"] == "foo@bar"
        assert msg["delivered_to"] == "foo@bar"
        assert msg["forwarded_to"] == "foo@bar"

        assert "With the new notmuch_message_get_flags() function" in msg["body"]["text/plain"]
        assert msg["body"]["text/html"] == False

        assert msg["notmuch_id"] == "foo"
        assert msg["tags"] == ["foo", "bar"]
        assert msg["attachments"] == []
        assert msg["signature"] is None

    assert mf.header.call_count == 11
    db.find.assert_called_once_with("foo")


def test_message_simple_deleted(setup):
    app, db = setup

    mf = lambda: None
    mf.path = "test/mails/simple.eml"
    mf.messageid = "foo"
    mf.tags = ["deleted", "bar"]
    mf.header = MagicMock(return_value="  foo@bar  ")

    db.config = {}
    db.find = MagicMock(return_value=mf)

    with app.test_client() as test_client:
        response = test_client.get('/api/message/foo')
        assert response.status_code == 200
        msg = json.loads(response.data.decode())
        assert msg["from"] == "foo@bar"
        assert msg["to"] == ["foo@bar"]
        assert msg["cc"] == ["foo@bar"]
        assert msg["bcc"] == ["foo@bar"]
        assert msg["date"] == "foo@bar"
        assert msg["subject"] == "foo@bar"
        assert msg["message_id"] == "foo@bar"
        assert msg["in_reply_to"] == "foo@bar"
        assert msg["reply_to"] == "foo@bar"
        assert msg["delivered_to"] == "foo@bar"
        assert msg["forwarded_to"] == "foo@bar"

        assert "With the new notmuch_message_get_flags() function" in msg["body"]["text/plain"]
        assert msg["body"]["text/html"] == False

        assert msg["notmuch_id"] == "foo"
        assert msg["tags"] == ["deleted", "bar"]
        assert msg["attachments"] == []
        assert msg["signature"] is None

    assert mf.header.call_count == 11
    db.find.assert_called_once_with("foo")


def test_message_forwarded(setup):
    app, db = setup

    mf = lambda: None
    mf.path = "test/mails/forwarded.eml"
    mf.messageid = "foo"
    mf.tags = ["foo", "bar"]
    mf.header = MagicMock(return_value="something@other.org")

    db.config = {}
    db.find = MagicMock(return_value=mf)

    with app.test_client() as test_client:
        response = test_client.get('/api/message/foo')
        assert response.status_code == 200
        msg = json.loads(response.data.decode())
        assert msg["forwarded_to"] == "something@other.org"

        assert "With the new notmuch_message_get_flags() function" in msg["body"]["text/plain"]
        assert msg["body"]["text/html"] == False

        assert msg["notmuch_id"] == "foo"
        assert msg["tags"] == ["foo", "bar"]
        assert msg["attachments"] == []
        assert msg["signature"] is None

    assert mf.header.call_count == 11
    db.find.assert_called_once_with("foo")


def test_message_attachments(setup):
    app, db = setup

    mf = lambda: None
    mf.path = "test/mails/attachments.eml"
    mf.messageid = "foo"
    mf.tags = ["foo", "bar"]
    mf.header = MagicMock(return_value="  foo\tbar  ")

    db.config = {}
    db.find = MagicMock(return_value=mf)

    with app.test_client() as test_client:
        response = test_client.get('/api/message/foo')
        assert response.status_code == 200
        msg = json.loads(response.data.decode())
        assert msg["attachments"] == [{'content': None, 'content_size': 445, 'content_type': 'text/plain', 'filename': 'text.txt', 'preview': None},
                                      {'content': None, 'content_size': 7392, 'content_type': 'application/pdf', 'filename': 'document.pdf', 'preview': None},
                                      {'content': None, 'content_size': 2391, 'content_type': 'text/plain', 'filename': 'test.csv', 'preview': None}]

    assert mf.header.call_count == 11
    db.find.assert_called_once_with("foo")


def test_message_attachment_calendar_preview(setup):
    app, db = setup

    mf = lambda: None
    mf.path = "test/mails/calendar.eml"
    mf.messageid = "foo"
    mf.tags = ["foo", "bar"]
    mf.header = MagicMock(return_value="  foo\tbar  ")

    db.config = {}
    db.find = MagicMock(return_value=mf)

    app.config.custom["accounts"] = [{"email": "unittest@tine20.org"}]

    with app.test_client() as test_client:
        response = test_client.get('/api/message/foo')
        assert response.status_code == 200
        msg = json.loads(response.data.decode())
        assert msg["attachments"][0]['content_type'] == 'text/calendar'
        assert msg["attachments"][0]['filename'] == 'unnamed attachment'
        assert msg["attachments"][0]['preview']['method'] == "REQUEST"
        assert msg["attachments"][0]['preview']['status'] == "NEEDS-ACTION"
        assert msg["attachments"][0]['preview']['summary'] == "testevent"
        assert msg["attachments"][0]['preview']['location'] == "kskdcsd"
        assert msg["attachments"][0]['preview']['tz'] == "Europe/Berlin"
        assert msg["attachments"][0]['preview']['dtstart'] == "20111101T090000"
        assert msg["attachments"][0]['preview']['dtend'] == "20111101T100000"
        assert "Tue Nov  1 " in msg["attachments"][0]['preview']['start']
        assert "2011" in msg["attachments"][0]['preview']['start']
        assert "Tue Nov  1 " in msg["attachments"][0]['preview']['end']
        assert "2011" in msg["attachments"][0]['preview']['end']
        assert msg["attachments"][0]['preview']['recur'] == ""
        assert msg["attachments"][0]['preview']['attendees'] == "unittest, TRUE, someone"

    assert mf.header.call_count == 11
    db.find.assert_called_once_with("foo")


def test_message_attachment_calendar_preview_broken(setup):
    app, db = setup

    mf = lambda: None
    mf.path = "test/mails/calendar-broken.eml"
    mf.messageid = "foo"
    mf.tags = ["foo", "bar"]
    mf.header = MagicMock(return_value="  foo\tbar  ")

    db.config = {}
    db.find = MagicMock(return_value=mf)

    app.config.custom["accounts"] = [{"email": "unittest@tine20.org"}]

    with app.test_client() as test_client:
        response = test_client.get('/api/message/foo')
        assert response.status_code == 200
        msg = json.loads(response.data.decode())
        assert msg["attachments"][0]['content_type'] == 'text/calendar'
        assert msg["attachments"][0]['filename'] == 'unnamed attachment'
        assert msg["attachments"][0]['preview']['method'] == "REQUEST"
        assert msg["attachments"][0]['preview']['status'] == "NEEDS-ACTION"
        assert msg["attachments"][0]['preview']['summary'] == "testevent"
        assert msg["attachments"][0]['preview']['location'] == "kskdcsd"
        assert msg["attachments"][0]['preview']['tz'] == "Europe/Berlin"
        assert msg["attachments"][0]['preview']['dtstart'] == "20111101T090000"
        assert msg["attachments"][0]['preview']['dtend'] == "20111101T100000"
        assert "Tue Nov  1 " in msg["attachments"][0]['preview']['start']
        assert "2011" in msg["attachments"][0]['preview']['start']
        assert "Tue Nov  1 " in msg["attachments"][0]['preview']['end']
        assert "2011" in msg["attachments"][0]['preview']['end']
        assert msg["attachments"][0]['preview']['recur'] == ""
        assert msg["attachments"][0]['preview']['attendees'] == "unittest, TRUE"

    assert mf.header.call_count == 11
    db.find.assert_called_once_with("foo")


def test_message_attachment_calendar_preview_tz(setup):
    app, db = setup

    mf = lambda: None
    mf.path = "test/mails/calendar-tz.eml"
    mf.messageid = "foo"
    mf.tags = ["foo", "bar"]
    mf.header = MagicMock(return_value="  foo\tbar  ")

    db.config = {}
    db.find = MagicMock(return_value=mf)

    app.config.custom["accounts"] = [{"email": "unittest@tine20.org"}]

    with app.test_client() as test_client:
        response = test_client.get('/api/message/foo')
        assert response.status_code == 200
        msg = json.loads(response.data.decode())
        assert msg["attachments"][0]['content_type'] == 'text/calendar'
        assert msg["attachments"][0]['filename'] == 'unnamed attachment'
        assert msg["attachments"][0]['preview']['method'] == "REQUEST"
        assert msg["attachments"][0]['preview']['status'] == "NEEDS-ACTION"
        assert msg["attachments"][0]['preview']['summary'] == "testevent"
        assert msg["attachments"][0]['preview']['location'] == "kskdcsd"
        assert msg["attachments"][0]['preview']['tz'] == "America/New_York"
        assert msg["attachments"][0]['preview']['dtstart'] == "20111101T090000"
        assert msg["attachments"][0]['preview']['dtend'] == "20111101T100000"
        assert "Tue Nov  1 " in msg["attachments"][0]['preview']['start']
        assert "2011" in msg["attachments"][0]['preview']['start']
        assert "Tue Nov  1 " in msg["attachments"][0]['preview']['end']
        assert "2011" in msg["attachments"][0]['preview']['end']
        assert msg["attachments"][0]['preview']['recur'] == ""
        assert msg["attachments"][0]['preview']['attendees'] == "unittest, TRUE"

    assert mf.header.call_count == 11
    db.find.assert_called_once_with("foo")


def test_message_attachment_calendar_preview_no_attendees(setup):
    app, db = setup

    mf = lambda: None
    mf.path = "test/mails/calendar-noattendees.eml"
    mf.messageid = "foo"
    mf.tags = ["foo", "bar"]
    mf.header = MagicMock(return_value="  foo\tbar  ")

    db.config = {}
    db.find = MagicMock(return_value=mf)

    app.config.custom["accounts"] = [{"email": "unittest@tine20.org"}]

    with app.test_client() as test_client:
        response = test_client.get('/api/message/foo')
        assert response.status_code == 200
        msg = json.loads(response.data.decode())
        assert msg["attachments"][0]['content_type'] == 'text/calendar'
        assert msg["attachments"][0]['filename'] == 'unnamed attachment'
        assert msg["attachments"][0]['preview']['method'] == "REQUEST"
        assert msg["attachments"][0]['preview']['status'] == None
        assert msg["attachments"][0]['preview']['summary'] == "testevent"
        assert msg["attachments"][0]['preview']['location'] == "kskdcsd"
        assert msg["attachments"][0]['preview']['tz'] == "Europe/Berlin"
        assert msg["attachments"][0]['preview']['dtstart'] == "20111101T090000"
        assert msg["attachments"][0]['preview']['dtend'] == "20111101T100000"
        assert "Tue Nov  1 " in msg["attachments"][0]['preview']['start']
        assert "2011" in msg["attachments"][0]['preview']['start']
        assert "Tue Nov  1 " in msg["attachments"][0]['preview']['end']
        assert "2011" in msg["attachments"][0]['preview']['end']
        assert msg["attachments"][0]['preview']['recur'] == ""
        assert msg["attachments"][0]['preview']['attendees'] == "unittest"

    assert mf.header.call_count == 11
    db.find.assert_called_once_with("foo")


def test_message_attachment_calendar_preview_no_people(setup):
    app, db = setup

    mf = lambda: None
    mf.path = "test/mails/calendar-nopeople.eml"
    mf.messageid = "foo"
    mf.tags = ["foo", "bar"]
    mf.header = MagicMock(return_value="  foo\tbar  ")

    db.config = {}
    db.find = MagicMock(return_value=mf)

    app.config.custom["accounts"] = [{"email": "unittest@tine20.org"}]

    with app.test_client() as test_client:
        response = test_client.get('/api/message/foo')
        assert response.status_code == 200
        msg = json.loads(response.data.decode())
        assert msg["attachments"][0]['content_type'] == 'text/calendar'
        assert msg["attachments"][0]['filename'] == 'unnamed attachment'
        assert msg["attachments"][0]['preview']['method'] == "REQUEST"
        assert msg["attachments"][0]['preview']['status'] == None
        assert msg["attachments"][0]['preview']['summary'] == "testevent"
        assert msg["attachments"][0]['preview']['location'] == "kskdcsd"
        assert msg["attachments"][0]['preview']['tz'] == "Europe/Berlin"
        assert msg["attachments"][0]['preview']['dtstart'] == "20111101T090000"
        assert msg["attachments"][0]['preview']['dtend'] == "20111101T100000"
        assert "Tue Nov  1 " in msg["attachments"][0]['preview']['start']
        assert "2011" in msg["attachments"][0]['preview']['start']
        assert "Tue Nov  1 " in msg["attachments"][0]['preview']['end']
        assert "2011" in msg["attachments"][0]['preview']['end']
        assert msg["attachments"][0]['preview']['recur'] == ""
        assert msg["attachments"][0]['preview']['attendees'] == ""

    assert mf.header.call_count == 11
    db.find.assert_called_once_with("foo")


def test_message_attachment_calendar_preview_no_time(setup):
    app, db = setup

    mf = lambda: None
    mf.path = "test/mails/calendar-notime.eml"
    mf.messageid = "foo"
    mf.tags = ["foo", "bar"]
    mf.header = MagicMock(return_value="  foo\tbar  ")

    db.config = {}
    db.find = MagicMock(return_value=mf)

    app.config.custom["accounts"] = [{"email": "unittest@tine20.org"}]

    with app.test_client() as test_client:
        response = test_client.get('/api/message/foo')
        assert response.status_code == 200
        msg = json.loads(response.data.decode())
        assert msg["attachments"][0]['content_type'] == 'text/calendar'
        assert msg["attachments"][0]['filename'] == 'unnamed attachment'
        assert msg["attachments"][0]['preview']['method'] == "REQUEST"
        assert msg["attachments"][0]['preview']['status'] == None
        assert msg["attachments"][0]['preview']['summary'] == "testevent"
        assert msg["attachments"][0]['preview']['location'] == "kskdcsd"
        assert msg["attachments"][0]['preview']['dtstart'] == "19700329"
        assert msg["attachments"][0]['preview']['dtend'] == "19700330"
        assert "Sun Mar 29 " in msg["attachments"][0]['preview']['start']
        assert "1970" in msg["attachments"][0]['preview']['start']
        assert "Mon Mar 30 " in msg["attachments"][0]['preview']['end']
        assert "1970" in msg["attachments"][0]['preview']['end']

    assert mf.header.call_count == 11
    db.find.assert_called_once_with("foo")


def test_message_attachment_calendar_preview_recur(setup):
    app, db = setup

    mf = lambda: None
    mf.path = "test/mails/calendar-recur.eml"
    mf.messageid = "foo"
    mf.tags = ["foo", "bar"]
    mf.header = MagicMock(return_value="  foo\tbar  ")

    db.config = {}
    db.find = MagicMock(return_value=mf)

    app.config.custom["accounts"] = [{"email": "unittest@tine20.org"}]

    with app.test_client() as test_client:
        response = test_client.get('/api/message/foo')
        assert response.status_code == 200
        msg = json.loads(response.data.decode())
        assert msg["attachments"][0]['content_type'] == 'text/calendar'
        assert msg["attachments"][0]['filename'] == 'unnamed attachment'
        assert msg["attachments"][0]['preview']['method'] == "REQUEST"
        assert msg["attachments"][0]['preview']['status'] == "NEEDS-ACTION"
        assert msg["attachments"][0]['preview']['summary'] == "testevent"
        assert msg["attachments"][0]['preview']['location'] == "kskdcsd"
        assert msg["attachments"][0]['preview']['tz'] == "Europe/Berlin"
        assert msg["attachments"][0]['preview']['dtstart'] == "20111101T090000"
        assert msg["attachments"][0]['preview']['dtend'] == "20111101T100000"
        assert "Tue Nov  1 " in msg["attachments"][0]['preview']['start']
        assert "2011" in msg["attachments"][0]['preview']['start']
        assert "Tue Nov  1 " in msg["attachments"][0]['preview']['end']
        assert "2011" in msg["attachments"][0]['preview']['end']
        assert msg["attachments"][0]['preview']['recur'] == "every last Sun in Oct"
        assert msg["attachments"][0]['preview']['attendees'] == "unittest, TRUE"

    assert mf.header.call_count == 11
    db.find.assert_called_once_with("foo")


def test_message_attachment_calendar_preview_request_accepted(setup):
    app, db = setup

    mf = lambda: None
    mf.path = "test/mails/calendar-accepted.eml"
    mf.messageid = "foo"
    mf.tags = ["foo", "bar"]
    mf.header = MagicMock(return_value="  foo\tbar  ")

    db.config = {}
    db.find = MagicMock(return_value=mf)

    app.config.custom["accounts"] = [{"email": "unittest@tine20.org"}]

    with app.test_client() as test_client:
        response = test_client.get('/api/message/foo')
        assert response.status_code == 200
        msg = json.loads(response.data.decode())
        assert msg["attachments"][0]['content_type'] == 'text/calendar'
        assert msg["attachments"][0]['filename'] == 'unnamed attachment'
        assert msg["attachments"][0]['preview']['method'] == "REQUEST"
        assert msg["attachments"][0]['preview']['status'] == "ACCEPTED"
        assert msg["attachments"][0]['preview']['summary'] == "testevent"
        assert msg["attachments"][0]['preview']['location'] == "kskdcsd"
        assert msg["attachments"][0]['preview']['tz'] == "Europe/Berlin"
        assert msg["attachments"][0]['preview']['dtstart'] == "20111101T090000"
        assert msg["attachments"][0]['preview']['dtend'] == "20111101T100000"
        assert "Tue Nov  1 " in msg["attachments"][0]['preview']['start']
        assert "2011" in msg["attachments"][0]['preview']['start']
        assert "Tue Nov  1 " in msg["attachments"][0]['preview']['end']
        assert "2011" in msg["attachments"][0]['preview']['end']
        assert msg["attachments"][0]['preview']['recur'] == ""
        assert msg["attachments"][0]['preview']['attendees'] == "unittest, TRUE"

    assert mf.header.call_count == 11
    db.find.assert_called_once_with("foo")


def test_message_attachment_calendar_preview_reply_accepted(setup):
    app, db = setup

    mf = lambda: None
    mf.path = "test/mails/calendar-reply-accepted.eml"
    mf.messageid = "foo"
    mf.tags = ["foo", "bar"]
    mf.header = MagicMock(return_value="  foo\tbar  ")

    db.config = {}
    db.find = MagicMock(return_value=mf)

    app.config.custom["accounts"] = [{"email": "unittest@tine20.org"}]

    with app.test_client() as test_client:
        response = test_client.get('/api/message/foo')
        assert response.status_code == 200
        msg = json.loads(response.data.decode())
        assert msg["attachments"][0]['content_type'] == 'text/calendar'
        assert msg["attachments"][0]['filename'] == 'unnamed attachment'
        assert msg["attachments"][0]['preview']['method'] == "REPLY"
        assert msg["attachments"][0]['preview']['status'] == "ACCEPTED"
        assert msg["attachments"][0]['preview']['summary'] == "testevent"
        assert msg["attachments"][0]['preview']['location'] == "kskdcsd"
        assert msg["attachments"][0]['preview']['tz'] == "Europe/Berlin"
        assert msg["attachments"][0]['preview']['dtstart'] == "20111101T090000"
        assert msg["attachments"][0]['preview']['dtend'] == "20111101T100000"
        assert "Tue Nov  1 " in msg["attachments"][0]['preview']['start']
        assert "2011" in msg["attachments"][0]['preview']['start']
        assert "Tue Nov  1 " in msg["attachments"][0]['preview']['end']
        assert "2011" in msg["attachments"][0]['preview']['end']
        assert msg["attachments"][0]['preview']['recur'] == ""
        assert msg["attachments"][0]['preview']['attendees'] == "unittest, TRUE"

    assert mf.header.call_count == 11
    db.find.assert_called_once_with("foo")


@pytest.mark.skipif(IN_GITHUB_ACTIONS, reason="No CA certs on Github.")
def test_message_signed_self(setup):
    app, db = setup

    mf = lambda: None
    mf.path = "test/mails/signed.eml"
    mf.messageid = "foo"
    mf.tags = ["foo", "bar"]
    mf.header = MagicMock(return_value="  foo\tbar  ")

    db.config = {}
    db.find = MagicMock(return_value=mf)

    app.config.custom["accounts"] = []

    with app.test_client() as test_client:
        response = test_client.get('/api/message/foo')
        assert response.status_code == 200
        msg = json.loads(response.data.decode())
        assert "Bob, we need to cancel this contract." in msg["body"]["text/plain"]

        assert msg["signature"] == {'message': 'self-signed or unavailable certificate(s): validation failed: required EKU not found (encountered processing <Certificate(subject=<Name(CN=Alice Lovelace)>, ...)>)', 'valid': None}

    assert mf.header.call_count == 11
    db.find.assert_called_once_with("foo")


@pytest.mark.skipif(IN_GITHUB_ACTIONS, reason="No CA certs on Github.")
def test_message_signed_expired(setup):
    app, db = setup

    mf = lambda: None
    mf.path = "test/mails/signed-attachment.eml"
    mf.messageid = "foo"
    mf.tags = ["foo", "bar"]
    mf.header = MagicMock(return_value="  foo\tbar  ")

    db.config = {}
    db.find = MagicMock(return_value=mf)

    app.config.custom["accounts"] = []

    with app.test_client() as test_client:
        response = test_client.get('/api/message/foo')
        assert response.status_code == 200
        msg = json.loads(response.data.decode())
        assert "Invio messaggio SMIME (signed and clear text)" in msg["body"]["text/plain"]

        assert msg["signature"] == {'message': 'invalid signature: validation failed: cert is not valid at validation time (encountered processing <Certificate(subject=<Name(CN=shatzing5@outlook.com)>, ...)>)', 'valid': False}

    assert mf.header.call_count == 11
    db.find.assert_called_once_with("foo")


@pytest.mark.skipif(IN_GITHUB_ACTIONS, reason="No CA certs on Github.")
def test_message_signed_invalid(setup):
    app, db = setup

    mf = lambda: None
    mf.path = "test/mails/signed-invalid.eml"
    mf.messageid = "foo"
    mf.tags = ["foo", "bar"]
    mf.header = MagicMock(return_value="  foo\tbar  ")

    db.config = {}
    db.find = MagicMock(return_value=mf)

    app.config.custom["accounts"] = []

    with app.test_client() as test_client:
        response = test_client.get('/api/message/foo')
        assert response.status_code == 200
        msg = json.loads(response.data.decode())
        assert "Bob, we need to cancel this contract." in msg["body"]["text/plain"]
        assert msg["signature"] == {'message': 'invalid signature: validation failed: required EKU not found (encountered processing <Certificate(subject=<Name(CN=Alice Lovelace)>, ...)>)', 'valid': False}

    assert mf.header.call_count == 11
    db.find.assert_called_once_with("foo")


@pytest.mark.skipif(IN_GITHUB_ACTIONS, reason="Fails on Github.")
def test_message_signed_pgp(setup):
    app, db = setup

    mf = lambda: None
    mf.path = "test/mails/signed-pgp.eml"
    mf.messageid = "foo"
    mf.tags = ["foo", "bar"]
    mf.header = MagicMock(return_value="Pierre THIERRY <nowhere.man@levallois.eu.org>")

    db.config = {}
    db.find = MagicMock(return_value=mf)

    app.config.custom["accounts"] = []

    with app.test_client() as test_client:
        response = test_client.get('/api/message/foo')
        assert response.status_code == 200
        msg = json.loads(response.data.decode())
        assert "Actually, the text seems to say the contrary" in msg["body"]["text/plain"]

        assert msg["signature"] == {'valid': True}

    assert mf.header.call_count == 11
    db.find.assert_called_once_with("foo")


def test_message_html_only(setup):
    app, db = setup

    mf = lambda: None
    mf.path = "test/mails/html-only.eml"
    mf.messageid = "foo"
    mf.tags = ["foo", "bar"]
    mf.header = MagicMock(return_value="  foo\tbar  ")

    db.config = {}
    db.find = MagicMock(return_value=mf)

    with app.test_client() as test_client:
        response = test_client.get('/api/message/foo')
        assert response.status_code == 200
        msg = json.loads(response.data.decode())
        assert "hunter2" == msg["body"]["text/plain"]
        assert msg["body"]["text/html"] == True

    assert mf.header.call_count == 11
    db.find.assert_called_once_with("foo")


def test_message_html_broken(setup):
    app, db = setup

    mf = lambda: None
    mf.path = "test/mails/broken-text.eml"
    mf.messageid = "foo"
    mf.tags = ["foo", "bar"]
    mf.header = MagicMock(return_value="  foo\tbar  ")

    db.config = {}
    db.find = MagicMock(return_value=mf)

    with app.test_client() as test_client:
        response = test_client.get('/api/message/foo')
        assert response.status_code == 200
        msg = json.loads(response.data.decode())
        assert "hunter2" == msg["body"]["text/plain"]
        assert msg["body"]["text/html"] == False

    assert mf.header.call_count == 11
    db.find.assert_called_once_with("foo")


def test_message_filter_text(setup):
    app, db = setup

    mf = lambda: None
    mf.path = "test/mails/simple.eml"
    mf.messageid = "foo"
    mf.tags = ["foo", "bar"]
    mf.header = MagicMock(return_value="  foo\tbar  ")

    db.config = {}
    db.find = MagicMock(return_value=mf)

    app.config.custom["filter"] = {}
    app.config.custom["filter"]["content"] = {}
    app.config.custom["filter"]["content"]["text/plain"] = ["notmuch_message_get_flags", "somefunc"]

    with app.test_client() as test_client:
        response = test_client.get('/api/message/foo')
        assert response.status_code == 200
        msg = json.loads(response.data.decode())
        assert "somefunc" in msg["body"]["text/plain"]
        assert "notmuch_message_get_flags" not in msg["body"]["text/plain"]

    assert mf.header.call_count == 11
    db.find.assert_called_once_with("foo")


def test_message_attachment_mail(setup):
    app, db = setup

    mf = lambda: None
    mf.path = "test/mails/mail_nested.eml"

    db.config = {}
    db.find = MagicMock(return_value=mf)

    with app.test_client() as test_client:
        response = test_client.get('/api/attachment_message/foo/0')
        assert response.status_code == 200
        msg = json.loads(response.data.decode())
        assert msg["from"] == "POSTBAN͟K͟ <gxnwgddl@carcarry.de>"
        assert msg["to"] == ["2012gdwu <2012gdwu@web.de>"]
        assert msg["cc"] == []
        assert msg["bcc"] == []
        assert msg["date"] == "Mon, 20 Jul 2020 02:15:26 +0000"
        assert msg["subject"] == "BsetSign App : Y7P32-HTXU2-FRDG7"
        assert msg["message_id"] == "<1M3lHZ-1jyAPt0pTn-000u1I@mrelayeu.kundenserver.de>"
        assert msg["in_reply_to"] == None
        assert msg["reply_to"] == None
        assert msg["delivered_to"] == "arne.keller@posteo.de"
        assert msg["forwarded_to"] == None

        assert "Öffnen Sie den unten stehenden Aktivierungslink" in msg["body"]["text/plain"]
        assert msg["body"]["text/html"] == True

        assert msg["notmuch_id"] == None
        assert msg["tags"] == []
        assert msg["attachments"] == []
        assert msg["signature"] is None

    db.find.assert_called_once_with("foo")


def test_message_html_simple(setup):
    app, db = setup

    mf = lambda: None
    mf.path = "test/mails/html-only.eml"

    db.config = {}
    db.find = MagicMock(return_value=mf)

    with app.test_client() as test_client:
        response = test_client.get('/api/message_html/foo')
        assert response.status_code == 200
        assert response.data == b'<div>\n  <body>\n    \n  </body><p>\n  hunter2\n</p></div>'

    db.find.assert_called_once_with("foo")


def test_message_html_none(setup):
    app, db = setup

    mf = lambda: None
    mf.path = "test/mails/simple.eml"

    db.config = {}
    db.find = MagicMock(return_value=mf)

    with app.test_client() as test_client:
        response = test_client.get('/api/message_html/foo')
        assert response.status_code == 200
        assert response.data == b''

    db.find.assert_called_once_with("foo")


def test_message_html_link_scrubbing(setup):
    app, db = setup

    mf = lambda: None
    mf.path = "test/mails/clean-html.eml"

    db.config = {}
    db.find = MagicMock(return_value=mf)

    with app.test_client() as test_client:
        response = test_client.get('/api/message_html/foo')
        assert response.status_code == 200
        assert "https://example.com" in str(response.data)
        assert "https://tracking.com" not in str(response.data)
        assert "http://image.com" not in str(response.data)

    db.find.assert_called_once_with("foo")


def test_message_html_filter_html(setup):
    app, db = setup

    mf = lambda: None
    mf.path = "test/mails/html-only.eml"

    db.config = {}
    db.find = MagicMock(return_value=mf)

    app.config.custom["filter"] = {}
    app.config.custom["filter"]["content"] = {}
    app.config.custom["filter"]["content"]["text/html"] = ['<input value="a>swordfish">', "meat"]

    with app.test_client() as test_client:
        response = test_client.get('/api/message_html/foo')
        assert response.status_code == 200
        assert "meat" in str(response.data)
        assert "swordfish" not in str(response.data)

    db.find.assert_called_once_with("foo")


def test_thread(setup):
    app, db = setup

    mf = lambda: None
    mf.path = "test/mails/simple.eml"
    mf.messageid = "foo"
    mf.tags = ["foo", "bar"]
    mf.header = MagicMock(return_value="  foo@bar  ")

    db.config = {}
    db.messages = MagicMock(return_value=iter([mf]))

    with app.test_client() as test_client:
        response = test_client.get('/api/thread/foo')
        assert response.status_code == 200
        msgs = json.loads(response.data.decode())
        assert len(msgs) == 1
        msg = msgs[0]
        assert msg["from"] == "foo@bar"
        assert msg["to"] == ["foo@bar"]
        assert msg["cc"] == ["foo@bar"]
        assert msg["bcc"] == ["foo@bar"]
        assert msg["date"] == "foo@bar"
        assert msg["subject"] == "foo@bar"
        assert msg["message_id"] == "foo@bar"
        assert msg["in_reply_to"] == "foo@bar"
        assert msg["reply_to"] == "foo@bar"
        assert msg["delivered_to"] == "foo@bar"
        assert msg["forwarded_to"] == "foo@bar"

        assert "With the new notmuch_message_get_flags() function" in msg["body"]["text/plain"]
        assert msg["body"]["text/html"] == False

        assert msg["notmuch_id"] == "foo"
        assert msg["tags"] == ["foo", "bar"]
        assert msg["attachments"] == []
        assert msg["signature"] is None

    assert mf.header.call_count == 11
    db.messages.assert_called_once_with("thread:foo", exclude_tags=[],
                                        sort=notmuch2.Database.SORT.OLDEST_FIRST)


def test_thread_deleted(setup):
    app, db = setup

    mf = lambda: None
    mf.path = "test/mails/simple.eml"
    mf.messageid = "foo"
    mf.tags = ["deleted", "bar"]
    mf.header = MagicMock(return_value="  foo@bar  ")

    db.config = {}
    db.messages = MagicMock(return_value=iter([mf]))

    with app.test_client() as test_client:
        response = test_client.get('/api/thread/foo')
        assert response.status_code == 200
        msgs = json.loads(response.data.decode())
        assert len(msgs) == 1
        msg = msgs[0]
        assert msg["from"] == "foo@bar"
        assert msg["to"] == ["foo@bar"]
        assert msg["cc"] == ["foo@bar"]
        assert msg["bcc"] == ["foo@bar"]
        assert msg["date"] == "foo@bar"
        assert msg["subject"] == "foo@bar"
        assert msg["message_id"] == "foo@bar"
        assert msg["in_reply_to"] == "foo@bar"
        assert msg["reply_to"] == "foo@bar"
        assert msg["delivered_to"] == "foo@bar"
        assert msg["forwarded_to"] == "foo@bar"

        assert "(deleted message)" in msg["body"]["text/plain"]
        assert msg["body"]["text/html"] == False

        assert msg["notmuch_id"] == "foo"
        assert msg["tags"] == ["deleted", "bar"]
        assert msg["attachments"] == []
        assert msg["signature"] is None

    assert mf.header.call_count == 11
    db.messages.assert_called_once_with("thread:foo", exclude_tags=[],
                                        sort=notmuch2.Database.SORT.OLDEST_FIRST)


def test_thread_none(setup):
    app, db = setup

    db.config = {}
    db.messages = MagicMock(return_value=iter([]))

    with app.test_client() as test_client:
        response = test_client.get('/api/thread/foo')
        assert response.status_code == 200
        thread = json.loads(response.data.decode())
        assert len(thread) == 0

    db.messages.assert_called_once_with("thread:foo", exclude_tags=[],
                                        sort=notmuch2.Database.SORT.OLDEST_FIRST)


def test_external_editor(setup):
    app, db = setup

    pd = {"body": "foobar"}

    app.config.custom["compose"] = {}
    app.config.custom["compose"]["external-editor"] = "true"

    fname = ""

    with patch("os.unlink", return_value=None) as u:
        with patch("builtins.open", mock_open(read_data="barfoo")) as o:
            with app.test_client() as test_client:
                response = test_client.post('/api/edit_external', data=pd)
                assert response.status_code == 200
                assert response.data == b'barfoo'
            u.assert_called_once()
            o.assert_called_once()
            args = o.call_args.args
            assert "kukulkan-tmp-" in args[0]
            fname = args[0]

    tmp = open(fname)
    assert tmp.read() == "foobar"
    tmp.close()
    os.unlink(fname)


def test_send(setup):
    app, _ = setup

    mf = lambda: None
    mf.tags = lambda: None
    mf.tags.add = MagicMock()

    dbw = lambda: None
    dbw.close = MagicMock()
    dbw.atomic = MagicMock()
    dbw.add = MagicMock(return_value=(mf, 0))
    dbw.config = {}

    pd = {"from": "foo", "to": "bar@bar.com", "cc": "", "bcc": "", "subject": "test",
          "body": "foobar", "action": "compose", "tags": "foo,bar"}

    app.config.custom["accounts"] = [{"id": "foo",
                                      "name": "Foo Bar",
                                      "email": "foo@bar.com",
                                      "sendmail": "cat",
                                      "save_sent_to": "folder",
                                      "additional_sent_tags": ["test"]}]

    with patch("notmuch2.Database", return_value=dbw) as nmdb:
        with patch("builtins.open", mock_open()) as o:
            text = None
            with app.test_client() as test_client:
                response = test_client.post('/api/send', data=pd)
                assert response.status_code == 202
                sid = response.json["send_id"]
                assert sid != None
                response = test_client.get(f'/api/send_progress/{sid}', headers={'Accept': 'text/event-stream'})
                assert response.status_code == 200
                status = None
                response_iter = response.response.__iter__()
                try:
                    while (chunk := next(response_iter)) is not None:
                        lines = chunk.decode().strip().split('\n\n')
                        for line in lines:
                            if line.startswith('data: '):
                                data = json.loads(line[6:])
                                if 'send_status' in data and data['send_status'] != 'sending':
                                    status = data['send_status']
                                    text = data['send_output']
                                    break
                except StopIteration:
                    pass
                assert status == 0
                assert "Content-Type: text/plain; charset=\"utf-8\"" in text
                assert "Content-Transfer-Encoding: 7bit" in text
                assert "MIME-Version: 1.0" in text
                assert "Subject: test" in text
                assert "From: Foo Bar <foo@bar.com>" in text
                assert "To: bar" in text
                assert "Cc:" in text
                assert "Bcc:" in text
                assert "Date: " in text
                assert "Message-ID: <" in text
                assert "\n\nfoobar\n" in text
            o.assert_called_once()
            args = o.call_args.args
            assert "kukulkan" in args[0]
            assert "folder/" in args[0]
            assert ":2,S" in args[0]
            assert args[1] == "w"
            hdl = o()
            hdl.write.assert_called_once()
            args = hdl.write.call_args.args
            assert text == args[0]

    nmdb.assert_called_once()

    assert mf.tags.add.mock_calls == [
        call('foo'),
        call('bar'),
        call('test'),
        call('sent')
    ]

    dbw.add.assert_called_once()
    args = dbw.add.call_args.args
    assert "kukulkan" in args[0]
    assert "folder/" in args[0]
    assert ":2,S" in args[0]
    dbw.atomic.assert_called_once()
    dbw.close.assert_called_once()


def test_send_no_save_sent_to(setup):
    app, _ = setup

    mf = lambda: None
    mf.tags = lambda: None
    mf.tags.add = MagicMock()

    dbw = lambda: None
    dbw.close = MagicMock()
    dbw.atomic = MagicMock()
    dbw.add = MagicMock(return_value=(mf, 0))
    dbw.config = {"database.path": "dbpath"}

    pd = {"from": "foo", "to": "bar@bar.com", "cc": "", "bcc": "", "subject": "test",
          "body": "foobar", "action": "compose", "tags": "foo,bar"}

    app.config.custom["accounts"] = [{"id": "foo",
                                      "name": "Foo Bar",
                                      "email": "foo@bar.com",
                                      "sendmail": "cat",
                                      "additional_sent_tags": ["test"]}]

    with patch("notmuch2.Database", return_value=dbw) as nmdb:
        with patch("builtins.open", mock_open()) as o:
            text = None
            with app.test_client() as test_client:
                response = test_client.post('/api/send', data=pd)
                assert response.status_code == 202
                sid = response.json["send_id"]
                assert sid != None
                response = test_client.get(f'/api/send_progress/{sid}', headers={'Accept': 'text/event-stream'})
                assert response.status_code == 200
                status = None
                response_iter = response.response.__iter__()
                try:
                    while (chunk := next(response_iter)) is not None:
                        lines = chunk.decode().strip().split('\n\n')
                        for line in lines:
                            if line.startswith('data: '):
                                data = json.loads(line[6:])
                                if 'send_status' in data and data['send_status'] != 'sending':
                                    status = data['send_status']
                                    text = data['send_output']
                                    break
                except StopIteration:
                    pass
                assert status == 0
            o.assert_called_once()
            args = o.call_args.args
            assert "kukulkan" in args[0]
            assert "dbpath/" in args[0]
            assert ":2,S" in args[0]
            assert args[1] == "w"

    assert nmdb.call_count == 2

    dbw.add.assert_called_once()
    args = dbw.add.call_args.args
    assert "kukulkan" in args[0]
    assert "dbpath/" in args[0]
    assert ":2,S" in args[0]
    dbw.atomic.assert_called_once()
    assert dbw.close.call_count == 2


def test_send_no_save_sent_to_no_db_path(setup):
    app, _ = setup

    mf = lambda: None
    mf.tags = lambda: None
    mf.tags.add = MagicMock()

    dbw = lambda: None
    dbw.close = MagicMock()
    dbw.atomic = MagicMock()
    dbw.add = MagicMock(return_value=(mf, 0))
    dbw.config = {}

    pd = {"from": "foo", "to": "bar@bar.com", "cc": "", "bcc": "", "subject": "test",
          "body": "foobar", "action": "compose", "tags": "foo,bar"}

    app.config.custom["accounts"] = [{"id": "foo",
                                      "name": "Foo Bar",
                                      "email": "foo@bar.com",
                                      "sendmail": "cat",
                                      "additional_sent_tags": ["test"]}]

    with patch("notmuch2.Database", return_value=dbw) as nmdb:
        with patch("builtins.open", mock_open()) as o:
            text = None
            with app.test_client() as test_client:
                response = test_client.post('/api/send', data=pd)
                assert response.status_code == 202
                sid = response.json["send_id"]
                assert sid != None
                response = test_client.get(f'/api/send_progress/{sid}', headers={'Accept': 'text/event-stream'})
                assert response.status_code == 200
                status = None
                response_iter = response.response.__iter__()
                try:
                    while (chunk := next(response_iter)) is not None:
                        lines = chunk.decode().strip().split('\n\n')
                        for line in lines:
                            if line.startswith('data: '):
                                data = json.loads(line[6:])
                                if 'send_status' in data and data['send_status'] != 'sending':
                                    status = data['send_status']
                                    text = data['send_output']
                                    break
                except StopIteration:
                    pass
                assert status == 0
            o.assert_called_once()
            args = o.call_args.args
            assert "kukulkan" in args[0]
            assert "/" not in args[0]
            assert ":2,S" in args[0]
            assert args[1] == "w"

    assert nmdb.call_count == 2

    dbw.add.assert_called_once()
    args = dbw.add.call_args.args
    assert "kukulkan" in args[0]
    assert "/" not in args[0]
    assert ":2,S" in args[0]
    dbw.atomic.assert_called_once()
    assert dbw.close.call_count == 2


def test_send_no_account(setup):
    app, _ = setup

    pd = {"from": "foo", "to": "bar@bar.com", "cc": "", "bcc": "", "subject": "test",
          "body": "foobar", "action": "compose", "tags": "foo,bar"}

    with app.test_client() as test_client:
        try:
            test_client.post('/api/send', data=pd)
            assert False
        except ValueError as e:
            assert str(e) == "Unable to find matching account in config!"


@pytest.mark.skipif(IN_GITHUB_ACTIONS, reason="Doesn't base64 encode and messes up UTF8.")
def test_send_base64_transfer(setup):
    app, db = setup

    mf = lambda: None
    mf.tags = lambda: None
    mf.tags.add = MagicMock()

    dbw = lambda: None
    dbw.close = MagicMock()
    dbw.atomic = MagicMock()
    dbw.add = MagicMock(return_value=(mf, 0))
    dbw.config = {}

    pd = {"from": "foo", "to": "bar@bar.com", "cc": "", "bcc": "", "subject": "test",
          "body": "täst", "action": "compose", "tags": "foo,bar"}

    app.config.custom["accounts"] = [{"id": "foo",
                                      "name": "Foo Bar",
                                      "email": "foo@bar.com",
                                      "sendmail": "cat",
                                      "save_sent_to": "folder",
                                      "additional_sent_tags": ["test"]}]

    with patch("notmuch2.Database", return_value=dbw) as nmdb:
        with patch("builtins.open", mock_open()) as o:
            text = None
            with app.test_client() as test_client:
                response = test_client.post('/api/send', data=pd)
                assert response.status_code == 202
                sid = response.json["send_id"]
                assert sid != None
                response = test_client.get(f'/api/send_progress/{sid}', headers={'Accept': 'text/event-stream'})
                assert response.status_code == 200
                status = None
                response_iter = response.response.__iter__()
                try:
                    while (chunk := next(response_iter)) is not None:
                        lines = chunk.decode().strip().split('\n\n')
                        for line in lines:
                            if line.startswith('data: '):
                                data = json.loads(line[6:])
                                if 'send_status' in data and data['send_status'] != 'sending':
                                    status = data['send_status']
                                    text = data['send_output']
                                    break
                except StopIteration:
                    pass
                assert status == 0
                assert "Content-Type: text/plain; charset=\"utf-8\"" in text
                assert "Content-Transfer-Encoding: base64" in text
                assert "MIME-Version: 1.0" in text
                assert "Subject: test" in text
                assert "From: Foo Bar <foo@bar.com>" in text
                assert "To: bar" in text
                assert "Cc:" in text
                assert "Bcc:" in text
                assert "Date: " in text
                assert "Message-ID: <" in text
                assert "\n\ndMOkc3QK\n" in text
            o.assert_called_once()
            args = o.call_args.args
            assert "kukulkan" in args[0]
            assert "folder/" in args[0]
            assert ":2,S" in args[0]
            assert args[1] == "w"
            hdl = o()
            hdl.write.assert_called_once()
            args = hdl.write.call_args.args
            assert text == args[0]

    nmdb.assert_called_once()

    assert mf.tags.add.mock_calls == [
        call('foo'),
        call('bar'),
        call('test'),
        call('sent')
    ]

    dbw.add.assert_called_once()
    args = dbw.add.call_args.args
    assert "kukulkan" in args[0]
    assert "folder/" in args[0]
    assert ":2,S" in args[0]
    dbw.atomic.assert_called_once()
    dbw.close.assert_called_once()


def test_send_addresses(setup):
    app, _ = setup

    mf = lambda: None
    mf.tags = lambda: None
    mf.tags.add = MagicMock()

    dbw = lambda: None
    dbw.close = MagicMock()
    dbw.atomic = MagicMock()
    dbw.add = MagicMock(return_value=(mf, 0))
    dbw.config = {}

    pd = {"from": "foo", "to": "Foo bar <foo@bar.com>\ntäst <test@bar.com>", "cc": "Föö, Bår <foo@bar.com>",
          "bcc": "Føø Bär <foo@bar.com>\n<test@test.com>\ntest1@test1.com", "subject": "test",
          "body": "foobar", "action": "compose", "tags": "foo,bar"}

    app.config.custom["accounts"] = [{"id": "foo",
                                      "name": "Foo Bar",
                                      "email": "foo@bar.com",
                                      "sendmail": "cat",
                                      "save_sent_to": "folder",
                                      "additional_sent_tags": ["test"]}]

    with patch("notmuch2.Database", return_value=dbw) as nmdb:
        with patch("builtins.open", mock_open()) as o:
            text = None
            with app.test_client() as test_client:
                response = test_client.post('/api/send', data=pd)
                assert response.status_code == 202
                sid = response.json["send_id"]
                assert sid != None
                response = test_client.get(f'/api/send_progress/{sid}', headers={'Accept': 'text/event-stream'})
                assert response.status_code == 200
                status = None
                response_iter = response.response.__iter__()
                try:
                    while (chunk := next(response_iter)) is not None:
                        lines = chunk.decode().strip().split('\n\n')
                        for line in lines:
                            if line.startswith('data: '):
                                data = json.loads(line[6:])
                                if 'send_status' in data and data['send_status'] != 'sending':
                                    status = data['send_status']
                                    text = data['send_output']
                                    break
                except StopIteration:
                    pass
                assert status == 0
                assert "Content-Type: text/plain; charset=\"utf-8\"" in text
                assert "Content-Transfer-Encoding: 7bit" in text
                assert "MIME-Version: 1.0" in text
                assert "Subject: test" in text
                assert "From: Foo Bar <foo@bar.com>" in text
                assert "To: Foo bar <foo@bar.com>, täst <test@bar.com>" in text
                assert "Cc: \"Föö, Bår\" <foo@bar.com>" in text
                assert "Bcc: Føø Bär <foo@bar.com>, test@test.com, test1@test1.com" in text
                assert "Date: " in text
                assert "Message-ID: <" in text
                assert "\n\nfoobar\n" in text
            o.assert_called_once()
            args = o.call_args.args
            assert "kukulkan" in args[0]
            assert "folder/" in args[0]
            assert ":2,S" in args[0]
            assert args[1] == "w"
            hdl = o()
            hdl.write.assert_called_once()
            args = hdl.write.call_args.args
            assert text == args[0]

    nmdb.assert_called_once()

    assert mf.tags.add.mock_calls == [
        call('foo'),
        call('bar'),
        call('test'),
        call('sent')
    ]

    dbw.add.assert_called_once()
    args = dbw.add.call_args.args
    assert "kukulkan" in args[0]
    assert "folder/" in args[0]
    assert ":2,S" in args[0]
    dbw.atomic.assert_called_once()
    dbw.close.assert_called_once()


def test_send_fail(setup):
    app, _ = setup

    pd = {"from": "foo", "to": "bar@bar.com", "cc": "", "bcc": "", "subject": "test",
          "body": "foobar", "action": "compose", "tags": "foo,bar"}

    app.config.custom["accounts"] = [{"id": "foo",
                                      "name": "Foo Bar",
                                      "email": "foo@bar.com",
                                      "sendmail": "false",
                                      "save_sent_to": "folder",
                                      "additional_sent_tags": ["test"]}]

    with app.test_client() as test_client:
        response = test_client.post('/api/send', data=pd)
        assert response.status_code == 202
        sid = response.json["send_id"]
        assert sid != None
        response = test_client.get(f'/api/send_progress/{sid}', headers={'Accept': 'text/event-stream'})
        assert response.status_code == 200
        status = None
        response_iter = response.response.__iter__()
        try:
            while (chunk := next(response_iter)) is not None:
                lines = chunk.decode().strip().split('\n\n')
                for line in lines:
                    if line.startswith('data: '):
                        data = json.loads(line[6:])
                        if 'send_status' in data and data['send_status'] != 'sending':
                            status = data['send_status']
                            break
        except StopIteration:
            pass
        assert status == 1


def test_send_attachment(setup):
    app, _ = setup

    mf = lambda: None
    mf.tags = lambda: None
    mf.tags.add = MagicMock()

    dbw = lambda: None
    dbw.close = MagicMock()
    dbw.atomic = MagicMock()
    dbw.add = MagicMock(return_value=(mf, 0))
    dbw.config = {}

    pd = {"from": "foo", "to": "bar@bar.com", "cc": "", "bcc": "", "subject": "test",
          "body": "foobar", "action": "compose", "tags": "foo,bar"}
    pd = {key: str(value) for key, value in pd.items()}
    pd['file'] = (io.BytesIO(b"This is a file."), 'test.txt')

    app.config.custom["accounts"] = [{"id": "foo",
                                      "name": "Foo Bar",
                                      "email": "foo@bar.com",
                                      "sendmail": "cat",
                                      "save_sent_to": "folder",
                                      "additional_sent_tags": ["test"]}]

    with patch("notmuch2.Database", return_value=dbw) as nmdb:
        with patch("builtins.open", mock_open()) as o:
            text = None
            with app.test_client() as test_client:
                response = test_client.post('/api/send', data=pd)
                assert response.status_code == 202
                sid = response.json["send_id"]
                assert sid != None
                response = test_client.get(f'/api/send_progress/{sid}', headers={'Accept': 'text/event-stream'})
                assert response.status_code == 200
                status = None
                response_iter = response.response.__iter__()
                try:
                    while (chunk := next(response_iter)) is not None:
                        lines = chunk.decode().strip().split('\n\n')
                        for line in lines:
                            if line.startswith('data: '):
                                data = json.loads(line[6:])
                                if 'send_status' in data and data['send_status'] != 'sending':
                                    status = data['send_status']
                                    text = data['send_output']
                                    break
                except StopIteration:
                    pass
                assert status == 0
                assert "Content-Type: text/plain; charset=\"utf-8\"" in text
                assert "Content-Transfer-Encoding: 7bit" in text
                assert "MIME-Version: 1.0" in text
                assert "Subject: test" in text
                assert "From: Foo Bar <foo@bar.com>" in text
                assert "To: bar" in text
                assert "Cc:" in text
                assert "Bcc:" in text
                assert "Date: " in text
                assert "Message-ID: <" in text
                assert "\n\nfoobar\n" in text
                assert "Content-Transfer-Encoding: base64" in text
                assert "Content-Disposition: attachment; filename=\"test.txt\"" in text
                assert "\nVGhpcyBpcyBhIGZpbGUu\n" in text
            assert o.call_count == 2
            args = o.call_args.args
            assert "kukulkan" in args[0]
            assert "folder/" in args[0]
            assert ":2,S" in args[0]
            assert args[1] == "w"
            hdl = o()
            hdl.write.assert_called_once()
            args = hdl.write.call_args.args
            assert text == args[0]

    nmdb.assert_called_once()

    assert mf.tags.add.mock_calls == [
        call('foo'),
        call('bar'),
        call('test'),
        call('sent')
    ]

    dbw.add.assert_called_once()
    args = dbw.add.call_args.args
    assert "kukulkan" in args[0]
    assert "folder/" in args[0]
    assert ":2,S" in args[0]
    dbw.atomic.assert_called_once()
    dbw.close.assert_called_once()


def test_send_reply(setup):
    app, db = setup

    mf = lambda: None
    mf.tags = lambda: None
    mf.tags.add = MagicMock()

    mq = lambda: None
    mq.tags = lambda: None
    mq.tags.add = MagicMock()
    mq.header = MagicMock()
    mq.header.side_effect = ["oldFoo", None]

    db.config = {}
    db.find = MagicMock(return_value=mq)

    dbw = lambda: None
    dbw.close = MagicMock()
    dbw.atomic = MagicMock()
    dbw.add = MagicMock(return_value=(mf, 0))
    dbw.config = {}
    dbw.messages = MagicMock(return_value=iter([mq]))

    pd = {"from": "foo", "to": "bar@bar.com", "cc": "", "bcc": "", "subject": "test",
          "body": "foobar", "action": "reply", "tags": "foo,bar", "refId": "oldFoo"}

    app.config.custom["accounts"] = [{"id": "foo",
                                      "name": "Foo Bar",
                                      "email": "foo@bar.com",
                                      "sendmail": "cat",
                                      "save_sent_to": "folder",
                                      "additional_sent_tags": ["test"]}]

    with patch("notmuch2.Database", return_value=dbw) as nmdb:
        with patch("builtins.open", mock_open()) as o:
            text = None
            with app.test_client() as test_client:
                response = test_client.post('/api/send', data=pd)
                assert response.status_code == 202
                sid = response.json["send_id"]
                assert sid != None
                response = test_client.get(f'/api/send_progress/{sid}', headers={'Accept': 'text/event-stream'})
                assert response.status_code == 200
                status = None
                response_iter = response.response.__iter__()
                try:
                    while (chunk := next(response_iter)) is not None:
                        lines = chunk.decode().strip().split('\n\n')
                        for line in lines:
                            if line.startswith('data: '):
                                data = json.loads(line[6:])
                                if 'send_status' in data and data['send_status'] != 'sending':
                                    status = data['send_status']
                                    text = data['send_output']
                                    break
                except StopIteration:
                    pass
                assert status == 0
                assert "Content-Type: text/plain; charset=\"utf-8\"" in text
                assert "Content-Transfer-Encoding: 7bit" in text
                assert "MIME-Version: 1.0" in text
                assert "Subject: test" in text
                assert "From: Foo Bar <foo@bar.com>" in text
                assert "To: bar" in text
                assert "Cc:" in text
                assert "Bcc:" in text
                assert "Date: " in text
                assert "Message-ID: <" in text
                assert "In-Reply-To: <oldFoo>" in text
                assert "References: <oldFoo>" in text
                assert "\n\nfoobar\n" in text
            o.assert_called_once()
            args = o.call_args.args
            assert "kukulkan" in args[0]
            assert "folder/" in args[0]
            assert ":2,S" in args[0]
            assert args[1] == "w"
            hdl = o()
            hdl.write.assert_called_once()
            args = hdl.write.call_args.args
            assert text == args[0]

    db.find.assert_called_once_with("oldFoo")
    mq.tags.add.assert_called_once_with("replied")
    assert mq.header.mock_calls == [
        call('Message-ID'),
        call('References')
    ]

    nmdb.assert_called_once()

    assert mf.tags.add.mock_calls == [
        call('foo'),
        call('bar'),
        call('test'),
        call('sent')
    ]

    dbw.add.assert_called_once()
    args = dbw.add.call_args.args
    assert "kukulkan" in args[0]
    assert "folder/" in args[0]
    assert ":2,S" in args[0]
    dbw.messages.assert_called_once_with("id:oldFoo", exclude_tags=[], sort=ANY)
    dbw.atomic.assert_called_once()
    dbw.close.assert_called_once()


def test_send_reply_more_refs(setup):
    app, db = setup

    mf = lambda: None
    mf.tags = lambda: None
    mf.tags.add = MagicMock()

    mq = lambda: None
    mq.tags = lambda: None
    mq.tags.add = MagicMock()
    mq.header = MagicMock()
    mq.header.side_effect = ["oldFoo", "<olderFoo>"]

    db.config = {}
    db.find = MagicMock(return_value=mq)

    dbw = lambda: None
    dbw.close = MagicMock()
    dbw.atomic = MagicMock()
    dbw.add = MagicMock(return_value=(mf, 0))
    dbw.config = {}
    dbw.messages = MagicMock(return_value=iter([mq]))

    pd = {"from": "foo", "to": "bar@bar.com", "cc": "", "bcc": "", "subject": "test",
          "body": "foobar", "action": "reply", "tags": "foo,bar", "refId": "oldFoo"}

    app.config.custom["accounts"] = [{"id": "foo",
                                      "name": "Foo Bar",
                                      "email": "foo@bar.com",
                                      "sendmail": "cat",
                                      "save_sent_to": "folder",
                                      "additional_sent_tags": ["test"]}]

    with patch("notmuch2.Database", return_value=dbw) as nmdb:
        with patch("builtins.open", mock_open()) as o:
            text = None
            with app.test_client() as test_client:
                response = test_client.post('/api/send', data=pd)
                assert response.status_code == 202
                sid = response.json["send_id"]
                assert sid != None
                response = test_client.get(f'/api/send_progress/{sid}', headers={'Accept': 'text/event-stream'})
                assert response.status_code == 200
                status = None
                response_iter = response.response.__iter__()
                try:
                    while (chunk := next(response_iter)) is not None:
                        lines = chunk.decode().strip().split('\n\n')
                        for line in lines:
                            if line.startswith('data: '):
                                data = json.loads(line[6:])
                                if 'send_status' in data and data['send_status'] != 'sending':
                                    status = data['send_status']
                                    text = data['send_output']
                                    break
                except StopIteration:
                    pass
                assert status == 0
                assert "Content-Type: text/plain; charset=\"utf-8\"" in text
                assert "Content-Transfer-Encoding: 7bit" in text
                assert "MIME-Version: 1.0" in text
                assert "Subject: test" in text
                assert "From: Foo Bar <foo@bar.com>" in text
                assert "To: bar" in text
                assert "Cc:" in text
                assert "Bcc:" in text
                assert "Date: " in text
                assert "Message-ID: <" in text
                assert "In-Reply-To: <oldFoo>" in text
                assert "References: <olderFoo> <oldFoo>" in text
                assert "\n\nfoobar\n" in text
            o.assert_called_once()
            args = o.call_args.args
            assert "kukulkan" in args[0]
            assert "folder/" in args[0]
            assert ":2,S" in args[0]
            assert args[1] == "w"
            hdl = o()
            hdl.write.assert_called_once()
            args = hdl.write.call_args.args
            assert text == args[0]

    db.find.assert_called_once_with("oldFoo")
    mq.tags.add.assert_called_once_with("replied")
    assert mq.header.mock_calls == [
        call('Message-ID'),
        call('References')
    ]

    nmdb.assert_called_once()

    assert mf.tags.add.mock_calls == [
        call('foo'),
        call('bar'),
        call('test'),
        call('sent')
    ]

    dbw.add.assert_called_once()
    args = dbw.add.call_args.args
    assert "kukulkan" in args[0]
    assert "folder/" in args[0]
    assert ":2,S" in args[0]
    dbw.messages.assert_called_once_with("id:oldFoo", exclude_tags=[], sort=ANY)
    dbw.atomic.assert_called_once()
    dbw.close.assert_called_once()


def test_send_reply_cal(setup):
    app, db = setup

    mf = lambda: None
    mf.tags = lambda: None
    mf.tags.add = MagicMock()

    mq = lambda: None
    mq.tags = lambda: None
    mq.tags.add = MagicMock()
    mq.header = MagicMock()
    mq.header.side_effect = ["oldFoo", None]

    db.config = {}
    db.find = MagicMock(return_value=mq)

    dbw = lambda: None
    dbw.close = MagicMock()
    dbw.atomic = MagicMock()
    dbw.add = MagicMock(return_value=(mf, 0))
    dbw.config = {}
    dbw.messages = MagicMock(return_value=iter([mq]))

    pd = {"from": "foo", "to": "bar@bar.com", "cc": "", "bcc": "", "subject": "Accept: test",
          "body": "foobar", "action": "reply-cal-accept", "tags": "foo,bar",
          "refId": "oldFoo", "attachment-0": "unnamed attachment"}

    app.config.custom["accounts"] = [{"id": "foo",
                                      "name": "Foo Bar",
                                      "email": "unittest@tine20.org",
                                      "sendmail": "cat",
                                      "save_sent_to": "folder",
                                      "additional_sent_tags": ["test"]}]

    with patch("src.kukulkan.message_attachments",
               return_value=[{"filename": "unnamed attachment", "content_type": "text/calendar",
                              "content": "BEGIN:VCALENDAR\n" +
                                         "METHOD:REQUEST\n" +
                                         "BEGIN:VEVENT\n" +
                                         "UID:6f59364f-987e-48bb-a0d1-5512a2ba5570\n" +
                                         "SEQUENCE:1\n" +
                                         "SUMMARY:testevent\n" +
                                         "ORGANIZER;CN=3DTRUE;CN=3Dunittest;PARTSTAT=3DACCEPTED;ROLE=3DCHAIR:mail=\n" +
                                         "to:pwulf@tine20.org\n" +
                                         "ATTENDEE;CN=3DTRUE;PARTSTAT=3DNEEDS-ACTION;ROLE=3DREQ-PARTICIPANT:mailt=\n" +
                                         "o:unittest@tine20.org\n" +
                                         "DTSTART;TZID=3DEurope/Berlin:20111101T090000\n" +
                                         "DTEND;TZID=3DEurope/Berlin:20111101T100000\n" +
                                         "LOCATION:kskdcsd\n" +
                                         "DESCRIPTION:adsddsadsd\n" +
                                         "END:VEVENT\n" +
                                         "END:VCALENDAR"}]) as ma:
        with patch("notmuch2.Database", return_value=dbw) as nmdb:
            with patch("builtins.open", mock_open()) as o:
                text = None
                with app.test_client() as test_client:
                    response = test_client.post('/api/send', data=pd)
                    assert response.status_code == 202
                    sid = response.json["send_id"]
                    assert sid != None
                    response = test_client.get(f'/api/send_progress/{sid}', headers={'Accept': 'text/event-stream'})
                    assert response.status_code == 200
                    status = None
                    response_iter = response.response.__iter__()
                    try:
                        while (chunk := next(response_iter)) is not None:
                            lines = chunk.decode().strip().split('\n\n')
                            for line in lines:
                                if line.startswith('data: '):
                                    data = json.loads(line[6:])
                                    if 'send_status' in data and data['send_status'] != 'sending':
                                        status = data['send_status']
                                        text = data['send_output']
                                        break
                    except StopIteration:
                        pass
                    assert status == 0
                    assert "Content-Type: text/plain" in text
                    assert "Content-Type: multipart/mixed" in text
                    assert "Content-Transfer-Encoding: 7bit" in text
                    assert "Subject: Accept: test" in text
                    assert "From: Foo Bar <unittest@tine20.org>" in text
                    assert "To: bar" in text
                    assert "Cc:" in text
                    assert "Bcc:" in text
                    assert "Date: " in text
                    assert "Message-ID: <" in text
                    assert "In-Reply-To: <oldFoo>" in text
                    assert "References: <oldFoo>" in text
                    assert "\n\nfoobar\n" in text
                    assert "METHOD:REPLY" in text
                    assert "DTSTAMP:" in text
                    assert 'ATTENDEE;CN="Foo Bar";PARTSTAT=ACCEPTED:MAILTO:unittest@tine20.org' in text
                    assert "SUMMARY:Accept: testevent" in text
                    assert "SEQUENCE:1" in text
                    assert "UID:6f59364f-987e-48bb-a0d1-5512a2ba5570" in text
                args = o.call_args.args
                assert "kukulkan" in args[0]
                assert "folder/" in args[0]
                assert ":2,S" in args[0]
                assert args[1] == "w"
                hdl = o()
                hdl.write.assert_called_once()
                args = hdl.write.call_args.args
                assert text == args[0]

        ma.assert_called_once_with(mq)

    assert db.find.mock_calls == [
        call('oldFoo'),
        call('oldFoo')
    ]
    mq.tags.add.assert_called_once_with("replied")
    assert mq.header.mock_calls == [
        call('Message-ID'),
        call('References')
    ]

    nmdb.assert_called_once()

    assert mf.tags.add.mock_calls == [
        call('foo'),
        call('bar'),
        call('test'),
        call('sent')
    ]

    dbw.add.assert_called_once()
    args = dbw.add.call_args.args
    assert "kukulkan" in args[0]
    assert "folder/" in args[0]
    assert ":2,S" in args[0]
    dbw.messages.assert_called_once_with("id:oldFoo", exclude_tags=[], sort=ANY)
    dbw.atomic.assert_called_once()
    dbw.close.assert_called_once()


def test_send_forward(setup):
    app, db = setup

    mf = lambda: None
    mf.tags = lambda: None
    mf.tags.add = MagicMock()

    mq = lambda: None
    mq.tags = lambda: None
    mq.tags.add = MagicMock()

    db.config = {}
    db.find = MagicMock(return_value=mq)

    dbw = lambda: None
    dbw.close = MagicMock()
    dbw.atomic = MagicMock()
    dbw.add = MagicMock(return_value=(mf, 0))
    dbw.config = {}
    dbw.messages = MagicMock(return_value=iter([mq]))

    pd = {"from": "foo", "to": "bar@bar.com", "cc": "", "bcc": "", "subject": "test",
          "body": "foobar", "action": "forward", "tags": "foo,bar",
          "refId": "oldFoo", "attachment-0": "testfile"}

    app.config.custom["accounts"] = [{"id": "foo",
                                      "name": "Foo Bar",
                                      "email": "foo@bar.com",
                                      "sendmail": "cat",
                                      "save_sent_to": "folder",
                                      "additional_sent_tags": ["test"]}]

    with patch("src.kukulkan.message_attachments", return_value=[{"filename": "testfile", "content_type": "text/plain", "content": b"This is content."}]) as ma:
        with patch("notmuch2.Database", return_value=dbw) as nmdb:
            with patch("builtins.open", mock_open()) as o:
                text = None
                with app.test_client() as test_client:
                    response = test_client.post('/api/send', data=pd)
                    assert response.status_code == 202
                    sid = response.json["send_id"]
                    assert sid != None
                    response = test_client.get(f'/api/send_progress/{sid}', headers={'Accept': 'text/event-stream'})
                    assert response.status_code == 200
                    status = None
                    response_iter = response.response.__iter__()
                    try:
                        while (chunk := next(response_iter)) is not None:
                            lines = chunk.decode().strip().split('\n\n')
                            for line in lines:
                                if line.startswith('data: '):
                                    data = json.loads(line[6:])
                                    if 'send_status' in data and data['send_status'] != 'sending':
                                        status = data['send_status']
                                        text = data['send_output']
                                        break
                    except StopIteration:
                        pass
                    assert status == 0
                    assert "Content-Type: text/plain; charset=\"utf-8\"" in text
                    assert "Content-Transfer-Encoding: 7bit" in text
                    assert "MIME-Version: 1.0" in text
                    assert "Subject: test" in text
                    assert "From: Foo Bar <foo@bar.com>" in text
                    assert "To: bar" in text
                    assert "Cc:" in text
                    assert "Bcc:" in text
                    assert "Date: " in text
                    assert "Message-ID: <" in text
                    assert "Content-Transfer-Encoding: base64" in text
                    assert "Content-Disposition: attachment; filename=\"testfile\"" in text
                    assert "\nVGhpcyBpcyBjb250ZW50Lg==\n" in text
                    assert "\n\nfoobar\n" in text
                o.assert_called_once()
                args = o.call_args.args
                assert "kukulkan" in args[0]
                assert "folder/" in args[0]
                assert ":2,S" in args[0]
                assert args[1] == "w"
                hdl = o()
                hdl.write.assert_called_once()
                args = hdl.write.call_args.args
                assert text == args[0]

        ma.assert_called_once_with(mq)

    db.find.assert_called_once_with("oldFoo")
    mq.tags.add.assert_called_once_with("passed")

    nmdb.assert_called_once()

    assert mf.tags.add.mock_calls == [
        call('foo'),
        call('bar'),
        call('test'),
        call('sent')
    ]

    dbw.add.assert_called_once()
    args = dbw.add.call_args.args
    assert "kukulkan" in args[0]
    assert "folder/" in args[0]
    assert ":2,S" in args[0]
    dbw.messages.assert_called_once_with("id:oldFoo", exclude_tags=[], sort=ANY)
    dbw.atomic.assert_called_once()
    dbw.close.assert_called_once()


def test_send_forward_text_attachment(setup):
    app, db = setup

    mf = lambda: None
    mf.tags = lambda: None
    mf.tags.add = MagicMock()

    mq = lambda: None
    mq.tags = lambda: None
    mq.tags.add = MagicMock()

    db.config = {}
    db.find = MagicMock(return_value=mq)

    dbw = lambda: None
    dbw.close = MagicMock()
    dbw.atomic = MagicMock()
    dbw.add = MagicMock(return_value=(mf, 0))
    dbw.config = {}
    dbw.messages = MagicMock(return_value=iter([mq]))

    pd = {"from": "foo", "to": "bar@bar.com", "cc": "", "bcc": "", "subject": "test",
          "body": "foobar", "action": "forward", "tags": "foo,bar",
          "refId": "oldFoo", "attachment-0": "unnamed attachment"}

    app.config.custom["accounts"] = [{"id": "foo",
                                      "name": "Foo Bar",
                                      "email": "foo@bar.com",
                                      "sendmail": "cat",
                                      "save_sent_to": "folder",
                                      "additional_sent_tags": ["test"]}]

    with patch("src.kukulkan.message_attachments", return_value=[{"filename": "unnamed attachment", "content_type": "text/plain", "content": "This is content."}]) as ma:
        with patch("notmuch2.Database", return_value=dbw) as nmdb:
            with patch("builtins.open", mock_open()) as o:
                text = None
                with app.test_client() as test_client:
                    response = test_client.post('/api/send', data=pd)
                    assert response.status_code == 202
                    sid = response.json["send_id"]
                    assert sid != None
                    response = test_client.get(f'/api/send_progress/{sid}', headers={'Accept': 'text/event-stream'})
                    assert response.status_code == 200
                    status = None
                    response_iter = response.response.__iter__()
                    try:
                        while (chunk := next(response_iter)) is not None:
                            lines = chunk.decode().strip().split('\n\n')
                            for line in lines:
                                if line.startswith('data: '):
                                    data = json.loads(line[6:])
                                    if 'send_status' in data and data['send_status'] != 'sending':
                                        status = data['send_status']
                                        text = data['send_output']
                                        break
                    except StopIteration:
                        pass
                    assert status == 0
                    assert "Content-Type: text/plain; charset=\"utf-8\"" in text
                    assert "Content-Transfer-Encoding: 7bit" in text
                    assert "MIME-Version: 1.0" in text
                    assert "Subject: test" in text
                    assert "From: Foo Bar <foo@bar.com>" in text
                    assert "To: bar" in text
                    assert "Cc:" in text
                    assert "Bcc:" in text
                    assert "Date: " in text
                    assert "Message-ID: <" in text
                    assert "\n\nfoobar\n" in text
                    assert "Content-Type: text/plain; charset=\"utf-8\"" in text
                    assert "Content-Transfer-Encoding: 7bit" in text
                    assert "Content-Disposition: attachment; filename=\"unnamed attachment\"" in text
                    assert "MIME-Version: 1.0" in text
                    assert "\n\nThis is content.\n" in text
                o.assert_called_once()
                args = o.call_args.args
                assert "kukulkan" in args[0]
                assert "folder/" in args[0]
                assert ":2,S" in args[0]
                assert args[1] == "w"
                hdl = o()
                hdl.write.assert_called_once()
                args = hdl.write.call_args.args
                assert text == args[0]

        ma.assert_called_once_with(mq)

    db.find.assert_called_once_with("oldFoo")
    mq.tags.add.assert_called_once_with("passed")

    nmdb.assert_called_once()

    assert mf.tags.add.mock_calls == [
        call('foo'),
        call('bar'),
        call('test'),
        call('sent')
    ]

    dbw.add.assert_called_once()
    args = dbw.add.call_args.args
    assert "kukulkan" in args[0]
    assert "folder/" in args[0]
    assert ":2,S" in args[0]
    dbw.messages.assert_called_once_with("id:oldFoo", exclude_tags=[], sort=ANY)
    dbw.atomic.assert_called_once()
    dbw.close.assert_called_once()


def test_send_forward_original_html(setup):
    app, db = setup

    mf = lambda: None
    mf.tags = lambda: None
    mf.tags.add = MagicMock()

    mq = lambda: None
    mq.tags = lambda: None
    mq.tags.add = MagicMock()
    mq.path = "test/mails/multipart-html-text.eml"

    db.config = {}
    db.find = MagicMock(return_value=mq)

    dbw = lambda: None
    dbw.close = MagicMock()
    dbw.atomic = MagicMock()
    dbw.add = MagicMock(return_value=(mf, 0))
    dbw.config = {}
    dbw.messages = MagicMock(return_value=iter([mq]))

    pd = {"from": "foo", "to": "bar@bar.com", "cc": "", "bcc": "", "subject": "test",
          "body": "foobar", "action": "forward", "tags": "foo,bar",
          "refId": "oldFoo", "attachment-0": "Original HTML message"}

    app.config.custom["accounts"] = [{"id": "foo",
                                      "name": "Foo Bar",
                                      "email": "foo@bar.com",
                                      "sendmail": "cat",
                                      "save_sent_to": "folder",
                                      "additional_sent_tags": ["test"]}]

    # need to do this here before open() is mocked
    email = k.email_from_notmuch(mq)

    with patch("src.kukulkan.email_from_notmuch", return_value=email) as efn:
        with patch("notmuch2.Database", return_value=dbw) as nmdb:
            with patch("builtins.open", mock_open()) as o:
                text = None
                with app.test_client() as test_client:
                    response = test_client.post('/api/send', data=pd)
                    assert response.status_code == 202
                    sid = response.json["send_id"]
                    assert sid != None
                    response = test_client.get(f'/api/send_progress/{sid}', headers={'Accept': 'text/event-stream'})
                    assert response.status_code == 200
                    status = None
                    response_iter = response.response.__iter__()
                    try:
                        while (chunk := next(response_iter)) is not None:
                            lines = chunk.decode().strip().split('\n\n')
                            for line in lines:
                                if line.startswith('data: '):
                                    data = json.loads(line[6:])
                                    if 'send_status' in data and data['send_status'] != 'sending':
                                        status = data['send_status']
                                        text = data['send_output']
                                        break
                    except StopIteration:
                        pass
                    assert status == 0
                    assert "Content-Type: text/plain; charset=\"utf-8\"" in text
                    assert "Content-Transfer-Encoding: 7bit" in text
                    assert "MIME-Version: 1.0" in text
                    assert "Subject: test" in text
                    assert "From: Foo Bar <foo@bar.com>" in text
                    assert "To: bar" in text
                    assert "Cc:" in text
                    assert "Bcc:" in text
                    assert "Date: " in text
                    assert "Message-ID: <" in text
                    assert "\n\nfoobar\n" in text
                    assert "Content-Type: text/html; charset=\"utf-8\"" in text
                    assert "Content-Transfer-Encoding: 7bit" in text
                    assert "Content-Disposition: attachment" in text
                    assert "MIME-Version: 1.0" in text
                    assert "<div dir=3D\"ltr\">credit card: 123456098712<div>" in text
                o.assert_called_once()
                args = o.call_args.args
                assert "kukulkan" in args[0]
                assert "folder/" in args[0]
                assert ":2,S" in args[0]
                assert args[1] == "w"
                hdl = o()
                hdl.write.assert_called_once()
                args = hdl.write.call_args.args
                assert text == args[0]

        assert efn.mock_calls == [
            call(mq),
            call(mq)
        ]

    db.find.assert_called_once_with("oldFoo")
    mq.tags.add.assert_called_once_with("passed")

    nmdb.assert_called_once()

    assert mf.tags.add.mock_calls == [
        call('foo'),
        call('bar'),
        call('test'),
        call('sent')
    ]

    dbw.add.assert_called_once()
    args = dbw.add.call_args.args
    assert "kukulkan" in args[0]
    assert "folder/" in args[0]
    assert ":2,S" in args[0]
    dbw.messages.assert_called_once_with("id:oldFoo", exclude_tags=[], sort=ANY)
    dbw.atomic.assert_called_once()
    dbw.close.assert_called_once()


def test_send_sign_self(setup):
    app, _ = setup

    mf = lambda: None
    mf.tags = lambda: None
    mf.tags.add = MagicMock()

    dbw = lambda: None
    dbw.close = MagicMock()
    dbw.atomic = MagicMock()
    dbw.add = MagicMock(return_value=(mf, 0))
    dbw.config = {}

    pd = {"from": "foo", "to": "bar@bar.com", "cc": "", "bcc": "", "subject": "test",
          "body": "foobar", "action": "compose", "tags": "foo,bar"}

    try:
        del app.config.custom["ca-bundle"]
    except KeyError:
        pass
    app.config.custom["accounts"] = [{"id": "foo",
                                      "name": "Foo Bar",
                                      "email": "foo@bar.com",
                                      "key": "test/mails/cert.key",
                                      "cert": "test/mails/cert.crt",
                                      "ca": ["test/mails/cert.crt"],
                                      "sendmail": "cat",
                                      "save_sent_to": "folder",
                                      "additional_sent_tags": ["test"]}]

    crypto_open_vals = []
    with open(app.config.custom["accounts"][0]["key"], "rb") as tmp:
        crypto_open_vals.append(tmp.read())
    with open(app.config.custom["accounts"][0]["cert"], "rb") as tmp:
        crt = tmp.read()
        # when signing
        crypto_open_vals.append(crt)
        # when verifying
        crypto_open_vals.append(crt)

    mo = mock_open()
    handle = mo.return_value
    handle.read.side_effect = crypto_open_vals
    with patch("notmuch2.Database", return_value=dbw) as nmdb:
        with patch("builtins.open", mo) as o:
            text = None
            with app.test_client() as test_client:
                response = test_client.post('/api/send', data=pd)
                assert response.status_code == 202
                sid = response.json["send_id"]
                assert sid != None
                response = test_client.get(f'/api/send_progress/{sid}', headers={'Accept': 'text/event-stream'})
                assert response.status_code == 200
                status = None
                response_iter = response.response.__iter__()
                try:
                    while (chunk := next(response_iter)) is not None:
                        lines = chunk.decode().strip().split('\n\n')
                        for line in lines:
                            if line.startswith('data: '):
                                data = json.loads(line[6:])
                                if 'send_status' in data and data['send_status'] != 'sending':
                                    status = data['send_status']
                                    text = data['send_output']
                                    break
                except StopIteration:
                    pass
                assert status == 0
                assert "Content-Type: text/plain; charset=\"utf-8\"" in text
                assert "Content-Transfer-Encoding: 7bit" in text
                assert "MIME-Version: 1.0" in text
                assert "Subject: test" in text
                assert "From: Foo Bar <foo@bar.com>" in text
                assert "To: bar" in text
                assert "Cc:" in text
                assert "Bcc:" in text
                assert "Date: " in text
                assert "Message-ID: <" in text
                assert "\n\nfoobar\n" in text

                assert "\n\nThis is an S/MIME signed message\n" in text
                assert "Content-Type: application/x-pkcs7-signature; name=\"smime.p7s\"" in text
                assert "Content-Transfer-Encoding: base64" in text
                assert "Content-Disposition: attachment; filename=\"smime.p7s\"" in text

                args = o.call_args.args
                assert "kukulkan" in args[0]
                assert "folder/" in args[0]
                assert ":2,S" in args[0]
                assert args[1] == "w"

                email_msg = email.message_from_string(text)
                for part in email_msg.walk():
                    if "signed" in part.get('Content-Type') and "pkcs7-signature" in part.get('Content-Type'):
                        signature = k.smime_verify(part, app.config.custom["accounts"])
                        assert signature['valid'] == None
                        assert signature['message'] == 'self-signed or unavailable certificate(s): validation failed: basicConstraints.cA must not be asserted in an EE certificate (encountered processing <Certificate(subject=<Name(C=AU,ST=Some-State,O=Internet Widgits Pty Ltd)>, ...)>)'

            assert o.call_count == 4
            hdl = o()
            hdl.write.assert_called_once()
            args = hdl.write.call_args.args
            assert text == args[0]

    nmdb.assert_called_once()

    assert mf.tags.add.mock_calls == [
        call('foo'),
        call('bar'),
        call('test'),
        call('sent')
    ]

    dbw.add.assert_called_once()
    args = dbw.add.call_args.args
    assert "kukulkan" in args[0]
    assert "folder/" in args[0]
    assert ":2,S" in args[0]
    dbw.atomic.assert_called_once()
    dbw.close.assert_called_once()


@pytest.mark.skipif(IN_GITHUB_ACTIONS, reason="Doesn't base64 encode and messes up UTF8.")
def test_send_sign_base64_transfer(setup):
    app, _ = setup

    mf = lambda: None
    mf.tags = lambda: None
    mf.tags.add = MagicMock()

    dbw = lambda: None
    dbw.close = MagicMock()
    dbw.atomic = MagicMock()
    dbw.add = MagicMock(return_value=(mf, 0))
    dbw.config = {}

    pd = {"from": "foo", "to": "bar@bar.com", "cc": "", "bcc": "", "subject": "test",
          "body": "täst", "action": "compose", "tags": "foo,bar"}

    try:
        del app.config.custom["ca-bundle"]
    except KeyError:
        pass
    app.config.custom["accounts"] = [{"id": "foo",
                                      "name": "Foo Bar",
                                      "email": "foo@bar.com",
                                      "key": "test/mails/cert.key",
                                      "cert": "test/mails/cert.crt",
                                      "sendmail": "cat",
                                      "save_sent_to": "folder",
                                      "additional_sent_tags": ["test"]}]

    crypto_open_vals = []
    with open(app.config.custom["accounts"][0]["key"], "rb") as tmp:
        crypto_open_vals.append(tmp.read())
    with open(app.config.custom["accounts"][0]["cert"], "rb") as tmp:
        crypto_open_vals.append(tmp.read())

    mo = mock_open()
    handle = mo.return_value
    handle.read.side_effect = crypto_open_vals
    with patch("notmuch2.Database", return_value=dbw) as nmdb:
        with patch("builtins.open", mo) as o:
            text = None
            with app.test_client() as test_client:
                response = test_client.post('/api/send', data=pd)
                assert response.status_code == 202
                sid = response.json["send_id"]
                assert sid != None
                response = test_client.get(f'/api/send_progress/{sid}', headers={'Accept': 'text/event-stream'})
                assert response.status_code == 200
                status = None
                response_iter = response.response.__iter__()
                try:
                    while (chunk := next(response_iter)) is not None:
                        lines = chunk.decode().strip().split('\n\n')
                        for line in lines:
                            if line.startswith('data: '):
                                data = json.loads(line[6:])
                                if 'send_status' in data and data['send_status'] != 'sending':
                                    status = data['send_status']
                                    text = data['send_output']
                                    break
                except StopIteration:
                    pass
                assert status == 0
                assert "Content-Type: text/plain; charset=\"utf-8\"" in text
                assert "Content-Transfer-Encoding: base64" in text
                assert "MIME-Version: 1.0" in text
                assert "Subject: test" in text
                assert "From: Foo Bar <foo@bar.com>" in text
                assert "To: bar" in text
                assert "Cc:" in text
                assert "Bcc:" in text
                assert "Date: " in text
                assert "Message-ID: <" in text
                assert "\n\ndMOkc3QK\n" in text

                assert "\n\nThis is an S/MIME signed message\n" in text
                assert "Content-Type: application/x-pkcs7-signature; name=\"smime.p7s\"" in text
                assert "Content-Transfer-Encoding: base64" in text
                assert "Content-Disposition: attachment; filename=\"smime.p7s\"" in text

                email_msg = email.message_from_string(text)
                for part in email_msg.walk():
                    if "signed" in part.get('Content-Type') and "pkcs7-signature" in part.get('Content-Type'):
                        signature = k.smime_verify(part, app.config.custom["accounts"])
                        assert signature['message'] == 'self-signed or unavailable certificate(s): can\'t create an empty store'
                        assert signature['valid'] == None
            assert o.call_count == 3
            args = o.call_args.args
            assert "kukulkan" in args[0]
            assert "folder/" in args[0]
            assert ":2,S" in args[0]
            assert args[1] == "w"
            hdl = o()
            hdl.write.assert_called_once()
            args = hdl.write.call_args.args
            assert text == args[0]

    nmdb.assert_called_once()

    assert mf.tags.add.mock_calls == [
        call('foo'),
        call('bar'),
        call('test'),
        call('sent')
    ]

    dbw.add.assert_called_once()
    args = dbw.add.call_args.args
    assert "kukulkan" in args[0]
    assert "folder/" in args[0]
    assert ":2,S" in args[0]
    dbw.atomic.assert_called_once()
    dbw.close.assert_called_once()


def test_send_sign_attachment(setup):
    app, _ = setup

    mf = lambda: None
    mf.tags = lambda: None
    mf.tags.add = MagicMock()

    dbw = lambda: None
    dbw.close = MagicMock()
    dbw.atomic = MagicMock()
    dbw.add = MagicMock(return_value=(mf, 0))
    dbw.config = {}

    pd = {"from": "foo", "to": "bar@bar.com", "cc": "", "bcc": "", "subject": "test",
          "body": "foobar", "action": "compose", "tags": "foo,bar"}
    pd['file'] = (io.BytesIO(b"This is a file."), 'test.txt')

    try:
        del app.config.custom["ca-bundle"]
    except KeyError:
        pass
    app.config.custom["accounts"] = [{"id": "foo",
                                      "name": "Foo Bar",
                                      "email": "foo@bar.com",
                                      "key": "test/mails/cert.key",
                                      "cert": "test/mails/cert.crt",
                                      "sendmail": "cat",
                                      "save_sent_to": "folder",
                                      "additional_sent_tags": ["test"]}]

    crypto_open_vals = []
    with open(app.config.custom["accounts"][0]["key"], "rb") as tmp:
        crypto_open_vals.append(tmp.read())
    with open(app.config.custom["accounts"][0]["cert"], "rb") as tmp:
        crypto_open_vals.append(tmp.read())

    mo = mock_open()
    handle = mo.return_value
    handle.read.side_effect = crypto_open_vals
    with patch("notmuch2.Database", return_value=dbw) as nmdb:
        with patch("builtins.open", mo) as o:
            text = None
            with app.test_client() as test_client:
                response = test_client.post('/api/send', data=pd)
                assert response.status_code == 202
                sid = response.json["send_id"]
                assert sid != None
                response = test_client.get(f'/api/send_progress/{sid}', headers={'Accept': 'text/event-stream'})
                assert response.status_code == 200
                status = None
                response_iter = response.response.__iter__()
                try:
                    while (chunk := next(response_iter)) is not None:
                        lines = chunk.decode().strip().split('\n\n')
                        for line in lines:
                            if line.startswith('data: '):
                                data = json.loads(line[6:])
                                if 'send_status' in data and data['send_status'] != 'sending':
                                    status = data['send_status']
                                    text = data['send_output']
                                    break
                except StopIteration:
                    pass
                assert status == 0
                assert "Content-Type: text/plain; charset=\"utf-8\"" in text
                assert "Content-Transfer-Encoding: 7bit" in text
                assert "MIME-Version: 1.0" in text
                assert "Subject: test" in text
                assert "From: Foo Bar <foo@bar.com>" in text
                assert "To: bar" in text
                assert "Cc:" in text
                assert "Bcc:" in text
                assert "Date: " in text
                assert "Message-ID: <" in text
                assert "\n\nfoobar\n" in text
                assert "Content-Transfer-Encoding: base64" in text
                assert "Content-Disposition: attachment; filename=\"test.txt\"" in text
                assert "\nVGhpcyBpcyBhIGZpbGUu\n" in text

                assert "\n\nThis is an S/MIME signed message\n" in text
                assert "Content-Type: application/x-pkcs7-signature; name=\"smime.p7s\"" in text
                assert "Content-Transfer-Encoding: base64" in text
                assert "Content-Disposition: attachment; filename=\"smime.p7s\"" in text

                email_msg = email.message_from_string(text)
                for part in email_msg.walk():
                    if "signed" in part.get('Content-Type') and "pkcs7-signature" in part.get('Content-Type'):
                        signature = k.smime_verify(part, app.config.custom["accounts"])
                        assert signature['message'] == 'self-signed or unavailable certificate(s): can\'t create an empty store'
                        assert signature['valid'] == None

            args = o.call_args.args
            assert "kukulkan" in args[0]
            assert "folder/" in args[0]
            assert ":2,S" in args[0]
            assert args[1] == "w"
            hdl = o()
            hdl.write.assert_called_once()
            args = hdl.write.call_args.args
            assert text == args[0]

    nmdb.assert_called_once()

    assert mf.tags.add.mock_calls == [
        call('foo'),
        call('bar'),
        call('test'),
        call('sent')
    ]

    dbw.add.assert_called_once()
    args = dbw.add.call_args.args
    assert "kukulkan" in args[0]
    assert "folder/" in args[0]
    assert ":2,S" in args[0]
    dbw.atomic.assert_called_once()
    dbw.close.assert_called_once()


def test_send_sign_reply_cal(setup):
    app, db = setup

    mf = lambda: None
    mf.tags = lambda: None
    mf.tags.add = MagicMock()

    mq = lambda: None
    mq.tags = lambda: None
    mq.tags.add = MagicMock()
    mq.header = MagicMock()
    mq.header.side_effect = ["oldFoo", None]

    db.config = {}
    db.find = MagicMock(return_value=mq)

    dbw = lambda: None
    dbw.close = MagicMock()
    dbw.atomic = MagicMock()
    dbw.add = MagicMock(return_value=(mf, 0))
    dbw.config = {}
    dbw.messages = MagicMock(return_value=iter([mq]))

    pd = {"from": "foo", "to": "bar@bar.com", "cc": "", "bcc": "", "subject": "Accept: test",
          "body": "foobar", "action": "reply-cal-accept", "tags": "foo,bar",
          "refId": "oldFoo", "attachment-0": "unnamed attachment"}

    try:
        del app.config.custom["ca-bundle"]
    except KeyError:
        pass
    app.config.custom["accounts"] = [{"id": "foo",
                                      "name": "Foo Bar",
                                      "email": "unittest@tine20.org",
                                      "key": "test/mails/cert.key",
                                      "cert": "test/mails/cert.crt",
                                      "sendmail": "cat",
                                      "save_sent_to": "folder",
                                      "additional_sent_tags": ["test"]}]

    crypto_open_vals = []
    with open(app.config.custom["accounts"][0]["key"], "rb") as tmp:
        crypto_open_vals.append(tmp.read())
    with open(app.config.custom["accounts"][0]["cert"], "rb") as tmp:
        crypto_open_vals.append(tmp.read())

    mo = mock_open()
    handle = mo.return_value
    handle.read.side_effect = crypto_open_vals
    with patch("src.kukulkan.message_attachments",
               return_value=[{"filename": "unnamed attachment", "content_type": "text/calendar",
                              "content": "BEGIN:VCALENDAR\n" +
                                         "METHOD:REQUEST\n" +
                                         "BEGIN:VEVENT\n" +
                                         "UID:6f59364f-987e-48bb-a0d1-5512a2ba5570\n" +
                                         "SEQUENCE:1\n" +
                                         "SUMMARY:testevent\n" +
                                         "ORGANIZER;CN=3DTRUE;CN=3Dunittest;PARTSTAT=3DACCEPTED;ROLE=3DCHAIR:mail=\n" +
                                         "to:pwulf@tine20.org\n" +
                                         "ATTENDEE;CN=3DTRUE;PARTSTAT=3DNEEDS-ACTION;ROLE=3DREQ-PARTICIPANT:mailt=\n" +
                                         "o:unittest@tine20.org\n" +
                                         "DTSTART;TZID=3DEurope/Berlin:20111101T090000\n" +
                                         "DTEND;TZID=3DEurope/Berlin:20111101T100000\n" +
                                         "LOCATION:kskdcsd\n" +
                                         "DESCRIPTION:adsddsadsd\n" +
                                         "END:VEVENT\n" +
                                         "END:VCALENDAR"}]) as ma:
        with patch("notmuch2.Database", return_value=dbw) as nmdb:
            with patch("builtins.open", mo) as o:
                text = None
                with app.test_client() as test_client:
                    response = test_client.post('/api/send', data=pd)
                    assert response.status_code == 202
                    sid = response.json["send_id"]
                    assert sid != None
                    response = test_client.get(f'/api/send_progress/{sid}', headers={'Accept': 'text/event-stream'})
                    assert response.status_code == 200
                    status = None
                    response_iter = response.response.__iter__()
                    try:
                        while (chunk := next(response_iter)) is not None:
                            lines = chunk.decode().strip().split('\n\n')
                            for line in lines:
                                if line.startswith('data: '):
                                    data = json.loads(line[6:])
                                    if 'send_status' in data and data['send_status'] != 'sending':
                                        status = data['send_status']
                                        text = data['send_output']
                                        break
                    except StopIteration:
                        pass
                    assert status == 0
                    assert "Content-Type: text/plain" in text
                    assert "Content-Type: multipart/mixed" in text
                    assert "Content-Transfer-Encoding: 7bit" in text
                    assert "Subject: Accept: test" in text
                    assert "From: Foo Bar <unittest@tine20.org>" in text
                    assert "To: bar" in text
                    assert "Cc:" in text
                    assert "Bcc:" in text
                    assert "Date: " in text
                    assert "Message-ID: <" in text
                    assert "In-Reply-To: <oldFoo>" in text
                    assert "References: <oldFoo>" in text
                    assert "\n\nfoobar\n" in text
                    assert "METHOD:REPLY" in text
                    assert "DTSTAMP:" in text
                    assert 'ATTENDEE;CN="Foo Bar";PARTSTAT=ACCEPTED:MAILTO:unittest@tine20.org' in text
                    assert "SUMMARY:Accept: testevent" in text
                    assert "SEQUENCE:1" in text
                    assert "UID:6f59364f-987e-48bb-a0d1-5512a2ba5570" in text

                    assert "\n\nThis is an S/MIME signed message\n" in text
                    assert "Content-Type: application/x-pkcs7-signature; name=\"smime.p7s\"" in text
                    assert "Content-Transfer-Encoding: base64" in text
                    assert "Content-Disposition: attachment; filename=\"smime.p7s\"" in text

                    email_msg = email.message_from_string(text)
                    for part in email_msg.walk():
                        if "signed" in part.get('Content-Type') and "pkcs7-signature" in part.get('Content-Type'):
                            signature = k.smime_verify(part, app.config.custom["accounts"])
                            assert signature['message'] == 'self-signed or unavailable certificate(s): can\'t create an empty store'
                            assert signature['valid'] == None

                args = o.call_args.args
                assert "kukulkan" in args[0]
                assert "folder/" in args[0]
                assert ":2,S" in args[0]
                assert args[1] == "w"
                hdl = o()
                hdl.write.assert_called_once()
                args = hdl.write.call_args.args
                assert text == args[0]

        ma.assert_called_once_with(mq)

    assert db.find.mock_calls == [
        call('oldFoo'),
        call('oldFoo')
    ]
    mq.tags.add.assert_called_once_with("replied")
    assert mq.header.mock_calls == [
        call('Message-ID'),
        call('References')
    ]

    nmdb.assert_called_once()

    assert mf.tags.add.mock_calls == [
        call('foo'),
        call('bar'),
        call('test'),
        call('sent')
    ]

    dbw.add.assert_called_once()
    args = dbw.add.call_args.args
    assert "kukulkan" in args[0]
    assert "folder/" in args[0]
    assert ":2,S" in args[0]
    dbw.messages.assert_called_once_with("id:oldFoo", exclude_tags=[], sort=ANY)
    dbw.atomic.assert_called_once()
    dbw.close.assert_called_once()
