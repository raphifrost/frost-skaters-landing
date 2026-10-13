const CACHE='mein-space-v1';
const LOCAL=['./','./index.html','./styles.css','./storage.js','./memory.js','./app.js','./manifest.webmanifest','./Mein-Space.html','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(LOCAL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('mein-space-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 const scope=new URL('./',self.location.href).pathname;
 if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(scope))return;
 if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}return response;}).catch(()=>caches.match(event.request).then(response=>response||caches.match('./index.html'))));return;}
 event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
});
