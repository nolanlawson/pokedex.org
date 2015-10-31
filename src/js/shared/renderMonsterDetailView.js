var h = require('virtual-dom/h');

var getMonsterBackground = require('./getMonsterBackground');
var getMonsterDarkTheme = require('./getMonsterDarkTheme');
var typesToColors = require('./typesToColors');
var color = require('color');

module.exports = monster => {

  var bgColor = getMonsterBackground(monster);
  var darkColor = getMonsterDarkTheme(monster);

  return h('div#detail-view', [
    h('div.detail-view-bg', {
      style: {
        background: bgColor
      }
    }),
    h('div.detail-view-fg', [
      h('button.back-button.detail-back-button.hover-shadow', {
        type: 'button'
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
    ])
  ]);
};