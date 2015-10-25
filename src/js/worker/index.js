require('regenerator/runtime');

var PouchDB = require('pouchdb');
PouchDB.plugin(require('pouchdb-upsert'));
var renderMonstersList = require('../shared/renderMonstersList');
var toJson = require('vdom-as-json/toJson');
var diff = require('virtual-dom/diff');
var byNameDdoc = require('../shared/byNameDdoc');
var Stopwatch = require('../shared/stopwatch');

var localDB = new PouchDB('monsters');
var couchHome = self.location.origin.replace(/:[^:]+$/, ':6984');
var remoteDB = new PouchDB(couchHome + '/monsters');


var liveReplicationFinished = false;
var indexBuilt = false;

function replicate() {
  console.log('started replication');
  var rep = remoteDB.replicate.to(localDB, {
    live: true,
    retry: true
  }).on('paused', err => {
    if (!err) {
      // up to date
      rep.cancel();
    }
  }).on('complete', () => {
    console.log('done replicating');
    liveReplicationFinished = true;
    buildIndex();
  });
}

async function checkReplicated() {
  if (liveReplicationFinished) {
    return true;
  }
  var info = await localDB.info();
  return info.doc_count === 649;
}

async function buildIndex() {
  await localDB.putIfNotExists(byNameDdoc);
  await localDB.query('by-name', {limit: 0});
  indexBuilt = true;
  console.log('done building local index');
}

replicate();

var monstersList;

async function getBestDB() {
  var replicated = await checkReplicated();
  if (!replicated) {
    return remoteDB;
  }
  if (!indexBuilt) {
    return remoteDB;
  }

  return localDB;
}

async function getInitialMonsters() {
  var db = await getBestDB();
  var response = await db.allDocs({include_docs: true});
  return response.rows.map(row => row.doc);
}

async function getFilteredMonsters(filter) {
  var db = await getBestDB();
  var response = await db.query('by-name', {
    startkey: filter.toLowerCase(),
    endkey: filter.toLowerCase() + '\ufff0',
    include_docs: true
  });
  return response.rows.map(row => row.doc);
}

async function onMessage(message) {

  var stopwatch = new Stopwatch();

  var filter = message.filter || '';

  if (!monstersList) {
    var initialMonsters = await getInitialMonsters();
    monstersList = renderMonstersList(initialMonsters);
  }

  var newMonsters;
  if (filter) {
    newMonsters = await getFilteredMonsters(filter);
  } else {
    newMonsters = await getInitialMonsters();
  };

  stopwatch.time('getting monsters');

  var newMonstersList = renderMonstersList(newMonsters);

  stopwatch.time('rendering monsters');

  var patch = diff(monstersList, newMonstersList);

  stopwatch.time('diffing monsters');

  monstersList = newMonstersList;

  var patchJson = toJson(patch);
  var patchJsonAsString = JSON.stringify(patchJson);

  stopwatch.time('stringifying');

  self.postMessage({
    type: 'monstersListPatch',
    content: patchJsonAsString
  });

  stopwatch.totalTime('worker (total)');
}

self.addEventListener('message', e => {
  var message = e.data;
  console.log('worker got message', message);
  onMessage(message).catch(console.log.bind(console));

});
