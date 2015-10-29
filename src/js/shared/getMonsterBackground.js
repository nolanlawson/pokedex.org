var typesToColors = require('./typesToColors');

module.exports = monster => {
  var types = monster.types;
  if (types.length === 1) {
    return typesToColors[types[0].name];
  }
  var color1 = typesToColors[types[1].name];
  var color2 = typesToColors[types[0].name];
  return `linear-gradient(90deg, ${color1} 50%, ${color2} 50%)`;
};