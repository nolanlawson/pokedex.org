var ARTIFICIAL_DELAY = 50;

var worker = require('./worker');
var patchElement = require('virtual-dom/patch');
var fromJson = require('vdom-as-json/fromJson');
var indexOf = require('lodash/array/indexOf');
var orchestrator = require('./detailViewOrchestrator');

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

function applyPatch(patchString) {
  console.time('applyPatch');
  var patchJson = JSON.parse(patchString);
  var patch = fromJson(patchJson);
  patchElement(detailView, patch);
  console.timeEnd('applyPatch');
}

function onMessage(message) {
  var {nationalId, themeColor, patch, startTime} = message;
  lastNationalId = nationalId;
  applyPatch(patch);

  var animateIn = () => {
    requestAnimationFrame(() => {
      orchestrator.animateIn(nationalId, themeColor);
    });
  };

  var elapsedTime =  Date.now() - startTime;
  console.log('elapsedTime', elapsedTime);
  if (elapsedTime < ARTIFICIAL_DELAY) {
    // if the worker finished in <1s, then let the ripple animation
    // play before animating
    setTimeout(animateIn, (ARTIFICIAL_DELAY - elapsedTime));
  } else {
    animateIn();
  }
}

worker.addEventListener('message', e => {
  if (e.data.type === 'monsterDetailPatch') {
    onMessage(e.data);
  }
});