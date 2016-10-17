import getMonsterDarkTheme from '../monster/getMonsterDarkTheme';
import h from 'virtual-dom/h';

export default (monster) => {
  var darkColor = getMonsterDarkTheme(monster);
  return [
    h('h2.detail-subheader', {
      style: {background: darkColor}
    }, 'Moves'),
    h('div.monster-moves')
  ];
};