const CACHE='bmh-__BMH_ASSET_DIGEST__';
const CORE=['./','./index.html','./styles.css','./app.js','./manifest.webmanifest','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('bmh-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 // Account, AI, payment and other API responses must never be kept offline.
 if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
 const response=fetch(request);
 event.waitUntil(response.then(async result=>{if(result.ok&&result.type!=='opaqueredirect'){const copy=result.clone(),cache=await caches.open(CACHE);await cache.put(request,copy);}}).catch(()=>{}));
 event.respondWith(response.catch(async()=>{
  const cache=await caches.open(CACHE),cached=await cache.match(request);if(cached)return cached;
  // Returning HTML for a missing module corrupts lazy 3D imports.
  if(request.mode==='navigate')return await cache.match('./index.html')||Response.error();
  return Response.error();
 }));
});
