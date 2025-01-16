import pytest
import json
import io
import os
import email
from unittest.mock import MagicMock, mock_open, patch, call

from PIL import Image

import src.kukulkan as k

IN_GITHUB_ACTIONS = os.getenv("GITHUB_ACTIONS") == "true"

def test_split_email_addresses():
    assert ["foo@bar.com"] == k.split_email_addresses("foo@bar.com")
    assert ["foo@bar.com", "bar@foo.com"] == k.split_email_addresses("foo@bar.com, bar@foo.com")
    assert ["Foo Bar <foo@bar.com>", "Bar Foo <bar@foo.com>"] == k.split_email_addresses("Foo Bar <foo@bar.com>, Bar Foo <bar@foo.com>")
    assert ["\"Bar, Foo\" <foo@bar.com>", "\"Foo, Bar\" <bar@foo.com>"] == k.split_email_addresses("\"Bar, Foo\" <foo@bar.com>, \"Foo, Bar\" <bar@foo.com>")
    assert ["Bar, Foo <foo@bar.com>", "Foo, Bar <bar@foo.com>"] == k.split_email_addresses("Bar, Foo <foo@bar.com>, Foo, Bar <bar@foo.com>")

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

    db.get_all_tags = MagicMock(return_value=['foo', 'bar', '(null)'])

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
    mm1.get_date = MagicMock(return_value="foodate")
    mm1.get_tags = MagicMock(return_value=["footag"])
    mm1.get_header = MagicMock(return_value="foo bar <foo@bar.com>")
    mm2 = lambda: None
    mm2.get_date = MagicMock(return_value="bardate")
    mm2.get_tags = MagicMock(return_value=["bartag"])
    mm2.get_header = MagicMock(return_value="bar foo <bar@foo.com>")
    mm3 = lambda: None
    mm3.get_date = MagicMock(return_value="foobardate")
    mm3.get_tags = MagicMock(return_value=["foobartag"])
    mm3.get_header = MagicMock(return_value="bar foo <foo@bar.com>")

    mt = lambda: None
    mt.get_messages = MagicMock(return_value=iter([mm1, mm2, mm3]))
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
            assert thrds[0]["authors"] == ["foo bar", "bar foo"]
            assert thrds[0]["matched_messages"] == 23
            assert thrds[0]["newest_date"] == "foobardate"
            assert thrds[0]["oldest_date"] == "foodate"
            assert thrds[0]["subject"] == "foosub"
            thrds[0]["tags"].sort()
            assert thrds[0]["tags"] == ["bartag", "foobartag", "footag"]
            assert thrds[0]["thread_id"] == "id"
            assert thrds[0]["total_messages"] == 50

        q.assert_called_once_with(db, "foo")

    mm1.get_date.assert_called_once()
    mm1.get_tags.assert_called_once()
    mm1.get_header.assert_called_once()
    assert mm2.get_date.call_count == 0
    mm2.get_tags.assert_called_once()
    mm2.get_header.assert_called_once()
    mm3.get_date.assert_called_once()
    mm3.get_tags.assert_called_once()
    mm3.get_header.assert_called_once()

    mt.get_messages.assert_called_once()
    mt.get_matched_messages.assert_called_once()
    assert mt.get_subject.call_count == 2
    mt.get_thread_id.assert_called_once()
    mt.get_total_messages.assert_called_once()

    mq.search_threads.assert_called_once()
    db.get_config.assert_called_once_with("search.exclude_tags")


def test_query_empty(setup):
    app, db = setup

    mm1 = lambda: None
    mm1.get_date = MagicMock(return_value="foodate")
    mm1.get_tags = MagicMock(return_value=["footag"])
    mm1.get_header = MagicMock(return_value=None)

    mt = lambda: None
    mt.get_messages = MagicMock(return_value=iter([mm1]))
    mt.get_matched_messages = MagicMock(return_value=23)
    mt.get_subject = MagicMock(return_value="")
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
            assert thrds[0]["authors"] == ["(no author)"]
            assert thrds[0]["matched_messages"] == 23
            assert thrds[0]["newest_date"] == "foodate"
            assert thrds[0]["oldest_date"] == "foodate"
            assert thrds[0]["subject"] == "(no subject)"
            assert thrds[0]["tags"] == ["footag"]
            assert thrds[0]["thread_id"] == "id"
            assert thrds[0]["total_messages"] == 50

        q.assert_called_once_with(db, "foo")

    assert mm1.get_date.call_count == 2
    mm1.get_tags.assert_called_once()
    mm1.get_header.assert_called_once()

    mt.get_messages.assert_called_once()
    mt.get_matched_messages.assert_called_once()
    assert mt.get_subject.call_count == 1
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


def test_address(setup):
    app, db = setup

    db.get_config = MagicMock(return_value="foo;bar")

    mf = lambda: None
    mf.get_filename = MagicMock(return_value="test/mails/simple.eml")
    mf.get_header = MagicMock(return_value="foo@bar.com, \"bar foo\" bar@foo.com, bar@foo.com")
    mf.get_message_id = MagicMock(return_value="foo")
    mf.get_tags = MagicMock(return_value=["foo", "bar"])

    mq = lambda: None
    mq.search_messages = MagicMock(return_value=iter([mf]))
    mq.exclude_tag = MagicMock()

    with patch("notmuch.Query", return_value=mq) as q:
        with app.test_client() as test_client:
            response = test_client.get('/api/address/foo')
            assert response.status_code == 200
            addrs = json.loads(response.data.decode())
            assert len(addrs) == 2
            assert addrs[0] == "foo@bar.com"
            assert addrs[1] == "\"bar foo\" bar@foo.com"

        q.assert_called_once_with(db, "from:foo or to:foo")

    mq.search_messages.assert_called_once()
    db.get_config.assert_called_once_with("search.exclude_tags")


