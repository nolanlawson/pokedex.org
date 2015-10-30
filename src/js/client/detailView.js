var DETAIL_SLIDE_IN_Y = 600;

var worker = require('./worker');
var patchElement = require('virtual-dom/patch');
var fromJson = require('vdom-as-json/fromJson');
var indexOf = require('lodash/array/indexOf');

var $ = document.querySelector.bind(document);

var detailView;
var detailViewContainer;
var lastNationalId;

document.addEventListener('DOMContentLoaded', () => {
  detailView = $('#detail-view');
  detailViewContainer = $('#detail-view-container');
  detailViewContainer.addEventListener('click', e => {
    if (indexOf(e.target.classList, 'back-button') !== -1) {
      animateOut();
    }
  });
});

function animateOut() {
  detailViewContainer.classList.add('hidden');
  document.body.style.overflow = '';
}

function animateIn() {
  var sourceSprite = $(`[data-national-id="${lastNationalId}"]`);
  var sourceTitleSpan = sourceSprite.parentElement.querySelector('span');
  var targetSprite = $('.detail-sprite');
  var targetPanel = $('.detail-panel');

  detailView.style.top = `${document.body.scrollTop}px`;
  detailView.style.bottom = `-${document.body.scrollTop}px`;
  detailViewContainer.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  var sourceSpriteRect = sourceSprite.getBoundingClientRect();
  var targetSpriteRect = targetSprite.getBoundingClientRect();
  var sourceTitleSpanRect = sourceTitleSpan.getBoundingClientRect();
  var detailViewRect = detailView.getBoundingClientRect();

  var changeX = sourceSpriteRect.left - targetSpriteRect.left;
  var changeY = (sourceSpriteRect.top - targetSpriteRect.top) - DETAIL_SLIDE_IN_Y;

  var clipTop = sourceSpriteRect.top;
  var clipLeft = sourceSpriteRect.left;
  var clipRight = sourceSpriteRect.left + sourceSpriteRect.width;
  var clipBottom = sourceSpriteRect.top + sourceSpriteRect.height - sourceTitleSpanRect.height;

  detailView.style.clip =
    `rect(${clipTop}px ${clipRight}px ${clipBottom}px ${clipLeft}px)`;

  //var detailViewXOffset = (detailViewRect.width / 2) - (sourceSpriteRect.right - (sourceSpriteRect.width / 2));
  //console.log('detailViewXOffset', detailViewXOffset);
  //detailView.style.transform = `translateX(${detailViewXOffset}px)`;
  targetSprite.style.transform = `translate(${changeX}px, ${changeY}px)`;
  targetPanel.style.transform = `translateY(${DETAIL_SLIDE_IN_Y}px)`;

  requestAnimationFrame(() => {
    // go go go!
    /*targetSprite.classList.add('animating');
    targetSprite.style.transform = '';
    targetPanel.classList.add('animating');
    targetPanel.style.transform = '';
    detailView.classList.add('animating');
    detailView.style.clip = `rect(0 ${detailViewRect.width}px ${detailViewRect.height}px 0)`;*/
  });

  function onAnimEnd() {
    console.log('done animating');
    targetSprite.classList.remove('animating');
    targetPanel.classList.remove('animating');
    detailView.style.clip = '';
    targetSprite.removeEventListener('transitionend', onAnimEnd);
  }

  //targetSprite.addEventListener('transitionend', onAnimEnd);
}

function applyPatch(patchString) {
  console.time('applyPatch');
  var patchJson = JSON.parse(patchString);
  var patch = fromJson(patchJson);

  patchElement(detailView, patch);

  console.timeEnd('applyPatch');
}

function onMessage(message) {
  lastNationalId = message.nationalId;
  applyPatch(message.patch);
  requestAnimationFrame(animateIn);
}

worker.addEventListener('message', e => {
  if (e.data.type === 'monsterDetailPatch') {
    onMessage(e.data);
  }
});