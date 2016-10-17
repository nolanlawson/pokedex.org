var h = require('virtual-dom/h');
var getMonsterDarkTheme = require('../../shared/monster/getMonsterDarkTheme');
var typesToColors = require('../monster/typesToColors');
var color = require('color');

function renderEmptyTypeLabel() {
  return h('span.monster-type', {
    style: {
      background: 'none',
      border: 'none'
    }
  });
}

function renderEmptyMultiplier() {
  return h('span.monster-multiplier', {
    style: {
      background: 'none',
      border: 'none'
    }
  });
}

function renderTypeLabel(type) {
  var regColor = typesToColors[type.name];
  var lightColor = color(regColor).lighten(0.4).rgbString();
  var darkColor = color(regColor).darken(0.1).rgbString();

  return h(`span.monster-type`, {
    style: {
      border: `1px solid ${lightColor}`,
      background: darkColor
    }
  }, type.name);
}

function renderMultiplier(multiplier) {

  var theColor;
  if (multiplier === 0.25) {
    theColor = 'rgb(20, 75, 204)';
  } else if (multiplier === 0.5) {
    theColor = 'rgb(69, 120, 237)';
  } else if (multiplier === 2) {
    theColor = 'rgb(237, 109, 18)';
  } else if (multiplier === 4) {
    theColor = 'rgb(171, 79, 13)';
  } else {
    theColor = 'black';
  }

  return h('span.monster-multiplier', {
    style: {
      color: theColor
    }
  }, `${multiplier}x`);
}

function renderResistances(types) {
  var multipliers = {};
  types.forEach(type => {
    if (!type.whenDefending) {
      return;
    }
    type.whenDefending.forEach(otherType => {
      var resistance = multipliers[otherType.name] || 1;
      resistance *= otherType.multiplier;
      multipliers[otherType.name] = resistance;
    });
  });

  var typesAndMultipliers = Object.keys(multipliers).map(typeName => {
    return {
      name: typeName,
      multiplier: multipliers[typeName]
    };
  }).sort((a, b) => {
    if (a.multiplier !== b.multiplier) {
      return a.multiplier < b.multiplier ? 1 : -1;
    }
    return a.typeName < b.typeName ? -1 : 1;
  });

  var positives = typesAndMultipliers.filter(type => type.multiplier > 1);
  var negatives = typesAndMultipliers.filter(type => type.multiplier < 1);

  var rows = [];
  for (var i = 0; i < Math.max(positives.length, negatives.length); i++) {
    var positive = positives[i];
    var negative = negatives[i];

    var children = [];
    if (positive) {
      children.push(renderTypeLabel(positive));
      children.push(renderMultiplier(positive.multiplier));
    } else {
      children.push(renderEmptyTypeLabel());
      children.push(renderEmptyMultiplier());
    }

    if (negative) {
      children.push(renderTypeLabel(negative));
      children.push(renderMultiplier(negative.multiplier));
    } else {
      children.push(renderEmptyTypeLabel());
      children.push(renderEmptyMultiplier());
    }
    rows.push(h('div.when-attacked-row', children));
  }

  return rows;
}

module.exports = (monster, types) => {
  var darkColor = getMonsterDarkTheme(monster);
  return [
    h('h2.detail-subheader', {
      style: { background: darkColor}
    }, 'Damage When Attacked'),
    h('div.when-attacked', renderResistances(types))
  ];
};