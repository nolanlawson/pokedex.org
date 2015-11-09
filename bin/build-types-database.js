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

  var rawDocs = [];

  for (var i = 1; i <= NUM_TYPES; i++) {
    var result = await fetch(`http://pokeapi.co/api/v1/type/${i}`);
    var json = await result.json();
    rawDocs.push(json);
  }

  var mapping = {};

  rawDocs.forEach(doc => {
    var thisName = doc.name.toLowerCase();

    mapping[thisName] = mapping[thisName] || {};
    mapping[thisName].whenAttacking = mapping[thisName].whenAttacking || [];

    function addMapping(multiplier) {
      return function (otherType) {
        var otherName = otherType.name.toLowerCase();

        mapping[thisName].whenAttacking.push({
          multiplier: multiplier,
          name: otherName
        });
        mapping[otherName] = mapping[otherName] || {};
        mapping[otherName].whenDefending = mapping[otherName].whenDefending || [];
        mapping[otherName].whenDefending.push({
          multiplier: multiplier,
          name: thisName
        });
      }
    }

    doc.ineffective.forEach(addMapping(0.5));
    doc.no_effect.forEach(addMapping(0));
    doc.super_effective.forEach(addMapping(2));
  });

  var newDocs = Object.keys(mapping).map(key => {
    var doc = mapping[key];
    doc._id = key;
    return doc;
  });

  await db.bulkDocs(newDocs);

  var out = fs.createWriteStream('src/assets/types.txt');
  var stream = shortRevs();
  await db.dump(stream);
  stream.pipe(out);
}

doIt().catch(console.log.bind(console));