// animate between the list view and the detail view, using FLIP animations
// https://aerotwist.com/blog/flip-your-animations/

var utils = require('./utils');
var themeManager = require('./themeManager');
var worker = require('./../shared/worker');
var each = require('lodash/each');
var marky = require('marky');

var $ = require('./jqueryLite');

// elements
var detailView;
var detailViewContainer;
var detailPanel;
var monstersList;
var detailSprite;
var detailBackButton;
var spriteFacade;
var spinnerHolder;
var spinnerTimeout;

var screenWidth = window.innerWidth;
var screenHeight = window.innerHeight;

var cachedSpanHeight;
var dimensToSpriteRect = {};
var runningAnimationPartOne = false;
var queuedAnimation = false;
var queuedThemeColor;

var animationDelay = utils.canRunHighPerfAnims() ? 0 : 500;

function getScrollTop() {
  // browsers seem to disagree on this
  return document.body.scrollTop || document.documentElement.scrollTop;
}

function computeTransformsPartOne(nationalId) {
  marky.mark('computeTransformsPartOne()');

  var sourceSprite = monstersList.querySelector(`.sprite-${nationalId}`);
  if (!sourceSprite) {
    // Sometimes we can't directly find it because the user has scrolled off the end of the
    // list. In this case we can just cheat and choose a random monster because it's better than nothing.
    // This only happens when the user presses the forward button on the browser. It's a bit weird
    // but kind of an edge case, and better that it "just works" than that it looks pretty.
    var sourceSprites = monstersList.querySelectorAll('.monster-sprite');
    sourceSprite = sourceSprites[sourceSprites.length - 1];
  }
  var sourceTitleSpan = sourceSprite.parentElement.querySelector('span');

  var sourceSpriteRect = sourceSprite.getBoundingClientRect();
  var detailSpriteRect = getDetailSpriteRect();
  var sourceTitleSpanHeight = getSpanHeight(sourceTitleSpan);

  var spriteChangeX = sourceSpriteRect.left - detailSpriteRect.left;
  var spriteChangeY = sourceSpriteRect.top - detailSpriteRect.top;

  var scaleX = sourceSpriteRect.width / screenWidth;
  var scaleY = (sourceSpriteRect.height - sourceTitleSpanHeight) / screenHeight;
  var toX = sourceSpriteRect.left;
  var toY = sourceSpriteRect.top;

  var bgTransform = `translate(${toX}px,${toY}px) scale(${scaleX},${scaleY})`;
  var spriteTransform = `translate(${spriteChangeX}px, ${spriteChangeY}px)`;

  marky.stop('computeTransformsPartOne()');

  return {
    bgTransform,
    spriteTransform,
    spriteTop: detailSpriteRect.top + getScrollTop(),
    spriteLeft: detailSpriteRect.left
  };
}

function computeTransformsPartTwo(nationalId, outAnimation) {
  marky.mark('computeTransformsPartTwo()');

  // reeeaaally fling it away when animating out. looks better
  var slideInY = outAnimation ? screenHeight * 1.1 : screenHeight * 0.6;

  var fgTransform = `translateY(${slideInY}px)`;

  marky.stop('computeTransformsPartTwo()');

  return {
    fgTransform
  };
}

function createSpriteFacade() {
  spriteFacade = document.createElement('div');
  spriteFacade.classList.add('monster-sprite');
  spriteFacade.classList.add('monster-sprite-facade');
  spriteFacade.classList.add('hidden');
  spriteFacade.style.top = `0px`;
  spriteFacade.style.left = `0px`;
  document.body.appendChild(spriteFacade);
  return spriteFacade;
}

function styleSpriteFacade(nationalId, top, left, transform) {
  for (var i = 0; i < spriteFacade.classList.length; i++) {
    var className = spriteFacade.classList[i];
    if (/^sprite-/.test(className)) {
      spriteFacade.classList.remove(className);
      break;
    }
  }
  spriteFacade.classList.add(`sprite-${nationalId}`);
  spriteFacade.style.top = `${top}px`;
  spriteFacade.style.left = `${left}px`;
  spriteFacade.style.transform = transform;
  return spriteFacade;
}

