var PseudoWorker = require('./pseudoworker');
var utils = require('./utils');

var worker;

if (utils.hasWebWorkerIDB()) {
  worker = new Worker('js/worker.js');
} else {
  // for Safari, just use PouchDB+WebSQL without a web worker
  worker = new PseudoWorker('js/worker.js');
}

worker.addEventListener('error', (e) => {
  console.warn('worker threw an error', e.error);
});

// in safari the web worker can't learn its own origin
worker.postMessage({
  origin: window.location.origin,
  type: 'origin'
});

module.exports = worker;