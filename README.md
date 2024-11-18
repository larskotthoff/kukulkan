# Kukulkan

![Security Scanner](https://github.com/larskotthoff/kukulkan/actions/workflows/codeql.yml/badge.svg)
![Node.js Frontend](https://github.com/larskotthoff/kukulkan/actions/workflows/node.js.yml/badge.svg)
![Python Backend](https://github.com/larskotthoff/kukulkan/actions/workflows/python-app.yml/badge.svg)

Email Client for Notmuch

## Main Features

- integrates with [notmuch](https://notmuchmail.org) and sendmail/msmtp/...
- fast and responsive web interface
- all search queries/thread IDs/message IDs/etc part of URL, i.e. you can
  bookmark "views"
- thread/message subject set as page title, i.e. you can search through your
  emails by typing in your browser search bar
- autocomplete notmuch queries, including history of previous queries, tags, due
  dates...
- threads can be shown in full or individual "fibers" (complete paths from root
  to leaf in thread tree), thread map for quick overview
- allows to filter "CAUTION EXTERNAL EMAIL" and similar stuff from emails
- GPG and S/MIME verification support, S/MIME signing support
- email templates
- external editor support
- TODO view -- lists emails tagged "todo", sorted by due date (specified in
  another tag), shows calendar overview and time until due
- keyboard shortcuts available for all actions
- lots of tests for backend and frontend

## Usage

Demo at
[https://kukulkan-840786380000.us-west1.run.app/](https://kukulkan-840786380000.us-west1.run.app/),
with the [notmuch mailing list archive](https://nmbug.notmuchmail.org/archive/notmuch-list.tar.xz).

Note that by default, actions that go to a new page (open thread, reply, etc)
open a new tab, so you may need to allow this. You can change this in settings.
Also note that whenever an autocompletion popup is visible, Enter selects the
currently active completion, but does not perform the action (search for query,
apply tag, etc) -- press Enter again to apply the action. Escape closes the
autocomplete dialog without selecting a completion.

### Main View

![Main View](screens/main.png?raw=true)

Query notmuch database for threads (try `tag:unread` or `date:"this month"`).

Keyboard shortcuts:
- Enter: open thread view
- Home: go to top of thread list
- End/0: to to end of thread list
- k/up: go up one
- K: go up ten
- j/down: go down one
- J: go down ten
- c: open compose view with new email
- s: go to settings
- /: focus search box and select all text
- Space: mark currently active thread
- t: open tagging box for active/marked threads
- Delete: tag active/marked threads with "deleted"; remove "unread" tag

In the tagging box, enter the list of tags to apply and remove (prefix with
"-"), then press Enter to apply changes. Press Escape to close without making
changes.

### TODO View

![TODO View](screens/todo.png?raw=true)

Shows threads tagged "todo". Due dates for TODOs can be specified by applying a
tag of the format `due:<year>-<month>-<day>`, e.g. "due:2025-02-01". If there
are threads tagged with a due date, a calendar will be shown on the left with
marks when TODOs are due. Threads are ordered by due date, soonest first, with
all threads without a due date at the end.

Note that if there are no threads tagged "todo", nothing will be shown.

Keyboard shortcuts:
- Enter: open thread view
- Home: go to top of thread list
- End/0: to to end of thread list
- k/up: go up one
- K: go up ten
- j/down: go down one
- J: go down ten
- c: open compose view with new email
- s: go to settings
- /: focus search box and select all text
- Space: mark currently active thread
- t: open tagging box for active/marked threads
- Delete: tag active/marked threads with "deleted"; remove "unread" tag
- d: mark thread done -- remove "todo" and any "due:*" tags

Available at `/todo`
([https://kukulkan-840786380000.us-west1.run.app/todo](https://kukulkan-840786380000.us-west1.run.app/todo)).

### Thread View

![Thread View](screens/thread.png?raw=true)

Shows messages in a thread. Threads are broken up into fibers by default, i.e.
complete paths from the leaves of the thread tree to the root (you can change
this in settings). Each fiber represents an unbroken conversation. On the left,
a thread map is shown that displays the different fibers and individual
messages. Message boxes are colored depending on the from/to/cc headers, the
subject, and any tags applied to the message to make it easy to identify when
people were added/dropped, the subject changed, etc. The y position of a message
box is determined by the temporal order in the thread, the x position by the
fiber it belongs to. All but the active fiber (whose messages are shown) are
shown with reduced opacity.

Keyboard shortcuts:
- Home/1: go to first message in fiber
- End/0: to to last message in fiber
- k/up: go up one
- K: go up ten
- j/down: go down one
- J: go down ten
- h/left: activate left fiber
- l/right: activate right fiber
- F: toggle between fiber and flat views
For the active message:
- r: open compose view to reply all
- R: open compose view to reply sender
- f: open compose view to forward
- t: focus tag input to change tags
- c: toggle between displaying plain text and HTML content
- Delete: apply tag "deleted", remove tag "unread"
- p: open print view of message
- s: open security view of message (checks DMARC etc)
- w: open raw message (unparsed text of the message file)
- ?: open main view with query from:<sender of message>

### Compose View

![Compose View](screens/compose.png?raw=true)

Write new email, either from scratch or replying/forwarding an existing message.

Keyboard shortcuts:
- a: attach file to message
- b: focus text body input (may open external editor depending on settings)
- y: send message
- d: delete draft saved in `localStorage`

Templates can be applied by pressing the defined key -- there is no check
whether this overlaps with existing shortcuts.

### Settings

Available at `/settings`
([https://kukulkan-840786380000.us-west1.run.app/settings](https://kukulkan-840786380000.us-west1.run.app/settings)).
Should be self-explanatory; settings are stored in `localStorage`, i.e. specific
to the browser you are using.


### General Architecture

```mermaid
flowchart K
    ms[Mail Server]
    mbsync[mbsync/offlineimap/...]
    notmuch[notmuch]
    kukulkanback[Kukulkan Backend (Python)]
    kukulkanfront[Kukulkan Frontend (JavaScript)]
    msmtp[sendmail/msmtp/...]

    ms --> mbsync
    mbsync --> notmuch
    notmuch --> kukulkanback
    kukulkanback --> notmuch
    kukulkanback --> kukulkanfront
    kukulkanfront --> kukulkanback
    kukulkanback --> msmtp
    msmtp --> ms
```

## Installation

Assumes that you have [notmuch](https://notmuchmail.org) installed and working.
You may need to install additional Python packages (in
[requirements.txt](https://github.com/larskotthoff/kukulkan/blob/main/server/requirements.txt))
and (for development only) node and the required node packages.

For the production version, it should be sufficient to serve the `prod/`
directory through a suitable WSGI container, e.g. `gunicorn 'kukulkan.prod.kukulkan:create_app()'`.
The files in `prod/static` were created using `npm run build` in the `src/client` directory.

For development, start the server with `FLASK_APP=kukulkan flask run`
 and the client with `npm start` in the respective directories.
The `deploy.sh` script automates deployment to the `prod/` directory.

The configuration is assumed to be at $XDG_CONFIG_HOME/.config/kukulkan/config;
an example configuration is provided in
[config-example](https://github.com/larskotthoff/kukulkan/blob/main/config-example).

Accounts that have `key` set will use this S/MIME key to sign sent emails. This
only works if the key is not password protected. The `filter` key allows to
specify what content in text/html and text/plain to replace; the second string
in the array is what to replace it with (leave empty to remove matches).

## Credits

The UI was inspired by [astroid](https://github.com/astroidmail/astroid/), the server was inspired by [netviel](https://github.com/DavidMStraub/netviel).

Test emails from the [notmuch repository](https://git.notmuchmail.org/git?p=notmuch;a=tree;f=test/corpora), the [Python EML parse module](https://github.com/GOVCERT-LU/eml_parser/tree/master/samples), the [Apache James Project](https://github.com/xishian/james-project/tree/main/mailbox/store/src/test/resources/eml), [Expresso Livre 3](https://github.com/emersonfaria/ExpressoLivre3/tree/master/tests/tine20/Felamimail/files), [ripgrep](https://github.com/phiresky/ripgrep-all/tree/b4dbe1b8e802a8139cca33a4640ed99fded5cbe3/exampledir), and [Simple Java Mail](https://github.com/bbottema/simple-java-mail/tree/master/modules/simple-java-mail/src/test/resources/test-messages).
