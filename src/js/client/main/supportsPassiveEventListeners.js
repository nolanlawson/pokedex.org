'use strict';

// stolen from Modernizr
var supportsPassiveOption = false;

try {
  var opts = Object.defineProperty({}, 'passive', {
    get: function() {
      supportsPassiveOption = true;
    }
  });
  window.addEventListener('test', null, opts);
} catch (e) {}

module.exports = supportsPassiveOption;