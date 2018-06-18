const fetch = require('node-fetch');
const mkdirp = require('mkdirp');
const fs = require('fs');

(function getCSV() {
  // create the CSV directory
  mkdirp('csv');
  // download relevant CSV files
  const csv_base_URL = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/';
  const files = [
    'types.csv',
    'pokemon_moves.csv',
    'pokemon.csv',
  ];

  for (let i = 0; i < files.length; i++) {
    fetch(`${csv_base_URL}${files[i]}`)
      .then(res => res.body.pipe(fs.createWriteStream(`csv/${files[i]}`)))
      .catch(console.log.bind(console));
  }
})();
