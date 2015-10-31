var color = require('color');
var typesToColors = require('./typesToColors');

module.exports = monster => {
  var primaryType = monster.types[1] || monster.types[0];
  return color(typesToColors[primaryType.name]).darken(0.35).rgbString();
};