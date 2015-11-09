var h = require('virtual-dom/h');
var getMonsterDarkTheme = require('../monster/getMonsterDarkTheme');

function renderEvolutionRows(evolutions) {
  var from = evolutions.from || [];
  var to = evolutions.to || [];

  if (!to.length && !from.length) {
    return h('span', 'No evolutions');
  }

  return from.map(evolution => {
    return h(`div.evolution-sprite.monster-sprite.sprite-${evolution.nationalId}`);
  }).concat(to.map(evolution => {
    return h(`div.evolution-sprite.monster-sprite.sprite-${evolution.nationalId}`);
  }));
}

module.exports = function renderEvolutions(monster, evolutions) {
  var darkColor = getMonsterDarkTheme(monster);
  return h('div.detail-evolutions', [
    h('h2.detail-subheader', {
      style: {
        background: darkColor
      }
    }, 'Evolutions'),
    renderEvolutionRows(evolutions)
  ]);
};