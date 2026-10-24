const CACHE='flh-mvlrxniz';
const PRECACHE=["./","./apple-touch-icon.png","./assets/index-BH2Fmt6c.js","./assets/index-D4suMaoj.css","./favicon-32.png","./icon-192.png","./icon-512.png","./icon-maskable-512.png","./icon.svg","./index.html","./manifest.webmanifest"];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(PRECACHE)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('flh-')&&k!==CACHE&&k!=='flh-fonts').map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.hostname==='fonts.googleapis.com'||url.hostname==='fonts.gstatic.com'){
    e.respondWith(caches.open('flh-fonts').then(async c=>{ const hit=await c.match(req); if(hit) return hit; try{ const r=await fetch(req); if(r.ok||r.type==='opaque') c.put(req,r.clone()); return r; }catch(_){ return new Response('',{status:504}); } }));
    return;
  }
  if(url.origin!==self.location.origin) return;
  if(req.mode==='navigate'){
    e.respondWith(fetch(req).then(r=>{ const cl=r.clone(); caches.open(CACHE).then(c=>c.put('./',cl)); return r; }).catch(()=>caches.match('./',{ignoreSearch:true})));
    return;
  }
  e.respondWith(caches.match(req,{ignoreSearch:true}).then(hit=>hit||fetch(req).then(r=>{ if(r.ok){ const cl=r.clone(); caches.open(CACHE).then(c=>c.put(req,cl)); } return r; })));
});
