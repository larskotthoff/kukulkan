import pytest
import json
import os
import re
import shutil

import notmuch2

import src.kukulkan as k

@pytest.fixture
def setup():
    wd = os.getcwd()
    conf = os.path.join(wd, "test", "mails", ".notmuch-config")
    os.environ["NOTMUCH_CONFIG"] = conf
    print(conf)
    with open(conf, "w", encoding="utf8") as f:
        f.write(f'[database]\npath={os.path.join(wd, "test", "mails")}\n[search]\nexclude_tags=deleted')

    os.system("notmuch new")

    flask_app = k.create_app()
    db = notmuch2.Database()
    print(db.config["search.exclude_tags"])
    with flask_app.app_context() as c:
        c.g.db = db
        yield flask_app

    os.unlink(os.path.join(wd, "test", "mails", ".notmuch-config"))
    shutil.rmtree(os.path.join(wd, "test", "mails", ".notmuch"))


@pytest.fixture
def setup_deleted():
    wd = os.getcwd()
    conf = os.path.join(wd, "test", "mails", ".notmuch-config")
    os.environ["NOTMUCH_CONFIG"] = conf
    with open(conf, "w", encoding="utf8") as f:
        f.write(f'[database]\npath={os.path.join(wd, "test", "mails")}\n[search]\nexclude_tags=deleted')

    os.system("notmuch new")

    flask_app = k.create_app()
    q = "id:874llc2bkp.fsf@curie.anarc.at"
    db = notmuch2.Database(mode=notmuch2.Database.MODE.READ_WRITE)
    iter = db.messages(q)
    next(iter).tags.add("deleted")
    db.close()

    db = notmuch2.Database()
    with flask_app.app_context() as c:
        c.g.db = db
        yield flask_app

    os.unlink(os.path.join(wd, "test", "mails", ".notmuch-config"))
    shutil.rmtree(os.path.join(wd, "test", "mails", ".notmuch"))


def test_query(setup):
    app = setup
    with app.test_client() as test_client:
        response = test_client.get('/api/query/to:notmuch')
        assert response.status_code == 200
        thrds = json.loads(response.data.decode())
        assert len(thrds) == 2
        assert thrds[0]["authors"] == ["Antoine Beaupré <anarcat@orangeseeds.org>"]
        #assert thrds[0]["newest_date"] == "Mon Mar 19 11:56:54 2018"
        #assert thrds[0]["oldest_date"] == "Mon Mar 19 11:56:54 2018"
        assert thrds[0]["subject"] == 'Re: bug: "no top level messages" crash on Zen email loops'
        assert thrds[0]["tags"] == ["attachment", "inbox", "unread"]
        assert thrds[0]["total_messages"] == 1
        assert thrds[1]["authors"] == ["Stefan Schmidt <stefan@datenfreihafen.org>"]
        #assert thrds[1]["newest_date"] == "Sat Nov 21 17:11:01 2009"
        #assert thrds[1]["oldest_date"] == "Sat Nov 21 17:11:01 2009"
        assert thrds[1]["subject"] == "[notmuch] [PATCH 2/2] notmuch-new: Tag mails not as unread when the seen flag in the maildir is set."
        assert thrds[1]["tags"] == ["inbox", "unread"]
        assert thrds[1]["total_messages"] == 1


def test_query_deleted(setup_deleted):
    app = setup_deleted
    with app.test_client() as test_client:
        response = test_client.get('/api/query/to:notmuch')
        assert response.status_code == 200
        thrds = json.loads(response.data.decode())
        assert len(thrds) == 1
        assert thrds[0]["authors"] == ["Stefan Schmidt <stefan@datenfreihafen.org>"]
        #assert thrds[0]["newest_date"] == "Sat Nov 21 17:11:01 2009"
        #assert thrds[0]["oldest_date"] == "Sat Nov 21 17:11:01 2009"
        assert thrds[0]["subject"] == "[notmuch] [PATCH 2/2] notmuch-new: Tag mails not as unread when the seen flag in the maildir is set."
        assert thrds[0]["tags"] == ["inbox", "unread"]
        assert thrds[0]["total_messages"] == 1

        response = test_client.get('/api/query/to:notmuch and tag:deleted')
        assert response.status_code == 200
        thrds = json.loads(response.data.decode())
        assert len(thrds) == 1
        assert thrds[0]["authors"] == ["Antoine Beaupré <anarcat@orangeseeds.org>"]
        #assert thrds[0]["newest_date"] == "Mon Mar 19 11:56:54 2018"
        #assert thrds[0]["oldest_date"] == "Mon Mar 19 11:56:54 2018"
        assert thrds[0]["subject"] == 'Re: bug: "no top level messages" crash on Zen email loops'
        assert thrds[0]["tags"] == ["attachment", "deleted", "inbox", "unread"]
        assert thrds[0]["total_messages"] == 1

