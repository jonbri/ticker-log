var server_process,
    phantom_process,
    iPort = 9001;

// exec process and stream out stdout
function run(sCommand, aArgs) {
    var process = require('child_process').spawn(sCommand, aArgs);
    process.stdout.on('data', function(data) {
        console.log('stdout: ' + data);
    });
    return process;
}

// start web server which hosts qunit page
server_process = run('http-server', [
    '--silent',
    '-p',
    iPort
]);

setTimeout(function() {

    // start phantomjs process and process qunit page
    phantom_process = run('phantomjs', [
        'bin/phantom_qunits.js',
        'http://localhost:' + iPort + '/index.html'
    ]);

    // when phantomjs is done,
    // kill the http-server process and
    // exit this script with the phantomjs exit code
    phantom_process.on('close', function(phantom_process_exit_code) {
        server_process.kill();
        process.exit(phantom_process_exit_code);
    });

}, 1000);

