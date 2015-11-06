var progress = require('./progress');
var fromJson = require('vdom-as-json/fromJson');
var patchElement = require('virtual-dom/patch');
var debounce = require('debounce');
var $ = document.querySelector.bind(document);

var detailViewOrchestrator = require('./detailViewOrchestrator');
var worker = require('./worker');

var monstersList;

// use a higher debounce for safari, which seems to ignore it if you set it
// too low
var isSafari = typeof openDatabase !== 'undefined' &&
  /(Safari|iPhone|iPad|iPod)/.test(navigator.userAgent) &&
  !/Chrome/.test(navigator.userAgent) &&
  !/BlackBerry/.test(navigator.platform);
var delay = isSafari ? 200 : 100;

function binarySearchForFirstVisibleChild(children) {
  var low = 0, high = children.length, mid, rect, val;
  while (low < high) {
    mid = (low + high) >>> 1; // faster version of Math.floor((low + high) / 2)
    rect = children[mid].getBoundingClientRect();
    val = rect.top + rect.height;
    val < 0 ? low = mid + 1 : high = mid
  }
  return low;
}

function renderSprites() {
  monstersList = monstersList || $('#monsters-list');
  var children = monstersList.children;
  if (!children.length) {
    return;
  }
  console.time('renderSprites');
  console.time('binarySearch');
  var windowHeight = window.innerHeight;
  var numShown = 0;
  var numHidden = 0;
  var firstVisibleIndex = binarySearchForFirstVisibleChild(children);
  console.timeEnd('binarySearch');
  console.log('firstVisibleIndex', firstVisibleIndex);
  var i = -1;
  var done = false;
  console.time('loop');
  while (++i < children.length) {
    var child = children[i];
    if (i < firstVisibleIndex) {
      // before the visible viewport
      child.classList.add('hidden');
      numHidden++;
      continue;
    }
    if (done) {
      // after the visible viewport
      child.classList.add('hidden');
      numHidden++;
      continue;
    }
    console.time('getBoundingClientRect');
    // possibly within the visible viewport
    var rect = child.getBoundingClientRect();
    console.timeEnd('getBoundingClientRect');
    if ((rect.bottom - rect.height) < windowHeight) {
      child.classList.remove('hidden');
      numShown++;
      continue;
    }
    child.classList.add('hidden');
    numHidden++;
    done = true;
  }
  console.timeEnd('loop');
  console.log('numShown', numShown, 'numHidden', numHidden);
  console.timeEnd('renderSprites');
}

renderSprites();

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
  console.timeEnd('worker-detail');
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
    e.stopPropagation();
    var el = e.target.parentElement.querySelector('.monster-sprite');
    var nationalId = parseInt(el.dataset.nationalId);
    console.time('worker-detail');
    worker.postMessage({
      type: 'detail',
      nationalId: nationalId
    });
    detailViewOrchestrator.animateInPartOne(nationalId);
  });
  window.addEventListener('scroll', debounce(renderSprites, delay));
}, false);

// This happens e.g. when the keyboard moves in/out on Android, in which
// case the window.innerHeight also changes, so we need to recalculate.
// This is debounced for the benefit of web developers manually resizing
// their window, so it doesn't end up looking so janky.
window.addEventListener('resize', debounce(renderSprites, 50));