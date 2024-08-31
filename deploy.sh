#!/bin/bash

set -e

[ -d prod ] || mkdir prod
rm -rf prod/*
cd src/client
npm i
npm run build
cd ../..
cp src/server/src/kukulkan.py prod/
mkdir prod/static
cp -r src/client/dist/* prod/static/
