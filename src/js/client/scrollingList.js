var progress = require('./progress');
var fromJson = require('vdom-as-json/fromJson');
var patchElement = require('virtual-dom/patch');
var $ = document.querySelector.bind(document);

var detailViewOrchestrator = require('./detailViewOrchestrator');
var worker = require('./worker');

var monstersList;

function applyPatch(patchString) {
  console.time('JSON.parse()');
  var patchJson = JSON.parse(patchString);
  console.timeEnd('JSON.parse()');
  console.time('fromJson');
  var patch = fromJson(patchJson);
  console.timeEnd('fromJson');
  console.time('patchElement');
  patchElement(monstersList, patch);
  console.timeEnd('patchElement');
  progress.end();
}

function onFiltered(message) {
  console.timeEnd('worker-detail');
  console.log('worker sent message');

  if (message.type === 'monstersListPatch') {
    applyPatch(message.patch);
  }
}

function onMessage(message) {
  if (message.type === 'monstersListPatch') {
    onFiltered(message);
  }
}

worker.addEventListener('message', e => {
  onMessage(e.data);
});

document.addEventListener('DOMContentLoaded', () => {
  monstersList = $('#monsters-list');
  monstersList.addEventListener('click', e => {
    e.stopPropagation();
    var el = e.target.parentElement.querySelector('.monster-sprite');
    var nationalId = parseInt(el.dataset.nationalId);
    // precompute the animation while the worker is working
    detailViewOrchestrator.precomputeInAnimation(nationalId);
    console.time('worker-detail');
    worker.postMessage({
      type: 'detail',
      nationalId: nationalId
    });
  });
}, false);