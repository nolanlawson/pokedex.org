// animate between the list view and the detail view, using FLIP animations
// https://aerotwist.com/blog/flip-your-animations/

var $ = document.querySelector.bind(document);

// elements
var detailView;
var detailViewContainer;
var detailPanel;
var headerAppBar;
var monstersList;
var detailSprite;
var spriteFacade;
var themeMeta;
var appTheme;

var screenWidth = window.innerWidth;
var screenHeight = window.innerHeight;

var dimensToSpriteRect = {};
var animatingBackground = false;
var runOnBackgroundAnimComplete = false;

function computeBackgroundTransforms(nationalId, outAnimation) {
  console.time('computeBackgroundTransforms()');

  var sourceSprite = monstersList.querySelector(`.sprite-${nationalId}`);
  var sourceTitleSpan = sourceSprite.parentElement.querySelector('span');

  var sourceSpriteRect = sourceSprite.getBoundingClientRect();
  var detailSpriteRect = getDetailSpriteRect();
  var spanStyle = getComputedStyle(sourceTitleSpan);
  var sourceTitleSpanHeight = parseInt(spanStyle.height.replace('px', ''));

  var spriteChangeX = sourceSpriteRect.left - detailSpriteRect.left;
  var spriteChangeY = sourceSpriteRect.top - detailSpriteRect.top;

  var scaleX = sourceSpriteRect.width / screenWidth;
  var scaleY = (sourceSpriteRect.height - sourceTitleSpanHeight) / screenHeight;
  var toX = sourceSpriteRect.left;
  var toY = sourceSpriteRect.top;

  var bgTransform = `translate(${toX}px,${toY}px) scale(${scaleX},${scaleY})`;
  var spriteTransform = `translate(${spriteChangeX}px, ${spriteChangeY}px)`;

  console.timeEnd('computeBackgroundTransforms()');

  return {
    bgTransform,
    spriteTransform,
    spriteTop: detailSpriteRect.top + document.body.scrollTop,
    spriteLeft: detailSpriteRect.left
  };
}

