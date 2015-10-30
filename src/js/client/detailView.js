var worker = require('./worker');
var patchElement = require('virtual-dom/patch');
var fromJson = require('vdom-as-json/fromJson');
var indexOf = require('lodash/array/indexOf');

var $ = document.querySelector.bind(document);

var detailView;
var detailViewContainer;

document.addEventListener('DOMContentLoaded', () => {
  detailView = $('#detail-view');
  detailViewContainer = $('#detail-view-container');
  detailViewContainer.addEventListener('click', e => {
    if (indexOf(e.target.classList, 'back-button') !== -1) {
      detailViewContainer.classList.add('hidden');
    }
  });
});

function applyPatch(patchString) {
  console.time('applyPatch');
  var patchJson = JSON.parse(patchString);
  var patch = fromJson(patchJson);

  patchElement(detailView, patch);

  detailViewContainer.classList.remove('hidden');
  console.timeEnd('applyPatch');
}

worker.addEventListener('message', e => {
  if (e.data.type === 'monsterDetailPatch') {
    applyPatch(e.data.content);
  }
});