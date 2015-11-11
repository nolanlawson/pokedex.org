var worker = require('./../shared/worker');
var createElement = require('virtual-dom/create-element');
var fromJson = require('vdom-as-json/fromJson');

function onShowModal(message) {
  var modal = createElement(fromJson(JSON.parse(message.modal)));
  modal.style.opacity = 0;
  var modalContainer = document.createElement('div');
  modalContainer.appendChild(modal);
  mui.overlay('on', {
    static: true
  }, modalContainer);

  function show() {
    requestAnimationFrame(() => {
      modal.style.transform = `translateY(${window.innerHeight}px)`;
      modal.style.opacity = 1;

      requestAnimationFrame(() => {
        // go go go
        modal.classList.add('animating');
        modal.style.transform = '';
      });

      modal.addEventListener('transitionend', function listener() {
        modal.classList.remove('animating');
        modal.removeEventListener('transitionend', listener);
      });
    });
  }

  function hide() {
    requestAnimationFrame(() => {
      modal.style.transform = '';

      requestAnimationFrame(() => {
        // go go go
        modal.classList.add('animating');
        modal.style.transform = `translateY(${window.innerHeight + 200}px)`;
      });

      modal.addEventListener('transitionend', function listener() {
        modal.classList.remove('animating');
        modal.removeEventListener('transitionend', listener);
        mui.overlay('off');
      });
    });
  }

  modalContainer.addEventListener('click', hide);
  setTimeout(show, 200); // delay for the overlay to show first
}

worker.addEventListener('message', e => {
  if (e.data.type === 'modal') {
    onShowModal(e.data);
  }
});