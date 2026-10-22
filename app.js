(function(){
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const norm=s=>String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/ς/g,"σ").replace(/[^\p{L}\p{N}]+/gu," ").trim();
let DATA={d:[],t:{},m:[],date:"",ts:0},LK={ss:{},sp:{},cs:{},cp:{}}, DISCS=[], BY={}, TR=[], MUS={}, MLIST=[], SITE_S={}, SITE_P={}, SONGS=[];
const SITE='https://musicagreca.com/';const CANZ='https://musicagreca.github.io/musica-italiana/';let CS={},CP={};
const czLink=(id,kind)=>id?`<a class="badge cz" href="${CANZ}?${kind||'song'}=${encodeURIComponent(id)}" target="_blank" rel="noopener">canzoniere ↗</a>`:'';
const siteLink=(id,label)=>id?`<a class="badge" href="${SITE}#${encodeURIComponent(id)}" target="_blank" rel="noopener">${label||'sul sito'} ↗</a>`:'';
const loose=s=>norm(s).replace(/νδ/g,"ντ").replace(/γγ/g,"γκ").replace(/(^|\s)(και|κι|κ)(?=\s|$)/g,"$1κ").replace(/(\S+?)σ(?=\s|$)/g,"$1").replace(/ει|οι|υ|η/g,"ι").replace(/ω/g,"ο").replace(/\s+/g," ").trim();
const FN={"γιωργησ":"γιωργοσ","γεωργιοσ":"γιωργοσ","θεοδωροσ":"θοδωροσ","ιωαννησ":"γιαννησ","νικολαοσ":"νικοσ","αναστασιοσ":"τασοσ","βασιλειοσ":"βασιλησ","εμμανουηλ":"μανωλησ","κωνσταντινοσ":"κωστασ","δημητριοσ":"δημητρησ","μιχαηλ":"μιχαλησ","σπυριδων":"σπυροσ","ελευθεριοσ":"λευτερησ","στυλιανοσ":"στελιοσ","αθανασιοσ":"θανασησ","γρηγοριοσ":"γρηγορησ","αντωνιοσ":"αντωνησ","χαραλαμποσ":"μπαμπησ","λαμπησ":"μπαμπησ"};
const canonP=k=>{const w=norm(k).split(" ");if(w.length>1&&FN[w[0]])w[0]=FN[w[0]];return "~"+w.join(" ")};
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};

const QUAL=/^(1[89]\d\d|20\d\d|\d{4}\s*[–-]\s*\d{4}|ο\s+\S+|η\s+\S+|παλαι\S*|παλι\S*|νε[οό]\S*|μικρ\S*|μεγαλ\S*|παππο[υύ]\S*|εγγον\S*|πατερ\S*|πατέρ\S*|γιο\S*|θει\S*|θεί\S*|senior|junior|jr\.?|sr\.?|nonno|nipote|padre|figlio|zio|vecchio|giovane|il vecchio|il giovane)$/i;
const protQ=f=>String(f||"").replace(/\(([^()]*)\)/g,(m,c)=>QUAL.test(c.trim())?"⟨"+c.trim()+"⟩":m);
const unQ=s=>s.replace(/⟨([^⟩]*)⟩/g,"($1)");
const parsePerf=x=>{x=protQ(x.trim());const m=x.match(/^(.*?)\s*(?:\(([^()]*)\))?$/);return m?{name:unQ(m[1].trim()),role:m[2]||""}:null};
const splitN=f=>protQ(f).split(/\s*(?:[,;\/()]|\s[–—-]\s)\s*/).map(x=>unQ(x.trim().replace(/^(διασκευή|διασκ\.|arr\.|el\.|elab\.)\s*/i,"").trim())).filter(Boolean);
const TRAD=/παραδοσιακ|tradizional|traditional|αγνωστ|anonim|sconosciut/;
const surn=f=>new Set(splitN(f).map(x=>{const w=loose(x).split(" ");return TRAD.test(norm(x))?"#trad":w[w.length-1]}).filter(w=>w&&w.length>2));
function authCheck(t,id){const a=surn([t.mus,t.lyr].filter(Boolean).join(", "));const b=surn((LK.sa||{})[id]||"");if(!a.size||!b.size)return "";for(const x of a)if(b.has(x))return "ok";return "diff"}
let MAYBE=null,NOART=null;
const ART=/^(ο|η|το|οι|τα|τη|την|τον|του|της|των|τ|στη|στην|στο|στον|στα|σε|ένα|ενα|μια|μία)\s+/;
const noArt=l=>l.replace(ART,"");
function maybeSite(l){
  if(!NOART){NOART={};Object.keys(SITE_S).forEach(k=>{if(k[0]===" "){const a=noArt(k.trim());if(a&&!NOART[a])NOART[a]=SITE_S[k]}})}
  const na=noArt(l);if(na&&NOART[na])return NOART[na];
  if(!MAYBE){MAYBE=Object.keys(SITE_S).filter(k=>k[0]===" "&&k.trim().split(" ").length>=3).map(k=>[k.trim(),SITE_S[k]])}
  for(const [k,id] of MAYBE){if(l.startsWith(k+" ")||(l.split(" ").length>=3&&k.startsWith(l+" ")))return id}
  return "";
}
function build(){MAYBE=null;NOART=null;
  DISCS=DATA.d.map(r=>({code:r[0],shelf:r[1],pos:r[2],box:r[3],no:r[4],cat:r[5],title:r[6],artist:r[7],genre:r[8],sub:r[9],year:r[10],label:r[11],catno:r[12],country:r[13],n:r[14],dur:r[15],sup:r[16],notes:r[17]}));
  BY={};DISCS.forEach(d=>{BY[d.code]=d;d.tracks=[];d.copies=[];d.k=norm([d.code,d.title,d.artist,d.label,d.catno,d.sub].join(" "))});
  DISCS.forEach(d=>{const b=/B$/i.test(d.code)&&BY[d.code.slice(0,-1)];if(b&&b!==d){d.copyOf=b;b.copies.push(d)}});
  ALLD=DISCS;DISCS=DISCS.filter(d=>!d.copyOf);
  CS=LK.cs||{};CP=LK.cp||{};SITE_S=LK.ss||{};SITE_P=LK.sp||{};
  TR=[];MUS={};
  const addM=(name,kind,t)=>{name=name.trim();if(!name)return;const k=norm(name);if(!k)return;(MUS[k]||(MUS[k]={name,perf:[],mus:[],lyr:[],roles:new Set()}))[kind].push(t);};
  for(const [code,list] of Object.entries(DATA.t)){const d=BY[code];if(!d||d.copyOf)continue;
    for(const r of list){const t={d,n:r[0],title:r[1],tr:r[2],tipo:r[3],dur:r[4],mus:r[5],lyr:r[6],perf:r[7],note:r[8]};
      t.k=norm(t.title);t.kt=norm(t.tr);const _pm=String(t.title).match(/^(.*?)\s*\(([^()]+)\)\s*$/);t.site=SITE_S[t.k]||SITE_S[" "+loose(t.title)]||(_pm&&(SITE_S[" "+loose(_pm[1])]||SITE_S[" "+loose(_pm[2])]))||"";if(!t.site&&t.k){t.siteMaybe=maybeSite(loose(t.title));if(t.siteMaybe)t.maybeAuth=authCheck(t,t.siteMaybe)}t.cz=CS[t.k]||CS[" "+loose(t.title)]||"";d.tracks.push(t);TR.push(t);
      t.perfL=(t.perf||"").split(";").map(parsePerf).filter(x=>x&&x.name);
      t.perfL.forEach(p=>p.name.split(/\s\/\s/).forEach(nm=>{nm=nm.trim();if(!nm||!norm(nm))return;addM(nm,"perf",t);if(p.role)MUS[norm(nm)].roles.add(p.role)}));
      splitN(t.mus).forEach(x=>addM(x,"mus",t));splitN(t.lyr).forEach(x=>addM(x,"lyr",t));}}
  DISCS.forEach(d=>d.tracks.sort((a,b)=>(+a.n||0)-(+b.n||0)));
  (DATA.m||[]).forEach(r=>{const k=norm(r[0]);const m=MUS[k]||(MUS[k]={name:r[0],perf:[],mus:[],lyr:[],roles:new Set()});m.it=r[1];m.born=r[2];m.died=r[3];m.rl=r[4];m.instr=r[5];m.nick=r[6];m.siteFlag=r[7]});
  MLIST=Object.entries(MUS).map(([k,m])=>{m.k=k;m.cnt=m.perf.length+m.mus.length+m.lyr.length;m.site=SITE_P[k]||SITE_P[canonP(m.name)]||"";m.cz=CP[k]||"";return m}).filter(m=>m.cnt>0&&!/^(παραδοσιακ|traditional|tradizional|trad\b|anonim|διαφορ|αγνωστ|d\.\s?p\.?$|domaine public|public domain|dominio pubblico)/.test(m.k)).sort((a,b)=>b.cnt-a.cnt);
  const g={};TR.forEach(t=>{if(!t.k)return;(g[t.k]||(g[t.k]={title:t.title,k:t.k,v:[]})).v.push(t)});
  SONGS=Object.values(g).sort((a,b)=>a.k.localeCompare(b.k,"el"));
  $("#stamp").textContent=DISCS.length?`${DISCS.length.toLocaleString("it")} dischi${ALLD.length>DISCS.length?" (+"+(ALLD.length-DISCS.length)+" doppi)":""} · ${TR.length.toLocaleString("it")} brani · aggiornato al ${DATA.date}`:"";
}


