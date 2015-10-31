var watch = require('node-watch');
var hs = require('http-server');
var childProcess = require('child_process');
var bluebird = require('bluebird');
var mkdirp = bluebird.promisify(require('mkdirp'));
var fs = bluebird.promisifyAll(require('fs'));
var build = require('./build');
var PouchDB = require('pouchdb');
PouchDB.plugin(require('pouchdb-load'));

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
  var monstersDB = new PouchDB('http://localhost:6984/monsters');
  var descriptionsDB = new PouchDB('http://localhost:6984/descriptions');

  var loadPromises = [
    monstersDB.load(await fs.readFileAsync('src/db/monsters.txt', 'utf-8')),
    descriptionsDB.load(await fs.readFileAsync('src/db/descriptions.txt', 'utf-8'))
  ];

  // build with debug=true
  var buildPromise = build(true);

  // start up dev server
  var serverPromise = new Promise(function (resolve, reject) {
    hs.createServer({root: './www'}).listen(9000, function (err) {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });

  await* [...loadPromises, buildPromise, serverPromise];

  console.log('started dev server at http://127.0.0.1:9000');

  watch(__dirname + '/../src', () => build(true));
}

doIt().catch(err => console.error(err));

process.on('unhandledRejection', err => {
  console.error(err.stack);
});