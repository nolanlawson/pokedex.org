require('regenerator-runtime/runtime');

const fs = require('fs');
const loadCSV = require('./csv-load.js');
const PouchDB = require('pouchdb');
const repStream = require('pouchdb-replication-stream');
PouchDB.plugin(repStream.plugin);
PouchDB.adapter('writableStream', repStream.adapters.writableStream);
const memdown = require('memdown');
const db = new PouchDB('inmem', {db: memdown});
const shortRevs = require('short-revs');

async function build() {
  // some descriptions are missing for Sun/Moon, so just use the maximum version present.
  const descriptions = await loadCSV.object('csv/pokemon_species_flavor_text.csv', 'species_id', row => row.language_id === '9');

  for (let i = 1; i <= 802; i++) {
    await db.put({
      _id: `${i}`.padStart(7, '0'),
      description: descriptions[`${i}`].flavor_text,
    });
  }

  const out = fs.createWriteStream('src/assets/descriptions.txt');
  const stream = shortRevs();
  await db.dump(stream);
  stream.pipe(out);
}

build().catch(console.log.bind(console));