/* ---------- copertine ---------- */
let CIDX={};const chunkP={};
const noB=c=>(c||"").replace(/B(?=(_\d+)?$)/,"");
const covCode=d=>[d.code,d.box,noB(d.code),noB(d.box)].find(c=>c&&CIDX[c]!==undefined)||null;
const covImg=(d,cls)=>{const c=covCode(d);return c?`<img class="cov ${cls}" data-cov="${esc(c)}" alt="" loading="lazy">`:`<span class="cov ${cls} nocov" aria-hidden="true"></span>`};
function loadChunk(i){return chunkP[i]||(chunkP[i]=fetch(`copertine/cov_${i}.json`).then(r=>{if(!r.ok)throw 0;return r.json()}).catch(()=>{delete chunkP[i];return {}}))}
let fillT;function fillCovers(){clearTimeout(fillT);fillT=setTimeout(()=>{document.querySelectorAll("img[data-cov]:not([src])").forEach(img=>{const c=img.dataset.cov;loadChunk(CIDX[c]).then(ch=>{if(ch[c])img.src="data:image/jpeg;base64,"+ch[c]})})},30)}
new MutationObserver(fillCovers).observe(document.body,{childList:true,subtree:true});

/* ---------- helpers ---------- */
const shelf1=d=>d.shelf?`<span class="shelf" title="Scaffale">${esc(d.shelf)}${d.pos?" · "+esc(d.pos):""}</span>`:"";
const shelfOf=d=>(d.copies&&d.copies.length&&!SHELFVIEW)?`<span class="shelves">${[d,...d.copies].map(shelf1).join("")}</span>`:shelf1(d);let SHELFVIEW=false,ALLD=[];
const discRow=d=>`<button class="row disc" data-disc="${esc(d.code)}">${covImg(d,"sm")}<span class="code">${esc(d.code)}</span><span class="main"><b>${esc(d.title)}</b><small>${esc(d.artist||"")}${d.year?" · "+esc(d.year):""}</small></span>${shelfOf(d)}</button>`;
const more=(id,shown,total)=>total>shown?`<button class="more" data-more="${id}">Mostra altri ${Math.min(200,total-shown)} di ${total-shown}</button>`:"";
const mlink=n=>n?`<a href="#" class="mlink" data-mus="${esc(norm(n))}">${esc(n)}</a>`:"";
const mlinks=s=>(s||"").split(/[,;]/).map(x=>x.trim()).filter(Boolean).map(mlink).join(", ");

/* ---------- search ---------- */
function search(q){
  const out=$("#out-cerca"); const k=norm(q);
  if(k.length<2){out.innerHTML=summary();return;}
  const words=k.split(" ");const has=s=>words.every(w=>s.includes(w));
  const ds=DISCS.filter(d=>has(d.k));
  const gs=SONGS.filter(s=>has(s.k)||s.v.some(t=>t.kt&&has(t.kt)));
  const ms=MLIST.filter(m=>has(m.k)||(m.it&&has(norm(m.it))));
  let h="";
  h+=`<section><h3>Brani <span class="count">${gs.length}</span></h3>${gs.slice(0,40).map(songBlock).join("")||'<p class="empty">Nessun brano con queste parole.</p>'}${gs.length>40?`<p class="hint">Mostro i primi 40: aggiungi una parola per restringere.</p>`:""}</section>`;
  h+=`<section><h3>Dischi <span class="count">${ds.length}</span></h3>${ds.slice(0,60).map(discRow).join("")||'<p class="empty">Nessun disco.</p>'}</section>`;
  h+=`<section><h3>Musicisti <span class="count">${ms.length}</span></h3>${ms.slice(0,30).map(musRow).join("")||'<p class="empty">Nessun musicista.</p>'}</section>`;
  out.innerHTML=h;
}
function songBlock(s){
  const site=(s.v.find(t=>t.site)||{}).site;const cz=(s.v.find(t=>t.cz)||{}).cz;
  return `<div class="song"><div class="songhead"><b>${esc(s.title)}</b>${s.v[0].tr?`<i>${esc(s.v[0].tr)}</i>`:""}<span class="count">${s.v.length} ${s.v.length==1?"versione":"versioni"}</span>${siteLink(site)}${czLink(cz)}${!site&&!cz&&sMaybe(s)?(x=>maybeLink(x.siteMaybe,(s.v.find(t=>t.maybeAuth==="ok")||x).maybeAuth))(s.v.find(t=>t.siteMaybe)):!site&&!cz&&sGr(s)?'<span class="badge off">non sul sito</span>':""}</div>
  <ul>${s.v.map(t=>`<li><button class="ver" data-disc="${esc(t.d.code)}">${covImg(t.d,"xs")}<span class="code">${esc(t.d.code)}</span><span>${esc(t.perfL.map(p=>p.name).join(", ")||t.d.artist||"")}<small>${esc(t.d.title)}</small></span>${shelfOf(t.d)}</button></li>`).join("")}</ul></div>`;
}
const musRow=m=>{const c=mcounts(m);const parts=[c.sing&&`${c.sing} cantate`,c.ins&&`${c.ins} suonate`,c.mus&&`${c.mus} composte`,c.lyr&&`${c.lyr} testi`].filter(Boolean).join(" · ");
  return `<button class="row mus" data-mus="${esc(m.k)}"><span class="main"><b>${esc(m.name)}</b><small>${esc([m.it&&m.it!==m.name?m.it:"",parts].filter(Boolean).join(" — "))}</small></span>${m.site?'<span class="badge">sul sito</span>':m.cz?'<span class="badge cz">canzoniere</span>':'<span class="badge off">da scrivere</span>'}<span class="num">${mval(m)}</span></button>`};

