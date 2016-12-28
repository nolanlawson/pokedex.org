var marky = require('marky');

function Stopwatch(str) {
  this.startTime = Date.now();
  this.name = str;
  this.lastStart = str;
  marky.mark(str + ' (total)');
}

Stopwatch.prototype.start = function(str) {
  this.lastStart = str;
  marky.mark(str);
};

Stopwatch.prototype.time = function (str) {
  marky.stop(this.lastStart);
  marky.mark(str);
  this.lastStart = str;
};

Stopwatch.prototype.totalTime = function () {
  marky.stop(this.lastStart);
  marky.stop(this.name + ' (total)');
};

module.exports = Stopwatch;
