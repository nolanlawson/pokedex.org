var h = require('virtual-dom/h');
// this operation seems to be expensive, so use lodash
var map = require('lodash/collection/map');

var getMonsterBackground = require('../monster/getMonsterBackground');
var getMonsterDisplayName = require('../monster/getMonsterDisplayName');

module.exports = (monsters, pageSize) => {
  monsters = monsters.slice(0, pageSize);
  return h('ul', {id: 'monsters-list'}, map(monsters, monster =>
    h('li', {
      style: {background: getMonsterBackground(monster)}
    }, [
      h(`div.monster-sprite.sprite-${monster.national_id}`, {
        attributes: {
          'data-national-id': monster.national_id
        },
        type: 'button'
      }),
      h('span', getMonsterDisplayName(monster))
    ])
  ));
};