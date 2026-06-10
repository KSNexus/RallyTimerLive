const CACHE_NAME='kingshot-rally-timer-v1-3-checked';
const APP_FILES=['./','./index.html','./admin.html','./style.css','./shared.js','./player.js','./admin.js','./firebase-config.js','./manifest.json','./service-worker.js','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(APP_FILES)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE_NAME?caches.delete(k):null))));self.clients.claim();});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request)));});