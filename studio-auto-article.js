(function(){
"use strict";
const $=id=>document.getElementById(id);
const button=$("studioShortenAction"),input=$("studioShortDestination"),mode=$("studioCaptionType"),details=$("studioShortenerPanel");
const text=$("studioArticleBody"),title=$("studioCaptionTitle"),link=$("studioCaptionLink"),status=$("studioShortenStatus");
if(!button||!input||!mode||!details||!text||!title||!link||!status)return;
const STATE={current:null};
window.TVPlusAutoArticle=STATE;
const KEY="tvplus-auto-article-v3";
const group=mode.closest(".studio-form-grid");
if(group)group.insertAdjacentElement("afterend",details);
details.open=true;
details.querySelector("summary").textContent="Article TV+ → contenu, lien court et légende";
button.textContent="Récupérer l’article et préparer la légende";
const expl=document.createElement("p");expl.className="studio-note";expl.textContent="Collez l’URL de l’article. Le contenu, le lien court, le titre Facebook et les hashtags sont préparés automatiquement, sans changer la Pastille.";
input.closest("label")?.insertAdjacentElement("beforebegin",expl);
input.placeholder="https://www.tvplusafrique.com/index.php?page=detail-article&article=...";
const source=document.createElement("p");source.className="studio-note";source.id="tvplusArticleSource";
$("studioArticleHeadlineTool")?.append(source);
const style=document.createElement("style");
style.textContent="#studioShortenAction{width:100%;min-height:44px}#studioShortenerPanel{border-color:#856635!important}#tvplusArticleSource{color:#97d3af}";
document.head.append(style);
function notify(msg){status.textContent=msg;}
function valid(raw){try{const u=new URL(raw);return u.protocol==="https:"&&["tvplusafrique.com","www.tvplusafrique.com"].includes(u.hostname)&&!u.username&&!u.password&&!u.port}catch(_){return false}}
function set(id,value){const field=$(id);if(!field)return;field.value=value;field.dispatchEvent(new Event("input",{bubbles:true}));}
function resetLink(){STATE.current=null;source.textContent="";try{localStorage.removeItem(KEY)}catch(_){}}
try{const saved=JSON.parse(localStorage.getItem(KEY)||"null");if(saved&&valid(saved.url)&&saved.title&&saved.body&&saved.shortUrl){STATE.current=saved;input.value=saved.url;source.textContent="Article lié : "+saved.title}}catch(_){}
function chooseTitle(article){
 const raw=article.title.trim();
 const safe=t=>typeof t==="string"&&[...t].length<=75&&t.trim().split(/\s+/).length<=12&&!t.trim().endsWith("…");
 try{
  // Even if the original title is short, examine the article and seek a genuinely different passage.
  const list=window.TVPlusFrenchHeadlines?.suggest({headline:raw,article:article.body,maxChars:75,maxWords:12})?.candidates||[];
  const derived=list.find(x=>!x.needsReview&&safe(x.title)&&x.title.trim().toLocaleLowerCase("fr")!==raw.toLocaleLowerCase("fr"));
  if(derived)return {title:derived.title,review:true,source:"extractif"};
 }catch(_){}
 if(safe(raw))return {title:raw,review:false,source:"original"};
 // Do not present a truncated phrase as a finished journalistic headline.
 return {title:raw,review:true,source:"original_long"};
}
function visibility(){const active=mode.value==="lire";details.hidden=!active;const label=link.closest("label");if(label)label.hidden=active;const intro=$("studioCaptionIntro")?.closest("label");if(intro)intro.hidden=active;}
mode.addEventListener("input",visibility);mode.addEventListener("change",visibility);visibility();
input.addEventListener("input",()=>{if(STATE.current&&input.value.trim()!==STATE.current.url){resetLink();set("studioCaptionLink","");notify("L’URL a changé : actualisez la légende pour éviter un mauvais lien.");}});
$("studioClearArticle")?.addEventListener("click",resetLink);
button.addEventListener("click",async event=>{
 event.preventDefault();event.stopImmediatePropagation();
 if(mode.value!=="lire"){notify("Choisissez d’abord « À lire ».");return}
 const url=input.value.trim();if(!valid(url)){notify("L’URL doit être une page HTTPS de tvplusafrique.com.");return}
 button.disabled=true;const originalLabel=button.textContent;
 try{
  notify("1/3 Lecture de l’article TV+…");
  const response=await fetch("/api/article?url="+encodeURIComponent(url),{cache:"no-store"});
  const article=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(article.error||"Article introuvable.");
  if(!article.title||!article.body||article.body.length<110)throw Error("Le contenu de cet article est insuffisant.");
  notify("2/3 Création du lien court…");
  const r=await fetch("/api/shorten",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({destination:article.url||url,title:article.title})});
  const shortened=await r.json().catch(()=>({}));
  if(!r.ok)throw Error(shortened.error||"La réduction du lien a échoué.");
  if(!/^https:\/\/l\.tvplusafrique\.com\/[\w-]+/.test(shortened.shortUrl||""))throw Error("Lien réduit invalide.");
  notify("3/3 Rédaction de la légende…");
  const out=chooseTitle(article);
  STATE.current={url:article.url||url,title:article.title,body:article.body,shortUrl:shortened.shortUrl,category:article.category||""};
  try{localStorage.setItem(KEY,JSON.stringify(STATE.current))}catch(_){}
  set("studioArticleBody",article.body);set("studioCaptionLink",shortened.shortUrl);set("studioCaptionTitle",window.TVPlusHeadlineCase?.(out.title)||out.title);
  $("studioGenerateHashtags")?.click();
  const articleTool=$("studioArticleHeadlineTool");if(articleTool)articleTool.open=true;
  source.textContent="Titre officiel de l’article : "+article.title;
  notify("Article et lien court récupérés. "+(out.source==="extractif"?"Titre provisoire extrait du contenu, à relire.":"Titre officiel conservé en attendant une reformulation.")+" Les suggestions IA apparaissent dans l’assistant si OpenAI est disponible.");
  document.dispatchEvent(new CustomEvent("tvplus:article-ready",{detail:{url:STATE.current.url,title:STATE.current.title,shortUrl:STATE.current.shortUrl}}));
 }catch(e){notify(e.message||"Impossible de préparer la légende.")}
 finally{button.disabled=false;button.textContent=originalLabel}
},true);
})();