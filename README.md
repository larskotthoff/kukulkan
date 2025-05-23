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
- filters trackers etc in HTML email
- GPG and S/MIME verification support, S/MIME signing support
- email templates
- external editor support
- TODO view -- lists emails tagged "todo", sorted by due date (specified in
  another tag), shows calendar overview and time until due
- thread groups -- "ad-hoc tags" for threads that belong together, but you don't
  want to create a new tag (e.g. single threads that are broken into multiple
  because of broken email clients, or an order confirmation and the
  corresponding cancellation)
- keyboard shortcuts available for all actions
- lots of tests for backend and frontend

Kukulkan uses some features that require a recent browser (e.g. CSS relative
colors) and does not provide any backwards compatibility for older browsers.
If you are not running a recent browser, things may break.

## Installation

Assumes that you have [notmuch](https://notmuchmail.org) installed and working.
You may need to install additional Python packages (in
[requirements.txt](https://github.com/larskotthoff/kukulkan/blob/main/server/requirements.txt))
and (for development only) node and the required node packages.

For the production version (e.g. a release), it should be sufficient to serve
the `prod/` directory through a suitable WSGI container, e.g. `gunicorn
'kukulkan.prod.kukulkan:create_app()'`. When using gunicorn, make sure not to
use the default "sync" worker as this breaks the async requests necessary to
show progress when sending. The files in `prod/static` were created using `npm
run build` in the `src/client` directory.

If your notmuch configuration is a non-standard place, you can specify this by
setting the NOTMUCH_CONFIG environment variable.

### Development

To set up the development environment, install the dependencies by running `pip
install -r requirements.txt` (or whatever is suitable for you) in the `server/`
directory and `npm i` in the `client/` directory.

Start the server with `FLASK_APP=kukulkan FLASK_DEBUG="true" flask run` and the
client with `npm start` in the respective directories. The `FLASK_DEBUG` option
is necessary to correctly serve templates, which are used to reduce the number
of requests.

The `deploy.sh` script automates building the production version and deployment
to the `prod/` directory.

## Configuration

The configuration is assumed to be at $XDG_CONFIG_HOME/.config/kukulkan/config;
an example configuration is provided in
[config-example](https://github.com/larskotthoff/kukulkan/blob/main/config-example).

Accounts that have `key` set will use this S/MIME key to sign sent emails. This
only works if the key is not password protected. The `filter` key allows to
specify what content in text/html and text/plain to replace; the second string
in the array is what to replace it with (leave empty to remove matches).

````
{
    "accounts": [ # define at least one account
        {
            "id": "foo", # internal ID, can be set arbitrarily
            "name": "My Name",
            "email": "foo@bar.com",
            "key": "/path/to/key.key", # optional
            "cert": "/path/to/cert.cert", # optional
            "sendmail": "msmtp --account=foo -t",
            "default": "true",
            # where to save sent mail -- if missing, use database.path from the notmuch config
            "save_sent_to": "/path/to/mail/foo/cur/",
            "additional_sent_tags": [ "foo" ] # tags to apply in addition to the ones specified in the user interface
        },

        {
            "id": "bar",
            "name": "Foo Bar",
            "email": "bar@foo.com",
            "sendmail": "msmtp --account=bar -t",
            "default": "false", # can also be omitted if false
            "save_sent_to": "/path/to/mail/bar/cur/",
            "additional_sent_tags": [ "bar" ]
        }

    ],

    "gpg-keyserver": "keyserver.ubuntu.com",
    # required for S/MIME verification
    "ca-bundle": "/etc/ca-certificates/extracted/email-ca-bundle.pem",
    # if you're running Kukulkan on a different machine to where your browser is
    # and you want external editing on the browser machine, set this to true
    "allow-cross-origin-write": "true",

    "filter": {
        "content": {
            # regular expressions are supported here
            "text/html": [ "<p>spam banner to be removed</p>", "" ],
            "text/plain": [ "Some warning that message was from external source.", "" ]
        }
    },

    "compose": {
        "external-editor": "command that will be suffixed with file name", # for example "nvim-qt --nofork"

        "templates": [
            {
                "shortcut": "1", # key to press in write view
                "description": "foo", # description shown in write view
                "template": "Thank you for your message." # body of email
            },

            {
                "shortcut": "2", # key to press in write view
                "description": "bar", # description shown in write view
                "template": { # alternative form where more can be specified -- all fields optional
                    "from": "foo", # ID of account as defined above
                    "to": ["Foo Bar <foo@bar.com>"],
                    "cc": ["Foo Bar <foo@bar.com>"],
                    "bcc": ["Foo Bar <foo@bar.com>"],
                    "subject": "This is a test.",
                    "tags": ["fooTag", "barTag"],
                    "body": "Thank you for your message."
                }
            }
        ]
    }

}
````

### External Editor Support

External editing works by making a request to a designated endpoint on the
server, which then spawns the external editor with a temporary file, waits for
the process to complete, and returns the contents of that same file to the
client.

There are two ways to make this work:
- The Kukulkan server runs on the same machine as the browser, and was started
  from a GUI environment (e.g. X11, wayland). The server will call the
  configured external editor and editing should work as expected.
- The Kukulkan server runs on a different machine than the browser. You can run
  another Kukulkan server on the same machine as your browser (doesn't need
  access to your mail) with an external editor configured. In the client
  settings page, change "When composing, use" to "external editor on localhost".
  This will make the request for the external editor to localhost instead of
  whatever machine the server is running on, and should work as above. Note that
  the protocol and port needs to be the same as for the remote server, and in
  the remote server configuration you need to have set
  `allow-cross-origin-write` to `true` (the external editor configuration on the
  remote server doesn't matter though).

## Usage

Demo at
[https://kukulkan-demo.onrender.com/](https://kukulkan-demo.onrender.com/),
with the [notmuch mailing list archive](https://nmbug.notmuchmail.org/archive/notmuch-list.tar.xz).

Note that by default, actions that go to a new page (open thread, reply, etc)
open a new tab, so you may need to allow this. You can change this in settings.
Also note that whenever an autocompletion popup is visible, Enter selects the
currently active completion, but does not perform the action (search for query,
apply tag, etc) -- press Enter again to apply the action. Escape closes the
autocomplete dialog without selecting a completion.

### Main View

<p align="middle">
  <img src="screens/main.png" width="74%" />
  <img src="screens/main-phone.png" width="24%" />
</p>

Query notmuch database for threads (try `tag:unread` or `date:"this month"`).

Shortcuts:
- Enter: open thread view
- Home: go to top of thread list
- End/0: to to end of thread list
- k/up: go up one
- j/down: go down one
- c: open compose view with new email
- s: go to settings
- /: focus search box and select all text
- Space/swipe right until list appears: mark currently active thread; icons will
  appear to tag/group/mark done/delete the marked threads
- t: open tagging box for active/marked threads
- Delete/swipe left until trash appears: tag active/marked threads with "deleted"; remove "unread" tag
- g: group active/marked threads as follows:
    - no threads have any group tags: create a new group
    - some threads have all the same group tag, others do not have any group
      tags: add the ungrouped threads to the group
    - all threads have the same group tag: ungroup (remove group tag)
    - threads have different group tags: remove all group tags and create a new
      group
- h/l: collapse/expand thread group

Scrolling with Shift held down will change the active thread.

In the tagging box, enter the list of tags to apply and remove (prefix with
"-"), then press Enter to apply changes. Press Escape to close without making
changes.

### TODO View

<p align="middle">
  <img src="screens/todo.png" width="74%" />
  <img src="screens/todo-phone.png" width="24%" />
</p>

Shows threads tagged "todo". Due dates for TODOs can be specified by applying a
tag of the format `due:<year>-<month>-<day>`, e.g. "due:2025-02-01". You can
enter dates in natural language (English) and they will autocomplete to this
format, e.g. "due:next Friday" or "due:Jan 27". If there are threads tagged with
a due date, a calendar will be shown on the left with marks when TODOs are due.
Threads are ordered by due date, soonest first, with all threads without a due
date at the end.

Note that if there are no threads tagged "todo", nothing will be shown.

Shortcuts:
- Enter: open thread view
- Home: go to top of thread list
- End/0: to to end of thread list
- k/up: go up one
- j/down: go down one
- c: open compose view with new email
- s: go to settings
- /: focus search box and select all text
- Space/swipe right until list appears: mark currently active thread; icons will
  appear to tag/group/mark done/delete the marked threads
- t: open tagging box for active/marked threads
- Delete: tag active/marked threads with "deleted"; remove "unread" tag
- d/swipe left until check mark appears: mark thread done -- remove "todo" and any "due:*" tags
- g: group active/marked threads as follows:
    - no threads have any group tags: create a new group
    - some threads have all the same group tag, others do not have any group
      tags: add the ungrouped threads to the group
    - all threads have the same group tag: ungroup (remove group tag)
    - threads have different group tags: remove all group tags and create a new
      group
- h/l: collapse/expand thread group

Scrolling with Shift held down will change the active thread.

Available at `/todo`
([https://kukulkan-840786380000.us-west1.run.app/todo](https://kukulkan-840786380000.us-west1.run.app/todo)).

### Thread View

<p align="middle">
  <img src="screens/thread.png" width="74%" />
  <img src="screens/thread-phone.png" width="24%" />
</p>

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

Deleted messages will be shown with a body of "(deleted message)". You can still
get the message by either removing the "deleted" tag or by opening the message
view (e.g. through the "print" shortcut/icon).

Shortcuts:
- Home/1: go to first message in fiber
- End/0: to to last message in fiber
- k/up: go up one
- K: go up ten
- j/down: go down one
- J: go down ten
- h/left/swipe right: activate lower-depth fiber
- l/right/swipe left: activate higher-depth fiber
- F: toggle between fiber and flat views
For the active message:
- r: open compose view to reply all
- R: open compose view to reply sender
- f: open compose view to forward
- t: focus tag input to change tags
- c: toggle between displaying plain text and HTML content
- e: toggle expanded/abbreviated quoted text in plain text view
- u: apply tag "unread"
- Delete: apply tag "deleted", remove tag "unread"
- p: open print view of message
- s: open security view of message (checks DMARC etc, requires [mailauth](https://github.com/postalsys/mailauth))
- w: open raw message (unparsed text of the message file)
- ?: open main view with query from:<sender of message>

Click on tags to remove them, or press Backspace in the tag edit field to
remove the last tag.

### Compose View

<p align="middle">
  <img src="screens/compose.png" width="74%" />
  <img src="screens/compose-phone.png" width="24%" />
</p>

Write new email, either from scratch or replying/forwarding an existing message.

Shortcuts:
- a: attach file to message
- b: focus text body input (may open external editor depending on settings)
- y: send message
- d: delete draft saved in `localStorage`

Templates can be applied by pressing the defined key -- there is no check
whether this overlaps with existing shortcuts.

Click on addresses/tags to remove them, or press Backspace in the respective
edit field to remove the last address/tag.

### Completions

Completions for chips (with colored background) require two presses of Enter to
be completed -- one to select from the completion menu, a second to confirm that
this should be a chip. This is to allow the user to manually adjust completed
entries.

This can cause issues on phones, where virtual keyboards sometimes don't allow
two Enters but advance to the next input field or something like that. To
confirm the chip, you can also enter two spaces. This will result in a spurious
space, but that should have no ill effects.

### Settings

Available at `/settings`
([https://kukulkan-840786380000.us-west1.run.app/settings](https://kukulkan-840786380000.us-west1.run.app/settings)).
Should be self-explanatory; settings are stored in `localStorage`, i.e. specific
to the browser you are using.


### General Architecture

```mermaid
graph TD;
    ms[Mail Server];
    mbsync[mbsync/offlineimap/...];
    notmuch[notmuch];
    msmtp[sendmail/msmtp/...];

    kukulkanback["<strong>Kukulkan Backend (Python)</strong>"];
    kukulkanfront["<strong>Kukulkan Frontend (JavaScript)</strong>"];

    ms --> mbsync;
    mbsync --> notmuch;
    notmuch <--> kukulkanback;
    kukulkanback --> msmtp;
    msmtp --> ms;

    kukulkanback <--> kukulkanfront;
```

## Credits

The UI was inspired by [astroid](https://github.com/astroidmail/astroid/), the server was inspired by [netviel](https://github.com/DavidMStraub/netviel).

Test emails from the [notmuch repository](https://git.notmuchmail.org/git?p=notmuch;a=tree;f=test/corpora), the [Python EML parse module](https://github.com/GOVCERT-LU/eml_parser/tree/master/samples), the [Apache James Project](https://github.com/xishian/james-project/tree/main/mailbox/store/src/test/resources/eml), [Expresso Livre 3](https://github.com/emersonfaria/ExpressoLivre3/tree/master/tests/tine20/Felamimail/files), [ripgrep](https://github.com/phiresky/ripgrep-all/tree/b4dbe1b8e802a8139cca33a4640ed99fded5cbe3/exampledir), [Simple Java Mail](https://github.com/bbottema/simple-java-mail/tree/master/modules/simple-java-mail/src/test/resources/test-messages), and [EML Process](https://github.com/cgungaloo/eml_process).

The favicon is from [here](https://mayadecipherment.com/2017/05/01/a-note-on-the-sign-for-tzihb-writing-painting/?amp=1) (thanks Colleen); the background image is Justin Kerr's drawing of [Yaxchilan lintel 15](https://www.britishmuseum.org/collection/object/E_Am1923-Maud-1).