def test_get_message_none(setup):
    app, db = setup

    mq = lambda: None
    mq.search_messages = MagicMock(return_value=iter([]))

    with patch("notmuch.Query", return_value=mq) as q:
        with app.test_client() as test_client:
            response = test_client.get('/api/message/foo')
            assert response.status_code == 404
        q.assert_called_once_with(db, 'id:"foo"')

    mq.search_messages.assert_called_once()


def test_get_message_multiple(setup):
    app, db = setup

    mq = lambda: None
    mq.search_messages = MagicMock(return_value=iter([1, 2]))

    with patch("notmuch.Query", return_value=mq) as q:
        with app.test_client() as test_client:
            response = test_client.get('/api/message/foo')
            assert response.status_code == 500
        q.assert_called_once_with(db, 'id:"foo"')

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
        q.assert_called_once_with(db, 'id:"foo"')

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
            q.assert_called_once_with(dbw, 'id:"foo" and not tag:bar')

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
            q.assert_called_once_with(dbw, 'thread:"foo" and not tag:bar')

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
            q.assert_called_once_with(dbw, 'id:"foo" and tag:bar')

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
            q.assert_called_once_with(dbw, 'thread:"foo" and tag:bar')

    mf.remove_tag.assert_called_once()
    mf.tags_to_maildir_flags.assert_called_once()

    mq.search_messages.assert_called_once()

    dbw.begin_atomic.assert_called_once()
    dbw.end_atomic.assert_called_once()
    dbw.close.assert_called_once()


def test_tags_add_message_batch(setup):
    app, db = setup

    dbw = lambda: None
    dbw.close = MagicMock()
    dbw.begin_atomic = MagicMock()
    dbw.end_atomic = MagicMock()

    mf = lambda: None
    mf.add_tag = MagicMock()
    mf.remove_tag = MagicMock()
    mf.tags_to_maildir_flags = MagicMock()

    mq = lambda: None
    mq.search_messages = MagicMock()
    mq.search_messages.side_effect = [iter([mf]), iter([mf]), iter([mf]), iter([mf])]

    with patch("notmuch.Database", return_value=dbw):
        with patch("notmuch.Query", return_value=mq) as q:
            with app.test_client() as test_client:
                response = test_client.get('/api/tag_batch/message/foo1 foo2/bar1 -bar2')
                assert response.status_code == 200
                assert b'foo1 foo2/bar1 -bar2' == response.data
            assert q.mock_calls == [
                call(dbw, 'id:"foo1" and not tag:bar1'),
                call(dbw, 'id:"foo1" and tag:bar2'),
                call(dbw, 'id:"foo2" and not tag:bar1'),
                call(dbw, 'id:"foo2" and tag:bar2')
            ]

    assert mf.add_tag.mock_calls == [
        call('bar1'),
        call('bar1'),
    ]
    assert mf.remove_tag.mock_calls == [
        call('bar2'),
        call('bar2'),
    ]
    assert mf.tags_to_maildir_flags.call_count == 4

    assert mq.search_messages.call_count == 4

    assert dbw.begin_atomic.call_count == 4
    assert dbw.end_atomic.call_count == 4
    assert dbw.close.call_count == 4


def test_tags_add_thread_batch(setup):
    app, db = setup

    dbw = lambda: None
    dbw.close = MagicMock()
    dbw.begin_atomic = MagicMock()
    dbw.end_atomic = MagicMock()

    mf = lambda: None
    mf.add_tag = MagicMock()
    mf.remove_tag = MagicMock()
    mf.tags_to_maildir_flags = MagicMock()

    mq = lambda: None
    mq.search_messages = MagicMock()
    mq.search_messages.side_effect = [iter([mf]), iter([mf]), iter([mf]), iter([mf])]

    with patch("notmuch.Database", return_value=dbw):
        with patch("notmuch.Query", return_value=mq) as q:
            with app.test_client() as test_client:
                response = test_client.get('/api/tag_batch/thread/foo1 foo2/bar1 -bar2')
                assert response.status_code == 200
                assert b'foo1 foo2/bar1 -bar2' == response.data
            assert q.mock_calls == [
                call(dbw, 'thread:"foo1" and not tag:bar1'),
                call(dbw, 'thread:"foo1" and tag:bar2'),
                call(dbw, 'thread:"foo2" and not tag:bar1'),
                call(dbw, 'thread:"foo2" and tag:bar2')
            ]

    assert mf.add_tag.mock_calls == [
        call('bar1'),
        call('bar1'),
    ]
    assert mf.remove_tag.mock_calls == [
        call('bar2'),
        call('bar2'),
    ]
    assert mf.tags_to_maildir_flags.call_count == 4

    assert mq.search_messages.call_count == 4

    assert dbw.begin_atomic.call_count == 4
    assert dbw.end_atomic.call_count == 4
    assert dbw.close.call_count == 4


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
        q.assert_called_once_with(db, 'id:"foo"')

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
        q.assert_called_once_with(db, 'id:"foo"')

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
        q.assert_called_once_with(db, 'id:"foo"')

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
        q.assert_called_with(db, 'id:"foo"')

    assert mf.get_filename.call_count == 3
    assert mq.search_messages.call_count == 3


def test_attachment_image_resize(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value="test/mails/attachment-image.eml")

    mq = lambda: None
    mq.search_messages = MagicMock(return_value=iter([mf]))

    with patch("notmuch.Query", return_value=mq) as q:
        with app.test_client() as test_client:
            response = test_client.get('/api/attachment/foo/0/1')
            assert response.status_code == 200
            assert 25053 == len(response.data)
            assert type(response.data) is bytes
            assert "image/png" == response.mimetype
            assert "inline; filename=filename.png" == response.headers['Content-Disposition']
            img = Image.open(io.BytesIO(response.data))
            assert (499, 402) == img.size
        q.assert_called_once_with(db, 'id:"foo"')

    mf.get_filename.assert_called_once()
    mq.search_messages.assert_called_once()


