// load sprites.css asynchronously

var supportsWebp = require('../shared/util/supportsWebp');
var constants = require('../shared/util/constants');
var numSpriteCssFiles = constants.numSpriteCssFiles;

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

var hasWebp = supportsWebp();
for (var i = 1; i <= numSpriteCssFiles; i++) {
  if (hasWebp) {
    loadCssAsync(`css/sprites-webp-${i}.css`);
  } else {
    loadCssAsync(`css/sprites-${i}.css`);
  }
}