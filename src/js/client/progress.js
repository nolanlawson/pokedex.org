function Progress() {
}

var $ = document.querySelector.bind(document);

Progress.prototype.start = function () {
  $('#progress-mask').classList.add('shown');
};

Progress.prototype.end = function () {
  $('#progress-mask').classList.remove('shown');
};

module.exports = new Progress();