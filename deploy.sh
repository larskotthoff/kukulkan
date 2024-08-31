#!/bin/sh

set -e

mkdir prod
rm -rf prod/*
cd src/client
npm run build --omit=dev
cd ../..
cp src/server/src/kukulkan.py prod/
mkdir prod/static
cp -r src/client/dist/* prod/static/
