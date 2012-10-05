var fs = require('fs');
var smileToString = require('..').toString;

fs.createReadStream('./example.smile')
  .pipe(smileToString())
  .pipe(process.stdout);
