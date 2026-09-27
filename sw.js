/* Keeps the game installable and gives it something to show if someone opens it with no
   signal. Deliberately network-first, not cache-first: whenever there's a connection it always
   fetches the latest copy, so nobody gets stuck on an old version after an update. The cache is
   only ever a fallback for when the network request fails. */
var CACHE_NAME = "obscurity-league-shell";

self.addEventListener("install", function (e) {
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; })
            .map(function (k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var url = new URL(e.request.url);
  if (url.origin !== location.origin) return;   // let Firebase, fonts, etc. go straight to network

  e.respondWith(
    fetch(e.request)
      .then(function (resp) {
        if (resp && resp.ok) {
          var copy = resp.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(e.request, copy); });
        }
        return resp;
      })
      .catch(function () { return caches.match(e.request); })
  );
});
