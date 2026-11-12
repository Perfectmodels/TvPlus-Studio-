// TV+ Studio — Rebrandly serverless proxy.
// Secrets must be configured in Vercel: REBRANDLY_API_KEY and TVPLUS_SHORTENER_ACCESS_CODE.
// No credential is ever shipped to the browser or committed to GitHub.
const { timingSafeEqual } = require('node:crypto');

const DOMAIN = 'l.tvplusafrique.com';
const API = 'https://api.rebrandly.com/v1';
let cache = { id: null, until: 0 };
const buckets = new Map(); // Defense-in-depth; ephemeral across serverless instances.

const send = (res, status, body) => {
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options','nosniff');
  return res.status(status).json(body);
};
function equal(a,b){
  if(typeof a!=='string'||typeof b!=='string'||!a||!b)return false;
  const aa=Buffer.from(a,'utf8'),bb=Buffer.from(b,'utf8');
  return aa.length===bb.length && timingSafeEqual(aa,bb);
}
function validDestination(raw){
 if(typeof raw!=='string'||raw.length>2048)return null;
 try{
  const url=new URL(raw.trim());
  if(url.protocol!=='https:'||url.username||url.password||url.port)return null;
  const host=url.hostname.toLowerCase();
  // Link shortening is reserved for TV+ Afrique editorial pages; no open public shortener.
  if(host!=='tvplusafrique.com' && !host.endsWith('.tvplusafrique.com'))return null;
  if(host===DOMAIN)return null;
  if(url.pathname.length>1600)return null;
  return url.href;
 }catch(_){return null;}
}
async function callRebrandly(endpoint,params){
 const headers={'apikey':process.env.REBRANDLY_API_KEY,'Accept':'application/json'};
 if(process.env.REBRANDLY_WORKSPACE_ID)headers.Workspace=process.env.REBRANDLY_WORKSPACE_ID;
 if(params)headers['Content-Type']='application/json';
 const response=await fetch(API+endpoint,{
  method:params?'POST':'GET',headers,
  body:params?JSON.stringify(params):undefined,
  signal:AbortSignal.timeout(12000)
 });
 let value;try{value=await response.json();}catch(_){value=null;}
 if(!response.ok){
  const e=new Error('La plateforme de liens a refusé la demande');
  e.code=response.status;e.details=value;
  throw e;
 }
 return value;
}
async function domainId(){
 if(cache.id && cache.until>Date.now())return cache.id;
 const list=await callRebrandly('/domains?limit=25');
 const arr=Array.isArray(list)?list:Array.isArray(list?.domains)?list.domains:[];
 const match=arr.find(d=>String(d.fullName||d.domainName||'').toLowerCase()===DOMAIN);
 if(!match?.id){const e=new Error('Domaine TV+ introuvable dans cet espace Rebrandly');e.code=404;throw e;}
 cache={id:match.id,until:Date.now()+30*60*1000};
 return match.id;
}
module.exports=async function handler(req,res){
 if(req.method==='GET'){
  return send(res,200,{configured:Boolean(process.env.REBRANDLY_API_KEY&&process.env.TVPLUS_SHORTENER_ACCESS_CODE),domain:DOMAIN});
 }
 if(req.method!=='POST'){
  res.setHeader('Allow','GET, POST');
  return send(res,405,{error:'Méthode non autorisée'});
 }
 const origin=req.headers.origin;
 if(!origin || !req.headers.host){
  return send(res,403,{error:'Requête non autorisée'});
 }
 try{
  if(new URL(origin).host!==req.headers.host)return send(res,403,{error:'Requête non autorisée'});
 }catch(_){return send(res,403,{error:'Requête non autorisée'});}
 if(!process.env.REBRANDLY_API_KEY || !process.env.TVPLUS_SHORTENER_ACCESS_CODE){
  return send(res,503,{error:"Le raccourcisseur n’est pas encore activé dans Vercel."});
 }
 if(!equal(req.headers['x-tvplus-access'],process.env.TVPLUS_SHORTENER_ACCESS_CODE)){
  return send(res,401,{error:"Code d’accès incorrect."});
 }
 const ip=String(req.headers['x-forwarded-for']||'').split(',')[0].trim().slice(0,100);
 const now=Date.now(),rateKey=ip||'anonymous';
 if(buckets.size>1000){for(const [k,b] of buckets)if(b.until<now)buckets.delete(k);}
 let b=buckets.get(rateKey);
 if(!b||b.until<now){b={used:0,until:now+15*60*1000};buckets.set(rateKey,b);}
 if(++b.used>10)return send(res,429,{error:'Limite temporaire atteinte. Réessayez plus tard.'});
 const raw=typeof req.body==='string'?(()=>{try{return JSON.parse(req.body)}catch(_){return null}})():req.body;
 if(!raw||typeof raw!=='object')return send(res,400,{error:'Données invalides'});
 const dest=validDestination(raw.destination);
 if(!dest)return send(res,400,{error:'Le lien doit être une URL HTTPS du site tvplusafrique.com.'});
 const title=String(raw.title||'TV+ Afrique — article').trim().slice(0,255);
 const slug=raw.slashtag===undefined?'':String(raw.slashtag).trim();
 if(slug && !/^[a-zA-Z0-9_-]{1,40}$/.test(slug))return send(res,400,{error:'Le nom du lien doit contenir 1 à 40 lettres, chiffres, tirets ou soulignements.'});
 try{
  const id=await domainId();
  const payload={destination:dest,domainId:id,title:title||'TV+ Afrique'};
  if(slug)payload.slashtag=slug;
  const result=await callRebrandly('/links',payload);
  const rawShort=String(result?.shortUrl||'').replace(/^https?:\/\//i,'');
  if(!rawShort.startsWith(DOMAIN+'/')){
    return send(res,502,{error:"Rebrandly n’a pas retourné un lien sur le domaine TV+ configuré."});
  }
  return send(res,200,{shortUrl:'https://'+rawShort,destination:dest});
 }catch(error){
  // Never return the user's API key, provider request headers, or upstream raw payload.
  if(error?.code===404)return send(res,502,{error:"Le domaine court TV+ n’a pas été trouvé dans l’espace Rebrandly. Vérifiez son association ou le workspace."});
  if(error?.code===401||error?.code===403)return send(res,502,{error:"Rebrandly refuse la clé ou l’accès au domaine. Vérifiez les autorisations du compte."});
  if(error?.code===429)return send(res,429,{error:'Quota Rebrandly atteint.'});
  if(error?.code===400)return send(res,422,{error:'Rebrandly a refusé ce lien. Vérifiez sa destination ou son nom personnalisé.'});
  return send(res,502,{error:"Impossible de contacter Rebrandly pour le moment."});
 }
};
