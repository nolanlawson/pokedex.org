module.exports = {
  hasWebWorkerIDB: () => {
    // this test is basically "are we running in Safari", which doesn't
    // support IndexedDB very well, and not at all in a web worker
    var isSafari = typeof openDatabase !== 'undefined' &&
      /(Safari|iPhone|iPad|iPod)/.test(navigator.userAgent) &&
      !/Chrome/.test(navigator.userAgent) &&
      !/BlackBerry/.test(navigator.platform);
    return !isSafari;
  },
  canRunHighPerfAnims: () => {
    // force setting via highPerfAnims query parameter (0/1)
    var force = window.location.search.match(/highPerfAnims=(\d)/);
    if (force) {
      return (force[1] === "1");
    }

    // it is a pretty safe assumption that android 4 devices are not
    // running on great hardware. this is an inexact metric, but it
    // ought to be pretty safe for the time being

    // firefox does not run concurrent animations well

    // nor does IE sadly
    
    return !navigator.userAgent.match(/(?:Android 4\.|Firefox|MSIE)/);
  }
};
