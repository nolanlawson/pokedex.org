import h from 'virtual-dom/h';
import getMonsterBackground from '../monster/getMonsterBackground';
import getMonsterDisplayName from '../monster/getMonsterDisplayName';

function renderMonster(monster) {
  return h('li', {
    style: {background: getMonsterBackground(monster)}
  }, [
    h(`button.monster-sprite.sprite-${monster.national_id}`, {
      type: 'button'
    }),
    h('span', getMonsterDisplayName(monster.name))
  ]);
}

function renderStub(monster) {
  return h('li', {
    style: {
      background: getMonsterBackground(monster)
    }
  });
}

function renderMonstersList (monsters, start, end) {
  var startingStubs = monsters.slice(0, start);
  var monstersToRender = monsters.slice(start, end);
  var endingStubs = monsters.slice(end);

  var listItems = startingStubs.map(renderStub)
    .concat(monstersToRender.map(renderMonster))
    .concat(endingStubs.map(renderStub));

  return h('ul', {id: 'monsters-list'}, listItems);
}

export default renderMonstersList;