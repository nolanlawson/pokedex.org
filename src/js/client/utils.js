module.exports = {
  hasWebWorkerIDB: () => {
    // this test is basically "are we running in Safari", which doesn't
    // support IndexedDB very well, and not at all in a web worker
    var isSafari = typeof openDatabase !== 'undefined' &&
      /(Safari|iPhone|iPad|iPod)/.test(navigator.userAgent) &&
      !/Chrome/.test(navigator.userAgent) &&
      !/BlackBerry/.test(navigator.platform);
    return !isSafari;
  }
};