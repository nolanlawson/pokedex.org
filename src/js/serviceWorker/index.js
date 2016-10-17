import 'regenerator-runtime/runtime';
import 'serviceworker-cache-polyfill';
import semver from '../shared/util/semverLite';
import keyValueStore from '../shared/db/keyValueStore';
import { numSpriteCssFiles } from '../shared/util/constants';
import range from 'lodash/utility/range';
import { version } from '../../../package.json';

var staticContent = [
  '/',
  // TODO: shouldn't have to download twice, but this works considering manifest.json
  '/index.html?launcher=true',
  '/js/worker.js',
  '/js/main.js',
  '/manifest.json',
  '/favicon.ico',
  '/img/icon-48.png',
  '/img/icon-96.png',
  '/img/icon-144.png',
  '/img/icon-196.png'
];

if (process.env.NODE_ENV === 'development') {
  staticContent = staticContent.concat([
    '/vendor/mui.js',
    '/vendor/mui.css',
    '/css/style.css',
    '/js/critical.js',
    '/svg/search.svg',
    '/svg/search-active.svg',
    '/svg/ic_arrow_back_36px.svg'
  ]);
}

var webpContent = range(numSpriteCssFiles).map(i => `/css/sprites-webp-${i + 1}.css`);
var nonWebpContent = range(numSpriteCssFiles).map(i => `/css/sprites-${i + 1}.css`);

self.addEventListener('install', function install (event) {
  console.log('install');
  event.waitUntil((async () => {
    var activeVersionPromise = keyValueStore.get('active-version');
    var cache = await caches.open('pokedex-static-' + version);

    await cache.addAll(staticContent);

    var activeVersion = await activeVersionPromise;

    if ((!activeVersion ||
        semver.parse(activeVersion).major === semver.parse(version).major) &&
        self.skipWaiting) {
      self.skipWaiting();
      console.log('skipWaiting()');
    }
  })());
});

self.onmessage = async function onmessage (event) {
  console.log('got message', event.data);
  if (event.data.type === 'supportsWebp') {
    var supportsWebp = event.data.value;
    var cache = await caches.open('pokedex-static-' + version);
    await cache.addAll(supportsWebp ? webpContent : nonWebpContent);
  }
};

var expectedCaches = [
  'pokedex-static-' + version
];

self.addEventListener('activate', function(event) {
  console.log('activate');
  event.waitUntil((async () => {
    // activate right now
    await self.clients.claim();
    // remove caches beginning "pokedex-static-" that aren't in expectedCaches
    var cacheNames = await caches.keys();
    console.log('cacheNames', cacheNames);
    for (var cacheName of cacheNames) {
      if (!/^pokedex-static-/.test(cacheName)) {
        continue;
      }
      if (expectedCaches.indexOf(cacheName) == -1) {
        console.log('deleting', cacheName);
        await caches.delete(cacheName);
      }
    }

    await keyValueStore.set('active-version', version);
  })());
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(r => r || fetch(event.request))
  );
});
