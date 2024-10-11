# Kukulkan

![Security Scanner](https://github.com/larskotthoff/kukulkan/actions/workflows/codeql.yml/badge.svg)
![Node.js Frontend](https://github.com/larskotthoff/kukulkan/actions/workflows/node.js.yml/badge.svg)
![Python Backend](https://github.com/larskotthoff/kukulkan/actions/workflows/python-app.yml/badge.svg)

Email client in beta stage.

## Main Features

- integrates with [notmuch](https://notmuchmail.org) and sendmail/msmtp/...
- fast and responsive web interface
- support for multiple email accounts
- all search queries/thread IDs/message IDs/etc part of URL, i.e. you can
  bookmark "views"
- autocomplete notmuch queries, including history of previous queries
- color chips for addresses and tags
- thread/message subject set as page title, i.e. you can search through your
  emails by typing in your browser search bar
- thread overview shows first few lines of messages that are not "open" for
  quick overview
- signatures/quoted text shown collapsed by default
- preview of attachments, quick links in collapsed messages for easy download
- threads can be shown in full or individual "fibers" (complete paths from root
  to leaf in thread tree)
- thread overview that shows map of thread tree colored by tag, addresses, and
  subject -- allows for easy identification of messages where subject was
  changed or people added or dropped
- text-only view of every message, HTML in emails stripped of tracking links etc
- allows to filter "CAUTION EXTERNAL EMAIL" and similar stuff before showing
  emails
- GPG and S/MIME verification support, S/MIME signing support
- email "security" verification (DKIM etc)
- edit notmuch tags for emails/threads with tag autocomplete, batch tagging for
  threads
- reply/reply all/forward emails
- calendar invitation support -- reply, preview (with times converted to local
  timezone), link to add to Google Calendar
- compose email templates
- autocomplete addressed when composing email
- tags from "parent" email automatically applied to new email when replying
- quote only relevant part of email being replied to
- draft emails backed up in localStorage
- external editor support
- progress bar when sending email
- TODO view -- lists emails tagged "todo", sorted by due date (specified in
  another tag), shows calendar overview and time until due
- keyboard shortcuts available for all actions
- fully tested backend and frontend
- minimal resource requirements, small frontend bundle size

Assumes that you have [notmuch](https://notmuchmail.org) installed and working. Start the server with `FLASK_APP=kukulkan NOTMUCH_CONFIG="$HOME/.notmuch-config" flask run` (changing the path to your notmuch config if necessary) and the client with `npm start` in the respective directories.

For the production version, it should be sufficient to serve the `prod/` directory through a suitable WSGI container, e.g. `gunicorn 'kukulkan.prod.kukulkan:create_app()'`.
The files in `prod/static` were created using `npm run build` in the `src/client` directory.
The `deploy.sh` script automates deployment to the `prod/` directory.

The server was inspired by [netviel](https://github.com/DavidMStraub/netviel).

Test emails from the [notmuch repository](https://git.notmuchmail.org/git?p=notmuch;a=tree;f=test/corpora), the [Python EML parse module](https://github.com/GOVCERT-LU/eml_parser/tree/master/samples), the [Apache James Project](https://github.com/xishian/james-project/tree/main/mailbox/store/src/test/resources/eml), [Expresso Livre 3](https://github.com/emersonfaria/ExpressoLivre3/tree/master/tests/tine20/Felamimail/files), and [Simple Java Mail](https://github.com/bbottema/simple-java-mail/tree/master/modules/simple-java-mail/src/test/resources/test-messages).
