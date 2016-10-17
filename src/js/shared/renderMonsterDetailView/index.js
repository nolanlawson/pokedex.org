import h from 'virtual-dom/h';
import getMonsterBackground from '../monster/getMonsterBackground';
import getMonsterDarkTheme from '../monster/getMonsterDarkTheme';
import getMonsterDisplayName from '../monster/getMonsterDisplayName';
import renderStats from './renderStats';
import renderTypeLabels from './renderTypeLabels';
import renderEvolutions from './renderEvolutions';
import renderMinutia from './renderMinutia';
import renderDamageWhenAttacked from './renderDamageWhenAttacked';
import renderMovesStub from './renderMovesStub';
import renderSpinner from './renderSpinner';

function renderDetailPanel(fullMonsterData) {
  var {monster, description, types, evolutions, supplemental} = fullMonsterData;
  var darkColor = getMonsterDarkTheme(monster);
  var typeLabels = renderTypeLabels(monster);
  var stats = renderStats(monster);

  return h('div.mui-panel.detail-panel', [
    h('h1.detail-panel-header', {
      style: {
        background: darkColor
      }
    }, getMonsterDisplayName(monster.name)),
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
        h('div.monster-species', supplemental.species),
        h('div.monster-description', description.description),
        renderMinutia(monster, supplemental),
        renderDamageWhenAttacked(monster, types),
        renderEvolutions(monster, evolutions),
        renderMovesStub(monster)
      ])
    ])
  ]);
}

export default monsterData => {
  return h('div#detail-view', [
    h('div.detail-view-bg', {
      style: {
        background: getMonsterBackground(monsterData.monster)
      }
    }, [renderSpinner()]),
    h('div.detail-view-fg', [
      h('button.back-button.detail-back-button.hover-shadow', {
        type: 'button'
      }),
      renderDetailPanel(monsterData)
    ])
  ]);
};