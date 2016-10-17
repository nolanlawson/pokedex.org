var PseudoWorker = require('pseudo-worker');
import utils from './../main/utils';

var theWorker;

if (utils.hasWebWorkerIDB()) {
  theWorker = new Worker('js/worker.js');
} else {
  // for Safari, just use PouchDB+WebSQL without a web worker, because of
  // https://bugs.webkit.org/show_bug.cgi?id=149953
  theWorker = new PseudoWorker('js/worker.js');
}

theWorker.addEventListener('error', (e) => {
  console.warn('worker threw an error', e.error);
});

// in Edge, the web worker can't learn its own origin
// https://connect.microsoft.com/IE/feedback/details/2059173/
theWorker.postMessage({
  origin: window.location.origin,
  type: 'origin'
});

export default theWorker;