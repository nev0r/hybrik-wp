/* Keep one complete app version available offline, including on GitHub Pages. */
const CACHE_PREFIX = 'hybridwk-';
const CACHE = `${CACHE_PREFIX}v4-shell-20261125-r2`;
const ASSETS = [
  './index.html',
  './base.css',
  './redesign.css',
  './data-core.js',
  './training-core.js',
  './app.js',
  './manifest.webmanifest',
  './icon-180.png',
  './icon-512.png'
];
const SCOPE = self.registration.scope;
const INDEX = new URL('./index.html', SCOPE).href;
const SHELL = new Set(ASSETS.map(asset => new URL(asset, SCOPE).href));

self.addEventListener('install', event => {
  // addAll is atomic: a missing dependency must fail this installation.
  // An update activates naturally after the previous app windows are closed.
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE)
        .map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (!url.href.startsWith(SCOPE)) return;

  if (request.mode === 'navigate') {
    event.respondWith(caches.open(CACHE).then(async cache =>
      (await cache.match(INDEX)) || fetch(request)
    ));
    return;
  }

  if (SHELL.has(url.href)) {
    // Missing CSS, scripts and icons retain their own network response/error.
    // Returning index.html here would break execution and conceal real failures.
    event.respondWith(caches.open(CACHE).then(async cache =>
      (await cache.match(request)) || fetch(request)
    ));
  }
});
