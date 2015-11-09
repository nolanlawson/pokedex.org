#!/usr/bin/env node

require('regenerator/runtime');

var PouchDB = require('pouchdb');
var repStream = require('pouchdb-replication-stream');
var transformPouch = require('transform-pouch');
var load = require('pouchdb-load');
PouchDB.plugin(repStream.plugin);
PouchDB.adapter('writableStream', repStream.adapters.writableStream);
PouchDB.plugin(transformPouch);
PouchDB.plugin({loadIt: load.load});
var memdown = require('memdown');
var bluebird = require('bluebird');
var fs = bluebird.promisifyAll(require('fs'));
var pick = require('lodash').pick;
var zpad = require('zpad');

var species = require('../src/js/shared/data/species');
var jpnNames = require('../src/js/shared/data/japaneseNames');
var hepburnNames = require('../src/js/shared/data/hepburnNames');
var eggGroups = require('../src/js/shared/data/eggGroups');
var supplemental = require('../src/js/shared/data/supplemental');
var shortRevs = require('short-revs');

var target = new PouchDB('inmem2', {db: memdown});

async function doIt() {

  var docs = [];
  for (var i = 0; i < supplemental.length; i++) {
    var doc = supplemental[i];
    doc._id = zpad(doc.id, 5);
    delete doc.id;
    doc.species = species[i];
    doc.japaneseName = jpnNames[i];
    doc.hepburnName = hepburnNames[i];
    doc.eggGroups = eggGroups[i];
    docs.push(doc);
  }

  await target.bulkDocs(docs);

  var out = fs.createWriteStream('src/assets/monsters-supplemental.txt');
  var stream = shortRevs();
  await target.dump(stream);
  stream.pipe(out);
}

doIt().catch(console.log.bind(console));