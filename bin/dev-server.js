var watch = require('node-watch');
var hs = require('http-server');
var childProcess = require('child_process');
var PouchDB = require('pouchdb');
PouchDB.plugin(require('pouchdb-load'));
var watchify = require('watchify');
var browserify = require('browserify');
var bluebird = require('bluebird');
var fs = bluebird.promisifyAll(require('fs'));
var mkdirp = bluebird.promisify(require('mkdirp'));
var rimraf = bluebird.promisify(require('rimraf'));
var ncp = bluebird.promisify(require('ncp').ncp);
var stream2promise = require('stream-to-promise');

async function startPouchServer() {
  await mkdirp('db');

  var child = childProcess.spawn(
    '../node_modules/.bin/pouchdb-server',
    ['-p', '6984'], {
      cwd: 'db'
    }
  );
  child.stdout.on('data', function (data) {
    console.log(data.toString('utf-8'));
  });
  child.stderr.on('data', function (data) {
    console.error(data.toString('utf-8'));
  });
}

async function doIt() {

  startPouchServer();

  // wait for pouch server to start
  await new Promise(function (resolve) { setTimeout(resolve, 1000); });

  // dump monsters.txt
  var db = new PouchDB('http://localhost:6984/monsters');
  var dumpfile = await fs.readFileAsync('./db/monsters.txt', 'utf-8');
  await db.load(dumpfile);

  async function copy() {
    console.log('copying from src to www');
    await rimraf('./www');
    await mkdirp('./www');
    await ncp('./src/index.html', './www/index.html');
    await ncp('./src/css', './www/css');
    await mkdirp('./www/js');
    await stream2promise(browserify({
      fullPaths: true,
      debug: true
    }).add(__dirname + '/../src/js/index.js')
      .bundle().pipe(fs.createWriteStream(__dirname + '/../www/js/main.js')));
    console.log('wrote html/css/js');
  }

  hs.createServer({root: './www'}).listen(9000);
  copy();
  watch(__dirname + '/../src', copy);
}

doIt().catch(err => console.log(err));