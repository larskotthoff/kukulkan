# Kukulkan

Email client in alpha stage.

Assumes that you have [notmuch](https://notmuchmail.org) installed and working. Start the server with `FLASK_APP=kukulkan NOTMUCH_CONFIG="$HOME/.notmuch-config" flask run` (changing the path to your notmuch config if necessary) and the client with `npm start` in the respective directories.

For the production version, it should be sufficient to serve the `src/server/` directory through a suitable WSGI container, e.g. `gunicorn 'kukulkan.src.server.kukulkan:create_app()'`.
The files in `src/server/static` were created using `npm run build` in the `src/client` directory, which also copies everything into place.
