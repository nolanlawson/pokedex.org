var worker = new Worker('js/worker.js');

worker.addEventListener('error', (e) => {
  console.warn('worker threw an error', e.error);
});

module.exports = worker;