def test_address(setup):
    app = setup
    with app.test_client() as test_client:
        response = test_client.get('/api/address/antoine')
        assert response.status_code == 200
        addrs = json.loads(response.data.decode())
        assert len(addrs) == 1
        assert addrs[0] == "Antoine Beaupré <anarcat@orangeseeds.org>"


def test_email(setup):
    app = setup
    with app.test_client() as test_client:
        response = test_client.get('/api/email/antoine')
        assert response.status_code == 200
        addrs = json.loads(response.data.decode())
        assert len(addrs) == 1
        assert addrs[0] == "anarcat@orangeseeds.org"


def test_thread(setup):
    app = setup
    with app.test_client() as test_client:
        response = test_client.get('/api/query/to:notmuch')
        assert response.status_code == 200
        thrds = json.loads(response.data.decode())
        assert len(thrds) > 0
        response = test_client.get(f'/api/thread/{thrds[0]["thread_id"]}')
        assert response.status_code == 200
        msgs = json.loads(response.data.decode())
        assert len(msgs) == 1
        assert msgs[0]['bcc'] == []
        assert msgs[0]['cc'] == []
        assert msgs[0]['date'] == 'Mon, 19 Mar 2018 13:56:54 -0400'
        assert msgs[0]['delivered_to'] == None
        assert msgs[0]['forwarded_to'] == None
        assert msgs[0]['from'] == 'Antoine Beaupré <anarcat@orangeseeds.org>'
        assert msgs[0]['in_reply_to'] == '<87a7v42bv9.fsf@curie.anarc.at>'
        assert msgs[0]['message_id'] == '874llc2bkp.fsf@curie.anarc.at'
        assert msgs[0]['notmuch_id'] == '874llc2bkp.fsf@curie.anarc.at'
        assert msgs[0]['reply_to'] == None
        assert msgs[0]['signature'] == None
        assert msgs[0]['subject'] == 'Re: bug: "no top level messages" crash on Zen email loops'
        assert msgs[0]['tags'] == ['attachment', 'inbox', 'unread']
        assert msgs[0]['to'] == ['David Bremner <david@tethera.net>', 'notmuch@notmuchmail.org']
        assert msgs[0]['body'] == {'text/html': False, 'text/plain': 'And obviously I forget the frigging attachment.\n\n\nPS: don\'t we have a "you forgot to actually attach the damn file" plugin\nwhen we detect the word "attachment" and there\'s no attach? :p\n'}
        assert msgs[0]['attachments'] == [{'content': None, 'content_size': 5368, 'content_type': 'application/x-gtar-compressed', 'filename': 'zendesk-email-loop2.tgz', 'preview': None}]


def test_attachment(setup):
    app = setup
    with app.test_client() as test_client:
        response = test_client.get('/api/attachment/20111101080303.30A10409E@asxas.net/0')
        assert response.status_code == 200
        att = response.data
        assert len(att) == 940
        assert "BEGIN:VCALENDAR" in response.data.decode()


def test_message(setup):
    app = setup
    with app.test_client() as test_client:
        response = test_client.get('/api/message/874llc2bkp.fsf@curie.anarc.at')
        assert response.status_code == 200
        msg = json.loads(response.data.decode())
        assert msg['bcc'] == []
        assert msg['cc'] == []
        assert msg['date'] == 'Mon, 19 Mar 2018 13:56:54 -0400'
        assert msg['delivered_to'] == None
        assert msg['forwarded_to'] == None
        assert msg['from'] == 'Antoine Beaupré <anarcat@orangeseeds.org>'
        assert msg['in_reply_to'] == '<87a7v42bv9.fsf@curie.anarc.at>'
        assert msg['message_id'] == '874llc2bkp.fsf@curie.anarc.at'
        assert msg['notmuch_id'] == '874llc2bkp.fsf@curie.anarc.at'
        assert msg['reply_to'] == None
        assert msg['signature'] == None
        assert msg['subject'] == 'Re: bug: "no top level messages" crash on Zen email loops'
        assert msg['tags'] == ['attachment', 'inbox', 'unread']
        assert msg['to'] == ['David Bremner <david@tethera.net>', 'notmuch@notmuchmail.org']
        assert msg['body'] == {'text/html': False, 'text/plain': 'And obviously I forget the frigging attachment.\n\n\nPS: don\'t we have a "you forgot to actually attach the damn file" plugin\nwhen we detect the word "attachment" and there\'s no attach? :p\n'}
        assert msg['attachments'] == [{'content': None, 'content_size': 5368, 'content_type': 'application/x-gtar-compressed', 'filename': 'zendesk-email-loop2.tgz', 'preview': None}]


