var toMonsterDetail = require('./router').toMonsterDetail;
var progress = require('./progress');
var applyPatch = require('vdom-serialized-patch/patch');
var worker = require('./../shared/worker');
var rippleEffect = require('./rippleEffect');
var debounce = require('debounce');
var progressiveDebounce = require('./progressiveDebounce');
var DEBOUNCE_DELAY = 200;
var PLACEHOLDER_OFFSET = 30;
var $ = require('./jqueryLite');
var marky = require('marky');

var monstersList;

function doApplyPatch(patchString) {
  marky.mark('JSON.parse()');
  var patch = JSON.parse(patchString);
  marky.stop('JSON.parse()');
  marky.mark('patchElement()');
  applyPatch(monstersList, patch);
  marky.stop('patchElement()');
  progress.end();
}

function onMonstersListPatch(message) {
  doApplyPatch(message.patch);
}

function binarySearchForFirstVisibleChild(children) {
  var low = 0, high = children.length, mid, rect, val;
  while (low < high) {
    mid = (low + high) >>> 1; // faster version of Math.floor((low + high) / 2)
    rect = children[mid].getBoundingClientRect();
    val = rect.bottom;
    val < 0 ? low = mid + 1 : high = mid;
  }
  return low;
}

function binarySearchForFirstInvisibleChild(start, children) {
  var windowHeight = window.innerHeight;
  var low = start, high = children.length, mid, rect, val;
  while (low < high) {
    mid = (low + high) >>> 1; // faster version of Math.floor((low + high) / 2)
    rect = children[mid].getBoundingClientRect();
    val = rect.top;
    val < windowHeight ? low = mid + 1 : high = mid;
  }
  return low;
}

function onViewportChange() {
  if (!monstersList) {
    return;
  }

  marky.mark('binarySearch');
  var children = monstersList.children;
  var firstVisibleIndex = binarySearchForFirstVisibleChild(children);
  var firstInvisibleIndex = binarySearchForFirstInvisibleChild(firstVisibleIndex, children);
  marky.stop('binarySearch');

  marky.mark('worker');
  worker.postMessage({
    type: 'listStateChanged',
    start: Math.max(0, firstVisibleIndex - PLACEHOLDER_OFFSET),
    end: firstInvisibleIndex + PLACEHOLDER_OFFSET
  });
}

function showMonsterDetail(nationalId) {
  marky.mark('worker');
  toMonsterDetail(nationalId);
}

function getNationalIdFromElement(el) {
  var classes = el.classList;
  for (var i = 0; i < classes.length; i++) {
    var className = classes[i];
    var res = className.match(/^sprite-(\d+)$/);
    if (res) {
      return parseInt(res[1], 10);
    }
  }
}

function onMessage(message) {
  if (message.type === 'monstersListPatch') {
    marky.stop('worker');
    onMonstersListPatch(message);
  } else if (message.type === 'viewportChanged') {
    onViewportChange();
  }
}

worker.addEventListener('message', e => {
  onMessage(e.data);
});

document.addEventListener('DOMContentLoaded', () => {
  monstersList = $('#monsters-list');
  monstersList.addEventListener('click', e => {
    if (e.target.tagName === 'BUTTON') {
      e.stopPropagation();
      e.preventDefault();
      rippleEffect(e, e.target, e.offsetX, e.offsetY);
      var nationalId = getNationalIdFromElement(e.target);
      showMonsterDetail(nationalId);
    }
  });
  onViewportChange();
}, false);

window.addEventListener('scroll', progressiveDebounce(onViewportChange, DEBOUNCE_DELAY));
window.addEventListener('resize', debounce(onViewportChange, 50));