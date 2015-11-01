// animate between the list view and the detail view, using FLIP animations
// https://aerotwist.com/blog/flip-your-animations/

var $ = document.querySelector.bind(document);

var detailView;
var detailViewContainer;
var detailPanel;
var header;
var monstersList;
var themeMeta;
var appTheme;

var screenWidth = window.innerWidth;
var screenHeight = window.innerHeight;

function computeTransforms(nationalId, outAnimation) {
  console.time('computeTransforms()');
  var sourceSprite = monstersList.querySelector(`.sprite-${nationalId}`);
  var sourceTitleSpan = sourceSprite.parentElement.querySelector('span');
  var targetSprite = detailView.querySelector('.detail-sprite');

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

function animateIn(nationalId, themeColor) {
  document.body.style.overflowY = 'hidden'; // disable scrolling
  detailPanel.style.overflowY = 'auto'; // re-enable overflow on the panel
  detailViewContainer.classList.remove('hidden');

  var {bgTransform, spriteTransform, fgTransform} = computeTransforms(nationalId, false);
  var targetBackground = detailView.querySelector('.detail-view-bg');
  var targetForeground = detailView.querySelector('.detail-view-fg');
  var targetSprite = detailView.querySelector('.detail-sprite');

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

function animateOut(nationalId) {
  document.body.style.overflowY = 'initial'; // re-enable scrolling
  detailPanel.scrollTop = 0; // scroll panel to top, disable scrolling during animation
  detailPanel.style.overflowY = 'initial';
  var {bgTransform, spriteTransform, fgTransform} = computeTransforms(nationalId, true);

  var targetBackground = detailView.querySelector('.detail-view-bg');
  var targetForeground = detailView.querySelector('.detail-view-fg');
  var targetSprite = detailView.querySelector('.detail-sprite');
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
    themeMeta.content = appTheme;
    targetSprite.removeEventListener('transitionend', onAnimEnd);
  }

  targetSprite.addEventListener('transitionend', onAnimEnd);
}

function init() {
  detailView = $('#detail-view');
  detailViewContainer = $('#detail-view-container');
  monstersList = $('#monsters-list');
  detailPanel = $('.detail-panel');
  header = $('#header');
  themeMeta = document.head.querySelector('meta[name="theme-color"]');
  appTheme = themeMeta.content;
}

function onResize() {
  // these are expensive to compute, so only compute when the window is resized
  screenWidth = window.innerWidth;
  screenHeight = window.innerHeight;
}

document.addEventListener('DOMContentLoaded', init);

window.addEventListener('resize', onResize);

module.exports = {
  animateIn,
  animateOut
};