var worker = require('./../shared/worker');
var patchElement = require('virtual-dom/patch');
var fromJson = require('vdom-as-json/fromJson');
var indexOf = require('lodash/array/indexOf');
var orchestrator = require('./detailViewOrchestrator');
var Promise = require('../../shared/util/promise');
var createElement = require('virtual-dom/create-element');

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

function onDetailPatchMessage(message) {
  var {nationalId, themeColor, patch} = message;
  lastNationalId = nationalId;
  // break up into two functions to avoid jank
  Promise.resolve()
    .then(() => fromJson(JSON.parse(patch)))
    .then(patch => patchElement(detailView, patch))
    .then(() => orchestrator.animateInPartTwo(nationalId, themeColor))
    .catch(err => console.log(err));
}

function onMovesListPatchMessage(pachAsString) {
  var monsterMovesDiv = detailView.querySelector('.monster-moves');
  Promise.resolve()
    .then(() => fromJson(JSON.parse(pachAsString)))
    .then(patch => patchElement(monsterMovesDiv, patch))
    .catch(err => console.log(err));
}

worker.addEventListener('message', e => {
  if (e.data.type === 'monsterDetailPatch') {
    onDetailPatchMessage(e.data);
  } else if (e.data.type === 'movesListPatch') {
    onMovesListPatchMessage(e.data.patch);
  }
});