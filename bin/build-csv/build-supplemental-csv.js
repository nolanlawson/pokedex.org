require('regenerator-runtime/runtime');

const PouchDB = require('pouchdb');
const repStream = require('pouchdb-replication-stream');
PouchDB.plugin(repStream.plugin);
PouchDB.adapter('writableStream', repStream.adapters.writableStream);
const memdown = require('memdown');
const fs = require('fs');
const db = new PouchDB('inmem2', { db: memdown });
const loadCSV = require('./csv-load.js');
const shortRevs = require('short-revs');

async function build() {
  const speciesNames = await loadCSV.object('csv/pokemon_species_names.csv', 'pokemon_species_id', row => row['local_language_id'] === '9');
  const speciesData = await loadCSV.object('csv/pokemon_species.csv', 'id');

  const eggGroups = await loadCSV.array('csv/pokemon_egg_groups.csv');
  const eggGroupNames = await loadCSV.object('csv/egg_group_prose.csv', 'egg_group_id', row => row.local_language_id === '9');

  let eggGroupIndex = 0;
  for (let i = 1; i <= 802; i++) {
    const doc = {
      _id: `${i}`.padStart(5, '0'),
      id: i,
      species: speciesNames[`${i}`].genus,
      hatchSteps: (parseInt(speciesData[`${i}`].hatch_counter, 10) + 1) * 255,
      genderRatio: 100 - (12.5 * parseInt(speciesData[`${i}`].gender_rate, 10))
    };

    let eggGroupsArr = [];
    while (eggGroupIndex < eggGroups.length && eggGroups[`${eggGroupIndex}`].species_id === `${i}`) {
      const eggGroupId = eggGroups[`${eggGroupIndex}`].egg_group_id;
      eggGroupsArr.push(eggGroupNames[`${eggGroupId}`].name);
      eggGroupIndex++;
    }
    doc.eggGroups = eggGroupsArr.join(', ');

    await db.put(doc);
  }

  const out = fs.createWriteStream('src/assets/monsters-supplemental.txt');
  const stream = shortRevs();
  await db.dump(stream);
  stream.pipe(out);
}

build().catch(console.log.bind(console));
