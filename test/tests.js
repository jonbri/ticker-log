window.ticker_runTests = function() {
    var iSafeDelay = 500;

    jQuery('#runTestsButton').prop("disabled", true);
    window._ticker.kill();

    QUnit.test("test config", function(assert) {
        window._ticker.kill();

        window._ticker.config({
            'foo': 'bar',
            'interval': 999
        });
        assert.strictEqual(window._ticker._oConfig.foo, 'bar', 'test non-official property');
        assert.strictEqual(window._ticker._oConfig.interval, 999, 'test official property');
    });

    QUnit.test("does log appear", function(assert) {
        window._ticker.kill();

        // at the start there are no log divs
        assert.strictEqual(jQuery('._ticker_log').length, 0, "zero log divs are present");

        // add one log div
        jQuery('#testButton').trigger("click");
        assert.strictEqual(jQuery('._ticker_log').length, 1, "one log div is present");

        // clear log divs
        window._ticker.kill();

        // add two log divs
        jQuery('#testButton').trigger("click");
        jQuery('#testButton').trigger("click");
        assert.strictEqual(jQuery('._ticker_log').length, 2, "two log divs are present");
    });

    QUnit.test("namespace", function(assert) {
        window._ticker.kill();

        // at the start there are no log divs
        assert.strictEqual(jQuery('._ticker_log').length, 0, "zero log divs are present");

        // make sure log occurs when using console.log form
        console.log('`', 'hello ');
        assert.strictEqual(jQuery('._ticker_log').length, 1, "one log div is present");
    });

    QUnit.test("output", function (assert) {
        window._ticker.kill();

        function getTA() {
            return jQuery('#_tickerTextarea').find('textarea');
        }

        // at the start there is no output textarea
        QUnit.strictEqual(getTA().length, 0, "no output textarea present");

        // show a log div and output textarea
        jQuery('#testButton').trigger("click");
        window._ticker.output();

        // make sure the textarea shows with the correct content
        QUnit.strictEqual(getTA().length, 1, "output textarea shows");
        QUnit.strictEqual(getTA().val().indexOf("test: "), 0, "output textarea has correct content");

        // now hide the textarea
        window._ticker.output();

        // make sure textarea is gone
        QUnit.strictEqual(getTA().length, 0, "no output textarea present afterwards");
    });

    QUnit.test("dump", function(assert) {
        window._ticker.kill();

        // make sure no logging showing
        assert.strictEqual(jQuery('._ticker_log').length, 0, "no log divs at start");

        // show configuration on screen
        jQuery('#testButton').trigger("click");

        // make sure config shows
        assert.ok(jQuery('._ticker_log').length > 0, "configuration is showing");
    });

    QUnit.test("help", function(assert) {
        window._ticker.kill();

        // make sure no logging showing
        assert.strictEqual(jQuery('._ticker_log').length, 0, "no log divs at start");

        // show configuration on screen
        jQuery('#helpButton').trigger("click");

        // make sure config shows
        assert.ok(jQuery('._ticker_log').length > 0, "help is showing");
    });

    QUnit.test("pause", function(assert) {
        window._ticker.kill();
        jQuery('#pauseButton').trigger("click");
        assert.strictEqual(window._ticker._oConfig.pauseMode, true, 'test pauseMode property');
    });

    QUnit.test("moveRight", function(assert) {
        function isLeft() {
            assert.strictEqual(jQuery('._ticker_log').offset().left, 0, "logs are to the left of the screen");
        }
        function isRight() {
            assert.ok(jQuery('._ticker_log').offset().left > 0, "logs are to the right of the screen");
        }

        window._ticker.kill();

        // by default should be left
        window._ticker.test();
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
        function howManyLogDivs() {
            return jQuery('._ticker_log').length;
        }

        window._ticker.kill();
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

    // keep this as the final test
    QUnit.asyncTest("final", function(assert) {
        window._ticker.kill();
        assert.ok(true, "");
        setTimeout(function() {
            jQuery('#runTestsButton').prop("disabled", false);
            QUnit.start();
        }, 100);
    });
}
