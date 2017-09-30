/**
 * ticker-log<br>
 * On-screen, ticker-tape-style logging tool<br><br>
 *
 * {@link http://jonbri.github.io/ticker-log}<br>
 * {@link https://github.com/jonbri/ticker-log}<br>
 * {@link https://www.npmjs.com/package/ticker-log}<br><br>
 *
 * @module ticker-log
 * @author Jonathan Brink <jonathandavidbrink@gmail.com>
 */
(function ticker_go() {

  // make sure dom is ready
  if (!document.body) {
    if (document.readyState !== 'loading') {
      ticker_go();
    } else {
      document.addEventListener('DOMContentLoaded', ticker_go);
    }
    return;
  }

  //////////////////////////////////
  // variables global to ticker

  var

    // embed starparam library
    starparam = (function() {
      var starparam,
        bOrig__is_starparam_embedded = window.__is_starparam_embedded;
      window.__is_starparam_embedded = true;

      /*eslint-disable */
      /* https://github.com/jonbri/starparam v1.0.1 Thu Dec 22 13:41:34 EST 2016 */
      !function(){function r(r){return null===r||void 0===r}function n(n){var a;if(!r(n))return a=new RegExp("(^[^?&#]+)\\??([^#]*)#?(.*)$").exec(n),r(a)?{params:[]}:{prefix:a[1],params:a[2].split("&").filter(function(r){return""!==r}).map(function(r){return function(r){return{name:r[0],value:r[1]}}(r.split("="))}),hash:""===a[3]?void 0:a[3]}}function a(n){var a="";if(!r(n))return r(n.prefix)===!1&&(a+=n.prefix),r(n.params)===!1&&n.params.forEach(function(r,n){a+=0===n?"?":"&",a+=r.name+"="+r.value}),r(n.hash)===!1&&(a+="#"+n.hash),a}function e(r,a){return n(r).params.filter(function(r){return r.name===a})[0]}function t(n,a){var t;if(!r(n)&&!r(a))return t=e(n,a),r(t)?void 0:t.value}function i(t,i,u){var o;if(!r(t)&&!r(i))return r(u)&&(u=""),o=n(t),r(e(t,i))?o.params.push({name:i,value:u}):o.params=o.params.map(function(r){return r.name===i&&(r.value=u),r}),a(o)}function u(e,t){var i;if(!r(e))return r(t)?e:(i=n(e),i.params=i.params.filter(function(r){return r.name!==t}),a(i))}!function(){var e={parse:function(a){if(0===arguments.length&&(a=window.location.href),!r(a))return n(a)},stringify:function(r){return a(r)},get:function(n,a){var e;return a=a||{},e=a.url,r(e)&&(e=window.location.href),t(e,n)},set:function(n,a,e){var t,u;if(e=e||{},t=e.hasOwnProperty("url")?e.url:window.location.href,!r(t))return u=i(t,n,a)},remove:function(n,a){var e,t;if(a=a||{},e=a.hasOwnProperty("url")?a.url:window.location.href,!r(e))return t=u(e,n)}};window.__is_starparam_embedded===!0?window.__embedded_starparam=e:window.starparam=e}()}();
      /*eslint-enable */

      starparam = window.__embedded_starparam;
      if (bOrig__is_starparam_embedded !== undefined) {
        window.__is_starparam_embedded = bOrig__is_starparam_embedded;
      } else {
        delete window.__is_starparam_embedded;
      }
      return window.__embedded_starparam;
    }()),

    aChannels = ['log', 'debug', 'warn', 'error', 'trace'],
    oChannels = {},

    // default settings
    oDEFAULTS = {
      showLineNumbers: true,
      interval: 300,
      logStartTop: 100,
      align: 'left',
      requireBackTick: true,
      announceMacros: false,
      channels: ['log'],
      trailPreviousLog: true
    },

    // global (to ticker) config
    oConfig = {
      silentMode: false,
      pauseMode: false,
      lineNumber: 0,
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

    // number returned from setInterval responsible for on-screen movement
    render_interval,

    // macros (0-8)
    // (9 stored in oConfig.sMacro9Code)
    aMacros = {},

    // leave a 1/4 page buffer
    iAllowedHeight = window.innerHeight * 1.25,

    // the config settings that are configurable
    aConfigurableKeys = [
      'showLineNumbers',
      'interval',
      'logStartTop',
      'align',
      'requireBackTick',
      'trailPreviousLog'
      // channels has special handling
      // defaultBacktickKeys has special handling
    ],

    // dom id of the "output" textarea
    sTextareaId = 'tickerTextarea',

    // whether or not the "`" key is pressed
    keyIsDown = false,

    // keep references to "addEventListener" functions for later removal
    fnKeyDown, fnKeyUp,

    // filter logging, populated via "filter" api
    fnFilterFunction,

    // help string
    aHelp = [
      '___________________________________',
      'ticker-log_________________________',
      '___________________________________',
      'Enter commands: `key_______________',
      '___________________________________',
      'h__-> help_________________________',
      't__-> test_________________________',
      'p__-> pause (freeze output)________',
      'k__-> kill (remove all)____________',
      'o__-> output (show in textarea)____',
      'l__-> output all (all past logging)',
      'f__-> flip (reverse textarea text)_',
      'd__-> dump (show config values)____',
      'b__-> toggle api "`" requirement___',
      '0-9-> invoke macros________________',
      'm__-> enter macro 9________________',
      '___________________________________',
      'up______-> increase speed__________',
      'down____-> decrease speed__________',
      'right___-> move logs right_________',
      'left____-> move logs left__________',
      'pageup__-> increase starting point_',
      'pagedown-> decrease starting point_',
      'tab_____-> change console channel__',
      '___________________________________',
      'enter -> save configuration in url_',
      '___________________________________',
      'Print to the screen:_______________',
      '__>> console.log("`", "hello...")__',
      '___________________________________',
      '-__________________________________',
      '-__________________________________',
      '-__________________________________'
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
      F: 70,
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
      KEYS.F,
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

  /**
   * used to iterate over querySelectorAll
   * See link:
   * {@link https://toddmotto.com/ditch-the-array-foreach-call-nodelist-hack}
   * @param {array} array pseudo-array from querySelectorAll
   * @param {function} callback invoke for each iteration
   * @param {object} scope "this" scope for callback
   */
  function pseudoForEach(array, callback, scope) {
    for (var i = 0; i < array.length; i++) {
      callback.call(scope, i, array[i]); // passes back stuff we need
    }
  }

  /**
   * overlay div's domelement style object
   * @param {object} domNode dom element to apply style to
   * @param {object} oStyle map of style declarations, e.g. color: 'green'
   */
  function assignStyle(domNode, oStyle) {
    for (var key in oStyle) {
      if (oStyle.hasOwnProperty(key)) {
        domNode.style[key] = oStyle[key];
      }
    }
  }

  /**
   * determine whether passed-in object is an array
   * @param {object} o potential array
   * @returns {boolean} whether object is of type array
   */
  function isArray(o) {
    return Object.prototype.toString.call(o) === '[object Array]';
  }


  //////////////////////////////////
  // api functions

  /**
   * If passed no arguments, return a copy of the current configuration.<br>
   * Otherwise, overlay object over configuration object.<br>
   * Only an api function...doesn't map to a key.<br>
   * Public+private way of setting configuration properties.<br><br>
   *
   * Example:<br>
   * <pre>
   * var interval = window.ticker.config().interval;
   *
   * // change log speed to 400
   * window.ticker.config({
   *   interval: 400
   * });
   * </pre>
   *
   * @param {object} o property/value map to apply
   *
   * @exports ticker-log
   * @name config
   * @public
   * @function
   */
  function config(o) {
    var bChannels;

    if (o === undefined) {
      return JSON.parse(JSON.stringify(oConfig));
    }

    bChannels = isArray(o.channels);

    if (bChannels) {
      o.previousChannels = oConfig.channels;
    }

    for (var sKey in o) {
      oConfig[sKey] = o[sKey];
    }

    if (bChannels) {
      _listenToChannels();
    }
  }

  /**
   * Print log div to screen.<br>
   * Only an api function...doesn't map (directly) to a key.<br><br>
   *
   * A configuration object can be passed as the second argument:
   * <table>
   * <tr>
   * <th>key<th>value
   * <tr>
   * <th>overrideSilentMode</th><td>still print, even if silent mode is on
   * <tr>
   * <th>internal<td>do not track in aBuffer. Implies showLineNumbers=>true
   * <tr>
   * <th>showLineNumbers</th><td>no line numbers, overrides global setting
   * </table>
   * <br>
   *
   * Example:<br>
   * <pre>
   * // show log on-screen
   * window.ticker.print('lorum ipsum');
   * </pre>
   * <br>
   *
   * @param {string} text innerHTML for log dom ref
   * @param {object} o configuration object
   *
   * @exports ticker-log
   * @name print
   * @public
   * @function
   */
  function print(text, o) {
    o = o || {};

    if (text === undefined || text === null) {
      return;
    }

    if (oConfig.silentMode === true) {
      return;
    }

    if (typeof fnFilterFunction === 'function' &&
          fnFilterFunction(text) !== true) {
      return;
    }

    if (o.textarea) {
      _renderTextarea(text);
    }

    if (o.internal !== true) {
      if (o.showLineNumbers !== false && oConfig.showLineNumbers === true) {
        text = oConfig.lineNumber++ + ") " + text;
      }
      aBuffer.unshift(text);
    }
    aRenderBuffer.unshift(text);
    _flushBuffer();
  }

  /**
   * "t" api function.<br>
   * Print out test log (plus date).
   *
   * @exports ticker-log
   * @name test
   * @public
   * @function
   */
  function test() {
    if (oConfig.pauseMode === true) {
      _nonSavedPrint('pauseMode');
      return;
    }
    print('test: ' + new Date(), {
      showLineNumbers: false
    });
  }

  /**
   * "h" api function.<br>
   * Show help text on-screen as logs.
   *
   * @exports ticker-log
   * @name help
   * @public
   * @function
   */
  function help() {
    oConfig.pauseMode = false;
    kill();

    oConfig.logStartTop = oDEFAULTS.logStartTop;

    for (var i = 0; i < aHelp.length; i++) {
      var text = aHelp[i];
      text = text.replace(/\_/g, '&nbsp;');
      print(text, {
        showLineNumbers: false
      });
    }
  }

  /**
   * "k" api function.<br>
   * Clear render buffer and remove all ticker log dom elements.
   *
   * @exports ticker-log
   * @name kill
   * @public
   * @function
   */
  function kill() {
    oConfig.pauseMode = false;
    killTextarea();
    aRenderBuffer = [];
    var aLogNodes = document.querySelectorAll('.ticker_log');
    pseudoForEach(aLogNodes, function(i, oLogNode) {
      oLogNode.parentNode.removeChild(oLogNode);
    });
  }

  /**
   * "p" api function.<br>
   * Toggle pauseMode config prop boolean.
   *
   * @exports ticker-log
   * @name pause
   * @public
   * @function
   */
  function pause() {
    if (oConfig.pauseMode) {
      print('pause off', {
        showLineNumbers: false
      });
    } else {
      print('paused', {
        showLineNumbers: false
      });
    }
    oConfig.pauseMode = !oConfig.pauseMode;
  }

  /**
   * "o" api function.<br>
   * Show log text in the "output textarea".
   *
   * @param {boolean} bAll whether to show all logs ever,
   *   OR just the current on-screen ones (default: false)
   *
   * @exports ticker-log
   * @name output
   * @public
   * @function
   */
  function output(bAll) {
    _flushBuffer();
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
      var aLogNodes = document.querySelectorAll('.ticker_log');
      if (aLogNodes.length > 0) {
        pseudoForEach(aLogNodes, function(i, oLogNode) {
          var string = oLogNode.innerHTML.trim();
          string = string.replace(/&nbsp;/g, '');
          sAllOutput += string + '\n';
        });
      }
    }

    // remove final newline
    sAllOutput = sAllOutput.replace(/\n$/, '');

    _toggleTextarea({
      text: sAllOutput,
      source: KEYS.O
    });
  }

  /**
   * "l" (for "log") api function.<br>
   * Api function to show all saved log messages.
   *
   * @exports ticker-log
   * @name outputAll
   * @public
   * @function
   */
  function outputAll() {
    output(true);
  }

  /**
   * "f" api function.<br>
   * flip (reverse) order of textarea
   *
   * @exports ticker-log
   * @name flip
   * @public
   * @function
   */
  function flip() {
    var textareaContainer = document.getElementById(sTextareaId),
      textarea;
    if (textareaContainer) {
      textarea = textareaContainer.querySelectorAll('textarea')[0];
      textarea.value = textarea.value.split('\n').reverse().join('\n');
    }
  }

  /**
   * "d" api function.<br>
   * Show configuration properties in output textarea.
   *
   * @exports ticker-log
   * @name dump
   * @public
   * @function
   */
  function dump() {
    var s = '';
    aConfigurableKeys.forEach(function(sKey) {
      s += (sKey + ': ' + oConfig[sKey]) + '\n';
    });
    s += 'listening to console: ' + oConfig.channels + '\n';

    _toggleTextarea({
      text: s,
      source: KEYS.D
    });
  }

  /**
   * "s" api function.<br>
   * Toggle silentMode config prop boolean.
   *
   * @exports ticker-log
   * @name silent
   * @public
   * @function
   */
  function silent() {
    if (oConfig.silentMode === true) {
      oConfig.silentMode = false;
      print('silent mode off', {
        showLineNumbers: false
      });
    } else {
      oConfig.silentMode = true;
    }
  }

  /**
   * "up" api function.<br>
   * Decrease delay interval by half the adjustmentInterval.
   *
   * @exports ticker-log
   * @name increaseSpeed
   * @public
   * @function
   */
  function increaseSpeed() {
    if (oConfig.pauseMode) {
      _nonSavedPrint('pauseMode');
      return;
    }
    oConfig.interval -= (oConfig.adjustmentInterval/2);
    print('speed: ' + oConfig.interval, {
      showLineNumbers: false
    });
  }

  /**
   * "down" api function.<br>
   * Increase delay interval by adjustmentInterval.
   *
   * @exports ticker-log
   * @name decreaseSpeed
   * @public
   * @function
   */
  function decreaseSpeed() {
    if (oConfig.pauseMode) {
      _nonSavedPrint('pauseMode');
      return;
    }
    oConfig.interval += oConfig.adjustmentInterval;
    print('speed: ' + oConfig.interval, {
      showLineNumbers: false
    });
  }

  /**
   * "right" api function.<br>
   * Change log container position and alignment of log dom elements.
   *
   * @exports ticker-log
   * @name moveRight
   * @public
   * @function
   */
  function moveRight() {
    oConfig.align = 'right';

    // move existing logs
    var aLogNodes = document.querySelectorAll('.ticker_log');
    pseudoForEach(aLogNodes, function(i, oLogNode) {
      oLogNode.style.right = 0;
      oLogNode.style.left = 'inherit';
      oLogNode.style['text-align'] = 'right';
    });
    test();
  }

  /**
   * "left" api function.<br>
   * Change log container position and alignment of log dom elements.
   *
   * @exports ticker-log
   * @name moveLeft
   * @public
   * @function
   */
  function moveLeft() {
    oConfig.align = 'left';

    // move existing logs
    var aLogNodes = document.querySelectorAll('.ticker_log');
    pseudoForEach(aLogNodes, function(i, oLogNode) {
      oLogNode.style.left = 0;
      oLogNode.style.right = 'inherit';
      oLogNode.style['text-align'] = 'left';
    });
    test();
  }

  /**
   * "enter" api function.<br>
   * Update url (window.location) to "save state".<br>
   * Only use config props that have changed.<br>
   * Generate url-friendly, json string to use for "ticker" param.
   *
   * @exports ticker-log
   * @name saveConfig
   * @public
   * @function
   */
  function saveConfig() {
    var url = _generateSaveUrl();
    if (history.replaceState) {
      window.history.replaceState({path:url},'',url);
    } else {
      window.location.replace(url);
    }
  }

  /**
   * "pageDown" api function.<br>
   * Change starting vertical position (logStartTop) for on-screen logs.
   *
   * @exports ticker-log
   * @name increaseLogStartTop
   * @public
   * @function
   */
  function increaseLogStartTop() {
    if (oConfig.pauseMode) {
      _nonSavedPrint('pauseMode');
      return;
    }
    kill();
    oConfig.logStartTop += 5;
    print('start: ' + oConfig.logStartTop, {
      showLineNumbers: false
    });
  }

  /**
   * "pageUp" api function.<br>
   * Change starting vertical position (logStartTop) for on-screen logs.
   *
   * @exports ticker-log
   * @name decreaseLogStartTop
   * @public
   * @function
   */
  function decreaseLogStartTop() {
    if (oConfig.pauseMode) {
      _nonSavedPrint('pauseMode');
      return;
    }
    kill();
    oConfig.logStartTop -= 5;
    print('start: ' + oConfig.logStartTop, {
      showLineNumbers: false
    });
  }

  /**
   * Register (overwrite) macro.<br>
   * For macros 0-8.<br>
   * Only an api function...doesn't map to a key.
   *
   * @param {int} iNumToRegister key in aMacros object to write to
   * @param {function} fn callback function
   *
   * @exports ticker-log
   * @name registerMacro
   * @public
   * @function
   */
  function registerMacro(iNumToRegister, fn) {
    if (iNumToRegister === 9) {
      console.log('`', 'macro 9 reserved for interactive macro (`m)');
      return;
    }
    if (oConfig.announceMacros === true) {
      console.log('`', 'registering macro: ' + iNumToRegister);
    }
    aMacros[iNumToRegister] = fn;
  }

  /**
   * "m" api function.<br>
   * For macro 9.<br>
   * Show a textarea where macro can be edited.<br>
   * "save" macro when textarea is dismissed.
   *
   * @exports ticker-log
   * @name macroEdit
   * @public
   * @function
   */
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
        if (oConfig.announceMacros === true) {
          console.log('`', 'registering macro: 9');
        }
        aMacros[9] = function() {
          /* eslint-disable no-eval */
          /* jshint ignore:start */
          eval(sValue);
          /* jshint ignore:end */
          /* eslint-enable no-eval */
        };
      }
    });
  }

  /**
   * "0-9" api function.<br>
   * Also can be called directly.<br>
   * Execute macro.
   *
   * @param {int} iMacroSlot macro in aMacros object to execute
   *
   * @exports ticker-log
   * @name runMacro
   * @public
   * @function
   */
  function runMacro(iMacroSlot) {
    if (typeof aMacros[iMacroSlot] === 'function') {
      if (oConfig.announceMacros === true) {
        console.log('`', 'running macro: ' + iMacroSlot);
      }
      aMacros[iMacroSlot]();
    } else {
      console.log('`', 'macro empty');
    }
  }

  /**
   * "Tab" api function.<br>
   * Switch to listen to next console channel ("log", "warn", etc).<br>
   * Order is determined by aChannels.
   *
   * @exports ticker-log
   * @name nextChannel
   * @public
   * @function
   */
  function nextChannel() {
    var i = 0,
      sCurrentChannel = oConfig.channels[0];

    // if there are multiple channels being used
    // just set it up so "log" becomes the next channel
    if (oConfig.channels.length > 1) {
      sCurrentChannel = 'trace'; // trace + 1 => log
    }

    // set "i" to be the index of the array
    for (; i < aChannels.length; i++) {
      if (aChannels[i] === sCurrentChannel) {
        break;
      }
    }

    oConfig.previousChannels = oConfig.channels;
    oConfig.channels = [aChannels[(i + 1) % aChannels.length]];
    _listenToChannels();

    // there will only be one channel at this point
    print('listening to ' + oConfig.channels[0], {
      showLineNumbers: false
    });
  }

  /**
   * "Esc" api function.<br>
   * Remove textarea dom element.
   *
   * @exports ticker-log
   * @name killTextarea
   * @public
   * @function
   */
  function killTextarea() {
    var oTickerTextarea = document.getElementById(sTextareaId);
    if (oTickerTextarea) {
      oTickerTextarea.parentNode.removeChild(oTickerTextarea);
    }
  }

  /**
   * "end all ticker operations" api function.<br>
   * Stop ticker from doing anything.<br>
   * Reset url param.<br>
   * Reset console object.<br>
   * Only an api function...doesn't map to a key.
   *
   * @exports ticker-log
   * @name restoreAndExit
   * @public
   * @function
   */
  function restoreAndExit() {
    window.clearInterval(render_interval);
    kill();
    killTextarea();
    document.body.removeEventListener('keydown', fnKeyDown);
    document.body.removeEventListener('keyup', fnKeyUp);
    window.ticker = undefined;
    delete window.ticker;

    // reset console object
    aChannels.forEach(function(sChannel) {
      console[sChannel] = oChannels[sChannel].fnOriginal;
    });
  }

  /**
   * Reset all settings.<br>
   * Reverts everything ticker has modified and re-installs from scratch.<br>
   * Only an api function...doesn't map to a key.
   *
   * @exports ticker-log
   * @name reset
   * @public
   * @function
   */
  function reset() {
    restoreAndExit();
    ticker_go();
  }

  /**
   * "filter" api function.<br>
   * Only an api function...doesn't map to a key.
   *
   * @param {regex|string} matcher either a string or regex to filter log by
   *
   * @exports ticker-log
   * @name filter
   * @public
   * @function
   */
  function filter(matcher) {
    if (!matcher) {
      return;
    }

    if (typeof matcher === 'string') {
      fnFilterFunction = function(s) {
        return s.indexOf(matcher) !== -1;
      };
    } else if (matcher instanceof RegExp) {
      fnFilterFunction = function(s) {
        return matcher.test(s);
      };
    } else if (typeof matcher === 'function') {
      fnFilterFunction = matcher;
    }
  }

  /**
   * "listenToEverything" api function.<br>
   * Only an api function...doesn't map to a key.<br><br>
   *
   * Listen to all console invocations:
   * <ul>
   * <li>all channels
   * <li>regardless if backtick provided
   * </ul>
   *
   * @exports ticker-log
   * @name listenToEverything
   * @public
   * @function
   */
  function listenToEverything() {
    config({
      requireBackTick: false,
      channels: aChannels
    });
    _listenToChannels();
  }


  //////////////////////////////////
  // domain/private functions

  /**
   * print but don't save to aBuffer
   * uses "print" function's o.internal parameter
   * @param {string} text text to put in log dom ref
   */
  function _nonSavedPrint(text) {
    print(text, {
      internal: true
    });
  }

  /**
   * start timeout loop
   * for each iteration of the loop
   * update the on-screen position of each log dom element
   */
  function _startInterval() {
    var moveUpOne = function() {
      window.clearInterval(render_interval);

      if (!oConfig.pauseMode) {
        var aLogNodes = document.querySelectorAll('.ticker_log');
        if (aLogNodes.length > 0) {
          pseudoForEach(aLogNodes, function(iIndex, oLogNode) {
            var iCurrentTop = parseInt(getComputedStyle(oLogNode).top, 10);
            if (iCurrentTop <= 0) {
              oLogNode.parentNode.removeChild(oLogNode);
              oLogNode = null;
            } else {
              var sTop = (iCurrentTop - oLogNode.offsetHeight) + 'px';
              oLogNode.style.top = sTop;
            }
          });
        }
      }

      render_interval = setInterval(moveUpOne, oConfig.interval);
    };
    render_interval = setInterval(moveUpOne, oConfig.interval);
  }

  /**
   * parse url parameter and populate oConfig
   */
  function _loadConfigFromUrl() {
    var o,
      sUrlParam = starparam.get('ticker-log');

    if (sUrlParam === null) {
      return;
    }

    // read config from param
    try {
      o = JSON.parse(decodeURIComponent(sUrlParam));
    } catch (e) {
    }

    // overlay url config onto global config object
    if (typeof o === 'object') {
      for (var key in o) {
        if (key === 'channels') {
          oConfig.channels = o[key].split(',');
        } else if (key === 'defaultBacktickKeys') {
          oConfig.defaultBacktickKeys = o[key].split(',').map(function(s) {
            return parseInt(s);
          });
        } else {
          oConfig[key] = o[key];
        }
      }
    }
  }

  /**
   * listen for when keys are pressed
   * use both keydown and keyup to enable chording
   */
  function _setupListeners() {
    fnKeyDown = function(e) {
      if (keyIsDown === false) {
        // catch the ` (and potentially other modifier) key(s)
        if (oConfig.defaultBacktickKeys.indexOf(e.keyCode) !== -1) {
          keyIsDown = true;
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
        print('requireBackTick: ' + oConfig.requireBackTick, {
          showLineNumbers: false
        });
      };

      actionMap[KEYS.D] = dump;
      actionMap[KEYS.F] = flip;
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
      actionMap[KEYS.PageDown] = decreaseLogStartTop;
      actionMap[KEYS.PageUp] = increaseLogStartTop;
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
    };

    fnKeyUp = function(e) {
      if (keyIsDown === true && aActionKeys.indexOf(e.keyCode) === -1) {
        keyIsDown=false;
      }
    };

    document.body.addEventListener('keydown', fnKeyDown);
    document.body.addEventListener('keyup', fnKeyUp);
  }

  /**
   * determine "top" position of last log dom element
   * @returns {int} top position value of dom ref
   */
  function _calculateTop() {
    var oLastNode =
      Array.prototype.slice.call(document.querySelectorAll('.ticker_log'), 0).
        reverse()[0];
    if (!oLastNode || oConfig.trailPreviousLog === false) {
      return oConfig.logStartTop;
    } else {
      return parseInt(oLastNode.style.top, 10) + (oLastNode.offsetHeight);
    }
  }

  /**
   * create and append to body a text log dom element<br>
   * Handle:
   * <ul>
   * <li>positioning
   * <li>apply config (oConfig.logStyle)
   * <li>apply "align" configuration
   * <li>log click handler
   * @param {string} sText the log text
   */
  function _renderText(sText) {
    var div,
      iTop = _calculateTop();

    // convert percentage to number
    function _percentageToNumber(s) {
      var aMatch = s.match(/^\d+/) || [];
      return parseInt(aMatch[0], 10);
    }

    // make div flush left (text-align)
    function applyLeft() {
      div.style.right = 'inherit';
      div.style.left = 0;
      div.style['text-align'] = 'left';
    }

    // make div flush right (text-align)
    function applyRight() {
      div.style.right = 0;
      div.style.left = 'inherit';
      div.style['text-align'] = 'right';
    }

    // set the div's left position value using a percentage (oConfig.align)
    // take into account the width of the div node
    // if text goes off-screen, make flush to that side
    function applyPercentage() {
      var iLeft,
        iPercentage = _percentageToNumber(oConfig.align);

      // first, determine the exact percentage position
      // relative to the total screen width
      iLeft = window.innerWidth * (iPercentage / 100);

      // adjust for text node width
      iLeft = iLeft - (div.offsetWidth / 2);
      iLeft = Math.floor(iLeft);

      // try to keep on-screen
      if (iLeft <= 0) {
        applyLeft();
      } else if ((iLeft + div.offsetWidth) >= window.innerWidth) {
        applyRight();
      } else {
        div.style.left = iLeft + 'px';
      }
    }

    // create text node
    // assign basic styles
    // apply style config
    div = document.createElement('div');
    div.innerHTML = sText;
    div.className += ' ticker_log';
    assignStyle(div, oConfig.logStyle);

    // vertically-position the text node
    if (iTop < (oConfig.logStartTop / 2)) {
      iTop = oConfig.logStartTop;
    }
    div.style.top = iTop + 'px';

    // pause log on click
    // div will be destroyed when it reaches off-screen
    // which will release the event listener
    div.addEventListener('click', function() {
      pause();
    });

    // render invisible because we may need to
    // do a sizing measurement and adjustment
    div.style.opacity = '0';

    document.body.appendChild(div);

    // apply alignment
    if (oConfig.align === 'left') {
      applyLeft();
    } else if (oConfig.align === 'right') {
      applyRight();
    } else if (/^\d+%?$/.test(oConfig.align) === true) {
      // the div node needs to be in the dom by this point (appendChild)
      applyPercentage();
    }

    // log appears
    div.style.opacity = oConfig.logStyle.opacity;
  }

  /**
   * if there is on-screen space available
   * render as many log dom elements as possible from aRenderBuffer
   */
  function _flushBuffer() {
    while (aRenderBuffer.length > 0 && _calculateTop() < iAllowedHeight) {
      _renderText(aRenderBuffer.pop());
    }
  }

  /**
   * "tune in" to the channel defined by configuration
   * perform "console" overrides (log, warn, etc)
   * cleanup previously listened to channel(s)
   * overwrite "channels" config
   */
  function _listenToChannels() {
    // revert previous channels
    if (isArray(oConfig.previousChannels)) {
      oConfig.previousChannels.forEach(function(sChannel) {
        if (typeof oChannels[sChannel].fnOriginal === 'function') {
          console[sChannel] = oChannels[sChannel].fnOriginal;
        }
      });
    }

    oConfig.channels.forEach(function(sChannel) {
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
          oChannels[sChannel].fnOriginal.apply(this, Array.prototype.slice.call(arguments));
        }
      };
    });
  }

  /**
   * create textarea container div and textarea
   * position, fill with sText, and render
   * @param {string} sText text to place in textarea
   */
  function _renderTextarea(sText) {
    var heightOfPage = window.innerHeight,
      widthOfPage = window.innerWidth,
      textareaDiv;

    if (document.getElementById(sTextareaId)) {
      killTextarea();
    }

    textareaDiv = document.createElement('div');
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

  /**
   * manage showing/hiding textarea div container
   * @param {object} o customize the textarea div
   *   keys:
   *   - text:  (string) the text to show in the textarea
   *   - source:  (string) id that identifies the invoking keyboard key
   *   - buttons: (object) map of buttons, with their labels as keys
   *   - exit:  (fn)   callback function when textarea is closed,
   *             the text inside of the textarea is passed along
   */
  function _toggleTextarea(o) {
    // if it's a new action, clear slate and render
    if (oConfig.lastTextareaAction !== o.source) {
      killTextarea();
    }
    oConfig.lastTextareaAction = o.source;

    var textareaContainer;

    if (document.getElementById(sTextareaId)) {
      oConfig.pauseMode = false;

      if (typeof o.exit === 'function') {
        textareaContainer = document.getElementById(sTextareaId);
        var textarea = textareaContainer.querySelectorAll('textarea')[0];
        o.exit(textarea.value);
      }
      killTextarea();
    } else {
      oConfig.pauseMode = true;
      _renderTextarea(o.text);
      textareaContainer = document.getElementById(sTextareaId);

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

  /**
   * Returns a serialized json map representing
   * certain property values that have changed state
   * @returns {string} serialized config object
   */
  function _generateConfigSerialization() {
    var s = '{';
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

    // channels
    if (oConfig.channels.length !== 1 && oConfig.channels[0] !== 'log') {
      s += '%22channels%22:';
      s += '%22' + oConfig.channels + '%22';
    }

    // defaultBacktickKeys
    if (!(oConfig.defaultBacktickKeys.length === 1 &&
            oConfig.defaultBacktickKeys[0] === KEYS.BackTick)) {
      s += '%22defaultBacktickKeys%22:';
      s += '%22' + oConfig.defaultBacktickKeys + '%22';
    }

    s += '}';
    s = s.replace(/,}/, '}');
    return s;
  }

  /**
   * Return a url string for saving configuration state.<br />
   * Apply config string to url and account for any past url state
   * @param {string} sPrefix the starting url
   * @returns {string} url string representing current state
   */
  function _generateSaveUrl() {
    return starparam.set('ticker-log', _generateConfigSerialization());
  }


  //////////////////////////////////
  // execution starts
  // until this time, everything in this file
  // has just been variable and function declarations

  // additional settings tweaks
  // user can override using '`'
  // as the main keyboard interface key
  oDEFAULTS.defaultBacktickKeys = [KEYS.BackTick];

  // fill oChannels object
  aChannels.forEach(function(sChannel) {
    oChannels[sChannel] = {
      fnOriginal: console[sChannel]
    };
  });

  // init config
  // load default config
  for (var sKey in oDEFAULTS) {
    oConfig[sKey] = oDEFAULTS[sKey];
  }
  _loadConfigFromUrl();

  // manage proxying of console
  _listenToChannels();

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
    var ticker = {};
    ticker.config = config;
    ticker.test = test;
    ticker.help = help;
    ticker.kill = kill;
    ticker.silent = silent;
    ticker.pause = pause;
    ticker.output = output;
    ticker.outputAll = outputAll;
    ticker.flip = flip;
    ticker.dump = dump;
    ticker.moveDown = increaseLogStartTop;
    ticker.moveUp = decreaseLogStartTop;
    ticker.moveLeft = moveLeft;
    ticker.moveRight = moveRight;
    ticker.increaseSpeed = increaseSpeed;
    ticker.decreaseSpeed = decreaseSpeed;
    ticker.nextChannel = nextChannel;
    ticker.print = print;
    ticker.registerMacro = registerMacro;
    ticker.runMacro = runMacro;
    ticker.filter = filter;
    ticker.listenToEverything = listenToEverything;

    ticker.macroEdit = macroEdit;
    ticker.restoreAndExit = restoreAndExit;
    ticker.reset = reset;
    ticker.flush = _flushBuffer;

    // private
    ticker._generateConfigSerialization = _generateConfigSerialization;

    window.ticker = ticker;
  }());
}());
