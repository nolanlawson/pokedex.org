var color = require('color');
var getMonsterPrimaryType = require('./getMonsterPrimaryType');
var typesToColors = require('./typesToColors');

module.exports = monster => {
  var primaryType = getMonsterPrimaryType(monster);
  return color(typesToColors[primaryType]).darken(0.35).rgbString();
};