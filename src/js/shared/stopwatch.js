function Stopwatch() {
  this.startTime = Date.now();
  this.lastTime = this.startTime;
}

Stopwatch.prototype.time = function (str) {
  var newTime = Date.now();
  console.log(str, 'took ' + (newTime - this.lastTime) + 'ms');
  this.lastTime = newTime;
};

Stopwatch.prototype.totalTime = function (str) {
  console.log(str, 'took ' + (Date.now() - this.startTime) + 'ms');
};

module.exports = Stopwatch;