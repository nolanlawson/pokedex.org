require('regenerator/runtime');

var toJson = require('vdom-as-json/toJson');
var Stopwatch = require('../shared/util/stopwatch');
var dbService = require('./databaseService');
var patchMonstersList = require('./patchMonstersList');
var patchMonsterDetail = require('./patchMonsterDetail');

async function onFilterMessage(message) {
  var stopwatch = new Stopwatch();

  var filter = message.filter || '';
  var patch = await patchMonstersList(filter);

  stopwatch.time('patchMonstersList');
  var patchJson = toJson(patch);
  stopwatch.time('toJson');
  var patchJsonAsString = JSON.stringify(patchJson);
  stopwatch.time('JSON.stringify()');
  console.log('patchJsonAsString.length', patchJsonAsString.length);

  self.postMessage({
    type: 'monstersListPatch',
    patch: patchJsonAsString
  });
  stopwatch.totalTime('worker-filter (total)');
}

async function onDetailMessage(message) {
  var {nationalId} = message;
  var stopwatch = new Stopwatch();
  var {patch, themeColor} = await patchMonsterDetail(nationalId);
  stopwatch.time('patchMonsterDetail()');
  var patchJson = toJson(patch);
  stopwatch.time('toJson');
  var patchJsonAsString = JSON.stringify(patchJson);
  stopwatch.time('JSON.stringify()');
  console.log('patchJsonAsString.length', patchJsonAsString.length);
  self.postMessage({
    type: 'monsterDetailPatch',
    patch: patchJsonAsString,
    nationalId: nationalId,
    themeColor: themeColor
  });
  stopwatch.totalTime('worker-detail (total)');
}

async function onOriginMessage(message) {
  dbService.init(message.origin);
}

async function onMessage(message) {
  if (message.type === 'filter') {
    onFilterMessage(message);
  } else if (message.type === 'detail') {
    onDetailMessage(message);
  } else { // 'origin'
    onOriginMessage(message);
  }
}

self.addEventListener('message', e => {
  var message = e.data;
  console.log('worker got message', message);
  onMessage(message).catch(console.log.bind(console));

});
