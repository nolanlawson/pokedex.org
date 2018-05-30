var worker = require('./../shared/worker');
var applyPatch = require('vdom-serialized-patch/patch');
var indexOf = require('lodash/indexOf');
var orchestrator = require('./detailViewOrchestrator');
var Promise = require('../../shared/util/promise');
var toMainView = require('./router').toMainView;
var marky = require('marky');

var $ = require('./jqueryLite');

var detailView;
var detailViewContainer;

function animateDropdownIn(moveDetail, button) {
  requestAnimationFrame(() => {
    moveDetail.classList.remove('hidden');
    moveDetail.style.willChange = 'opacity, transform';
    moveDetail.style.opacity = 0;
    moveDetail.style.transform = `scaleY(0.01)`;
    button.style.willChange = 'transform';
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
      // deliberately keep will-change:transform even after the anim
      // finishes. this way the animation will be primed for the next time;
      // otherwise it ends up looking weird
      moveDetail.style.willChange = 'transform';
      button.style.willChange = '';
      moveDetail.removeEventListener('transitionend', listener);
    });
  });
}

function animateDropdownOut(moveDetail, button) {
  requestAnimationFrame(() => {
    moveDetail.style.willChange = 'transform';
    moveDetail.style.transform = '';
    button.style.willChange = 'transform';
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
      moveDetail.style.willChange = '';
      button.style.willChange = '';
      moveDetail.removeEventListener('transitionend', listener);
    });
  });
}

function onClickDropdown(button, movesRow) {
  var moveDetail = movesRow.querySelector('.moves-row-detail');

  if (moveDetail.classList.contains('hidden')) {
    animateDropdownIn(moveDetail, button);
  } else {
    animateDropdownOut(moveDetail, button);
  }
}

function onDetailPatchMessage(message) {
  var {nationalId, themeColor, patch} = message;
  // break up into two functions to avoid jank
  Promise.resolve()
    .then(() => JSON.parse(patch))
    .then(patch => applyPatch(detailView, patch))
    .then(() => orchestrator.animateInPartTwo(nationalId, themeColor))
    .catch(err => console.log(err));
}

function onMovesListPatchMessage(pachAsString) {
  var monsterMovesDiv = detailView.querySelector('.monster-moves');
  Promise.resolve()
    .then(() => JSON.parse(pachAsString))
    .then(patch => applyPatch(monsterMovesDiv, patch))
    .then(monsterMovesDiv.classList.remove('hidden'))
    .catch(err => console.log(err));
}

worker.addEventListener('message', e => {
  if (e.data.type === 'monsterDetailPatch') {
    marky.stop('worker');
    onDetailPatchMessage(e.data);
  } else if (e.data.type === 'movesListPatch') {
    marky.stop('worker');
    onMovesListPatchMessage(e.data.patch);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  detailView = $('#detail-view');
  detailViewContainer = $('#detail-view-container');
  detailViewContainer.addEventListener('click', e => {
    if (indexOf(e.target.classList, 'back-button') !== -1) {
      toMainView();
    }
  });
  detailView.addEventListener('click', e => {
    // chrome and firefox disagree on whether the button gets
    // clicked or the span inside it gets clicked
    if (e.target.classList.contains('dropdown-button')) {
      e.preventDefault();
      e.stopPropagation();
      onClickDropdown(e.target,
        e.target.parentElement.parentElement);
    } else if (e.target.classList.contains('dropdown-button-image')) {
      e.preventDefault();
      e.stopPropagation();
      onClickDropdown(e.target,
        e.target.parentElement.parentElement.parentElement);
    }
  });
  document.addEventListener('keyup', e => {
    if (e.keyCode === 27 && !detailViewContainer.classList.contains('hidden')) {
      toMainView();
    }
  });
});
