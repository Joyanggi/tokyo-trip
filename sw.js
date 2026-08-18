/* 도쿄 여행 안내문 — 오프라인 캐시 (네트워크 우선, 실패 시 캐시) */
var CACHE = 'tokyo-trip-v98';

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll([
      './', './index.html',
      './assets/style.css', './assets/app.js', './assets/duo.png',
      './assets/map.js', './assets/route-data.js',
      './assets/leaflet.js', './assets/leaflet.css',
      './pages/plan.html', './pages/buy.html', './pages/eat.html',
      './pages/go.html', './pages/trip.html', './pages/local.html',
      './pages/money.html'
    ]);
  }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (url.origin !== location.origin) return; /* 외부 이미지 등은 그대로 네트워크 */
  e.respondWith(
    fetch(e.request).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      return res;
    /* 오프라인: ?v=N 캐시버스팅 쿼리는 무시하고 매칭해야 프리캐시본을 찾는다 */
    }).catch(function () { return caches.match(e.request, { ignoreSearch: true }); })
  );
});
