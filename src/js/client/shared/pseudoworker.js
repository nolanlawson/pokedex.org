// This pseudoworker is for performance testing only.
// The goal is to run a worker *without* a worker, to see the impact
// on the UI thread.

function PseudoWorker(script) {
  this.messageListeners = [];
  this.errorListeners = [];
  this.postMessageListeners = [];

  var that = this;

  var xhr = new XMLHttpRequest();
  xhr.open('GET', script, true);

  xhr.onload = function () {
    if (xhr.status >= 200 && xhr.status < 400) {
      var data = xhr.responseText;
      that.__scriptData = data;
      var self = {
        messageListeners: [],
        postMessage: function (msg) {
          that.messageListeners.forEach(function(listener) {
            listener({
              data: msg
            });
          });
        },
        addEventListener: function (type, fun) {
          if (type === 'message') {
            self.messageListeners.push(fun);
          }
        }
      };
      (function () {
        eval(that.__scriptData);
      }).call(window);
      that.__workerSelf = self;
      while (that.postMessageListeners.length) {
        that.runPostMessage(that.postMessageListeners.pop());
      }
    }
  };

  xhr.send();
}

PseudoWorker.prototype.addEventListener = function(type, fun) {
  if (type === 'message') {
    this.messageListeners.push(fun);
  } else if (type === 'error') {
    this.errorListeners.push(fun);
  }
};

PseudoWorker.prototype.postMessage = function(msg) {
  var that = this;
  if (!that.__scriptData) {
    that.postMessageListeners.push(msg);
    return;
  }
  that.runPostMessage(msg);
};

PseudoWorker.prototype.runPostMessage = function (msg) {
  var that = this;
  that.__workerSelf.messageListeners.forEach(function (listener) {
    listener({data: msg});
  });
};

module.exports = PseudoWorker;