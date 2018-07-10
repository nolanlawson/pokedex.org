const PouchDB = require('pouchdb');
const repStream = require('pouchdb-replication-stream');
PouchDB.plugin(repStream.plugin);
PouchDB.adapter('writableStream', repStream.adapters.writableStream);
const memdown = require('memdown');
const fs = require('fs');
const db = new PouchDB('inmem2', { db: memdown });
const loadCSV = require('./csv-load.js');
const shortRevs = require('short-revs');
const pick = require('lodash/pick');

async function assignStats(pokemon) {
  const statIds = await loadCSV.object('csv/stats.csv', 'id');
  const statArr = await loadCSV.array('csv/pokemon_stats.csv');

  statArr.forEach(row => {
    const pkmnId = row.pokemon_id;

    if (pokemon[pkmnId]) {
      const statName = statIds[row.stat_id].identifier;
      pokemon[pkmnId][statName] = parseInt(row.base_stat, 10);
    }
  });
}

async function assignTypes(pokemon) {
  const typeIds = await loadCSV.object('csv/types.csv', 'id');
  const typeArr = await loadCSV.array('csv/pokemon_types.csv');

  typeArr.forEach(row => {
    const pkmnId = row.pokemon_id;

    if (pokemon[pkmnId]) {
      const typeName = typeIds[row.type_id].identifier;
      if (!pokemon[pkmnId].types) {
        pokemon[pkmnId].types = [];
      }
      pokemon[pkmnId].types.push({
        name: typeName,
      });
    }
  });
}

async function assignSpeciesData(pokemon) {
  const speciesArr = await loadCSV.array('csv/pokemon_species.csv');

  const pokemonNames = await loadCSV.object('csv/pokemon_species_names.csv', 'pokemon_species_id', row => row.local_language_id === '9');

  speciesArr.forEach(row => {
    const pkmnId = row.id;
    if (pokemon[pkmnId]) {
      pokemon[pkmnId].catch_rate = parseInt(row.capture_rate, 10);
      pokemon[pkmnId].name = pokemonNames[pkmnId].name;
    }
  });
}

async function assignAbilities(pokemon) {
  const abilityName = await loadCSV.object('csv/ability_names.csv', 'ability_id', row => row['local_language_id'] === '9');
  const abilityArr = await loadCSV.array('csv/pokemon_abilities.csv');

  abilityArr.forEach(row => {
    const pkmnId = row.pokemon_id;
    if (pokemon[pkmnId]) {
      if (!pokemon[pkmnId].abilities) {
        pokemon[pkmnId].abilities = [];
      }
      pokemon[pkmnId].abilities.push(abilityName[row.ability_id].name);
    }
  });
}

async function build() {
  const pokemon = await loadCSV.object('csv/pokemon.csv', 'id');

  await assignSpeciesData(pokemon);
  await assignTypes(pokemon);
  await assignStats(pokemon);
  await assignAbilities(pokemon);

  for (let i = 1; i <= 802; i++) {
    pokemon[`${i}`].national_id = i;
    pokemon[`${i}`]._id = `${i}`.padStart(5, '0');
    await db.put(pick(pokemon[`${i}`], '_id',
      'types', 'attack', 'defense', 'speed', 'special-attack', 'special-defense', 'hp',
      'weight', 'height', 'national_id', 'name', 'male_female_ratio',
      'abilities', 'catch_rate'));
  }

  const out = fs.createWriteStream('src/assets/skim-monsters.txt');
  const stream = shortRevs();
  await db.dump(stream);
  stream.pipe(out);
}

build().catch(console.log.bind(console));
