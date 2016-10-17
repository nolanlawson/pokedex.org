var $ = require('./jqueryLite');

var mask;

function init() {
  mask = mask || $('#progress-mask');
}

function Progress() {
}

Progress.prototype.start = function () {
  init();
  mask.classList.add('shown');
};

Progress.prototype.end = function () {
  init();
  mask.classList.remove('shown');
};

module.exports = new Progress();