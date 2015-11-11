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
var zpad = require('zpad');
var fetch = require('node-fetch');
var pick = require('lodash').pick;
var fetch = require('node-fetch');
var shortRevs = require('short-revs');

var csvUrl = 'https://raw.githubusercontent.com/phalt/pokeapi/0d666b130363b26621c339e5f8415a02dcd4806b/data/v2/csv/moves.csv';

var db = new PouchDB('inmem2', {db: memdown});

var typeIdsToNames = {
  '7': 'Bug',
  '17': 'Dark',
  '16': 'Dragon',
  '13': 'Electric',
  '18': 'Fairy',
  '2': 'Fighting',
  '10': 'Fire',
  '3': 'Flying',
  '8': 'Ghost',
  '12': 'Grass',
  '5': 'Ground',
  '15': 'Ice',
  '1': 'Normal',
  '4': 'Poison',
  '14': 'Psychic',
  '6': 'Rock',
  '9': 'Steel',
  '11': 'Water'
};

async function doIt() {

  var csv = await (await fetch(csvUrl)).text();

  csv = csv.split('\n');
  var top = csv[0].split(',');
  csv = csv.slice(1, -1);

  var docs = [];
  for (var line of csv) {
    line = line.split(',');
    var doc = {};
    for (var i = 0; i < top.length; i++) {
      var key = top[i];
      var value = line[i];
      if (i !== 1 && value !== '') { // non-integer
        value = parseInt(value);
      }
      doc[key] = value;
    }

    if (doc.id > 700) {
      // there are some weird "shadow" moves in here
      // that seem to have broken data. ignore them
      continue;
    }

    doc._id = zpad(doc.id, 5);
    doc.type_name = typeIdsToNames[doc.type_id.toString()].toLowerCase();

    var fetched = await fetch(`http://pokeapi.co/api/v1/move/${doc.id}/`);
    var fetchedJson = await fetched.json();
    console.log(`fetched move #${doc.id}....`);

    doc.description = fetchedJson.description;
    doc.name = fetchedJson.name;

    doc = pick(doc, '_id', 'type_name', 'identifier', 'power', 'pp',
      'accuracy', 'description', 'name');

    docs.push(doc);
  }

  docs = docs.filter(x => x !== null);

  await db.bulkDocs(docs);
  var out = fs.createWriteStream('src/assets/moves.txt');
  var stream = shortRevs();
  await db.dump(stream);
  stream.pipe(out);
}

doIt().catch(console.log.bind(console));