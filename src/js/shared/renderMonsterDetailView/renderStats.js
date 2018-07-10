var getMonsterPrimaryType = require('../monster/getMonsterPrimaryType');
var typesToColors = require('../monster/typesToColors');
var h = require('virtual-dom/h');
var color = require('color');

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
    ['special-attack', 'Sp Atk'],
    ['special-defense', 'Sp Def']
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

module.exports = renderStats;
