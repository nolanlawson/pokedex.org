var keyValueStore = require('../shared/db/keyValueStore');
var supportsWebp = require('../shared/util/supportsWebp');
var semver = require('semver');

function onFirstLoad() {
  // the very first activation!
  // tell the user stuff works offline
  console.log('sw ready to work offline');
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

  keyValueStore.get('active-version').then(activeVersion => {
    // activeVersion is undefined for sw-null
    // if the main version has changed, bail
    if (activeVersion &&
      semver.parse(activeVersion).major !== semver.parse(self.version).major) {
      return;
    }
    console.log('activeVersion', activeVersion);
  }).catch(console.log.bind(console));
}

function onStateChange(newWorker) {
  if (newWorker.state == 'activated') {
    if (!navigator.serviceWorker.controller) {
      onFirstLoad();
    } else {
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
if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', {
    scope: './'
  }).then(registration => {
    registration.addEventListener('updatefound', () => onUpdateFound(registration));
  });
}