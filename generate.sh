#!/bin/sh

mkdir -p tmp
# git clone https://github.com/jonbri/ticker-log.git tmp/ticker-log

perl -nl -e 'my $var = "hi";
  if (/^\/\* http.*\*\//) {
    # skip line
  } elsif (/function ticker_go/) {
    # print out ticker lib
    open my $fh, "<", "./tmp/ticker-log/dist/ticker.min.js";
    my $lib = do { local $/; <$fh> };
    print $lib;
  } else {
    # print line
    print $_;
  }
    ' index.html


# rm -Rf tmp
