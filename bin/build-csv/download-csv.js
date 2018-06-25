const fetch = require('node-fetch');
const mkdirp = require('mkdirp');
const fs = require('fs');

(function getCSV() {
  // create the CSV directory
  mkdirp('csv');
  // download relevant CSV files
  const csv_base_URL = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/';
  const files = [
    'ability_names.csv',
    'types.csv',
    'type_efficacy.csv',
    'stats.csv',
    'moves.csv',
    'move_names.csv',
    'move_flavor_text.csv',
    'egg_group_prose.csv',
    'growth_rate_prose.csv',
    'move_names.csv',
    'evolution_triggers.csv',
    'pokemon_egg_groups.csv',
    'pokemon_abilities.csv',
    'pokemon_evolution.csv',
    'pokemon_moves.csv',
    'pokemon_move_methods.csv',
    'pokemon.csv',
    'pokemon_stats.csv',
    'pokemon_types.csv',
    'pokemon_species.csv',
    'pokemon_species_names.csv',
    'pokemon_species_flavor_text.csv',
  ];

  for (let i = 0; i < files.length; i++) {
    fetch(`${csv_base_URL}${files[i]}`)
      .then(res => res.body.pipe(fs.createWriteStream(`csv/${files[i]}`)))
      .catch(console.log.bind(console));
  }
})();
