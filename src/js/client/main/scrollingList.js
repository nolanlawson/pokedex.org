var pageSize = require('../../shared/util/constants').pageSize;
var progress = require('./progress');
var applyPatch = require('vdom-serialized-patch/patch');
var patchElement = require('virtual-dom/patch');
var detailViewOrchestrator = require('./detailViewOrchestrator');
var worker = require('./../shared/worker');
var rippleEffect = require('./rippleEffect');
var debounce = require('debounce');
var progressiveDebounce = require('./progressiveDebounce');
var passiveEventListeners = require('./supportsPassiveEventListeners');
var DEBOUNCE_DELAY = 200;
var SCROLL_PREFETCH_OFFSET = 800;
var PLACEHOLDER_OFFSET = 30;
var $ = document.querySelector.bind(document);

var monstersList;
var footerHeight;
var endOfList;

function doApplyPatch(patchString) {
  console.time('JSON.parse()');
  var patch = JSON.parse(patchString);
  console.timeEnd('JSON.parse()');
  console.time('patchElement()');
  applyPatch(monstersList, patch);
  console.timeEnd('patchElement()');
  progress.end();
}

function onMonstersListPatch(message) {
  doApplyPatch(message.patch);
  endOfList = message.endOfList;
}

function scrolledToBottom() {
  if (!footerHeight) {
    footerHeight = parseInt(getComputedStyle($('#footer')).height, 10);
  }
  // if the user is within SCROLL_PREFETCH_OFFSET pixels,
  // start prefetching the list items we need to append
  return (window.innerHeight + window.scrollY) >=
    (document.body.scrollHeight - footerHeight - SCROLL_PREFETCH_OFFSET);
}

function binarySearchForFirstVisibleChild(children) {
  var low = 0, high = children.length, mid, rect, val;
  while (low < high) {
    mid = (low + high) >>> 1; // faster version of Math.floor((low + high) / 2)
    rect = children[mid].getBoundingClientRect();
    val = rect.bottom;
    val < 0 ? low = mid + 1 : high = mid
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
    val < windowHeight ? low = mid + 1 : high = mid
  }
  return low;
}

function onViewportChange() {
  if (!monstersList) {
    return;
  }

  console.time('binarySearch');
  var children = monstersList.children;
  var firstVisibleIndex = binarySearchForFirstVisibleChild(children);
  var firstInvisibleIndex = binarySearchForFirstInvisibleChild(firstVisibleIndex, children);
  console.timeEnd('binarySearch');

  console.time('worker');
  worker.postMessage({
    type: 'listStateChanged',
    start: Math.max(0, firstVisibleIndex - PLACEHOLDER_OFFSET),
    end: firstInvisibleIndex + PLACEHOLDER_OFFSET
  });
}

function showMonsterDetail(nationalId) {
  console.time('worker');
  worker.postMessage({
    type: 'detail',
    nationalId: nationalId
  });
  detailViewOrchestrator.animateInPartOne(nationalId);
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
    console.timeEnd('worker');
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

window.addEventListener('scroll', progressiveDebounce(onViewportChange, DEBOUNCE_DELAY),
  passiveEventListeners ? {passive: true} : false);
window.addEventListener('resize', debounce(onViewportChange, 50),
  passiveEventListeners ? {passive: true} : false);