#!/bin/sh

mkdir -p dist
jsdoc --private src/ticker.js
uglifyjs src/ticker.js --compress --mangle > dist/ticker.min.js
cp src/ticker.js dist/ticker.js
mkdir -p dist/jsdoc && cp -R out/* dist/jsdoc