function summary(){
  const cats=count(DISCS,d=>d.cat);
  return `<div class="welcome"><p>Scrivi un titolo, un musicista, un'etichetta o un codice. Gli accenti non contano: <a href="#" data-q="τσιτσανης">τσιτσανης</a> trova Τσιτσάνης.</p>
  <div class="tiles"><div><b>${DISCS.length}</b><span>dischi</span></div><div><b>${TR.length.toLocaleString("it")}</b><span>brani</span></div><div><b>${SONGS.length.toLocaleString("it")}</b><span>canzoni diverse</span></div><div><b>${MLIST.length.toLocaleString("it")}</b><span>musicisti</span></div></div>
  <h3>Categorie</h3><div class="chips">${cats.map(([c,n])=>`<button class="chip" data-cat="${esc(c)}">${esc(c)} <span>${n}</span></button>`).join("")}</div></div>`;
}
const count=(arr,f)=>{const m={};arr.forEach(x=>{const k=f(x)||"—";m[k]=(m[k]||0)+1});return Object.entries(m).sort((a,b)=>b[1]-a[1])};

/* ---------- dischi ---------- */
let dcat="",dshown=200,dgrid=store.get("disco-grid")==="1";
function renderDischi(){
  const cats=count(DISCS,d=>d.cat);
  const pre=dcat?(DISCS.filter(d=>d.cat===dcat).map(d=>d.code.match(/^[A-Z]+/)?.[0]).reduce((m,p)=>(m[p]=(m[p]||0)+1,m),{})):{};const main=Object.entries(pre).sort((a,b)=>b[1]-a[1])[0]?.[0];
  const list=DISCS.filter(d=>!dcat||d.cat===dcat).slice().sort((a,b)=>(dcat?((a.code.match(/^[A-Z]+/)?.[0]===main?0:1)-(b.code.match(/^[A-Z]+/)?.[0]===main?0:1)):0)||a.code.localeCompare(b.code,"it",{numeric:true}));
  $("#out-dischi").innerHTML=`<div class="chips"><button class="chip ${dcat?"":"on"}" data-dcat="">Tutti <span>${DISCS.length}</span></button>${cats.map(([c,n])=>`<button class="chip ${c===dcat?"on":""}" data-dcat="${esc(c)}">${esc(c)} <span>${n}</span></button>`).join("")}</div>
  ${pbar([["dpos","Stampa per posizione"],["dtit","Stampa per titolo"]])}<div class="seg"><button data-grid="0" class="${dgrid?"":"on"}">Elenco</button><button data-grid="1" class="${dgrid?"on":""}">Copertine</button></div>
  ${dgrid?`<div class="grid">${list.slice(0,dshown).map(d=>`<button class="tile" data-disc="${esc(d.code)}">${covImg(d,"gr")}<span class="code">${esc(d.code)}</span><small>${esc(d.title)}</small></button>`).join("")}</div>`:`<div class="list">${list.slice(0,dshown).map(discRow).join("")}</div>`}${more("dischi",Math.min(dshown,list.length),list.length)}`;
}
/* ---------- brani ---------- */
let letter="";
let bfilt="";
const maybeLink=(id,au)=>`<a class="badge maybe${au==="ok"?" good":au==="diff"?" weak":""}" href="${SITE}#${encodeURIComponent(id)}" target="_blank" rel="noopener" title="Somiglia a: ${esc((LK.st||{})[id]||"")}">forse sul sito ↗</a><small class="maybe-why">somiglia a: ${esc((LK.st||{})[id]||"?")}${au==="ok"?" · <b>stesso autore</b>":au==="diff"?" · autore diverso ("+esc((LK.sa||{})[id]||"")+")":""}</small>`;
const tBadge=t=>t.site?siteLink(t.site):t.siteMaybe?maybeLink(t.siteMaybe,t.maybeAuth):t.cz?czLink(t.cz):sGr({title:t.title})?'<span class="badge off">non sul sito</span>':"";
const sSite=s=>s.v.some(t=>t.site),sMaybe=s=>!sSite(s)&&s.v.some(t=>t.siteMaybe),sCz=s=>s.v.some(t=>t.cz),sGr=s=>/[\u0370-\u03ff\u1f00-\u1fff]/.test(s.title);
const BF={"":["Tutti",s=>true],si:["Sul sito",sSite],maybe:["Forse sul sito",sMaybe],no:["Greci non ancora sul sito",s=>sGr(s)&&!sSite(s)&&!sMaybe(s)],cz:["Nel canzoniere",sCz],czno:["Altri non nel canzoniere",s=>!sGr(s)&&!sCz(s)]};
const bList=()=>SONGS.filter(BF[bfilt][1]);
function renderBrani(){
  const first=s=>(s.k[0]||"#");
  const base=bList();
  const letters=[...new Set(base.map(first))];
  if(!letters.includes(letter))letter=letters.find(l=>/[α-ω]/.test(l))||letters[0]||"";
  const list=base.filter(s=>first(s)===letter);
  const chips=Object.entries(BF).map(([k,[l,f]])=>`<button class="chip ${bfilt===k?"on":""}" data-bfilt="${k}">${l} <span>${SONGS.filter(f).length.toLocaleString("it")}</span></button>`).join("");
  $("#out-brani").innerHTML=`<p class="hint">${SONGS.length.toLocaleString("it")} canzoni diverse. Ogni canzone mostra tutti i dischi in cui c'è.</p><div class="chips">${chips}</div>${bfilt==="no"?`<p class="hint">Canzoni con titolo greco che nei tuoi dischi ci sono ma su musicagreca.com non ancora. In cima alla lettera, quelle con più versioni.</p>`:""}${pbar([["blet","Stampa questa lettera"],["ball","Stampa tutto l'elenco"]])}<div class="az">${letters.map(l=>`<button class="${l===letter?"on":""}" data-letter="${esc(l)}">${esc(l.toUpperCase())}</button>`).join("")}</div>
  <div>${(bfilt==="no"?list.slice().sort((a,b)=>b.v.length-a.v.length):list).slice(0,300).map(songBlock).join("")}</div>${list.length>300?`<p class="hint">Mostro le prime 300 di ${list.length}: usa la ricerca per trovare le altre.</p>`:""}`;
}
/* ---------- musicisti ---------- */
let mshown=150,mq="",mrole="",msite="",msort="n",mlet="";
const VOC=/τραγο|φων|voce|vocal|canto|ερμην|cant/i;
function mcounts(m){if(m._c)return m._c;let sing=0,ins=0;m.perf.forEach(t=>{const p=t.perfL.find(p=>norm(p.name)===m.k);(p&&p.role&&!VOC.test(p.role)?ins++:sing++)});return m._c={sing,ins,mus:m.mus.length,lyr:m.lyr.length}}
const ROLES=[["","Tutti"],["sing","Cantanti"],["ins","Strumentisti"],["mus","Compositori"],["lyr","Parolieri"]];
const mval=m=>{const c=mcounts(m);return mrole?c[mrole]:m.cnt};
const mfirst=m=>{const c=norm(m.name)[0]||"#";return /\p{L}/u.test(c)?c:"#"};
function renderMus(){
  const k=norm(mq);
  let base=MLIST.filter(m=>(!k||m.k.includes(k)||(m.it&&norm(m.it).includes(k)))&&(!mrole||mcounts(m)[mrole]>0));
  const withS=base.filter(m=>m.site).length;
  let list=base.filter(m=>!msite||(msite==="si"?m.site:!m.site));
  if(msort==="a"){list=list.slice().sort((a,b)=>norm(a.name).localeCompare(norm(b.name),"el"))}else{list=list.slice().sort((a,b)=>mval(b)-mval(a))}
  MPRINT=list;let az="";
  if(msort==="a"){const L=[...new Set(list.map(mfirst))].sort((a,b)=>a.localeCompare(b,"el"));if(!L.includes(mlet))mlet=L.find(l=>/[α-ω]/.test(l))||L[0]||"";az=`<div class="az">${L.map(l=>`<button class="${l===mlet?"on":""}" data-mlet="${esc(l)}">${esc(l.toUpperCase())}</button>`).join("")}</div>`;list=list.filter(m=>mfirst(m)===mlet)}
  const ch=(key,val,label,cur)=>`<button class="chip ${cur===val?"on":""}" data-${key}="${esc(val)}">${label}</button>`;
  $("#mus-controls").innerHTML=`<div class="chips">${ROLES.map(([v,l])=>ch("mrole",v,l,mrole)).join("")}</div>
   <div class="chips">${ch("msite","","Tutti",msite)}${ch("msite","si",`Con scheda sul sito <span>${withS}</span>`,msite)}${ch("msite","no",`Senza scheda <span>${base.length-withS}</span>`,msite)}
   <span class="sep"></span>${ch("msort","n","Per presenza",msort)}${ch("msort","a","A–Z",msort)}</div>
   ${pbar([["mus","Stampa l'elenco (solo nomi)"]])}<p class="hint">${base.length.toLocaleString("it")} ${ROLES.find(r=>r[0]===mrole)[1].toLowerCase()}${msite==="no"&&msort==="n"?" · in cima chi compare di più e non ha ancora la scheda: i primi candidati da scrivere.":""}</p>${az}`;
  $("#out-musicisti-list").innerHTML=list.slice(0,mshown).map(musRow).join("")+more("musicisti",Math.min(mshown,list.length),list.length);
}
/* ---------- mappa ---------- */
const MAP=[["C00",54,195,184,236],["C04 01",786,195,903,236],["C01",54,236,184,338],["C04",184,236,786,297],["C21",786,236,903,338,"+ DVD"],["C24",903,297,1399,359],["C05",184,297,300,419],["C08",300,297,423,359],["C11",423,297,540,419],["C14",540,297,670,359],["C18",670,297,786,419],["C02",54,338,184,440],["C09",300,359,423,419],["C15",540,359,670,419],["C22",786,338,903,440],["C25",903,359,1399,419],["C06",184,419,300,481],["C10",300,419,423,542],["C12",423,419,540,481],["C16",540,419,670,481],["C19",670,419,786,481],["C26",903,419,1399,481],["C03",54,440,184,542],["C23",786,440,903,542],["C07",184,481,300,542],["C13",423,481,540,542],["C17",540,481,670,542],["C20",670,481,786,542],["C27",903,481,1399,542],
["V01",54,563,300,706],["V02",54,706,300,848],["V03",54,848,300,1033],["V04",300,604,485,746],["V05",300,746,485,890],["V06",300,890,485,1033],["V07",485,542,732,665],["V08",485,665,732,807],["CASSETTO",485,807,732,869],["CASSETTO 2",485,869,732,931],["CASSETTO 3",485,931,732,992],["V09",732,604,903,746],["V10",732,746,903,890],["V11",732,890,903,1033],
["",54,542,300,563],["",300,542,485,604],["",732,542,903,604],["",485,992,732,1033]];
const CATCOL={"Dimotikà":"#5b8c5a","Rebetiko":"#b5543c","Rebetiko non originale":"#d08a6e","Laïká":"#c9a227","Kritikà":"#3f7cac","Asia Minore":"#8e5ea2","Asia Minore non originale":"#b391c2","Éntekhno":"#2f9e9e","Italiana":"#6c8ebf","Classica":"#7a7a7a","Rock":"#444","Rock greco":"#666","Pop":"#c07aa0","Pop greco":"#d6a3be","Jazz, blues, gospel":"#7b5e3b","Canzoni dal mondo":"#a0855b","DVD":"#999","Varie (edizione greca)":"#b8a88a"};
const shelfKey=sh=>{sh=String(sh||"").trim();if(/^cassetto/i.test(sh))return "CASSETTO";if(/^C04-1/i.test(sh))return "C04 01";const m=sh.match(/^([CV]\d\d)/i);return m?m[1].toUpperCase():sh||"—"};
function mapSVG(){
  const g={};ALLD.forEach(d=>{const k=shelfKey(d.shelf);(g[k]||(g[k]=[])).push(d)});
  const box=([k,x1,y1,x2,y2,extra])=>{const w=x2-x1,h=y2-y1;if(!k)return `<rect x="${x1}" y="${y1}" width="${w}" height="${h}" class="mx"/>`;
    const l=g[k]||[];const cats=count(l,d=>d.cat);const col=l.length?(CATCOL[cats[0][0]]||"#999"):"none";
    const fs=Math.min(34,w/3.2,h/2.2);
    return `<g class="mb${l.length?"":" empty"}" data-shelfmap="${esc(k)}"><rect x="${x1}" y="${y1}" width="${w}" height="${h}" style="fill:${col}"/><text x="${x1+w/2}" y="${y1+h/2-(l.length?fs*.15:0)}" font-size="${fs}">${esc(k)}</text>${l.length?`<text class="n" x="${x1+w/2}" y="${y1+h/2+fs*.95}" font-size="${fs*.72}">${l.length}${extra?" "+extra:""}</text>`:""}</g>`};
  const used=new Set(Object.values(CATCOL));const legend=count(ALLD,d=>d.cat).filter(([c])=>CATCOL[c]).map(([c,n])=>`<span><i style="background:${CATCOL[c]}"></i>${esc(c)}</span>`).join("");
  const other=Object.keys(g).filter(k=>!MAP.some(m=>m[0]===k));
  return `<div class="mapwrap"><div class="mapscroll"><svg viewBox="40 185 1370 880" class="map" role="img" aria-label="Mappa degli scaffali">${MAP.map(box).join("")}<text x="60" y="1055" class="mlab">CD sopra · vinili (V) sotto · tocca uno scaffale</text></svg></div><div class="legend">${legend}</div>${other.length?`<p class="hint">Altri posti: ${other.map(k=>`<a href="#" data-shelfmap="${esc(k)}">${esc(k)}</a> (${g[k].length})`).join(" · ")}</p>`:""}</div>`;
}
function openShelf(k){
  const l=ALLD.filter(d=>shelfKey(d.shelf)===k).slice().sort((a,b)=>String(a.shelf).localeCompare(String(b.shelf),"it",{numeric:true})||(!a.pos-!b.pos)||String(a.pos).localeCompare(String(b.pos),"it",{numeric:true}));
  const sub={};l.forEach(d=>(sub[d.shelf]||(sub[d.shelf]=[])).push(d));
  SHELFVIEW=true;$("#panel-body").innerHTML=`<p class="eyebrow">Scaffale</p><h2>${esc(k)}</h2><p class="by">${l.length} dischi · ${esc(count(l,d=>d.cat).map(([c,n])=>c+" "+n).join(" · "))}</p>${Object.entries(sub).map(([s,ds])=>`${Object.keys(sub).length>1?`<h3>${esc(s)} <span class="count">${ds.length}</span></h3>`:""}<div class="list">${ds.map(discRow).join("")}</div>`).join("")||'<p class="empty">Vuoto.</p>'}`;SHELFVIEW=false;
  showPanel();
}

