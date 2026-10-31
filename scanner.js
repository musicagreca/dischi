// I miei dischi – riconoscimento delle copertine con la fotocamera
// Si carica solo quando si apre «Inquadra un disco».
(function(){
"use strict";
const CV_URL="opencv-5.0.0.js";
const NDB=160,NQ=1000,T=12,K=12,MAXD=64,RATIO=.8,MINV=6,REL=1.5;
const SIZES=[480,640,360];let sz=0; // due grandezze a turno: copertina vicina o lontana
const FPVER="fp1";
let cv=null,FP=null,TABS=null,OWN=null,CODES=null,DESC32=null;
let stream=null,running=false,busy=false,last=null,lastAdded=null,streak=0,alts=[];
let LIST=[],sortMode="scan",PROV="";
const $=s=>document.querySelector(s);
let A=null;// funzioni prese dall'app
const esc=s=>A.esc(s),covCode=d=>A.covCode(d),loadChunk=i=>A.loadChunk(i),idbGet=k=>A.idbGet(k),idbPut=(k,v)=>A.idbPut(k,v);

/* ---------- caricamento ---------- */
function loadCV(){
  if(cv)return Promise.resolve(cv);
  return new Promise((res,rej)=>{
    const s=document.createElement("script");s.src=CV_URL;s.async=true;
    s.onload=async()=>{try{let c=window.cv;if(c instanceof Promise)c=await c;else if(!c.Mat)await new Promise(r=>{c.onRuntimeInitialized=r});cv=c;res(c)}catch(e){rej(e)}};
    s.onerror=()=>rej(new Error("rete"));document.head.appendChild(s)});
}
const ORBP=n=>new cv.ORB(n,1.2,8,31,0,2,0,31,10);

async function coverGray(b64){
  const blob=await (await fetch("data:image/jpeg;base64,"+b64)).blob();
  const bmp=await createImageBitmap(blob);
  const c=document.createElement("canvas");c.width=bmp.width;c.height=bmp.height;c.getContext("2d").drawImage(bmp,0,0);bmp.close&&bmp.close();
  const m=cv.imread(c),g=new cv.Mat(),r=new cv.Mat();
  cv.cvtColor(m,g,cv.COLOR_RGBA2GRAY);cv.resize(g,r,new cv.Size(320,320),0,0,cv.INTER_AREA);m.delete();g.delete();return r;
}
async function buildPrints(progress){
  const saved=await idbGet("impronte");
  const old=(saved&&saved.v===FPVER)?saved.items:{};
  const items={};const todo=[];
  const ids=[...new Set(Object.values(A.cidx()))];
  for(const i of ids){const ch=await loadChunk(i);for(const [code,b64] of Object.entries(ch)){
    if(old[code]&&old[code].n===b64.length)items[code]=old[code];else todo.push([code,b64])}}
  if(todo.length){
    const orb=ORBP(NDB),kp=new cv.KeyPointVector(),d=new cv.Mat(),none=new cv.Mat();
    for(let i=0;i<todo.length;i++){
      const [code,b64]=todo[i];
      try{const g=await coverGray(b64);orb.detectAndCompute(g,none,kp,d);g.delete();
        items[code]={n:b64.length,d:d.rows?new Uint8Array(d.data):new Uint8Array(0)}}catch(e){}
      if(i%10===0){progress(i,todo.length);await new Promise(r=>setTimeout(r,0))}
    }
    orb.delete();kp.delete();d.delete();none.delete();
    idbPut("impronte",{v:FPVER,items});
  }
  // tutto in un unico blocco + tabelle di ricerca veloce
  CODES=Object.keys(items).filter(c=>items[c].d.length);
  let tot=0;CODES.forEach(c=>tot+=items[c].d.length);
  const all=new Uint8Array(tot);OWN=new Int32Array(tot/32);let o=0;
  CODES.forEach((c,i)=>{all.set(items[c].d,o);OWN.fill(i,o/32,(o+items[c].d.length)/32);o+=items[c].d.length});
  DESC32=new Uint32Array(all.buffer);FP=all;
  const N=tot/32;let seed=7;const rnd=()=>(seed=(seed*1103515245+12345)>>>0)/4294967296;
  TABS=[];for(let t=0;t<T;t++){
    const bits=[];while(bits.length<K){const b=Math.floor(rnd()*256);if(!bits.includes(b))bits.push(b)}
    const key=new Uint16Array(N);for(let j=0;j<N;j++)key[j]=keyOf(all,j*32,bits);
    const start=new Uint32Array((1<<K)+1);for(let j=0;j<N;j++)start[key[j]+1]++;
    for(let k=0;k<(1<<K);k++)start[k+1]+=start[k];
    const pos=start.slice(0,1<<K),idx=new Uint32Array(N);for(let j=0;j<N;j++)idx[pos[key[j]]++]=j;
    TABS.push({bits,start,idx})}
  return CODES.length;
}
function keyOf(buf,off,bits){let k=0;for(let i=0;i<bits.length;i++){const b=bits[i];if(buf[off+(b>>3)]&(128>>(b&7)))k|=1<<i}return k}
function pop(x){x-=(x>>>1)&0x55555555;x=(x&0x33333333)+((x>>>2)&0x33333333);return(((x+(x>>>4))&0x0F0F0F0F)*0x01010101)>>>24}

/* ---------- riconoscimento ---------- */
let qorb=null,stamp=null,stampN=0;
function match(canvas){
  const m=cv.imread(canvas),g=new cv.Mat();cv.cvtColor(m,g,cv.COLOR_RGBA2GRAY);m.delete();
  qorb=qorb||ORBP(NQ);const kp=new cv.KeyPointVector(),d=new cv.Mat(),none=new cv.Mat();
  qorb.detectAndCompute(g,none,kp,d);g.delete();kp.delete();none.delete();
  const nq=d.rows,q=new Uint8Array(d.data),q32=new Uint32Array(q.buffer.slice(q.byteOffset,q.byteOffset+q.length));d.delete();
  const votes=new Float32Array(CODES.length);
  if(!stamp||stamp.length!==OWN.length){stamp=new Int32Array(OWN.length);stampN=0}
  for(let i=0;i<nq;i++){
    stampN++;let b1=999,o1=-1,b2=999;const qo=i*8;
    for(const t of TABS){const k=keyOf(q,i*32,t.bits);for(let p=t.start[k],e=t.start[k+1];p<e;p++){
      const j=t.idx[p];if(stamp[j]===stampN)continue;stamp[j]=stampN;
      const jo=j*8;let dd=0;for(let w=0;w<8;w++)dd+=pop(DESC32[jo+w]^q32[qo+w]);
      const ow=OWN[j];
      if(dd<b1){if(ow!==o1)b2=b1;b1=dd;o1=ow}else if(ow!==o1&&dd<b2)b2=dd}}
    if(o1>=0&&b1<=MAXD&&b1<RATIO*b2)votes[o1]++}
  const top=[];for(let i=0;i<votes.length;i++){if(votes[i]<2)continue;top.push([votes[i],i]);if(top.length>12){top.sort((a,b)=>b[0]-a[0]);top.length=6}}
  top.sort((a,b)=>b[0]-a[0]);
  return top.slice(0,4).map(([v,i])=>({code:CODES[i],v}));
}
// una copertina → i dischi che la usano (doppi, scatole, copie con la B)
function discsOf(cov){return A.alld().filter(d=>covCode(d)===cov)}

/* ---------- interfaccia ---------- */
function ui(){
  if($("#scan"))return;
  const el=document.createElement("div");el.id="scan";el.innerHTML=`
  <div class="sc-top"><b>📷 Inquadra un disco</b><button type="button" id="sc-close">Chiudi</button></div>
  <div class="sc-prov"><label for="sc-p">Posizione provvisoria:</label><input id="sc-p" type="text" placeholder="es. Pila 1, Tavolo, V05…" autocomplete="off"><small id="sc-pn"></small></div>
  <div class="sc-cam"><video id="sc-v" playsinline muted></video><div class="sc-frame"></div><p id="sc-msg">Un momento…</p></div>
  <div id="sc-hit"></div>
  <div class="sc-bar"><b id="sc-n"></b><span class="sc-sort"><button type="button" data-ssort="scan">In ordine di scansione</button><button type="button" data-ssort="prov">Per posizione provvisoria</button><button type="button" data-ssort="pos">Per scaffale</button></span></div>
  <div class="sc-tools"><button type="button" id="sc-unk">➕ Non lo riconosce: aggiungi come «da catalogare»</button><button type="button" id="sc-xl">⬇ Scarica Excel</button><button type="button" id="sc-clear">Svuota la lista</button></div>
  <ol id="sc-list"></ol>`;
  document.body.appendChild(el);
  $("#sc-close").onclick=close;
  const pi=$("#sc-p");pi.value=PROV;pi.oninput=()=>{PROV=pi.value.trim();try{localStorage.setItem("scan-prov",PROV)}catch(e){}provInfo()};
  $("#sc-unk").onclick=addUnknown;
  $("#sc-xl").onclick=excel;
  $("#sc-clear").onclick=()=>{if(LIST.length&&confirm("Svuoto la lista dei dischi inquadrati?")){LIST=[];lastAdded=null;save();drawList()}};
  $("#sc-v").onclick=()=>{streak=0;tick(true)};
  el.addEventListener("click",e=>{
    const s=e.target.closest("[data-ssort]");if(s){sortMode=s.dataset.ssort;drawList();return}
    const a=e.target.closest("[data-salt]");if(a){replaceLast(a.dataset.salt);return}
    const x=e.target.closest("[data-sdel]");if(x){LIST.splice(+x.dataset.sdel,1);save();drawList();return}
  });
}
function msg(t){const m=$("#sc-msg");if(m)m.textContent=t}
const save=()=>idbPut("scanlist",LIST);
const provNext=()=>LIST.filter(e=>e.prov===PROV).reduce((m,e)=>Math.max(m,e.provn||0),0)+1;
function provInfo(){const n=$("#sc-pn");if(!n)return;n.textContent=PROV?`il prossimo disco sarà il n. ${provNext()} di «${PROV}»`:"scrivi dove stai mettendo i dischi (si numerano da soli)"}
function withProv(e){if(PROV){e.prov=PROV;e.provn=provNext()}return e}
const provTxt=e=>e.prov?`${e.prov} n. ${e.provn}`:"";
const byProv=(a,b)=>(!a.prov-!b.prov)||String(a.prov||"").localeCompare(String(b.prov||""),"it",{numeric:true})||(a.provn||0)-(b.provn||0);
const byShelf=(a,b)=>(!a.shelf-!b.shelf)||String(a.shelf).localeCompare(String(b.shelf),"it",{numeric:true})||(!a.pos-!b.pos)||String(a.pos).localeCompare(String(b.pos),"it",{numeric:true});
function entryOf(d){return {code:d.code,title:d.title,artist:d.artist||"",cat:d.cat||"",shelf:d.shelf||"",pos:d.pos||"",catno:d.catno||"",label:d.label||"",t:Date.now()}}
function covHTML(code,cls){return A.cidx()[code]!==undefined?`<img class="cov ${cls}" data-cov="${esc(code)}" alt="">`:`<span class="cov ${cls} nocov"></span>`}
function drawHit(cov,ds,others){
  const d=ds[0];
  $("#sc-hit").innerHTML=`<div class="sc-card">${covHTML(cov,"sc-c")}<div><b>${esc(d.title)}</b><small>${esc([d.artist,d.code].filter(Boolean).join(" · "))}</small><span class="shelf big">${esc(d.shelf||"—")}${d.pos?" · "+esc(d.pos):""}</span>${PROV?`<small>→ mettilo in <b>${esc(PROV)}</b></small>`:""}</div></div>
  ${others.length?`<p class="sc-alt">Non è questo? Tocca quello giusto:</p><div class="sc-alts">${others.map(o=>`<button type="button" data-salt="${esc(o.code)}">${covHTML(covCode(o)||"","sc-a")}<span>${esc(o.title)}<small>${esc(o.code)} · ${esc(o.shelf||"—")}${o.pos?" · "+esc(o.pos):""}</small></span></button>`).join("")}</div>`:""}`;
}
function drawList(){
  const n=$("#sc-n");if(!n)return;
  provInfo();n.textContent=LIST.length?`${LIST.length} ${LIST.length===1?"disco":"dischi"} nella lista`:"La lista è vuota: inquadra il primo disco.";
  document.querySelectorAll("[data-ssort]").forEach(b=>b.classList.toggle("on",b.dataset.ssort===sortMode));
  const rows=LIST.map((e,i)=>[e,i]);
  if(sortMode==="pos")rows.sort(([a],[b])=>byShelf(a,b));else if(sortMode==="prov")rows.sort(([a],[b])=>byProv(a,b));
  else rows.reverse();
  $("#sc-list").innerHTML=rows.map(([e,i])=>e.unk
    ?`<li class="unk"><img class="cov sc-l" src="${e.img}" alt=""><span><b>Da catalogare</b><small>${e.prov?esc(provTxt(e))+" · ":""}non riconosciuto · ${new Date(e.t).toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"})}</small></span><button type="button" data-sdel="${i}" aria-label="Togli">✕</button></li>`
    :`<li><button type="button" class="sc-open" data-disc="${esc(e.code)}">${covHTML(covCode(A.by()[e.code]||{code:e.code})||"","sc-l")}<span><b>${esc(e.title)}</b><small>${esc(e.code)}${e.prov?" · ora in "+esc(provTxt(e)):""}</small></span><span class="shelf">${esc(e.shelf||"—")}${e.pos?" · "+esc(e.pos):""}</span></button><button type="button" data-sdel="${i}" aria-label="Togli">✕</button></li>`).join("");
}
function beep(){try{const a=beep.a||(beep.a=new (window.AudioContext||window.webkitAudioContext)());const o=a.createOscillator(),g=a.createGain();o.frequency.value=880;g.gain.setValueAtTime(.15,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+.18);o.connect(g).connect(a.destination);o.start();o.stop(a.currentTime+.2)}catch(e){}try{navigator.vibrate&&navigator.vibrate(60)}catch(e){}}
function addDisc(d){LIST.push(withProv(entryOf(d)));lastAdded=d.code;save();drawList();beep()}
function replaceLast(code){
  const d=A.by()[code]||A.alld().find(x=>x.code===code);if(!d)return;
  const i=LIST.map(e=>e.code).lastIndexOf(lastAdded);
  if(i>=0){const o=LIST[i];LIST[i]=entryOf(d);if(o.prov){LIST[i].prov=o.prov;LIST[i].provn=o.provn}}else LIST.push(withProv(entryOf(d)));
  lastAdded=d.code;save();drawList();
  drawHit(covCode(d)||"",[d],alts.filter(o=>o.code!==d.code));
}
function addUnknown(){
  const v=$("#sc-v");if(!v||!v.videoWidth)return;
  const c=document.createElement("canvas"),s=160/Math.max(v.videoWidth,v.videoHeight);c.width=v.videoWidth*s;c.height=v.videoHeight*s;c.getContext("2d").drawImage(v,0,0,c.width,c.height);
  LIST.push(withProv({unk:1,img:c.toDataURL("image/jpeg",.7),t:Date.now()}));lastAdded=null;save();drawList();beep();
}
function excel(){
  if(!LIST.length)return;
  const head=["N.","Codice","Titolo","Artista","Categoria","Scaffale","Posizione","Posizione provvisoria","N. provvisorio","Etichetta","N. catalogo","Note"];
  const rows=(sortMode==="pos"?[...LIST].sort(byShelf):sortMode==="prov"?[...LIST].sort(byProv):LIST)
    .map((e,i)=>e.unk?[i+1,"","","","","","",e.prov||"",e.provn||"","","","Da catalogare (non riconosciuto)"]:[i+1,e.code,e.title,e.artist,e.cat,e.shelf,e.pos,e.prov||"",e.provn||"",e.label,e.catno,""]);
  const name="dischi_inquadrati_"+new Date().toISOString().slice(0,10)+".xlsx";
  if(window.XLSX){const ws=XLSX.utils.aoa_to_sheet([head,...rows]);ws["!cols"]=[{wch:4},{wch:10},{wch:40},{wch:28},{wch:16},{wch:9},{wch:9},{wch:18},{wch:8},{wch:20},{wch:16},{wch:30}];
    const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Dischi inquadrati");XLSX.writeFile(wb,name);return}
  const csv="﻿"+[head,...rows].map(r=>r.map(x=>`"${String(x).replace(/"/g,'""')}"`).join(";")).join("\r\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=name.replace(".xlsx",".csv");document.body.appendChild(a);a.click();a.remove();
}

/* ---------- ciclo della fotocamera ---------- */
const work=document.createElement("canvas");
async function tick(force){
  if(!running||busy)return;const v=$("#sc-v");if(!v||!v.videoWidth){setTimeout(tick,300);return}
  busy=true;
  try{
    const s=SIZES[(sz++)%SIZES.length]/Math.max(v.videoWidth,v.videoHeight);work.width=Math.round(v.videoWidth*s);work.height=Math.round(v.videoHeight*s);
    work.getContext("2d").drawImage(v,0,0,work.width,work.height);
    const r=match(work);
    const ok=r.length&&r[0].v>=MINV&&r[0].v>=REL*(r[1]?r[1].v:0);
    if(ok||(force&&r.length)){
      const cov=r[0].code;streak=(last===cov)?streak+1:1;last=cov;
      const ds=discsOf(cov);
      if(ds.length&&(streak>=2||force)){
        const same=ds.some(d=>d.code===lastAdded);
        alts=[...ds.slice(1),...r.slice(1).flatMap(x=>discsOf(x.code))].filter((d,i,a)=>a.findIndex(z=>z.code===d.code)===i).slice(0,4);
        if(!same||force){drawHit(cov,ds,alts);if(!same)addDisc(ds[0])}
        msg(same?"Già nella lista. Passa al prossimo disco.":"Trovato! Passa al prossimo disco.");
      }else msg("Mi sembra di riconoscerlo… tienilo fermo un attimo.");
    }else{streak=0;last=null;msg(r.length&&r[0].v>=4?"Non sono sicura… avvicinati o tocca lo schermo.":"Inquadra tutta la copertina, ben dritta.")}
  }catch(e){msg("Qualcosa non va: "+(e.message||e))}
  busy=false;if(running)setTimeout(tick,120);
}
async function open(api){
  A=api;try{PROV=localStorage.getItem("scan-prov")||""}catch(e){}
  ui();document.body.classList.add("scanning");$("#scan").hidden=false;
  LIST=(await idbGet("scanlist"))||[];drawList();
  try{
    msg("Preparo il riconoscimento… (la prima volta serve internet)");
    await loadCV();
    if(!FP){const n=await buildPrints((i,t)=>msg(`Imparo le copertine nuove: ${i} di ${t}… (solo la prima volta)`));
      if(!n){msg("Non trovo le copertine: apri l'app con internet e riprova.");return}}
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){msg("Questo browser non lascia usare la fotocamera.");return}
    // formato 4:3 = tutto il sensore: inquadra più largo, così il disco entra anche tenendolo vicino
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"},width:{ideal:1440},height:{ideal:1080},aspectRatio:{ideal:4/3}},audio:false});
    try{const tr=stream.getVideoTracks()[0],cap=tr.getCapabilities?tr.getCapabilities():{};if(cap.zoom&&cap.zoom.min<1)await tr.applyConstraints({advanced:[{zoom:Math.max(cap.zoom.min,.6)}]})}catch(e){}
    const v=$("#sc-v");v.srcObject=stream;await v.play();
    running=true;streak=0;last=null;msg("Inquadra la copertina di un disco.");tick();
  }catch(e){
    msg(e&&e.name==="NotAllowedError"?"Serve il permesso per la fotocamera: consentilo e riapri.":e&&e.message==="rete"?"Per la prima volta serve internet: collegati e riprova.":"Non riesco ad avviare: "+(e.message||e));
  }
}
function close(){
  running=false;if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}
  const el=$("#scan");if(el)el.hidden=true;document.body.classList.remove("scanning");
}
window.Scanner={open,close};
})();
