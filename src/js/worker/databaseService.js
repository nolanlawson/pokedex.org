require('regenerator/runtime');

var zpad = require('zpad');
var find = require('lodash/collection/find');
var assign = require('lodash/object/assign');
var PouchDB = require('pouchdb');
PouchDB.plugin(require('pouchdb-upsert'));
PouchDB.plugin(require('pouchdb-load'));
var inMemoryDB = require('./inMemoryDatabase');
var Stopwatch = require('../shared/util/stopwatch');

var dbs = {
  monsters: {},
  descriptions: {},
  moves: {},
  evolutions: {},
  types: {},
  monsterMoves: {},
  supplemental: {}
};

async function checkReplicated(db) {
  if (db.__initialLoadComplete) {
    return true;
  }
  try {
    await db.get('_local/initialLoadComplete');
    db.__initialLoadComplete = true;
    return true;
  } catch (ignored) {
    return false;
  }
}

async function markReplicated(db) {
  db.__initialLoadComplete = true;
  return await db.putIfNotExists({
    _id: '_local/initialLoadComplete'
  });
}

async function replicateDB(db, filename) {
  var alreadyDone = await checkReplicated(db);
  if (alreadyDone) {
    console.log(`${filename}: replication already done`);
    return;
  }

  console.log(`${filename}: started replication`);
  await db.load(filename);
  console.log(`${filename}: done replicating`);
  await markReplicated(db);
}

async function initDBs(couchHome) {
  dbs.monsters.local = new PouchDB('monsters');
  dbs.monsters.remote = new PouchDB(couchHome + '/monsters');
  dbs.descriptions.local = new PouchDB('descriptions');
  dbs.descriptions.remote = new PouchDB(couchHome + '/descriptions');
  dbs.evolutions.local = new PouchDB('evolutions');
  dbs.evolutions.remote = new PouchDB(couchHome + '/evolutions');
  dbs.types.local = new PouchDB('types');
  dbs.types.remote = new PouchDB(couchHome + '/types');
  dbs.moves.local = new PouchDB('moves');
  dbs.moves.remote = new PouchDB(couchHome + '/moves');
  dbs.monsterMoves.local = new PouchDB('monster-moves');
  dbs.monsterMoves.remote = new PouchDB(couchHome + '/monster-moves');
  dbs.supplemental.local = new PouchDB('monsters-supplemental');
  dbs.supplemental.remote = new PouchDB(couchHome + '/monsters-supplemental');

  if (dbs.monsters.local.adapter) {
    // do one-at-a-time to avoid excessive memory usage
    await replicateDB(dbs.monsters.local, '../assets/skim-monsters.txt');
    await replicateDB(dbs.supplemental.local, '../assets/monsters-supplemental.txt');
    await replicateDB(dbs.types.local, '../assets/types.txt');
    await replicateDB(dbs.descriptions.local, '../assets/descriptions.txt');
    await replicateDB(dbs.evolutions.local, '../assets/evolutions.txt');
    await replicateDB(dbs.moves.local, '../assets/moves.txt');
    await replicateDB(dbs.monsterMoves.local, '../assets/monster-moves.txt');
  } else {
    console.log('this browser doesn\'t support PouchDB. cannot work offline.');
  }
}

async function getBestDB(db) {
  if (await checkReplicated(db.local)) {
    return db.local;
  }
  return db.remote;
}

function getGeneration5DescriptionDocId(monster) {
  // get a generation-5 description
  var desc = find(monster.descriptions, x => /_gen_5$/.test(x.name));
  var descId = desc.resource_uri.match(/\/(\d+)\/$/)[1];
  return zpad(parseInt(descId, 10), 7);
}

function getDocId(monster) {
  return zpad(monster.national_id, 5);
}

async function getMonsterDocById(docId) {
  return await (await getBestDB(dbs.monsters)).get(docId);
}

async function getSupplementalInfoById(docId) {
  return await (await getBestDB(dbs.supplemental)).get(docId);
}

async function getDescriptionById(docId) {
  return await (await getBestDB(dbs.descriptions)).get(docId);
}

async function getEvolutionsById(docId) {
  var db = await getBestDB(dbs.evolutions);
  try {
    return await db.get(docId);
  } catch (err) {
    if (err.status === 404) { // not found
      return {to: [], from: []}; // no evolutions
    }
    throw err; // some other error
  }

}

async function getAllTypesByIds(docIds) {
  var db = await getBestDB(dbs.types);
  var res = await db.allDocs({
    include_docs: true,
    keys: docIds
  });
  return res.rows.map(row => row.doc);
}

async function getAllMovesByIds(docIds) {
  var db = await getBestDB(dbs.moves);
  var res = await db.allDocs({
    include_docs: true,
    keys: docIds
  });
  return res.rows.map(row => row.doc);
}

async function getMonsterMovesById(docId) {
  var monsterData = await (await getBestDB(dbs.monsterMoves)).get(docId);

  var moveIds = monsterData.moves.map(move => zpad(move.id, 5));
  var moves = await getAllMovesByIds(moveIds);

  var monsterMoves = moves.map((move, i) => {
    return assign({}, move, monsterData.moves[i]);
  });

  return monsterMoves;
}

module.exports = {
  init: origin => {
    var couchHome;
    if (origin.indexOf('pokedex.org') !== -1) {
      // production
      couchHome = 'https://nolan.cloudant.com';
    } else {
      couchHome = origin.replace(/:[^:]+$/, ':6984');
    }
    initDBs(couchHome);
  },
  getFullMonsterDataById: async nationalId => {
    var stopwatch = new Stopwatch();
    var monsterSummary = inMemoryDB.findByNationalId(nationalId);
    var monsterDocId = getDocId(monsterSummary);
    var descDocId = getGeneration5DescriptionDocId(monsterSummary);
    var promises = [
      getMonsterDocById(monsterDocId),
      getDescriptionById(descDocId),
      getEvolutionsById(monsterDocId),
      getSupplementalInfoById(monsterDocId),
      getAllTypesByIds(monsterSummary.types.map(type => type.name))
    ];

    var results = await* promises;
    var [monster, description, evolutions, supplemental, types] = results;

    stopwatch.time('get() monster and monster data');
    return {monster, description, evolutions, supplemental, types};
  },
  getFilteredMonsters: async (filter) => {
    return inMemoryDB.findByNamePrefix(filter);
  },
  getAllMonsters: () => {
    return inMemoryDB.findAll();
  },
  getMonsterSummaryById: nationalId => {
    return inMemoryDB.findByNationalId(nationalId);
  }
};