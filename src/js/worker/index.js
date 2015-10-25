require('regenerator/runtime');

var PouchDB = require('pouchdb');
PouchDB.plugin(require('pouchdb-upsert'));
var renderMonstersList = require('../shared/renderMonstersList');
var toJson = require('vdom-as-json/toJson');
var diff = require('virtual-dom/diff');
var byNameDdoc = require('../shared/byNameDdoc');

var localDB = new PouchDB('monsters');
var remoteDB = new PouchDB('http://127.0.0.1:6984/monsters');

var liveReplicationFinished = false;
var indexBuilt = false;

function replicate() {
  console.log('started replication');
  remoteDB.replicate.to(localDB, {
    live: true,
    retry: true
  }).on('paused', err => {
    if (!err) {
      console.log('done replicating');
      liveReplicationFinished = true;
      buildIndex();
    }
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
  var newMonstersList = renderMonstersList(newMonsters);

  var patch = diff(monstersList, newMonstersList);

  monstersList = newMonstersList;

  var patchJson = toJson(patch);

  self.postMessage({
    type: 'monstersListPatch',
    content: JSON.stringify(patchJson)
  });
}

self.addEventListener('message', e => {
  var message = e.data;
  console.log('worker got message', message);
  onMessage(message).catch(console.log.bind(console));

});
