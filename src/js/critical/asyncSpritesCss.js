// load sprites.css asynchronously

var supportsWebp = require('../shared/util/supportsWebp');
var constants = require('../shared/util/constants');
var numSpriteCssFiles = constants.numSpriteCssFiles;

function loadCssAsync(filename) {
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = filename;
  // temporary non-applicable media query to load it async
  link.media = 'only foo';
  document.body.appendChild(link);
  // set media back
  setTimeout(function () {
    link.media = 'all';
  });
  return link;
}

// Load the sprites in a waterfall, because we don't want them to block
// other HTTP requests; they're not *that* important.

var hasWebp = supportsWebp();
var i = 1;

function loop() {
  if (i > numSpriteCssFiles) {
    return; // done
  }
  var filename = hasWebp ? `css/sprites-webp-${i}.css` : `css/sprites-${i}.css`;
  var link = loadCssAsync(filename);
  i++;
  link.onload = loop;
}

loop();