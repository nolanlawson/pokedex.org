require('regenerator-runtime/runtime');

var renderDetailView = require('../shared/renderMonsterDetailView');
var dbService = require('./databaseService');
var diff = require('virtual-dom/diff');
var Stopwatch = require('../shared/util/stopwatch');
var fromJson = require('vdom-as-json/fromJson');

var lastDetailView = fromJson(require('../shared/prerendered/bulbasaur'));

module.exports = async nationalId => {
  var stopwatch = new Stopwatch('patchMonsterDetail()');
  stopwatch.start('getFullMonsterDataById()');
  var fullMonsterData = await dbService.getFullMonsterDataById(nationalId);
  stopwatch.time('renderDetailView()');

  var newDetailView = renderDetailView(fullMonsterData);

  stopwatch.time('diff()');

  var patch = diff(lastDetailView, newDetailView);

  lastDetailView = newDetailView;

  stopwatch.totalTime();
  return {patch};
};
