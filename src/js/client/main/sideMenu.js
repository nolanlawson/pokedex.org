var worker = require('./../shared/worker');
var $ = require('./jqueryLite');

document.addEventListener('DOMContentLoaded', () => {
  var sideDrawer = $('#sidedrawer');

  function showSidedrawer() {
    // show overlay
    var options = {
      static: true
    };

    var overlay = mui.overlay('on', options);

    // show element
    overlay.appendChild(sideDrawer);
    // wait for side menu to fade out
    setTimeout(() => sideDrawer.classList.add('active'), 200);

    overlay.addEventListener('click', hideSidedrawer);
  }

  function hideSidedrawer() {
    document.body.appendChild(sideDrawer);
    requestAnimationFrame(() => {
      sideDrawer.classList.remove('active');
      setTimeout(() => {
        document.body.classList.toggle('hide-sidedrawer');

        if ($('#mui-overlay')) {
          mui.overlay('off');
        }
      }, 200);
    });
  }

  function toggleSidedrawer() {
    document.body.classList.toggle('hide-sidedrawer');
    worker.postMessage({
      type: 'viewportChanged'
    });
  }

  $('.js-show-sidedrawer').addEventListener('click', showSidedrawer);
  $('.js-hide-sidedrawer').addEventListener('click', toggleSidedrawer);

  $('#pokemon-link').addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    if ($('#mui-overlay')) {
      hideSidedrawer();
    }
  });
});