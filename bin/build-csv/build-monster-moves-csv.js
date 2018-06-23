#!/usr/bin/env node

require('regenerator-runtime/runtime');

const PouchDB = require('pouchdb');
const repStream = require('pouchdb-replication-stream');
PouchDB.plugin(repStream.plugin);
PouchDB.adapter('writableStream', repStream.adapters.writableStream);
const memdown = require('memdown');
const fs = require('fs');
const shortRevs = require('short-revs');
const loadCSV = require('./csv-load.js');

const db = new PouchDB('inmem2', {db: memdown});

async function build() {
  const moveMethods = await loadCSV.object('csv/pokemon_move_methods.csv', 'id');
  const moveArr = await loadCSV.array('csv/pokemon_moves.csv');

  const pokemon = {};
  moveArr.forEach(row => {
    const pkmnId = row.pokemon_id;

    if (!pokemon[pkmnId]) {
      pokemon[pkmnId] = {
        _moves: {},
        moves: [],
        _id: pkmnId.padStart(5, '0'),
      };
    }

    // make sure moves aren't duplicated
    if (!pokemon[pkmnId]._moves[row.move_id]) {
      const moveMethod = moveMethods[row.pokemon_move_method_id].identifier;
      const out = {
        learn_type: moveMethod,
        id: parseInt(row.move_id, 10),
      };

      if (moveMethod === 'level-up') {
        out.level = parseInt(row.level, 10);
      }

      pokemon[pkmnId].moves.push(out);
      pokemon[pkmnId]._moves[row.move_id] = true;
    }
  });

  for (let i = 1; i <= 802; i++) {
    pokemon[i]._moves = undefined;
    await db.put(pokemon[i]);
  }

  const out = fs.createWriteStream('src/assets/monster-moves.txt');
  const stream = shortRevs();
  await db.dump(stream);
  stream.pipe(out);
}

build().catch(console.log.bind(console));
