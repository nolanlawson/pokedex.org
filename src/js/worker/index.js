require('regenerator/runtime');

var PouchDB = require('pouchdb');
PouchDB.plugin(require('pouchdb-upsert'));
var renderMonstersList = require('../shared/renderMonstersList');
var toJson = require('vdom-as-json/toJson');
var diff = require('virtual-dom/diff');
var byNameDdoc = require('../shared/byNameDdoc');
var Stopwatch = require('../shared/stopwatch');
var inMemoryDB = require('./inMemoryDatabase');

var localDB = new PouchDB('monsters');
var couchHome = self.location.origin.replace(/:[^:]+$/, ':6984');
var remoteDB = new PouchDB(couchHome + '/monsters');

var liveReplicationFinished = false;

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
  });
}

replicate();

var monstersList;

async function getBestDB() {
  return liveReplicationFinished ? localDB : remoteDB;
}

async function getInitialMonsters() {
  return inMemoryDB.findAll();
}

async function getFilteredMonsters(filter) {
  return inMemoryDB.findByNamePrefix(filter);
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
  }

  stopwatch.time('getting monsters');

  var newMonstersList = renderMonstersList(newMonsters);

  stopwatch.time('rendering monsters');

  var patch = diff(monstersList, newMonstersList);

  stopwatch.time('diffing monsters');

  monstersList = newMonstersList;

  var patchJson = toJson(patch);

  stopwatch.time('toJson');

  var patchJsonAsString = JSON.stringify(patchJson);

  stopwatch.time('JSON.stringify()');

  console.log('patchJsonAsString.length', patchJsonAsString.length);

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
