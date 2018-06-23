var h = require('virtual-dom/h');

var getMonsterWeight = require('../monster/getMonsterWeight');
var getMonsterHeight = require('../monster/getMonsterHeight');
var getMonsterGenderRatio = require('../monster/getMonsterGenderRatio');
var getMonsterDarkTheme = require('../monster/getMonsterDarkTheme');

var EV_LABELS_AND_NAMES = [
  ['HP', 'hpEV'],
  ['Attack', 'attackEV'],
  ['Defense', 'defenseEV'],
  ['Speed', 'speedEV'],
  ['Sp Att', 'specialAttackEV'],
  ['Sp Def', 'specialDefenseEV']
];

function getEVsYield(supplemental) {
  var res = [];
  EV_LABELS_AND_NAMES.forEach(arr => {
    var [label, name] = arr;
    var count = supplemental[name];
    if (count > 0) {
      res.push(`${count} ${label}`);
    }
  });
  return res.join(', ');
}

module.exports = (monster, supplemental) => {
  var darkColor = getMonsterDarkTheme(monster);
  return [
    h('h2.detail-subheader', {
      style: { background: darkColor}
    }, 'Profile'),
    h('div.monster-minutia', [
      h('strong', 'Height:'),
      h('span', getMonsterHeight(monster)),
      h('strong', 'Weight:'),
      h('span', getMonsterWeight(monster))
    ]),
    h('div.monster-minutia', [
      h('strong', 'Catch Rate:'),
      h('span', `${monster.catch_rate}%`),
      h('strong', 'Gender Ratio:'),
      h('span', getMonsterGenderRatio(supplemental))
    ]),
    h('div.monster-minutia', [
      h('strong', 'Egg Groups:'),
      h('span', supplemental.eggGroups),
      h('strong', 'Hatch Steps:'),
      h('span', `${supplemental.hatchSteps}`)
    ]),
    h('div.monster-minutia', [
      h('strong', 'Abilities:'),
      h('span', monster.abilities.join(', ')),
      h('strong', 'EVs:'),
      h('span', getEVsYield(supplemental))
    ])
  ];
};
