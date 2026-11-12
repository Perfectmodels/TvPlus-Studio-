'use strict';
// OpenAI photo enhancement, explicitly requested by the journalist.
// Never send an image to OpenAI until the user clicks the action.
const send=(res,n,data)=>{res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');return res.status(n).json(data)};
const MODE={
 naturel:'Corrige légèrement exposition, balance des blancs, contraste, teintes et bruit. Rendu naturel et réaliste, sans embellissement excessif.',
 nuit:'Améliore la luminosité et lisibilité des zones sombres, réduis le bruit sans créer de faux détails.',
 reportage:'Optimise pour une photo de reportage: netteté raisonnable, contrastes équilibrés, couleurs réalistes. Aucune modification du contexte.',
 portrait:'Optimise délicatement le portrait: rendu naturel de la peau et des textures, sans changer les traits, l’âge ou les caractéristiques.',
 nettete:'Améliore la précision visuelle des détails déjà visibles et diminue les artefacts, sans inventer de nouveaux détails.'
};
const bucket=new Map();
function allowed(req){
 const ip=String(req.headers['x-forwarded-for']||req.headers['x-real-ip']||'unknown').split(',')[0].trim().slice(0,100);
 const now=Date.now();if(bucket.size>500)for(const [k,v] of bucket)if(v.until<=now)bucket.delete(k);
 let b=bucket.get(ip);if(!b||b.until<=now){b={until:now+3600000,count:0};bucket.set(ip,b)}
 return ++b.count<=3; // Per instance. Configure Vercel WAF for persistent protection.
}
module.exports=async function handler(req,res){
 if(req.method==='GET')return send(res,200,{configured:Boolean(process.env.OPENAI_API_KEY),supported:Object.keys(MODE),model:process.env.OPENAI_IMAGE_MODEL||'gpt-image-2'});
 if(req.method!=='POST'){res.setHeader('Allow','GET, POST');return send(res,405,{error:'Méthode non autorisée.'})}
 let same=false;
 try{const u=new URL(String(req.headers.origin||''));same=u.host===req.headers.host&&(u.protocol==='https:'||(u.protocol==='http:'&&['localhost','127.0.0.1'].includes(u.hostname)))}catch(_){}
 if(!same||['same-site','cross-site'].includes(String(req.headers['sec-fetch-site']||'')))return send(res,403,{error:'Origine non autorisée.'});
 if(!String(req.headers['content-type']||'').startsWith('application/json'))return send(res,415,{error:'JSON nécessaire.'});
 if(!process.env.OPENAI_API_KEY)return send(res,503,{error:'OPENAI_API_KEY absente sur ce déploiement.'});
 let raw=req.body;try{if(typeof raw==='string')raw=JSON.parse(raw)}catch(_){return send(res,400,{error:'JSON invalide.'})}
 const {image,mode,instructions}=raw||{};
 if(!Object.hasOwn(MODE,mode)||typeof image!=='string'||image.length>2400000||!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(image)||instructions!==undefined&&(typeof instructions!=='string'||instructions.length>280))return send(res,400,{error:'Image, mode ou consigne non valide (photo 1,6 Mo max).'});
 const [,mime,base64]=/^data:(image\/(?:jpeg|png|webp));base64,(.*)$/.exec(image)||[];
 const bytes=Buffer.from(base64||'','base64');
 if(!bytes.length||bytes.length>1650000)return send(res,413,{error:'Image trop volumineuse.'});
 if(!allowed(req))return send(res,429,{error:'Limite de 3 améliorations IA par heure atteinte. Les traitements locaux restent disponibles.'});
 const prompt=[
  'Tu es un retoucheur photo pour une rédaction de presse. Améliore la photographie source sans la réinventer.',
  MODE[mode],
  'Garde la composition, le cadrage, toutes les personnes, les vêtements, les inscriptions, le nombre d’objets, les lieux et les événements identiques.',
  'Ne modifie pas les visages, l’identité, le corps, les logos ou les faits journalistiques. Ne supprime ni n’ajoute aucun élément.',
  'Ne transforme pas la photo en illustration, ne dessine pas de texte, n’ajoute pas de filigrane.',
  instructions?'Précisions rédactionnelles (uniquement sur les corrections visuelles): '+instructions:''
 ].filter(Boolean).join('\n');
 const form=new FormData();
 form.append('model',process.env.OPENAI_IMAGE_MODEL||'gpt-image-2');
 form.append('image',new Blob([bytes],{type:mime}),'tvplus-source.'+(mime==='image/jpeg'?'jpg':mime==='image/png'?'png':'webp'));
 form.append('prompt',prompt);
 form.append('quality','medium');
 form.append('size','auto');
 form.append('output_format','jpeg');
 form.append('output_compression','83');
 let api;
 try{api=await fetch('https://api.openai.com/v1/images/edits',{method:'POST',headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY},body:form,signal:AbortSignal.timeout(115000)})}
 catch(_){return send(res,504,{error:'Le traitement de la photo a dépassé le délai ou OpenAI est indisponible.'})}
 if(!api.ok){
  if(api.status===429)return send(res,429,{error:'Quota OpenAI indisponible ou facturation limitée.'});
  if([401,403].includes(api.status))return send(res,502,{error:'OpenAI refuse la clé ou le modèle image.'});
  if(api.status===400)return send(res,422,{error:'OpenAI ne peut pas traiter cette image. Essayez une autre photo.'});
  return send(res,502,{error:'Échec de la retouche OpenAI ('+api.status+').'});
 }
 let json;try{json=await api.json()}catch(_){return send(res,502,{error:'Réponse image illisible.'})}
 const result=json?.data?.[0]?.b64_json;
 if(typeof result!=='string'||!result.length)return send(res,502,{error:'Aucune image améliorée dans la réponse.'});
 return send(res,200,{image:'data:image/jpeg;base64,'+result,mode,model:process.env.OPENAI_IMAGE_MODEL||'gpt-image-2',notice:'Image générée à partir de la source; vérifier son exactitude avant publication.'});
};