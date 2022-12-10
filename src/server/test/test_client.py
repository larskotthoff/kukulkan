import pytest
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
    mq.search_messages.side_effect = [iter([mf]), iter([mf])]

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
        assert q.call_count == 2
        q.assert_called_with(db, "id:foo")

    assert mf.get_filename.call_count == 2
    assert mq.search_messages.call_count == 2
