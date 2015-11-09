#!/usr/bin/env node

require('regenerator/runtime');

var PouchDB = require('pouchdb');
var repStream = require('pouchdb-replication-stream');
var load = require('pouchdb-load');
PouchDB.plugin(repStream.plugin);
PouchDB.adapter('writableStream', repStream.adapters.writableStream);
PouchDB.plugin({loadIt: load.load});
var memdown = require('memdown');
var bluebird = require('bluebird');
var fs = bluebird.promisifyAll(require('fs'));
var fetch = require('node-fetch');
var shortRevs = require('short-revs');

var db = new PouchDB('inmem', {db: memdown});

var NUM_TYPES = 18;

async function doIt() {
  for (var i = 1; i <= NUM_TYPES; i++) {
    var result = await fetch(`http://pokeapi.co/api/v1/type/${i}`);
    var json = await result.json();
    json._id = json.name.toLowerCase();
    await db.put(json);
  }
  var out = fs.createWriteStream('src/assets/types.txt');
  var stream = shortRevs();
  await db.dump(stream);
  stream.pipe(out);
}

doIt().catch(console.log.bind(console));