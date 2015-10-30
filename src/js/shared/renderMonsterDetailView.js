var h = require('virtual-dom/h');

var getMonsterBackground = require('./getMonsterBackground');
var typesToColors = require('./typesToColors');
var color = require('color');

module.exports = monster => {

  var bgColor = getMonsterBackground(monster);
  var primaryType = monster.types[1] || monster.types[0];
  var darkColor = color(typesToColors[primaryType.name]).darken(0.35).rgbString();

  return h('div#detail-view', {
    style: {
      background: bgColor
    }
  }, [
    h('button.', {
      type: 'button',
      className: 'back-button detail-back-button'
    }),
    h('div.mui-panel.detail-panel', [
      h('div.detail-panel-header', {
        style: {
          background: darkColor
        }
      }, monster.name),
      h('div.detail-panel-content', [
        h(`div.detail-sprite.monster-sprite.sprite-${monster.national_id}`),
        'yo yo yo'
      ])
    ])
  ]);
};