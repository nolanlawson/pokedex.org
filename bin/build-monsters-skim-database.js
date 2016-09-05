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
var shortRevs = require('short-revs');

var source = new PouchDB('inmem', {db: memdown});
var target = new PouchDB('inmem2', {db: memdown});

target.transform({
  incoming: doc => {
    doc = pick(doc, '_id', '_rev', '_revisions', 'descriptions',
      'types', 'attack', 'defense', 'speed', 'sp_atk', 'sp_def', 'hp',
      'weight', 'height', 'national_id', 'name', 'male_female_ratio',
      'abilities', 'catch_rate');
    doc.descriptions = doc.descriptions.filter(x => x.name === monster.name.toLowerCase() + '_gen_5');
    return doc;
  }
});

async function doIt() {
  await source.loadIt(await fs.readFileAsync('src/assets/monsters.txt', 'utf-8'));

  await source.replicate.to(target);

  var out = fs.createWriteStream('src/assets/skim-monsters.txt');
  await target.dump(out);
}

doIt().catch(console.log.bind(console));