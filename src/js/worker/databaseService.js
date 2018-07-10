require('regenerator-runtime/runtime');

var zpad = require('zpad');
var assign = require('lodash/assign');
var PouchDB = require('./pouchdb');
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
  try {
    await db.get('_local/v1-load-complete');
    return true;
  } catch (ignored) {
    return false;
  }
}

async function markReplicated(db) {
  return await db.putIfNotExists({
    _id: '_local/v1-load-complete'
  });
}

async function replicateDB(db, filename, numFiles) {
  if (await checkReplicated(db)) {
    console.log(`${filename}: replication already done`);
    return;
  }

  console.log(`${filename}: started replication`);
  if (numFiles) {
    for (var i = 1; i <= numFiles; i++) {
      // file was broken up into smaller files
      await db.load(filename.replace('.txt', `-${i}.txt`));
    }
  } else {
    await db.load(filename);
  }
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

    var importantReplications = [
      replicateDB(dbs.monsters.local, '../assets/skim-monsters.txt', 3),
      replicateDB(dbs.supplemental.local, '../assets/monsters-supplemental.txt', 3),
      replicateDB(dbs.types.local, '../assets/types.txt'),
      replicateDB(dbs.descriptions.local, '../assets/descriptions.txt', 3),
      replicateDB(dbs.evolutions.local, '../assets/evolutions.txt')
    ];

    await Promise.all(importantReplications);

    var lessImportantReplications = [
      replicateDB(dbs.moves.local, '../assets/moves.txt', 3),
      replicateDB(dbs.monsterMoves.local, '../assets/monster-moves.txt', 3)
    ];

    await Promise.all(lessImportantReplications);
  } else {
    console.log('this browser doesn\'t support PouchDB. cannot work offline.');
  }
}

function getGeneration5DescriptionDocId(monster) {
  return zpad(monster.national_id, 7);
}

function getDocId(monster) {
  return zpad(monster.national_id, 5);
}

async function getById(db, docId) {
  return await db.get(docId);
}

async function getManyByIds(db, docIds) {
  var res = await db.allDocs({
    include_docs: true,
    keys: docIds
  });
  if (!res.rows.every(row => row.doc)) {
    throw new Error('doc not found');
  }
  return res.rows.map(row => row.doc);
}

async function doLocalFirst(dbFun, dbHolder) {
  // hit the local DB first; if it 404s, then hit the remote
  try {
    return await dbFun(dbHolder.local);
  } catch (err) {
    return await dbFun(dbHolder.remote);
  }
}

async function getMonsterMovesById(nationalId) {
  var docId = zpad(nationalId, 5);
  var monsterData = await doLocalFirst(db => getById(db, docId), dbs.monsterMoves);

  var moveIds = monsterData.moves.map(move => zpad(move.id, 5));
  var moves = await doLocalFirst(db => getManyByIds(db, moveIds), dbs.moves);

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
    var stopwatch = new Stopwatch('getFullMonsterDataById()');
    var monsterSummary = inMemoryDB.findByNationalId(nationalId);
    var monsterDocId = getDocId(monsterSummary);
    var descDocId = getGeneration5DescriptionDocId(monsterSummary);
    var promises = [
      doLocalFirst(db => getById(db, monsterDocId), dbs.monsters),
      doLocalFirst(db => getById(db, descDocId), dbs.descriptions),
      doLocalFirst(db => getById(db, monsterDocId), dbs.evolutions),
      doLocalFirst(db => getById(db, monsterDocId), dbs.supplemental),
      doLocalFirst(db => getManyByIds(db, monsterSummary.types.map(type => type.name)), dbs.types)
    ];

    var results = await Promise.all(promises);
    var [monster, description, evolutions, supplemental, types] = results;

    stopwatch.totalTime();
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
  },
  getMonsterMovesById: async nationalId => {
    return await getMonsterMovesById(nationalId);
  }
};