/* ---------- scaffali ---------- */
function renderShelves(){
  SHELFVIEW=true;const m={};ALLD.forEach(d=>{(m[d.shelf||"—"]||(m[d.shelf||"—"]=[])).push(d)});
  const keys=Object.keys(m).sort((a,b)=>a.localeCompare(b,"it",{numeric:true}));
  $("#out-scaffali").innerHTML=mapSVG()+pbar([["shelf","Stampa tutti gli scaffali"],["map","Stampa la mappa"]])+`<p class="hint">${keys.length} spazi. Tocca uno spazio per vedere i dischi nell'ordine in cui stanno.</p>`+keys.map(s=>{const l=m[s].sort((a,b)=>(!a.pos-!b.pos)||String(a.pos).localeCompare(String(b.pos),"it",{numeric:true})||a.code.localeCompare(b.code,"it",{numeric:true}));const cats=count(l,d=>d.cat).map(([c,n])=>`${c} ${n}`).join(" · ");
    return `<details class="shelfbox"><summary><span class="shelf big">${esc(s)}</span><span class="main"><b>${l.length} dischi</b><small>${esc(cats)}</small></span></summary><div class="list">${l.map(discRow).join("")}</div></details>`}).join("");SHELFVIEW=false;
}
/* ---------- numeri ---------- */
function bars(rows,unit){const max=Math.max(...rows.map(r=>r[1]),1);return `<div class="bars">${rows.map(([l,n,act])=>`<div class="bar"${act?` ${act}`:""}><span class="bl">${esc(l)}</span><span class="bt"><span style="width:${(n/max*100).toFixed(1)}%"></span></span><span class="bn">${n}</span></div>`).join("")}</div><p class="axis">Barra piena = ${max} ${unit}</p>`}
function renderNum(){
  const cats=count(DISCS,d=>d.cat);
  const dec={};DISCS.forEach(d=>{const y=parseInt(d.year);if(y>1890&&y<2100){const k=Math.floor(y/10)*10;dec[k]=(dec[k]||0)+1}});
  const decs=Object.entries(dec).sort((a,b)=>a[0]-b[0]).map(([k,n])=>[k+"–"+(String(+k+9).slice(2)),n]);
  const labs=count(DISCS.filter(d=>d.label),d=>d.label.split("/")[0].trim()).slice(0,12);
  const tops=MLIST.slice(0,15).map(m=>[m.name,m.cnt,`data-mus="${esc(m.k)}"`]);
  const vers=SONGS.slice().sort((a,b)=>b.v.length-a.v.length).slice(0,15).map(s=>[s.title,s.v.length,`data-q="${esc(s.title)}"`]);
  const noyear=DISCS.length-Object.values(dec).reduce((a,b)=>a+b,0);
  $("#out-numeri").innerHTML=`<section><h3>Dischi per categoria</h3>${bars(cats.map(([c,n])=>[c,n,`data-cat="${esc(c)}"`]),"dischi")}</section>
  <section><h3>Dischi per decennio di uscita</h3>${bars(decs,"dischi")}<p class="hint">${noyear} dischi senza anno non sono contati.</p></section>
  <section><h3>Canzoni con più versioni</h3>${bars(vers,"versioni")}</section>
  <section><h3>Musicisti più presenti</h3><p class="hint">Conta i brani in cui compaiono come interpreti, compositori o parolieri.</p>${bars(tops,"brani")}</section>
  <section><h3>Etichette più presenti</h3>${bars(labs,"dischi")}</section>`;
}
/* ---------- panels ---------- */
function openDisc(code){
  let d=BY[code];if(!d)return;if(d.copyOf)d=d.copyOf;
  const f=(l,v)=>v?`<div><dt>${l}</dt><dd>${esc(v)}</dd></div>`:"";
  $("#panel-body").innerHTML=`<div class="dhead">${covImg(d,"lg")}<div><p class="eyebrow">${esc(d.code)} · ${esc(d.cat)}${d.sup&&d.sup!=="CD"?" · "+esc(d.sup):""}</p><h2>${esc(d.title)}</h2><p class="by">${esc(d.artist||"")}</p></div></div>
  <div class="where">${d.shelf?`<span class="shelf big">${esc(d.shelf)}</span><span>Scaffale${d.pos?", posizione "+esc(d.pos):""}${d.box?" · scatola "+esc(d.box)+(d.no?", disco "+esc(d.no):""):""}</span>`:"<span>Scaffale non indicato</span>"}</div>${d.copies.map(c=>`<div class="where">${c.shelf?`<span class="shelf big">${esc(c.shelf)}</span>`:""}<span>Doppio (${esc(c.code)})${c.pos?", posizione "+esc(c.pos):""}</span></div>`).join("")}
  <dl class="facts">${f("Anno",d.year)}${f("Etichetta",d.label)}${f("N. catalogo",d.catno)}${f("Paese",d.country)}${f("Genere",[d.genre,d.sub].filter(Boolean).join(" · "))}${f("Durata",d.dur)}</dl>
  ${d.notes?`<p class="notes">${esc(d.notes)}</p>`:""}
  <h3>Brani <span class="count">${d.tracks.length}</span></h3>
  <ol class="tracks">${d.tracks.map(t=>`<li><span class="tn">${esc(t.n)}</span><div><b><a href="#" data-q="${esc(t.title)}">${esc(t.title)}</a></b>${' '+tBadge(t)}${t.tr?`<i> ${esc(t.tr)}</i>`:""}${t.tipo?`<small class="tipo">${esc(t.tipo)}</small>`:""}
   <p class="credits">${t.mus?`Musica: ${mlinks(t.mus)}`:""}${t.lyr?` · Testo: ${mlinks(t.lyr)}`:""}${t.perfL.length?`<br>${t.perfL.map(p=>mlink(p.name)+(p.role?` <span class="role">${esc(p.role)}</span>`:"")).join(", ")}`:""}</p>${t.note?`<p class="tnote">${esc(t.note)}</p>`:""}</div><span class="td">${esc(t.dur)}</span></li>`).join("")}</ol>`;
  showPanel();
}
function openMus(k){
  const m=MUS[k];if(!m)return;
  const discs={};const add=(t,role)=>{const x=discs[t.d.code]||(discs[t.d.code]={d:t.d,items:[]});const it=x.items.find(i=>i[0]===t);if(it){if(!it[1].includes(role))it[1].push(role)}else x.items.push([t,[role]])};
  m.perf.forEach(t=>add(t,(t.perfL.find(p=>norm(p.name)===k||p.name.split(/\s\/\s/).some(n=>norm(n)===k))||{}).role||"interprete"));m.mus.forEach(t=>add(t,"musica"));m.lyr.forEach(t=>add(t,"testo"));
  Object.values(discs).forEach(x=>x.items.sort((a,b)=>(+a[0].n||0)-(+b[0].n||0)));const list=Object.values(discs).sort((a,b)=>b.items.length-a.items.length);
  const life=[m.born&&"Nato: "+m.born,m.died&&"Morto: "+m.died].filter(Boolean).join(" · ");
  const needs=isGreek(m.name)?!m.site:!m.cz;
  $("#panel-body").innerHTML=`<p class="eyebrow">Musicista ${siteLink(m.site,'scheda sul sito')} ${czLink(m.cz,'persona')}</p><h2>${esc(m.name)}</h2>${needs?`<p class="scrivi"><button type="button" data-scrivi="${esc(k)}">✍️ Scrivi la scheda</button> <span id="scrivi-msg">Copia i dati per l'admin ${isGreek(m.name)?"del sito":"del canzoniere"}.</span></p>`:""}<p class="by">${esc([m.it,m.nick&&"«"+m.nick+"»"].filter(Boolean).join(" · "))}</p>
  ${life?`<p class="notes">${esc(life)}</p>`:""}${m.instr||m.rl?`<p class="notes">${esc([m.rl,m.instr].filter(Boolean).join(" — "))}</p>`:""}
  <div class="tiles small"><div><b>${list.length}</b><span>dischi</span></div><div><b>${m.perf.length}</b><span>come interprete</span></div><div><b>${m.mus.length}</b><span>come compositore</span></div><div><b>${m.lyr.length}</b><span>come paroliere</span></div></div>
  <h3>Nei tuoi dischi</h3>${list.map(x=>`<div class="mdisc">${discRow(x.d)}<ul>${x.items.map(([t,r])=>`<li><span class="tn">${esc(t.n)}</span> ${esc(t.title)} <span class="role">${esc(r.join(", "))}</span> ${tBadge(t)}</li>`).join("")}</ul></div>`).join("")}`;
  showPanel();
}
let lastFocus=null;
function showPanel(){lastFocus=document.activeElement;$("#panel").hidden=false;$("#panel").scrollTop=0;$("#panel-close").focus();document.body.classList.add("locked")}
function closePanel(){$("#panel").hidden=true;document.body.classList.remove("locked");lastFocus&&lastFocus.focus&&lastFocus.focus()}

/* ---------- scrivi la scheda ---------- */
const INSTR={"λυρα":"lira","λαουτο":"laouto","βιολι":"violino","κλαρινο":"clarinetto","μπουζουκι":"bouzouki","κιθαρα":"chitarra","μπαγλαμασ":"baglamàs","σαντουρι":"santouri","ουτι":"oud","κανονακι":"kanonaki","ακορντεον":"fisarmonica","πιανο":"pianoforte","κρουστα":"percussioni","μπασο":"basso","τουμπερλεκι":"toumberleki","ασκομαντουρα":"askomandoura","νταουλι":"daouli","ζουρνασ":"zurna","φλογερα":"flauto","τσαμπουνα":"tsambouna","μαντολινο":"mandolino","τζουρασ":"tzouras","μπουλγαρι":"boulgari","γκαιντα":"gaida","λαφτα":"lafta","πολιτικη λυρα":"lira di Costantinopoli","νεϊ":"ney","νει":"ney","ταμπουρασ":"tambouras","κεμεντζεσ":"kemenche","τρομπετα":"tromba","σαξοφωνο":"sassofono","ντραμσ":"batteria","πληκτρα":"tastiere"};
const isGreek=s=>/[\u0370-\u03ff\u1f00-\u1fff]/.test(s);
function schedaText(m){
  const c=mcounts(m);const roles=[];if(c.lyr)roles.push("at");if(c.mus)roles.push("am");if(c.sing||c.ins)roles.push("ar");
  const ins=new Set();m.roles.forEach(r=>r.split(/[\/,]|\s+και\s+|\s+e\s+/).forEach(x=>{const k=norm(x);if(!k||VOC.test(x))return;ins.add(INSTR[k]||x.trim().toLowerCase())}));
  const ruoli=[c.sing&&"cantante",c.ins&&"musicista",c.mus&&"compositore",c.lyr&&"paroliere"].filter(Boolean).join(", ");
  const discs={};const add=(t,r)=>{const x=discs[t.d.code]||(discs[t.d.code]={d:t.d,r:new Set(),n:0});x.r.add(r);x.n++};
  m.perf.forEach(t=>add(t,"interprete"));m.mus.forEach(t=>add(t,"musica"));m.lyr.forEach(t=>add(t,"testo"));
  const dl=Object.values(discs).sort((a,b)=>b.n-a.n).slice(0,40).map(x=>`${posOf(x.d)} — ${x.d.title}${x.d.year?" ("+x.d.year+")":""}: ${[...x.r].join(", ")}, ${x.n} ${x.n==1?"brano":"brani"}`);
  return "SCHEDA-DISCHI:"+JSON.stringify({name:m.name,nameit:m.it||"",nick:m.nick||"",born:m.born||"",died:m.died||"",roles,ruoli,instr:[...ins].join(", "),discs:dl,tot:m.cnt});
}
async function copyText(t){try{await navigator.clipboard.writeText(t);return true}catch(e){const a=document.createElement("textarea");a.value=t;document.body.appendChild(a);a.select();let ok=false;try{ok=document.execCommand("copy")}catch(e){}a.remove();return ok}}
async function scrivi(k){const m=MUS[k];if(!m)return;const ok=await copyText(schedaText(m));const where=isGreek(m.name)?"l'<b>admin del sito</b> (blog_admin), vai su «👤 Persone»":"l'<b>admin del canzoniere</b>, vai su «Schede»";
  $("#scrivi-msg").innerHTML=ok?`✓ Copiato. Ora apri ${where} e premi <b>«📋 Incolla dai dischi»</b>.`:"Copia non riuscita: riprova dal computer.";}

/* ---------- stampa ---------- */
const posOf=d=>d.shelf?d.shelf+(d.pos?" · "+d.pos:""):"—";
const byPos=(a,b)=>(!a.shelf-!b.shelf)||String(a.shelf||"").localeCompare(String(b.shelf||""),"it",{numeric:true})||(!a.pos-!b.pos)||String(a.pos).localeCompare(String(b.pos),"it",{numeric:true});
const byTit=(a,b)=>norm(a.title).localeCompare(norm(b.title),"el");
const pbar=btns=>`<div class="printbar">${btns.map(([k,l])=>`<button type="button" data-print="${k}">🖨 ${l}</button>`).join("")}</div>`;
let MPRINT=[];
function printList(title,lines,cols){
  const now=new Date().toLocaleDateString("it-IT");
  $("#print").innerHTML=`<h1>${esc(title)}</h1><p class="psub">${lines.length.toLocaleString("it")} voci · ${now}</p><ol class="pl c${cols||1}">${lines.map(l=>`<li>${l}</li>`).join("")}</ol>`;
  setTimeout(()=>window.print(),50);
}
function doPrint(k){
  const cat=dcat?" – "+dcat:"";
  if(k==="dpos"||k==="shelf"){const l=ALLD.filter(d=>k==="shelf"||!dcat||d.cat===dcat).slice().sort(byPos);return printList("Dischi per posizione"+(k==="shelf"?"":cat),l.map(d=>`<b>${esc(posOf(d))}</b> ${esc(d.title)}`),2)}
  if(k==="map"){$("#print").innerHTML=`<h1>I miei scaffali</h1><p class="psub">${new Date().toLocaleDateString("it-IT")}</p>`+mapSVG();return setTimeout(()=>window.print(),50)}
  if(k==="dtit"){const l=DISCS.filter(d=>!dcat||d.cat===dcat).slice().sort(byTit);return printList("Dischi per titolo"+cat,l.map(d=>`${esc(d.title)} <b>${esc([d,...d.copies].map(posOf).join(" + "))}</b>`),2)}
  if(k==="blet"||k==="ball"){const base=bList();const l=k==="ball"?base:base.filter(s=>(s.k[0]||"#")===letter);
    return printList((bfilt?BF[bfilt][0]:"Brani")+(k==="ball"?"":" – "+letter.toUpperCase()),l.map(s=>`${esc(s.title)} <b>${esc([...new Set(s.v.map(t=>posOf(t.d)))].join(", "))}</b>`),2)}
  if(k==="mus"){const l=MPRINT.slice().sort((a,b)=>norm(a.name).localeCompare(norm(b.name),"el"));const r=ROLES.find(x=>x[0]===mrole)[1];
    return printList("Musicisti – "+r+(msite==="si"?" con scheda":msite==="no"?" senza scheda":""),l.map(m=>esc(m.name)),3)}
}

/* ---------- tabs ---------- */
const views={cerca:()=>search($("#q").value),dischi:renderDischi,brani:renderBrani,musicisti:renderMus,scaffali:renderShelves,numeri:renderNum};
const done={};
function tab(name){cur=name;document.querySelectorAll("[data-tab]").forEach(b=>b.setAttribute("aria-selected",b.dataset.tab===name));document.querySelectorAll(".view").forEach(v=>v.hidden=v.id!=="v-"+name);if(!done[name]||name==="cerca"){views[name]();done[name]=1}store.set("disco-tab",name);window.scrollTo(0,0)}

document.addEventListener("click",e=>{
  const pe=e.target.closest("[data-print]");if(pe)return doPrint(pe.dataset.print);
  const sm=e.target.closest("[data-shelfmap]");if(sm){e.preventDefault();return openShelf(sm.dataset.shelfmap)}
  const se=e.target.closest("[data-scrivi]");if(se)return scrivi(se.dataset.scrivi);
  const el=e.target.closest("[data-bfilt],[data-mrole],[data-msite],[data-msort],[data-mlet],[data-grid],[data-tab],[data-disc],[data-mus],[data-q],[data-cat],[data-dcat],[data-letter],[data-more],#panel-close");if(!el)return;
  if(el.matches("a"))e.preventDefault();
  if(el.id==="panel-close")return closePanel();
  if(el.dataset.mrole!==undefined){mrole=el.dataset.mrole;mshown=150;renderMus();return}
  if(el.dataset.msite!==undefined){msite=el.dataset.msite;mshown=150;renderMus();return}
  if(el.dataset.msort!==undefined){msort=el.dataset.msort;mshown=150;renderMus();return}
  if(el.dataset.mlet!==undefined){mlet=el.dataset.mlet;renderMus();return}
  if(el.dataset.grid!==undefined){dgrid=el.dataset.grid==="1";store.set("disco-grid",dgrid?"1":"0");renderDischi();return}
  if(el.dataset.tab)return tab(el.dataset.tab);
  if(el.dataset.disc)return openDisc(el.dataset.disc);
  if(el.dataset.mus)return openMus(el.dataset.mus);
  if(el.dataset.q!==undefined){closePanel();$("#q").value=el.dataset.q;done.cerca=0;tab("cerca");return}
  if(el.dataset.cat!==undefined){closePanel();dcat=el.dataset.cat;dshown=200;done.dischi=0;tab("dischi");return}
  if(el.dataset.dcat!==undefined){dcat=el.dataset.dcat;dshown=200;renderDischi();return}
  if(el.dataset.letter){letter=el.dataset.letter;renderBrani();return}
  if(el.dataset.bfilt!==undefined){bfilt=el.dataset.bfilt;renderBrani();return}
  if(el.dataset.more==="dischi"){dshown+=200;renderDischi()}
  if(el.dataset.more==="musicisti"){mshown+=200;renderMus()}
});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("#panel").hidden)closePanel()});
$("#panel").addEventListener("click",e=>{if(e.target.id==="panel")closePanel()});
let tm;$("#q").addEventListener("input",e=>{clearTimeout(tm);tm=setTimeout(()=>search(e.target.value),150)});
$("#mq").addEventListener("input",e=>{mq=e.target.value;mshown=150;renderMus()});

/* ---------- carica Excel ---------- */
const DB="discoteca";function idb(){return new Promise((res,rej)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore("d");r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function saveData(d){idbPut("data",d)}
async function loadSaved(){try{const db=await idb();return await new Promise(r=>{const q=db.transaction("d").objectStore("d").get("data");q.onsuccess=()=>r(q.result);q.onerror=()=>r(null)})}catch(e){return null}}
const fmtDur=v=>{if(v==null||v==="")return"";if(typeof v==="number"){const s=Math.round(v*86400);return s>=3600?`${Math.floor(s/3600)}:${String(Math.floor(s%3600/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`:`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`}return String(v)};
$("#xl").addEventListener("change",async e=>{
  const f=e.target.files[0];if(!f)return;const msg=$("#xlmsg");
  if(!window.XLSX){msg.textContent="Per leggere l'Excel serve internet la prima volta. Riprova quando sei collegata.";return}
  msg.textContent="Sto leggendo "+f.name+"…";
  try{
    const wb=XLSX.read(await f.arrayBuffer(),{type:"array"});
    const rows=n=>{const s=wb.Sheets[n];if(!s)throw new Error("Nel file manca il foglio «"+n+"».");return XLSX.utils.sheet_to_json(s,{header:1,defval:""}).slice(1)};
    const V=x=>String(x??"").trim();
    const d=rows("Dischi").filter(r=>r[0]).map(r=>[V(r[0]),V(r[1]),V(r[2]),V(r[3]),V(r[4]),V(r[5]),V(r[6]),V(r[7]),V(r[8]),V(r[9]),V(r[10]),V(r[11]),V(r[12]),V(r[13]),V(r[14]),fmtDur(r[15]),V(r[16]),V(r[19])]);
    const t={};rows("Brani").filter(r=>r[1]).forEach(r=>(t[V(r[1])]||(t[V(r[1])]=[])).push([V(r[2]),V(r[3]),V(r[4]),V(r[5]),fmtDur(r[6]),V(r[7]),V(r[8]),V(r[9]),V(r[10])]));
    const m=rows("Musicisti").filter(r=>r[0]).map(r=>[0,1,2,3,4,5,6,7].map(i=>V(r[i])));
    const today=new Date().toLocaleDateString("it-IT");
    DATA={d,t,m,date:today,ts:Date.now()};rerender();saveData(DATA);lastXL=DATA;
    msg.innerHTML=`Fatto: ${d.length} dischi caricati da ${esc(f.name)} su questo dispositivo.<br>Per aggiornare anche il telefono: <button type="button" id="dl">Scarica dischi.json</button> e caricalo su GitHub al posto di quello vecchio.`;
  }catch(err){msg.textContent="Non riesco a leggere il file: "+err.message+" Controlla che sia l'Excel del catalogo."}
});

let lastXL=null;
document.addEventListener("click",e=>{if(e.target.id==="dl"&&lastXL){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(lastXL)],{type:"application/json"}));a.download="dischi.json";document.body.appendChild(a);a.click();a.remove()}});
async function idbGet(k){try{const db=await idb();return await new Promise(r=>{const q=db.transaction("d").objectStore("d").get(k);q.onsuccess=()=>r(q.result);q.onerror=()=>r(null)})}catch(e){return null}}
async function idbPut(k,v){try{const db=await idb();db.transaction("d","readwrite").objectStore("d").put(v,k)}catch(e){}}
let cur="cerca";
function rerender(){build();Object.keys(done).forEach(k=>done[k]=0);tab(cur)}
const getJ=(u,o)=>fetch(u,o).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()});
function linksFrom(site,canz){
  const ss={},sp={},cs={},cp={},st={},sa={};const put=(m,k,v)=>{const l=loose(k);k=norm(k);if(k&&!m[k])m[k]=v;if(l&&!m[" "+l])m[" "+l]=v};
  const clean=x=>String(x||"").replace(/\(.*?\)/g,"");
  if(site){(site.songs||[]).forEach(x=>{st[x.id]=x.tgr+(x.alias?" ("+x.alias+")":"");sa[x.id]=[x.at,x.am].filter(Boolean).join(", ");put(ss,x.tgr,x.id);const _al=String(x.alias||"");put(ss,_al,x.id);_al.split(/\s*[\/;|,()]\s*/).forEach(a=>put(ss,a,x.id))});
    (site.persons||[]).forEach(p=>{put(sp,clean(p.name),p.id);put(sp,p.name,p.id);if(!sp[canonP(clean(p.name))])sp[canonP(clean(p.name))]=p.id;String(p.alias||p.aliases||"").split(/[,;]/).forEach(a=>put(sp,a,p.id))})}
  if(canz){(canz.canzoni||[]).forEach(x=>{if(x.id)put(cs,x.titolo,x.id)});
    (canz.persone||[]).forEach(p=>{put(cp,p.nome,p.id);String(p.alias||"").split(",").forEach(a=>put(cp,a,p.id))})}
  return {ss,sp,cs,cp,st,sa};
}
(async()=>{
  const t0=store.get("disco-tab");cur=views[t0]?t0:"cerca";
  const [saved,lk,ci]=await Promise.all([idbGet("data"),idbGet("links"),idbGet("covidx")]);
  if(lk)LK=lk;if(ci)CIDX=ci;
  if(saved&&saved.d&&saved.d.length){DATA=saved}
  build();tab(cur);
  if(!DISCS.length)$("#out-cerca").innerHTML='<p class="hint">Sto caricando il catalogo… la prima volta serve internet.</p>';
  getJ("copertine/idx.json").then(j=>{CIDX=j;idbPut("covidx",j);rerender()}).catch(()=>{});
  setTimeout(()=>{const c=navigator.connection;if(c&&(c.saveData||/cellular/.test(c.type||"")))return;const ids=[...new Set(Object.values(CIDX))];(async()=>{for(const i of ids){await loadChunk(i)}})()},15000);
  try{const j=await getJ("dischi.json",{cache:"no-cache"});if(j&&j.d&&(!DATA.ts||(j.ts||0)>DATA.ts)){DATA=j;idbPut("data",j);rerender()}}
  catch(e){if(!DISCS.length)$("#out-cerca").innerHTML='<p class="hint">Non riesco a caricare il catalogo: controlla la connessione e riapri.</p>'}
  const [site,canz]=await Promise.all([getJ(SITE+"dati.json",{cache:"no-cache"}).catch(()=>null),getJ(CANZ+"dati.json",{cache:"no-cache"}).catch(()=>null)]);
  if(site||canz){const n=linksFrom(site,canz);if(!site){n.ss=LK.ss;n.sp=LK.sp;n.st=LK.st;n.sa=LK.sa}if(!canz){n.cs=LK.cs;n.cp=LK.cp}
    if(JSON.stringify(n)!==JSON.stringify(LK)){LK=n;idbPut("links",n);rerender()}}
})();
})();
