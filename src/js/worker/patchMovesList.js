var renderMovesList = require('../shared/renderMovesList');
var databaseService = require('./databaseService');
var h = require('virtual-dom/h');
var diff = require('virtual-dom/diff');

var lastMovesList = h('div.monster-moves');

module.exports = async nationalId => {
  var monsterSummary = databaseService.getMonsterSummaryById(nationalId);
  var moves = await databaseService.getMonsterMovesById(nationalId);
  var newMovesList = renderMovesList(monsterSummary, moves);

  var patch = diff(lastMovesList, newMovesList);

  lastMovesList = newMovesList;

  return {patch};
};