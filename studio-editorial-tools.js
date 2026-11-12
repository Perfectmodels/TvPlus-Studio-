(function tvplusEditorialTools() {
"use strict";
const $ = id => document.getElementById(id);
const modes = ["pastille","alerte","decryptage","verbatim"];
const labels = {pastille:"Pastille",alerte:"Alerte info",decryptage:"Décryptage",verbatim:"Verbatim"};
const DB_NAME="tvplus-editorial-local-v1", STORE="posters", LAST="tvplus:last-edit-mode";
const stateKey="tvplus:caption-settings-v1";
let dbPromise=null, restoring=true, pending=null, queue=Promise.resolve();
const bank=new Map(), cache=new WeakMap();
const savedImageURLs=[];
let currentTab="caption";
function openDB(){
 if(!("indexedDB" in window)) return Promise.reject(new Error("Stockage local indisponible"));
 if(!dbPromise) dbPromise=new Promise((resolve,reject)=>{
  const r=indexedDB.open(DB_NAME,1);
  r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE,{keyPath:"mode"});};
  r.onsuccess=()=>resolve(r.result); r.onerror=()=>reject(r.error||new Error("IndexedDB"));
 });
 return dbPromise;
}
async function allDrafts(){
 const db=await openDB();
 return new Promise((resolve,reject)=>{const t=db.transaction(STORE,"readonly"),r=t.objectStore(STORE).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
}
async function putDraft(row){
 const db=await openDB();
 return new Promise((resolve,reject)=>{const t=db.transaction(STORE,"readwrite");t.objectStore(STORE).put(row);t.oncomplete=resolve;t.onerror=()=>reject(t.error);});
}
async function deleteDraft(mode){
 const db=await openDB();
 return new Promise((resolve,reject)=>{const t=db.transaction(STORE,"readwrite");t.objectStore(STORE).delete(mode);t.oncomplete=resolve;t.onerror=()=>reject(t.error);});
}
function status(text,kind=""){const x=$("studioSaveStatus");if(x){x.textContent=text;x.dataset.kind=kind;}}
function readSnapshot(){
 return {
  mode:state.mode,headline:state.headline,articleFullTitle:state.articleFullTitle||'',category:state.category,
  details:$("details")?.value||"",speaker:$("speaker")?.value||"",role:$("role")?.value||"",
  highlighted:[...state.highlightedIndices],sizes:[...state.wordSizes],
  fontScale:state.fontScale,lineHeight:state.lineHeight,letterSpacing:state.letterSpacing,fontFamily:state.fontFamily,fontWeight:state.fontWeight,
  darkness:state.darkness,website:state.website,zoom:state.zoom,dx:state.dx,dy:state.dy,
  sample:state.sample,photoRef:!state.sample?state.image:null,
  logoRef:state.logo&&state.logo.src!==DEFAULT_LOGO?state.logo:null,
  updatedAt:Date.now()
 };
}
async function blobFromImage(img){
 if(!img||!img.src) return null;
 if(cache.has(img))return cache.get(img);
 const job=(async()=>{
  if(img.src.startsWith("data:image/")){
   const b=await (await fetch(img.src)).blob();
   if(b.size<=18*1024*1024)return b;
  }
  // Keep a quality-preserving local copy when an imported image exceeds storage limits.
  const w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;
  if(!w||!h)return null;
  const scale=Math.min(1,2000/Math.max(w,h)),c=document.createElement("canvas");
  c.width=Math.max(1,Math.round(w*scale));c.height=Math.max(1,Math.round(h*scale));
  c.getContext("2d").drawImage(img,0,0,c.width,c.height);
  return await new Promise(resolve=>c.toBlob(resolve,"image/jpeg",.91));
 })().catch(()=>null);
 cache.set(img,job);return job;
}
function persistSnapshot(s){
 if(!s||restoring||!modes.includes(s.mode))return;
 const mode=s.mode;
 status("Enregistrement…");
 queue=queue.catch(()=>{}).then(async()=>{
  const photoBlob=await blobFromImage(s.photoRef),logoBlob=await blobFromImage(s.logoRef);
  const row={...s,photoBlob,logoBlob};
  delete row.photoRef;delete row.logoRef;
  await putDraft(row);bank.set(mode,row);
  try{localStorage.setItem(LAST,mode);}catch(_){}
  status("Brouillon enregistré sur cet appareil","ok");updateLibrary();
 }).catch(err=>{status("Sauvegarde indisponible : espace local insuffisant ou privé","warn");console.warn("Local draft storage:",err);});
}
function scheduleSave(delay=700){
 if(restoring)return;
 clearTimeout(pending);pending=setTimeout(()=>{pending=null;persistSnapshot(readSnapshot());},delay);
}
function flushSave(){
 if(restoring)return;
 clearTimeout(pending);pending=null;persistSnapshot(readSnapshot());
}
async function decodeBlob(blob){
 if(!blob)return null;
 const url=URL.createObjectURL(blob);savedImageURLs.push(url);
 try{return await loadImage(url);}catch(_){return null;}
}
async function applySaved(mode){
 const row=bank.get(mode);if(!row||state.mode!==mode)return false;
 restoring=true;
 try{
  const photo=await decodeBlob(row.photoBlob);
  const logo=await decodeBlob(row.logoBlob);
  if(state.mode!==mode)return false;
  state.headline=row.headline||"";
  state.articleFullTitle=row.articleFullTitle||"";
  state.category=row.category||"";
  state.highlightedIndices=new Set(row.highlighted||[]);
  state.wordSizes=new Map(row.sizes||[]);
  state.sizeSelection.clear();
  state.fontScale=Number(row.fontScale)||100;state.lineHeight=Math.max(.85,Math.min(1.65,Number(row.lineHeight)||1.16));state.letterSpacing=Math.max(-3,Math.min(10,Number(row.letterSpacing)||0));state.fontFamily=row.fontFamily||"Barlow";
  state.fontWeight=Number(row.fontWeight)||900;state.darkness=Number(row.darkness??70);
  state.website=row.website||"tvplusafrique.com";
  state.zoom=Number(row.zoom)||100;state.dx=Number(row.dx)||0;state.dy=Number(row.dy)||0;
  if(photo){state.image=photo;state.sample=false;}
  if(logo)state.logo=logo;
  const edits={headline:row.headline||"",articleFullTitle:row.articleFullTitle||"",category:row.category||"",details:row.details||"",
   speaker:row.speaker||"",role:row.role||"",fontScale:state.fontScale,pastilleLineHeight:state.lineHeight,pastilleLetterSpacing:state.letterSpacing,fontFamily:state.fontFamily,
   fontWeight:state.fontWeight,zoom:state.zoom,darkness:state.darkness,webText:state.website};
  for(const [id,value] of Object.entries(edits)){const el=$(id);if(el)el.value=value;}
  // Preserve the selected official TV+ rubric, including old saved spelling/values.
  if(typeof setCategoryValue==="function")setCategoryValue(row.category||"");
  const values={fontScaleLabel:state.fontScale+" %",pastilleLineHeightLabel:state.lineHeight.toFixed(2).replace('.',',')+"×",pastilleLetterSpacingLabel:(state.letterSpacing>0?'+':'')+String(state.letterSpacing).replace('.',',')+" px",zoomLabel:state.zoom+" %",darknessLabel:state.darkness+" %",photoName:photo?"Photo retrouvée dans le brouillon":"Photo du modèle"};
  for(const [id,value] of Object.entries(values))if($(id))$(id).textContent=value;
  renderTokens();draw();status("Brouillon retrouvé · "+labels[mode],"ok");return true;
 }finally{restoring=false;}
}
function qualityIssues(){
 const list=[];
 if(!state.headline.trim())list.push("Le titre ou la citation est vide.");
 if(state.mode==="pastille"&&(state.headline.trim().length>70||state.headline.trim().split(/\s+/).length>12))list.push("Le titre court de la pastille est trop long : réduisez-le à 70 caractères ou 12 mots recommandés.");
 if(!state.image)list.push("Aucune photo n'est chargée.");
 else if(state.sample)list.push("La photo affichée est un exemple : remplacez-la avant publication.");
 if($("fitStatus")?.classList.contains("warning"))list.push("Le texte a été fortement réduit pour tenir dans l'affiche.");
 const w=Number($("exportSize")?.value||1200),h=state.mode==="decryptage"?Math.round(w*9/16):w;
 if(state.image&&!state.sample&&Math.min(state.image.naturalWidth||w,state.image.naturalHeight||h)<Math.min(w,h)*.55)
  list.push("La photo source est petite pour la résolution d'export choisie.");
 if(state.mode==="decryptage"&&!($("details")?.value||"").trim())list.push("L'angle ou la question du décryptage est vide.");
 if(state.mode==="verbatim"&&!($("speaker")?.value||"").trim())list.push("Le nom de l'auteur manque au Verbatim.");
 return list;
}
const dlg=document.createElement("dialog");dlg.id="studioEditorialDialog";dlg.className="studio-editorial-dialog";
dlg.setAttribute("aria-labelledby","studioEditorialTitle");
dlg.innerHTML=`
 <div class="studio-editorial-head">
  <div><span class="studio-editorial-overline">TV+ STUDIO · OUTILS</span><h2 id="studioEditorialTitle">Rédaction & production</h2><p>Des outils complémentaires sans modifier votre espace de création.</p></div>
  <button id="studioCloseTools" type="button" aria-label="Fermer les outils">×</button>
 </div>
 <div class="studio-editorial-tabs" role="tablist" aria-label="Outils de production">
  <button type="button" data-tooltab="caption" class="active" aria-selected="true">Légende Facebook</button>
  <button type="button" data-tooltab="drafts" aria-selected="false">Brouillons</button>
  <button type="button" data-tooltab="quality" aria-selected="false">Qualité & formats</button>
 </div>
 <div class="studio-editorial-main">
 <section data-toolpanel="caption" class="studio-tool-panel">
  <p class="studio-note">Quatre modèles officiels TV+ · gras Unicode conservé au collage sur Facebook · rédaction sans IA.</p>
  <div class="studio-form-grid">
   <label>Type de publication
    <select id="studioCaptionType">
     <option value="lire">📺 À lire</option>
     <option value="alerte">🚨 Alerte info</option>
     <option value="reportage">📺 Reportage</option>
     <option value="60secondes">📺 En 60 secondes</option>
    </select>
   </label>
   <label>Lien court de l’article (À lire)
    <input id="studioCaptionLink" type="url" placeholder="https://l.tvplusafrique.com/..." inputmode="url" autocomplete="off">
   </label>
  </div>
  <details class="studio-shortener" id="studioShortenerPanel">
   <summary>Raccourcir un lien avec Rebrandly · l.tvplusafrique.com</summary>
   <p class="studio-note">Cette action crée automatiquement un lien court TV+ depuis l’adresse de votre article, après activation de Rebrandly dans Vercel.</p>
   <label>Adresse complète de l’article
    <input id="studioShortDestination" placeholder="https://www.tvplusafrique.com/..." type="url" inputmode="url" autocomplete="off">
   </label>
   <div class="studio-editorial-actions"><button type="button" class="studio-accent" id="studioShortenAction">Créer le lien court</button></div>
   <p id="studioShortenStatus" class="studio-note" role="status"></p>
  </details>
  <label>Présentation supplémentaire (facultatif)
   <textarea id="studioCaptionIntro" rows="2" placeholder="Un contexte factuel, uniquement si nécessaire."></textarea>
  </label>
  <div class="studio-hashtag-box">
   <div class="studio-hashtag-head">
    <div><strong>Hashtags de la publication</strong><small>Suggestions calculées depuis le titre, sans IA.</small></div>
    <button type="button" id="studioGenerateHashtags">↻ Générer les hashtags</button>
   </div>
   <p class="studio-note">Les hashtags jaunes seront inclus dans la légende. Cliquez dessus pour les retirer ou les réactiver.</p>
   <div id="studioHashtagSuggestions" class="studio-hashtag-suggestions" role="group" aria-label="Sélectionner les hashtags proposés"></div>
   <div id="studioHashtagCount" class="studio-hashtag-count" role="status" aria-live="polite"></div>
   <label>Ajouter des hashtags personnalisés
    <input id="studioCaptionHashtags" maxlength="350" placeholder="#Gabon #CESEC #JacquesSima" autocomplete="off">
    <small class="studio-hashtag-help">Séparez les hashtags par des espaces. #TVPlusAfrique et le hashtag du format sont toujours inclus.</small>
   </label>
  </div>
  <div class="studio-tool-subtitle">Aperçu de la légende · titre repris depuis l’affiche</div>
  <textarea id="studioCaptionPreview" rows="8" aria-label="Légende TV+ prête à copier avec gras Unicode" spellcheck="false"></textarea>
  <div class="studio-editorial-actions"><button id="studioCaptionRefresh" type="button">Régénérer depuis l’affiche</button><button id="studioCaptionCopy" class="studio-accent" type="button">Copier la légende</button></div>
  <p id="studioCaptionStatus" class="studio-note" role="status"></p>
 </section>
 <section data-toolpanel="drafts" class="studio-tool-panel" hidden>
  <p class="studio-note">Les créations sont enregistrées dans ce navigateur, sur cet appareil uniquement. Elles ne sont pas partagées entre les journalistes.</p>
  <div class="studio-editorial-actions"><button id="studioSaveNow" class="studio-accent" type="button">Enregistrer maintenant</button><span id="studioSaveStatus" role="status" class="studio-note">Initialisation…</span></div>
  <div id="studioDraftList" class="studio-draft-list"></div>
  <p class="studio-note">Photos importées : conservées localement lorsque le navigateur le permet. Pour une grosse photo, une copie peut être redimensionnée.</p>
 </section>
 <section data-toolpanel="quality" class="studio-tool-panel" hidden>
  <div class="studio-tool-subtitle">Contrôle avant publication</div>
  <button id="studioRunCheck" type="button" class="studio-accent">Vérifier l’affiche</button>
  <div id="studioCheckResults" class="studio-check-results" role="status">Cliquez pour contrôler le titre, l'image et les dimensions.</div>
  <div class="studio-tool-subtitle">Exporter une image optimisée</div>
  <p class="studio-note">La version PNG reste accessible normalement depuis le bouton de téléchargement de l'éditeur.</p>
  <div class="studio-form-grid">
   <label>Format <select id="studioFormat"><option value="image/webp">WebP · léger</option><option value="image/jpeg">JPEG · compatible</option></select></label>
   <label>Qualité <select id="studioQuality"><option value=".75">75 %</option><option value=".85" selected>85 % · recommandé</option><option value=".92">92 %</option></select></label>
  </div>
  <div class="studio-editorial-actions"><button id="studioOptimizedExport" class="studio-accent" type="button">Télécharger le fichier optimisé</button></div>
  <p class="studio-note" id="studioOptimizedStatus" role="status"></p>
 </section>
 </div>
 <div class="studio-editorial-foot"><span>Aucune API · Pas de publication automatique</span><button type="button" id="studioCloseFooter">Fermer</button></div>
`;
document.body.append(dlg);
const style=document.createElement("style");
style.id="studio-editorial-style";
style.textContent=`
#studioEditorialOpen{min-height:35px;border:1px solid #536781;background:#132744;color:#fff;border-radius:9px;padding:6px 13px;font:700 13px Barlow,Arial,sans-serif;cursor:pointer;white-space:nowrap}
#studioEditorialOpen:hover{border-color:#ffbf1c}
.studio-editorial-dialog{position:fixed;inset:0;margin:auto;border:1px solid #384a65;border-radius:16px;padding:0;width:min(850px,95vw);max-height:min(810px,94dvh);background:#101a2b;color:#f1f5ff;box-shadow:0 25px 100px #000b;font:14px Barlow,Arial,sans-serif;overflow:hidden}
.studio-editorial-dialog::backdrop{background:#000b;backdrop-filter:blur(3px)}
.studio-editorial-dialog:not([open]){display:none!important}
.studio-editorial-dialog[open]{display:flex;flex-direction:column}
.studio-editorial-head{display:flex;align-items:start;justify-content:space-between;gap:14px;padding:18px 21px 13px;border-bottom:1px solid #2a3c55}
.studio-editorial-overline{font-size:10px;color:#ffc126;letter-spacing:1.5px;font-weight:900}
.studio-editorial-head h2{font-size:21px;margin:4px 0;font-weight:800;color:white}
.studio-editorial-head p,.studio-note{font-size:12px;color:#aebed1;line-height:1.45;margin:5px 0 10px}
#studioCloseTools{background:transparent;border:1px solid #41516a;color:white;font-size:25px;border-radius:9px;min-width:38px;min-height:36px;cursor:pointer}
.studio-editorial-tabs{display:flex;gap:6px;padding:10px 17px;border-bottom:1px solid #2a3c55;overflow-x:auto;flex-shrink:0}
.studio-editorial-tabs button{border:1px solid #3e516a;border-radius:8px;background:#192842;color:#d0d9e7;padding:9px 13px;font-weight:750;white-space:nowrap;cursor:pointer}
.studio-editorial-tabs button.active{background:#ffc21b;border-color:#ffc21b;color:#101725}
.studio-editorial-main{padding:17px 21px;overflow:auto;min-height:100px;flex:1;scrollbar-width:thin}
.studio-tool-panel[hidden]{display:none!important}
.studio-tool-panel label{display:block;font-size:12px;font-weight:750;color:#d3e0f1;margin-bottom:12px}
.studio-tool-panel input,.studio-tool-panel select,.studio-tool-panel textarea{width:100%;border:1px solid #354a66;border-radius:8px;background:#0a1425;color:white;padding:10px;margin-top:5px;min-height:39px;font:inherit}
.studio-tool-panel textarea{resize:vertical;line-height:1.5}
.studio-shortener{border:1px solid #40516c;border-radius:10px;padding:10px 13px;margin:0 0 14px;background:#13243a}
.studio-shortener summary{cursor:pointer;color:#ffcb4b;font-weight:800;font-size:12px;line-height:1.35}
.studio-shortener[open] summary{margin-bottom:11px}
.studio-shortener label{margin-bottom:9px}
.studio-shortener .studio-editorial-actions{margin:7px 0}
#studioShortenStatus{min-height:16px}

.studio-hashtag-box{border:1px solid #394e69;border-radius:12px;padding:13px;margin:13px 0;background:#132239}
.studio-hashtag-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.studio-hashtag-head strong{font-size:13px;font-weight:850;color:#f3f7ff;display:block}
.studio-hashtag-head small{display:block;font-size:11px;color:#9eb3c8;margin-top:4px}
.studio-hashtag-head button{font-size:12px;font-weight:800;color:#ffe5a1;border:1px solid #856727;background:#30271c;padding:8px 10px;border-radius:8px;cursor:pointer}
.studio-hashtag-suggestions{display:flex;flex-wrap:wrap;gap:7px;margin:11px 0;min-height:32px;align-items:center}
.studio-hashtag-suggestions button{border:1px solid #526680;background:#182a43;color:#aabbd1;border-radius:100px;padding:8px 11px;min-height:34px;font:800 12px Barlow,Arial,sans-serif;cursor:pointer;overflow-wrap:anywhere;max-width:100%}
.studio-hashtag-suggestions button[aria-pressed="true"]{background:#ffbd0d;border-color:#ffbd0d;color:#121b2a}
.studio-hashtag-suggestions button:focus-visible{outline:2px solid #e3c44c;outline-offset:2px}
.studio-hashtag-count{font-size:11px;color:#a9bfd5;margin-bottom:10px}
.studio-hashtag-help{display:block;font-size:10px;color:#92a9c2;margin-top:6px;font-weight:450}
.studio-hashtag-box label{margin-bottom:0}


#studioCaptionPreview{min-height:145px}
.studio-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.studio-tool-subtitle{font-size:13px;font-weight:850;color:white;margin:12px 0 7px}
.studio-editorial-actions{display:flex;align-items:center;justify-content:flex-start;flex-wrap:wrap;gap:10px;margin:11px 0}
.studio-editorial-actions button,#studioRunCheck{min-height:39px;padding:9px 14px;border:1px solid #42556b;background:#20304b;color:white;border-radius:9px;font-weight:800;cursor:pointer}
.studio-editorial-actions button.studio-accent,#studioRunCheck.studio-accent{background:#ffc21b;border-color:#ffc21b;color:#101725}
.studio-editorial-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px 21px;border-top:1px solid #2a3c55;color:#869bb5;font-size:11px}
.studio-editorial-foot button{background:transparent;border:1px solid #42556b;color:white;border-radius:7px;padding:6px 13px;cursor:pointer}
.studio-draft-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:15px}
.studio-draft{border:1px solid #30455e;border-radius:10px;background:#16253a;padding:13px;min-width:0}
.studio-draft strong{display:block;font-size:15px;margin-bottom:3px}
.studio-draft p{font-size:12px;color:#becadd;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin:5px 0}
.studio-draft small{color:#94acc6}
.studio-draft-actions{display:flex;gap:8px;margin-top:12px}
.studio-draft-actions button{border-radius:7px;background:#283b55;color:white;border:1px solid #526681;padding:7px 10px;cursor:pointer}
.studio-check-results{border:1px solid #364b65;background:#172741;border-radius:9px;padding:13px;margin:12px 0;line-height:1.7;color:#dce7f6}
.studio-check-results ul{margin:0;padding-left:20px}
#studioSaveStatus[data-kind=warn]{color:#ffca84}
@media(max-width:620px){
 #studioEditorialOpen{padding:6px 9px;font-size:12px;min-height:33px}
 .studio-editorial-dialog{width:100vw;max-width:none;height:100dvh;max-height:100dvh;border-radius:0}
 .studio-editorial-head{padding:12px 15px 9px}.studio-editorial-head h2{font-size:18px}
 .studio-editorial-head p{display:none}
 .studio-editorial-tabs{padding:8px 10px}
 .studio-editorial-tabs button{padding:8px 10px;font-size:12px}
 .studio-editorial-main{padding:12px 14px}
 .studio-form-grid{grid-template-columns:1fr;gap:0}
 .studio-editorial-foot{padding:9px 14px}
 .studio-draft-list{grid-template-columns:1fr}
}
`;
document.head.append(style);
const openBtn=document.createElement("button");openBtn.id="studioEditorialOpen";openBtn.type="button";
openBtn.innerHTML='<span class="studio-editorial-long">Rédaction & brouillons</span><span class="studio-editorial-short" hidden>Outils</span>';
document.querySelector(".header-right")?.append(openBtn);
const responsive=document.createElement("style");responsive.textContent="@media(max-width:700px){#studioEditorialOpen .studio-editorial-long{display:none}#studioEditorialOpen .studio-editorial-short{display:inline!important}}";document.head.append(responsive);
function tab(key){
 currentTab=key;
 dlg.querySelectorAll("[data-tooltab]").forEach(b=>{const active=b.dataset.tooltab===key;b.classList.toggle("active",active);b.setAttribute("aria-selected",String(active));});
 dlg.querySelectorAll("[data-toolpanel]").forEach(p=>p.hidden=p.dataset.toolpanel!==key);
 if(key==="drafts")updateLibrary();
 if(key==="caption")prepareCaptionOnOpen();
 if(key==="quality")check();
}
function show(key="caption"){tab(key);dlg.showModal();}
openBtn.addEventListener("click",()=>show("caption"));
$("studioCloseTools").addEventListener("click",()=>dlg.close());
$("studioCloseFooter").addEventListener("click",()=>dlg.close());
dlg.querySelectorAll("[data-tooltab]").forEach(b=>b.addEventListener("click",()=>tab(b.dataset.tooltab)));
const fields=["studioCaptionType","studioCaptionLink","studioCaptionIntro","studioCaptionHashtags"];
function saveCaptionSettings(){
 const v={};for(const id of fields)v[id]=$(id).value;
 try{localStorage.setItem(stateKey,JSON.stringify(v));}catch(_){}
}
function loadCaptionSettings(){
 try{const v=JSON.parse(localStorage.getItem(stateKey)||"{}");for(const id of fields)if(typeof v[id]==="string")$(id).value=v[id];}catch(_){}
}
function boldSerif(text){
 // Mathematical bold serif Unicode renders as bold text after pasting into Facebook.
 // Preserve accented French characters when no precomposed mathematical glyph exists.
 return [...String(text||"")].map(ch=>{
  const n=ch.codePointAt(0);
  if(n>=65&&n<=90)return String.fromCodePoint(0x1D400+n-65);
  if(n>=97&&n<=122)return String.fromCodePoint(0x1D41A+n-97);
  if(n>=48&&n<=57)return String.fromCodePoint(0x1D7CE+n-48);
  return ch;
 }).join("");
}
const titles={
 lire:"📺 𝗧𝗩+ | À 𝗹𝗶𝗿𝗲",
 alerte:"🚨 𝗧𝗩+ | 𝗔𝗟𝗘𝗥𝗧𝗘 𝗜𝗡𝗙𝗢",
 reportage:"📺 𝗧𝗩+ | 𝗥𝗘𝗣𝗢𝗥𝗧𝗔𝗚𝗘",
 "60secondes":"📺 𝗧𝗩+ | 𝗘𝗡 𝟲𝟬 𝗦𝗘𝗖𝗢𝗡𝗗𝗘𝗦"
};
const whatsapp="📲 𝗦𝘂𝗶𝘃𝗲𝘇-𝗻𝗼𝘂𝘀 𝘀𝘂𝗿 𝗪𝗵𝗮𝘁𝘀𝗔𝗽𝗽 https://l.tvplusafrique.com/xw7b";
function uniqueTags(type,extra,automatic=[]){
 const defaults=["#TVPlusAfrique"];
 if(type==="alerte")defaults.push("#AlerteInfo");
 if(type==="reportage")defaults.push("#Reportage");
 if(type==="60secondes")defaults.push("#60Secondes");
 const manual=String(extra||"").split(/[\s,;]+/).filter(Boolean).map(tag=>tag.startsWith("#")?tag:"#"+tag);
 const all=[...defaults,...automatic,...manual];
 const found=new Set();
 return all.filter(tag=>{
  if(!/^#[A-Za-z0-9][A-Za-z0-9_]{1,39}$/.test(tag)||!/[A-Za-z]/.test(tag))return false;
  const key=tag.toLowerCase();
  if(found.has(key))return false;
  found.add(key);return true;
 });
}
const tagStopwords=new Set(("le la les un une des de du d au aux à a en et ou pour par sur dans avec sans plus " +
 "est sont ont été sera sera sont celui cette ces ce cet son sa ses leur leurs il elle ils elles nous " +
 "vous notre votre qui que quoi qu où dont après avant entre vers ce jour ce mois selon " +
 "reprise reprend début annonce annoncee mise nouvelle nouveau nouveaux nouvelle grande grand " +
 "petit petite millions milliards francs cfa hier aujourd hui novembre décembre janvier février mars avril mai " +
 "juin juillet août septembre octobre pendant prochain prochaine samedi dimanche lundi mardi mercredi jeudi vendredi " +
 "2026 2027 face premier premiere son dernier derniere national info actualité article reportage " +
 "encore bientôt toujours tout tous toutes trois deux des accorde plaide dénonce annonce confirme indique "
+"estime explique assure présente révèle reporte humilié humilie affirme affirmee").split(/\s+/));
function normalizeWord(word){
 return String(word||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^A-Za-z0-9]/g,"");
}
function titleCaseWord(word){
 const w=normalizeWord(word);
 if(!w)return "";
 // Acronyms like CESEC or INFASS retain their official uppercase form.
 if(w.length>=2&&w.length<=12&&w===w.toUpperCase()&&/[A-Z]/.test(w))return w;
 return w.charAt(0).toUpperCase()+w.slice(1).toLowerCase();
}
function titleKeywords(title,category){
 const source=String(title||"").trim();
 if(!source||source==="[Titre de l’actualité à compléter]")return [];
 const suggestions=new Map();
 function add(value,score){
  const parts=Array.isArray(value)?value:[value];
  const tokens=parts.map(titleCaseWord).filter(Boolean);
  if(!tokens.length)return;
  const tag="#"+tokens.join("");
  if(tag.length<3||tag.length>41||!/#[A-Za-z][A-Za-z0-9]+/.test(tag))return;
  const id=tag.toLowerCase();
  if(!suggestions.has(id)||suggestions.get(id).score<score)suggestions.set(id,{tag,score,order:suggestions.size});
 }
 const tokens=[...source.matchAll(/[\p{L}][\p{L}\p{N}'’]*|\d+/gu)].map(m=>m[0].replace(/['’](s|d|l|n|qu|j|m|t)$/i,""));
 const normalized=tokens.map(normalizeWord);
 const lower=normalized.map(x=>x.toLowerCase());
 const has=(word)=>lower.includes(word);
 const phrases=[
  [/\bnational\s+foot\s*([12])\b/gi,m=>["National","Foot",m[1]],115],
  [/\bfootball\s+gabonais\b/gi,()=>["Football","Gabonais"],111],
  [/\bDakar\s*(20\d{2})\b/gi,m=>["Dakar",m[1]],110],
  [/\brentrée\s+scolaire\b/gi,()=>["Rentree","Scolaire"],101],
  [/\bconseil\s+des\s+ministres\b/gi,()=>["Conseil","Ministres"],101],
  [/\bfonction\s+publique\b/gi,()=>["Fonction","Publique"],98],
  [/\bsanté\s+publique\b/gi,()=>["Sante","Publique"],96],
  [/\bélections?\s+(présidentielle|législatives?|locales?)\b/gi,m=>["Elections",m[1]],96],
  [/\bcoupe\s+d['’]afrique\b/gi,()=>["Coupe","Afrique"],98],
  [/\bemploi\s+des\s+jeunes\b/gi,()=>["Emploi","Jeunes"],95],
  [/\bsécurité\s+routière\b/gi,()=>["Securite","Routiere"],95]
 ];
 for(const [regex,create,score] of phrases){
  for(const m of source.matchAll(regex))add(create(m),score);
 }
 for(let i=0;i<tokens.length;i++){
  const w=normalized[i],lo=lower[i];
  if(w.length>=2&&w.length<=14&&/^[A-Z]{2,}$/.test(w)&&tokens[i]===tokens[i].toUpperCase()&&!tagStopwords.has(lo)){
   add(w,103);
  }
  // Consecutive capitalized tokens often denote a person, city or organization.
  if(w.length<2||tagStopwords.has(lo)||!/^[A-ZÀ-ÖØ-Þ]/u.test(tokens[i]))continue;
  const name=[tokens[i]];
  for(let j=i+1;j<Math.min(tokens.length,i+5);j++){
   const next=normalized[j],simple=lower[j];
   if(next.length<2||tagStopwords.has(simple)||!/^[A-ZÀ-ÖØ-Þ]/u.test(tokens[j]))break;
   name.push(tokens[j]);
  }
  if(name.length>=2){add(name,100+name.length);i+=name.length-1;}
 }
 if(has("gabon")||has("gabonais")||has("gabonaise")||has("gabonaises")||has("gabonais")||has("cesec")||has("linafp")||has("infass"))add("Gabon",96);
 const cities=["libreville","portgentil","oyem","dakar","pekin","paris","france","chine","togo","cameroun","senegal","canada","mayumba","mouila","bitam"];
 for(const city of cities)if(has(city)&&!(city==="dakar"&&/\bDakar\s*(20\d{2})\b/i.test(source)))add(city,85);
 const themes=["football","sport","sante","education","emploi","culture","budget","tourisme","environnement","justice","economie","politique","transport","immigration","scolarite","handball","basketball","commerce","agriculture","financement","enseignement","universite","formation","recherche","infrastructures"];
 for(const theme of themes)if(has(theme))add(theme,69);
 const catWords=String(category||"").split(/[\s\-]+/).map(normalizeWord).filter(w=>w.length>=3&&!tagStopwords.has(w.toLowerCase()));
 if(catWords.length&&catWords.length<=3)add(catWords,44);
 // Never invent names or topics not present in the headline. Unknown terms are offered as optional candidates.
 if(suggestions.size<3){
  for(let i=0;i<tokens.length;i++){
   const w=normalized[i],lo=lower[i];
   if(w.length>=6&&!tagStopwords.has(lo)&&!/^\d+$/.test(w))add(w,30);
   if(suggestions.size>=6)break;
  }
 }
 return [...suggestions.values()].sort((a,b)=>b.score-a.score||a.order-b.order).slice(0,8).map(x=>({tag:x.tag,score:x.score}));
}
let suggestedHashtags=[],chosenHashtags=new Set(),hashtagSignature="";
function syncHashtagSuggestions(force=false){
 const relevantTitle=state.mode==="pastille"&&$("studioCaptionType").value==="lire"&&state.articleFullTitle?.trim()?state.articleFullTitle:state.headline;
 const signature=String(relevantTitle||"")+"|"+String(state.category||"");
 if(!force&&hashtagSignature===signature)return;
 hashtagSignature=signature;
 suggestedHashtags=titleKeywords(relevantTitle,state.category);
 chosenHashtags=new Set(suggestedHashtags.filter(x=>x.score>=60).slice(0,4).map(x=>x.tag));
 if(!chosenHashtags.size&&suggestedHashtags.length)chosenHashtags.add(suggestedHashtags[0].tag);
 renderHashtagSuggestions();
}
function renderHashtagSuggestions(){
 const box=$("studioHashtagSuggestions");
 box.replaceChildren();
 if(!suggestedHashtags.length){
  const blank=document.createElement("span");blank.className="studio-note";
  blank.textContent="Saisissez un titre pour générer des hashtags adaptés.";
  box.append(blank);
 }
 for(const {tag} of suggestedHashtags){
  const button=document.createElement("button");button.type="button";
  const enabled=chosenHashtags.has(tag);
  button.textContent=tag;
  button.setAttribute("aria-pressed",String(enabled));
  button.setAttribute("aria-label",(enabled?"Retirer ":"Ajouter ")+tag);
  button.addEventListener("click",()=>{
   if(chosenHashtags.has(tag))chosenHashtags.delete(tag);
   else chosenHashtags.add(tag);
   renderHashtagSuggestions();generateCaption();
  });
  box.append(button);
 }
 const active=chosenHashtags.size;
 $("studioHashtagCount").textContent=active+" hashtag"+(active>1?"s":"")+" proposé"+(active>1?"s":"")+" sélectionné"+(active>1?"s":"")+". Modifiez les choix avant de publier.";
}
let lastCaptionMode=null;
function suggestedType(){
 if(state.mode==="alerte")return "alerte";
 return "lire";
}
function generateCaption(){
 const type=$("studioCaptionType").value||"lire";
 const full=type==="lire"&&state.mode==="pastille"&&state.articleFullTitle?.trim()?state.articleFullTitle:state.headline;
 const title=(full||"").trim()||"[Titre de l’actualité à compléter]";
 const link=$("studioCaptionLink").value.trim();
 const intro=$("studioCaptionIntro").value.trim();
 const lines=[titles[type]||titles.lire];
 if(type==="alerte")lines.push("");
 lines.push("🔴 "+boldSerif(title));
 if(intro)lines.push("",intro);
 if(type==="lire"){
  lines.push("📰 𝗟’𝗮𝗿𝘁𝗶𝗰𝗹𝗲 𝗰𝗼𝗺𝗽𝗹𝗲𝘁 👉 "+(link||"[Lien de l’article à ajouter]"));
 }
 syncHashtagSuggestions();
 lines.push(whatsapp,"",uniqueTags(type,$("studioCaptionHashtags").value,[...chosenHashtags]).join(" "));
 $("studioCaptionPreview").value=lines.join("\n");
}
function prepareCaptionOnOpen(){
 // Update the default when the poster format changes, but keep a deliberately
 // selected Reportage / 60 secondes type when staying on the same poster.
 if(lastCaptionMode!==state.mode){
  $("studioCaptionType").value=suggestedType();
  lastCaptionMode=state.mode;
 }
 generateCaption();
}
loadCaptionSettings();
fields.forEach(id=>$(id).addEventListener("input",()=>{saveCaptionSettings();generateCaption();}));
$("studioCaptionRefresh").addEventListener("click",generateCaption);
$("studioGenerateHashtags").addEventListener("click",()=>{syncHashtagSuggestions(true);generateCaption();});
$("studioCaptionCopy").addEventListener("click",async()=>{
 const text=$("studioCaptionPreview").value;
 if($("studioCaptionType").value==="lire"&&!$("studioCaptionLink").value.trim()){
  $("studioCaptionStatus").textContent="Ajoutez le lien de l’article avant de publier la légende.";
  $("studioCaptionLink").focus();return;
 }
 try{
  if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(text);
  else{$("studioCaptionPreview").select();if(!document.execCommand("copy"))throw Error("Copie non disponible");}
  $("studioCaptionStatus").textContent="Légende copiée avec le gras Unicode. Vérifiez l’exactitude du titre et des hashtags.";
 }catch(_){$("studioCaptionStatus").textContent="Copie impossible : sélectionnez le texte ci-dessus.";$("studioCaptionPreview").focus();$("studioCaptionPreview").select();}
});
let shortenerConfigured=null;
async function checkShortener(){
 const label=$("studioShortenStatus");
 try{
  const res=await fetch("/api/shorten",{method:"GET",cache:"no-store"});
  if(!res.ok)throw Error("Endpoint indisponible");
  const result=await res.json();
  shortenerConfigured=Boolean(result.configured);
  label.textContent=shortenerConfigured?"Rebrandly est disponible : collez le lien de l’article et créez son URL courte.":"Raccourcisseur prêt : renseignez REBRANDLY_API_KEY dans Vercel pour l’activer.";
 }catch(_){
  shortenerConfigured=false;
  label.textContent="Connexion Rebrandly non activée. Le générateur de légendes reste utilisable sans connexion.";
 }
}
$("studioShortenerPanel").addEventListener("toggle",()=>{
 if($("studioShortenerPanel").open)checkShortener();
});
$("studioShortenAction").addEventListener("click",async()=>{
 const status=$("studioShortenStatus"),action=$("studioShortenAction");
 const destination=$("studioShortDestination").value.trim();
 if(!/^https:\/\/(?:[a-z0-9-]+\.)*tvplusafrique\.com(?:[/:?#]|$)/i.test(destination)){
  status.textContent="Insérez une URL HTTPS de tvplusafrique.com.";return;
 }
 action.disabled=true;status.textContent="Création du lien court…";
 try{
  const response=await fetch("/api/shorten",{
   method:"POST",headers:{"Content-Type":"application/json"},
   body:JSON.stringify({destination,title:state.headline||"TV+ Afrique"})
  });
  const result=await response.json();
  if(!response.ok)throw Error(result.error||"Création du lien impossible");
  if(!result.shortUrl||!result.shortUrl.startsWith("https://l.tvplusafrique.com/"))throw Error("Le lien retourné n’utilise pas le domaine TV+.");
  $("studioCaptionLink").value=result.shortUrl;
  saveCaptionSettings();generateCaption();
  status.textContent="Lien court créé et ajouté à la légende : "+result.shortUrl;
  $("studioCaptionStatus").textContent="Le lien de l’article a été ajouté à votre légende.";
 }catch(err){status.textContent=err?.message||"La création du lien a échoué.";}
 finally{action.disabled=false;}
});
function updateLibrary(){
 const list=$("studioDraftList");if(!list)return;list.replaceChildren();
 for(const mode of modes){
  const item=bank.get(mode),card=document.createElement("article");card.className="studio-draft";
  const strong=document.createElement("strong");strong.textContent=labels[mode];card.append(strong);
  const p=document.createElement("p");p.textContent=item?.headline||"Aucun brouillon enregistré";card.append(p);
  if(item){const d=document.createElement("small");d.textContent="Sauvegardé "+new Date(item.updatedAt).toLocaleString("fr-FR");card.append(d);}
  const buttons=document.createElement("div");buttons.className="studio-draft-actions";
  if(item){
   const load=document.createElement("button");load.type="button";load.textContent="Reprendre";
   load.addEventListener("click",async()=>{flushSave();restoring=true;try{if(state.mode!==mode)$(mode+"Btn").click();await applySaved(mode);dlg.close();}finally{restoring=false;}});
   const del=document.createElement("button");del.type="button";del.textContent="Supprimer";del.setAttribute("aria-label","Supprimer le brouillon "+labels[mode]);
   del.addEventListener("click",async()=>{if(!confirm("Supprimer le brouillon local « "+labels[mode]+" » ?"))return;try{await deleteDraft(mode);bank.delete(mode);updateLibrary();status("Brouillon supprimé","ok");}catch(_){status("Suppression impossible","warn");}});
   buttons.append(load,del);
  }
  card.append(buttons);list.append(card);
 }
}
$("studioSaveNow").addEventListener("click",()=>{if(restoring)return;flushSave();});
$("studioRunCheck").addEventListener("click",check);
function check(){
 const issues=qualityIssues(),root=$("studioCheckResults");root.replaceChildren();
 if(!issues.length){root.textContent="✓ Aucun problème évident détecté. Relisez néanmoins les informations avant publication.";return;}
 const p=document.createElement("strong");p.textContent=issues.length+" point(s) à vérifier avant la publication :";root.append(p);
 const ul=document.createElement("ul");for(const t of issues){const li=document.createElement("li");li.textContent=t;ul.append(li);}root.append(ul);
}
$("studioOptimizedExport").addEventListener("click",async()=>{
 const target=$("studioOptimizedStatus");target.textContent="Préparation du fichier…";
 try{
  await document.fonts.ready;draw();
  const w=Number($("exportSize")?.value||1200),h=state.mode==="decryptage"?Math.round(w*9/16):w;
  const c=document.createElement("canvas");c.width=w;c.height=h;
  const g=c.getContext("2d");if(!g)throw Error("Canvas non pris en charge");
  g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";g.drawImage($("poster"),0,0,w,h);
  const mime=$("studioFormat").value,quality=Number($("studioQuality").value);
  const blob=await new Promise((resolve,reject)=>c.toBlob(x=>x?resolve(x):reject(Error("Export impossible")),mime,quality));
  const ext=blob.type==="image/png"?"png":blob.type==="image/jpeg"?"jpg":"webp";
  const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;
  a.download="tvplus-"+state.mode+"-"+new Date().toISOString().slice(0,10)+"-optimise."+ext;
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),20000);
  target.textContent=`Téléchargement prêt : ${w} × ${h} · ${(blob.size/1024).toFixed(0)} Ko · ${ext.toUpperCase()}`;
 }catch(err){target.textContent="Export impossible : "+(err?.message||String(err));}
});
const switcher=document.querySelector(".mode-switch");
switcher?.addEventListener("click",event=>{
 const btn=event.target.closest(".mode-btn");if(!btn||restoring)return;
 const mode=btn.id.replace(/Btn$/,"");
 if(mode===state.mode||!modes.includes(mode))return;
 flushSave();
 setTimeout(()=>{if(state.mode===mode){if(bank.has(mode))applySaved(mode);scheduleSave(1200);}},60);
},true);
document.addEventListener("input",event=>{
 if(dlg.contains(event.target))return;
 if(event.target.matches("input,textarea,select")&&event.target.closest(".panel"))scheduleSave(650);
},true);
document.addEventListener("click",event=>{
 if(dlg.contains(event.target))return;
 if(event.target.closest(".word-chip,.word-tool,#resetMarkBtn,#resetAll,#clearWordSizes,#pastilleResetSpacing,#resetPhoto,#resetLogo"))scheduleSave(1200);
},true);
$("canvasShell")?.addEventListener("pointerup",()=>scheduleSave(450));
window.addEventListener("pagehide",()=>{if(!restoring&&pending){clearTimeout(pending);persistSnapshot(readSnapshot());}});
(async()=>{
 try{
  await (document.readyState==="complete"?Promise.resolve():new Promise(resolve=>window.addEventListener("load",resolve,{once:true})));
  const rows=await allDrafts();for(const r of rows)bank.set(r.mode,r);
  const previous=(()=>{try{return localStorage.getItem(LAST);}catch(_){return null;}})();
  if(previous&&bank.has(previous)){
   if(state.mode!==previous)$(previous+"Btn").click();
   await applySaved(previous);
  }
  status("Brouillons locaux prêts","ok");updateLibrary();
 }catch(err){status("Sauvegarde locale indisponible","warn");console.warn("TV+ draft initialization:",err);}
 finally{restoring=false;}
})();
})();
