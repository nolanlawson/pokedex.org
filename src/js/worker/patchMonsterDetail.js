require('regenerator/runtime');

var renderDetailView = require('../shared/renderMonsterDetailView');
var dbService = require('./databaseService');
var zpad = require('zpad');
var bulbasaur = require('../shared/bulbasaur');
var diff = require('virtual-dom/diff');
var Stopwatch = require('../shared/stopwatch');

var lastDetailView;

module.exports = async nationalId => {
  var db = await dbService.getBestDB();
  var stopwatch = new Stopwatch();
  var monsterData = await db.get(zpad(nationalId, 5));
  stopwatch.time('detail: fetching monsterData');

  if (!lastDetailView) {
    lastDetailView = renderDetailView(bulbasaur);
  }

  var newDetailView = renderDetailView(monsterData);

  stopwatch.time('detail: rendering');

  var patch = diff(lastDetailView, newDetailView);

  lastDetailView = newDetailView;

  stopwatch.time('detail: diffing');

  return patch;
};