def test_message_nested(setup):
    app = setup
    with app.test_client() as test_client:
        response = test_client.get('/api/attachment_message/1530ae05-33a7-fa40-9473-ca625a14385a@posteo.de/0')
        assert response.status_code == 200
        msg = json.loads(response.data.decode())
        assert msg['bcc'] == []
        assert msg['cc'] == []
        assert msg['date'] == 'Mon, 20 Jul 2020 02:15:26 +0000'
        assert msg['delivered_to'] == 'arne.keller@posteo.de'
        assert msg['forwarded_to'] == None
        assert msg['from'] == 'POSTBAN͟K͟ <gxnwgddl@carcarry.de>'
        assert msg['in_reply_to'] == None
        assert msg['message_id'] == '<1M3lHZ-1jyAPt0pTn-000u1I@mrelayeu.kundenserver.de>'
        assert msg['notmuch_id'] == None
        assert msg['reply_to'] == None
        assert msg['signature'] == None
        assert msg['subject'] == 'BsetSign App : Y7P32-HTXU2-FRDG7'
        assert msg['tags'] == []
        assert msg['to'] == ['2012gdwu <2012gdwu@web.de>']
        assert msg['body'] == {'text/html': True, 'text/plain': '\n\n\n\n\n\n Sehr geehrter Herr / Frau …,\n\n Ab dem 20. Jul 2020 aktualisiert die Postbank alle BestSign-Anwendungen.\n\n\n\n Öffnen Sie den unten stehenden Aktivierungslink, um am Upgrade teilzunehmen. Verknüpfung\n\n\n\n\n https://meine.postbank.de/#/login\n\n\n\n\n Wir empfehlen dringend, dieses Upgrade durchzuführen.\n\n Reundliche Grüße,\n\n © 2020 Postbank– eine Niederlassung der Deutsche Bank AG\n\nHypnotiseur/zertifizierter Hypnosecoach (DVH)\nBurnoutpräventionscoach\nModeberater für Maßhemden/Maßblusen\nKurs/Seminarleiter Waldbaden/Waldcoach\nAm Wiesengrund 5\n24980 Schafflund\nTel.: 04639-98475\nMob.: 015117317305\nHome : www.hypnosepraxis-im-norden.de\nHome : www.masshemden-im-norden.de\nHome : www.waldbaden-zwischen-den-meeren.de\n\n'}
        assert msg['attachments'] == []


def test_message_html(setup):
    app = setup
    with app.test_client() as test_client:
        response = test_client.get('/api/message_html/CAKaJnP3B_VbHo0zbpKWxNjgojeXanBipF=gq6PrA-Lv7qR7a9w@mail.gmail.com')
        assert response.status_code == 200
        html = response.data.decode()
        assert html == '<div dir="ltr">credit card: 123456098712<div>passport\xa0number: 780381-23345</div><div>address: 10 Downing Street\xa0SW1A 2AA.</div></div>\n'


def test_message_raw(setup):
    app = setup
    with app.test_client() as test_client:
        response = test_client.get('/api/raw_message/874llc2bkp.fsf@curie.anarc.at')
        assert response.status_code == 200
        with open("test/mails/attachment.eml", "r", encoding="utf8") as f:
            assert f.read() == response.data.decode()


