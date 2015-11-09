require('regenerator/runtime');

var toJson = require('vdom-as-json/toJson');
var Stopwatch = require('../shared/util/stopwatch');
var dbService = require('./databaseService');
var patchMonstersList = require('./patchMonstersList');
var patchMonsterDetail = require('./patchMonsterDetail');
var renderToast = require('../shared/renderToast');
var renderModal = require('../shared/renderModal');
var pageStateStore = require('./pageStateStore');
var startingPageSize = require('../shared/util/constants').pageSize;
var getMonsterDarkTheme = require('../shared/monster/getMonsterDarkTheme');
var databaseService = require('./databaseService');

async function renderList() {
  var {filter, pageSize} = pageStateStore;
  var stopwatch = new Stopwatch();
  var {patch, endOfList} = await patchMonstersList(filter, pageSize);
  stopwatch.time('patchMonstersList');
  var patchJson = toJson(patch);
  stopwatch.time('toJson');
  var patchJsonAsString = JSON.stringify(patchJson);
  stopwatch.time('JSON.stringify()');
  console.log('patchJsonAsString.length', patchJsonAsString.length);

  self.postMessage({
    type: 'monstersListPatch',
    patch: patchJsonAsString,
    endOfList: endOfList
  });
  stopwatch.totalTime('worker-filter (total)');
}

async function onFilterMessage(message) {
  var filter = message.filter || '';

  pageStateStore.filter = filter;
  pageStateStore.pageSize = startingPageSize;
  await renderList();
}

async function onScrolledToBottomMessage() {
  pageStateStore.pageSize += startingPageSize;
  await renderList();
}

function setThemeColor(nationalId) {
  var monsterSummary = databaseService.getMonsterSummaryById(nationalId);
  var themeColor = getMonsterDarkTheme(monsterSummary);
  self.postMessage({
    type: 'themeColor',
    color: themeColor
  });
}

async function onDetailMessage(message) {
  var {nationalId} = message;
  var stopwatch = new Stopwatch();
  var patchPromise = patchMonsterDetail(nationalId);
  setThemeColor(nationalId);
  var {patch} = await patchPromise;
  stopwatch.time('patchMonsterDetail()');
  var patchJson = toJson(patch);
  stopwatch.time('toJson');
  var patchJsonAsString = JSON.stringify(patchJson);
  stopwatch.time('JSON.stringify()');
  console.log('patchJsonAsString.length', patchJsonAsString.length);
  self.postMessage({
    type: 'monsterDetailPatch',
    patch: patchJsonAsString,
    nationalId: nationalId
  });
  stopwatch.totalTime('worker-detail (total)');
}

async function onOriginMessage(message) {
  dbService.init(message.origin);
}

async function onToastMessage(message) {
  var toast = renderToast(message.toast);
  self.postMessage({
    type: 'toast',
    toast: JSON.stringify(toJson(toast)),
    modal: message.modal
  });
}

async function onModalMessage(message) {
  var modal = renderModal(message.modal);
  self.postMessage({
    type: 'modal',
    modal: JSON.stringify(toJson(modal))
  });
}

async function onMessage(message) {
  switch (message.type) {
    case 'filter':
      await onFilterMessage(message);
      break;
    case 'scrolledToBottom':
      await onScrolledToBottomMessage(message);
      break;
    case 'detail':
      await onDetailMessage(message);
      break;
    case 'origin':
      await onOriginMessage(message);
      break;
    case 'toast':
      await onToastMessage(message);
      break;
    case 'modal':
      await onModalMessage(message);
      break;
  }
}

self.addEventListener('message', e => {
  var message = e.data;
  console.log('worker got message', message);
  // TODO: handle errors here
  onMessage(message).catch(console.log.bind(console));

});