def test_attachment_image_no_resize(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value="test/mails/attachment-image.eml")

    mq = lambda: None
    mq.search_messages = MagicMock(return_value=iter([mf]))

    with patch("notmuch.Query", return_value=mq) as q:
        with app.test_client() as test_client:
            response = test_client.get('/api/attachment/foo/0/0')
            assert response.status_code == 200
            assert 94590 == len(response.data)
            assert type(response.data) is bytes
            assert "image/png" == response.mimetype
            assert "inline; filename=filename.png" == response.headers['Content-Disposition']
            img = Image.open(io.BytesIO(response.data))
            assert (1584, 1274) == img.size
        q.assert_called_once_with(db, 'id:"foo"')

    mf.get_filename.assert_called_once()
    mq.search_messages.assert_called_once()


def test_message_simple(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value="test/mails/simple.eml")
    mf.get_header = MagicMock(return_value="  foo@bar  ")
    mf.get_message_id = MagicMock(return_value="foo")
    mf.get_tags = MagicMock(return_value=["foo", "bar"])

    mq = lambda: None
    mq.search_messages = MagicMock(return_value=iter([mf]))

    with patch("notmuch.Query", return_value=mq) as q:
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
            assert msg["references"] == "foo@bar"
            assert msg["reply_to"] == "foo@bar"
            assert msg["delivered_to"] == "foo@bar"

            assert "With the new notmuch_message_get_flags() function" in msg["body"]["text/plain"]
            assert msg["body"]["text/html"] == ''

            assert msg["notmuch_id"] == "foo"
            assert msg["tags"] == ["foo", "bar"]
            assert msg["attachments"] == []
            assert msg["signature"] is None
        q.assert_called_once_with(db, 'id:"foo"')

    mf.get_filename.assert_called_once()
    mf.get_message_id.assert_called_once()
    mf.get_tags.assert_called_once()
    assert mf.get_header.call_count == 17

    mq.search_messages.assert_called_once()


def test_message_forwarded(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value="test/mails/forwarded.eml")
    mf.get_header = MagicMock(return_value="something@other.org")
    mf.get_message_id = MagicMock(return_value="foo")
    mf.get_tags = MagicMock(return_value=["foo", "bar"])

    mq = lambda: None
    mq.search_messages = MagicMock(return_value=iter([mf]))

    with patch("notmuch.Query", return_value=mq) as q:
        with app.test_client() as test_client:
            response = test_client.get('/api/message/foo')
            assert response.status_code == 200
            msg = json.loads(response.data.decode())
            assert msg["forwarded_to"] == "something@other.org"

            assert "With the new notmuch_message_get_flags() function" in msg["body"]["text/plain"]
            assert msg["body"]["text/html"] == ''

            assert msg["notmuch_id"] == "foo"
            assert msg["tags"] == ["foo", "bar"]
            assert msg["attachments"] == []
            assert msg["signature"] is None
        q.assert_called_once_with(db, 'id:"foo"')

    mf.get_filename.assert_called_once()
    mf.get_message_id.assert_called_once()
    mf.get_tags.assert_called_once()
    assert mf.get_header.call_count == 17

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
        q.assert_called_once_with(db, 'id:"foo"')

    mf.get_filename.assert_called_once()
    mf.get_message_id.assert_called_once()
    mf.get_tags.assert_called_once()
    assert mf.get_header.call_count == 17

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

    app.config.custom["accounts"] = [{"email": "unittest@tine20.org"}]

    with patch("notmuch.Query", return_value=mq) as q:
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
        q.assert_called_once_with(db, 'id:"foo"')

    mf.get_filename.assert_called_once()
    mf.get_message_id.assert_called_once()
    mf.get_tags.assert_called_once()
    assert mf.get_header.call_count == 17

    mq.search_messages.assert_called_once()


def test_message_attachment_calendar_preview_broken(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value="test/mails/calendar-broken.eml")
    mf.get_header = MagicMock(return_value="  foo\tbar  ")
    mf.get_message_id = MagicMock(return_value="foo")
    mf.get_tags = MagicMock(return_value=["foo", "bar"])

    mq = lambda: None
    mq.search_messages = MagicMock(return_value=iter([mf]))

    app.config.custom["accounts"] = [{"email": "unittest@tine20.org"}]

    with patch("notmuch.Query", return_value=mq) as q:
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
        q.assert_called_once_with(db, 'id:"foo"')

    mf.get_filename.assert_called_once()
    mf.get_message_id.assert_called_once()
    mf.get_tags.assert_called_once()
    assert mf.get_header.call_count == 17

    mq.search_messages.assert_called_once()


def test_message_attachment_calendar_preview_tz(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value="test/mails/calendar-tz.eml")
    mf.get_header = MagicMock(return_value="  foo\tbar  ")
    mf.get_message_id = MagicMock(return_value="foo")
    mf.get_tags = MagicMock(return_value=["foo", "bar"])

    mq = lambda: None
    mq.search_messages = MagicMock(return_value=iter([mf]))

    app.config.custom["accounts"] = [{"email": "unittest@tine20.org"}]

    with patch("notmuch.Query", return_value=mq) as q:
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
            assert msg["attachments"][0]['preview']['attendees'] == "unittest, TRUE"
        q.assert_called_once_with(db, 'id:"foo"')

    mf.get_filename.assert_called_once()
    mf.get_message_id.assert_called_once()
    mf.get_tags.assert_called_once()
    assert mf.get_header.call_count == 17

    mq.search_messages.assert_called_once()


def test_message_attachment_calendar_preview_no_attendees(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value="test/mails/calendar-noattendees.eml")
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
            assert msg["attachments"][0]['preview']['attendees'] == "unittest"
        q.assert_called_once_with(db, 'id:"foo"')

    mf.get_filename.assert_called_once()
    mf.get_message_id.assert_called_once()
    mf.get_tags.assert_called_once()
    assert mf.get_header.call_count == 17

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
            assert msg["attachments"][0]['preview']['attendees'] == ""
        q.assert_called_once_with(db, 'id:"foo"')

    mf.get_filename.assert_called_once()
    mf.get_message_id.assert_called_once()
    mf.get_tags.assert_called_once()
    assert mf.get_header.call_count == 17

    mq.search_messages.assert_called_once()


