require('regenerator/runtime');

var renderMonstersList = require('../shared/renderMonstersList');
var diff = require('virtual-dom/diff');
var Stopwatch = require('../shared/stopwatch');
var dbService = require('./databaseService');

var lastMonstersListView = renderMonstersList(dbService.getInitialMonsters());

module.exports = async filter => {
  var stopwatch = new Stopwatch();

  var newMonsters;
  if (filter) {
    newMonsters = await dbService.getFilteredMonsters(filter);
  } else {
    newMonsters = await dbService.getInitialMonsters();
  }

  stopwatch.time('getting monsters');
  var newMonstersList = renderMonstersList(newMonsters);
  stopwatch.time('rendering monsters');

  var patch = diff(lastMonstersListView, newMonstersList);
  stopwatch.time('diffing monsters');
  lastMonstersListView = newMonstersList;

  return patch;
};