/* Offline support: caches the page, icons, photos and videos. */
const CACHE = 'ex30-v7';
const ASSETS = [
  "./", "index.html", "manifest.webmanifest", "icon.svg", "icon-180.png", "icon-192.png", "icon-512.png",
  "images/bandrow.jpg",
  "images/bandrow.mp4",
  "images/birddog.jpg",
  "images/bridge.jpg",
  "images/bridge.mp4",
  "images/butterfly.jpg",
  "images/butterfly.mp4",
  "images/calfraise.jpg",
  "images/calfraise.mp4",
  "images/calfstretch.jpg",
  "images/calfstretch.mp4",
  "images/catcow.jpg",
  "images/catcow.mp4",
  "images/childpose.jpg",
  "images/childpose.mp4",
  "images/deadbug.jpg",
  "images/deadbug.mp4",
  "images/doorway.jpg",
  "images/doorway.mp4",
  "images/foamroller.jpg",
  "images/foamroller.mp4",
  "images/glutestretch.jpg",
  "images/glutestretch.mp4",
  "images/hamstring.jpg",
  "images/hamstring.mp4",
  "images/hipflexor.jpg",
  "images/lunge.jpg",
  "images/lunge.mp4",
  "images/plank.jpg",
  "images/private2/meta.json",
  "images/private2/p_bridge.bin",
  "images/private2/p_butterfly.bin",
  "images/private2/p_calf.bin",
  "images/private2/p_glute.bin",
  "images/private2/p_hamstring.bin",
  "images/private2/p_lunge.bin",
  "images/private2/p_sidequad.bin",
  "images/private2/p_squat.bin",
  "images/private2/p_star.bin",
  "images/private2/p_walkout.bin",
  "images/private2/p_wallsit.bin",
  "images/pullapart.jpg",
  "images/pullapart.mp4",
  "images/squat.jpg",
  "images/squat.mp4",
  "images/startaps.jpg",
  "images/startaps.mp4",
  "images/wallangels.jpg",
  "images/wallangels.mp4",
  "images/wallsit.jpg",
  "images/ytw.jpg",
  "images/ytw.mp4"
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // The page itself: try the network first so updates show up, fall back to the saved copy offline.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put('index.html', copy)); return res;
    }).catch(() => caches.match('index.html')));
    return;
  }
  // Videos ask for byte ranges; answer those from the cache (Safari needs this).
  if (req.headers.has('range')) { e.respondWith(rangeFromCache(req)); return; }
  e.respondWith(caches.match(req, {ignoreSearch: true}).then(hit => hit || fetch(req).then(res => {
    if (res.ok && res.status === 200) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
async function rangeFromCache(req) {
  const hit = await caches.match(req.url, {ignoreSearch: true});
  if (!hit) return fetch(req);
  const buf = await hit.arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range') || '');
  const size = buf.byteLength;
  let start = m && m[1] ? parseInt(m[1], 10) : 0;
  let end = m && m[2] ? parseInt(m[2], 10) : size - 1;
  if (!m || !m[1]) { if (m && m[2]) { start = Math.max(0, size - parseInt(m[2], 10)); end = size - 1; } }
  end = Math.min(end, size - 1);
  return new Response(buf.slice(start, end + 1), {status: 206, headers: {
    'Content-Type': hit.headers.get('Content-Type') || 'video/mp4',
    'Content-Range': 'bytes ' + start + '-' + end + '/' + size,
    'Content-Length': String(end - start + 1),
    'Accept-Ranges': 'bytes'
  }});
}
