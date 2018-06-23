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
  const speciesData = await loadCSV.object('csv/pokemon_species.csv', 'id');
  const speciesNames = await loadCSV.object('csv/pokemon_species_names.csv', 'pokemon_species_id', row => row.local_language_id === '9');
  const evolutionTriggers = await loadCSV.object('csv/evolution_triggers.csv', 'id');
  const evolutionData = await loadCSV.object('csv/pokemon_evolution.csv', 'evolved_species_id');

  const pokemon = {};

  for (let i = 1; i <= 802; i++) {
    const row = speciesData[`${i}`];
    const evolvedFrom = row.evolves_from_species_id;
    if (evolvedFrom) {
      // create objects if they don't exist
      if (!pokemon[`${i}`]) {
        pokemon[`${i}`] = {
          from: [],
          _id: `${i}`.padStart(5, '0'),
        };
      } else if (!pokemon[`${i}`].from) {
        pokemon[`${i}`].from = [];
      }

      if (!pokemon[evolvedFrom]) {
        pokemon[evolvedFrom] = {
          to: [],
          _id: `${evolvedFrom}`.padStart(5, '0'),
        };
      } else if (!pokemon[evolvedFrom].to) {
        pokemon[evolvedFrom].to = [];
      }

      const evolution = evolutionData[`${i}`];

      if (evolution) {
        const trigger = evolutionTriggers[evolution.evolution_trigger_id].identifier;

        pokemon[`${i}`].from.push({
          nationalId: parseInt(evolvedFrom, 10),
          name: speciesNames[evolvedFrom].name,
          method: trigger,
          level: evolution.minimum_level ? parseInt(evolution.minimum_level, 10) : undefined,
        });

        pokemon[evolvedFrom].to.push({
          nationalId: i,
          name: speciesNames[`${i}`].name,
          method: trigger,
          level: evolution.minimum_level ? parseInt(evolution.minimum_level, 10) : undefined,
        });
      }
    } else {

    }
  }


  for (let i = 1; i <= 802; i++) {
    if (pokemon[`${i}`]) {
      await db.put(pokemon[`${i}`]);
    }
  }

  var out = fs.createWriteStream('src/assets/evolutions.txt');
  var stream = shortRevs();
  await db.dump(stream);
  stream.pipe(out);
}

build().catch(console.log.bind(console));
