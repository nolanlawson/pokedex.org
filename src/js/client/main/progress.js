var $ = document.querySelector.bind(document);

var spinner;
var mask;

function init() {
  spinner = spinner || $('#monsters-list-spinner');
  mask = mask || $('#progress-mask');
}

function Progress() {
}

Progress.prototype.start = function (appendingToListEnd) {
  init();
  if (appendingToListEnd) {
    spinner.classList.add('shown');
  } else { // filtering
    mask.classList.add('shown');
  }
};

Progress.prototype.end = function () {
  init();
  mask.classList.remove('shown');
  spinner.classList.remove('shown');
};

module.exports = new Progress();