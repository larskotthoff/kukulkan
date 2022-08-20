# Kukulkan

Email client in alpha stage.

Assumes that you have [notmuch](https://notmuchmail.org) installed and working. Start the server with `FLASK_APP=kukulkan NOTMUCH_CONFIG="$HOME/.notmuch-config" flask run` (changing the path to your notmuch config if necessary) and the client with `npm start` in the respective directories.

For the production version, it should be sufficient to serve the `prod/` directory through a suitable WSGI container, e.g. `gunicorn 'kukulkan.prod.kukulkan:create_app()'`.
The files in `prod/static` were created using `npm run build` in the `src/client` directory.
The `deploy.sh` script automates deployment to the `prod/` directory.
