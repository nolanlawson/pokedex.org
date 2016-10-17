var keyValueStore = require('../../shared/db/keyValueStore');
var supportsWebp = require('../../shared/util/supportsWebp');
var worker = require('./../shared/worker');

function onFirstLoad() {
  console.log('sw ready to work offline');
  // the very first activation!
  // tell the user stuff works offline
  keyValueStore.get('informedOffline').then(informed => {
    if (informed) {
      return;
    }

    worker.postMessage({
      type: 'toast',
      toast: {
        text: 'Ready to work offline.',
        buttonText: 'MORE INFO'
      },
      modal: {
        title: 'Pokedex.org works offline.',
        text: "" +
        "That's right, a website that works offline! " +
        "You can also choose \"Add to Home Screen\" for an app icon.",
        buttonText: 'OK, COOL'
      }
    });
    return keyValueStore.set('informedOffline', true);
  }).catch(err => console.log(err));

}

function onClaimed() {
  console.log('sw claimed');
  navigator.serviceWorker.controller.postMessage({
    type: 'supportsWebp',
    value: supportsWebp()
  });
}

function onInstalled() {
  console.log('sw installed');
}

function onStateChange(newWorker) {
  if (newWorker.state == 'activated') {
    onFirstLoad();
    if (navigator.serviceWorker.controller) {
      onClaimed();
    }
  } else if (newWorker.state == 'installed' && navigator.serviceWorker.controller) {
    onInstalled();
  }
}

function onUpdateFound(registration) {
  var newWorker = registration.installing;

  registration.installing.addEventListener('statechange',
    () => onStateChange(newWorker));
}

// disable service worker while debugging
console.log('mode:', process.env.NODE_ENV);
if (process.env.NODE_ENV !== 'testing' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', {
    scope: './'
  }).then(registration => {
    registration.addEventListener('updatefound', () => onUpdateFound(registration));
  });
}