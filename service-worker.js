// service-worker.js
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `status-quiz-${CACHE_VERSION}`;

const APP_SHELL = [
  './',              // start_url と一致させる
  './index.html',
  './manifest.json',
  './service-worker.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// インストール時にApp Shellをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// 古いキャッシュを掃除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => {
        if (k !== CACHE_NAME) return caches.delete(k);
      }))
    )
  );
  self.clients.claim();
});

// 取得戦略：HTMLはネット優先（更新取る）、その他はキャッシュ優先
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 同一オリジンのみキャッシュ戦略
  if (url.origin === self.location.origin) {
    if (req.destination === 'document' || req.mode === 'navigate') {
      // HTML: network-first
      event.respondWith(
        fetch(req).then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put('./', resClone));
          return res;
        }).catch(() => caches.match('./') || caches.match('./index.html'))
      );
      return;
    }

    // その他: cache-first
    event.respondWith(
      caches.match(req).then((cached) => {
        return cached || fetch(req).then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, resClone));
          return res;
        });
      })
    );
  }
});
