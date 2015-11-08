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

var source = new PouchDB('inmem', {db: memdown});
var target = new PouchDB('inmem2', {db: memdown});

async function doIt() {
  await source.loadIt(await fs.readFileAsync('src/assets/monsters.txt', 'utf-8'));

  var docs = await source.allDocs({include_docs: true});
  var outputDocs = docs.rows.map(row => {
    return pick(row.doc, '_id', 'moves');
  });

  await target.bulkDocs(outputDocs);

  var out = fs.createWriteStream('src/assets/monster-moves.txt');
  await target.dump(out);
}

doIt().catch(console.log.bind(console));