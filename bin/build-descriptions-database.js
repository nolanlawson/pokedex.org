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
var lodash = require('lodash');

var NUM_DESCRIPTIONS = 6610;

async function doIt() {
  var promises = lodash.range(NUM_DESCRIPTIONS).map(async i => {
    var json;
    try {
      var result = await fetch(`http://pokeapi.co/api/v1/description/${i}`);
      json = await result.json();
    } catch (err) {
      return; // ignore; the API has some holes
    }
    var doc = {
      _id: zpad(json.id, 7),
      description: json.description
    };
    await db.put(doc);
  });

  await* promises;

  var out = fs.createWriteStream('src/db/descriptions.txt');
  await db.dump(out);
}

doIt().catch(console.log.bind(console));