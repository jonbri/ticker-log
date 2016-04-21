# ticker-log

[![Build Status](https://travis-ci.org/jonbri/ticker-log.svg?branch=master)](https://travis-ci.org/jonbri/ticker-log)

On-screen VanillaJS logging utility.

Monkey-patches and chains the browser's console object.

Features:
* Configurable via Url and API.
* (Almost) every action available via api
* Ability to save output to a textarea for easy copy/pasting
* Lightweight
* No dependencies
* Macros

## Motivation

How do you currently view your console logs while debugging a problem?

A firebug console embedded (taking 30% horizontally)?
An un-docked dev-tools window placed closely (sloppily with a mouse) to a Chrome browser window?

Sometimes it is not convenient to look at your console log:
* when developing on a tablet or phone
* debugging timing issues that involve user interaction
* having casual, easy-to-read "special-event" declarations

This single-file module is meant as a quick "shove-it-in-there" script to enable on-screen logging.

## Installation
Load via `script` tag either `ticker.js` or `ticker.min.js`.

Or via npm...

    npm install ticker-log

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

Show the current ticker log in a textarea (useful for copy/pasting results) with `` `o ``.

Embed the current configuration settings in the browser-window's url with `` `<enter> `` and clear those settings with `` `<enter> ``.

For the full list of actions, show the help screen with `` `h ``.


### API
Most on-screen actions can be scripted by using the global `_ticker` object. For example:

    window._ticker.help();          # show help sceen
    window._ticker.increaseSpeed(); # increase speed
    window._ticker.decreaseSpeed(); # decrease speed
    window._ticker.moveUp();        # change starting position a little higher
    window._ticker.moveDown();      # change starting position a little lower
    window._ticker.moveLeft();      # move logs to the left of the screen (the default)
    window._ticker.moveRight();     # move logs to the right of the screen
    window._ticker.pause();         # pause ticker tape
    window._ticker.kill();          # remove all ticker logs from screen
    window._ticker.dump();          # show all configuration

### Macros
Macros are bits of code you want to run in at ad-hoc times. There are 9 "slots" available and stored in keys 1-9.

Macros 1-8 are reserved for api-driven macros:

```
ticker.registerMacro(1, function() {
    console.log('`', 'in the macro');
});
```

Macro 9 is reserved for an on-screen editing option. Press `` `m `` and a textarea will appear. Enter the macro code and press `` `m `` again to "register" the macro.


## Technical
Build:

    npm install
    grunt
    grunt serve # http://localhost:9000/index.html

