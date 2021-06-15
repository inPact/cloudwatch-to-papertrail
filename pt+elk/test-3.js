var stripAnsi = require ('strip-ansi');

console.log(stripAnsi('\u001B[4mUnicorn\u001B[0m'));
//=> 'Unicorn'

