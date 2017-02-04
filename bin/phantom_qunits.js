"use strict";
var system = require('system');
var page = require('webpage').create();

// testing should take no longer than 10 ms
var iMaxTimeout = (10 * 1000);

// wait until fnIsDone returns true or the max timeout is reached
function waitFor(fnIsDone, fnCallback, timeOutMillis) {
    var iStartTime = new Date().getTime(),
        bCondition = false,
        interval = setInterval(function() {

            // stop if max-timeout reached
            if ((new Date().getTime() - iStartTime) > iMaxTimeout) {
                clearInterval(interval);
                console.log('ERROR: test timed out');
                phantom.exit(1);
                return;
            }

            // check if we are done yet
            if (fnIsDone() === true) {
                clearInterval(interval);
                fnCallback();
            }

        }, 100);
};


// validate invocation
if (system.args.length !== 2) {
    console.log('Usage: phantom-qunits.js URL');
    phantom.exit(1);
}

// route "console.log" calls from within the Page context to the main phantomjs context
page.onConsoleMessage = function(msg) {
    console.log(msg);
};

// open qunit page and process
page.open(system.args[1], function(status){
    if (status !== "success") {
        console.log("Unable to access network");
        phantom.exit(1);
    } else {
        waitFor(function() {
            // keep looking for the 'completed' dom element
            // that qunit renders when it's tests are finished
            return page.evaluate(function() {
                var el = document.getElementById('qunit-testresult');
                if (el && el.innerText.match('completed')) {
                    return true;
                }
                return false;
            });
        }, function() {
            // gather number of failed tests,
            // and exit process based on if there were any
            var iFailedTests = page.evaluate(function() {
                var el = document.getElementById('qunit-testresult');
                try {
                    return el.getElementsByClassName('failed')[0].innerHTML;
                } catch (e) {}
                return 10000;
            });
            phantom.exit((parseInt(iFailedTests, 10) > 0) ? 1 : 0);
        });
    }
});

