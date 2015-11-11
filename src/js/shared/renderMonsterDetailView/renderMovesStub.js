var getMonsterDarkTheme = require('../monster/getMonsterDarkTheme');
var h = require('virtual-dom/h');

module.exports = (monster) => {
  var darkColor = getMonsterDarkTheme(monster);
  return [
    h('h2.detail-subheader', {
      style: {background: darkColor}
    }, 'Moves'),
    h('div.monster-moves')
  ];
};