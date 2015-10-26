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
  console.time('renderSprites');
  monstersList = monstersList || $('#monsters-list');
  var windowHeight = window.innerHeight;
  var children = monstersList.children;
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
      child.classList.remove('shown');
      numHidden++;
      continue;
    }
    if (done) {
      // after the visible viewport
      child.classList.remove('shown');
      numHidden++;
      continue;
    }
    // possibly within the visible viewport
    var rect = child.getBoundingClientRect();
    if ((rect.bottom - rect.height) < windowHeight) {
      child.classList.add('shown');
      numShown++;
      continue;
    }
    child.classList.remove('shown');
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
  window.addEventListener('scroll', debounce(renderSprites, 100));
});