var renderMovesList = require('../shared/renderMovesList');
var databaseService = require('./databaseService');
var h = require('virtual-dom/h');
var diff = require('virtual-dom/diff');
var Stopwatch = require('../shared/util/stopwatch');

var lastMovesList = h('div.monster-moves');

module.exports = async nationalId => {
  var stopwatch = new Stopwatch();
  var monsterSummary = databaseService.getMonsterSummaryById(nationalId);
  var moves = await databaseService.getMonsterMovesById(nationalId);
  stopwatch.time('Fetching monster moves');
  var newMovesList = renderMovesList(monsterSummary, moves);

  var patch = diff(lastMovesList, newMovesList);
  stopwatch.time('Patching monster moves');
  lastMovesList = newMovesList;

  return {patch};
};