function doInAnimationPartOne(nationalId) {
  document.body.style.overflowY = 'hidden'; // disable scrolling
  detailViewContainer.classList.remove('hidden');
  var transforms = computeTransformsPartOne(nationalId, false);
  var {bgTransform, spriteTransform, spriteTop, spriteLeft} = transforms;
  var targetBackground = detailView.querySelector('.detail-view-bg');
  var sourceSprite = monstersList.querySelector(`.sprite-${nationalId}`);
  if (sourceSprite) {
    targetBackground.style.background = sourceSprite.parentElement.style.background;
  } else {
    // happens if the user navigates to e.g. /pokemon/200 immediately,
    // which is technically offscreen. so we cheat
    var listItems = monstersList.querySelectorAll('#monsters-list li');
    targetBackground.style.background = listItems[nationalId - 1].style.background;
  }
  var spriteFacade = styleSpriteFacade(nationalId, spriteTop, spriteLeft, spriteTransform);
  spriteFacade.classList.remove('hidden');
  detailBackButton.style.transform = 'translateX(-40px)';
  targetBackground.style.willChange = 'transform';
  targetBackground.style.transform = bgTransform;

  function onAnimEnd() {
    console.log('done animating');
    targetBackground.classList.remove('animating');
    spriteFacade.classList.remove('animating');
    targetBackground.removeEventListener('transitionend', onAnimEnd);
    targetBackground.style.willChange = '';
  }

  targetBackground.addEventListener('transitionend', onAnimEnd);
  detailPanel.classList.add('hidden');

  requestAnimationFrame(() => {
    // go go go!
    targetBackground.classList.add('animating');
    spriteFacade.classList.add('animating');
    targetBackground.style.transform = '';
    spriteFacade.style.transform = '';

    requestAnimationFrame(() => {
      runningAnimationPartOne = false;
      if (queuedAnimation) {
        requestAnimationFrame(() => {
          queuedAnimation();
          queuedAnimation = null;
        });
      } else {
        // if the second animation is delayed more than 5 seconds,
        // show a spinner to reassure the user (only happens with slow
        // connections on first load)
        spinnerTimeout = setTimeout(() => {
          spinnerHolder.classList.add('shown');
        }, 5000);
      }
      if (queuedThemeColor) {
        themeManager.setThemeColor(queuedThemeColor);
        queuedThemeColor = null;
      }
    });
  });
}

function doInAnimationPartTwo(nationalId) {
  spinnerHolder.classList.remove('shown');
  clearTimeout(spinnerTimeout);
  detailPanel.style.overflowY = 'scroll'; // re-enable overflow on the panel
  document.body.style.overflowY = 'hidden'; // disable scrolling
  document.documentElement.style.overflowY = 'hidden'; //disable scrolling

  // hide monster moves until they're shown after the panel
  detailPanel.querySelector('.monster-moves').classList.add('hidden');
  detailPanel.classList.remove('hidden');
  detailSprite.style.opacity = 0;
  var {fgTransform} = computeTransformsPartTwo(nationalId, false);

  detailPanel.style.transform = fgTransform;

  requestAnimationFrame(() => {
    // go go go!
    detailPanel.classList.add('animating');
    detailBackButton.classList.add('animating');
    detailPanel.style.transform = '';
    detailBackButton.style.transform = '';
  });

  function onAnimEnd() {
    console.log('done animating part two');
    detailBackButton.classList.remove('animating');
    detailPanel.classList.remove('animating');

    spriteFacade.classList.add('hidden');

    detailSprite.style.opacity = 1;

    // don't run this until the panel has animated in, in order to keep the
    // the animation smooth
    worker.postMessage({
      type: 'movesDetail',
      nationalId: nationalId
    });

    detailPanel.removeEventListener('transitionend', onAnimEnd);
  }

  detailPanel.addEventListener('transitionend', onAnimEnd);
}

