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
var shortRevs = require('short-revs');

var source = new PouchDB('inmem', {db: memdown});
var target = new PouchDB('inmem2', {db: memdown});

var NUM_MONSTERS = 649;

async function doIt() {
  await source.loadIt(await fs.readFileAsync('src/assets/monsters.txt', 'utf-8'));

  var mapping = {};
  for (var i = 1; i <= NUM_MONSTERS; i++) {
    mapping[zpad(i, 5)] = {};
  }
  var docs = await source.allDocs({include_docs: true});
  docs.rows.forEach(row => {
    var doc = row.doc;
    if (!doc.evolutions) {
      return;
    }
    doc.evolutions.forEach(evolution => {

      if (evolution.detail === 'mega') {
        // ignore these; they are weird
        return;
      }

      var fromId = doc._id;
      var toId = zpad(parseInt(evolution.resource_uri.match(/(\d+)\/$/)[0], 10), 5);
      mapping[fromId] = mapping[fromId] || {};
      mapping[toId] = mapping[toId] || {};
      mapping[fromId].to = mapping[fromId].to || [];
      mapping[toId].from = mapping[toId].from || [];

      var to = {
        nationalId: parseInt(toId),
        name: evolution.to,
        method: evolution.method
      };

      if (evolution.level) {
        to.level = evolution.level;
      }

      mapping[fromId].to.push(to);

      var from = {
        nationalId: parseInt(fromId),
        name: doc.name,
        method: evolution.method
      };

      if (evolution.level) {
        from.level = evolution.level;
      }

      mapping[toId].from.push(from);
    });
  });

  var finalDocs = Object.keys(mapping).map(function (id) {
    var doc = mapping[id];
    doc._id = id;
    return doc;
  });

  await target.bulkDocs(finalDocs);

  var out = fs.createWriteStream('src/assets/evolutions.txt');
  var stream = shortRevs();
  await target.dump(stream);
  stream.pipe(out);
}

doIt().catch(console.log.bind(console));