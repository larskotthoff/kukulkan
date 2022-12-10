import pytest
from unittest.mock import MagicMock, mock_open, patch

import src.kukulkan as k

@pytest.fixture
def setup():
    flask_app = k.create_app()
    db = MagicMock()
    db.close = MagicMock()
    with flask_app.app_context() as c:
        c.g.db = db

        yield flask_app, db

    db.close.assert_called_once()

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

    mf = MagicMock()
    mf.get_filename = MagicMock(return_value = "foo")

    mq = MagicMock()
    mq.search_messages = MagicMock(return_value = iter([mf]))

    with patch("notmuch.Query", return_value = mq):
        with patch("builtins.open", mock_open(read_data = "This is a test.")):
            with app.test_client() as test_client:
                response = test_client.get('/api/raw_message/foo')
                assert response.status_code == 200
                assert b'This is a test.' == response.data

    mf.get_filename.assert_called_once()
    mq.search_messages.assert_called_once()