def test_message_attachment_calendar_preview_no_time(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value="test/mails/calendar-notime.eml")
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
        q.assert_called_once_with(db, 'id:"foo"')

    mf.get_filename.assert_called_once()
    mf.get_message_id.assert_called_once()
    mf.get_tags.assert_called_once()
    assert mf.get_header.call_count == 17

    mq.search_messages.assert_called_once()


def test_message_attachment_calendar_preview_recur(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value="test/mails/calendar-recur.eml")
    mf.get_header = MagicMock(return_value="  foo\tbar  ")
    mf.get_message_id = MagicMock(return_value="foo")
    mf.get_tags = MagicMock(return_value=["foo", "bar"])

    mq = lambda: None
    mq.search_messages = MagicMock(return_value=iter([mf]))

    app.config.custom["accounts"] = [{"email": "unittest@tine20.org"}]

    with patch("notmuch.Query", return_value=mq) as q:
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
        q.assert_called_once_with(db, 'id:"foo"')

    mf.get_filename.assert_called_once()
    mf.get_message_id.assert_called_once()
    mf.get_tags.assert_called_once()
    assert mf.get_header.call_count == 17

    mq.search_messages.assert_called_once()


def test_message_attachment_calendar_preview_request_accepted(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value="test/mails/calendar-accepted.eml")
    mf.get_header = MagicMock(return_value="  foo\tbar  ")
    mf.get_message_id = MagicMock(return_value="foo")
    mf.get_tags = MagicMock(return_value=["foo", "bar"])

    mq = lambda: None
    mq.search_messages = MagicMock(return_value=iter([mf]))

    app.config.custom["accounts"] = [{"email": "unittest@tine20.org"}]

    with patch("notmuch.Query", return_value=mq) as q:
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
        q.assert_called_once_with(db, 'id:"foo"')

    mf.get_filename.assert_called_once()
    mf.get_message_id.assert_called_once()
    mf.get_tags.assert_called_once()
    assert mf.get_header.call_count == 17

    mq.search_messages.assert_called_once()


def test_message_attachment_calendar_preview_reply_accepted(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value="test/mails/calendar-reply-accepted.eml")
    mf.get_header = MagicMock(return_value="  foo\tbar  ")
    mf.get_message_id = MagicMock(return_value="foo")
    mf.get_tags = MagicMock(return_value=["foo", "bar"])

    mq = lambda: None
    mq.search_messages = MagicMock(return_value=iter([mf]))

    app.config.custom["accounts"] = [{"email": "unittest@tine20.org"}]

    with patch("notmuch.Query", return_value=mq) as q:
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
        q.assert_called_once_with(db, 'id:"foo"')

    mf.get_filename.assert_called_once()
    mf.get_message_id.assert_called_once()
    mf.get_tags.assert_called_once()
    assert mf.get_header.call_count == 17

    mq.search_messages.assert_called_once()


@pytest.mark.skipif(IN_GITHUB_ACTIONS, reason="No CA certs on github.")
def test_message_signed_self(setup):
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

            assert msg["signature"] == {'message': 'self-signed or unavailable certificate(s): validation failed: required EKU not found (encountered processing <Certificate(subject=<Name(CN=Alice Lovelace)>, ...)>)', 'valid': None}
        q.assert_called_once_with(db, 'id:"foo"')

    mf.get_filename.assert_called_once()
    mf.get_message_id.assert_called_once()
    mf.get_tags.assert_called_once()
    assert mf.get_header.call_count == 17

    mq.search_messages.assert_called_once()


@pytest.mark.skipif(IN_GITHUB_ACTIONS, reason="No CA certs on github.")
def test_message_signed_expired(setup):
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

            assert msg["signature"] == {'message': 'invalid signature: validation failed: cert is not valid at validation time (encountered processing <Certificate(subject=<Name(CN=shatzing5@outlook.com)>, ...)>)', 'valid': False}
        q.assert_called_once_with(db, 'id:"foo"')

    mf.get_filename.assert_called_once()
    mf.get_message_id.assert_called_once()
    mf.get_tags.assert_called_once()
    assert mf.get_header.call_count == 17

    mq.search_messages.assert_called_once()


@pytest.mark.skipif(IN_GITHUB_ACTIONS, reason="No CA certs on github.")
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
            assert msg["signature"] == {'message': 'invalid signature: validation failed: required EKU not found (encountered processing <Certificate(subject=<Name(CN=Alice Lovelace)>, ...)>)', 'valid': False}
        q.assert_called_once_with(db, 'id:"foo"')

    mf.get_filename.assert_called_once()
    mf.get_message_id.assert_called_once()
    mf.get_tags.assert_called_once()
    assert mf.get_header.call_count == 17

    mq.search_messages.assert_called_once()


