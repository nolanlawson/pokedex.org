import 'regenerator-runtime/runtime';
import renderMonstersList from '../shared/renderMonstersList/index';
import diff from 'virtual-dom/diff';
import Stopwatch from '../shared/util/stopwatch';
import dbService from './databaseService';
import fromJson from 'vdom-as-json/fromJson';
import summaries from '../shared/prerendered/monsterSummaries.json';
var lastMonstersListView = fromJson(summaries);

async function patchMonstersList(filter, pageSize, start, end) {
  var stopwatch = new Stopwatch('patchMonstersList()');

  var newMonsters;
  if (filter) {
    stopwatch.start('getFilteredMonsters()');
    newMonsters = await dbService.getFilteredMonsters(filter);
  } else {
    stopwatch.start('getAllMonsters()');
    newMonsters = await dbService.getAllMonsters();
  }

  stopwatch.time('renderMonstersList()');
  var newMonstersList = renderMonstersList(newMonsters, pageSize, start, end);
  stopwatch.time('diff()');

  var patch = diff(lastMonstersListView, newMonstersList);
  var endOfList = newMonsters.length <= pageSize;
  console.log('newMonsters.length', newMonsters.length, 'pageSize', pageSize);
  lastMonstersListView = newMonstersList;

  stopwatch.totalTime();
  return {patch, endOfList};
}

export default patchMonstersList;