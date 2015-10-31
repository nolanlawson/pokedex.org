require('regenerator/runtime');

var renderDetailView = require('../shared/renderMonsterDetailView');
var getMonsterDarkTheme = require('../shared/getMonsterDarkTheme');
var dbService = require('./databaseService');
var bulbasaur = require('../shared/bulbasaur');
var diff = require('virtual-dom/diff');
var Stopwatch = require('../shared/stopwatch');

var lastDetailView = renderDetailView(bulbasaur);

module.exports = async nationalId => {
  var stopwatch = new Stopwatch();
  var fullMonsterData = await dbService.getFullMonsterDataById(nationalId);
  stopwatch.time('detail: fetching monsterData');

  var newDetailView = renderDetailView(fullMonsterData);

  stopwatch.time('detail: rendering');

  var patch = diff(lastDetailView, newDetailView);

  lastDetailView = newDetailView;

  stopwatch.time('detail: diffing');

  var themeColor = getMonsterDarkTheme(fullMonsterData.monster);

  return {patch, themeColor};
};