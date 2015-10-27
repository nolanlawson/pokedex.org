var h = require('virtual-dom/h');
// this operation seems to be expensive, so use lodash
var map = require('lodash/collection/map');

var typesToColors = {
  normal: '#A8A878',
  fire: '#F08030',
  fighting: '#C03028',
  water: '#6890F0',
  grass: '#78C850',
  poison: '#A040A0',
  electric: '#F8D030',
  ground: '#E0C068',
  rock: '#B8A038',
  bug: '#A8B820',
  dragon: '#7038F8',
  ghost: '#705898',
  dark: '#705848',
  fairy: '#EE99AC',
  steel: '#B8B8D0',
  psychic: '#F85888',
  ice: '#98D8D8',
  flying: '#A890F0'
};

function getBackground(monster) {
  var types = monster.types;
  if (types.length === 1) {
    return typesToColors[types[0].name];
  }
  var color1 = typesToColors[types[1].name];
  var color2 = typesToColors[types[0].name];
  return `linear-gradient(90deg, ${color1} 50%, ${color2} 50%)`;
}

module.exports = monsters => {
  return h('ul', {id: 'monsters-list'}, map(monsters, monster =>
    h('li', {style: {background: getBackground(monster)}}, [
      h(`div.sprite-${monster.national_id}`),
      h('span', monster.name)
    ])
  ));
};