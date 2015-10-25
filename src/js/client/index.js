require('./sideMenu');
require('./searchBar');

var fromJson = require('vdom-as-json/fromJson');
var patchElement = require('virtual-dom/patch');
var $ = document.querySelector.bind(document);

var worker = require('./worker');

function applyPatch(patch) {
  var monstersList = $('#monsters-list');
  var patch = fromJson(patch);
  patchElement(monstersList, patch);
}

worker.addEventListener('message', e => {
  var message = e.data;

  console.log('worker sent message');

  if (message.type === 'monstersListPatch') {
    applyPatch(JSON.parse(message.content));
  }
});