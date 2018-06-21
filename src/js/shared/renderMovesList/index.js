var h = require('virtual-dom/h');
var typesToColors = require('../../shared/monster/typesToColors');
var color = require('color');
var capitalize = require('lodash/capitalize');

var sortByLevel = (a, b) => a.level < b.level ? -1 : 1;
var sortByName = (a, b) => a.identifier < b.identifier ? -1 : 1;

function renderMoves(moves) {
  return moves.map(move => {
    var regColor = typesToColors[move.type_name];
    var lightColor = color(regColor).lighten(0.4).rgbString();
    var darkColor = color(regColor).darken(0.1).rgbString();

    return h('div.moves-row', [
      h('div.moves-inner-row', [
        h('span', move.level ? move.level.toString() : ''),
        h('span', capitalize(move.name.replace('-', ' '))),
        h('span.monster-type', {
          style: {
            border: lightColor,
            backgroundColor: darkColor
          }
        }, move.type_name),
        h('button.dropdown-button', [
          h('span.dropdown-button-image')
        ])
      ]),
      h('div.moves-row-detail.hidden', [
        h('div.moves-row-stats', [
          h('span', [
            h('strong', 'Power:'),
            ` ${move.power || 'N/A'}`
          ]),
          h('span', [
            h('strong', 'Acc:'),
            ' ' + (typeof move.accuracy !== 'number' ? 'N/A' : `${move.accuracy}%`)
          ]),
          h('span', [
            h('strong', 'PP:'),
            ` ${move.pp}`
          ])
        ]),
        h('div.move-description', move.description)
      ])
    ]);
  });
}

module.exports = (monster, moves) => {

  var fontColor = color(typesToColors[monster.type]).darken(0.2).hexString();

  var levelUpMoves = moves.filter(m => m.learn_type === 'level-up').sort(sortByLevel);
  var machineMoves = moves.filter(m => m.learn_type === 'machine').sort(sortByName);
  var tutorMoves = moves.filter(m => m.learn_type === 'tutor').sort(sortByName);
  var eggMoves = moves.filter(m => m.learn_type === 'egg').sort(sortByName);

  var res = [];
  if (levelUpMoves.length) {
    res.push(h('h3.moves-subtitle', {
      style: {
        color: fontColor
      }
    }, 'Natural Moves'));
    res = res.concat(renderMoves(levelUpMoves));
  }

  if (machineMoves.length) {
    res.push(h('h3.moves-subtitle', {
      style: {
        color: fontColor
      }
    },  'Machine Moves'));
    res = res.concat(renderMoves(machineMoves));
  }

  if (tutorMoves.length) {
    res.push(h('h3.moves-subtitle', {
      style: {
        color: fontColor
      }
    },  'Tutor Moves'));
    res = res.concat(renderMoves(tutorMoves));
  }

  if (eggMoves.length) {
    res.push(h('h3.moves-subtitle', {
      style: {
        color: fontColor
      }
    },  'Egg Moves'));
    res = res.concat(renderMoves(eggMoves));
  }

  return h('div.monster-moves', res);
};
