#!/usr/bin/env node

require('regenerator/runtime');

var fetch = require('node-fetch');
var PouchDB = require('pouchdb');
var repStream = require('pouchdb-replication-stream');
PouchDB.plugin(repStream.plugin);
PouchDB.adapter('writableStream', repStream.adapters.writableStream);
var memdown = require('memdown');
var db = new PouchDB('inmem', {db: memdown});
var fs = require('fs');
var zpad = require('zpad');
var shortRevs = require('short-revs');

var NUM_MONSTERS = 649;

async function doIt() {
  for (var i = 1; i <= NUM_MONSTERS; i++) {
    var result = await fetch(`http://pokeapi.co/api/v1/pokemon/${i}`);
    var json = await result.json();
    json._id = zpad(json.national_id, 5);
    await db.put(json);
  }

  var out = fs.createWriteStream('src/assets/monsters.txt');
  var stream = shortRevs();
  await db.dump(stream);
  stream.pipe(out);
}

doIt().catch(console.log.bind(console));