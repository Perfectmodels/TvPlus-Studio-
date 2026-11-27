(function(){
"use strict";
const $=id=>document.getElementById(id);
const button=$("studioShortenAction"),input=$("studioShortDestination"),mode=$("studioCaptionType"),details=$("studioShortenerPanel"),text=$("studioArticleBody"),title=$("studioCaptionTitle"),link=$("studioCaptionLink"),status=$("studioShortenStatus");
if(!button||!input||!mode||!details||!text||!title||!link||!status)return;
const STATE={current:null};window.TVPlusAutoArticle=STATE;
const KEY=Productions.key("tvplus-auto-article-v3");
const group=mode.closest(".studio-form-grid"),section=mode.closest('[data-toolpanel="caption"]');
if(group)group.insertAdjacentElement("afterend",details);
details.open=true;
details.querySelector("summary").textContent="Importer un article TV+";
input.type="text";input.placeholder="https://www.tvplusafrique.com/a/… ou https://l.tvplusafrique.com/…";
input.closest("label").firstChild.textContent="Lien de l’article";
const help=details.querySelector("p.studio-note");if(help)help.textContent="Collez un lien TV+ : Groq prépare le titre et les hashtags à partir de l’article.";
button.textContent="Importer et générer la légende";
const source=document.createElement("p");source.className="studio-note";source.id="tvplusArticleSource";details.append(source);
const style=document.createElement("style");
style.textContent="#studioShortenAction{width:100%;min-height:44px}#studioShortenerPanel{border-color:#856635!important}#tvplusArticleSource{color:#97d3af}#studioCaptionAdvanced{margin-top:14px;border:1px solid #40546d;border-radius:10px;padding:12px}#studioCaptionAdvanced>summary{cursor:pointer;font-weight:700}#studioCaptionAdvanced>*:not(summary){margin-top:10px}#studioCaptionType{width:100%}";
document.head.append(style);
function notify(msg){status.textContent=msg;}
function normalize(raw){try{
 let v=String(raw||"").trim();if(/^(?:www\.|l\.)?tvplusafrique\.com(?:[/?#]|$)/i.test(v))v="https://"+v;
 if(v.includes("\\"))return null;
 const u=new URL(v);if(!["http:","https:"].includes(u.protocol)||!["tvplusafrique.com","www.tvplusafrique.com","l.tvplusafrique.com"].includes(u.hostname)||u.username||u.password||u.port)return null;
 u.protocol="https:";u.hash="";return u.href;
}catch(_){return null}}
function set(id,value){const f=$(id);if(!f)return;f.value=value;f.dispatchEvent(new Event("input",{bubbles:true}));}
function resetLink(){STATE.current=null;source.textContent="";try{localStorage.removeItem(KEY)}catch(_){}}
try{const saved=JSON.parse(localStorage.getItem(KEY)||"null");if(saved&&normalize(saved.url)&&saved.title&&saved.body&&normalize(saved.shortUrl)){STATE.current=saved;input.value=saved.inputUrl||saved.url;source.textContent="Article lié : "+saved.title}}catch(_){}
const safeTitle=t=>typeof t==="string"&&t.trim()&&[...t].length<=75&&t.trim().split(/\s+/).length<=12;
function chooseTitle(article){const raw=article.title.trim();try{const list=window.TVPlusFrenchHeadlines?.suggest({headline:raw,article:article.body,maxChars:75,maxWords:12})?.candidates||[];const item=list.find(x=>!x.needsReview&&safeTitle(x.title));if(item)return item.title}catch(_){}return raw;}
function officialShort(url){try{const u=new URL(url);return u.hostname==="l.tvplusafrique.com"||/^\/a\/\d+\/?$/.test(u.pathname)}catch(_){return false}}
const advanced=document.createElement("details");advanced.id="studioCaptionAdvanced";advanced.innerHTML="<summary>Réglages avancés et retouches manuelles</summary>";
section.append(advanced);
const aiProposal=section.querySelector(".studio-title-assist [data-generate]")?.closest(".studio-title-assist");
for(const node of [$("studioCaptionTitleBlock"),$("studioArticleHeadlineTool"),$("studioFrenchTitleAssist"),$("studioCaptionIntro")?.closest("label"),section.querySelector(".studio-hashtag-box"),$("studioCaptionRefresh")])if(node)advanced.append(node);
const subtitle=section.querySelector(".studio-tool-subtitle");if(subtitle)subtitle.textContent="Légende prête à copier · modifiable";
const heading=section.querySelector(":scope > p.studio-note");if(heading)heading.textContent="Choisissez un format, préparez la légende et copiez-la.";
function visibility(){
 const active=mode.value==="lire";details.hidden=!active;group.style.gridTemplateColumns="1fr";
 const label=link.closest("label");if(label)label.hidden=true;
 const intro=$("studioCaptionIntro")?.closest("label");if(intro)intro.hidden=!active;
 if(aiProposal)aiProposal.hidden=active;
 if(!active)advanced.open=false;
}
mode.addEventListener("input",visibility);mode.addEventListener("change",visibility);visibility();
input.addEventListener("input",()=>{
 if(STATE.current&&normalize(input.value)!==normalize(STATE.current.inputUrl||STATE.current.url)){
  resetLink();set("studioArticleBody","");set("studioCaptionLink","");set("studioCaptionTitle","");set("studioCaptionIntro","");set("studioCaptionHashtags","");notify("Nouveau lien : importez l’article pour actualiser la légende.");
 }
});
$("studioClearArticle")?.addEventListener("click",()=>{resetLink();input.value="";set("studioCaptionLink","");set("studioCaptionTitle","");set("studioCaptionIntro","");set("studioCaptionHashtags","");notify("Article retiré.");});
button.addEventListener("click",async event=>{
 event.preventDefault();event.stopImmediatePropagation();
 const url=normalize(input.value);if(!url){notify("Collez un lien d’article de tvplusafrique.com ou l.tvplusafrique.com.");return}
 if(mode.value!=="lire"||button.disabled)return;
 button.disabled=true;const originalLabel=button.textContent;button.textContent="Préparation…";
 const stillCurrent=()=>mode.value==="lire"&&normalize(input.value)===url;
 try{
  notify("1/2 · Récupération de l’article…");
  const response=await fetch("/api/article?url="+encodeURIComponent(url),{cache:"no-store"}),article=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(article.error||"Article introuvable.");
  if(!article.title||!article.body||article.body.length<110)throw Error("Le contenu de cet article est insuffisant.");
  if(!stillCurrent())return;
  let shareUrl=officialShort(url)?url:(article.url||url),shortNote="";
  if(!officialShort(shareUrl)){
   try{const health=await fetch("/api/shorten",{cache:"no-store"}).then(r=>r.json());if(health.configured){
    const r=await fetch("/api/shorten",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({destination:article.url||url,title:article.title})});
    const data=await r.json();if(r.ok&&/^https:\/\/l\.tvplusafrique\.com\/[\w-]+\/?$/.test(data.shortUrl||""))shareUrl=data.shortUrl;else shortNote=" Lien original conservé.";
   }else shortNote=" Lien original conservé.";}catch(_){shortNote=" Lien original conservé.";}
  }
  if(!stillCurrent())return;
  STATE.current={inputUrl:url,url:article.url||url,title:article.title,body:article.body,shortUrl:shareUrl,category:article.category||""};
  try{localStorage.setItem(KEY,JSON.stringify(STATE.current))}catch(_){}
  set("studioArticleBody",article.body);set("studioCaptionLink",shareUrl);set("studioCaptionIntro","");set("studioCaptionHashtags","");set("studioCaptionTitle",chooseTitle(article));$("studioGenerateHashtags")?.click();
  source.textContent="Article importé : "+article.title;
  notify("2/2 · Génération avec Groq…");
  try{
   const r=await fetch("/api/editorial-ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({task:"legende",format:"lire",title:article.title.slice(0,500),article:article.body.slice(0,12000),tone:"journalistique",language:"fr"})});
   const data=await r.json().catch(()=>({}));if(!r.ok)throw Error(data.error||"Groq indisponible.");
   if(!safeTitle(data.result?.title))throw Error("Titre Groq trop long ou manquant.");
   if(!stillCurrent())return;
   set("studioCaptionTitle",data.result.title.trim());set("studioCaptionHashtags",(data.result.hashtags||[]).join(" "));
   notify("Légende générée. Relisez puis copiez."+shortNote);
  }catch(e){if(stillCurrent()){advanced.open=!safeTitle(title.value);notify("Article importé. Groq : "+e.message+" Titre provisoire conservé."+shortNote);}}
 }catch(e){if(stillCurrent())notify(e.message||"Impossible de préparer la légende.")}
 finally{button.disabled=false;button.textContent=originalLabel}
},true);
})();