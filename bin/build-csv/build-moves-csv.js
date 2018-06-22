#!/usr/bin/env node

require('regenerator-runtime/runtime');

var PouchDB = require('pouchdb');
var repStream = require('pouchdb-replication-stream');
var load = require('pouchdb-load');
PouchDB.plugin(repStream.plugin);
PouchDB.adapter('writableStream', repStream.adapters.writableStream);
PouchDB.plugin({loadIt: load.load});
var memdown = require('memdown');
var fs = require('fs');
var shortRevs = require('short-revs');
var db = new PouchDB('inmem2', {db: memdown});
const loadCSV = require('./csv-load.js');

async function build() {
  const moveArr = await loadCSV.array('csv/moves.csv');
  const moveNames = await loadCSV.object('csv/move_names.csv', 'move_id', row => row.local_language_id === '9');
  const moveDescriptions = await loadCSV.object('csv/move_flavor_text.csv', 'move_id', row => row.language_id === '9');
  const types = await loadCSV.object('csv/types.csv', 'id');

  for (let i = 0; i < 719; i++) {
    const row = moveArr[i];
    await db.put({
      _id: row.id.padStart(5, '0'),
      identifier: row.identifier,
      power: parseInt(row.power, 10),
      pp: parseInt(row.pp, 10),
      accuracy: parseInt(row.accuracy, 10),
      description: moveDescriptions[row.id].flavor_text,
      name: moveNames[row.id].name,
      type_name: types[row.type_id].identifier,
    });
  }

  var out = fs.createWriteStream('src/assets/moves.txt');
  var stream = shortRevs();
  await db.dump(stream);
  stream.pipe(out);
}

build().catch(console.log.bind(console));
