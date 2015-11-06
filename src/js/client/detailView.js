var worker = require('./worker');
var patchElement = require('virtual-dom/patch');
var fromJson = require('vdom-as-json/fromJson');
var indexOf = require('lodash/array/indexOf');
var orchestrator = require('./detailViewOrchestrator');
var Promise = require('../shared/util/promise');

var $ = document.querySelector.bind(document);

var detailView;
var detailViewContainer;
var lastNationalId;

document.addEventListener('DOMContentLoaded', () => {
  detailView = $('#detail-view');
  detailViewContainer = $('#detail-view-container');
  detailViewContainer.addEventListener('click', e => {
    if (indexOf(e.target.classList, 'back-button') !== -1) {
      orchestrator.animateOut(lastNationalId);
    }
  });
});

function onMessage(message) {
  var {nationalId, themeColor, patch} = message;
  lastNationalId = nationalId;
  // break up into two functions to avoid jank
  Promise.resolve()
    .then(() => fromJson(JSON.parse(patch)))
    .then(patch => patchElement(detailView, patch))
    .then(() => orchestrator.animateInPartTwo(nationalId, themeColor))
    .catch(err => console.log(err));
}

worker.addEventListener('message', e => {
  if (e.data.type === 'monsterDetailPatch') {
    onMessage(e.data);
  }
});