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
var pick = require('lodash').pick;
var shortRevs = require('short-revs');

var source = new PouchDB('inmem', {db: memdown});
var target = new PouchDB('inmem2', {db: memdown});

async function doIt() {
  await source.loadIt(await fs.readFileAsync('src/assets/monsters.txt', 'utf-8'));

  var docs = await source.allDocs({include_docs: true});
  var outputDocs = docs.rows.map(row => {
    var doc = pick(row.doc, '_id', 'moves');
    doc.moves = doc.moves.map(move => {
      var res = pick(move, 'learn_type', 'level');
      res.id = parseInt(move.resource_uri.match(/(\d+)\/$/)[1]);
      return res;
    });
    return doc;
  });

  await target.bulkDocs(outputDocs);

  var out = fs.createWriteStream('src/assets/monster-moves.txt');
  var stream = shortRevs();
  await target.dump(stream);
}

doIt().catch(console.log.bind(console));