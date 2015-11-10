// Mostly ripped from mui.js. the problem with their version was it
// was adding way too many event listeners, which was dragging scroll
// performance down to a crawl.

var rippleClass = 'mui-ripple-effect';

module.exports = function eventHandler(ev, buttonEl, xOffset, yOffset) {
  // only left clicks
  if (ev.button !== 0) {
    return;
  }

  // exit if button is disabled
  if (buttonEl.disabled === true) {
    return;
  }

  var rippleEl = document.createElement('div');
  rippleEl.className = rippleClass;

  // get height
  var rect = buttonEl.getBoundingClientRect();
  var diameter = rect.height;

  var radius = diameter / 2;

  rippleEl.style.height = diameter + 'px';
  rippleEl.style.width = diameter + 'px';
  rippleEl.style.top = (yOffset - radius) + 'px';
  rippleEl.style.left = (xOffset - radius) + 'px';

  buttonEl.appendChild(rippleEl);

  window.setTimeout(function() {
    buttonEl.removeChild(rippleEl);
  }, 2000);
};