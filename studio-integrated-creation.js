/* Unified creation workspace: tools reuse the existing poster, photo and caption engines. */
(function(){
"use strict";
const $=id=>document.getElementById(id),workspace=document.querySelector(".workspace"),panel=workspace?.querySelector(":scope > section.panel"),preview=workspace?.querySelector(":scope > .preview-pane");
if(!workspace||!panel||!preview)return;
workspace.classList.add("creation-workspace");
const make=(tag,cls)=>Object.assign(document.createElement(tag),{className:cls||""});
const button=(label,fn)=>{const b=make("button","creation-tool-button");b.type="button";b.textContent=label;b.addEventListener("click",fn);return b;};
const scroll=node=>node?.scrollIntoView({block:"nearest",behavior:"instant"});
const titleField=$("headline")?.closest(".field"),photoField=$("photoInput")?.closest(".field");
if(!titleField||!photoField)return;
const editorialSlot=make("div","creation-tool-slot");editorialSlot.id="creationEditorialSlot";panel.append(editorialSlot);
const photoSlot=make("div","creation-tool-slot");photoSlot.id="creationPhotoSlot";photoField.after(photoSlot);
const titleSlot=make("section","creation-title-assist");titleSlot.id="creationTitleAssist";titleField.after(titleSlot);
const titleHead=make("div","creation-tool-heading");titleHead.textContent="Titre assisté par Groq";
const titleActions=make("div","creation-tool-actions");
const status=make("p","creation-status");status.setAttribute("role","status");status.setAttribute("aria-live","polite");
const choices=make("div","creation-title-choices");
const context=make("details","creation-title-context");context.innerHTML='<summary>Ajouter un contexte factuel (facultatif)</summary><textarea rows="3" maxlength="12000" aria-label="Faits et contexte pour le titre" placeholder="Collez le texte de l’article ou les faits vérifiés…"></textarea>';
const contextText=context.querySelector("textarea");
const contextByMode=new Map();let modeBefore=state.mode,request=0,busy=false;
const format=()=>String(state.mode||"pastille");
const currentTitle=()=>$("headline").value.trim();
const taskFor=(mode,action)=>action==="correct"?(mode==="verbatim"?"citation":"correction"):({verbatim:"citation",sondage:"sondage",caalors:"ca_alors",decryptage:"decryptage"}[mode]||"titre_affiche");
function updateMode(){
 const m=format();
 if(m!==modeBefore){contextByMode.set(modeBefore,contextText.value);contextText.value=contextByMode.get(m)||"";modeBefore=m;request++;choices.replaceChildren();status.textContent="";busy=false;for(const b of titleActions.querySelectorAll("button"))b.disabled=false;}
 const label=m==="verbatim"?"Citation assistée par Groq":m==="sondage"?"Question et réponses · Groq":m==="decryptage"?"Titre et angle · Groq":"Titre assisté par Groq";if(titleHead.textContent!==label)titleHead.textContent=label;
}
function setTitle(value){const f=$("headline");f.value=value;f.dispatchEvent(new Event("input",{bubbles:true}));f.dispatchEvent(new Event("change",{bubbles:true}));window.TVPlusEditorial?.scheduleSave();}
async function generate(action){
 updateMode();if(busy)return;
 const m=format(),original=currentTitle(),facts=contextText.value.trim(),linked=window.TVPlusAutoArticle?.current;
 const source=action==="correct"||m==="verbatim"?"":facts||(linked?.title===original?linked.body:"")||"";
 if(!original&&!source){status.textContent=m==="verbatim"?"Saisissez la citation exacte avant de demander une correction.":"Ajoutez un titre ou des faits vérifiés.";context.open=true;contextText.focus();return;}
 const turn=++request;busy=true;choices.replaceChildren();status.textContent="Groq analyse votre contenu…";for(const b of titleActions.querySelectorAll("button"))b.disabled=true;
 try{
  const task=taskFor(m,action);
  const r=await fetch("/api/editorial-ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({task,title:original.slice(0,500),article:source.slice(0,12000),format:m==="caalors"?"caalors":m,tone:"journalistique",language:"fr"})});
  const data=await r.json().catch(()=>({}));if(turn!==request||m!==format())return;
  if(!r.ok)throw Error(data.error||"Groq indisponible.");
  if(currentTitle()!==original||contextText.value.trim()!==facts){status.textContent="Le sujet a changé. Relancez la génération.";return;}
  const result=data.result||{};
  const options=task==="citation"||task==="correction"?[result.text||result.title]:task==="sondage"?[result.title]:[result.title,...(result.options||[])];
  const list=[...new Set(options.filter(x=>typeof x==="string"&&x.trim()))].slice(0,5);
  if(!list.length)throw Error("Aucune proposition exploitable.");
  for(const value of list){choices.append(button(value,()=>{if(format()!==m||currentTitle()!==original){status.textContent="Le sujet a changé. Relancez la génération.";return;}setTitle(value);choices.replaceChildren();status.textContent="Texte appliqué à l’affiche. Relisez avant publication.";}));}
  if(task==="sondage"&&Array.isArray(result.options)&&result.options.length===4&&result.options.every(x=>typeof x==="string"&&x.trim())){
   const question=result.title;choices.append(button("Appliquer la question et les 4 réponses",()=>{if(format()!==m||currentTitle()!==original)return;setTitle(question);for(const [i,id] of ["pollA","pollB","pollC","pollD"].entries()){const f=$(id);if(f){f.value=result.options[i];f.dispatchEvent(new Event("input",{bubbles:true}));}}choices.replaceChildren();window.TVPlusEditorial?.scheduleSave();status.textContent="Sondage appliqué. Vérifiez la neutralité des réponses.";}));
  }
  status.textContent="Choisissez une proposition à appliquer à cette affiche.";
 }catch(e){if(turn===request)status.textContent=e.message||"Génération impossible.";}
 finally{if(turn===request){busy=false;for(const b of titleActions.querySelectorAll("button"))b.disabled=false;}}
}
titleActions.append(button("Proposer avec Groq",()=>generate("generate")),button("Corriger le texte",()=>generate("correct")));
titleSlot.append(titleHead,titleActions,context,status,choices);
const photoActions=make("div","creation-tool-actions");
const closePhoto=except=>{for(const id of ["cropDialog","enhanceDialog"]){const d=$(id);if(d?.open&&d!==except)d.close();}};
for(const id of ["cropDialog","enhanceDialog"]){
 const d=$(id);if(!d)continue;
 d.classList.add("creation-inline");photoSlot.append(d);
 d.addEventListener("toggle",()=>{if(d.open){closePhoto(d);requestAnimationFrame(()=>scroll(d));}});
}
for(const [id,label] of [["openCropTool","Recadrer la photo"],["openEnhanceTool","Améliorer la photo"]]){
 const d=$(id);d?.addEventListener("click",()=>{const target=$(id==="openCropTool"?"cropDialog":"enhanceDialog");closePhoto(target);requestAnimationFrame(()=>scroll(target));});
 photoActions.append(button(label,()=>d?.click()));
}
photoSlot.prepend(photoActions);
const assistant=$("tvplusAssistantPanel");if(assistant){
 const slot=make("div","creation-tool-slot");slot.id="creationAssistantSlot";titleSlot.after(slot);slot.append(assistant);
 new MutationObserver(()=>{if(!assistant.hidden)scroll(assistant);}).observe(assistant,{attributes:true,attributeFilter:["hidden"]});
}
const existing=$("headline")?.parentElement?.querySelector(".ai-inline-btn");if(existing){existing.textContent="Autres outils IA";existing.classList.add("creation-advanced-ai");}
const textInspectorSlot=make("div","creation-tool-slot");titleSlot.after(textInspectorSlot);
let connectedInspector=null;
function directSection(label,host){
 const box=make("section","creation-direct-block");
 const title=make("h3","creation-tool-heading");title.textContent=label;
 box.append(title);host.append(box);return box;
}
function connectInspector(){
 const inspector=workspace.querySelector(".production-inspector");if(!inspector||connectedInspector===inspector)return;
 connectedInspector=inspector;inspector.classList.add("creation-inspector","creation-unused-inspector");
 // Preserve original control nodes, listeners, values and inspector containers.
 // The inspector's navigation can no longer hide or relocate the controls.
 const textControls=inspector.querySelector('[data-controls="text"]'),imageControls=inspector.querySelector('[data-controls="photo"]');
 if(textControls){const box=directSection("Typographie et position du texte",textInspectorSlot);box.append(...Array.from(textControls.children));}
 if(imageControls){const box=directSection("Cadrage et dégradé",photoSlot);box.append(...Array.from(imageControls.children));}
}
const observer=new MutationObserver(()=>{connectInspector();updateMode();});
observer.observe(workspace,{childList:true,subtree:false});connectInspector();
async function installDirectEditorial(){
 const project=Productions.id?await Productions.get("projects",Productions.id):null;
 if(project&&["reportage","no"].includes(project.format))return;
 const editorial=window.TVPlusEditorial,dialog=editorial?.dialog;
 const caption=dialog?.querySelector('[data-toolpanel="caption"]'),quality=dialog?.querySelector('[data-toolpanel="quality"]');
 if(!caption||!quality)return;
 if(!Productions.id){
  const textBox=directSection("Typographie et position du texte",textInspectorSlot);
  for(const node of [$("fontScale")?.closest(".field"),$("pastilleSpacingField"),$("appearanceDetails")])if(node)textBox.append(node);
  const imageBox=directSection("Cadrage et dégradé",photoSlot);
  for(const node of [$("pastillePhotoFraming"),$("mediaDetails")])if(node)imageBox.append(node);
 }
 // Keep each live panel in the editor itself, rather than moving between views.
 const captionBox=directSection("Légende réseaux sociaux",editorialSlot);
 captionBox.append(caption);caption.hidden=false;
 const qualityBox=directSection("Vérification et export",editorialSlot);
 qualityBox.append(quality);quality.hidden=false;
 workspace.classList.add("creation-direct");
 const originalShow=editorial.show;
 editorial.show=function(key="caption"){
  if(key==="caption"){scroll(captionBox);return;}
  if(key==="quality"){$("studioRunCheck")?.click();scroll(qualityBox);return;}
  return originalShow(key);
 };
 if(dialog.open)editorial.close();
 if(!Productions.id)editorialSlot.append(button("Mes brouillons",()=>originalShow("drafts")));
 const captionType=$("studioCaptionType");
 if(!Productions.id&&captionType){captionType.value=format()==="alerte"?"alerte":"lire";captionType.dispatchEvent(new Event("change",{bubbles:true}));}
 else $("studioCaptionTitle")?.dispatchEvent(new Event("input",{bubbles:true}));
 document.querySelectorAll(".mode-switch button").forEach(b=>b.addEventListener("click",()=>requestAnimationFrame(()=>{
  if(!Productions.id&&captionType){captionType.value=format()==="alerte"?"alerte":"lire";captionType.dispatchEvent(new Event("change",{bubbles:true}));}
 })));
}
installDirectEditorial().catch(error=>console.warn("TV+ direct editor",error));
document.querySelectorAll(".mode-switch button").forEach(b=>b.addEventListener("click",()=>{requestAnimationFrame(updateMode);closePhoto();}));
document.addEventListener("studio-drafts-ready",()=>requestAnimationFrame(updateMode));
window.addEventListener("resize",()=>{updateMode();});
const css=make("style");css.textContent=`
.creation-workspace,body.production-active .creation-workspace:not([data-workflow-panel=editorial]){grid-template-columns:minmax(0, min(48%,570px)) minmax(0,1fr)!important;gap:16px!important}
.creation-workspace>section.panel{grid-column:1!important;grid-row:1!important;min-width:0;overflow-x:hidden!important}
.creation-workspace>.preview-pane{grid-column:2!important;grid-row:1!important;display:flex!important;min-width:0}
.creation-workspace[data-workflow-panel="editorial"]>.preview-pane{display:flex!important}
.creation-tool-actions{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.creation-direct-block{min-width:0;border:1px solid #3e5874;border-radius:12px;background:#13263d;padding:12px;margin:12px 0;display:grid;gap:8px}
.creation-direct-block>h3{margin:0 0 5px;font-size:14px}
.creation-direct-block .studio-tool-panel{min-width:0}
.creation-workspace .creation-unused-inspector{display:none!important}
body:has(.creation-direct):not(.video-only) .flow-desktop-nav,body:has(.creation-direct):not(.video-only) .mobile-dock,body:has(.creation-direct):not(.video-only) .mobile-view-switch,body:has(.creation-direct):not(.video-only) #studioEditorialOpen,body:has(.creation-direct):not(.video-only) .inspector-launch{display:none!important}
body:has(.creation-direct):not(.video-only) .production-bar [data-action="poster"],body:has(.creation-direct):not(.video-only) .production-bar [data-action="caption"],body:has(.creation-direct):not(.video-only) .production-bar [data-action="jpg"],body:has(.creation-direct):not(.video-only) .production-bar [data-action="preview"],body:has(.creation-direct):not(.video-only) .production-bar [data-tool]{display:none!important}
body:has(.creation-direct):not(.video-only) .workspace{padding-bottom:18px!important}
body:has(.creation-direct) .studio-editorial-tabs [data-tooltab]:not([data-tooltab="drafts"]){display:none!important}
.creation-tool-button{cursor:pointer;min-height:38px;padding:8px 11px;border:1px solid #4c6885;border-radius:8px;background:#213b58;color:#f3f7ff;font:700 12px Barlow,Arial,sans-serif;text-align:left;overflow-wrap:anywhere}
.creation-tool-button:hover,.creation-tool-button:focus-visible{border-color:#ffca37}
.creation-tool-button:disabled{opacity:.55;cursor:wait}
.creation-title-assist{margin:8px 0 12px;padding:12px;border:1px solid #3e5874;background:#13263d;border-radius:12px;display:grid;gap:9px}
.creation-tool-heading{font-weight:800;font-size:13px;color:#f3f7ff}
.creation-title-assist .creation-tool-actions button:first-child{background:#ffca37;border-color:#ffca37;color:#142239}
.creation-title-context summary{cursor:pointer;font-size:12px;color:#bacbe0}
.creation-title-context textarea{margin-top:6px;min-height:80px}
.creation-status{margin:0;color:#bbcee3;font-size:12px;line-height:1.5;overflow-wrap:anywhere}
.creation-status:empty,.creation-title-choices:empty{display:none}
.creation-title-choices{display:grid;gap:6px}
.creation-tool-slot{min-width:0;max-width:100%;margin:8px 0}
.creation-tool-slot>dialog[open]{position:relative!important;inset:auto!important;margin:10px 0!important;width:100%!important;max-width:100%!important;height:auto!important;max-height:none!important;min-height:0!important;box-shadow:none!important;overflow:visible!important}
.creation-tool-slot>dialog:not([open]){display:none!important}
.creation-tool-slot>dialog.crop-dialog[open],.creation-tool-slot>dialog.enhance-dialog[open]{display:block!important}
.creation-tool-slot .crop-dialog-content,.creation-tool-slot .enhance-body{display:flex!important;flex-direction:column!important;max-height:none!important;overflow:visible!important;padding:12px!important;gap:10px!important}
.creation-tool-slot .crop-preview,.creation-tool-slot .enhance-stage{order:-1;width:100%;min-width:0}
.creation-tool-slot .crop-side,.creation-tool-slot .enhance-controls{width:100%;min-width:0;overflow:visible!important}
.creation-tool-slot .crop-footer,.creation-tool-slot .enhance-footer{flex-wrap:wrap;gap:8px}
.creation-tool-slot .crop-footer-actions,.creation-tool-slot .enhance-footer-actions{display:flex!important;flex-wrap:wrap;min-width:0}
.creation-tool-slot .crop-footer-actions button,.creation-tool-slot .enhance-footer-actions button{flex:1 1 140px;white-space:normal}
.creation-tool-slot .enhance-comparison{max-height:240px}
.creation-tool-slot .studio-editorial-dialog[open]{display:flex!important;flex-direction:column}
.creation-tool-slot .studio-editorial-main{max-height:none!important;overflow:visible!important}
.creation-tool-slot .studio-editorial-head,.creation-tool-slot .studio-editorial-tabs{position:static!important}
.creation-tool-slot .studio-editorial-tabs{flex-wrap:wrap}
.creation-tool-slot .ai-universal{position:relative!important;inset:auto!important;width:100%!important;max-width:100%;box-shadow:none}
.creation-tool-slot .ai-universal-inner{overflow:visible}
.creation-workspace .creation-inspector{position:relative!important;inset:auto!important;transform:none!important;width:100%!important;max-width:100%!important;max-height:none!important;height:auto!important;box-shadow:none!important;overflow:visible!important}
body.production-active .creation-workspace .creation-inspector:not([data-open]),.creation-workspace .creation-inspector:not([data-open]),body.production-active .creation-workspace .creation-unused-inspector{display:none!important}
body.production-active .creation-workspace .creation-inspector:not(.creation-unused-inspector)[data-open],body.production-active .creation-workspace .creation-inspector:not(.creation-unused-inspector)[data-open=true]{display:block!important;position:relative!important;inset:auto!important;max-height:none!important;overflow:visible!important;z-index:auto!important}
.creation-advanced-ai{font-size:11px}
@media(max-width:850px){
 .creation-workspace{display:flex!important;flex-direction:column!important;gap:8px!important;padding-bottom:95px!important}
 .creation-workspace>section.panel,.creation-workspace[data-mobile-view="preview"]>section.panel,.creation-workspace[data-workflow-panel="editorial"]>section.panel{display:block!important;order:1;width:100%;height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important}
 .creation-workspace>.preview-pane,.creation-workspace[data-mobile-view="editor"]>.preview-pane,.creation-workspace[data-workflow-panel="editorial"]>.preview-pane{display:flex!important;order:0;width:100%;position:relative!important;top:auto!important;min-height:0!important;height:auto!important}
 .creation-workspace .canvas-shell{width:min(60vw,260px)!important}
 .creation-workspace .canvas-shell.is-wide{width:min(85vw,350px)!important}
 .creation-workspace .preview-actionbar{gap:6px}
 .creation-workspace .studio-editorial-dialog.studio-inline{min-height:0!important}
}
@media(max-width:850px) and (min-height:650px){
 body.production-active:not(.video-only) .creation-workspace>.preview-pane{position:sticky!important;top:54px!important;z-index:15;padding:7px!important}
 body.production-active:not(.video-only) .creation-workspace .canvas-shell{width:min(38vw,145px)!important}
 body.production-active:not(.video-only) .creation-workspace .canvas-shell.is-wide{width:min(56vw,200px)!important}
 body.production-active:not(.video-only) .creation-workspace .preview-actionbar,body.production-active:not(.video-only) .creation-workspace .preview-bottom,body.production-active:not(.video-only) .creation-workspace .preview-pane .info{display:none!important}
}
body.production-active.video-only .creation-workspace:not(:has(#studioEditorialDialog[open])){display:none!important}
body.video-only .creation-workspace>.preview-pane,body.video-only .creation-workspace>section.panel>.creation-tool-rail,body.video-only .creation-workspace>section.panel>.creation-title-assist,body.video-only .creation-workspace #creationPhotoSlot{display:none!important}
body.video-only .creation-workspace>section.panel>*:not(#creationEditorialSlot){display:none!important}
body.video-only .creation-workspace>section.panel{grid-column:1/-1!important;width:100%!important}
`;
document.head.append(css);updateMode();
// Video formats keep the existing timeline and preview; a dedicated title button edits only vsTitle.
const videoTitle=$("vsTitle");
if(videoTitle){
 const block=make("div","creation-title-assist"),note=make("p","creation-status"),results=make("div","creation-title-choices");
 note.setAttribute("role","status");const run=button("Proposer un titre vidéo avec Groq",async()=>{
  const original=videoTitle.value.trim(),mode=$("vsMode")?.value||"reportage";
  if(!original){note.textContent="Saisissez les faits ou un premier titre.";return;}
  run.disabled=true;results.replaceChildren();note.textContent="Génération…";
  try{const response=await fetch("/api/editorial-ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({task:mode==="verbatim"?"citation":"titre_affiche",title:original.slice(0,500),article:original,format:mode==="reportage"?"reportage":mode,tone:"journalistique",language:"fr"})});const data=await response.json();if(!response.ok)throw Error(data.error||"Groq indisponible.");
  if(videoTitle.value.trim()!==original||$("vsMode")?.value!==mode){note.textContent="Le sujet a changé. Relancez.";return;}
  const values=mode==="verbatim"?[data.result.text||data.result.title]:[data.result.title,...(data.result.options||[])];for(const v of [...new Set(values.filter(Boolean))].slice(0,5))results.append(button(v,()=>{if(videoTitle.value.trim()!==original||$("vsMode")?.value!==mode)return;videoTitle.value=v;videoTitle.dispatchEvent(new Event("input",{bubbles:true}));videoTitle.dispatchEvent(new Event("change",{bubbles:true}));results.replaceChildren();note.textContent="Titre vidéo appliqué.";}));note.textContent="Choisissez le titre à utiliser.";
  }catch(e){note.textContent=e.message||"Génération impossible.";}finally{run.disabled=false;}
 });block.append(run,note,results);videoTitle.closest("label")?.after(block);
}
})();
