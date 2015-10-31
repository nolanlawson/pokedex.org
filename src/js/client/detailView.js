var worker = require('./worker');
var patchElement = require('virtual-dom/patch');
var fromJson = require('vdom-as-json/fromJson');
var indexOf = require('lodash/array/indexOf');
var util = require('./util');

var $ = document.querySelector.bind(document);

var detailView;
var detailViewContainer;
var monstersList;
var lastNationalId;
var themeMeta;

document.addEventListener('DOMContentLoaded', () => {
  detailView = $('#detail-view');
  detailViewContainer = $('#detail-view-container');
  monstersList = $('#monsters-list');
  themeMeta = document.head.querySelector('meta[name="theme-color"]');
  detailViewContainer.addEventListener('click', e => {
    if (indexOf(e.target.classList, 'back-button') !== -1) {
      animateOut();
    }
  });
});

function computeTransforms(outAnimation) {
  console.time('computeTransforms()');
  var sourceSprite = monstersList.querySelector(`.sprite-${lastNationalId}`);
  var sourceTitleSpan = sourceSprite.parentElement.querySelector('span');
  var targetSprite = $('.detail-sprite');

  var screenWidth = window.innerWidth;
  var screenHeight = window.innerHeight;

  // reeeaaally fling it away when animating out. looks better
  var slideInY = outAnimation ? screenHeight * 1.1 : screenHeight * 0.6;

  var sourceSpriteRect = sourceSprite.getBoundingClientRect();
  var targetSpriteRect = targetSprite.getBoundingClientRect();
  var spanStyle = getComputedStyle(sourceTitleSpan);
  var sourceTitleSpanHeight = parseInt(spanStyle.height.replace('px', ''));

  var spriteChangeX = sourceSpriteRect.left - targetSpriteRect.left;
  var spriteChangeY = (sourceSpriteRect.top - targetSpriteRect.top) - slideInY;

  var scaleX = sourceSpriteRect.width / screenWidth;
  var scaleY = (sourceSpriteRect.height - sourceTitleSpanHeight) / screenHeight;
  var toX = sourceSpriteRect.left;
  var toY = sourceSpriteRect.top;

  var bgTransform = `translate(${toX}px,${toY}px) scale(${scaleX},${scaleY})`;
  var spriteTransform = `translate(${spriteChangeX}px, ${spriteChangeY}px)`;
  var fgTransform = `translateY(${slideInY}px)`;

  console.timeEnd('computeTransforms()');

  return {
    bgTransform,
    spriteTransform,
    fgTransform
  };
}

function animateIn(themeColor) {
  // scroll the panel down if necessary
  document.body.style.overflow = 'hidden';
  detailView.style.transform = `translateY(${window.pageYOffset}px)`;
  detailViewContainer.classList.remove('hidden');

  var {bgTransform, spriteTransform, fgTransform} = computeTransforms(false);
  var targetBackground = $('.detail-view-bg');
  var targetForeground = $('.detail-view-fg');
  var targetSprite = $('.detail-sprite');

  targetSprite.style.transform = spriteTransform;
  targetBackground.style.transform = bgTransform;
  targetForeground.style.transform = fgTransform;

  requestAnimationFrame(() => {
    // go go go!
    targetForeground.classList.add('animating');
    targetBackground.classList.add('animating');
    targetSprite.classList.add('animating');
    targetForeground.style.transform = '';
    targetBackground.style.transform = '';
    targetSprite.style.transform = '';
  });

  function onAnimEnd() {
    console.log('done animating');
    targetForeground.classList.remove('animating');
    targetBackground.classList.remove('animating');
    targetSprite.classList.remove('animating');
    themeMeta.content = themeColor;
    targetSprite.removeEventListener('transitionend', onAnimEnd);
  }

  targetSprite.addEventListener('transitionend', onAnimEnd);
}

function animateOut() {
  document.body.style.overflow = 'visible';
  var {bgTransform, spriteTransform, fgTransform} = computeTransforms(true);

  var targetBackground = $('.detail-view-bg');
  var targetForeground = $('.detail-view-fg');
  var targetSprite = $('.detail-sprite');
  targetSprite.style.transform = '';
  targetBackground.style.transform = '';
  targetForeground.style.transform = '';

  requestAnimationFrame(() => {
    // go go go!
    targetForeground.classList.add('animating');
    targetBackground.classList.add('animating');
    targetSprite.classList.add('animating');
    targetSprite.style.transform = spriteTransform;
    targetBackground.style.transform = bgTransform;
    targetForeground.style.transform = fgTransform;
  });

  function onAnimEnd() {
    console.log('done animating');
    targetForeground.classList.remove('animating');
    targetBackground.classList.remove('animating');
    targetSprite.classList.remove('animating');
    targetSprite.style.transform = '';
    targetBackground.style.transform = '';
    targetForeground.style.transform = '';
    detailViewContainer.classList.add('hidden');
    themeMeta.content = util.appTheme;
    targetSprite.removeEventListener('transitionend', onAnimEnd);
  }

  targetSprite.addEventListener('transitionend', onAnimEnd);
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
  requestAnimationFrame(() => animateIn(message.themeColor));
}

worker.addEventListener('message', e => {
  if (e.data.type === 'monsterDetailPatch') {
    onMessage(e.data);
  }
});