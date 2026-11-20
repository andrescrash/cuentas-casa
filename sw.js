// Cuentas Casa · service worker
// - La página: primero la red (así siempre llega la versión nueva); si no hay internet, la última guardada.
// - Librerías, fuentes e íconos: desde la copia guardada, y se refrescan por detrás.
// - Supabase (datos, sesión y comprobantes) nunca se guarda aquí: siempre va directo a la nube.
const CACHE = 'cuentas-v1';
const BASE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.hostname.endsWith('supabase.co')) return; // datos: siempre en vivo

  if (r.mode === 'navigate') { // la app: red primero
    e.respondWith(fetch(r).then(res => {
      const copia = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copia)); return res;
    }).catch(() => caches.match('./index.html')));
    return;
  }

  const estatico = u.origin === location.origin || /fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net/.test(u.hostname);
  if (!estatico) return;
  e.respondWith(caches.match(r).then(guardado => {
    const red = fetch(r).then(res => {
      if (res && (res.ok || res.type === 'opaque')) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(r, copia)); }
      return res;
    }).catch(() => guardado);
    return guardado || red;
  }));
});
