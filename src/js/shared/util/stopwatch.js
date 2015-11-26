function Stopwatch(str) {
  this.startTime = Date.now();
  this.name = str;
  this.lastStart = str;
  console.time(str);
  console.time(str + ' - total');
}

Stopwatch.prototype.time = function (str) {
  console.timeEnd(this.lastStart);
  this.lastStart = str;
  this.lastTime = Date.now();
};

Stopwatch.prototype.totalTime = function (str) {
  console.timeEnd(this.lastStart);
  console.timeEnd(this.name + ' - total');
};

module.exports = Stopwatch;
