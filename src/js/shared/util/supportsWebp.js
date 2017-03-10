/* global Image */

var Promise = require('./promise');

module.exports = new Promise(resolve => {
  var img = new Image();
  img.onerror = () => resolve(false);
  img.onload = () => resolve(true);
  // 1x1 black pixel
  img.src = 'data:image/webp;base64,' +
    'UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAgA0JaQAA3AA/vv9UAA';
});
