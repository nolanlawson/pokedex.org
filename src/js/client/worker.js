var PseudoWorker = require('./pseudoworker');

var worker = new PseudoWorker('js/worker.js');

worker.addEventListener('error', (e) => {
  console.warn('worker threw an error', e.error);
});

// in safari the web worker can't learn its own origin
worker.postMessage({
  origin: window.location.origin,
  type: 'origin'
});

module.exports = worker;