def test_change_tag_message(setup):
    app = setup
    q = "id:874llc2bkp.fsf@curie.anarc.at"
    db = notmuch2.Database()
    iter = db.messages(q)
    assert list(next(iter).tags) == ["attachment", "inbox", "unread"]
    db.close()

    with app.test_client() as test_client:
        response = test_client.get('/api/tag/remove/message/874llc2bkp.fsf@curie.anarc.at/unread')
        assert response.status_code == 200
        db = notmuch2.Database()
        iter = db.messages(q)
        assert list(next(iter).tags) == ["attachment", "inbox"]
        db.close()

        response = test_client.get('/api/tag/add/message/874llc2bkp.fsf@curie.anarc.at/foobar')
        assert response.status_code == 200
        db = notmuch2.Database()
        iter = db.messages(q)
        assert list(next(iter).tags) == ["attachment", "foobar", "inbox"]
        db.close()


def test_change_tag_message_deleted(setup_deleted):
    app = setup_deleted
    q = "id:874llc2bkp.fsf@curie.anarc.at"
    db = notmuch2.Database()
    iter = db.messages(q)
    assert list(next(iter).tags) == ["attachment", "deleted", "inbox", "unread"]
    db.close()

    with app.test_client() as test_client:
        response = test_client.get('/api/tag/remove/message/874llc2bkp.fsf@curie.anarc.at/unread')
        assert response.status_code == 200
        db = notmuch2.Database()
        iter = db.messages(q)
        assert list(next(iter).tags) == ["attachment", "deleted", "inbox"]
        db.close()

        response = test_client.get('/api/tag/add/message/874llc2bkp.fsf@curie.anarc.at/foobar')
        assert response.status_code == 200
        db = notmuch2.Database()
        iter = db.messages(q)
        assert list(next(iter).tags) == ["attachment", "deleted", "foobar", "inbox"]
        db.close()


def test_change_tag_message_batch(setup):
    app = setup
    q = "id:874llc2bkp.fsf@curie.anarc.at"
    db = notmuch2.Database()
    iter = db.messages(q)
    assert list(next(iter).tags) == ["attachment", "inbox", "unread"]
    db.close()

    with app.test_client() as test_client:
        response = test_client.get('/api/tag_batch/message/874llc2bkp.fsf@curie.anarc.at/-unread foobar')
        assert response.status_code == 200
        db = notmuch2.Database()
        iter = db.messages(q)
        assert list(next(iter).tags) == ["attachment", "foobar", "inbox"]
        db.close()


def test_change_tag_thread(setup):
    app = setup
    q = "from:stefan@datenfreihafen.org"
    db = notmuch2.Database()
    threads = list(db.threads(q))
    assert list(threads[0].tags) == ["inbox", "unread"]
    id = threads[0].threadid
    db.close()

    with app.test_client() as test_client:
        response = test_client.get(f'/api/tag/remove/thread/{id}/unread')
        assert response.status_code == 200
        db = notmuch2.Database()
        threads = list(db.threads(q))
        assert list(threads[0].tags) == ["inbox"]
        db.close()

        response = test_client.get(f'/api/tag/add/thread/{id}/foobar')
        assert response.status_code == 200
        db = notmuch2.Database()
        threads = list(db.threads(q))
        assert list(threads[0].tags) == ["foobar", "inbox"]
        db.close()


def test_change_tag_thread_batch(setup):
    app = setup
    q = "from:stefan@datenfreihafen.org"
    db = notmuch2.Database()
    threads = list(db.threads(q))
    assert list(threads[0].tags) == ["inbox", "unread"]
    id = threads[0].threadid
    db.close()

    with app.test_client() as test_client:
        response = test_client.get(f'/api/tag_batch/thread/{id}/-unread foobar')
        assert response.status_code == 200
        db = notmuch2.Database()
        threads = list(db.threads(q))
        assert list(threads[0].tags) == ["foobar", "inbox"]
        db.close()


def test_send(setup):
    app = setup

    pd = {"from": "foo", "to": "bar@bar.com", "cc": "", "bcc": "", "subject": "test",
          "body": "foobar", "action": "compose", "tags": "foo,bar"}

    app.config.custom["accounts"] = [{"id": "foo",
                                      "name": "Foo Bar",
                                      "email": "foo@bar.com",
                                      "sendmail": "cat",
                                      "additional_sent_tags": ["test"]}]

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

        id = re.search(r'Message-ID: <([^>]+)>', text).group(1)
        db = notmuch2.Database()
        num = db.count_messages(f"id:{id}")
        assert num == 1
        iter = db.messages(f"id:{id}")
        msg = next(iter)
        assert msg.header("subject") == 'test'
        assert list(msg.tags) == ["bar", "foo", "sent", "test"]
        os.unlink(msg.path)
        db.close()
