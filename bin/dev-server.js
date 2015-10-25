var watch = require('node-watch');
var hs = require('http-server');
var childProcess = require('child_process');
var PouchDB = require('pouchdb');
PouchDB.plugin(require('pouchdb-load'));
PouchDB.plugin(require('pouchdb-upsert'));
var watchify = require('watchify');
var browserify = require('browserify');
var bluebird = require('bluebird');
var fs = bluebird.promisifyAll(require('fs'));
var mkdirp = bluebird.promisify(require('mkdirp'));
var rimraf = bluebird.promisify(require('rimraf'));
var ncp = bluebird.promisify(require('ncp').ncp);
var stream2promise = require('stream-to-promise');

var byNameDdoc = require(__dirname + '/../src/js/shared/byNameDdoc');
var renderMonstersList = require(__dirname + '/../src/js/shared/renderMonstersList');
var toHtml = require('vdom-to-html');

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

  // create the index
  await db.putIfNotExists(byNameDdoc);
  await db.query('by-name');

  async function copyHtml() {
    console.log('copyHtml()');
    var rawHtml = await fs.readFileAsync('./src/index.html', 'utf-8');
    var docs = await db.allDocs({include_docs: true});
    var monsters = docs.rows.map(row => row.doc);
    var monstersList = renderMonstersList(monsters);
    var monstersHtml = toHtml(monstersList);
    var html = rawHtml.replace('<div id="monsters-list"></div>', monstersHtml);
    await fs.writeFileAsync('./www/index.html', html, 'utf-8');
  }

  async function copyCss() {
    console.log('copyCss()');
    await ncp('./src/css', './www/css');
  }

  async function copyJs() {
    console.log('copyJs()');
    await mkdirp('./www/js');
    await stream2promise(browserify({
      fullPaths: true,
      debug: true
    }).add(__dirname + '/../src/js/client/index.js')
      .bundle().pipe(fs.createWriteStream(__dirname + '/../www/js/main.js')));
    await stream2promise(browserify({
      fullPaths: true,
      debug: true
    }).add(__dirname + '/../src/js/worker/index.js')
      .bundle().pipe(fs.createWriteStream(__dirname + '/../www/js/worker.js')));
  }

  async function copyStatic() {
    console.log('copyStatic()');
    await ncp('./src/img', './www/img');
    await ncp('./src/svg', './www/svg');
  }

  async function copy() {
    console.log('copying from src to www');
    await rimraf('./www');
    await mkdirp('./www');
    await* [copyHtml(), copyCss(), copyJs(), copyStatic()];
    console.log('wrote html/css/js');
  }

  hs.createServer({root: './www'}).listen(9000);
  copy();
  watch(__dirname + '/../src', copy);
}

doIt().catch(err => console.error(err));

process.on('unhandledRejection', err => console.error(err));