var keyValueStore = require('../shared/db/keyValueStore');
var semver = require('semver');

function onUpdateFound(registration) {
  var newWorker = registration.installing;

  registration.installing.addEventListener('statechange', function () {
    // the very first activation!
    // tell the user stuff works offline
    if (newWorker.state == 'activated' && !navigator.serviceWorker.controller) {
      console.log('ready to work offline');
      return;
    }

    if (newWorker.state == 'installed' && navigator.serviceWorker.controller) {

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
  });
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