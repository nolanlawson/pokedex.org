var worker = require('./../shared/worker');
var createElement = require('virtual-dom/create-element');
var fromJson = require('vdom-as-json/fromJson');

var TOAST_SHOW_TIME = 10000;

function onToast(message) {
  var toast = createElement(fromJson(JSON.parse(message.toast)));
  var hideTimeout;
  document.body.appendChild(toast);

  function hideToast() {
    clearTimeout(hideTimeout);
    requestAnimationFrame(() => {
      toast.style.opacity = 0;
      toast.addEventListener('transitionend', function () {
        document.body.removeChild(toast);
      });
    });
  }

  toast.addEventListener('click', e => {
    if (e.target.tagName === 'BUTTON') {
      worker.postMessage({
        type: 'modal',
        modal: message.modal
      });
      hideToast();
    }
  });

  requestAnimationFrame(() => {
    toast.style.opacity = 1;
    hideTimeout = setTimeout(hideToast, TOAST_SHOW_TIME);
  });
}

worker.addEventListener('message', e => {
  if (e.data.type === 'toast') {
    onToast(e.data);
  }
});