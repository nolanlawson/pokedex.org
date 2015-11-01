var h = require('virtual-dom/h');

var getMonsterBackground = require('../monster/getMonsterBackground');
var getMonsterDarkTheme = require('../monster/getMonsterDarkTheme');
var getMonsterDisplayName = require('../monster/getMonsterDisplayName');
var renderStats = require('./renderStats');
var renderTypeLabels = require('./renderTypeLabels');

function renderDetailPanel(monster, description) {
  var darkColor = getMonsterDarkTheme(monster);
  var typeLabels = renderTypeLabels(monster);
  var stats = renderStats(monster);

  return h('div.mui-panel.detail-panel', [
    h('div.detail-panel-header', {
      style: {
        background: darkColor
      }
    }, getMonsterDisplayName(monster)),
    h('div.detail-panel-content', [
      h(`div.detail-header`, [
        h(`div.detail-sprite.monster-sprite.sprite-${monster.national_id}`),
        h(`div.detail-infobox`, [
          h('div.detail-types-and-num', [
            h('div.detail-types', typeLabels),
            h('div.detail-national-id', [
              h('span', '#' + monster.national_id)
            ])
          ]),
          h('div.detail-stats', stats)
        ])
      ]),
      h(`div.detail-below-header`, [
        h('div.monster-description', description.description)
      ])
    ])
  ]);
}

module.exports = monsterData => {

  var {monster, description} = monsterData;

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
      renderDetailPanel(monster, description)
    ])
  ]);
};