import typesToColors from '../monster/typesToColors';
import color from 'color';
import h from 'virtual-dom/h';

export default function renderTypeLabels(monster) {
  return monster.types.map(type => {
    var regColor = typesToColors[type.name];
    var lightColor = color(regColor).lighten(0.4).rgbString();
    var darkColor = color(regColor).darken(0.1).rgbString();

    return h(`span.monster-type`, {
      style: {
        border: `1px solid ${lightColor}`,
        background: darkColor
      }
    }, type.name);
  }).reverse();
};