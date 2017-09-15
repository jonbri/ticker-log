#!/bin/sh

mkdir -p dist
version=`grep version ./package.json | \
    awk -F "\"" '{ print $4 }'`

echo "/* https://github.com/jonbri/ticker-log v$version" `date` "*/" > dist/ticker-log.min.js
uglifyjs index.js --compress --mangle >> dist/ticker-log.min.js
cp index.js dist/index.js
jsdoc -d "./dist/jsdoc" --private index.js

