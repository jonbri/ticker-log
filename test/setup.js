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