def test_message_signed_pgp(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value="test/mails/signed-pgp.eml")
    mf.get_header = MagicMock(return_value="Pierre THIERRY <nowhere.man@levallois.eu.org>")
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
            assert "Actually, the text seems to say the contrary" in msg["body"]["text/plain"]

            # fails on Github
            if not os.getenv("GITHUB_ACTIONS") == "true":
                assert msg["signature"] == {'valid': True}
        q.assert_called_once_with(db, 'id:"foo"')

    mf.get_filename.assert_called_once()
    mf.get_message_id.assert_called_once()
    mf.get_tags.assert_called_once()
    assert mf.get_header.call_count == 18

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
        q.assert_called_once_with(db, 'id:"foo"')

    mf.get_filename.assert_called_once()
    mf.get_message_id.assert_called_once()
    mf.get_tags.assert_called_once()
    assert mf.get_header.call_count == 17

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
        q.assert_called_once_with(db, 'id:"foo"')

    mf.get_filename.assert_called_once()
    mf.get_message_id.assert_called_once()
    mf.get_tags.assert_called_once()
    assert mf.get_header.call_count == 17

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
            assert "http://image.com" not in msg["body"]["text/html"]
        q.assert_called_once_with(db, 'id:"foo"')

    mf.get_filename.assert_called_once()
    mf.get_message_id.assert_called_once()
    mf.get_tags.assert_called_once()
    assert mf.get_header.call_count == 17

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
        q.assert_called_once_with(db, 'id:"foo"')

    mf.get_filename.assert_called_once()
    mf.get_message_id.assert_called_once()
    mf.get_tags.assert_called_once()
    assert mf.get_header.call_count == 17

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
        q.assert_called_once_with(db, 'id:"foo"')

    mf.get_filename.assert_called_once()
    mf.get_message_id.assert_called_once()
    mf.get_tags.assert_called_once()
    assert mf.get_header.call_count == 17

    mq.search_messages.assert_called_once()


def test_message_attachment_mail(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value="test/mails/mail_nested.eml")

    mq = lambda: None
    mq.search_messages = MagicMock(return_value=iter([mf]))

    with patch("notmuch.Query", return_value=mq) as q:
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
            assert msg["references"] == None
            assert msg["reply_to"] == None
            assert msg["delivered_to"] == "arne.keller@posteo.de"

            assert "Öffnen Sie den unten stehenden Aktivierungslink" in msg["body"]["text/plain"]
            assert "Öffnen Sie den unten stehenden Aktivierungslink" in msg["body"]["text/html"]

            assert msg["notmuch_id"] == None
            assert msg["tags"] == []
            assert msg["attachments"] == []
            assert msg["signature"] is None
        q.assert_called_once_with(db, 'id:"foo"')

    mf.get_filename.assert_called_once()
    mq.search_messages.assert_called_once()


def test_thread(setup):
    app, db = setup

    mf = lambda: None
    mf.get_filename = MagicMock(return_value="test/mails/simple.eml")
    mf.get_header = MagicMock(return_value="  foo@bar  ")
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
            assert msg["from"] == "foo@bar"
            assert msg["to"] == ["foo@bar"]
            assert msg["cc"] == ["foo@bar"]
            assert msg["bcc"] == ["foo@bar"]
            assert msg["date"] == "foo@bar"
            assert msg["subject"] == "foo@bar"
            assert msg["message_id"] == "foo@bar"
            assert msg["in_reply_to"] == "foo@bar"
            assert msg["references"] == "foo@bar"
            assert msg["reply_to"] == "foo@bar"

            assert "With the new notmuch_message_get_flags() function" in msg["body"]["text/plain"]
            assert msg["body"]["text/html"] == ''

            assert msg["notmuch_id"] == "foo"
            assert msg["tags"] == ["foo", "bar"]
            assert msg["attachments"] == []
            assert msg["signature"] is None
        q.assert_called_once_with(db, 'thread:"foo"')

    mf.get_filename.assert_called_once()
    mf.get_message_id.assert_called_once()
    mf.get_tags.assert_called_once()
    assert mf.get_header.call_count == 17

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
        q.assert_called_once_with(db, 'thread:"foo"')

    mq.search_threads.assert_called_once()


def test_thread_duplicate(setup):
    app, db = setup

    mq = lambda: None
    mq.search_threads = MagicMock(return_value=iter([1, 2]))

    with patch("notmuch.Query", return_value=mq) as q:
        with app.test_client() as test_client:
            response = test_client.get('/api/thread/foo')
            assert response.status_code == 500
        q.assert_called_once_with(db, 'thread:"foo"')

    mq.search_threads.assert_called_once()


