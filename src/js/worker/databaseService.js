require('regenerator/runtime');

var PouchDB = require('pouchdb');
PouchDB.plugin(require('pouchdb-upsert'));
var inMemoryDB = require('./inMemoryDatabase');

var localDB;
var couchHome;
var remoteDB;
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

module.exports = {
  init: (origin) => {
    couchHome = origin.replace(/:[^:]+$/, ':6984');
    remoteDB = new PouchDB(couchHome + '/monsters');
    localDB = new PouchDB('monsters');
    if (localDB.adapter) {
      replicate();
    } else {
      console.log(
        'this browser doesn\'t support worker IDB. cannot work offline.');
    }
  },
  getBestDB: async () => {
    return liveReplicationFinished ? localDB : remoteDB;
  },
  getFilteredMonsters: async (filter) => {
    return inMemoryDB.findByNamePrefix(filter);
  },
  getInitialMonsters: async () => {
    return inMemoryDB.findAll();
  }
};