#!/usr/bin/env node

require('regenerator-runtime/runtime');

var PouchDB = require('pouchdb');
var repStream = require('pouchdb-replication-stream');
PouchDB.plugin(repStream.plugin);
PouchDB.adapter('writableStream', repStream.adapters.writableStream);
var memdown = require('memdown');
var db = new PouchDB('inmem', {db: memdown});
var fs = require('fs');
var shortRevs = require('short-revs');
const csvParse = require('csv-parse');

async function loadCSVObject(filepath, uniqueKey, filter) {
  const parser = csvParse({columns: true});
  const result = {};
  parser.on('readable', function() {
    while (record = parser.read()) {
      if (!filter || filter(record)) {
        result[record[uniqueKey]] = record;
      }
    }
  });

  fs.createReadStream(filepath).pipe(parser);
  return new Promise(function(resolve, reject) {
    parser.on('end', ()=>resolve(result));
    parser.on('error', reject);
  });
}

async function loadCSVArray(filepath, filter) {
  const parser = csvParse({columns: true});
  const result = [];
  parser.on('readable', function() {
    while (record = parser.read()) {
      if (!filter || filter(record)) {
        result.push(record);
      }
    }
  });

  fs.createReadStream(filepath).pipe(parser);
  return new Promise(function(resolve, reject) {
    parser.on('end', ()=>resolve(result));
    parser.on('error', reject);
  });
}

async function assignStats(pokemon) {
  const statIds = await loadCSVObject('csv/stats.csv', 'id');
  const statArr = await loadCSVArray('csv/pokemon_stats.csv');

  // temporary workaround for spatk and spdef
  statIds['4']['identifier'] = 'sp_atk';
  statIds['5']['identifier'] = 'sp_def';

  statArr.forEach(row => {
    const pkmnId = row['pokemon_id'];

    if (pokemon[pkmnId]) {
      const statName = statIds[row['stat_id']]['identifier'];
      pokemon[pkmnId][statName] = parseInt(row['base_stat'], 10);
    }
  });
}

async function assignTypes(pokemon) {
  const typeIds = await loadCSVObject('csv/types.csv', 'id');
  const typeArr = await loadCSVArray('csv/pokemon_types.csv');

  typeArr.forEach(row => {
    const pkmnId = row['pokemon_id'];

    if (pokemon[pkmnId]) {
      const typeName = typeIds[row['type_id']]['identifier'];
      if (!pokemon[pkmnId].types) {
        pokemon[pkmnId].types = [];
      }
      pokemon[pkmnId].types.push({
        name: typeName,
      });
    }
  });
}

async function assignMoves(pokemon) {
  const moveNames = await loadCSVObject('csv/move_names.csv', 'move_id', record => record['local_language_id'] === '9');
  const moveMethods = await loadCSVObject('csv/pokemon_move_methods.csv', 'id');
  const moveArr = await loadCSVArray('csv/pokemon_moves.csv', record => record['version_group_id'] === '17');

  moveArr.forEach(row => {
    const pkmnId = row['pokemon_id'];

    if (pokemon[pkmnId]) {
      const moveName = moveNames[row['move_id']]['name'];
      const moveMethod = moveMethods[row['pokemon_move_method_id']]['identifier'];

      if (!pokemon[pkmnId].moves) {
        pokemon[pkmnId].moves = [];
      }
      pokemon[pkmnId].moves.push({
        name: moveName,
        learn_type: moveMethod,
      });
    }
  });
}

async function assignAbilities(pokemon) {
  const abilityName = await loadCSVObject('csv/ability_names.csv', 'ability_id', row => row['local_language_id'] === '9');
  const abilityArr = await loadCSVArray('csv/pokemon_abilities.csv');

  abilityArr.forEach(row => {
    const pkmnId = row['pokemon_id'];
    if (pokemon[pkmnId]) {
      if (!pokemon[pkmnId].abilities) {
        pokemon[pkmnId].abilities = [];
      }
      pokemon[pkmnId].abilities.push({
        name: abilityName[row['ability_id']]['name'],
      });
    }
  });
}

async function assignEggGroups(pokemon) {
  const eggGroupNames = await loadCSVObject('csv/egg_group_prose.csv', 'egg_group_id', row => row['local_language_id'] === '9');
  const pokemonEggGroups = await loadCSVArray('csv/pokemon_egg_groups.csv');

  pokemonEggGroups.forEach(row => {
    const pkmnId = row['species_id'];
    if (pokemon[pkmnId]) {
      if (!pokemon[pkmnId].egg_groups) {
        pokemon[pkmnId].egg_groups = [];
      }
      pokemon[pkmnId].egg_groups.push({
        name: eggGroupNames[row['egg_group_id']]['name'],
      });
    }
  });
}

async function assignSpeciesData(pokemon) {
  const speciesArr = await loadCSVArray('csv/pokemon_species.csv');

  const growthRateNames = await loadCSVObject('csv/growth_rate_prose.csv', 'growth_rate_id', row => row.local_language_id === '9');
  const pokemonNames = await loadCSVObject('csv/pokemon_species_names.csv', 'pokemon_species_id', row => row.local_language_id === '9');

  speciesArr.forEach(row => {
    const pkmnId = row.id;
    if (pokemon[pkmnId]) {
      pokemon[pkmnId].growth_rate = growthRateNames[row.growth_rate_id].name;
      pokemon[pkmnId].happiness = parseInt(row.base_happiness, 10);
      pokemon[pkmnId].catch_rate = parseInt(row.capture_rate, 10);
      pokemon[pkmnId].name = pokemonNames[pkmnId].name;
      // male/female ratio
      const chanceFemale = parseInt(row['gender_rate']) * 12.5;
      pokemon[pkmnId].male_female_ratio = `${100 - chanceFemale}/${chanceFemale}`;
    }
  });
}

// async function assignEvolutions(pokemon) {
//   const evoTriggers = await loadCSVObject('csv/evolution_triggers.csv', 'id');
//   const pokemonEvolutions = await loadCSVArray('csv/pokemon_evolution.csv');
//   const pokemonNames = await loadCSVObject('csv/pokemon_species_names.csv', 'pokemon_species_id', row => row.local_language_id === '9');
//
// pokemonEvolutions.forEach(row => {
//   const pkmnId = row['id'];
//   if (pokemon[pkmnId]) {
//     if (!pokemon[pkmnId].evolutions) {
//       pokemon[pkmnId].evolutions = [];
//     }
//
//     const evolution = {
//       to: pokemonNames[row.evolved_species_id].name,
//       method: evoTriggers[row.evolution_trigger_id].identifier,
//       level: parseInt(row.minimum_level, 10),
//     };
//
//     pokemon[pkmnId].evolutions.push(evolution);
//   }
// });
// }

async function build() {
  const monsters = await loadCSVObject('csv/pokemon.csv', 'id');
  const monsterArray = Object.values(monsters);

  await assignStats(monsters);
  await assignTypes(monsters);
  await assignMoves(monsters);
  await assignAbilities(monsters);
  await assignEggGroups(monsters);
  await assignSpeciesData(monsters);
  // await assignEvolutions(monsters);

  for (let i = 0; i < monsterArray.length; i++) {
    const m = monsterArray[i];
    m._id = m.id.padStart(5, '0');
    m.national_id = m.id;
    m.pkdx_id = m.id;
    await db.put(m);
  }

  var out = fs.createWriteStream('src/assets/monsters.txt');
  var stream = shortRevs();
  await db.dump(stream);
  stream.pipe(out);
}

build().catch(console.log.bind(console));
