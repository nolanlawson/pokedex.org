var progress = require('./progress');
var applyPatch = require('vdom-serialized-patch/patch');
var patchElement = require('virtual-dom/patch');
var detailViewOrchestrator = require('./detailViewOrchestrator');
var worker = require('./../shared/worker');
var rippleEffect = require('./rippleEffect');
var debounce = require('debounce');
var DEBOUNCE_DELAY = 100;
var SCROLL_PREFETCH_OFFSET = 800;
var PLACEHOLDER_OFFSET = 20;
var $ = document.querySelector.bind(document);

var placeholderListItems = new Array(30);
var monstersList;
var footerHeight;
var endOfList;
var appending = false;

function doApplyPatch(patchString) {
  console.time('JSON.parse()');
  var patch = JSON.parse(patchString);
  console.timeEnd('JSON.parse()');
  console.time('patchElement');
  applyPatch(monstersList, patch);
  console.timeEnd('patchElement');
  progress.end();
  appending = false;
}

function onMonstersListPatch(message) {
  console.timeEnd('worker-filter');
  console.log('worker sent message');

  doApplyPatch(message.patch);
  endOfList = message.endOfList;
  placeholderListItems = new Array(monstersList.children.length);
  onScroll(); // sometimes need to check the scroll twice, for large screens
}

function onMessage(message) {
  if (message.type === 'monstersListPatch') {
    onMonstersListPatch(message);
  }
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

function togglePlaceholder(childElement, i, placeholder) {
  if (!!placeholderListItems[i] === placeholder) {
    return; // don't need to modify class list
  } else if (placeholder) {
    childElement.classList.add('placeholder');
    placeholderListItems[i] = true;
  } else {
    childElement.classList.remove('placeholder');
    placeholderListItems[i] = false;
  }
}

function renderSprites() {
  var children = monstersList.children;
  if (!children.length) {
    return;
  }
  console.time('renderSprites');
  console.time('binarySearch');
  var numShown = 0;
  var numHidden = 0;
  var firstVisibleIndex = binarySearchForFirstVisibleChild(children);
  var firstInvisibleIndex = binarySearchForFirstInvisibleChild(firstVisibleIndex, children);
  console.timeEnd('binarySearch');
  console.log('firstVisibleIndex', firstVisibleIndex);
  console.log('firstInvisibleIndex', firstInvisibleIndex);
  var i = -1;
  console.time('loop');

  while (++i < children.length) {
    var child = children[i];
    if (i < firstVisibleIndex) {
      // before the visible viewport
      togglePlaceholder(child, i, true);
      numHidden++;
    } else if (i >= firstInvisibleIndex) {
      // after the visible viewport
      togglePlaceholder(child, i, true);
      numHidden++;
    } else {
      // within the visible viewport
      togglePlaceholder(child, i, false);
      numShown++;
    }
  }
  console.timeEnd('loop');
  console.log('numShown', numShown, 'numHidden', numHidden);
  console.timeEnd('renderSprites');
}

function onScroll() {
  if (!monstersList) {
    return;
  }

  renderSprites();

  if (!appending && scrolledToBottom()) {
    console.log('scrolledToBottom');
    if (endOfList) {
      console.log('no more items to show');
      return;
    }
    console.time('worker-filter');
    progress.start(true);
    appending = true;
    worker.postMessage({
      type: 'scrolledToBottom'
    });
  }
}

function showMonsterDetail(nationalId) {
  console.time('worker-detail');
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
}, false);

window.addEventListener('scroll', debounce(onScroll, DEBOUNCE_DELAY));
window.addEventListener('resize', debounce(onScroll, 50));
onScroll();