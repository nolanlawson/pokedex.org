#!/usr/bin/env node

require('regenerator-runtime/runtime');

const PouchDB = require('pouchdb');
const repStream = require('pouchdb-replication-stream');
PouchDB.plugin(repStream.plugin);
PouchDB.adapter('writableStream', repStream.adapters.writableStream);
const memdown = require('memdown');
const fs = require('fs');
const shortRevs = require('short-revs');
const loadCSV = require('./csv-load');

const db = new PouchDB('inmem', {db: memdown});

async function build() {
  const types = await loadCSV.object('csv/types.csv', 'id', row => parseInt(row.id) <= 18);
  const efficacy = await loadCSV.array('csv/type_efficacy.csv');

  const result = {};
  efficacy.forEach(row => {
    if (!result[row.damage_type_id]) {
      result[row.damage_type_id] = {
        whenAttacking: [],
        whenDefending: [],
        _id: types[row.damage_type_id].identifier
      };
    }
    if (!result[row.target_type_id]) {
      result[row.target_type_id] = {
        whenAttacking: [],
        whenDefending: [],
        _id: types[row.target_type_id].identifier };
    }


    if (row.damage_factor !== '100') {
      result[row.damage_type_id].whenAttacking.push({
        multiplier: parseInt(row.damage_factor) / 100,
        name: types[row.target_type_id].identifier,
      });

      result[row.target_type_id].whenDefending.push({
        multiplier: parseInt(row.damage_factor) / 100,
        name: types[row.damage_type_id].identifier,
      });
    }
  });

  const arr = Object.values(result);
  for (let i = 0; i < arr.length; i++) {
    await db.put(arr[i]);
  }

  var out = fs.createWriteStream('src/assets/types.txt');
  var stream = shortRevs();
  await db.dump(stream);
  stream.pipe(out);
}

build().catch(console.log.bind(console));
