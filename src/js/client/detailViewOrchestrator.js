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

function showDetail() {
  document.body.style.overflowY = 'hidden'; // disable scrolling
  detailPanel.style.overflowY = 'auto'; // re-enable overflow on the panel
  detailViewContainer.classList.remove('hidden');
}

function hideDetail() {
  document.body.style.overflowY = 'visible'; // re-enable scrolling
  detailPanel.scrollTop = 0; // scroll panel to top, disable scrolling during animation
  detailPanel.style.overflowY = 'visible';
}

function computeTransforms(nationalId, outAnimation) {
  console.time('computeTransforms()');
  var sourceSprite = monstersList.querySelector(`.sprite-${nationalId}`);
  var sourceTitleSpan = sourceSprite.parentElement.querySelector('span');

  // reeeaaally fling it away when animating out. looks better
  var slideInY = outAnimation ? screenHeight * 1.1 : screenHeight * 0.6;

  var sourceSpriteRect = sourceSprite.getBoundingClientRect();
  var detailSpriteRect = getDetailSpriteRect();
  var spanStyle = getComputedStyle(sourceTitleSpan);
  var sourceTitleSpanHeight = parseInt(spanStyle.height.replace('px', ''));

  var spriteChangeX = sourceSpriteRect.left - detailSpriteRect.left;
  var spriteChangeY = (sourceSpriteRect.top - detailSpriteRect.top) - slideInY;

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

function animateIn(nationalId, themeColor) {
  showDetail();
  var {bgTransform, spriteTransform, fgTransform} = computeTransforms(nationalId, false);
  var targetBackground = detailView.querySelector('.detail-view-bg');
  var targetForeground = detailView.querySelector('.detail-view-fg');
  var detailSprite = detailView.querySelector('.detail-sprite');

  detailSprite.style.transform = spriteTransform;
  targetBackground.style.transform = bgTransform;
  targetForeground.style.transform = fgTransform;

  requestAnimationFrame(() => {
    // go go go!
    targetForeground.classList.add('animating');
    targetBackground.classList.add('animating');
    detailSprite.classList.add('animating');
    targetForeground.style.transform = '';
    targetBackground.style.transform = '';
    detailSprite.style.transform = '';
  });

  function onAnimEnd() {
    console.log('done animating');
    targetForeground.classList.remove('animating');
    targetBackground.classList.remove('animating');
    detailSprite.classList.remove('animating');
    themeMeta.content = themeColor;
    // this peeks out on android, looks less weird with the right color
    headerAppBar.style.backgroundColor = themeColor;

    detailSprite.removeEventListener('transitionend', onAnimEnd);
  }

  detailSprite.addEventListener('transitionend', onAnimEnd);
}

function animateOut(nationalId) {
  hideDetail();
  headerAppBar.style.backgroundColor = appTheme;
  var {bgTransform, spriteTransform, fgTransform} = computeTransforms(nationalId, true);

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

function getPrecomputedDetailSpriteRect() {
  var dimens = screenWidth + '_' + screenHeight;
  return dimensToSpriteRect[dimens];
}

function getDetailSpriteRect() {
  // the size/location of the target sprite is fixed given the window size,
  // so we can just cache it and avoid the expensive getBoundingClientRect()
  var result = getPrecomputedDetailSpriteRect();
  if (result) {
    return result;
  }
  var detailSprite = detailView.querySelector('.detail-sprite');
  var dimens = screenWidth + '_' + screenHeight;
  result = dimensToSpriteRect[dimens] = detailSprite.getBoundingClientRect();
  return result;
}

// while the worker is running, precompute as much as possible.
// in this case that just means the detail sprite
function precompute() {
  if (getPrecomputedDetailSpriteRect()) {
    return;
  }
  requestAnimationFrame(() => {
    showDetail();
    getDetailSpriteRect();
    hideDetail();
    detailViewContainer.classList.add('hidden');
  });
}

document.addEventListener('DOMContentLoaded', init);

window.addEventListener('resize', onResize);

module.exports = {
  animateIn,
  animateOut,
  precompute
};