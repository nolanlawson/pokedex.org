import renderMovesList from '../shared/renderMovesList/index';
import databaseService from './databaseService';
import h from 'virtual-dom/h';
import diff from 'virtual-dom/diff';
import Stopwatch from '../shared/util/stopwatch';

var lastMovesList = h('div.monster-moves');

export default async nationalId => {
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
