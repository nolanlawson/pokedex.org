var watch = require('node-watch');
var ncp = require('ncp').ncp;
var rimraf = require('rimraf');
var hs = require('http-server');

function copy() {
  console.log('copying from src to www');
  rimraf.sync('./www');
  ncp('./src', './www');
}

hs.createServer({root: './www'}).listen(9000);

copy();
watch(__dirname + '/../src', copy);