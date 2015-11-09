module.exports = monster => {
  var asInt = parseInt(monster.height, 10);
  return `${asInt / 10} m`;
};