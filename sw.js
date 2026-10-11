const CACHE = "shnayim-mikra-v2";
const CORE = ["./", "index.html", "meta.js", "sched.js", "font.woff2", "font-ui.woff2", "logo.png", "manifest.webmanifest", "icon-192.png", "icon-512.png"];
const TXT = [0, 1, 2, 3, 4].map(i => ["tx/" + i + ".json", "rashi/" + i + ".json"]).flat();
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(async c => {
    await c.addAll(CORE);
    await Promise.allSettled(TXT.map(u => c.add(u)));   // הטקסט - בכל כשל ממשיכים (יוטען בעת הצורך)
  }).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  const isPage = req.mode === "navigate" || /\/(index\.html|meta\.js|sched\.js|manifest\.webmanifest)?$/.test(new URL(req.url).pathname);
  if (isPage) {   // דף ראשי ולוח: קודם רשת (כדי שעדכונים יגיעו), ובלי חיבור - מהמטמון
    e.respondWith(fetch(req).then(n => { const c = n.clone(); caches.open(CACHE).then(x => x.put(req, c)); return n; }).catch(() => caches.match(req).then(r => r || caches.match("index.html"))));
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(n => { if (n.ok) { const c = n.clone(); caches.open(CACHE).then(x => x.put(req, c)); } return n; })));
});
