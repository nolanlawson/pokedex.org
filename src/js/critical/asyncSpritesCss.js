// load sprites.css asynchronously

var supportsWebp = require('../shared/util/supportsWebp');

function loadCssAsync(filename) {
  var ss = document.createElement('link');
  ss.rel = 'stylesheet';
  ss.href = filename;
  // temporary non-applicable media query to load it async
  ss.media = 'only foo';
  document.body.appendChild(ss);
  // set media back
  setTimeout(function () {
    ss.media = 'all';
  });
}

if (supportsWebp()) {
  loadCssAsync('css/sprites-webp1.css');
  loadCssAsync('css/sprites-webp2.css');
  loadCssAsync('css/sprites-webp3.css');
} else {
  loadCssAsync('css/sprites1.css');
  loadCssAsync('css/sprites2.css');
  loadCssAsync('css/sprites3.css');
}