/* TV+ Studio — contextual OpenAI assistant and opt-in photo editing. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const format=()=>String($('studioCaptionType')?.value||state.mode||'lire');
const TASKS=[
 ['titre_affiche','Titres pour l’affiche'],['reformulation','Reformuler un titre'],['correction','Correction orthographique'],
 ['titre_court','Titres courts pour Facebook'],['legende','Légende Facebook'],['hashtags','Hashtags'],
 ['resume','Résumé'],['angles','Angles journalistiques'],['decryptage','Titre et angle du décryptage'],
 ['citation','Ponctuation d’une citation'],['article','Amélioration du texte'],['seo','SEO'],
 ['controle_qualite','Contrôle qualité'],['vigilance','Points à vérifier'],['traduction','Traduction'],
 ['photo_description','Description et texte alternatif photo']
];
const dialog=document.createElement('aside');dialog.className='ai-universal';dialog.id='tvplusAssistantPanel';dialog.hidden=true;
dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','false');dialog.setAttribute('aria-label','Assistant OpenAI');
dialog.innerHTML=`<div class="ai-universal-header"><div><strong>Assistant IA TV+ Studio</strong><small>Rédaction, affiches, légendes, photos</small></div><button id="aiUniversalClose" type="button" aria-label="Fermer">×</button></div>
<div class="ai-universal-inner">
<label>Module à traiter<select id="aiUniversalScope">
<option value="poster">Titre de l’affiche</option><option value="facebook">Titre Facebook</option>
<option value="article">Contenu de l’article</option><option value="caption">Légende complète</option>
<option value="angle">Angle du décryptage</option><option value="citation">Texte de la citation</option>
<option value="photo">Photographie</option></select></label>
<label>Assistance souhaitée<select id="aiUniversalTask"></select></label>
<label>Consigne ou contexte (facultatif)<textarea id="aiUniversalContext" rows="3" maxlength="2000" placeholder="Informations vérifiées ou précision sur le résultat attendu"></textarea></label>
<button class="ai-action-main" id="aiUniversalRun" type="button">Proposer avec OpenAI</button>
<div id="aiUniversalStatus" role="status"></div><div id="aiUniversalChoices"></div>
<label>Proposition modifiable<textarea id="aiUniversalResult" rows="5"></textarea></label>
<div class="ai-universal-row"><button id="aiUniversalApply" type="button">Appliquer à ce module</button><button id="aiUniversalCopy" type="button">Copier</button></div>
<p>Les résultats doivent être vérifiés avant publication. Aucun texte ou visuel n’est envoyé à OpenAI sans lancement volontaire d’une action.</p>
</div>`;
document.body.append(dialog);
const task=$('aiUniversalTask'),scope=$('aiUniversalScope'),stat=$('aiUniversalStatus'),result=$('aiUniversalResult'),choices=$('aiUniversalChoices');
for(const [value,label] of TASKS){const opt=document.createElement('option');opt.value=value;opt.textContent=label;task.append(opt);}
const fab=document.createElement('button');fab.id='tvplusAssistantOpen';fab.className='ai-open-button';fab.type='button';fab.textContent='Assistant IA';fab.setAttribute('aria-expanded','false');document.body.append(fab);
const css=document.createElement('style');css.textContent=`
.ai-open-button{position:fixed;right:16px;bottom:23px;z-index:39;background:#ffca36;border:1px solid #c89518;color:#122339;padding:12px 17px;border-radius:28px;font:850 12px Barlow,Arial,sans-serif;cursor:pointer;box-shadow:0 5px 20px #0006}
.ai-universal[hidden]{display:none!important}.ai-universal{position:fixed;z-index:55;right:15px;top:20px;bottom:20px;width:min(420px,calc(100vw - 30px));display:flex;flex-direction:column;background:#0f1e32;color:#f1f6fd;border:1px solid #506984;border-radius:15px;box-shadow:0 15px 60px #000b;overflow:hidden}
.ai-universal-header{display:flex;align-items:center;justify-content:space-between;padding:15px 17px;border-bottom:1px solid #415a75}
.ai-universal-header strong{font:800 14px Barlow,Arial,sans-serif}.ai-universal-header small{display:block;color:#adc3df;font-size:10px;margin-top:3px}
.ai-universal-header button{background:#243c59;color:white;border:1px solid #4e6987;border-radius:8px;padding:4px 11px;font-size:23px;cursor:pointer}
.ai-universal-inner{overflow:auto;padding:15px;display:grid;gap:11px}.ai-universal-inner label{font:700 11px Barlow,Arial,sans-serif;color:#c7d7e8;display:grid;gap:6px}
.ai-universal-inner select,.ai-universal-inner textarea{box-sizing:border-box;width:100%;border:1px solid #526a84;background:#132942;color:#fff;border-radius:8px;padding:10px;font:500 12px/1.5 Barlow,Arial,sans-serif}
.ai-universal-inner textarea{resize:vertical}.ai-universal-inner button{border:1px solid #63809b;background:#284360;color:#fff;border-radius:8px;padding:10px;cursor:pointer;font:750 12px Barlow,Arial,sans-serif}
.ai-universal-inner button:disabled{opacity:.5;cursor:wait}.ai-universal-inner button.ai-action-main{background:#ffcb39;color:#142338;border-color:#ffcb39}
.ai-universal-row{display:grid;grid-template-columns:2fr 1fr;gap:8px}#aiUniversalChoices{display:grid;gap:6px}
#aiUniversalChoices button{text-align:left;overflow-wrap:anywhere}#aiUniversalStatus{color:#ffdc80;line-height:1.5;font-size:12px;white-space:pre-wrap}
.ai-universal-inner p{color:#b2c4da;font-size:11px;line-height:1.55}
.ai-inline-btn{padding:8px 12px;margin:7px 0;border:1px solid #56728c;border-radius:9px;background:#264465;color:#fff;cursor:pointer;font:750 11px Barlow,Arial,sans-serif}
.enhance-openai{display:grid}
@media(max-width:850px){.ai-open-button{bottom:calc(78px + env(safe-area-inset-bottom));right:10px;padding:10px 12px}.ai-universal{top:8px;bottom:calc(74px + env(safe-area-inset-bottom));right:8px;width:calc(100vw - 16px)}}
`;document.head.append(css);
function contextField(){
 const key=scope.value;
 if(key==='poster'||key==='citation')return $('headline');
 if(key==='facebook')return format()==='lire'?$('studioCaptionTitle'):$('studioOnlyTitleInput')||$('studioCaptionTitle');
 if(key==='article')return $('studioArticleBody');
 if(key==='caption')return $('studioCaptionPreview');
 if(key==='angle')return $('details');
 return null;
}
function posterImage(){
 if(state.sample)throw Error('Importez d’abord votre propre photo.');
 if(!state.image)throw Error('Aucune photo chargée.');
 const cv=document.createElement('canvas'),w=state.image.width,h=state.image.height;
 const ratio=Math.min(1,720/Math.max(w,h));cv.width=Math.round(w*ratio);cv.height=Math.round(h*ratio);
 cv.getContext('2d').drawImage(state.image,0,0,cv.width,cv.height);
 return cv.toDataURL('image/jpeg',.78);
}
function normalTitle(t){
 if(typeof window.TVPlusHeadlineCase==='function')return window.TVPlusHeadlineCase(t);
 const x=String(t||'').trim();
 return x.length>5&&x===x.toLocaleUpperCase('fr')?x[0]+x.slice(1).toLocaleLowerCase('fr'):x;
}
function open(s,t){
 if(s)scope.value=s;if(t)task.value=t;
 dialog.hidden=false;fab.setAttribute('aria-expanded','true');task.focus();
}
function close(){dialog.hidden=true;fab.setAttribute('aria-expanded','false');}
fab.addEventListener('click',()=>open());
$('aiUniversalClose').addEventListener('click',close);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!dialog.hidden)close()});
let busy=false,last=null;
$('aiUniversalRun').addEventListener('click',async()=>{
 if(busy)return;
 const name=task.value, field=contextField(),selected=String(field?.value||'').trim();
 const fromArticle=String($('studioArticleBody')?.value||'').trim(),official=window.TVPlusAutoArticle?.current?.title;
 const title=normalTitle(name==='titre_court'&&official?official:selected||$('headline')?.value||'');
 const body=['titre_court','resume','angles','seo','article','vigilance'].includes(name)?fromArticle:(selected||fromArticle);
 if(name==='photo_description'&&scope.value!=='photo')scope.value='photo';
 if(name!=='photo_description'&&!title&&!body){stat.textContent='Aucun texte à analyser dans ce module.';return}
 if(['titre_court','resume','angles','seo','article','vigilance'].includes(name)&&fromArticle.length<80){stat.textContent='Récupérez d’abord un article complet pour cette analyse.';return}
 busy=true;$('aiUniversalRun').disabled=true;stat.textContent='Analyse OpenAI…';
 try{
  const extra=String($('aiUniversalContext').value||'').trim();
  const photo=name==='photo_description'?posterImage():undefined;
  const req={task:name,title,article:(body+(extra?'\nContexte communiqué par le journaliste : '+extra:'')).slice(0,12000),format:format(),tone:'journalistique',language:'fr'};
  if(photo)req.image=photo;
  const r=await fetch('/api/editorial-ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(req),cache:'no-store'});
  const payload=await r.json().catch(()=>({}));if(!r.ok)throw Error(payload.error||'Erreur OpenAI.');
  const data=payload.result;last={name,data};
  const titles=['titre_affiche','titre_court','reformulation','decryptage','correction'];
  const proposals=[...(data.options||[]),data.title,data.text].filter(Boolean).map(s=>titles.includes(name)?normalTitle(s):s);
  const unique=[...new Set(proposals)];choices.replaceChildren();
  for(const value of unique.slice(0,6)){const b=document.createElement('button');b.type='button';b.textContent=value.slice(0,250);b.addEventListener('click',()=>{result.value=value;stat.textContent='Proposition sélectionnée. Vérifiez-la avant de l’appliquer.'});choices.append(b)}
  result.value=unique[0]||data.text||'';
  stat.textContent=(data.issues||[]).length?'Points à vérifier : '+data.issues.slice(0,3).join(' · '):'Proposition disponible. Vérification rédactionnelle nécessaire.';
 }catch(e){stat.textContent=e.message||'Service IA indisponible.'}
 finally{busy=false;$('aiUniversalRun').disabled=false}
});
$('aiUniversalApply').addEventListener('click',()=>{
 const field=contextField();if(!field){stat.textContent='Sélectionnez un module texte pour appliquer la proposition.';return}
 if(!result.value.trim())return;
 field.value=['titre_affiche','titre_court','reformulation','decryptage'].includes(last?.name)?normalTitle(result.value):result.value;
 field.dispatchEvent(new Event('input',{bubbles:true}));field.focus();
 stat.textContent='Suggestion appliquée. Relisez le résultat avant publication.';
});
$('aiUniversalCopy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(result.value);stat.textContent='Texte copié.'}catch(_){result.select();stat.textContent='Sélectionnez le texte pour le copier.'}});
function buttonAfter(id,label,s,t){
 const field=$(id);if(!field)return;
 const b=document.createElement('button');b.type='button';b.className='ai-inline-btn';b.textContent=label;
 field.insertAdjacentElement('afterend',b);b.addEventListener('click',()=>open(s,t));
}
buttonAfter('headline','Assistant IA : améliorer le titre','poster','titre_affiche');
buttonAfter('studioCaptionTitle','Assistant IA : légende et titres','facebook','titre_court');
buttonAfter('studioOnlyTitleInput','Assistant IA : reformuler','facebook','reformulation');
buttonAfter('studioArticleBody','Assistant IA : améliorer le contenu','article','article');
buttonAfter('details','Assistant IA : analyser l’angle','angle','decryptage');
const quality=document.querySelector('[data-toolpanel="quality"]');if(quality){
 const b=document.createElement('button');b.className='ai-inline-btn';b.type='button';b.textContent='Contrôle qualité OpenAI';
 quality.prepend(b);b.addEventListener('click',()=>open('poster','controle_qualite'));
}
const photoButton=$('tvplusAIPhotoRun'),photoStatus=$('tvplusAIPhotoStatus');
if(photoButton&&window.TVPlusPhotoEnhance){
 photoButton.addEventListener('click',async()=>{
  if(photoButton.disabled)return;
  photoButton.disabled=true;photoStatus.textContent='Retouche OpenAI en cours…';
  try{
   const tool=window.TVPlusPhotoEnhance,image=tool.sourceDataURL();
   const req={image,mode:$('tvplusAIPhotoPreset').value,instructions:String($('tvplusAIPhotoInstructions').value||'').trim()};
   const r=await fetch('/api/image-ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(req)});
   const payload=await r.json().catch(()=>({}));if(!r.ok)throw Error(payload.error||'Retouche indisponible.');
   await tool.accept(payload.image);
   photoStatus.textContent='Retouche disponible dans la comparaison avant/après. Vérifiez le résultat, puis choisissez Utiliser dans l’affiche ou Exporter.';
  }catch(e){photoStatus.textContent=e.message||'Retouche impossible. Les outils locaux restent disponibles.'}
  finally{photoButton.disabled=false;}
 });
}
const cropAI=$('tvplusCropToOpenAI');if(cropAI){
 cropAI.addEventListener('click',async()=>{
  const canvas=$('cropCanvas'),dlg=$('cropDialog');
  if($('cropExport')?.disabled){alert('Importez une photo dans le recadrage.');return}
  const data=canvas.toDataURL('image/jpeg',.87);dlg.close();$('openEnhanceTool')?.click();
  await window.TVPlusPhotoEnhance?.loadFromDataURL(data,'photo-recadree');
  $('tvplusAIPhotoPreset').focus();
 });
}
window.TVPlusUniversalAI={open,close,version:'2.0'};
})();