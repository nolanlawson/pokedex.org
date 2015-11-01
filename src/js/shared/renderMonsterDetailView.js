var h = require('virtual-dom/h');

var getMonsterBackground = require('./getMonsterBackground');
var getMonsterDarkTheme = require('./getMonsterDarkTheme');
var getMonsterPrimaryType = require('./getMonsterPrimaryType');
var getMonsterDisplayName = require('./getMonsterDisplayName');
var typesToColors = require('./typesToColors');
var color = require('color');

function renderTypeLabels(monster) {
  return monster.types.map(type => {
    var regColor = typesToColors[type.name];
    var lightColor = color(regColor).lighten(0.4).rgbString();
    var darkColor = color(regColor).darken(0.1).rgbString();

    return h(`span.monster-type`, {
      style: {
        border: `1px solid ${lightColor}`,
        background: darkColor
      }
    }, type.name);
  }).reverse();
}

// Smooth a value using an exponential graph that opens downward,
// intersects 0,0 and intersects max,max.
function smoothExponentially(value, max) {
  // function will be y = a * (x - max)^2 + max; just need to figure out what a is, such that it intercepts 0,0
  // if you solve for a when y is 0 and x is 0, you get (-m / (m^2)) = a
  var a = -max / Math.pow(max, 2);
  return a * Math.pow(value - max, 2) + max;
}

function getStatDisplayRatio(statValue) {
  var maxStat = 255; // verified by grepping
  var smoothedValue = smoothExponentially(statValue, maxStat);
  return smoothedValue / maxStat;
}

function renderStats(monster) {
  var regColor = typesToColors[getMonsterPrimaryType(monster)];
  var barColor = color(regColor).darken(0.1).rgbString();

  var stats = [
    ['hp', 'HP'],
    ['attack', 'Attack'],
    ['defense', 'Defense'],
    ['speed', 'Speed'],
    ['sp_atk', 'Sp Atk'],
    ['sp_def', 'Sp Def']
  ];

  return stats.map(stat => {
    var [statLookupName, statName] = stat;
    var statValue = monster[statLookupName];
    var ratio = getStatDisplayRatio(statValue);
    // avoid the font being white on a white background
    var fontColor = statValue < 20 ? '#333' : '#fff';
    return h('div.detail-stats-row', [
      h('span', statName),
      h('span.stat-bar', [
        h('div.stat-bar-bg', {
          style: {
            background: barColor,
            transform: `scaleX(${ratio})`
          }
        }),
        h('div.stat-bar-fg', {
          style: {
            color: fontColor
          }
        }, monster[statLookupName].toString())
      ])
    ]);
  });
}

function renderDetailPanel(monster, description) {
  var darkColor = getMonsterDarkTheme(monster);
  var typeLabels = renderTypeLabels(monster);
  var stats = renderStats(monster);

  return h('div.mui-panel.detail-panel', [
    h('div.detail-panel-header', {
      style: {
        background: darkColor
      }
    }, getMonsterDisplayName(monster)),
    h('div.detail-panel-content', [
      h(`div.detail-header`, [
        h(`div.detail-sprite.monster-sprite.sprite-${monster.national_id}`),
        h(`div.detail-infobox`, [
          h('div.detail-types-and-num', [
            h('div.detail-types', typeLabels),
            h('div.detail-national-id', [
              h('span', '#' + monster.national_id)
            ])
          ]),
          h('div.detail-stats', stats)
        ])
      ]),
      h(`div.detail-below-header`, [
        h('div.monster-description', description.description)
      ])
    ])
  ]);
}

module.exports = monsterData => {

  var {monster, description} = monsterData;

  var bgColor = getMonsterBackground(monster);

  return h('div#detail-view', [
    h('div.detail-view-bg', {
      style: {
        background: bgColor
      }
    }),
    h('div.detail-view-fg', [
      h('button.back-button.detail-back-button.hover-shadow', {
        type: 'button'
      }),
      renderDetailPanel(monster, description)
    ])
  ]);
};