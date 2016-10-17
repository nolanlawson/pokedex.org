import color from 'color';
import getMonsterPrimaryType from './getMonsterPrimaryType';
import typesToColors from './typesToColors';

var cached = {};

export default monster => {
  var primaryType = getMonsterPrimaryType(monster);

  if (!cached[primaryType]) {
    cached[primaryType] = color(typesToColors[primaryType]).darken(0.35).rgbString();
  }
  return cached[primaryType];
};