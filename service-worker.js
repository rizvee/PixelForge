const CACHE_NAME = 'pixelforge-v1';
const ASSETS = [
  './',
  './index.html',
  './css/global.css',
  './js/global.js'
  // Note: For a fully offline PWA we would list all HTML/JS/CSS files here,
  // but for the sake of simplicity and lazy loading, we'll cache them as they are requested.
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => console.log('Asset caching error during PWA install:', err));
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Return cached response if found
      if (response) {
        return response;
      }
      
      // Otherwise fetch from network
      return fetch(event.request).then(
        function(response) {
          // Check if we received a valid response
          if(!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response because it's a stream and can only be consumed once
          var responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(function(cache) {
                // Ignore caching unsupported themes or POST requests
                if(event.request.method === 'GET') {
                  cache.put(event.request, responseToCache);
                }
            });

          return response;
        }
      );
    })
  );
});

self.addEventListener('activate', event => {
  const cacheAllowlist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheAllowlist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
