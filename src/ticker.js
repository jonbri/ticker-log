// ticker.js - An on-screen, in-browser, ticker-tape-style logging tool
// Jonathan Brink <jonathandavidbrink@gmail.com>
(function() {

    //////////////////////////////////
    // variables global to ticker

    var
        aChannels = ['log', 'debug', 'warn', 'error', 'trace'],
        oChannels = {},

        // default settings
        oDEFAULTS = {
            interval: 300,
            logStartTop: 30,
            align: 'left',
            requireBackTick: true
        },

        // global (to ticker) config
        oConfig = {
            silentMode: false,
            pauseMode: false,
            channel: 'log',
            adjustmentInterval: 25,
            lastTextareaAction: undefined,
            sMacro9Code: '// macro 9\r\r',
            logStyle: {
                position: "fixed",
                color: "black",
                "background-color": "#F2F2F2",
                padding: "1px",
                "z-index": 9998,
                top: 0,
                left: 0,
                'font-family': "monospace",
                'font-size': "14px",
                opacity: 0.85
            }
        },

        // log buffer
        aBuffer = [],

        // buffer of logs still-to-be-rendered
        aRenderBuffer = [],

        // macros (1-9)
        aMacros = {},

        // leave a 1/4 page buffer
        iAllowedHeight = window.innerHeight * 1.25,

        // the config settings that are configurable
        aConfigurableKeys = [
            'interval',
            'logStartTop',
            'align',
            'requireBackTick'
        ],

        sTextareaId = '_tickerTextarea',

        //
        keyIsDown = false,

        //
        aHelp = [
            '________________________________________________',
            'ticker__________________________________________',
            '________________________________________________',
            'Hold_the_backtick_(`)_key_down_to_enter_commands',
            '________________________________________________',
            'h_->_help_______________________________________',
            't_->_test_______________________________________',
            'p_->_pause_(freeze_output_toggle)_______________',
            'k_->_kill_(remove_all)__________________________',
            'o_->_output_(show_output_in_textarea_toggle)____',
            '0_->_output_all_(show_entire_log_history)_______',
            'd_->_dump_(show_configuration_values)___________',
            'b_->_back-tick_required_to_console_invocation___',
            '________________________________________________',
            'up_______->_increase_speed______________________',
            'down_____->_decrease_speed______________________',
            'right____->_move logs right_____________________',
            'left_____->_move logs left______________________',
            'pageup___->_increase_starting_point_____________',
            'pagedown_->_decrease_starting_point_____________',
            '________________________________________________',
            'enter_->_save_configuration_in_url______________',
            'c_____->_clear_configuration_in_url_____________',
            '________________________________________________',
            '________________________________________________',
            'Print_to_the_screen:____________________________',
            '__>> console.log("`",_"lorum_ipsum...")_________',
            '________________________________________________',
            '-',
            '-',
            '-'
        ],

        //
        KEYS = {
            BackTick: 192,
            Enter: 13,
            Up: 38,
            Down: 40,
            Right: 39,
            Left: 37,
            PageDown: 33,
            PageUp: 34,
            Tab: 9,
            Esc: 27,
            A: 65,
            B: 66,
            O: 79,
            D: 68,
            T: 84,
            P: 80,
            S: 83,
            K: 75,
            C: 67,
            H: 72,
            M: 77,
            "0": 48,
            "1": 49,
            "2": 50,
            "3": 51,
            "4": 52,
            "5": 53,
            "6": 54,
            "7": 55,
            "8": 56,
            "9": 57
        },

        //
        aActionKeys = [
            KEYS.Up,
            KEYS.Down,
            KEYS.Right,
            KEYS.Left,
            KEYS.Esc,
            KEYS.A,
            KEYS.B,
            KEYS.D,
            KEYS.T,
            KEYS.O,
            KEYS[0],
            KEYS.P,
            KEYS.K,
            KEYS.C,
            KEYS.H,
            KEYS.S,
            KEYS.M,
            KEYS.PageDown,
            KEYS.PageUp,
            KEYS.Tab,
            KEYS["0"],
            KEYS["1"],
            KEYS["2"],
            KEYS["3"],
            KEYS["4"],
            KEYS["5"],
            KEYS["6"],
            KEYS["7"],
            KEYS["8"],
            KEYS["9"]
        ];

    //////////////////////////////////
    // util functions

    // used to iterate over querySelectorAll
    // see: https://toddmotto.com/ditch-the-array-foreach-call-nodelist-hack/
    function forEach(array, callback, scope) {
        for (var i = 0; i < array.length; i++) {
          callback.call(scope, i, array[i]); // passes back stuff we need
        }
    }

    //
    function assignStyle(div, oStyle) {
        for (var key in oStyle) {
            if (oStyle.hasOwnProperty(key)) {
                div.style[key] = oStyle[key];
            }
        }
    }

    //
    function getUrlParamValue(name) {
        name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
        var regexS = "[\\?&]"+name+"=([^&#]*)",
            regex = new RegExp( regexS ),
            results = regex.exec(window.location.href);
        if( results === null ) {
            return null;
        } else {
            return results[1];
        }
    }

    //////////////////////////////////
    // api functions

    //
    function config(o) {
        for (var sKey in o) {
            oConfig[sKey] = o[sKey];
        }
    }

    //
    function print(text, bOverrideSilentMode, bInternal) {
        // TODO: move this so it's still in the buffer
        if (oConfig.silentMode === true && !bOverrideSilentMode) {
            return;
        }

        if (bInternal !== true) {
            aBuffer.unshift(text);
        }
        aRenderBuffer.unshift(text);
        flushBuffer();
    }

    //
    function nonSavedPrint(text) {
        print(text, false, true);
    }

    //
    function test() {
        if (oConfig.pauseMode === true) {
            nonSavedPrint('pauseMode');
            return;
        }
        print('test: ' + new Date(), true);
    }

    //
    function help() {
        oConfig.pauseMode = false;
        kill();

        oConfig.interval = oDEFAULTS.interval;
        oConfig.logStartTop = oDEFAULTS.logStartTop;

        for (var i = 0; i < aHelp.length; i++) {
            var text = aHelp[i];
            text = text.replace(/\_/g, '&nbsp;');
            print(text,true);
        }
    }

    //
    function kill() {
        oConfig.pauseMode = false;
        aRenderBuffer = [];
        var aLogNodes = document.querySelectorAll("._ticker");
        forEach(aLogNodes, function(i, oLogNode) {
            oLogNode.parentNode.removeChild(oLogNode);
        });
    }

    //
    function pause() {
        if (oConfig.pauseMode) {
            print("pause off");
        } else {
            print("paused");
        }
        oConfig.pauseMode = !oConfig.pauseMode;
    }

    //
    function output(bAll) {
        if (bAll === undefined) {
            bAll = false;
        }

        var sAllOutput='';

        // get all output
        if (bAll === true) {
            aBuffer.forEach(function(s) {
                sAllOutput += s + "\n";
            });
        } else {
            // just show items on screen
            var aLogNodes = document.querySelectorAll("._ticker_log");
            if (aLogNodes.length > 0) {
                forEach(aLogNodes, function(i, oLogNode) {
                    var string = oLogNode.innerHTML.trim();
                    string = string.replace(/&nbsp;/g,'');
                    sAllOutput += string + "\n";
                });
            }
        }

        toggleTextarea({
            text: sAllOutput,
            source: KEYS.O
        });
    }

    //
    function outputAll() {
        output(true);
    }

    //
    function dump() {
        var s = '';
        aConfigurableKeys.forEach(function(sKey) {
            s += (sKey + ': ' + oConfig[sKey]) + "\n";
        });
        s += "listening to console." + oConfig.channel + "\n";
        toggleTextarea({
            text: s,
            source: KEYS.D
        });
    }

    //
    function silent() {
        if (oConfig.silentMode === true) {
            oConfig.silentMode = false;
            print("silent mode off");
        } else {
            oConfig.silentMode = true;
        }
    }

    //
    function increaseSpeed(e) {
        if (oConfig.pauseMode) {
            nonSavedPrint('pauseMode');
            return;
        }
        oConfig.interval -= (oConfig.adjustmentInterval/2);
        print("speed: " + oConfig.interval);
    }

    //
    function decreaseSpeed(e) {
        if (oConfig.pauseMode) {
            nonSavedPrint('pauseMode');
            return;
        }
        oConfig.interval += oConfig.adjustmentInterval;
        print("speed: " + oConfig.interval);
    }

    //
    function moveRight(e) {
        oConfig.align = 'right';
        postConfigApply();

        // move existing logs
        var aLogNodes = document.querySelectorAll("._ticker_log");
        forEach(aLogNodes, function(i, oLogNode) {
            oLogNode.style.right = 0;
            oLogNode.style.left = 'inherit';
            oLogNode.style['text-align'] = 'right';
        });
        test();
    }

    //
    function moveLeft(e) {
        oConfig.align = 'left';
        postConfigApply();

        // move existing logs
        var aLogNodes = document.querySelectorAll("._ticker_log");
        forEach(aLogNodes, function(i, oLogNode) {
            oLogNode.style.left = 0;
            oLogNode.style.right = 'inherit';
            oLogNode.style['text-align'] = 'left';
        });
        test();
    }

    //
    function saveConfig() {
        var url = window.location.href;

        function generateConfigString() {
            var s =  "_ticker={";
            aConfigurableKeys.forEach(function(sKey) {
                // don't include if default
                if (oDEFAULTS[sKey] !== undefined && oDEFAULTS[sKey] === oConfig[sKey]) {
                    return;
                }
                s += '%22' + sKey + '%22:';
                if (typeof oConfig[sKey] === 'string') {
                    s += '%22' + oConfig[sKey] + '%22';
                } else {
                    s += oConfig[sKey];
                }
                s += ',';
            });
            s += "}";
            s = s.replace(/,}/,"}");
            return s;
        }

        // first, remove the present ticker url param if present
        url = url.replace(/_ticker=({.*})?&?/,'');

        // add opening "?" if no url params are present
        if (url.indexOf('?') === -1) {
            url = url + "?1=1";
        }

        // add ticker url param
        url = url + "&" + generateConfigString();

        // cleanup
        url = url.replace(/\?1=1&/,"?");
        url = url.replace(/\?&/,"?");
        url = url.replace(/(&&)+/,"&");

        window.location.replace(url);
    }

    //
    function moveUp(e) {
        if (oConfig.pauseMode) {
            nonSavedPrint('pauseMode');
            return;
        }
        kill();
        oConfig.logStartTop += 5;
        print("start: " + oConfig.logStartTop);
    }

    //
    function moveDown(e) {
        if (oConfig.pauseMode) {
            nonSavedPrint('pauseMode');
            return;
        }
        kill();
        oConfig.logStartTop -= 5;
        print("start: " + oConfig.logStartTop);
    }

    // overwrite with default settings
    function registerMacro(iNumToRegister, fn) {
        console.log('`', 'registering macro: ' + iNumToRegister);
        aMacros[iNumToRegister] = fn;
    }

    function macroEdit() {
        var sDefaultText = oConfig.sMacro9Code;

        toggleTextarea({
            text: sDefaultText,
            source: KEYS.M,
            buttons: {
                clear: function() {
                    killTextarea();
                    macroEdit();
                }
            },
            exit: function(sValue) {
                oConfig.sMacro9Code = sValue;
                registerMacro(9, function() {
                    eval(sValue);
                });
            }
        });
    }

    function runMacro(iNum) {
        if (typeof aMacros[iNum] === 'function') {
            console.log('`', 'running macro: ' + iNum);
            aMacros[iNum]();
        } else {
            console.log('`', 'macro empty');
        }
    }


    //////////////////////////////////
    // domain functions

    //
    function startInterval() {
        var myFunction = function() {
            clearInterval(l_interval);

            if (!oConfig.pauseMode) {
                var aLogNodes = document.querySelectorAll("._ticker_log");
                if (aLogNodes.length > 0) {
                    forEach(aLogNodes, function(iIndex, oLogNode) {
                        var iCurrentTop = parseInt(getComputedStyle(oLogNode).top, 10);
                        if (iCurrentTop <= 0) {
                            oLogNode.parentNode.removeChild(oLogNode);
                        } else {
                            oLogNode.style.top = (iCurrentTop - oLogNode.offsetHeight) + "px";
                        }
                    });
                }
            }

            l_interval = setInterval(myFunction, oConfig.interval);
        };
        var l_interval = setInterval(myFunction, oConfig.interval);
    }

    //
    function postConfigApply() {
        function applyAlign() {
            if (oConfig.align === 'right') {
                oConfig.logStyle.right = 0;
                oConfig.logStyle.left = 'inherit';
                oConfig.logStyle['text-align'] = 'right';
            } else {
                oConfig.logStyle.right = 'inherit';
                oConfig.logStyle.left = 0;
                oConfig.logStyle['text-align'] = 'left';
            }
        }

        applyAlign();
    }

    //
    function loadConfigFromUrl() {
        var value, o,
            sUrlParam = getUrlParamValue('_ticker');

        if (sUrlParam === null) {
            return;
        }

        // read config from param
        try {
            o = JSON.parse(decodeURIComponent(sUrlParam));
        } catch( e ) {
        }

        // overlay url config onto global config object
        if (typeof o === 'object') {
            for (var key in o) {
                oConfig[key] = o[key];
            }
        }
    }

    function setupListeners() {
        document.body.addEventListener("keydown", function(e) {
            if (keyIsDown === false) {
                // catch the ` key
                if (e.keyCode === KEYS.BackTick) {
                    keyIsDown=true;
                }
            }
            if (keyIsDown !== true) {
                return;
            }

            e.preventDefault();

            var actionMap = {};

            // toggle requireBackTick
            actionMap[KEYS.B] = function() {
                oConfig.requireBackTick = !!!oConfig.requireBackTick;
                print("requireBackTick: " + oConfig.requireBackTick);
            };

            actionMap[KEYS.D] = dump;
            actionMap[KEYS.S] = silent;
            actionMap[KEYS.T] = test;
            actionMap[KEYS.O] = output;
            actionMap[KEYS.P] = pause;
            actionMap[KEYS.K] = kill;
            actionMap[KEYS.H] = help;
            actionMap[KEYS.M] = macroEdit;
            actionMap[KEYS.Up] = increaseSpeed;
            actionMap[KEYS.Down] = decreaseSpeed;
            actionMap[KEYS.Right] = moveRight;
            actionMap[KEYS.Left] = moveLeft;
            actionMap[KEYS.PageDown] = moveDown;
            actionMap[KEYS.PageUp] = moveUp;
            actionMap[KEYS.Enter] = saveConfig;
            actionMap[KEYS.Tab] = nextChannel;
            actionMap[KEYS.Esc] = killTextarea;
            actionMap[KEYS[0]] = outputAll;

            [1,2,3,4,5,6,7,8,9].forEach(function(i) {
                actionMap[KEYS[i]] = function() {
                    runMacro(i);
                };
            });

            if (typeof actionMap[e.keyCode] === "function") {
                actionMap[e.keyCode]();
            }
        });

        document.body.addEventListener("keyup", function(e) {
            if (keyIsDown === true && aActionKeys.indexOf(e.keyCode) === -1) {
                keyIsDown=false;
            }
        });
    }

    function calculateTop() {
        var oLastNode = document.querySelector("._ticker_log:last-child");
        if (!oLastNode) {
            return oConfig.logStartTop;
        } else {
            return parseInt(oLastNode.style.top, 10) + (oLastNode.offsetHeight);
        }
    }

    function renderText(sText) {
        var div = document.createElement('div');
        div.className = '_ticker';
        assignStyle(div, oConfig.logStyle);
        div.className += ' _ticker_log';
        div.innerHTML = sText;
        div.style.top = calculateTop() + "px";
        document.body.appendChild(div);
    }

    function flushBuffer() {
        while(aRenderBuffer.length > 0 && calculateTop() < iAllowedHeight) {
            renderText(aRenderBuffer.pop());
        }
    }

    function listenToChannel(sChannel) {
        var sCurrentChannel = oConfig.channel;

        // revert current channel
        if (sCurrentChannel && typeof oChannels[sCurrentChannel].fnOriginal === 'function') {
            console[sCurrentChannel] = oChannels[sCurrentChannel].fnOriginal;
        }

        oConfig.channel = sChannel;

        // monkey-patch and chain console function
        console[sChannel] = function(firstArg, secondArg) {
            var sText = firstArg;
            if (firstArg === '`') {
                sText = secondArg;
            }

            if (oConfig.requireBackTick === false) {
                print(sText);
            } else if (oConfig.requireBackTick === true && firstArg === '`') {
                print(sText);
            } else {
                oChannels[sChannel].fnOriginal.apply(this, [arguments]);
            }
        };
    }

    function nextChannel() {
        var i = 0,
            sCurrentChannel = oConfig.channel;
        for (; i < aChannels.length; i++) {
            if (aChannels[i] === sCurrentChannel) {
                break;
            }
        }
        listenToChannel(aChannels[(i + 1) % aChannels.length]);
        print("listening to " + oConfig.channel);
    }

    function renderTextarea(sText) {
        var heightOfPage = window.innerHeight;
        var widthOfPage = window.innerWidth;
        var textareaDiv = document.createElement('div');
        textareaDiv.id = sTextareaId;
        textareaDiv.style.position = "fixed";
        textareaDiv.style.left = 0;
        textareaDiv.style.top = 0;
        textareaDiv.style["z-index"] = 9999;
        textareaDiv.style.width = (widthOfPage/3) + 'px';
        textareaDiv.style.height = (heightOfPage-10) + 'px';

        var textarea = document.createElement('textarea');
        textarea.style.height = "100%";
        textarea.style.width = "100%";
        textarea.innerHTML = sText;

        textareaDiv.appendChild(textarea);
        document.body.appendChild(textareaDiv);
    }

    function killTextarea() {
        var oTickerTextarea = document.getElementById(sTextareaId);
        if (oTickerTextarea) {
            oTickerTextarea.parentNode.removeChild(oTickerTextarea);
        }
    }

    // keys:
    //   - text: (string) the text to show in the textarea
    //   - source: (string) the source key
    //                      (what the user used to toggle with)
    //   - buttons: (object) map of buttons, with their labels as keys
    //   - exit: (fn) callback function when textarea is closed.
    //                value of textarea passed along
    function toggleTextarea(o) {
        // if it's a new action, clear slate and render
        if (oConfig.lastTextareaAction !== o.source) {
            killTextarea();
        }
        oConfig.lastTextareaAction = o.source;

        if (document.getElementById(sTextareaId)) {
            oConfig.pauseMode = false;

            if (typeof o.exit === 'function') {
                var textarea = document.getElementById(sTextareaId).querySelectorAll('textarea')[0];
                o.exit(textarea.value);
            }
            killTextarea();
        } else {
            oConfig.pauseMode = true;
            renderTextarea(o.text);
            var textareaContainer = document.getElementById(sTextareaId);

            if (typeof o.buttons === 'object') {
                var buttonContainer = document.createElement('div');
                buttonContainer.style.position = 'absolute';
                buttonContainer.style.bottom = 0;
                buttonContainer.style.left = 0;
                buttonContainer.style.height = '20px';
                buttonContainer.style.borderTopWidth = '1px';
                buttonContainer.style.borderTopStyle = 'solid';
                buttonContainer.style.width = '100%';
                buttonContainer.style.paddingTop = '5px';

                for (var key in o.buttons) {
                    if (o.buttons.hasOwnProperty(key)) {
                        var button = document.createElement('button');
                        button.innerHTML = key;
                        button.onclick = o.buttons[key];
                        button.style['float'] = 'left';
                        buttonContainer.appendChild(button);
                    }
                }

                textareaContainer.appendChild(buttonContainer);
            }
        }
    }

    // overwrite with default settings
    function reset() {
        // load default config
        for (var sKey in oDEFAULTS) {
            oConfig[sKey] = oDEFAULTS[sKey];
        }
    }


    //////////////////////////////////
    // execution starts
    // until this time, everything in this file has just
    // been variable and function declarations

    // fill oChannels object
    aChannels.forEach(function(sChannel) {
        oChannels[sChannel] = {
            fnOriginal: console[sChannel]
        };
    });

    reset();

    loadConfigFromUrl();
    postConfigApply();

    listenToChannel(oConfig.channel);

    setInterval(function() {
        flushBuffer();
    }, 250);

    startInterval();
    setupListeners();

    // expose api to global namespace
    (function() {
        var _ticker = {};
        _ticker.config = config;
        _ticker.test = test;
        _ticker.help = help;
        _ticker.kill = kill;
        _ticker.silent = silent;
        _ticker.pause = pause;
        _ticker.output = output;
        _ticker.outputAll = outputAll;
        _ticker.dump = dump;
        _ticker.moveDown = moveDown;
        _ticker.moveUp = moveUp;
        _ticker.moveLeft = moveLeft;
        _ticker.moveRight = moveRight;
        _ticker.increaseSpeed = increaseSpeed;
        _ticker.decreaseSpeed = decreaseSpeed;
        _ticker.nextChannel = nextChannel;
        _ticker.reset = reset;
        _ticker.registerMacro = registerMacro;

        // private
        _ticker._oConfig = oConfig;

        window._ticker = _ticker;
    }());
}());
