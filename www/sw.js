const CACHE = "noor-adhkar-cache-v4115";
const CACHE_PREFIX = "noor-adhkar-cache-";
const ASSETS = [
  "./", "./index.html", "./styles.css", "./theme.css", "./features.css", "./features-v404.css", "./quran-reader.css", "./responsive.css", "./glass.css",
  "./accent.js", "./intro.js", "./native.bundle.js", "./sheet.js", "./adhkar-core.js", "./adhkar-data.js",
  "./app.js", "./v3.js", "./time12.js", "./salah.js", "./prayer-dashboard.js", "./salah-experience.js", "./salah-settings.js",
  "./reminders.js", "./profile.js", "./settings.js", "./motion.js", "./glass.js", "./qibla-core.js", "./zakat-core.js",
  "./features.js", "./glance-config.js", "./v404.js", "./hadith-library.js", "./quran-memory-core.js", "./quran-config.js", "./quran-player-core.js","./back.js","./wavy-seek.js","./glass-nav.js","./glass-refract.js", "./quran-reader.js", "./public-updates.js", "./manifest.json", "./icon.svg"
];
self.addEventListener("install", event => event.waitUntil(
  caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
));
self.addEventListener("activate", event => event.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim())
));
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const dynamicUi = request.mode === "navigate" || /\.(?:html?|js|css)$/i.test(url.pathname);
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (dynamicUi) {
      try {
        const fresh = await fetch(request, { cache: "no-store" });
        if (fresh && fresh.ok) await cache.put(request, fresh.clone());
        return fresh;
      } catch (_) {
        return (await cache.match(request)) || (request.mode === "navigate" ? await cache.match("./index.html") : Response.error());
      }
    }
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
      const fresh = await fetch(request);
      if (fresh && fresh.ok) await cache.put(request, fresh.clone());
      return fresh;
    } catch (_) {
      return (await cache.match(request)) || Response.error();
    }
  })());
});