function computePanelTransforms(nationalId, outAnimation) {
  console.time('computePanelTransforms()');

  // reeeaaally fling it away when animating out. looks better
  var slideInY = outAnimation ? screenHeight * 1.1 : screenHeight * 0.6;

  var fgTransform = `translateY(${slideInY}px)`;

  console.timeEnd('computePanelTransforms()');

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

function _animateBackgroundIn(nationalId) {
  document.body.style.overflowY = 'hidden'; // disable scrolling
  detailViewContainer.classList.remove('hidden');
  var transforms = computeBackgroundTransforms(nationalId, false);
  var targetPanel = detailView.querySelector('.detail-panel');
  var {bgTransform, spriteTransform, spriteTop, spriteLeft} = transforms;
  var targetBackground = detailView.querySelector('.detail-view-bg');
  var sourceSprite = monstersList.querySelector(`.sprite-${nationalId}`);
  targetBackground.style.backgroundColor = sourceSprite.parentElement.style.backgroundColor;
  var spriteFacade = styleSpriteFacade(nationalId, spriteTop, spriteLeft, spriteTransform);
  spriteFacade.classList.remove('hidden');
  targetBackground.style.transform = bgTransform;

  requestAnimationFrame(() => {
    // go go go!
    targetBackground.classList.add('animating');
    spriteFacade.classList.add('animating');
    targetBackground.style.transform = '';
    spriteFacade.style.transform = '';
  });

  function onAnimEnd() {
    console.log('done animating');
    targetBackground.classList.remove('animating');
    spriteFacade.classList.remove('animating');
    targetBackground.removeEventListener('transitionend', onAnimEnd);
  }

  targetBackground.addEventListener('transitionend', onAnimEnd);

  targetPanel.classList.add('hidden');

  animatingBackground = false;
  if (runOnBackgroundAnimComplete) {
    runOnBackgroundAnimComplete();
    runOnBackgroundAnimComplete = null;
  }
}

function _animatePanelIn(nationalId, themeColor) {
  detailPanel.style.overflowY = 'auto'; // re-enable overflow on the panel
  document.body.style.overflowY = 'hidden'; // disable scrolling
  var targetPanel = detailView.querySelector('.detail-panel');
  var targetForeground = detailView.querySelector('.detail-view-fg');
  var detailSprite = detailView.querySelector('.detail-sprite');
  targetPanel.classList.remove('hidden');
  detailSprite.style.opacity = 0;
  var {fgTransform} = computePanelTransforms(nationalId, false);

  targetForeground.style.transform = fgTransform;

  requestAnimationFrame(() => {
    // go go go!
    targetForeground.classList.add('animating');
    targetForeground.style.transform = '';
  });

  function onAnimEnd() {
    console.log('done animating');
    targetForeground.classList.remove('animating');
    themeMeta.content = themeColor;

    spriteFacade.classList.add('hidden');

    detailSprite.style.opacity = 1;
    // this peeks out on android, looks less weird with the right color
    headerAppBar.style.backgroundColor = themeColor;

    targetForeground.removeEventListener('transitionend', onAnimEnd);
  }

  targetForeground.addEventListener('transitionend', onAnimEnd);
}

function _animateOut(nationalId) {
  detailPanel.scrollTop = 0; // scroll panel to top, disable scrolling during animation
  detailPanel.style.overflowY = 'visible';
  document.body.style.overflowY = 'visible'; // re-enable scrolling
  headerAppBar.style.backgroundColor = appTheme;
  var {bgTransform, spriteTransform, spriteTop, spriteLeft} =
    computeBackgroundTransforms(nationalId, true);
  var {fgTransform} = computePanelTransforms(nationalId, true);

  var targetBackground = detailView.querySelector('.detail-view-bg');
  var targetForeground = detailView.querySelector('.detail-view-fg');
  var detailSprite = detailView.querySelector('.detail-sprite');
  var spriteFacade = styleSpriteFacade(nationalId, spriteTop, spriteLeft, '');
  spriteFacade.classList.remove('hidden');
  detailSprite.style.opacity = 0;
  targetBackground.style.transform = '';
  targetForeground.style.transform = '';


  requestAnimationFrame(() => {
    // go go go!
    targetForeground.classList.add('animating');
    targetBackground.classList.add('animating');
    spriteFacade.classList.add('animating');
    spriteFacade.style.transform = spriteTransform;
    targetBackground.style.transform = bgTransform;
    targetForeground.style.transform = fgTransform;
  });

  function onAnimEnd() {
    console.log('done animating');
    targetForeground.classList.remove('animating');
    targetBackground.classList.remove('animating');
    spriteFacade.classList.remove('animating');
    targetBackground.style.transform = '';
    targetForeground.style.transform = '';
    detailViewContainer.classList.add('hidden');
    spriteFacade.classList.add('hidden');
    detailSprite.style.opacity = 1;
    themeMeta.content = appTheme;
    targetBackground.removeEventListener('transitionend', onAnimEnd);
  }

  targetBackground.addEventListener('transitionend', onAnimEnd);
}

function init() {
  detailView = $('#detail-view');
  detailViewContainer = $('#detail-view-container');
  monstersList = $('#monsters-list');
  detailPanel = $('.detail-panel');
  headerAppBar = $('.mui-appbar');
  detailSprite = detailView.querySelector('.detail-sprite');
  themeMeta = document.head.querySelector('meta[name="theme-color"]');
  spriteFacade = createSpriteFacade();
  appTheme = themeMeta.content;
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

document.addEventListener('DOMContentLoaded', init);

window.addEventListener('resize', onResize);

function animateBackgroundIn(nationalId) {
  animatingBackground = true;
  setTimeout(() => {
    requestAnimationFrame(() => _animateBackgroundIn(nationalId));
  }, 200);
}

function animatePanelIn(nationalId, themeColor) {
  if (!animatingBackground) {
    runOnBackgroundAnimComplete = null;
    return requestAnimationFrame(() => _animatePanelIn(nationalId, themeColor));
  }
  runOnBackgroundAnimComplete = () => {
    requestAnimationFrame(() => _animatePanelIn(nationalId, themeColor));
  };
}

function animateOut(nationalId, themeColor) {
  requestAnimationFrame(() => _animateOut(nationalId, themeColor));
}

module.exports = {
  animateBackgroundIn,
  animatePanelIn,
  animateOut
};