// Night Desk service worker: cache-first, fully offline. Music lives in its own cache (nd-music-v1), kept across updates.
const CACHE='nd-v1.26.0', MUSIC_CACHE='nd-music-v1';
const ASSETS=['./','./index.html','./manifest.json','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-192.png','./icons/icon-maskable-512.png','./icons/apple-touch-icon.png','./map/blueprint.webp','./map/blueprint.jpg','./map/nightcity.webp','./map/nightcity.jpg','./map/blueprint-prev.webp','./map/blueprint-prev.jpg','./map/nightcity-prev.webp','./map/nightcity-prev.jpg','./fonts/bangers.woff2','./fonts/inter.woff2','./fonts/rajdhani.woff2','./fonts/vt323.woff2'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&k!==MUSIC_CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
async function musicResp(req){const c=await caches.open(MUSIC_CACHE);const key=req.url.split('?')[0];const r=await c.match(key);if(!r)return fetch(req);
 const range=req.headers.get('range');if(!range)return r;const b=await r.arrayBuffer();const n=b.byteLength;const m=/bytes=(\d*)-(\d*)/.exec(range)||[];
 let s=m[1]?+m[1]:0,e=m[2]?+m[2]:n-1;if(!m[1]&&m[2]){s=Math.max(0,n-(+m[2]));e=n-1;}e=Math.min(e,n-1);if(s>e||s>=n)return new Response('',{status:416,headers:{'Content-Range':'bytes */'+n}});
 return new Response(b.slice(s,e+1),{status:206,headers:{'Content-Type':'audio/mp4','Content-Range':'bytes '+s+'-'+e+'/'+n,'Content-Length':String(e-s+1),'Accept-Ranges':'bytes'}});}
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);if(u.origin!==location.origin)return;
 if(u.pathname.includes('/music/')){e.respondWith(musicResp(e.request).catch(()=>new Response('',{status:504})));return;}
 e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request).then(res=>{if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));}return res;}).catch(()=>caches.match('./index.html'))));});
