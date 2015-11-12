var progress = require('./progress');
var applyPatch = require('vdom-serialized-patch/patch');
var patchElement = require('virtual-dom/patch');
var detailViewOrchestrator = require('./detailViewOrchestrator');
var worker = require('./../shared/worker');
var rippleEffect = require('./rippleEffect');
var debounce = require('debounce');
var DEBOUNCE_DELAY = 50;
var SCROLL_PREFETCH_OFFSET = 400;
var $ = document.querySelector.bind(document);

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

function onScroll() {
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