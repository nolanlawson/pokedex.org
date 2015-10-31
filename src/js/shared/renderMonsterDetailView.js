var h = require('virtual-dom/h');

var getMonsterBackground = require('./getMonsterBackground');
var getMonsterDarkTheme = require('./getMonsterDarkTheme');
var getMonsterLightTheme = require('./getMonsterLightTheme');
var getMonsterPrimaryType = require('./getMonsterPrimaryType');
var typesToColors = require('./typesToColors');
var color = require('color');

function renderTypeLabels(monster) {
  return monster.types.map(type => {
    var regColor = typesToColors[type.name];
    var lightColor = color(regColor).lighten(0.4).rgbString();
    var darkColor = color(regColor).darken(0.1).rgbString();

    return h(`span.monster-type`, {
      style: {
        border: `1px solid ${lightColor}`,
        background: darkColor
      }
    }, type.name)
  }).reverse();
}

function renderDetailPanel(monster) {
  var darkColor = getMonsterDarkTheme(monster);
  var typeLabels = renderTypeLabels(monster);

  return h('div.mui-panel.detail-panel', [
    h('div.detail-panel-header', {
      style: {
        background: darkColor
      }
    }, monster.name),
    h('div.detail-panel-content', [
      h(`div.detail-sprite.monster-sprite.sprite-${monster.national_id}`),
      ...typeLabels
    ])
  ]);
}

module.exports = monster => {

  var bgColor = getMonsterBackground(monster);

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
      renderDetailPanel(monster)
    ])
  ]);
};