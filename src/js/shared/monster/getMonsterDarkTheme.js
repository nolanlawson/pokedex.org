var color = require('color');
var getMonsterPrimaryType = require('./getMonsterPrimaryType');
var typesToColors = require('./typesToColors');

var cached = {};

module.exports = monster => {
  var primaryType = getMonsterPrimaryType(monster);

  if (!cached[primaryType]) {
    cached[primaryType] = color(typesToColors[primaryType]).darken(0.35).rgbString();
  }
  return cached[primaryType];
};