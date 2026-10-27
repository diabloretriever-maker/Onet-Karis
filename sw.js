// Bump this version every time you upload changed files,
// otherwise the iPad keeps playing the old cached copy.
var CACHE = 'onet-v1';

var FILES = [
  './',
  'index.html',
  'style.css',
  'game.js',
  'manifest.json',
  'icon-180.png',
  'asset/icon.png',
  'asset/a.png', 'asset/b.png', 'asset/c.png', 'asset/d.png', 'asset/e.png',
  'asset/f.png', 'asset/g.png', 'asset/h.png', 'asset/i.png', 'asset/j.png',
  'asset/k.png', 'asset/l.png', 'asset/m.png', 'asset/n.png', 'asset/o.png',
  'asset/p.png', 'asset/r.png', 'asset/s.png', 'asset/t.png', 'asset/w.png',
  'asset/z.png'
];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') { return; }
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (r) {
      return r || fetch(e.request);
    })
  );
});
