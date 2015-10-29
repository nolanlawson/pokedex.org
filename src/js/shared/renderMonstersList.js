var h = require('virtual-dom/h');
// this operation seems to be expensive, so use lodash
var map = require('lodash/collection/map');

var getMonsterBackground = require('./getMonsterBackground');

module.exports = monsters => {
  return h('ul', {id: 'monsters-list'}, map(monsters, monster =>
    h('li', {
      style: {background: getMonsterBackground(monster)}
    }, [
      h(`div.sprite-${monster.national_id}`),
      h('span', monster.name)
    ])
  ));
};