require('regenerator-runtime/runtime');

var renderMonstersList = require('../shared/renderMonstersList');
var diff = require('virtual-dom/diff');
var Stopwatch = require('../shared/util/stopwatch');
var dbService = require('./databaseService');
var fromJson = require('vdom-as-json/fromJson');

var lastMonstersListView = fromJson(require('../shared/prerendered/monsterSummaries.json'));

module.exports = async (filter, pageSize, start, end) => {
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
};
