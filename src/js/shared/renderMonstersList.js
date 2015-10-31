var h = require('virtual-dom/h');
// this operation seems to be expensive, so use lodash
var map = require('lodash/collection/map');

var getMonsterBackground = require('./getMonsterBackground');
var getMonsterDisplayName = require('./getMonsterDisplayName');

module.exports = monsters => {
  return h('ul', {id: 'monsters-list'}, map(monsters, monster =>
    h('li', {
      style: {background: getMonsterBackground(monster)}
    }, [
      h(`button.monster-sprite.mui-btn.mui-btn--flat.mui-btn--accent.sprite-${monster.national_id}`, {
        attributes: {
          'data-national-id': monster.national_id
        },
        type: 'button'
      }),
      h('span', getMonsterDisplayName(monster))
    ])
  ));
};