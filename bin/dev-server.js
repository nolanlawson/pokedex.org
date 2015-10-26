var watch = require('node-watch');
var hs = require('http-server');
var childProcess = require('child_process');
var bluebird = require('bluebird');
var mkdirp = bluebird.promisify(require('mkdirp'));
var build = require('./build');

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

  // build debug
  await build(true);

  hs.createServer({root: './www'}).listen(9000);
  watch(__dirname + '/../src', () => build(true));
}

doIt().catch(err => console.error(err));

process.on('unhandledRejection', err => console.error(err));