# ticker-log

[![Build Status](https://travis-ci.org/jonbri/ticker-log.svg?branch=master)](https://travis-ci.org/jonbri/ticker-log)

On-screen logging utility.

Monkey-patches and chains the browser's console object.

Functionality is driven by keyboard chords starting with ``` ` ``` (back-*tick*).

These commands facilitate *interaction-style* testing which entails:

* run-time targeting of console output

* ad-hoc execution of strategically placed code snippets

```
TODO: screen-shot
```

Play with ticker-log: http://jonbri.github.io/ticker-log/

## Example Usage

Load `dist/ticker.min.js` and press ``` ` ``` `t` to see a ticker log.

Press ``` ` ``` `h` to show the quick-help reference.

In your source code, execute:

```js
console.log('`', 'hello ticker-log');
```

By default, console's "log" object accepts ticker-log invocations for on-screen rendering.

### Switch console "channel" to observe

Show output of `console.warn` on-screen:

Press ``` ` ``` `<tab>` a few times until you see "listening to warn...".

"save" your settings with ``` ` ``` `<enter>` (look at your url address bar).

### Run ad-hoc testing code as keyboard "macros"

If you are developing on the source-code of your application you can *watch* a variable:

```js
function foobar() {
    var a = 0;
    setInterval(function() {
        console.log('`', a);
    }, 500);
    // do complicated things with a...
}
```

## Features

* Configurable via API and URL parameters
* Swap log view with textarea for easy copy/pasting
* Lightweight, no dependencies
* Macro system for run-time, on-demand, static function execution

## Motivation

Seeing a targeted sub-set of log output on-screen can reduce reliance on web debuggers such as dev-tools and firefox while you are playing with your app.

Sometimes it is not convenient to look at your browser's console log:
* when developing on a tablet or phone
* debugging timing issues that involve user interaction
* having casual, easy-to-read "special-event" declarations

## Installation

```shell
npm install ticker-log
```

Load via `script` tag either `ticker.js` or `ticker.min.js` which reside in the `dist` directory.

## Interface
To write to Ticker's "ticker tape" simply pass in a back-tick (`` ` ``) as a first argument to `console`'s logging functions (`log`, `fatal`, etc...).
For example:

    console.log('`', 'lorum ipsum...')
    console.fatal('`', 'something very bad just happened...')

All actions can be driven by keyboard shortcut chords. Every key-combination starts with the back-tick key (`` ` ``).

### On-screen
Increase and decrease the speed of the ticker with `` `<up> `` and `` `<down> ``.

Move the horizontal position of the logs with `` `<left> `` and `` `<right> ``.

Change the vertical starting position with `` `<pageUp> `` and `` `<pageDown> ``.

Pause the ticker with `` `p `` and remove all ticker lines with `` `k ``.

Show the current ticker log in a textarea (useful for copy/pasting) with `` `o ``.

Embed the current configuration settings in the browser-window's url with `` `<enter> `` and clear those settings with `` `<enter> ``.

For the full list of actions, show the help screen with `` `h ``.

### Configuration

A configuration object is maintained, of which most properties (if they differ from the default) can be expressed as a json object embedded in a url parameter.

This allows for a basic but trivial way to save ticker settings that have been altered by either keyboard or api commands.

Examples of properties are:
* speed logs travel up the screen (`interval`)
* starting position of logs (`logStartTop`)
* flush to left or right of screen (`align`)
* console channel to listen to (`channel`)

Configuration settings take this format when embedded as a url parameter:

```
http://localhost/index.html?_ticker={"interval":275,"channel":"debug"}
```

### API
Most on-screen actions can be scripted by using the global `_ticker` object. For example:

    window._ticker.help();          # show help screen
    window._ticker.increaseSpeed(); # increase speed
    window._ticker.decreaseSpeed(); # decrease speed
    window._ticker.moveUp();        # change starting position a little higher
    window._ticker.moveDown();      # change starting position a little lower
    window._ticker.moveLeft();      # move logs to the left of the screen (the default)
    window._ticker.moveRight();     # move logs to the right of the screen
    window._ticker.pause();         # pause ticker tape
    window._ticker.kill();          # remove all ticker logs from screen
    window._ticker.dump();          # show all configuration

### Channels
The *channels* that feed ticker's on-screen rendering are:
* console.log
* console.debug
* console.warn
* console.error
* console.trace

Use a ``` ` ``` as the first argument to the current channel's console function. For me, this is the most frequent use-case.

To allow *all* of the information passed to that console function to funnel to ticker set the `requireBacktick` configuration property to `false`.

### Macros
Macros are bits of code you want to run at ad-hoc times. There are 10 "slots" available and stored in keys 0-9.

Macros 0-8 are reserved for api-driven macros:

```js
var variableToTrack;
ticker.registerMacro(0, function() {
    // output values of variables in closure scope
    console.log('`', 'variableToTrack: ' + variableToTrack);
});
// code exercises variableToTrack...
// invoke macro by pressing `0
```

Macro 9 is reserved for an on-screen editing option. Press `` `m `` and a textarea will appear. Enter JavaScript code to be `eval`ed and press `` `m `` again to "register" the macro.

## Technical
Build:

```shell
npm install
npm test        # run test suite (qunit, phantomjs)
npm run lint    # eslint
npm run serve   # http://localhost:9000/index.html
npm run package # build and populate dist
```
