const CACHE="gpt-pro-v1";const ASSETS=["/","/style.css","/app.js","/manifest.webmanifest"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener("fetch",e=>{if(e.request.method!=="GET"||new URL(e.request.url).pathname.startsWith("/api/"))return;e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request)));});