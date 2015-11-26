var renderMovesList = require('../shared/renderMovesList');
var databaseService = require('./databaseService');
var h = require('virtual-dom/h');
var diff = require('virtual-dom/diff');
var Stopwatch = require('../shared/util/stopwatch');

var lastMovesList = h('div.monster-moves');

module.exports = async nationalId => {
  var stopwatch = new Stopwatch('Fetching monster moves');
  stopwatch.start('getMonsterSummaryById()');
  var monsterSummary = databaseService.getMonsterSummaryById(nationalId);
  stopwatch.start('getMonsterMovesById()');
  var moves = await databaseService.getMonsterMovesById(nationalId);
  stopwatch.time('renderMovesList()');
  var newMovesList = renderMovesList(monsterSummary, moves);
  stopwatch.time('diff()');
  var patch = diff(lastMovesList, newMovesList);
  lastMovesList = newMovesList;
  stopwatch.totalTime();
  return {patch};
};
