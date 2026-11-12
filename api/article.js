'use strict';
// Fetch and extract only public TV+ Afrique articles. No arbitrary external URL.
const allowed=new Set(["www.tvplusafrique.com","tvplusafrique.com"]);
const counters=new Map();
function respond(res,code,json){
 res.setHeader("Content-Type","application/json; charset=utf-8");
 res.setHeader("Cache-Control","no-store");res.setHeader("X-Content-Type-Options","nosniff");
 return res.status(code).json(json);
}
function safeURL(raw){
 if(typeof raw!=="string"||raw.length>2048||/\\/.test(raw))return null;
 try{const url=new URL(raw.trim());
 if(url.protocol!=="https:"||!allowed.has(url.hostname.toLowerCase())||url.port||url.username||url.password)return null;
 if(!/^\/(?:$|index\.php$|articles?(?:\/|$)|actualites?(?:\/|$)|news(?:\/|$))/i.test(url.pathname))return null;
 return url.href;
 }catch(_){return null}
}
const entities={nbsp:" ",amp:"&",lt:"<",gt:">",quot:'"',apos:"'",eacute:"é",egrave:"è",ecirc:"ê",agrave:"à",ccedil:"ç",rsquo:"’",ldquo:"“",rdquo:"”"};
function decode(s){
 return String(s||"").replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi,(full,key)=>{
 if(key[0]==="#"){
  const n=key[1].toLowerCase()==="x"?parseInt(key.slice(2),16):parseInt(key.slice(1),10);
  return Number.isInteger(n)&&n>0&&n<0x110000?String.fromCodePoint(n):full;
 }
 return entities[key.toLowerCase()]||full;
 });
}
function plain(html){
 return decode(String(html||"").replace(/<script\b[\s\S]*?<\/script>/gi," ")
 .replace(/<style\b[\s\S]*?<\/style>/gi," ")
 .replace(/<br\b[^>]*>/gi,"\n").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim());
}
function attr(tag,key){
 const match=new RegExp("\\b"+key+"\\s*=\\s*([\"'])([\\s\\S]*?)\\1","i").exec(tag);
 return match?decode(match[2]):"";
}
function getMeta(html,name){
 for(const match of html.matchAll(/<meta\b[^>]*>/gi)){
  const tag=match[0],property=(attr(tag,"property")||attr(tag,"name")).toLowerCase();
  if(property===name.toLowerCase())return attr(tag,"content").trim();
 }
 return "";
}
function jsonArticle(html){
 let best=null;
 for(const m of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
  try{
   const root=JSON.parse(m[1]),queue=Array.isArray(root)?root:[root];
   let i=0;
   while(queue.length&&++i<100){
    const x=queue.shift();if(!x||typeof x!=="object")continue;
    if(Array.isArray(x)){queue.push(...x);continue;}
    const type=String(x["@type"]||"");
    if(/NewsArticle|Article|BlogPosting/i.test(type)){
     const cand={title:plain(x.headline||x.name||""),body:plain(x.articleBody||""),description:String(x.description||"")};
     if(!best||cand.body.length>best.body.length)best=cand;
    }
    if(x["@graph"])queue.push(x["@graph"]);
    if(x.mainEntity)queue.push(x.mainEntity);
   }
  }catch(_){}
 }
 return best;
}
function extract(html,url){
 const structured=jsonArticle(html)||{};
 const title=plain(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1]||"")||
 structured.title||getMeta(html,"og:title")||plain(/<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]||"");
 const cleanTitle=String(title).replace(/\s*[|·–]\s*TV\+?\s*(?:Afrique)?\s*$/i,"").trim().slice(0,260);
 if(cleanTitle.length<8)throw Error("Titre de l'article introuvable.");
 let body=structured.body||"";
 if(body.length<110){
  const clean=html.replace(/<script\b[\s\S]*?<\/script>/gi," ").replace(/<style\b[\s\S]*?<\/style>/gi," ")
   .replace(/<nav\b[\s\S]*?<\/nav>/gi," ").replace(/<footer\b[\s\S]*?<\/footer>/gi," ");
  const matched=/<article\b[^>]*>([\s\S]*?)<\/article>/i.exec(clean);
  const matchedH1=/<h1\b[^>]*>[\s\S]*?<\/h1>/i.exec(clean);
  const tail=matched?.[1]|| (matchedH1?clean.slice(clean.indexOf(matchedH1[0])+matchedH1[0].length):clean);
  const paragraphs=[];
  for(const m of tail.matchAll(/<p\b([^>]*)>([\s\S]*?)<\/p>/gi)){
    const t=plain(m[2]);if(t.length<42||t.length>4000)continue;
    if(/(?:sidebar|related|comment|share|newsletter|advert|cookie)/i.test(m[1]))continue;
    if(/^(?:Lire aussi|À lire aussi|Partager|Suivez-nous|Source\s*:|Photo\s*:)/i.test(t))continue;
    if(paragraphs[paragraphs.length-1]!==t)paragraphs.push(t);
    if(paragraphs.length>=45)break;
  }
  body=paragraphs.join("\n\n");
 }
 body=body.slice(0,24000).trim();
 if(body.length<110||body.toLowerCase()===cleanTitle.toLowerCase())throw Error("Le texte complet de cet article n'a pas pu être extrait.");
 return {url,title:cleanTitle,body,description:(structured.description||getMeta(html,"description")||"").slice(0,500),
  category:getMeta(html,"article:section")||"",characters:body.length};
}
async function get(url){
 let current=safeURL(url);if(!current)throw Object.assign(Error("URL d'article TV+ Afrique invalide."),{status:400});
 for(let i=0;i<3;i++){
  let res;
  try{res=await fetch(current,{redirect:"manual",headers:{"accept":"text/html,application/xhtml+xml"},signal:AbortSignal.timeout(10000)})}
  catch(_){throw Object.assign(Error("Le serveur TV+ Afrique ne répond pas."),{status:502})}
  if([301,302,303,307,308].includes(res.status)){
   const next=res.headers.get("location");
   try{current=safeURL(new URL(next,current).href)}catch(_){current=null}
   if(!current)throw Object.assign(Error("Redirection externe refusée."),{status:403});
   continue;
  }
  if(!res.ok)throw Object.assign(Error("Article inaccessible : HTTP "+res.status),{status:502});
  const kind=String(res.headers.get("content-type")||"").toLowerCase();
  if(kind&&!kind.includes("text/html"))throw Object.assign(Error("Cette adresse ne contient pas de page HTML."),{status:415});
  if(Number(res.headers.get("content-length")||0)>1700000)throw Object.assign(Error("Page trop volumineuse."),{status:413});
  let html;try{html=await res.text()}catch(_){throw Object.assign(Error("Lecture de la page impossible."),{status:502})}
  if(html.length>1700000)throw Object.assign(Error("Page trop volumineuse."),{status:413});
  try{return extract(html,current)}catch(err){throw Object.assign(err,{status:422})}
 }
 throw Object.assign(Error("Trop de redirections."),{status:400});
}
module.exports=async function handler(req,res){
 if(req.method!=="GET"){res.setHeader("Allow","GET");return respond(res,405,{error:"Méthode non autorisée"})}
 if(["cross-site","same-site"].includes(req.headers["sec-fetch-site"]||""))return respond(res,403,{error:"Accès non autorisé."});
 const origin=req.headers.origin;
 if(origin){try{if(new URL(origin).host!==req.headers.host)return respond(res,403,{error:"Origine refusée"})}catch(_){return respond(res,403,{error:"Origine refusée"})}}
 const ip=String(req.headers["x-forwarded-for"]||"unknown").split(",")[0].trim();
 const now=Date.now();
 let b=counters.get(ip);if(!b||b.exp<now){b={count:0,exp:now+900000};counters.set(ip,b)}
 if(++b.count>25)return respond(res,429,{error:"Trop de lectures d'article."});
 const url=typeof req.query?.url==="string"?req.query.url:"";
 try{return respond(res,200,await get(url))}
 catch(e){return respond(res,e.status||502,{error:e.message||"Lecture impossible"})}
};