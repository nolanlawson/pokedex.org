var worker = require('./worker');
var createElement = require('virtual-dom/create-element');
var fromJson = require('vdom-as-json/fromJson');

function onShowModal(message) {
  var modal = createElement(fromJson(JSON.parse(message.modal)));
  var modalEl = document.createElement('div');
  modalEl.appendChild(modal);
  mui.overlay('on', {
    static: false
  }, modalEl);

  modalEl.addEventListener('click', () => {
    mui.overlay('off');
  });
}

worker.addEventListener('message', e => {
  if (e.data.type === 'modal') {
    onShowModal(e.data);
  }
});