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
  monsterMoves: {}
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

  if (dbs.monsters.local.adapter) {
    var promises = [
      replicateDB(dbs.monsters.local, '../assets/skim-monsters.txt'),
      replicateDB(dbs.descriptions.local, '../assets/descriptions.txt'),
      replicateDB(dbs.evolutions.local, '../assets/evolutions.txt'),
      replicateDB(dbs.types.local, '../assets/types.txt'),
      replicateDB(dbs.moves.local, '../assets/moves.txt'),
      replicateDB(dbs.monsterMoves.local, '../assets/monster-moves.txt')
    ];
    await* promises;
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

async function getDescriptionById(docId) {
  return await (await getBestDB(dbs.descriptions)).get(docId);
}

async function getEvolutionsById(docId) {
  return await (await getBestDB(dbs.evolutions)).get(docId);
}

async function getTypeById(docId) {
  return await (await getBestDB(dbs.types)).get(docId);
}

async function getMoveById(docId) {
  var db = await getBestDB(dbs.moves);
  try {
    return await db.get(docId);
  } catch (err) {
    if (err.status !== 404) {
      throw err;
    }
    return null; // TODO: why not found?
  }
}

async function getMonsterMovesById(docId) {
  var monsterData = await (await getBestDB(dbs.monsterMoves)).get(docId);
  var promises = monsterData.moves.map(move => {
    var moveId = zpad(parseInt(move.resource_uri.match(/(\d+)\/$/)[0], 10), 5);
    return getMoveById(moveId);
  });
  var moves = await* promises;

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
      getMonsterMovesById(monsterDocId)
    ];

    monsterSummary.types.forEach(type => {
      promises.push(getTypeById(type.name));
    });

    var results = await* promises;

    var monster = results[0];
    var description = results[1];
    var evolutions = results[2];
    var moves = results[3];
    var types = results.slice(4);

    stopwatch.time('get() monster and monster data');
    return {monster, description, evolutions, moves, types};
  },
  getFilteredMonsters: async (filter) => {
    return inMemoryDB.findByNamePrefix(filter);
  },
  getInitialMonsters: () => {
    return inMemoryDB.findAll();
  }
};