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
    && rm -rf /var/lib/apt/lists/*

RUN cd \
    && git clone https://github.com/larskotthoff/kukulkan.git \
    && cd kukulkan \
    && pip install --break-system-packages -r server/requirements.txt \
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
    && notmuch tag +question body:question or subject:'?' \
    && notmuch tag +todo date:1M.. and tag:patch

RUN /bin/bash -c 'for m in `notmuch search --output=threads tag:todo | grep a`; do notmuch tag +due:$(((RANDOM % 3) + `date +%Y`))-`printf "%02d" $(((RANDOM % 12) + 1))`-`printf "%02d" $(((RANDOM % 28) + 1))` $m; done'

ENTRYPOINT gunicorn --bind 0.0.0.0:8000 --timeout 0 --threads 5 'root.kukulkan.prod.kukulkan:create_app()'
