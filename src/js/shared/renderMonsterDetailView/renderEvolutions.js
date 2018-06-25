var h = require('virtual-dom/h');
var getMonsterDarkTheme = require('../monster/getMonsterDarkTheme');
var getMonsterDisplayName = require('../monster/getMonsterDisplayName');

function renderArrow(color) {
  return h("svg", {
    style: {
      fill: color,
      stroke: color
    },
    "attributes": {
      "xmlns": "http://www.w3.org/2000/svg",
      "width": "48",
      "height": "48",
      "viewBox": "0 0 48 48"
    }, "namespace": "http://www.w3.org/2000/svg"
  }, [h("path", {
    "attributes": {"d": "M24 16V8l16 16-16 16v-8H8V16z"},
    "namespace": "http://www.w3.org/2000/svg"
  })]);
}

function renderLabel(evolution, sourceMonster, direction) {
  var method = evolution.method;
  var str;
  if (direction === 'from') {
    str = `${getMonsterDisplayName(evolution.name)} evolves into ${getMonsterDisplayName(sourceMonster.name)} `;
  } else {
    str = `${getMonsterDisplayName(sourceMonster.name)} evolves into ${getMonsterDisplayName(evolution.name)} `;
  }

  var bold;
  if (method === 'level-up') {
    bold = `at level ${evolution.level}`;
  } else if (method === 'use-item') {
    bold = `using a stone`;
  } else if (method === 'trade') {
    bold = `by trading`;
  } else if (method === 'other') {
    bold = 'when leveled up with high friendship';
  }

  return h('span', [str, h('strong', bold), '.']);
}

function renderEvolutionRows(monster, evolutions) {
  if (!evolutions) {
    return [h('span', `${monster.name} has no evolutions.`)];
  }

  var from = evolutions.from || [];
  var to = evolutions.to || [];

  var darkColor = getMonsterDarkTheme(monster);

  return from.map(evolution => {
    return h('div.evolution-row', [
      h('div.evolution-row-inner', [
        h(`div.evolution-sprite.monster-sprite.sprite-${evolution.nationalId}`),
        renderArrow(darkColor),
        h(`div.evolution-sprite.monster-sprite.sprite-${monster.national_id}`)
      ]),
      h('div.evolution-label', renderLabel(evolution, monster, 'from'))
    ]);
  }).concat(to.map(evolution => {
    return h('div.evolution-row', [
      h('div.evolution-row-inner', [
        h(`div.evolution-sprite.monster-sprite.sprite-${monster.national_id}`),
        renderArrow(darkColor),
        h(`div.evolution-sprite.monster-sprite.sprite-${evolution.nationalId}`)
      ]),
      h('div.evolution-label', renderLabel(evolution, monster, 'to'))
    ]);
  }));
}

module.exports = function renderEvolutions(monster, evolutions) {
  var darkColor = getMonsterDarkTheme(monster);
  return [
    h('h2.detail-subheader', {
      style: {background: darkColor}
    }, 'Evolutions'),
    h('div.evolutions', renderEvolutionRows(monster, evolutions))
  ];
};
