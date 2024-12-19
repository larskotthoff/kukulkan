#!/usr/bin/env bash

set -e

[ -d prod ] || mkdir prod
rm -rf prod/*
cd client
npm i
npm run build
cd ..
cp server/src/kukulkan.py prod/
mkdir prod/static
cp -r client/dist/* prod/static/
rm -f prod/static/stats.html
