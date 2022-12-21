# Kukulkan

![Security Scanner](https://github.com/larskotthoff/kukulkan/actions/workflows/codeql.yml/badge.svg)
![Python Backend](https://github.com/larskotthoff/kukulkan/actions/workflows/python-app.yml/badge.svg)

Email client in alpha stage.

Assumes that you have [notmuch](https://notmuchmail.org) installed and working. Start the server with `FLASK_APP=kukulkan NOTMUCH_CONFIG="$HOME/.notmuch-config" flask run` (changing the path to your notmuch config if necessary) and the client with `npm start` in the respective directories.

For the production version, it should be sufficient to serve the `prod/` directory through a suitable WSGI container, e.g. `gunicorn 'kukulkan.prod.kukulkan:create_app()'`.
The files in `prod/static` were created using `npm run build` in the `src/client` directory.
The `deploy.sh` script automates deployment to the `prod/` directory.

The server was inspired by [netviel](https://github.com/DavidMStraub/netviel).

Test emails from the [notmuch repository](https://git.notmuchmail.org/git?p=notmuch;a=tree;f=test/corpora), the [Python EML parse module](https://github.com/GOVCERT-LU/eml_parser/tree/master/samples), the [Apache James Project](https://github.com/xishian/james-project/tree/main/mailbox/store/src/test/resources/eml), [Expresso Livre 3](https://github.com/emersonfaria/ExpressoLivre3/tree/master/tests/tine20/Felamimail/files), and [Simple Java Mail](https://github.com/bbottema/simple-java-mail/tree/master/modules/simple-java-mail/src/test/resources/test-messages).
