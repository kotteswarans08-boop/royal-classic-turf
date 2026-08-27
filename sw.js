// Royal Classic Turf — Service Worker
// Caches the app shell only. Slot/booking data always comes live
// from the backend (Google Apps Script), never from cache.

const CACHE_NAME = 'royal-classic-turf-v2';

// Only same-origin files are precached. The logo and Google Fonts are
// loaded live over the network (with normal browser HTTP caching) —
// precaching cross-origin images can make the install step fail if
// the host briefly blocks a CORS preflight.
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never cache API calls to Google Apps Script — always go live.
  if (url.hostname.includes('script.google.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // App shell (same-origin): cache-first, fall back to network.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
    return;
  }

  // Everything else (logo, fonts, etc.): network-first, no precache dependency.
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