def test_external_editor(setup):
    app, db = setup

    pd = {"body": "foobar"}

    app.config.custom["compose"] = {}
    app.config.custom["compose"]["external-editor"] = "true"

    fname = ""

    with patch("os.unlink", return_value=None) as u:
        with patch("builtins.open", mock_open(read_data="barfoo")) as m:
            with app.test_client() as test_client:
                response = test_client.post('/api/edit_external', data=pd)
                assert response.status_code == 200
                assert response.data == b'barfoo'
            u.assert_called_once()
            m.assert_called_once()
            args = m.call_args.args
            assert "kukulkan-tmp-" in args[0]
            fname = args[0]

    tmp = open(fname)
    assert tmp.read() == "foobar"
    tmp.close()
    os.unlink(fname)

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

    pd = {"from": "foo", "to": "bar@bar.com", "cc": "", "bcc": "", "subject": "test",
          "body": "foobar", "action": "compose", "tags": "foo,bar"}

    app.config.custom["accounts"] = [{"id": "foo",
                                      "name": "Foo Bar",
                                      "email": "foo@bar.com",
                                      "sendmail": "cat",
                                      "save_sent_to": "folder",
                                      "additional_sent_tags": ["test"]}]

    with patch("notmuch.Database", return_value=dbw):
        with patch("builtins.open", mock_open()) as m:
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
            m.assert_called_once()
            args = m.call_args.args
            assert "kukulkan" in args[0]
            assert "folder" in args[0]
            assert ":2,S" in args[0]
            assert args[1] == "w"
            hdl = m()
            hdl.write.assert_called_once()
            args = hdl.write.call_args.args
            assert text == args[0]

    mm.maildir_flags_to_tags.assert_called_once()
    mm.tags_to_maildir_flags.assert_called_once()
    mm.add_tag.assert_has_calls([call("foo"), call("bar"), call("test"), call("sent")])

    dbw.begin_atomic.assert_called_once()
    dbw.end_atomic.assert_called_once()
    dbw.close.assert_called_once()


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

    mm = lambda: None
    mm.maildir_flags_to_tags = MagicMock()
    mm.add_tag = MagicMock()
    mm.tags_to_maildir_flags = MagicMock()

    dbw = lambda: None
    dbw.close = MagicMock()
    dbw.begin_atomic = MagicMock()
    dbw.end_atomic = MagicMock()
    dbw.index_file = MagicMock(return_value=(mm, 0))

    pd = {"from": "foo", "to": "bar@bar.com", "cc": "", "bcc": "", "subject": "test",
          "body": "täst", "action": "compose", "tags": "foo,bar"}

    app.config.custom["accounts"] = [{"id": "foo",
                                      "name": "Foo Bar",
                                      "email": "foo@bar.com",
                                      "sendmail": "cat",
                                      "save_sent_to": "folder",
                                      "additional_sent_tags": ["test"]}]

    with patch("notmuch.Database", return_value=dbw):
        with patch("builtins.open", mock_open()) as m:
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
            m.assert_called_once()
            args = m.call_args.args
            assert "kukulkan" in args[0]
            assert "folder" in args[0]
            assert ":2,S" in args[0]
            assert args[1] == "w"
            hdl = m()
            hdl.write.assert_called_once()
            args = hdl.write.call_args.args
            assert text == args[0]

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

    pd = {"from": "foo", "to": "Foo bar <foo@bar.com>\ntäst <test@bar.com>", "cc": "Föö, Bår <foo@bar.com>",
          "bcc": "Føø Bär <foo@bar.com>\n<test@test.com>\ntest1@test1.com", "subject": "test",
          "body": "foobar", "action": "compose", "tags": "foo,bar"}

    app.config.custom["accounts"] = [{"id": "foo",
                                      "name": "Foo Bar",
                                      "email": "foo@bar.com",
                                      "sendmail": "cat",
                                      "save_sent_to": "folder",
                                      "additional_sent_tags": ["test"]}]

    with patch("notmuch.Database", return_value=dbw):
        with patch("builtins.open", mock_open()) as m:
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
            m.assert_called_once()
            args = m.call_args.args
            assert "kukulkan" in args[0]
            assert "folder" in args[0]
            assert ":2,S" in args[0]
            assert args[1] == "w"
            hdl = m()
            hdl.write.assert_called_once()
            args = hdl.write.call_args.args
            assert text == args[0]

    mm.maildir_flags_to_tags.assert_called_once()
    mm.tags_to_maildir_flags.assert_called_once()
    mm.add_tag.assert_has_calls([call("foo"), call("bar"), call("test"), call("sent")])

    dbw.begin_atomic.assert_called_once()
    dbw.end_atomic.assert_called_once()
    dbw.close.assert_called_once()


