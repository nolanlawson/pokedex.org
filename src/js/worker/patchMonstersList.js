require('regenerator/runtime');

var renderMonstersList = require('../shared/renderMonstersList');
var diff = require('virtual-dom/diff');
var Stopwatch = require('../shared/util/stopwatch');
var dbService = require('./databaseService');
var startingPageSize = require('../shared/util/constants').pageSize;

var lastMonstersListView = renderMonstersList(dbService.getAllMonsters(), startingPageSize);

module.exports = async (filter, pageSize) => {
  var stopwatch = new Stopwatch();

  var newMonsters;
  if (filter) {
    newMonsters = await dbService.getFilteredMonsters(filter);
  } else {
    newMonsters = await dbService.getAllMonsters();
  }

  stopwatch.time('getting monsters');
  var newMonstersList = renderMonstersList(newMonsters, pageSize);
  stopwatch.time('rendering monsters');

  var patch = diff(lastMonstersListView, newMonstersList);
  var endOfList = newMonsters.length <= pageSize;
  console.log('newMonsters.length', newMonsters.length, 'pageSize', pageSize);
  stopwatch.time('diffing monsters');
  lastMonstersListView = newMonstersList;

  return {patch, endOfList};
};