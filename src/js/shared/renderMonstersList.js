var h = require('virtual-dom/h');

module.exports = monsters => {
  return h('ul', {id: 'monsters-list'}, monsters.map(monster =>
    h('li.monster-item', [
      h('div.monster-item-bg1.type-' + (monster.types[1] || monster.types[0]).name),
      h('div.monster-item-bg2.type-' + monster.types[0].name),
      h('div.monster-item-sprite', {
        style: {
          'background-image': 'url(/img/sprites/' + monster.national_id + '.png' + ')'
        }
      }),
      h('span.monster-item-title', monster.name)
    ])
  ));
};