#!/bin/sh

# make staging area
# clone ticker-log so I can get:
# * dist/ticker-log.min.js
# * dist/jsdoc
rm -Rf tmp
mkdir tmp
git clone https://github.com/jonbri/ticker-log.git tmp/ticker-log

# interate through index.html
# replace the embedded ticker-log lib with the version in ./tmp
perl -i -nl -e '
  # if the ticker lib header, just skip line
  if (/^\/\* http.*\*\//) {
    next;
  }

  # if ticker-lib, replace with new version
  elsif (/function ticker_go/) {
    open FH, "<", "./tmp/ticker-log/dist/ticker-log.min.js";
    my $lib = do { local $/; <FH> };
    close FH;
    chomp $lib;
    print $lib;
  }

  # otherwise, print line
  else {
    print $_;
  }
' index.html

# make jsdoc available
cp -R ./tmp/ticker-log/dist/jsdoc .

# print out the current version
grep version ./tmp/ticker-log/package.json | \
    awk -F "\"" '{ print "Current version:",$4 }'

echo

rm -Rf tmp