function doOutAnimation(nationalId) {
  detailPanel.scrollTop = 0; // scroll panel to top, disable scrolling during animation
  detailPanel.style.overflowY = 'visible';
  document.body.style.overflowY = 'visible'; // re-enable scrolling
  document.documentElement.style.overflowY = ''; //re-enable scrolling
  var transforms = computeTransformsPartOne(nationalId, true);
  var {bgTransform, spriteTransform, spriteTop, spriteLeft} = transforms;
  var {fgTransform} = computeTransformsPartTwo(nationalId, true);

  var targetBackground = detailView.querySelector('.detail-view-bg');
  var detailSprite = detailView.querySelector('.detail-sprite');
  var spriteFacade = styleSpriteFacade(nationalId, spriteTop, spriteLeft, '');
  spriteFacade.classList.remove('hidden');
  detailSprite.style.opacity = 0;
  targetBackground.style.willChange = 'transform';
  targetBackground.style.transform = '';
  detailPanel.style.transform = '';


  requestAnimationFrame(() => {
    // go go go!
    detailBackButton.classList.add('animating');
    detailPanel.classList.add('animating');
    targetBackground.classList.add('animating');
    spriteFacade.classList.add('animating');
    spriteFacade.style.transform = spriteTransform;
    targetBackground.style.transform = bgTransform;
    detailPanel.style.transform = fgTransform;
    detailBackButton.style.transform = 'translateX(-60px)';
  });

  function onAnimEnd() {
    console.log('done animating part one');
    detailPanel.classList.remove('animating');
    targetBackground.classList.remove('animating');
    spriteFacade.classList.remove('animating');
    detailBackButton.classList.remove('animating');
    targetBackground.style.transform = '';
    detailPanel.style.transform = '';
    detailViewContainer.classList.add('hidden');
    spriteFacade.classList.add('hidden');
    detailSprite.style.opacity = 1;
    // clean up any expanded move lists
    each(detailView.querySelectorAll('.moves-row-detail'), el => el.classList.add('hidden'));
    each(detailView.querySelectorAll('.dropdown-button-image'), el => el.style.transform = '');
    targetBackground.removeEventListener('transitionend', onAnimEnd);
    targetBackground.style.willChange = '';
  }

  themeManager.resetThemeColor();

  targetBackground.addEventListener('transitionend', onAnimEnd);
}

function init() {
  detailView = $('#detail-view');
  detailViewContainer = $('#detail-view-container');
  monstersList = $('#monsters-list');
  detailPanel = $('.detail-panel');
  spinnerHolder = $('.big-spinner-holder');
  detailSprite = detailView.querySelector('.detail-sprite');
  detailBackButton = detailView.querySelector('.detail-back-button');
  spriteFacade = createSpriteFacade();

}

function onResize() {
  // these are expensive to compute, so only compute when the window is resized
  screenWidth = window.innerWidth;
  screenHeight = window.innerHeight;
}

function getCachedDetailSpriteRect() {
  var dimens = screenWidth + '_' + screenHeight;
  return dimensToSpriteRect[dimens];
}

function getDetailSpriteRect() {
  // the size/location of the target sprite is fixed given the window size,
  // so we can just cache it and avoid the expensive getBoundingClientRect()
  var result = getCachedDetailSpriteRect();
  if (result) {
    return result;
  }
  var dimens = screenWidth + '_' + screenHeight;
  result = dimensToSpriteRect[dimens] = detailSprite.getBoundingClientRect();
  return result;
}

function getSpanHeight(span) {
  // this never changes, so we can cache it instead of recomputing style
  // every time
  if (typeof cachedSpanHeight === 'number') {
    return cachedSpanHeight;
  }
  var spanStyle = getComputedStyle(span);
  cachedSpanHeight = parseInt(spanStyle.height.replace('px', ''), 10);
  return cachedSpanHeight;
}

document.addEventListener('DOMContentLoaded', init);

window.addEventListener('resize', onResize);

function animateInPartOne(nationalId) {
  runningAnimationPartOne = true;
  // artificial delay to let the material animation play
  setTimeout(() => {
    requestAnimationFrame(() => doInAnimationPartOne(nationalId));
  }, 20);
}

function createPartTwoAnimation(nationalId) {
  // it is very likely that old Android phones will not run these two
  // animations very well if they occur at the same time. so stagger them
  if (animationDelay === 0) {
    return () => requestAnimationFrame(() => doInAnimationPartTwo(nationalId));
  }
  return () => setTimeout(() =>
      requestAnimationFrame(() => doInAnimationPartTwo(nationalId)),
    animationDelay);
}

function animateInPartTwo(nationalId) {
  var runPartTwoAnimation = createPartTwoAnimation(nationalId);
  if (runningAnimationPartOne) {
    console.log('waiting for part one animation to finish');
    queuedAnimation = runPartTwoAnimation;
  } else {
    console.log('running part two animation immediately');
    runPartTwoAnimation();
  }
}

function animateOut(nationalId) {
  requestAnimationFrame(() => doOutAnimation(nationalId));
}

function setThemeColor(color) {
  if (runningAnimationPartOne) {
    queuedThemeColor = color;
  } else {
    themeManager.setThemeColor(color);
  }
}

worker.addEventListener('message', e => {
  if (e.data.type === 'themeColor') {
    setThemeColor(e.data.color);
  }
});

module.exports = {
  animateInPartOne,
  animateInPartTwo,
  animateOut
};
