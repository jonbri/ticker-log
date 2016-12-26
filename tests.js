// log results to console
QUnit.log(function(details) {
  if (details.result === true) {
    return;
  }
  console.log(
    'TEST FAILURE. ' +
    'MODULE: ' + details.module + ', ' +
    'NAME: ' + details.name + ', ' +
    'MESSAGE: ' + details.message
  );
});

QUnit.done(function(details) {
  console.log(
    'Total: ' + details.total + ', ' +
    'Failed: ' + details.failed + ', ' +
    'Passed: ' + details.passed + ', ' +
    'Time: ' + details.runtime + 'ms'
  );
});

//////////////////////////////////
// utility functions
function howManyLogDivs() {
  return jQuery('.ticker_log').length;
}

function getText(iLog) {
  return jQuery('.ticker_log')[iLog].innerHTML;
}

function getTextarea() {
  return jQuery('#tickerTextarea').find('textarea');
}

//////////////////////////////////
// tests
window.ticker_runTests = function() {
  var sPrefix = window.location.href;
  if (/ticker=/.test(sPrefix)) {
    alert('cannot run if settings set in url');
    return;
  }

  jQuery('#runTestsButton').prop("disabled", true);

  QUnit.module("test ticker-log", {
    beforeEach: function() {
      window.ticker.kill();
    },
    afterEach: function() {
      window.ticker.reset();
    }
  });

  QUnit.test("check test setup", function(assert) {
    assert.strictEqual(howManyLogDivs(), 0, "zero log divs are present");
  });

  QUnit.test("test config", function(assert) {
    window.ticker.config({
      'foo': 'bar',
      'interval': 999
    });
    assert.strictEqual(window.ticker._oConfig.foo, 'bar', 'test non-official property');
    assert.strictEqual(window.ticker._oConfig.interval, 999, 'test official property');
  });

  QUnit.test("does log appear", function(assert) {
    // add one log div
    console.log('`', 'log 0 a');
    assert.strictEqual(howManyLogDivs(), 1, "one log div is present");
    assert.strictEqual('log 0 a', getText(0), 'correct text');

    // clear log divs
    window.ticker.kill();

    // add two log divs
    console.log('`', 'log 0 b');
    console.log('`', 'log 1');
    assert.strictEqual(howManyLogDivs(), 2, "two log divs are present");
    assert.strictEqual('log 0 b', getText(0), 'correct text');
    assert.strictEqual('log 1', getText(1), 'correct text');
  });

  QUnit.test("print api", function(assert) {
    window.ticker.print('lorum ipsum');
    assert.strictEqual(howManyLogDivs(), 1, "print api works");
    assert.strictEqual('lorum ipsum', getText(0), 'correct text');
  });

  QUnit.test("print api with output textarea", function(assert) {
    window.ticker.print('lorum ipsum', {
      textarea: true
    });
    assert.strictEqual(getTextarea().length, 1, "output textarea present");
  });

  QUnit.test("print api -> make sure textarea's are cleaned up", function(assert) {
    window.ticker.print('one', {
      textarea: true
    });
    window.ticker.print('two', {
      textarea: true
    });

    assert.strictEqual(document.querySelectorAll('#tickerTextarea').length, 1, "only 1 textarea");
  });

  QUnit.test("kill should remove output textarea", function(assert) {
    window.ticker.output();
    window.ticker.kill();
    assert.strictEqual(document.querySelectorAll('#tickerTextarea').length, 0, "textarea should not show");
  });

  QUnit.test("output", function (assert) {
    // show a log div and output textarea
    console.log('`', 'lorum ipsum');

    window.ticker.output();

    // make sure the textarea shows with the correct content
    assert.strictEqual(getTextarea().length, 1, "output textarea shows");
    assert.strictEqual(getTextarea().val().indexOf("lorum ipsum"), 0, "output textarea has correct content");

    // now hide the textarea
    window.ticker.output();

    // make sure textarea is gone
    assert.strictEqual(getTextarea().length, 0, "no output textarea present afterwards");
  });

  QUnit.test("output all", function (assert) {
    // show a log div and output textarea
    console.log('`', 'outputAll 0');
    window.ticker.print('outputAll 1')
    window.ticker.outputAll();

    // make sure the textarea shows with the correct content
    assert.strictEqual(getTextarea().length, 1, "output textarea shows");
    assert.ok(getTextarea().val().indexOf("outputAll 0") !== -1, "console.log text shows");
    assert.ok(getTextarea().val().indexOf("outputAll 1") !== -1, "print api text shows");
  });

  QUnit.test("flip", function(assert) {
    function getContents() {
      return getTextarea().val().split('\n').join();
    }
    console.log('`', 'one');
    console.log('`', 'two');
    console.log('`', 'three');
    window.ticker.output();
    assert.strictEqual(getContents(), 'one,two,three', "contents in original order");
    window.ticker.flip();
    assert.strictEqual(getContents(), 'three,two,one', "contents have been flipped");
    window.ticker.flip();
    assert.strictEqual(getContents(), 'one,two,three', "contents back to original order");
  });

  QUnit.test("dump", function(assert) {
    // show configuration on screen
    window.ticker.dump();

    // make sure config shows
    assert.strictEqual(getTextarea().length, 1, "output textarea shows");
  });

  QUnit.test("help", function(assert) {
    // show configuration on screen
    window.ticker.help();

    // make sure config shows
    assert.ok(howManyLogDivs() > 0, "help is showing");
  });

  QUnit.test("pause", function(assert) {
    window.ticker.pause();
    assert.strictEqual(window.ticker._oConfig.pauseMode, true, 'test pauseMode property');
  });

  QUnit.test("moveRight", function(assert) {
    function isLeft() {
      assert.strictEqual(jQuery('.ticker_log').offset().left, 0, "logs are to the left of the screen");
    }
    function isRight() {
      assert.ok(jQuery('.ticker_log').offset().left > 0, "logs are to the right of the screen");
    }

    // by default should be left
    window.ticker.test();
    isLeft();

    // should move to right
    window.ticker.moveRight();
    isRight();

    // move back to left
    window.ticker.moveLeft();
    isLeft();

    // should still be left
    window.ticker.moveLeft();
    isLeft();
  });

  QUnit.test("backtick and requireBackTick", function(assert) {
    console.log('`', 'lorum ipsum');
    assert.strictEqual(howManyLogDivs(), 1, "(back-tick used) one div present because back-tick used in console statement");

    window.ticker.kill();
    console.log('lorum ipsum');
    assert.strictEqual(howManyLogDivs(), 0, "(no back-tick) no log shows because requireBackTick is true");

    window.ticker.config({
      requireBackTick: false
    });

    window.ticker.kill();
    console.log('lorum ipsum');
    assert.strictEqual(howManyLogDivs(), 1, "(no back-tick) one div present because requireBackTick is false");

    window.ticker.kill();
    console.log('`', 'lorum ipsum');
    assert.strictEqual(howManyLogDivs(), 1, "(back-tick used) using back-tick still works");
  });

  QUnit.test("macro", function(assert) {
    window.ticker.registerMacro(8, function() {
      console.log('`', 'testing macro 8');
    });
    assert.strictEqual(howManyLogDivs(), 0, "macro is registered, no logs showing");
    window.ticker.runMacro(8);
    assert.strictEqual(howManyLogDivs(), 1, "one log div after running macro");
  });

  QUnit.test("announceMacros property", function(assert) {
    window.ticker.config({
      announceMacros: true
    });
    window.ticker.registerMacro(8, function() {
      console.log('`', 'testing macro 8');
    });
    assert.strictEqual(howManyLogDivs(), 1, "registation message");
    window.ticker.kill();
    window.ticker.runMacro(8);
    assert.strictEqual(howManyLogDivs(), 2, "two log divs after running macro");
    assert.ok(/running macro: 8/.test(getText(0)), "'running...' text shows");
  });

  QUnit.test("macro 9 - don't allow registerMacro api", function(assert) {
    window.ticker.registerMacro(9, function() {
      // this should never happen
      assert.ok(false, "should never execute macro 9 when using registerMacro api");
    });
    assert.strictEqual(howManyLogDivs(), 1, "one log div which should be the warning message");
    assert.ok(/macro 9 reserved/.test(getText(0)), 'warning text should appear');
  });

  QUnit.test("macro 9 (macroEdit)", function(assert) {
    window.ticker.macroEdit();
    getTextarea().text("console.log('`', 'lorum ipsum');");
    window.ticker.macroEdit();

    window.ticker.runMacro(9);
    assert.strictEqual(howManyLogDivs(), 1, "macro 9 message shows");

    assert.ok(/lorum ipsum/.test(getText(0)), 'console text shows');
  });

  QUnit.test("reset", function(assert) {
    window.ticker.reset();
    console.log('`', 'lorum ipsum');
    assert.strictEqual(howManyLogDivs(), 1, "log renders after reset");
  });

  QUnit.test("channels", function(assert) {
    assert.strictEqual('log', window.ticker._oConfig.channels[0], 'default channel is log');
    window.ticker.nextChannel();
    assert.strictEqual('debug', window.ticker._oConfig.channels[0], 'after change channel we are at debug');

    window.ticker.config({
      channels: ['warn']
    });
    assert.strictEqual('warn', window.ticker._oConfig.channels[0], 'explicitly set channel to warn');
    window.ticker.nextChannel();
    assert.strictEqual('error', window.ticker._oConfig.channels[0], 'after change channel we are at error');
  });

  QUnit.test("channels - multiple", function(assert) {
    window.ticker.config({
        channels: ['warn', 'error']
    });

    console.warn('`', 'warn');
    console.log('`', 'log');
    console.error('`', 'error');

    assert.strictEqual(howManyLogDivs(), 2, "only warn and error logs show");
  });

  QUnit.test("filtering - regex", function(assert) {
    window.ticker.filter(/^hello/);
    console.log('`', 'hello foo');
    console.log('`', 'bye foo');
    console.log('`', 'bye hello foo');
    assert.strictEqual(howManyLogDivs(), 1, "only match rendered");
    assert.ok(/hello foo/.test(getText(0)), "correct text");
  });

  QUnit.test("filtering - string", function(assert) {
    window.ticker.filter("hello");
    console.log('`', 'hello foo');
    console.log('`', 'bye foo');
    console.log('`', 'bye hello foo');
    assert.strictEqual(howManyLogDivs(), 2, "two matches since string can't have anchor");
    assert.ok(/hello foo/.test(getText(0)), "correct text 0");
    assert.ok(/bye hello foo/.test(getText(1)), "correct text 1");
  });

  QUnit.test("filtering - function", function(assert) {
    var iMatches = 0;
    window.ticker.filter(function(s) {
      if (s === 'hello') {
          iMatches++;
      }
    });
    console.log('`', 'hello');
    console.log('`', 'goodbye');
    assert.strictEqual(iMatches, 1, "only hello matched");
  });

  QUnit.test("listen to everything", function(assert) {
    window.ticker.listenToEverything();

    console.log('`', 'hello log with backtick');
    console.debug('`', 'hello debug with backtick');
    console.warn('`', 'helllo warn with backtick');
    console.error('`', 'hello error with backtick');
    console.trace('`', 'hello trace with backtick');
    console.log('hello log no backtick');
    console.debug('hello debug no backtick');
    console.warn('helllo warn no backtick');
    console.error('hello error no backtick');
    console.trace('hello trace no backtick');

    assert.strictEqual(howManyLogDivs(), 10, "all logs show");
  });

  QUnit.test("generateConfigString default", function(assert) {
    assert.strictEqual(ticker._generateConfigSerialization(), '{}', "default config");
  });

  QUnit.test("generateConfigString reflect speed change", function(assert) {
    window.ticker.config({ interval: 280 });
    assert.strictEqual(ticker._generateConfigSerialization(), '{%22interval%22:280}', "speed change");
  });

  QUnit.test("generateConfigString reflect speed and starting position change", function(assert) {
    window.ticker.config({ interval: 280, logStartTop: 105 });
    assert.strictEqual(ticker._generateConfigSerialization(), '{%22interval%22:280,%22logStartTop%22:105}', "speed change");
  });


  QUnit.test("exit", function(assert) {
    assert.ok('true');
    setTimeout(function() {
      jQuery('#runTestsButton').prop("disabled", false);
    }, 100);
  });
};

//////////////////////////////////
// setup

// turn off auto-run?
var href = window.location.href;
if (/[?&]autorun=false/.test(href) !== true) {
  window.ticker_runTests();
}

jQuery('#autorun').click(function() {
  var url = window.location.href;
  if (url.indexOf('autorun') > 0) {
    url = url.replace(/[\?&]+autorun=(false|true)/,'');
  } else {
    if (url.indexOf('?') === -1) {
      url += "?autorun=false";
    } else {
      url += "&autorun=false";
    }
  }
  window.location.replace(url);
});

