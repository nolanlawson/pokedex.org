// animate between the list view and the detail view, using FLIP animations
// https://aerotwist.com/blog/flip-your-animations/

var $ = document.querySelector.bind(document);

var detailView;
var detailViewContainer;
var detailPanel;
var headerAppBar;
var monstersList;
var themeMeta;
var appTheme;

var screenWidth = window.innerWidth;
var screenHeight = window.innerHeight;

var dimensToSpriteRect = {};

function computeBackgroundTransforms(nationalId, outAnimation) {
  console.time('computeBackgroundTransforms()');

  var sourceSprite = monstersList.querySelector(`.sprite-${nationalId}`);
  var sourceTitleSpan = sourceSprite.parentElement.querySelector('span');

  var sourceSpriteRect = sourceSprite.getBoundingClientRect();
  var detailSpriteRect = getDetailSpriteRect();
  var spanStyle = getComputedStyle(sourceTitleSpan);
  var sourceTitleSpanHeight = parseInt(spanStyle.height.replace('px', ''));

  // reeeaaally fling it away when animating out. looks better
  var slideInY = outAnimation ? screenHeight * 1.1 : screenHeight * 0.6;

  var spriteChangeX = sourceSpriteRect.left - detailSpriteRect.left;
  var spriteChangeY = (sourceSpriteRect.top - detailSpriteRect.top) - slideInY;

  var scaleX = sourceSpriteRect.width / screenWidth;
  var scaleY = (sourceSpriteRect.height - sourceTitleSpanHeight) / screenHeight;
  var toX = sourceSpriteRect.left;
  var toY = sourceSpriteRect.top;

  var bgTransform = `translate(${toX}px,${toY}px) scale(${scaleX},${scaleY})`;
  var spriteTransform = `translate(-${spriteChangeX}px, -${spriteChangeY}px)`;

  console.timeEnd('computeBackgroundTransforms()');

  return {
    bgTransform,
    spriteTransform,
    spriteTop: sourceSpriteRect.top,
    spriteLeft: sourceSpriteRect.left
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

function _animateBackgroundIn(nationalId) {
  document.body.style.overflowY = 'hidden'; // disable scrolling
  detailViewContainer.classList.remove('hidden');
  var targetPanel = detailView.querySelector('.detail-panel');
  targetPanel.classList.add('hidden');
  var transforms = computeBackgroundTransforms(nationalId, false);
  var {bgTransform, spriteTransform, spriteTop, spriteLeft} = transforms;
  var targetBackground = detailView.querySelector('.detail-view-bg');
  var spriteFacade = document.createElement('div');
  spriteFacade.classList.add('monster-sprite');
  spriteFacade.classList.add(`sprite-${nationalId}`);
  spriteFacade.classList.add('facade');
  spriteFacade.style.top = `${spriteTop}px`;
  spriteFacade.style.left = `${spriteLeft}px`;
  document.body.appendChild(spriteFacade);

  /*
  spriteFacade.style.transform = spriteTransform;
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
    document.body.removeChild(spriteFacade);
    targetBackground.removeEventListener('transitionend', onAnimEnd);
  }

  targetBackground.addEventListener('transitionend', onAnimEnd);*/

}
function _animatePanelIn(nationalId, themeColor) {
  detailPanel.style.overflowY = 'auto'; // re-enable overflow on the panel
  document.body.style.overflowY = 'hidden'; // disable scrolling
  var targetPanel = detailView.querySelector('.detail-panel');
  targetPanel.classList.remove('hidden');
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
  var {bgTransform, spriteTransform} = computeBackgroundTransforms(nationalId, true);
  var {fgTransform} = computePanelTransforms(nationalId, true);

  var targetBackground = detailView.querySelector('.detail-view-bg');
  var targetForeground = detailView.querySelector('.detail-view-fg');
  var detailSprite = detailView.querySelector('.detail-sprite');
  detailSprite.style.transform = '';
  targetBackground.style.transform = '';
  targetForeground.style.transform = '';

  requestAnimationFrame(() => {
    // go go go!
    targetForeground.classList.add('animating');
    targetBackground.classList.add('animating');
    detailSprite.classList.add('animating');
    detailSprite.style.transform = spriteTransform;
    targetBackground.style.transform = bgTransform;
    targetForeground.style.transform = fgTransform;
  });

  function onAnimEnd() {
    console.log('done animating');
    targetForeground.classList.remove('animating');
    targetBackground.classList.remove('animating');
    detailSprite.classList.remove('animating');
    detailSprite.style.transform = '';
    targetBackground.style.transform = '';
    targetForeground.style.transform = '';
    detailViewContainer.classList.add('hidden');
    themeMeta.content = appTheme;
    detailSprite.removeEventListener('transitionend', onAnimEnd);
  }

  detailSprite.addEventListener('transitionend', onAnimEnd);
}

function init() {
  detailView = $('#detail-view');
  detailViewContainer = $('#detail-view-container');
  monstersList = $('#monsters-list');
  detailPanel = $('.detail-panel');
  headerAppBar = $('.mui-appbar');
  themeMeta = document.head.querySelector('meta[name="theme-color"]');
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
  var detailSprite = detailView.querySelector('.detail-sprite');
  var dimens = screenWidth + '_' + screenHeight;
  result = dimensToSpriteRect[dimens] = detailSprite.getBoundingClientRect();
  return result;
}

document.addEventListener('DOMContentLoaded', init);

window.addEventListener('resize', onResize);

function animateBackgroundIn(nationalId) {
  requestAnimationFrame(() => _animateBackgroundIn(nationalId));
}

function animatePanelIn(nationalId, themeColor) {
  /*
  requestAnimationFrame(() => _animatePanelIn(nationalId, themeColor));
  */
}

function animateOut(nationalId, themeColor) {
  /*
  requestAnimationFrame(() => _animateOut(nationalId, themeColor));
  */
}

module.exports = {
  animateBackgroundIn,
  animatePanelIn,
  animateOut
};