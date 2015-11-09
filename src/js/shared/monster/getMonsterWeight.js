module.exports = monster => {
  var asInt = parseInt(monster.weight, 10);
  return `${asInt / 10} kg`;
};