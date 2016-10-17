import 'lie/polyfill';
import regen from 'regenerator-runtime/runtime';

if (typeof window !== 'undefined') {
  // hack for the pseudoworker
  window.regeneratorRuntime = regen;
}

import toJson from 'vdom-as-json/toJson';
import serialize from 'vdom-serialized-patch/serialize';
import Stopwatch from '../shared/util/stopwatch';
import dbService from './databaseService';
import patchMonstersList from './patchMonstersList';
import patchMonsterDetail from './patchMonsterDetail';
import renderToast from '../shared/renderToast/index';
import renderModal from '../shared/renderModal/index';
import pageStateStore from './pageStateStore';
import {pageSize as startingPageSize} from '../shared/util/constants';
import getMonsterDarkTheme from '../shared/monster/getMonsterDarkTheme';
import databaseService from './databaseService';
import patchMovesList from './patchMovesList';

async function renderList() {
  var {filter, start, end} = pageStateStore;
  var stopwatch = new Stopwatch('renderList()');
  stopwatch.start('patchMonstersList()');
  var {patch, endOfList} = await patchMonstersList(filter, start, end);
  stopwatch.time('serialize');
  var patchJson = serialize(patch);
  stopwatch.time('JSON.stringify()');
  var patchJsonAsString = JSON.stringify(patchJson);
  stopwatch.time('postMessage()');

  self.postMessage({
    type: 'monstersListPatch',
    patch: patchJsonAsString,
    endOfList: endOfList
  });
  stopwatch.totalTime();
}

async function onFilterMessage(message) {
  var filter = message.filter || '';

  pageStateStore.filter = filter;
  pageStateStore.pageSize = startingPageSize;
  await renderList();
}

async function onScrolled(message) {
  pageStateStore.start = message.start;
  pageStateStore.end = message.end;
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
  var stopwatch = new Stopwatch('onDetailMessage()');
  stopwatch.start('patchMonsterDetail');
  var patchPromise = patchMonsterDetail(nationalId);
  setThemeColor(nationalId);
  var {patch} = await patchPromise;
  stopwatch.time('serialize');
  var patchJson = serialize(patch);
  stopwatch.time('JSON.stringify()');
  var patchJsonAsString = JSON.stringify(patchJson);
  stopwatch.time('postMessage()');
  self.postMessage({
    type: 'monsterDetailPatch',
    patch: patchJsonAsString,
    nationalId: nationalId
  });
  stopwatch.totalTime();
}

async function onMovesDetailMessage(message) {
  var {nationalId} = message;
  var stopwatch = new Stopwatch('onMovesDetailMessage()');
  stopwatch.start('patchMovesList()');
  var {patch} = await patchMovesList(nationalId);
  stopwatch.time('JSON.stringify()');
  var patchAsString = JSON.stringify(serialize(patch));
  stopwatch.time('postMessage()');
  self.postMessage({
    type: 'movesListPatch',
    patch: patchAsString,
    nationalId: nationalId
  });
  stopwatch.totalTime();
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

async function onViewportChangeMessage() {
  self.postMessage({
    type: 'viewportChanged'
  });
}

async function onMessage(message) {
  switch (message.type) {
    case 'filter':
      await onFilterMessage(message);
      break;
    case 'listStateChanged':
      await onScrolled(message);
      break;
    case 'detail':
      await onDetailMessage(message);
      break;
    case 'movesDetail':
      await onMovesDetailMessage(message);
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
    case 'viewportChanged':
      await onViewportChangeMessage();
      break;
  }
}

self.addEventListener('message', e => {
  var message = e.data;
  console.log('worker got message', message);
  // TODO: handle errors here
  onMessage(message).catch(console.log.bind(console));
});
