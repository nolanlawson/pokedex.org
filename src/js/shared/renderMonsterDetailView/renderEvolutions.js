var h = require('virtual-dom/h');
var getMonsterDarkTheme = require('../monster/getMonsterDarkTheme');

function renderEvolutionRows(monster) {
  if (!monster.evolutions.length) {
    return h('span', 'No evolutions');
  }
  return monster.evolutions.map(evolution => {
    var nationalId = evolution.resource_uri.match(/(\d+)\/$/)[1];
    return h(`div.evolution-sprite.monster-sprite.sprite-${nationalId}`)
  });
}

module.exports = function renderEvolutions(monster) {
  var darkColor = getMonsterDarkTheme(monster);
  return h('div.detail-evolutions', [
    h('h2.detail-subheader', {
      style: {
        background: darkColor
      }
    }, 'Evolutions'),
    renderEvolutionRows(monster)
  ])
};