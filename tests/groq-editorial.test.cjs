'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const handler=require('../api/editorial-ai.js');
const result={title:'Un titre journalistique',text:'Texte à relire.',options:['Autre titre'],hashtags:['Gabon'],issues:[],notes:[]};
function invoke(method,body,ip='test'){
 const req={method,body,headers:{host:'studio.test',origin:'https://studio.test','content-type':'application/json','x-forwarded-for':ip}};
 const out={};const res={setHeader(){},status(n){out.status=n;return this},json(data){out.data=data;return out}};
 return Promise.resolve(handler(req,res)).then(()=>out);
}
test('Groq exclusively handles all editorial tasks and vision',async()=>{
 const previous=process.env.GROQ_API_KEY,oldFetch=global.fetch;
 process.env.GROQ_API_KEY='test-key';
 try{
  const calls=[];
  global.fetch=async (url,opts)=>{calls.push({url,opts,payload:JSON.parse(opts.body)});return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(result)}}]})}};
  const health=await invoke('GET');assert.equal(health.data.provider,'Groq');assert.equal(health.data.configured,true);
  const tasks=health.data.supported;assert.ok(tasks.length>=17);
  for(const task of tasks){
   const body={task,title:'Titre',article:'Un article de test contenant suffisamment de texte pour satisfaire les contraintes de validation du formulaire.'};
   if(task==='photo_description')body.image='data:image/png;base64,AAAA';
   const out=await invoke('POST',body,'test-'+task);
   assert.equal(out.status,200,task);assert.equal(out.data.provider,'Groq');assert.equal(out.data.task,task);
  }
  assert.equal(calls.length,tasks.length);
  for(const call of calls){
   assert.equal(call.url,'https://api.groq.com/openai/v1/chat/completions');assert.equal(call.opts.headers.Authorization,'Bearer test-key');
   assert.equal(call.payload.response_format.type,'json_object');
  }
  const vision=calls.find(x=>Array.isArray(x.payload.messages[1].content));assert.ok(vision);assert.equal(vision.payload.messages[1].content[1].type,'image_url');
  delete process.env.GROQ_API_KEY;
  const missing=await invoke('POST',{task:'correction',title:'Titre'},'missing');
  assert.equal(missing.status,503);assert.equal(calls.length,tasks.length);
 }finally{global.fetch=oldFetch;if(previous===undefined)delete process.env.GROQ_API_KEY;else process.env.GROQ_API_KEY=previous;}
});
