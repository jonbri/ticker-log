// TODO: can I make my tests atomic so I don't need this?
QUnit.config.reorder = false;

var defaultStartUrl = "http://localhost:9000/index.html";


//////////////////////////////////
// utility functions
function howManyLogDivs() {
    return jQuery('._ticker_log').length;
}

function howManyTextareas() {
    return document.querySelectorAll('#_tickerTextarea').length;
}

function getText(iLog) {
    return jQuery('._ticker_log')[iLog].innerHTML;
}

function getTextarea() {
    return jQuery('#_tickerTextarea').find('textarea');
}

function testUrlSave(assert, o) {
    assert.strictEqual(window._ticker._generateSaveUrl(o.start), o.expected, o.message);
}



//////////////////////////////////
// tests
window.ticker_runTests = function() {
    var iSafeDelay = 500;

    var sPrefix = window.location.href;
    if (/_ticker=/.test(sPrefix)) {
        alert('cannot run if settings set in url');
        return;
    }

    jQuery('#runTestsButton').prop("disabled", true);

    QUnit.module("test ticker-log", {
        beforeEach: function() {
            window._ticker.kill();
        },
        afterEach: function() {
            window._ticker.reset();
        }
    });

    QUnit.test("test config", function(assert) {
        window._ticker.config({
            'foo': 'bar',
            'interval': 999
        });
        assert.strictEqual(window._ticker._oConfig.foo, 'bar', 'test non-official property');
        assert.strictEqual(window._ticker._oConfig.interval, 999, 'test official property');
    });

    QUnit.test("does log appear", function(assert) {
        // at the start there are no log divs
        assert.strictEqual(howManyLogDivs(), 0, "zero log divs are present");

        // add one log div
        console.log('`', 'log 0');
        assert.strictEqual(howManyLogDivs(), 1, "one log div is present");

        // clear log divs
        window._ticker.kill();

        // add two log divs
        console.log('`', 'log 0');
        console.log('`', 'log 1');
        assert.strictEqual(howManyLogDivs(), 2, "two log divs are present");
    });

    QUnit.test("print api", function(assert) {
        window._ticker.print('lorum ipsum');
        assert.strictEqual(howManyLogDivs(), 1, "print api works");
        assert.strictEqual('lorum ipsum', getText(0), 'correct text');
    });

    QUnit.test("print api with output textarea", function(assert) {
        window._ticker.print('lorum ipsum', {
            textarea: true
        });
        assert.strictEqual(getTextarea().length, 1, "output textarea present");

        // now hide the textarea
        window._ticker.output();
    });

    QUnit.test("print api -> make sure textarea's are cleaned up", function(assert) {
        window._ticker.print('one', {
            textarea: true
        });
        window._ticker.print('two', {
            textarea: true
        });
        assert.strictEqual(howManyTextareas(), 1, "only 1 textarea");
    });

    QUnit.test("output", function (assert) {
        // at the start there is no output textarea
        assert.strictEqual(getTextarea().length, 0, "no output textarea present");

        // show a log div and output textarea
        console.log('`', 'lorum ipsum');
        window._ticker.output();

        // make sure the textarea shows with the correct content
        assert.strictEqual(getTextarea().length, 1, "output textarea shows");
        assert.strictEqual(getTextarea().val().indexOf("lorum ipsum"), 0, "output textarea has correct content");

        // now hide the textarea
        window._ticker.output();

        // make sure textarea is gone
        assert.strictEqual(getTextarea().length, 0, "no output textarea present afterwards");
    });

    QUnit.test("output all", function (assert) {
        // at the start there is no output textarea
        assert.strictEqual(getTextarea().length, 0, "no output textarea present");

        // show a log div and output textarea
        console.log('`', 'outputAll 0');
        window._ticker.print('outputAll 1')
        window._ticker.outputAll();

        // make sure the textarea shows with the correct content
        assert.strictEqual(getTextarea().length, 1, "output textarea shows");
        assert.ok(getTextarea().val().indexOf("outputAll 0") !== -1, "console.log text shows");
        assert.ok(getTextarea().val().indexOf("outputAll 1") !== -1, "print api text shows");
    });

    QUnit.test("dump", function(assert) {
        // make sure no logging showing
        assert.strictEqual(howManyLogDivs(), 0, "no log divs at start");

        // show configuration on screen
        window._ticker.dump();

        // make sure config shows
        assert.strictEqual(getTextarea().length, 1, "output textarea shows");
    });

    QUnit.test("help", function(assert) {
        // make sure no logging showing
        assert.strictEqual(howManyLogDivs(), 0, "no log divs at start");

        // show configuration on screen
        window._ticker.help();

        // make sure config shows
        assert.ok(howManyLogDivs() > 0, "help is showing");
    });

    QUnit.test("pause", function(assert) {
        window._ticker.pause();
        assert.strictEqual(window._ticker._oConfig.pauseMode, true, 'test pauseMode property');
    });

    QUnit.test("moveRight", function(assert) {
        function isLeft() {
            assert.strictEqual(jQuery('._ticker_log').offset().left, 0, "logs are to the left of the screen");
        }
        function isRight() {
            assert.ok(jQuery('._ticker_log').offset().left > 0, "logs are to the right of the screen");
        }

        // by default should be left
        window._ticker.test();
        isLeft();

        // should move to right
        window._ticker.moveRight();
        isRight();

        // move back to left
        window._ticker.moveLeft();
        isLeft();

        // should still be left
        window._ticker.moveLeft();
        isLeft();
    });

    QUnit.test("backtick and requireBackTick", function(assert) {
        console.log('`', 'lorum ipsum');
        assert.strictEqual(howManyLogDivs(), 1, "(back-tick used) one div present because back-tick used in console statement");

        window._ticker.kill();
        console.log('lorum ipsum');
        assert.strictEqual(howManyLogDivs(), 0, "(no back-tick) no log shows because requireBackTick is true");

        window._ticker.config({
            requireBackTick: false
        });

        window._ticker.kill();
        console.log('lorum ipsum');
        assert.strictEqual(howManyLogDivs(), 1, "(no back-tick) one div present because requireBackTick is false");

        window._ticker.kill();
        console.log('`', 'lorum ipsum');
        assert.strictEqual(howManyLogDivs(), 1, "(back-tick used) using back-tick still works");
    });

    QUnit.test("macro", function(assert) {
        window._ticker.kill();
        window._ticker.registerMacro(8, function() {
            console.log('`', 'testing macro 8');
        });
        assert.strictEqual(howManyLogDivs(), 0, "macro is registered, no logs showing");
        window._ticker.runMacro(8);
        assert.strictEqual(howManyLogDivs(), 1, "one log div after running macro");
    });

    QUnit.test("announceMacros property", function(assert) {
        window._ticker.kill();
        window._ticker.config({
            announceMacros: true
        });
        window._ticker.registerMacro(8, function() {
            console.log('`', 'testing macro 8');
        });
        assert.strictEqual(howManyLogDivs(), 1, "registation message");
        window._ticker.kill();
        window._ticker.runMacro(8);
        assert.strictEqual(howManyLogDivs(), 2, "two log divs after running macro");
        assert.ok(/running macro: 8/.test(getText(0)), "'running...' text shows");
    });

    QUnit.test("macro 9 - don't allow registerMacro api", function(assert) {
        window._ticker.registerMacro(9, function() {
            // this should never happen
            assert.ok(false, "should never execute macro 9 when using registerMacro api");
        });
        assert.strictEqual(howManyLogDivs(), 1, "one log div which should be the warning message");
        assert.ok(/macro 9 reserved/.test(getText(0)), 'warning text should appear');
    });

    QUnit.test("macro 9 (macroEdit)", function(assert) {
        window._ticker.macroEdit();
        getTextarea().text("console.log('`', 'lorum ipsum');");
        window._ticker.macroEdit();

        window._ticker.runMacro(9);
        assert.strictEqual(howManyLogDivs(), 1, "macro 9 message shows");

        assert.ok(/lorum ipsum/.test(getText(0)), 'console text shows');
    });

    QUnit.test("reset", function(assert) {
        window._ticker.reset();
        console.log('`', 'lorum ipsum');
        assert.strictEqual(howManyLogDivs(), 1, "log renders after reset");
    });

    QUnit.test("channels", function(assert) {
        assert.strictEqual('log', window._ticker._oConfig.channels[0], 'default channel is log');
        window._ticker.nextChannel();
        assert.strictEqual('debug', window._ticker._oConfig.channels[0], 'after change channel we are at debug');

        window._ticker.config({
            channels: ['warn']
        });
        assert.strictEqual('warn', window._ticker._oConfig.channels[0], 'explicitly set channel to warn');
        window._ticker.nextChannel();
        assert.strictEqual('error', window._ticker._oConfig.channels[0], 'after change channel we are at error');
    });

    QUnit.test("channels - multiple", function(assert) {
        window._ticker.config({
            channels: ['warn', 'error']
        });

        console.warn('`', 'warn');
        console.log('`', 'log');
        console.error('`', 'error');

        assert.strictEqual(howManyLogDivs(), 2, "only warn and error logs show");
    });

    QUnit.test("filtering - regex", function(assert) {
        window._ticker.filter(/^hello/);
        console.log('`', 'hello foo');
        console.log('`', 'bye foo');
        console.log('`', 'bye hello foo');
        assert.strictEqual(howManyLogDivs(), 1, "only match rendered");
        assert.ok(/hello foo/.test(getText(0)), "correct text");
    });

    QUnit.test("filtering - string", function(assert) {
        window._ticker.filter("hello");
        console.log('`', 'hello foo');
        console.log('`', 'bye foo');
        console.log('`', 'bye hello foo');
        assert.strictEqual(howManyLogDivs(), 2, "two matches since string can't have anchor");
        assert.ok(/hello foo/.test(getText(0)), "correct text 0");
        assert.ok(/bye hello foo/.test(getText(1)), "correct text 1");
    });

    QUnit.test("filtering - function", function(assert) {
        var iMatches = 0;
        window._ticker.filter(function(s) {
            if (s === 'hello') {
                iMatches++;
            }
        });
        console.log('`', 'hello');
        console.log('`', 'goodbye');
        assert.strictEqual(iMatches, 1, "only hello matched");
    });

    QUnit.test("listen to everything", function(assert) {
        window._ticker.listenToEverything();

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
        testUrlSave(assert, {
            start: defaultStartUrl,
            expected: defaultStartUrl + "?_ticker={}",
            message: "correct default url"
        });
    });

    QUnit.test("generateConfigString reflect speed change", function(assert) {
        window._ticker.config({
            interval: 280
        });

        testUrlSave(assert, {
            start: defaultStartUrl,
            expected: defaultStartUrl + "?_ticker={%22interval%22:280}",
            message: "correct url with speed change"
        });
    });

    QUnit.test("generateConfigString reflect speed and starting position change", function(assert) {
        window._ticker.config({
            interval: 280,
            logStartTop: 105
        });

        testUrlSave(assert, {
            start: defaultStartUrl,
            expected: defaultStartUrl + "?_ticker={%22interval%22:280,%22logStartTop%22:105}",
            message: "correct url with speed and position change"
        });
    });

    QUnit.test("exit", function(assert) {
        assert.ok('true');
        setTimeout(function() {
            jQuery('#runTestsButton').prop("disabled", false);
        }, 100);
    });
};
