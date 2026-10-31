// I miei dischi – funziona anche senza internet
const V="dischi-v18";
const COV="dischi-copertine"; // le copertine restano anche quando cambia versione
const SHELL=["./","index.html","app.js","scanner.js","manifest.webmanifest","icona-192.png","icona-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:"reload"})))).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V&&k!==COV).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
const net=(req,ms)=>new Promise((res,rej)=>{const t=setTimeout(()=>rej(new Error("lento")),ms);fetch(req).then(r=>{clearTimeout(t);res(r)},e=>{clearTimeout(t);rej(e)})});
async function networkFirst(req,ms){const c=await caches.open(V);const key=req.url.split("?")[0];
  try{const r=await net(req,ms);if(r&&(r.ok||r.type==="opaque"))c.put(key,r.clone());return r}
  catch(e){const hit=await c.match(key);if(hit)return hit;throw e}}
async function cacheFirst(req){const c=await caches.open(COV);const hit=await c.match(req.url);if(hit)return hit;
  const r=await fetch(req);if(r&&(r.ok||r.type==="opaque"))c.put(req.url,r.clone());return r}
async function staleWhileRevalidate(req,e){const c=await caches.open(V);const key=req.url.split("?")[0];const hit=await c.match(key);
  const p=fetch(req).then(r=>{if(r&&r.ok)c.put(key,r.clone());return r}).catch(()=>hit);
  if(hit){e.waitUntil(p);return hit}return p}
self.addEventListener("fetch",e=>{
  const req=e.request;if(req.method!=="GET")return;
  const u=new URL(req.url);
  if(/\/opencv-[\d.]+\.js$/.test(u.pathname))return e.respondWith(cacheFirst(req)); // grande: si scarica una volta sola
  if(/\/copertine\//.test(u.pathname)&&!/idx\.json$/.test(u.pathname))return e.respondWith(cacheFirst(req));
  if(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/.test(u.host))return e.respondWith(cacheFirst(req));
  if(u.pathname.endsWith(".json"))return e.respondWith(networkFirst(req,6000));
  if(u.origin===location.origin)return e.respondWith(staleWhileRevalidate(req,e));
});
