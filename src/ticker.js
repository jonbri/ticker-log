// ticker.js - on-screen, ticker-tape-style logging tool
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
        position: 'fixed',
        color: 'black',
        'background-color': '#F2F2F2',
        padding: '1px',
        'z-index': 9998,
        top: 0,
        left: 0,
        'font-family': 'monospace',
        'font-size': '14px',
        opacity: 0.85
      }
    },

    // log buffer
    aBuffer = [],

    // buffer of logs still-to-be-rendered
    aRenderBuffer = [],

    // macros (0-8)
    // (9 stored in oConfig.sMacro9Code)
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

    // dom id of the "output" textarea
    sTextareaId = '_tickerTextarea',

    // whether or not the "`" key is pressed
    keyIsDown = false,

    // help string
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
      '__>> console.log("`", _"lorum_ipsum...")________',
      '________________________________________________',
      '-',
      '-',
      '-'
    ],

    // keycodes
    KEYS = {
      Tab: 9,
      Enter: 13,
      Esc: 27,
      PageDown: 33,
      PageUp: 34,
      Left: 37,
      Up: 38,
      Right: 39,
      Down: 40,
      '0': 48,
      '1': 49,
      '2': 50,
      '3': 51,
      '4': 52,
      '5': 53,
      '6': 54,
      '7': 55,
      '8': 56,
      '9': 57,
      A: 65,
      B: 66,
      C: 67,
      D: 68,
      H: 72,
      K: 75,
      L: 76,
      M: 77,
      O: 79,
      P: 80,
      S: 83,
      T: 84,
      BackTick: 192
    },

    // the keys used as commands
    // keys that that need to be key toggle friendly
    // subset of KEYS
    aActionKeys = [
      KEYS.Tab,
      KEYS.Esc,
      KEYS.PageDown,
      KEYS.PageUp,
      KEYS.Left,
      KEYS.Up,
      KEYS.Right,
      KEYS.Down,
      KEYS['0'],
      KEYS['1'],
      KEYS['2'],
      KEYS['3'],
      KEYS['4'],
      KEYS['5'],
      KEYS['6'],
      KEYS['7'],
      KEYS['8'],
      KEYS['9'],
      KEYS.A,
      KEYS.B,
      KEYS.C,
      KEYS.D,
      KEYS.H,
      KEYS.K,
      KEYS.L,
      KEYS.M,
      KEYS.O,
      KEYS.P,
      KEYS.S,
      KEYS.T
    ];

  //////////////////////////////////
  // util functions

  // used to iterate over querySelectorAll
  // see: https://toddmotto.com/ditch-the-array-foreach-call-nodelist-hack/
  function pseudoForEach(array, callback, scope) {
    for (var i = 0; i < array.length; i++) {
      callback.call(scope, i, array[i]); // passes back stuff we need
    }
  }

  // overlay div's domelement style object
  function assignStyle(div, oStyle) {
    for (var key in oStyle) {
      if (oStyle.hasOwnProperty(key)) {
        div.style[key] = oStyle[key];
      }
    }
  }

  // return value of url parameter
  function getUrlParamValue(name) {
    name = name.replace(/[\[]/, '\\\[').replace(/[\]]/, '\\\]');
    var regexS = '[\\?&]'+name+'=([^&#]*)',
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

  // overlay object over configuration object
  // only an api function...doesn't map to a key
  // public+private way of setting configuration properties
  function config(o) {
    for (var sKey in o) {
      oConfig[sKey] = o[sKey];
    }
  }

  // "p" api function
  // print log div to screen
  // bOverrideSilentMode - still print, even if silent mode is on
  // bInternal - do not track in aBuffer
  function print(text, bOverrideSilentMode, bInternal) {
    // TODO: move this so it's still in the buffer
    if (oConfig.silentMode === true && !bOverrideSilentMode) {
      return;
    }

    if (bInternal !== true) {
      aBuffer.unshift(text);
    }
    aRenderBuffer.unshift(text);
    _flushBuffer();
  }

  // "t" api function
  // print out test log (plus date)
  function test() {
    if (oConfig.pauseMode === true) {
      _nonSavedPrint('pauseMode');
      return;
    }
    print('test: ' + new Date(), true);
  }

  // "h" api function
  // show help text on-screen as logs
  function help() {
    oConfig.pauseMode = false;
    kill();

    oConfig.interval = oDEFAULTS.interval;
    oConfig.logStartTop = oDEFAULTS.logStartTop;

    for (var i = 0; i < aHelp.length; i++) {
      var text = aHelp[i];
      text = text.replace(/\_/g, '&nbsp;');
      print(text, true);
    }
  }

  // "k" api function
  // clear render buffer and remove all ticker log dom elements
  function kill() {
    oConfig.pauseMode = false;
    aRenderBuffer = [];
    var aLogNodes = document.querySelectorAll('._ticker');
    pseudoForEach(aLogNodes, function(i, oLogNode) {
      oLogNode.parentNode.removeChild(oLogNode);
    });
  }

  // "p" api function
  // toggle pauseMode config prop boolean
  function pause() {
    if (oConfig.pauseMode) {
      print('pause off');
    } else {
      print('paused');
    }
    oConfig.pauseMode = !oConfig.pauseMode;
  }

  // "o" api function
  // show log text in the "output textarea"
  // param bAll -> whether to show all logs ever,
  //         or just the current on-screen ones
  //         default: false
  function output(bAll) {
    if (bAll === undefined) {
      bAll = false;
    }

    var sAllOutput='';

    // get all output
    if (bAll === true) {
      aBuffer.forEach(function(s) {
        sAllOutput += s + '\n';
      });
    } else {
      // just show items on screen
      var aLogNodes = document.querySelectorAll('._ticker_log');
      if (aLogNodes.length > 0) {
        pseudoForEach(aLogNodes, function(i, oLogNode) {
          var string = oLogNode.innerHTML.trim();
          string = string.replace(/&nbsp;/g, '');
          sAllOutput += string + '\n';
        });
      }
    }

    _toggleTextarea({
      text: sAllOutput,
      source: KEYS.O
    });
  }

  // "l" (for "log") api function
  // api function to show all saved log messages
  function outputAll() {
    output(true);
  }

  // "d" api function
  // show configuration properties in output textarea
  function dump() {
    var s = '';
    aConfigurableKeys.forEach(function(sKey) {
      s += (sKey + ': ' + oConfig[sKey]) + '\n';
    });
    s += 'listening to console.' + oConfig.channel + '\n';
    _toggleTextarea({
      text: s,
      source: KEYS.D
    });
  }

  // "s" api function
  // toggle silentMode config prop boolean
  function silent() {
    if (oConfig.silentMode === true) {
      oConfig.silentMode = false;
      print('silent mode off');
    } else {
      oConfig.silentMode = true;
    }
  }

  // "up" api function
  // decrease delay interval by half the adjustmentInterval
  function increaseSpeed(e) {
    if (oConfig.pauseMode) {
      _nonSavedPrint('pauseMode');
      return;
    }
    oConfig.interval -= (oConfig.adjustmentInterval/2);
    print('speed: ' + oConfig.interval);
  }

  // "down" api function
  // increase delay interval by adjustmentInterval
  function decreaseSpeed(e) {
    if (oConfig.pauseMode) {
      _nonSavedPrint('pauseMode');
      return;
    }
    oConfig.interval += oConfig.adjustmentInterval;
    print('speed: ' + oConfig.interval);
  }

  // "right" api function
  // change log container position and alignment of log dom elements
  function moveRight(e) {
    oConfig.align = 'right';
    _postConfigApply();

    // move existing logs
    var aLogNodes = document.querySelectorAll('._ticker_log');
    pseudoForEach(aLogNodes, function(i, oLogNode) {
      oLogNode.style.right = 0;
      oLogNode.style.left = 'inherit';
      oLogNode.style['text-align'] = 'right';
    });
    test();
  }

  // "left" api function
  // change log container position and alignment of log dom elements
  function moveLeft(e) {
    oConfig.align = 'left';
    _postConfigApply();

    // move existing logs
    var aLogNodes = document.querySelectorAll('._ticker_log');
    pseudoForEach(aLogNodes, function(i, oLogNode) {
      oLogNode.style.left = 0;
      oLogNode.style.right = 'inherit';
      oLogNode.style['text-align'] = 'left';
    });
    test();
  }

  // "enter" api function
  // update url (window.location) to "save state"
  // only use config props that have changed
  // geneate url-friendly, json string to use for "_ticker" param
  function saveConfig() {
    var url = window.location.href;

    function generateConfigString() {
      var s =  '_ticker={';
      aConfigurableKeys.forEach(function(sKey) {
        // don't include if default
        if (oDEFAULTS[sKey] !== undefined &&
            oDEFAULTS[sKey] === oConfig[sKey]) {
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
      s += '}';
      s = s.replace(/,}/, '}');
      return s;
    }

    // first, remove the present ticker url param if present
    url = url.replace(/_ticker=({.*})?&?/, '');

    // add opening "?" if no url params are present
    if (url.indexOf('?') === -1) {
      url = url + '?1=1';
    }

    // add ticker url param
    url = url + '&' + generateConfigString();

    // cleanup
    url = url.replace(/\?1=1&/, '?');
    url = url.replace(/\?&/, '?');
    url = url.replace(/(&&)+/, '&');

    window.location.replace(url);
  }

  // "pageUp" api function
  // change starting vertical position (logStartTop) for on-screen logs
  function moveUp(e) {
    if (oConfig.pauseMode) {
      _nonSavedPrint('pauseMode');
      return;
    }
    kill();
    oConfig.logStartTop += 5;
    print('start: ' + oConfig.logStartTop);
  }

  // "pageDown" api function
  // change starting vertical position (logStartTop) for on-screen logs
  function moveDown(e) {
    if (oConfig.pauseMode) {
      _nonSavedPrint('pauseMode');
      return;
    }
    kill();
    oConfig.logStartTop -= 5;
    print('start: ' + oConfig.logStartTop);
  }

  // register (overwrite) macro
  // for macros 0-8
  // only an api function...doesn't map to a key
  // param iNumToRegister key in aMacros object to write to
  // param fn callback functionf
  function registerMacro(iNumToRegister, fn) {
    if (iNumToRegister === 9) {
      console.log('`', 'macro 9 reserved for interactive macro (`m)');
      return;
    }
    console.log('`', 'registering macro: ' + iNumToRegister);
    aMacros[iNumToRegister] = fn;
  }

  // "pageDown" api function
  // for macro slot 9
  // show a textarea where macro can be edited
  // "save" macro when textarea is dismissed
  function macroEdit() {
    var sDefaultText = oConfig.sMacro9Code;

    _toggleTextarea({
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
          eval(sValue); // eslint-disable-line no-eval
        });
      }
    });
  }

  // "0-9" api function
  // execute macro
  function runMacro(iMacroSlot) {
    if (typeof aMacros[iMacroSlot] === 'function') {
      console.log('`', 'running macro: ' + iMacroSlot);
      aMacros[iMacroSlot]();
    } else {
      console.log('`', 'macro empty');
    }
  }

  // "Tab" api function
  // switch to listen to next console channel ("log", "warn", etc)
  // order is determined by aChannels
  function nextChannel() {
    var i = 0,
      sCurrentChannel = oConfig.channel;
    for (; i < aChannels.length; i++) {
      if (aChannels[i] === sCurrentChannel) {
        break;
      }
    }
    _listenToChannel(aChannels[(i + 1) % aChannels.length]);
    print('listening to ' + oConfig.channel);
  }

  // "Esc" api function
  // remove textarea dom element
  function killTextarea() {
    var oTickerTextarea = document.getElementById(sTextareaId);
    if (oTickerTextarea) {
      oTickerTextarea.parentNode.removeChild(oTickerTextarea);
    }
  }

  // overwrite config with default settings
  // only an api function...doesn't map to a key
  function reset() {
    // load default config
    for (var sKey in oDEFAULTS) {
      oConfig[sKey] = oDEFAULTS[sKey];
    }
  }


  //////////////////////////////////
  // domain/private functions

  // print but don't save to aBuffer
  // uses "print" function's bInternal parameter
  function _nonSavedPrint(text) {
    print(text, false, true);
  }

  // start timeout loop
  // for each iteration of the loop
  // update the on-screen position of each log dom element
  function _startInterval() {
    var myFunction = function() {
      clearInterval(l_interval);

      if (!oConfig.pauseMode) {
        var aLogNodes = document.querySelectorAll('._ticker_log');
        if (aLogNodes.length > 0) {
          pseudoForEach(aLogNodes, function(iIndex, oLogNode) {
            var iCurrentTop = parseInt(getComputedStyle(oLogNode).top, 10);
            if (iCurrentTop <= 0) {
              oLogNode.parentNode.removeChild(oLogNode);
            } else {
              var sTop = (iCurrentTop - oLogNode.offsetHeight) + 'px';
              oLogNode.style.top = sTop;
            }
          });
        }
      }

      l_interval = setInterval(myFunction, oConfig.interval);
    };
    var l_interval = setInterval(myFunction, oConfig.interval);
  }

  // apply config properties
  // used after oConfig is updated
  function _postConfigApply() {
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

  // parse url parameter and populate oConfig
  function _loadConfigFromUrl() {
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

  // listen for when keys are pressed
  // use both keydown and keyup to enable chording
  function _setupListeners() {
    document.body.addEventListener('keydown', function(e) {
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
        print('requireBackTick: ' + oConfig.requireBackTick);
      };

      actionMap[KEYS.D] = dump;
      actionMap[KEYS.S] = silent;
      actionMap[KEYS.T] = test;
      actionMap[KEYS.O] = output;
      actionMap[KEYS.L] = outputAll;
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

      [0,1,2,3,4,5,6,7,8,9].forEach(function(i) {
        actionMap[KEYS[i]] = function() {
          runMacro(i);
        };
      });

      if (typeof actionMap[e.keyCode] === 'function') {
        actionMap[e.keyCode]();
      }
    });

    document.body.addEventListener('keyup', function(e) {
      if (keyIsDown === true && aActionKeys.indexOf(e.keyCode) === -1) {
        keyIsDown=false;
      }
    });
  }

  // determine "top" position of last log dom element
  function _calculateTop() {
    var oLastNode = document.querySelector('._ticker_log:last-child');
    if (!oLastNode) {
      return oConfig.logStartTop;
    } else {
      return parseInt(oLastNode.style.top, 10) + (oLastNode.offsetHeight);
    }
  }

  // create log dom element
  // param sText -> the log text
  function _renderText(sText) {
    var div = document.createElement('div');
    div.className = '_ticker';
    assignStyle(div, oConfig.logStyle);
    div.className += ' _ticker_log';
    div.innerHTML = sText;
    div.style.top = _calculateTop() + 'px';
    document.body.appendChild(div);
  }

  // if there is on-screen space available
  // render as many log dom elements as possible from aRenderBuffer
  function _flushBuffer() {
    while(aRenderBuffer.length > 0 && _calculateTop() < iAllowedHeight) {
      _renderText(aRenderBuffer.pop());
    }
  }

  // change config to use sChannel (log, warn, etc)
  function _listenToChannel(sChannel) {
    var sCurrentChannel = oConfig.channel;

    // revert current channel
    if (sCurrentChannel &&
            typeof oChannels[sCurrentChannel].fnOriginal === 'function') {
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

  // create textarea container div and textarea
  // position, fill with sText, and render
  function _renderTextarea(sText) {
    var heightOfPage = window.innerHeight;
    var widthOfPage = window.innerWidth;
    var textareaDiv = document.createElement('div');
    textareaDiv.id = sTextareaId;
    textareaDiv.style.position = 'fixed';
    textareaDiv.style.left = 0;
    textareaDiv.style.top = 0;
    textareaDiv.style['z-index'] = 9999;
    textareaDiv.style.width = (widthOfPage/3) + 'px';
    textareaDiv.style.height = (heightOfPage-10) + 'px';

    var textarea = document.createElement('textarea');
    textarea.style.height = '100%';
    textarea.style.width = '100%';
    textarea.innerHTML = sText;

    textareaDiv.appendChild(textarea);
    document.body.appendChild(textareaDiv);
  }

  // manage showing/hiding textarea div container
  // param o -> customize the textarea div
  //   keys:
  //   - text:  (string) the text to show in the textarea
  //   - source:  (string) id that identifies the invoking keyboard key
  //   - buttons: (object) map of buttons, with their labels as keys
  //   - exit:  (fn)   callback function when textarea is closed,
  //             the text inside of the textarea is passed along
  function _toggleTextarea(o) {
    // if it's a new action, clear slate and render
    if (oConfig.lastTextareaAction !== o.source) {
      killTextarea();
    }
    oConfig.lastTextareaAction = o.source;

    if (document.getElementById(sTextareaId)) {
      oConfig.pauseMode = false;

      if (typeof o.exit === 'function') {
        var textareaContainer = document.getElementById(sTextareaId);
        var textarea = textareaContainer.querySelectorAll('textarea')[0];
        o.exit(textarea.value);
      }
      killTextarea();
    } else {
      oConfig.pauseMode = true;
      _renderTextarea(o.text);
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
            button.style.float = 'left';
            buttonContainer.appendChild(button);
          }
        }

        textareaContainer.appendChild(buttonContainer);
      }
    }
  }


  //////////////////////////////////
  // execution starts
  // until this time, everything in this file
  // has just been variable and function declarations

  // fill oChannels object
  aChannels.forEach(function(sChannel) {
    oChannels[sChannel] = {
      fnOriginal: console[sChannel]
    };
  });

  // init config
  reset();
  _loadConfigFromUrl();
  _postConfigApply();

  // start listening to default channel
  _listenToChannel(oConfig.channel);

  // keep polling to see if flushing the
  // log buffer to screen is possible
  setInterval(function() {
    _flushBuffer();
  }, 250);

  // start job that "moves the ticker tape"
  _startInterval();

  // listen for keyboard events
  _setupListeners();

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
