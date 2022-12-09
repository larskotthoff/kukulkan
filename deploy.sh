#!/bin/sh

set -e

rm -rf prod/*
cd src/client
npm run build --omit=dev
cd ../..
cp src/server/src/kukulkan.py prod/
mkdir prod/static
cp -r src/client/build/* prod/static/
mv prod/static/static/* prod/static/ 
rm -rf prod/static/static
