var ticker = window._ticker;

var aButtons = [
    'test',
    'help',
    'pause',
    'kill',
    'output',
    'outputAll',
    'dump',
    'moveUp',
    'moveDown',
    'moveRight',
    'moveLeft',
    'increaseSpeed',
    'decreaseSpeed'
];

// initialize test page
// setup button listeners
// setup qunit auto-run

// most buttons match their api names...
aButtons.forEach(function(sButton) {
    jQuery('#' + sButton + 'Button').click(function() {
        ticker[sButton].apply(this, []);
    });
});

// macro
jQuery('#registerMacroButton').click(function() {
    ticker.registerMacro(1, function() {
        console.log('`', 'in the macro');
        // ticker.print('hi', {textarea: true});
    });
});

jQuery('#runTestsButton').click(function() {
    window.ticker_runTests();
});

// wire up console buttons
['log', 'debug', 'warn','error', 'trace'].forEach(function(sChannel) {
    var sButton = 'console' + sChannel[0].toUpperCase() + sChannel.substring(1) + 'Button';
    jQuery('#' + sButton).click(function() {
        var bBacktick = jQuery('#useBacktick').is(':checked');
        if (bBacktick === true) {
            console[sChannel]('`', 'console.' + sChannel);
        } else {
            console[sChannel]('console.' + sChannel);
        }
    });
});

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

