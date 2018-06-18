#!/usr/bin/env node

require('regenerator-runtime/runtime');

var PouchDB = require('pouchdb');
var repStream = require('pouchdb-replication-stream');
PouchDB.plugin(repStream.plugin);
PouchDB.adapter('writableStream', repStream.adapters.writableStream);
var memdown = require('memdown');
var db = new PouchDB('inmem', {db: memdown});
var fs = require('fs');
var zpad = require('zpad');
var shortRevs = require('short-revs');
const csvParse = require('csv-parse');


async function loadCSVObject(filepath, uniqueKey) {
  const parser = csvParse({columns: true});
  const result = {};
  parser.on('readable', function() {
    while (record = parser.read()) {
      result[record[uniqueKey]] = record;
    }
  });

  fs.createReadStream(filepath).pipe(parser);
  return new Promise(function(resolve, reject) {
    parser.on('end', ()=>resolve(result));
    parser.on('error', reject);
  });
}

async function build() {
  const monsters = await loadCSVObject('csv/pokemon.csv', 'id');
  const monsterArray = Object.values(monsters);

  for (let i = 0; i < monsterArray.length; i++) {
    const m = monsterArray[i];
    m._id = zpad(m.id, 5);
    m.national_id = m.id;
    await db.put(m);
  }

  var out = fs.createWriteStream('src/assets/monsters.txt');
  var stream = shortRevs();
  await db.dump(stream);
  stream.pipe(out);
}
build().catch(console.log.bind(console));
