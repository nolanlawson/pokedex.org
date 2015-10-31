var progress = require('./progress');
var fromJson = require('vdom-as-json/fromJson');
var patchElement = require('virtual-dom/patch');
var $ = document.querySelector.bind(document);

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
  console.timeEnd('worker-filter');
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
    var el = e.target.parentElement.querySelector('.monster-sprite');
    var nationalId = parseInt(el.dataset.nationalId);
    worker.postMessage({
      type: 'detail',
      nationalId: nationalId
    });
  });
}, false);