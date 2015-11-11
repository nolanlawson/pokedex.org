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

function animateDropdownIn(moveDetail, button) {
  requestAnimationFrame(() => {
    moveDetail.classList.remove('hidden');
    moveDetail.style.opacity = 0;
    moveDetail.style.transform = `scaleY(0.01)`;
    button.style.transform = '';

    requestAnimationFrame(() => {
      // go go go
      moveDetail.style.opacity = 1;
      moveDetail.classList.add('animating');
      button.classList.add('animating');
      moveDetail.style.transform = '';
      button.style.transform = 'rotate(90deg)';
    });

    moveDetail.addEventListener('transitionend', function listener() {
      moveDetail.classList.remove('animating');
      button.classList.remove('animating');
      moveDetail.removeEventListener('transitionend', listener);
    });
  });
}

function animateDropdownOut(moveDetail, button) {
  requestAnimationFrame(() => {
    moveDetail.style.transform = '';
    button.style.transform = 'rotate(90deg)';

    requestAnimationFrame(() => {
      // go go go
      moveDetail.classList.add('animating');
      button.classList.add('animating');
      moveDetail.style.transform = `scaleY(0.01)`;
      button.style.transform = '';
    });

    moveDetail.addEventListener('transitionend', function listener() {
      moveDetail.classList.remove('animating');
      moveDetail.classList.add('hidden');
      button.classList.remove('animating');
      moveDetail.removeEventListener('transitionend', listener);
    });
  });
}

function onClickDropdown(button) {
  var greatGrandparent = button.parentElement.parentElement.parentElement;
  var moveDetail = greatGrandparent.querySelector('.moves-row-detail');

  if (moveDetail.classList.contains('hidden')) {
    animateDropdownIn(moveDetail, button);
  } else {
    animateDropdownOut(moveDetail, button);
  }
}

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

document.addEventListener('DOMContentLoaded', () => {
  detailView = $('#detail-view');
  detailViewContainer = $('#detail-view-container');
  detailViewContainer.addEventListener('click', e => {
    if (indexOf(e.target.classList, 'back-button') !== -1) {
      orchestrator.animateOut(lastNationalId);
    }
  });
  detailView.addEventListener('click', e => {
    if (e.target.classList.contains('dropdown-button-image')) {
      e.preventDefault();
      e.stopPropagation();
      onClickDropdown(e.target);
    }
  })
});