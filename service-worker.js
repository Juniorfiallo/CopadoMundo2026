const CACHE_NAME = "copa-2026-premium-v7-0-0";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./data/data.js",
  "./assets/logo-oficial.png",
  "./assets/we-are-26.png",
  "./assets/worldcup-2026-art.png",
  "./assets/mascotes-officiais.png",
  "./assets/bola-oficial.png",
  "./assets/copa-groups-background.png",
  "./assets/brasil-rumo-ao-hexa.jpg",
  "./assets/cazetv-logo.png",
  "./assets/scorer-ousmane-dembele.jpg",
  "./assets/scorer-deniz-undav.jpg",
  "./assets/scorer-erling-haaland.jpg",
  "./assets/scorer-harry-kane.jpg",
  "./assets/scorer-ismaila-sarr.jpg",
  "./assets/scorer-johan-manzambi.jpg",
  "./assets/scorer-julian-quinones.jpg",
  "./assets/scorer-mikel-oyarzabal.jpg",
  "./assets/scorer-cristiano-ronaldo.jpg",
  "./assets/scorer-folarin-balogun.jpg",
  "./assets/scorer-ismael-saibari.jpg",
  "./assets/scorer-jonathan-david.jpg",
  "./assets/scorer-matheus-cunha.jpg",
  "./assets/scorer-kylian-mbappe.jpg",
  "./assets/scorer-lionel-messi.jpg",
  "./assets/scorer-vinicius-junior.jpg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/bracket_engine.wasm"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin || requestUrl.pathname.startsWith("/.netlify/functions/")) {
    event.respondWith(fetch(event.request, { cache: "no-store" }));
    return;
  }
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => caches.match("./index.html")));
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      return response;
    }).catch(() => cached))
  );
});
