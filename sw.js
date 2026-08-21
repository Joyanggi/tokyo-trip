/* 도쿄 여행 안내문 — 오프라인 캐시
   현지에서 데이터가 안 터지는 상황이 기본 전제라, 캐시를 먼저 쓰고 네트워크는 보조로만 쓴다.
   이전 버전은 네트워크 우선이라, 신호가 죽은 곳에서 fetch 가 실패가 아니라 '한참 매달리는'
   바람에 캐시본이 있어도 화면이 안 열렸다. */
var CACHE = 'tokyo-trip-v141';

/* 앱 껍데기 — 이 목록만 있으면 오프라인에서 모든 탭이 열린다 */
var PRECACHE = [
  './', './index.html',
  './pages/plan.html', './pages/buy.html', './pages/eat.html',
  './pages/go.html', './pages/money.html',
  './assets/style.css', './assets/app.js', './assets/map.js', './assets/route-data.js',
  './assets/duo.png',
  './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'
];

/* 네트워크를 이만큼 기다려도 답이 없으면 캐시로 넘어간다 */
var NET_TIMEOUT = 2500;

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      /* addAll 은 하나만 실패해도 전체가 취소된다 — 개별로 담아서 한 파일 때문에
         앱 껍데기 전체가 비는 일이 없게 한다. */
      return Promise.all(PRECACHE.map(function (u) {
        return c.add(new Request(u, { cache: 'reload' })).catch(function () { /* 개별 실패는 넘긴다 */ });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; })
                             .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function fromCache(req) {
  /* ?v=N 캐시버스팅 쿼리는 무시하고 찾아야 프리캐시본(쿼리 없음)을 만난다 */
  return caches.match(req, { ignoreSearch: true });
}

function putCopy(req, res) {
  if (!res || !res.ok || res.type === 'opaque') return;
  var copy = res.clone();
  caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
}

/* 네트워크에 시간제한을 걸어 무한정 매달리지 않게 한다 */
function fetchWithTimeout(req, ms) {
  return new Promise(function (resolve, reject) {
    var done = false;
    var t = setTimeout(function () { if (!done) { done = true; reject(new Error('timeout')); } }, ms);
    fetch(req).then(function (res) {
      if (done) return;
      done = true; clearTimeout(t); resolve(res);
    }, function (err) {
      if (done) return;
      done = true; clearTimeout(t); reject(err);
    });
  });
}

function offlineFallback(req) {
  /* 페이지 이동이면 최소한 개요라도 띄운다. 그 외엔 빈 응답 대신 504 를 준다 —
     respondWith(undefined) 는 그 요청을 통째로 깨뜨린다. */
  return fromCache(req).then(function (hit) {
    if (hit) return hit;
    if (req.mode === 'navigate') {
      return caches.match('./index.html', { ignoreSearch: true }).then(function (idx) {
        return idx || new Response('오프라인입니다. 데이터가 되는 곳에서 한 번 열어 주세요.',
          { status: 504, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      });
    }
    return new Response('', { status: 504 });
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== location.origin) return; /* 외부 이미지·CDN 은 건드리지 않는다 */

  var isNav = req.mode === 'navigate' ||
              (req.headers.get('accept') || '').indexOf('text/html') >= 0;

  if (isNav) {
    /* HTML 은 최신이 낫지만, 신호가 없으면 2.5초만 기다리고 캐시로 간다 */
    e.respondWith(
      fetchWithTimeout(req, NET_TIMEOUT).then(function (res) {
        putCopy(req, res);
        return res;
      }).catch(function () { return offlineFallback(req); })
    );
    return;
  }

  /* CSS·JS·이미지는 캐시 먼저 — ?v=N 이 붙어 있어 배포하면 URL 자체가 바뀐다.
     즉 캐시본이 낡을 일이 없고, 오프라인에서도 즉시 뜬다. */
  e.respondWith(
    fromCache(req).then(function (hit) {
      if (hit) {
        /* 버전 쿼리가 없는 파일(아이콘·매니페스트 등)은 뒤에서 조용히 갱신해 둔다 */
        if (!url.search) {
          fetchWithTimeout(req, NET_TIMEOUT).then(function (res) { putCopy(req, res); }).catch(function () {});
        }
        return hit;
      }
      return fetchWithTimeout(req, NET_TIMEOUT).then(function (res) {
        putCopy(req, res);
        return res;
      }).catch(function () { return offlineFallback(req); });
    })
  );
});
