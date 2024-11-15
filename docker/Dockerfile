FROM ubuntu:latest

LABEL org.opencontainers.image.licenses="GPL-3.0-or-later" \
    org.opencontainers.image.source="https://github.com/larskotthoff/kukulkan" \
    org.opencontainers.image.vendor="larskotthoff"

RUN apt-get update -qq && apt-get install -y --no-install-recommends \
    git \
    xz-utils \
    python3-pip \
    wget \
    notmuch \
    python3-notmuch \
    gunicorn \
    nodejs \
    npm \
    python3-asn1crypto python3-bs4 python3-flask python3-icalendar python3-lxml python3-lxml-html-clean python3-m2crypto python3-werkzeug python3-gnupg \
    && rm -rf /var/lib/apt/lists/* \
    && pip install --break-system-packages recurrent

RUN cd \
    && git clone https://github.com/larskotthoff/kukulkan.git \
    && cd kukulkan \
    && ./deploy.sh

RUN cd \
    && mkdir -p .config/kukulkan

COPY .notmuch-config /root/.notmuch-config
COPY config /root/.config/kukulkan/config

RUN cd \
    && wget https://nmbug.notmuchmail.org/archive/notmuch-list.tar.xz \
    && tar xf notmuch-list.tar.xz \
    && notmuch new \
    && notmuch tag -unread date:..1M \
    && notmuch tag +patch subject:patch or attachment:.patch \
    && notmuch tag +bug subject:bug or body:bug \
    && notmuch tag +question body:question or subject:'?'

ENTRYPOINT gunicorn --bind 0.0.0.0:8000 --timeout 0 --threads 5 'root.kukulkan.prod.kukulkan:create_app()'
