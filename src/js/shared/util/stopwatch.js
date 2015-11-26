function Stopwatch(str) {
  this.startTime = Date.now();
  this.lastStart = str;
  console.time(str);
}

Stopwatch.prototype.time = function (str) {
  console.timeEnd(this.lastStart);
  this.lastStart = str;
  this.lastTime = Date.now();
};

Stopwatch.prototype.totalTime = function (str) {
  console.timeEnd(this.lastStart);
  console.log(str, 'took ' + (Date.now() - this.startTime) + 'ms');
};

module.exports = Stopwatch;