def test_send_fail(setup):
    app, db = setup

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

    with patch("notmuch.Database", return_value=dbw):
        with patch("builtins.open", mock_open()) as m:
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
            assert m.call_count == 2
            args = m.call_args.args
            assert "kukulkan" in args[0]
            assert "folder" in args[0]
            assert ":2,S" in args[0]
            assert args[1] == "w"
            hdl = m()
            hdl.write.assert_called_once()
            args = hdl.write.call_args.args
            assert text == args[0]

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

    pd = {"from": "foo", "to": "bar@bar.com", "cc": "", "bcc": "", "subject": "test",
          "body": "foobar", "action": "reply", "tags": "foo,bar", "refId": "oldFoo"}

    app.config.custom["accounts"] = [{"id": "foo",
                                      "name": "Foo Bar",
                                      "email": "foo@bar.com",
                                      "sendmail": "cat",
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
                    m.assert_called_once()
                    args = m.call_args.args
                    assert "kukulkan" in args[0]
                    assert "folder" in args[0]
                    assert ":2,S" in args[0]
                    assert args[1] == "w"
                    hdl = m()
                    hdl.write.assert_called_once()
                    args = hdl.write.call_args.args
                    assert text == args[0]

            mtj.assert_called_once_with(mf)

        q.assert_has_calls([call(db, 'id:"oldFoo"'), call(dbw, "id:oldFoo")])

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

    pd = {"from": "foo", "to": "bar@bar.com", "cc": "", "bcc": "", "subject": "test",
          "body": "foobar", "action": "reply", "tags": "foo,bar", "refId": "oldFoo"}

    app.config.custom["accounts"] = [{"id": "foo",
                                      "name": "Foo Bar",
                                      "email": "foo@bar.com",
                                      "sendmail": "cat",
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
                        assert "References: olderFoo <oldFoo>" in text
                        assert "\n\nfoobar\n" in text
                    m.assert_called_once()
                    args = m.call_args.args
                    assert "kukulkan" in args[0]
                    assert "folder" in args[0]
                    assert ":2,S" in args[0]
                    assert args[1] == "w"
                    hdl = m()
                    hdl.write.assert_called_once()
                    args = hdl.write.call_args.args
                    assert text == args[0]

            mtj.assert_called_once_with(mf)

        q.assert_has_calls([call(db, 'id:"oldFoo"'), call(dbw, "id:oldFoo")])

    assert mq.search_messages.call_count == 2

    mf.add_tag.assert_called_once_with("replied")
    mf.tags_to_maildir_flags.assert_called_once()

    mm.maildir_flags_to_tags.assert_called_once()
    mm.tags_to_maildir_flags.assert_called_once()
    mm.add_tag.assert_has_calls([call("foo"), call("bar"), call("test"), call("sent")])

    dbw.begin_atomic.assert_called_once()
    dbw.end_atomic.assert_called_once()
    dbw.close.assert_called_once()


def test_send_reply_cal(setup):
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

    pd = {"from": "foo", "to": "bar@bar.com", "cc": "", "bcc": "", "subject": "Accept: test",
          "body": "foobar", "action": "reply-cal-accept", "tags": "foo,bar",
          "refId": "oldFoo", "attachment-0": "unnamed attachment"}

    app.config.custom["accounts"] = [{"id": "foo",
                                      "name": "Foo Bar",
                                      "email": "unittest@tine20.org",
                                      "sendmail": "cat",
                                      "save_sent_to": "folder",
                                      "additional_sent_tags": ["test"]}]

    mf = lambda: None
    mf.add_tag = MagicMock()
    mf.tags_to_maildir_flags = MagicMock()

    mq = lambda: None
    mq.search_messages = MagicMock()
    mq.search_messages.side_effect = [iter([mf]), iter([mf]), iter([mf])]

    with patch("notmuch.Query", return_value=mq) as q:
        with patch("src.kukulkan.message_to_json", return_value={"message_id": "oldFoo", "references": None}) as mtj:
            with patch("src.kukulkan.message_attachment",
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
                with patch("notmuch.Database", return_value=dbw):
                    with patch("builtins.open", mock_open()) as m:
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
                        m.assert_called_once()
                        args = m.call_args.args
                        assert "kukulkan" in args[0]
                        assert "folder" in args[0]
                        assert ":2,S" in args[0]
                        assert args[1] == "w"
                        hdl = m()
                        hdl.write.assert_called_once()
                        args = hdl.write.call_args.args
                        assert text == args[0]

                ma.assert_called_once_with(mf)
            mtj.assert_called_once_with(mf)

        q.assert_has_calls([call(db, 'id:"oldFoo"'), call(dbw, "id:oldFoo")])

    assert mq.search_messages.call_count == 3

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

    pd = {"from": "foo", "to": "bar@bar.com", "cc": "", "bcc": "", "subject": "test",
          "body": "foobar", "action": "forward", "tags": "foo,bar",
          "refId": "oldFoo", "attachment-0": "testfile"}

    app.config.custom["accounts"] = [{"id": "foo",
                                      "name": "Foo Bar",
                                      "email": "foo@bar.com",
                                      "sendmail": "cat",
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
                    m.assert_called_once()
                    args = m.call_args.args
                    assert "kukulkan" in args[0]
                    assert "folder" in args[0]
                    assert ":2,S" in args[0]
                    assert args[1] == "w"
                    hdl = m()
                    hdl.write.assert_called_once()
                    args = hdl.write.call_args.args
                    assert text == args[0]

            ma.assert_called_once_with(mf)

        q.assert_has_calls([call(db, 'id:"oldFoo"'), call(dbw, "id:oldFoo")])

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

    pd = {"from": "foo", "to": "bar@bar.com", "cc": "", "bcc": "", "subject": "test",
          "body": "foobar", "action": "forward", "tags": "foo,bar",
          "refId": "oldFoo", "attachment-0": "unnamed attachment"}

    app.config.custom["accounts"] = [{"id": "foo",
                                      "name": "Foo Bar",
                                      "email": "foo@bar.com",
                                      "sendmail": "cat",
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
                    m.assert_called_once()
                    args = m.call_args.args
                    assert "kukulkan" in args[0]
                    assert "folder" in args[0]
                    assert ":2,S" in args[0]
                    assert args[1] == "w"
                    hdl = m()
                    hdl.write.assert_called_once()
                    args = hdl.write.call_args.args
                    assert text == args[0]

            ma.assert_called_once_with(mf)

        q.assert_has_calls([call(db, 'id:"oldFoo"'), call(dbw, "id:oldFoo")])

    assert mq.search_messages.call_count == 2

    mf.add_tag.assert_called_once_with("passed")
    mf.tags_to_maildir_flags.assert_called_once()

    mm.maildir_flags_to_tags.assert_called_once()
    mm.tags_to_maildir_flags.assert_called_once()
    mm.add_tag.assert_has_calls([call("foo"), call("bar"), call("test"), call("sent")])

    dbw.begin_atomic.assert_called_once()
    dbw.end_atomic.assert_called_once()
    dbw.close.assert_called_once()


def test_send_forward_original_html(setup):
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

    pd = {"from": "foo", "to": "bar@bar.com", "cc": "", "bcc": "", "subject": "test",
          "body": "foobar", "action": "forward", "tags": "foo,bar",
          "refId": "oldFoo", "attachment-0": "Original HTML message"}

    app.config.custom["accounts"] = [{"id": "foo",
                                      "name": "Foo Bar",
                                      "email": "foo@bar.com",
                                      "sendmail": "cat",
                                      "save_sent_to": "folder",
                                      "additional_sent_tags": ["test"]}]

    mf = lambda: None
    mf.get_filename = MagicMock(return_value="test/mails/multipart-html-text.eml")
    mf.add_tag = MagicMock()
    mf.tags_to_maildir_flags = MagicMock()

    # need to do this here before open() is mocked
    email = k.email_from_notmuch(mf)

    mq = lambda: None
    mq.search_messages = MagicMock()
    mq.search_messages.side_effect = [iter([mf]), iter([mf])]

    with patch("notmuch.Query", return_value=mq) as q:
        with patch("src.kukulkan.email_from_notmuch", return_value=email) as efn:
            with patch("notmuch.Database", return_value=dbw):
                with patch("builtins.open", mock_open()) as m:
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
                    m.assert_called_once()
                    args = m.call_args.args
                    assert "kukulkan" in args[0]
                    assert "folder" in args[0]
                    assert ":2,S" in args[0]
                    assert args[1] == "w"
                    hdl = m()
                    hdl.write.assert_called_once()
                    args = hdl.write.call_args.args
                    assert text == args[0]

            assert efn.mock_calls == [
                call(mf),
                call(mf)
            ]

        q.assert_has_calls([call(db, 'id:"oldFoo"'), call(dbw, "id:oldFoo")])

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
    with patch("notmuch.Database", return_value=dbw):
        with patch("builtins.open", mo) as m:
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

                args = m.call_args.args
                assert "kukulkan" in args[0]
                assert "folder" in args[0]
                assert ":2,S" in args[0]
                assert args[1] == "w"

                email_msg = email.message_from_string(text)
                for part in email_msg.walk():
                    if "signed" in part.get('Content-Type') and "pkcs7-signature" in part.get('Content-Type'):
                        signature = k.smime_verify(part, app.config.custom["accounts"])
                        assert signature['valid'] == None
                        assert signature['message'] == 'self-signed or unavailable certificate(s): validation failed: basicConstraints.cA must not be asserted in an EE certificate (encountered processing <Certificate(subject=<Name(C=AU,ST=Some-State,O=Internet Widgits Pty Ltd)>, ...)>)'

            assert m.call_count == 4
            hdl = m()
            hdl.write.assert_called_once()
            args = hdl.write.call_args.args
            assert text == args[0]

    mm.maildir_flags_to_tags.assert_called_once()
    mm.tags_to_maildir_flags.assert_called_once()
    mm.add_tag.assert_has_calls([call("foo"), call("bar"), call("test"), call("sent")])

    dbw.begin_atomic.assert_called_once()
    dbw.end_atomic.assert_called_once()
    dbw.close.assert_called_once()


def test_send_sign_self(setup):
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
    with patch("notmuch.Database", return_value=dbw):
        with patch("builtins.open", mo) as m:
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

                email_msg = email.message_from_string(text)
                for part in email_msg.walk():
                    if "signed" in part.get('Content-Type') and "pkcs7-signature" in part.get('Content-Type'):
                        signature = k.smime_verify(part, app.config.custom["accounts"])
                        assert signature['message'] == 'self-signed or unavailable certificate(s): can\'t create an empty store'
                        assert signature['valid'] == None

            assert m.call_count == 3
            args = m.call_args.args
            assert "kukulkan" in args[0]
            assert "folder" in args[0]
            assert ":2,S" in args[0]
            assert args[1] == "w"
            hdl = m()
            hdl.write.assert_called_once()
            args = hdl.write.call_args.args
            assert text == args[0]

    mm.maildir_flags_to_tags.assert_called_once()
    mm.tags_to_maildir_flags.assert_called_once()
    mm.add_tag.assert_has_calls([call("foo"), call("bar"), call("test"), call("sent")])

    dbw.begin_atomic.assert_called_once()
    dbw.end_atomic.assert_called_once()
    dbw.close.assert_called_once()


@pytest.mark.skipif(IN_GITHUB_ACTIONS, reason="Doesn't base64 encode and messes up UTF8.")
def test_send_sign_base64_transfer(setup):
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
    with patch("notmuch.Database", return_value=dbw):
        with patch("builtins.open", mo) as m:
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
            assert m.call_count == 3
            args = m.call_args.args
            assert "kukulkan" in args[0]
            assert "folder" in args[0]
            assert ":2,S" in args[0]
            assert args[1] == "w"
            hdl = m()
            hdl.write.assert_called_once()
            args = hdl.write.call_args.args
            assert text == args[0]

    mm.maildir_flags_to_tags.assert_called_once()
    mm.tags_to_maildir_flags.assert_called_once()
    mm.add_tag.assert_has_calls([call("foo"), call("bar"), call("test"), call("sent")])

    dbw.begin_atomic.assert_called_once()
    dbw.end_atomic.assert_called_once()
    dbw.close.assert_called_once()


def test_send_sign_attachment(setup):
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
    with patch("notmuch.Database", return_value=dbw):
        with patch("builtins.open", mo) as m:
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

            assert m.call_count == 3
            args = m.call_args.args
            assert "kukulkan" in args[0]
            assert "folder" in args[0]
            assert ":2,S" in args[0]
            assert args[1] == "w"
            hdl = m()
            hdl.write.assert_called_once()
            args = hdl.write.call_args.args
            assert text == args[0]

    mm.maildir_flags_to_tags.assert_called_once()
    mm.tags_to_maildir_flags.assert_called_once()
    mm.add_tag.assert_has_calls([call("foo"), call("bar"), call("test"), call("sent")])

    dbw.begin_atomic.assert_called_once()
    dbw.end_atomic.assert_called_once()
    dbw.close.assert_called_once()


def test_send_sign_reply_cal(setup):
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

    mf = lambda: None
    mf.add_tag = MagicMock()
    mf.tags_to_maildir_flags = MagicMock()

    mq = lambda: None
    mq.search_messages = MagicMock()
    mq.search_messages.side_effect = [iter([mf]), iter([mf]), iter([mf])]

    crypto_open_vals = []
    with open(app.config.custom["accounts"][0]["key"], "rb") as tmp:
        crypto_open_vals.append(tmp.read())
    with open(app.config.custom["accounts"][0]["cert"], "rb") as tmp:
        crypto_open_vals.append(tmp.read())

    mo = mock_open()
    handle = mo.return_value
    handle.read.side_effect = crypto_open_vals
    with patch("notmuch.Query", return_value=mq) as q:
        with patch("src.kukulkan.message_to_json", return_value={"message_id": "oldFoo", "references": None}) as mtj:
            with patch("src.kukulkan.message_attachment",
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
                with patch("notmuch.Database", return_value=dbw):
                    with patch("builtins.open", mo) as m:
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

                        assert m.call_count == 3
                        args = m.call_args.args
                        assert "kukulkan" in args[0]
                        assert "folder" in args[0]
                        assert ":2,S" in args[0]
                        assert args[1] == "w"
                        hdl = m()
                        hdl.write.assert_called_once()
                        args = hdl.write.call_args.args
                        assert text == args[0]

                ma.assert_called_once_with(mf)
            mtj.assert_called_once_with(mf)

        q.assert_has_calls([call(db, 'id:"oldFoo"'), call(dbw, "id:oldFoo")])

    assert mq.search_messages.call_count == 3

    mf.add_tag.assert_called_once_with("replied")
    mf.tags_to_maildir_flags.assert_called_once()

    mm.maildir_flags_to_tags.assert_called_once()
    mm.tags_to_maildir_flags.assert_called_once()
    mm.add_tag.assert_has_calls([call("foo"), call("bar"), call("test"), call("sent")])

    dbw.begin_atomic.assert_called_once()
    dbw.end_atomic.assert_called_once()
    dbw.close.assert_called_once()
