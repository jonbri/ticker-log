#!/bin/sh

mkdir -p dist
version=`grep version ./package.json | \
    awk -F "\"" '{ print $4 }'`

echo "/* https://github.com/jonbri/ticker-log v$version" `date` "*/" > dist/ticker-log.min.js
uglifyjs ticker-log.js --compress --mangle >> dist/ticker-log.min.js
cp ticker-log.js dist/ticker-log.js
jsdoc -d "./dist/jsdoc" --private ticker-log.js

