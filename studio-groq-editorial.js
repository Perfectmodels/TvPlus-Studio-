/* TV+ Afrique — rédaction assistée avec Groq. Clé exclusivement sur Vercel. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const dlg=$("studioEditorialDialog"),caption=dlg?.querySelector('[data-toolpanel="caption"]');
const kind=$("studioCaptionType");
if(!dlg||!caption||!kind)return;
const panel=document.createElement("details");panel.id="tvplusGroqPanel";panel.className="tvplus-groq-assistant";
panel.innerHTML='<summary><strong>Assistant ChatGPT · Rédaction</strong><span>IA</span></summary>'+
'<div class="tvplus-ai-inner"><p id="tvplusAIConnection" role="status" class="studio-note">Vérifier la connexion Groq…</p>'+
'<div class="tvplus-ai-two"><label>Travail demandé<select id="tvplusAITask">'+
'<option value="titre_court">Titre Facebook depuis l’article</option>'+
'<option value="correction">Corriger orthographe et grammaire</option><option value="reformulation">Reformuler le titre</option>'+
'<option value="legende">Préparer une légende</option><option value="resume">Résumer l’article</option>'+
'<option value="angles">Trouver des angles</option><option value="seo">Optimiser le SEO</option>'+
'<option value="article">Améliorer l’article</option><option value="traduction">Traduire</option>'+
'<option value="vigilance">Points à vérifier</option></select></label>'+
'<label>Texte à modifier<select id="tvplusAIScope"><option value="title">Titre de la légende</option><option value="article">Contenu de l’article</option><option value="caption">Légende complète</option></select></label></div>'+
'<div class="tvplus-ai-two"><label>Ton<select id="tvplusAITone"><option value="journalistique">Journalistique</option><option value="neutre">Neutre</option><option value="institutionnel">Institutionnel</option><option value="dynamique">Dynamique</option><option value="factuel">Factuel</option></select></label>'+
'<label>Langue<select id="tvplusAILanguage"><option value="fr">Français</option><option value="en">Anglais</option><option value="es">Espagnol</option><option value="pt">Portugais</option></select></label></div>'+
'<label class="tvplus-ai-check"><input type="checkbox" id="tvplusAIAuto"/> Générer aussi le titre Facebook avec Groq après récupération de l’article (envoi volontaire du texte à Groq).</label>'+
'<div class="tvplus-ai-actions"><button type="button" id="tvplusAIRun">Proposer avec ChatGPT</button><button type="button" id="tvplusAICopy">Copier le résultat</button></div>'+
'<p id="tvplusAIStatus" role="status" class="studio-note"></p><div id="tvplusAIChoices"></div>'+
'<label>Texte proposé (modifiable)<textarea id="tvplusAIText" rows="4" spellcheck="true"></textarea></label>'+
'<button type="button" id="tvplusAIApply">Appliquer dans le champ sélectionné</button>'+
'<p class="studio-note">Suggestions à relire. Pas de publication automatique ni de vérification des faits sur Internet. Les limites d’utilisation Groq s’appliquent.</p></div>';
const target=$("studioShortenerPanel");
if(target?.parentElement===caption)target.insertAdjacentElement("beforebegin",panel);
else caption.append(panel);
const css=document.createElement("style");
css.id="tvplus-ai-style";
css.textContent=".tvplus-groq-assistant{background:#13243a;color:#f2f6ff;border:1px solid #496281;border-radius:12px;margin:12px 0;overflow:hidden}"+
".tvplus-groq-assistant>summary{cursor:pointer;padding:12px;display:flex;align-items:center;justify-content:space-between;gap:9px}"+
".tvplus-groq-assistant>summary strong{font-size:13px}.tvplus-groq-assistant>summary span{color:#151e2d;background:#ffca39;border-radius:6px;font-size:10px;font-weight:800;padding:5px 7px}"+
".tvplus-ai-inner{padding:0 12px 13px;display:grid;gap:10px}.tvplus-ai-two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}"+
".tvplus-ai-inner label{display:grid;gap:5px;font-size:11px;color:#d4e2f4;font-weight:650}.tvplus-ai-two select,.tvplus-ai-inner textarea{width:100%;min-width:0;border:1px solid #536b86;background:#0d1b2d;color:#fff;border-radius:8px;padding:10px;font:inherit}"+
".tvplus-ai-check{display:flex!important;align-items:flex-start;gap:9px!important;line-height:1.5;font-weight:500!important}.tvplus-ai-check input{width:18px;height:18px;flex:none}"+
".tvplus-ai-actions{display:flex;gap:8px;flex-wrap:wrap}.tvplus-ai-actions button,#tvplusAIApply{min-height:40px;cursor:pointer;border:1px solid #7186a1;border-radius:8px;padding:9px 12px;background:#20354d;color:#fff;font:750 12px Barlow,Arial,sans-serif}"+
"#tvplusAIRun,#tvplusAIApply{background:#ffc21b;border-color:#ffc21b;color:#142136}"+
"#tvplusAIChoices{display:grid;gap:7px}#tvplusAIChoices button{min-height:40px;text-align:left;background:#20354d;color:#fff;border:1px solid #4b617d;border-radius:8px;padding:9px;cursor:pointer}"+
"#tvplusAIChoices button:hover{border-color:#ffcf49}.tvplus-ai-inner button:disabled{opacity:.65;cursor:wait}"+
"@media(max-width:600px){.tvplus-ai-two{grid-template-columns:1fr}.tvplus-ai-actions button{flex:1}}";
document.head.append(css);
const stat=$("tvplusAIStatus"),output=$("tvplusAIText"),choices=$("tvplusAIChoices");
const task=$("tvplusAITask"),scope=$("tvplusAIScope"),auto=$("tvplusAIAuto");
try{auto.checked=sessionStorage.getItem("tvplus-ai-auto")!=="0"}catch(_){}
function title(){
 const linked=window.TVPlusAutoArticle?.current;
 return kind.value==="lire"?String($("studioCaptionTitle")?.value||linked?.title||"").trim():
 String(window.TVPlusFormatTitles?.getTitle(kind.value)||"").trim();
}
function article(){return kind.value==="lire"?String($("studioArticleBody")?.value||"").trim():String(window.TVPlusFormatTitles?.getContext(kind.value)||"").trim()}
function source(){return scope.value==="article"?article():scope.value==="caption"?String($("studioCaptionPreview")?.value||"").trim():title()}
function requestData(name){
 const subject=title(),body=article();
 const needsArticle=["titre_court","resume","angles","seo","article","vigilance"].includes(name);
 const headlineTask=["titre_court","reformulation","titre_affiche","decryptage"].includes(name);
 const official=kind.value==="lire"?window.TVPlusAutoArticle?.current?.title:"";
 if(needsArticle&&body.length<80)throw Error("Récupérez d’abord le contenu de l’article (80 caractères minimum).");
 if(!subject&&!body)throw Error("Saisissez un titre ou récupérez le contenu de l’article.");
 // For a headline request, send the ACTUAL article, not merely a duplicate of its title.
 return {task:name,title:headlineTask&&official?official:subject,
  article:needsArticle||headlineTask?body:(scope.value==="article"?body:source()),
  format:kind.value||"lire",tone:$("tvplusAITone").value,language:$("tvplusAILanguage").value};
}
function show(result){
 choices.replaceChildren();
 const headlineTask=["titre_court","reformulation","titre_affiche","decryptage"].includes(task.value);
 const proposed=headlineTask?[result.title,...(result.options||[])]:[result.text,result.title,...(result.options||[])];
 const candidates=proposed.filter(x=>typeof x==="string"&&x.trim()).filter(x=>
  kind.value!=="60secondes"||!headlineTask||([...x].length<=75&&x.trim().split(/\s+/).length<=12));
 const unique=[...new Set(candidates)];
 if(!unique.length)throw Error("Aucun titre assez court pour En 60 secondes. Relancez la génération.");
 for(const value of unique.slice(0,7)){
  const b=document.createElement("button");b.type="button";b.textContent=value.length>240?value.slice(0,237)+"…":value;
  b.addEventListener("click",()=>{output.value=value;stat.textContent="Texte sélectionné. Relisez avant de l’appliquer."});
  choices.append(b);
 }
 output.value=unique[0]||"";
 if(result.issues?.length)stat.textContent="Points à vérifier : "+result.issues.slice(0,3).join(" · ");
 else stat.textContent="Propositions disponibles. Validation humaine requise.";
}
function apply(value){
 if(lastSuggestionFormat&&lastSuggestionFormat!==kind.value){stat.textContent="Proposition d’un autre format. Relancez la génération.";return;}
 const chosen=scope.value==="article"?$("studioArticleBody"):scope.value==="caption"?$("studioCaptionPreview"):
 kind.value==="lire"?$("studioCaptionTitle"):window.TVPlusFormatTitles?.getInput(kind.value);
 if(!chosen)return;
 chosen.value=value;chosen.dispatchEvent(new Event("input",{bubbles:true}));
 chosen.focus();
 stat.textContent="Suggestion appliquée. Vérifiez le contenu avant publication.";
}
let busy=false,lastSuggestionFormat=null;
async function run(name,automatic=false){
 if(busy)return;
 task.value=name;
 if(["reformulation","titre_affiche","titre_court"].includes(name))scope.value="title";
 let input;try{input=requestData(name)}catch(e){stat.textContent=e.message;return}
 busy=true;const b=$("tvplusAIRun");b.disabled=true;
 stat.textContent="Analyse rédactionnelle en cours…";
 try{
  const res=await fetch("/api/editorial-ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(input),cache:"no-store"});
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw Error(data.error||"Erreur Groq.");
  if(kind.value!==input.format){stat.textContent="Le format a changé durant l’analyse. Relancez la génération.";return;}
  show(data.result);lastSuggestionFormat=input.format;
  if(automatic){
   const current=window.TVPlusAutoArticle?.current;
   if(!current||current.title!==input.title||kind.value!=="lire")return;
   const proposed=[data.result.title,...(data.result.options||[])].find(x=>typeof x==="string"&&[...x].length<=75&&x.trim().split(/\s+/).length<=12&&x.trim().toLocaleLowerCase("fr")!==current.title.trim().toLocaleLowerCase("fr"));
   if(proposed){const dest=$("studioCaptionTitle");dest.value=window.TVPlusHeadlineCase?.(proposed)||proposed;dest.dispatchEvent(new Event("input",{bubbles:true}))}
   if(data.result.hashtags?.length){
    const target=$("studioCaptionHashtags");target.value=data.result.hashtags.join(" ");target.dispatchEvent(new Event("input",{bubbles:true}));
   }
   stat.textContent="Titre IA et hashtags appliqués à la légende. La Pastille n’a pas changé.";
  }
 }catch(e){
  const message=e.message||"Groq indisponible.";
  stat.textContent=message+(automatic?" Le titre provisoire issu de l’article est conservé.":"");
  if(automatic){const notice=$("studioShortenStatus");if(notice)notice.textContent=message+" Titre provisoire conservé; vous pouvez le modifier manuellement."}
 }
 finally{busy=false;b.disabled=false}
}
$("tvplusAIRun").addEventListener("click",()=>run(task.value));
$("tvplusAIApply").addEventListener("click",()=>{if(output.value.trim())apply(output.value)});
$("tvplusAICopy").addEventListener("click",async()=>{
 try{await navigator.clipboard.writeText(output.value);stat.textContent="Texte copié."}
 catch(_){output.focus();output.select();stat.textContent="Sélectionnez le texte pour le copier."}
});
auto.addEventListener("change",()=>{try{sessionStorage.setItem("tvplus-ai-auto",auto.checked?"1":"0")}catch(_){}});
document.addEventListener("tvplus:article-ready",()=>{if(auto.checked&&kind.value==="lire")run("titre_court",true)});
kind.addEventListener("change",()=>{lastSuggestionFormat=null;choices.replaceChildren();output.value="";stat.textContent="Format changé : relancez une génération adaptée.";});
panel.addEventListener("toggle",async()=>{
 if(!panel.open)return;
 const target=$("tvplusAIConnection");
 try{const r=await fetch("/api/editorial-ai",{cache:"no-store"});const x=await r.json();
  target.textContent=x.configured?"Groq est configuré côté serveur.":"La clé GROQ_API_KEY manque sur Vercel.";
 }catch(_){target.textContent="Service Groq indisponible; les outils locaux restent accessibles."}
});
window.TVPlusGroq={run,version:"1.0"};
})();