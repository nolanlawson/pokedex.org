var renderMovesList = require('../shared/renderMovesList');
var databaseService = require('./databaseService');
var h = require('virtual-dom/h');
var diff = require('virtual-dom/diff');
var Stopwatch = require('../shared/util/stopwatch');

var lastMovesList = h('div.monster-moves');

module.exports = async nationalId => {
  var stopwatch = new Stopwatch('Fetching monster moves');
  var monsterSummary = databaseService.getMonsterSummaryById(nationalId);
  var moves = await databaseService.getMonsterMovesById(nationalId);
  stopwatch.time('Patching monster moves');
  var newMovesList = renderMovesList(monsterSummary, moves);

  var patch = diff(lastMovesList, newMovesList);
  stopwatch.time();
  lastMovesList = newMovesList;

  return {patch};
};
