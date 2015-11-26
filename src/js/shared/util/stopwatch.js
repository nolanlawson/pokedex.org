function Stopwatch(str) {
  this.startTime = Date.now();
  this.name = str;
  this.lastStart = str;
  console.time(str + ' (total)');
}

Stopwatch.prototype.start = function(str) {
  this.lastStart = str;
  console.time(str);
};

Stopwatch.prototype.time = function (str) {
  console.timeEnd(this.lastStart);
  this.lastStart = str;
};

Stopwatch.prototype.totalTime = function () {
  console.timeEnd(this.lastStart);
  console.timeEnd(this.name + ' (total)');
};

module.exports = Stopwatch;
