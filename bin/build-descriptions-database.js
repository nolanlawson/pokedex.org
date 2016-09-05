#!/usr/bin/env node

require('regenerator/runtime');

var fetch = require('node-fetch');
var PouchDB = require('pouchdb');
var repStream = require('pouchdb-replication-stream');
PouchDB.plugin(repStream.plugin);
PouchDB.adapter('writableStream', repStream.adapters.writableStream);
var pouchdbLoad = require('pouchdb-load');
PouchDB.plugin({loadIt: pouchdbLoad.load});
var memdown = require('memdown');
var db = new PouchDB('inmem', {db: memdown});
var bluebird = require('bluebird');
var fs = bluebird.promisifyAll(require('fs'));
var zpad = require('zpad');
var lodash = require('lodash');
var shortRevs = require('short-revs');

var monstersDB = new PouchDB('monsters', {db: memdown});

async function doIt() {

  await monstersDB.loadIt(await fs.readFileAsync('./src/assets/monsters.txt', 'utf-8'));

  var allMonsters = await monstersDB.allDocs({include_docs: true});
  var descriptionIds = allMonsters.rows.map(row => {
    var monster = row.doc;
    // get just generation-5 descriptions
    var desc = lodash.find(monster.descriptions, x => x.name === monster.name.toLowerCase() + '_gen_5' );
    var descId = parseInt(desc.resource_uri.match(/\/(\d+)\/$/)[1], 10);
    return descId;
  });

  descriptionIds = lodash.uniq(descriptionIds);

  for (var i = 0; i < descriptionIds.length; i++) {
    var descId = descriptionIds[i];
    console.log(`fetching ${descId}...`);
    var json;
    try {
      var result = await fetch(`http://pokeapi.co/api/v1/description/${descId}`);
      json = await result.json();
    } catch (err) {
      continue; // ignore; the API has some holes
    }
    var doc = {
      _id: zpad(json.id, 7),
      description: json.description.replace('Pokmon', 'Pokémon') // error in the data
    };
    await db.put(doc);
  }

  var out = fs.createWriteStream('src/assets/descriptions.txt');
  var stream = shortRevs();
  await db.dump(stream);
  stream.pipe(out);
}

doIt().catch(console.log.bind(console));