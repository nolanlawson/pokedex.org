var progress = require('./progress');
var debounce = require('debounce');
var fromJson = require('vdom-as-json/fromJson');
var patchElement = require('virtual-dom/patch');
var $ = document.querySelector.bind(document);

var worker = require('./worker');

var monstersList;

function applyPatch(patchString) {
  monstersList = monstersList || $('#monsters-list');
  console.time('JSON.parse()');
  var patch = JSON.parse(patchString);
  console.timeEnd('JSON.parse()');
  console.time('fromJson');
  var patch = fromJson(patch);
  console.timeEnd('fromJson');
  console.time('patchElement');
  patchElement(monstersList, patch);
  console.timeEnd('patchElement');
  progress.end();
}

function onMessage(message) {
  console.timeEnd('worker-filter');
  console.log('worker sent message');

  if (message.type === 'monstersListPatch') {
    applyPatch(message.content);
    renderSprites();
  }
}

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
  var windowHeight = window.innerHeight;
  var numShown = 0;
  var numHidden = 0;
  var firstVisibleIndex = binarySearchForFirstVisibleChild(children);
  console.log('firstVisibleIndex', firstVisibleIndex);
  var i = -1;
  var done = false;
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
    // possibly within the visible viewport
    var rect = child.getBoundingClientRect();
    if ((rect.bottom - rect.height) < windowHeight) {
      child.classList.remove('hidden');
      numShown++;
      continue;
    }
    child.classList.add('hidden');
    numHidden++;
    done = true;
  }
  console.log('numShown', numShown, 'numHidden', numHidden);
  console.timeEnd('renderSprites');
}

renderSprites();

worker.addEventListener('message', e => {
  onMessage(e.data);
});

document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('scroll', debounce(renderSprites, 10));
});

// This happens e.g. when the keyboard moves in/out on Android, in which
// case the window.innerHeight also changes, so we need to recalculate.
// This is debounced for the benefit of web developers manually resizing
// their window, so it doesn't end up looking so janky.
window.addEventListener('resize', debounce(renderSprites, 50));