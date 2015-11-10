var progress = require('./progress');
var fromJson = require('vdom-as-json/fromJson');
var patchElement = require('virtual-dom/patch');
var detailViewOrchestrator = require('./detailViewOrchestrator');
var worker = require('./../shared/worker');
var debounce = require('debounce');
var DEBOUNCE_DELAY = 50;
var SCROLL_PREFETCH_OFFSET = 400;
var $ = document.querySelector.bind(document);

var monstersList;
var footerHeight;
var endOfList;

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

function onMonstersListPatch(message) {
  console.timeEnd('worker-filter');
  console.log('worker sent message');

  applyPatch(message.patch);
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
  if (scrolledToBottom()) {
    console.log('scrolledToBottom');
    if (endOfList) {
      console.log('no more items to show');
      return;
    }
    console.time('worker-filter');
    progress.start(true);
    worker.postMessage({
      type: 'scrolledToBottom'
    });
  }
}

function onClick(e) {
  e.stopPropagation();
  var el = e.target.parentElement.querySelector('.monster-sprite');
  var nationalId = parseInt(el.dataset.nationalId);
  console.time('worker-detail');
  worker.postMessage({
    type: 'detail',
    nationalId: nationalId
  });
  detailViewOrchestrator.animateInPartOne(nationalId);
}

worker.addEventListener('message', e => {
  onMessage(e.data);
});

document.addEventListener('DOMContentLoaded', () => {
  monstersList = $('#monsters-list');
  monstersList.addEventListener('click', e => {
    if (e.target.tagName === 'BUTTON') {
      onClick(e);
    }
  });
}, false);

window.addEventListener('scroll', debounce(onScroll, DEBOUNCE_DELAY));
window.addEventListener('resize', debounce(onScroll, 50));
onScroll();