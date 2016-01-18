var watch = require('node-watch');
var hs = require('http-server');
var childProcess = require('child_process');
var bluebird = require('bluebird');
var mkdirp = bluebird.promisify(require('mkdirp'));
var fs = bluebird.promisifyAll(require('fs'));
var build = require('./build');
var PouchDB = require('pouchdb');
var fetch = require('node-fetch');
PouchDB.plugin(require('pouchdb-load'));

var promiseChain = Promise.resolve();

async function startPouchServer() {
  await mkdirp('db');

  var child = childProcess.spawn(
    require.resolve('pouchdb-server/bin/pouchdb-server'),
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

  // wait for pouchdb-server to start up
  var count = 0;
  while (true) {
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      var json = await (await fetch('http://localhost:6984')).json();
      if (json.version) {
        break;
      }
    } catch (e) {
      if (++count === 10) {
        console.log(e);
        throw new Error('cannot connect to pouchdb-server');
      }
    }
  }

}

async function doIt() {

  startPouchServer();

  // wait for pouch server to start
  await new Promise(function (resolve) { setTimeout(resolve, 1000); });

  // dump monsters.txt
  var monstersDB = new PouchDB('http://localhost:6984/monsters');
  var monstersFullFatDB = new PouchDB('http://localhost:6984/monsters-fullfat');
  var descriptionsDB = new PouchDB('http://localhost:6984/descriptions');
  var evolutionsDB = new PouchDB('http://localhost:6984/evolutions');
  var typesDB = new PouchDB('http://localhost:6984/types');
  var movesDB = new PouchDB('http://localhost:6984/moves');
  var monsterMovesDB = new PouchDB('http://localhost:6984/monster-moves');
  var monstersSupplementalDB = new PouchDB('http://localhost:6984/monsters-supplemental');

  var loadPromises = [
    monstersDB.load(await fs.readFileAsync('src/assets/skim-monsters.txt', 'utf-8')),
    descriptionsDB.load(await fs.readFileAsync('src/assets/descriptions.txt', 'utf-8')),
    evolutionsDB.load(await fs.readFileAsync('src/assets/evolutions.txt', 'utf-8')),
    typesDB.load(await fs.readFileAsync('src/assets/types.txt', 'utf-8')),
    movesDB.load(await fs.readFileAsync('src/assets/moves.txt', 'utf-8')),
    monstersFullFatDB.load(await fs.readFileAsync('src/assets/monsters.txt', 'utf-8')),
    monsterMovesDB.load(await fs.readFileAsync('src/assets/monster-moves.txt', 'utf-8')),
    monstersSupplementalDB.load(await fs.readFileAsync('src/assets/monsters-supplemental.txt', 'utf-8'))
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

  var allPromises = [...loadPromises, buildPromise, serverPromise];

  // do one at a time to avoid hammering pouchdb-server too hard
  for (var promise of allPromises) {
    await promise;
  }

  console.log('started dev server at http://127.0.0.1:9000');

  watch(__dirname + '/../src', () => {
    promiseChain = promiseChain.then(() => build(true));
  });
}

doIt().catch(err => console.error(err));

process.on('unhandledRejection', err => {
  console.error(err.stack);
});
