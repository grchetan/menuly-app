// Menuly Service Worker for Offline Menu Browsing, Data Saving & Instant PWA Updates
const CACHE_NAME = "menuly-cache-v2";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/favicon.ico",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

// Install Event - Pre-cache essential assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[SW] Pre-cache partial failure:", err);
      });
    })
  );
});

// Activate Event - Clean old caches and claim clients immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Message Event - Handle SKIP_WAITING from client update prompt
self.addEventListener("message", (event) => {
  if (event.data && (event.data.type === "SKIP_WAITING" || event.data === "skipWaiting")) {
    self.skipWaiting();
  }
});

// Fetch Event - Network first with offline cache fallback for menus
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle GET requests
  if (req.method !== "GET") return;

  // Do not intercept auth, supabase, or mutating API calls
  if (url.pathname.startsWith("/api/auth") || url.hostname.includes("supabase.co")) {
    return;
  }

  // 1. Digital Menu Navigation (/menu/*)
  if (url.pathname.startsWith("/menu/")) {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          // If valid response, clone into cache
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          // Network failed: attempt to retrieve from cache
          const cachedResponse = await caches.match(req);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback to cached root or match by pathname
          const fallback = await caches.match(url.pathname);
          if (fallback) return fallback;
          // If totally unavailable, throw friendly offline response
          return new Response("Offline menu unavailable. Please connect to internet once.", {
            status: 503,
            statusText: "Offline",
            headers: { "Content-Type": "text/plain" }
          });
        })
    );
    return;
  }

  // 2. Static Assets (scripts, styles, fonts, images) -> Cache First for instant loading
  if (
    url.pathname.startsWith("/assets/") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".webp") ||
    url.hostname.includes("fonts.googleapis.com") ||
    url.hostname.includes("fonts.gstatic.com")
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) {
          // Return from cache immediately to save user's data & load in <10ms
          return cached;
        }
        return fetch(req)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const copy = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
            }
            return networkResponse;
          })
          .catch(() => cached);
      })
    );
    return;
  }

  // 3. General Pages: Network first, fall back to cache
  event.respondWith(
    fetch(req)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && req.destination === "document") {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return networkResponse;
      })
      .catch(async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        return caches.match("/");
      })
  );
});
