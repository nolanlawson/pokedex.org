var h = require('virtual-dom/h');

var getMonsterBackground = require('./getMonsterBackground');
var typesToColors = require('./typesToColors');
var color = require('color');

module.exports = monster => {

  var bgColor = getMonsterBackground(monster);
  var darkColor = color(typesToColors[monster.types[1].name]).darken(0.35).rgbString();

  return h('div#detail-view', {
    style: {
      background: bgColor
    }
  },[
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
          h(`div.detail-sprite.sprite-${monster.national_id}`),
          'yo yo yo'
        ])
      ])
    ]);
};