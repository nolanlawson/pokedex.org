var typesToColors = require('../monster/typesToColors');
var color = require('color');
var h = require('virtual-dom/h');

module.exports = function renderTypeLabels(monster) {
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
};