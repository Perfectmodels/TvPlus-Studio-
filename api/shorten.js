// TV+ Studio — Rebrandly serverless proxy.
// Only REBRANDLY_API_KEY must be configured in Vercel. No credential is shipped to the browser.
// The shortener is limited to first-party TV+ article URLs and protects the API key.
// No authentication is implemented: deploy on a trusted network or add identity-based auth before broad public access.

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
  return send(res,200,{configured:Boolean(process.env.REBRANDLY_API_KEY),domain:DOMAIN});
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
 if(!process.env.REBRANDLY_API_KEY){
  return send(res,503,{error:"La clé Rebrandly doit être ajoutée aux variables d’environnement Vercel."});
 }
 // Cross-site scripts cannot create links. This is an abuse-reduction measure,
 // not a substitute for private access or authenticated editors.
 const fetchSite=String(req.headers['sec-fetch-site']||'');
 if(fetchSite && fetchSite!=='same-origin')return send(res,403,{error:'Requête non autorisée'});
 if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json')){
  return send(res,415,{error:'Contenu JSON requis'});
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
 try{
  const id=await domainId();
  const payload={destination:dest,domainId:id,title:title||'TV+ Afrique'};
  const result=await callRebrandly('/links',payload);
  const rawShort=String(result?.shortUrl||'').replace(/^https?:\/\//i,'');
  if(!rawShort.startsWith(DOMAIN+'/')){
    return send(res,502,{error:"Rebrandly n’a pas retourné un lien sur le domaine TV+ configuré."});
  }
  return send(res,200,{shortUrl:'https://'+rawShort,destination:dest});
 }catch(error){
  // Never return the user's API key, provider request headers, or upstream raw payload.
  if(error?.code===404)return send(res,502,{error:"Le domaine court TV+ n’a pas été trouvé dans votre compte Rebrandly. Vérifiez son association."});
  if(error?.code===401||error?.code===403)return send(res,502,{error:"Rebrandly refuse la clé ou l’accès au domaine. Vérifiez les autorisations du compte."});
  if(error?.code===429)return send(res,429,{error:'Quota Rebrandly atteint.'});
  if(error?.code===400)return send(res,422,{error:'Rebrandly a refusé ce lien. Vérifiez sa destination.'});
  return send(res,502,{error:"Impossible de contacter Rebrandly pour le moment."});
 }
};
