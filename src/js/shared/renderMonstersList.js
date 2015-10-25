var h = require('virtual-dom/h');

module.exports = monsters => {
  return h('div', {id: 'monsters-list'}, monsters.map(monster =>
    h('div', [h('span', monster.name)])
  ));
};