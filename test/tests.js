//////////////////////////////////
// utility functions
function howManyLogDivs() {
    return jQuery('._ticker_log').length;
}

function getText(iLog) {
    return jQuery('._ticker_log')[iLog].innerHTML;
}

function getTextarea() {
    return jQuery('#_tickerTextarea').find('textarea');
}


//////////////////////////////////
// tests
window.ticker_runTests = function() {
    var iSafeDelay = 500;

    jQuery('#runTestsButton').prop("disabled", true);

    QUnit.module("test ticker-log", {
        beforeEach: function() {
            ticker.kill();
        },
        afterEach: function() {
            ticker.reset();
        }
    });

    QUnit.test("test config", function(assert) {
        ticker.config({
            'foo': 'bar',
            'interval': 999
        });
        assert.strictEqual(ticker._oConfig.foo, 'bar', 'test non-official property');
        assert.strictEqual(ticker._oConfig.interval, 999, 'test official property');
    });

    QUnit.test("does log appear", function(assert) {
        // at the start there are no log divs
        assert.strictEqual(howManyLogDivs(), 0, "zero log divs are present");

        // add one log div
        jQuery('#testButton').trigger("click");
        assert.strictEqual(howManyLogDivs(), 1, "one log div is present");

        // clear log divs
        ticker.kill();

        // add two log divs
        jQuery('#testButton').trigger("click");
        jQuery('#testButton').trigger("click");
        assert.strictEqual(howManyLogDivs(), 2, "two log divs are present");
    });

    QUnit.test("print api", function(assert) {
        ticker.print('lorum ipsum');
        assert.strictEqual(howManyLogDivs(), 1, "print api works");
        assert.strictEqual('lorum ipsum', getText(0), 'correct text');
    });

    /* TODO: need to reset "output" settings
    QUnit.test("print api with output textarea", function(assert) {
        ticker.print('lorum ipsum', {
            textarea: true
        });
        assert.strictEqual(getTextarea().length, 1, "output textarea present");

        // now hide the textarea
        ticker.output();
    });
    */

    QUnit.test("namespace", function(assert) {
        // at the start there are no log divs
        assert.strictEqual(howManyLogDivs(), 0, "zero log divs are present");

        // make sure log occurs when using console.log form
        console.log('`', 'hello ');
        assert.strictEqual(howManyLogDivs(), 1, "one log div is present");
    });

    QUnit.test("output", function (assert) {
        // at the start there is no output textarea
        assert.strictEqual(getTextarea().length, 0, "no output textarea present");

        // show a log div and output textarea
        jQuery('#testButton').trigger("click");
        ticker.output();

        // make sure the textarea shows with the correct content
        assert.strictEqual(getTextarea().length, 1, "output textarea shows");
        assert.strictEqual(getTextarea().val().indexOf("test: "), 0, "output textarea has correct content");

        // now hide the textarea
        ticker.output();

        // make sure textarea is gone
        assert.strictEqual(getTextarea().length, 0, "no output textarea present afterwards");
    });

    QUnit.test("dump", function(assert) {
        // make sure no logging showing
        assert.strictEqual(howManyLogDivs(), 0, "no log divs at start");

        // show configuration on screen
        jQuery('#testButton').trigger("click");

        // make sure config shows
        assert.ok(howManyLogDivs() > 0, "configuration is showing");
    });

    QUnit.test("help", function(assert) {
        // make sure no logging showing
        assert.strictEqual(howManyLogDivs(), 0, "no log divs at start");

        // show configuration on screen
        jQuery('#helpButton').trigger("click");

        // make sure config shows
        assert.ok(howManyLogDivs() > 0, "help is showing");
    });

    QUnit.test("pause", function(assert) {
        jQuery('#pauseButton').trigger("click");
        assert.strictEqual(ticker._oConfig.pauseMode, true, 'test pauseMode property');
    });

    QUnit.test("moveRight", function(assert) {
        function isLeft() {
            assert.strictEqual(jQuery('._ticker_log').offset().left, 0, "logs are to the left of the screen");
        }
        function isRight() {
            assert.ok(jQuery('._ticker_log').offset().left > 0, "logs are to the right of the screen");
        }

        // by default should be left
        ticker.test();
        isLeft();

        // should move to right
        jQuery('#moveRightButton').trigger("click");
        isRight();

        // move back to left
        jQuery('#moveLeftButton').trigger("click");
        isLeft();

        // should still be left
        jQuery('#moveLeftButton').trigger("click");
        isLeft();
    });

    QUnit.test("backtick and requireBackTick", function(assert) {
        console.log('`', 'lorum ipsum');
        assert.strictEqual(howManyLogDivs(), 1, "(back-tick used) one div present because back-tick used in console statement");

        ticker.kill();
        console.log('lorum ipsum');
        assert.strictEqual(howManyLogDivs(), 0, "(no back-tick) no log shows because requireBackTick is true");

        ticker.config({
            requireBackTick: false
        });

        ticker.kill();
        console.log('lorum ipsum');
        assert.strictEqual(howManyLogDivs(), 1, "(no back-tick) one div present because requireBackTick is false");

        ticker.kill();
        console.log('`', 'lorum ipsum');
        assert.strictEqual(howManyLogDivs(), 1, "(back-tick used) using back-tick still works");
    });

    QUnit.test("macro", function(assert) {
        ticker.registerMacro(8, function() {
            console.log('`', 'testing macro 8');
        });
        assert.strictEqual(howManyLogDivs(), 1, "one log divs to show registation message");
        ticker.kill();
        ticker.runMacro(8);
        assert.strictEqual(howManyLogDivs(), 2, "two log divs after running macro");
    });

    QUnit.test("macro 9 - don't allow registerMacro api", function(assert) {
        ticker.registerMacro(9, function() {
            // this should never happen
            assert.ok(false, "should never execute macro 9 when using registerMacro api");
        });
        assert.strictEqual(howManyLogDivs(), 1, "one log div which should be the warning message");
        assert.ok(/macro 9 reserved/.test(getText(0)), 'warning text should appear');
    });

    QUnit.test("macro 9 (macroEdit)", function(assert) {
        ticker.macroEdit();
        getTextarea().text("console.log('`', 'lorum ipsum');");
        ticker.macroEdit();
        assert.strictEqual(howManyLogDivs(), 1, "macro 9 registration message");

        ticker.kill();
        ticker.runMacro(9);
        assert.strictEqual(howManyLogDivs(), 2, "macro 9 shows 'running...' message and macro");

        assert.ok(/running macro: 9/.test(getText(0)), "'running...' text shows");
        assert.ok(/lorum ipsum/.test(getText(1)), 'console text shows');
    });

    QUnit.test("channels", function(assert) {
        assert.strictEqual('log', ticker._oConfig.channel, 'default channel is log');
        ticker.nextChannel();
        assert.strictEqual('debug', ticker._oConfig.channel, 'after change channel we are at debug');

        ticker.config({
            channel: 'warn'
        });
        assert.strictEqual('warn', ticker._oConfig.channel, 'explicitly set channel to warn');
        ticker.nextChannel();
        assert.strictEqual('error', ticker._oConfig.channel, 'after change channel we are at error');
    });


    // keep this as the final test
    QUnit.test("final", function(assert) {
        var done = assert.async();
        assert.ok(true, "");
        setTimeout(function() {
            jQuery('#runTestsButton').prop("disabled", false);
            done();
        }, 100);
    });
};
