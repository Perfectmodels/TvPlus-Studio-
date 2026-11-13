/* TV+ Studio · Deux formats éditables : Ça alors ! / Le Sondage TV+
   Canvas vectoriel (logo officiel chargé par l'éditeur, sans texte aplati). */
(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 const modes=['caalors','sondage'];
 const defaults={
  caalors:{
   accent:'ville-forêt',
   subline:'Les arbres attendent encore leur terrain !',
   chapeau:'Le maire a réuni les acteurs horticoles pour tracer les pistes d’un verdissement durable de la capitale.',
   style:'photo'
  },
  sondage:{
   subline:'Qu’attendez-vous en priorité des opérateurs télécoms ?',
   a:'Une data moins chère',b:'Une meilleure couverture réseau',
   c:'Un débit plus rapide',d:'Un meilleur service client',
   cta:'Votez et dites-nous pourquoi en commentaire.',
   style:'bleu'
  }
 };
 const data={caalors:{...defaults.caalors},sondage:{...defaults.sondage}};
 const root=document.createElement('section');
 root.id='tvplusNewTemplateEditor';root.className='new-template-editor';root.hidden=true;
 root.innerHTML=
 '<div class="section-label"><span class="section-index">B</span><span id="newTemplateSectionLabel">Contenu du format</span></div>'+
 '<div data-format="caalors" class="template-fields">'+
 '<label>Expression à mettre en jaune dans le titre<input id="caAccent" maxlength="75" placeholder="Mots présents dans le titre"></label>'+
 '<label>Accroche / deuxième phrase<textarea id="caSubline" rows="2" maxlength="320"></textarea></label>'+
 '<label>Chapeau / contextualisation<textarea id="caChapeau" rows="3" maxlength="460"></textarea></label>'+
 '<p class="template-help">La photo, le titre, l’accroche et le chapeau restent tous modifiables. L’expression jaune doit figurer dans le titre.</p>'+
 '</div>'+
 '<div data-format="sondage" class="template-fields" hidden>'+
 '<label>Précision sous la question<textarea id="pollSubline" rows="2" maxlength="220"></textarea></label>'+
 '<div class="template-answer-grid">'+
 '<label>Réponse A<textarea id="pollA" rows="2" maxlength="110"></textarea></label>'+
 '<label>Réponse B<textarea id="pollB" rows="2" maxlength="110"></textarea></label>'+
 '<label>Réponse C<textarea id="pollC" rows="2" maxlength="110"></textarea></label>'+
 '<label>Réponse D<textarea id="pollD" rows="2" maxlength="110"></textarea></label>'+
 '</div>'+
 '<label>Appel à participation<textarea id="pollCTA" rows="2" maxlength="180"></textarea></label>'+
 '<label>Fond du sondage<select id="pollStyle"><option value="bleu">Bleu TV+ · graphique</option><option value="photo">Photographie assombrie</option></select></label>'+
 '<p class="template-help">Quatre propositions sont éditables, sans vote simulé. Pour un fond photo, utilisez « Changer la photo ».</p>'+
 '</div>'+
 '<div class="template-actions"><button type="button" id="newTemplateReset">Restaurer les textes de cet exemple</button><button type="button" id="newTemplateAI">Proposer avec OpenAI</button></div>'+
 '<p id="newTemplateAIStatus" class="template-help" role="status"></p>';
 const target=$('highlightArea');
 if(!target)return;
 target.insertAdjacentElement('beforebegin',root);
 const css=document.createElement('style');
 css.textContent=
 '.new-template-editor[hidden],.template-fields[hidden]{display:none!important}'+
 '.new-template-editor{margin:12px 0;padding:2px 0 10px;border-top:1px solid #36506c}'+
 '.template-fields{display:grid;gap:10px;min-width:0}'+
 '.template-fields label{display:grid;gap:5px;color:#cddcf0;font-size:11px;font-weight:750;min-width:0}'+
 '.template-fields input,.template-fields textarea,.template-fields select{box-sizing:border-box;width:100%;min-width:0;background:#10223a;color:#f7fbff;border:1px solid #536983;border-radius:9px;padding:10px;font:500 12px/1.45 Barlow,Arial,sans-serif;resize:vertical}'+
 '.template-fields input:focus-visible,.template-fields textarea:focus-visible{outline:2px solid #ffd057;outline-offset:1px}'+
 '.template-answer-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}'+
 '.template-help{margin:3px 0 0;color:#9eb7d1;font:400 11px/1.45 Barlow,Arial,sans-serif}'+
 '.template-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}'+
 '.template-actions button{border:1px solid #58718b;background:#19314f;border-radius:9px;color:#f2f8ff;padding:9px;font:750 11px Barlow,Arial,sans-serif;cursor:pointer}'+
 '.template-actions #newTemplateAI{background:#ffcb37;color:#142033;border-color:#ffcb37}'+
 '.mode-switch.four-modes{grid-template-columns:repeat(3,minmax(0,1fr))!important}'+
 '.mode-switch.four-modes .mode-btn{min-width:0!important;white-space:normal!important}'+
 '.canvas-shell.is-portrait{width:min(100%,min(620px,calc(100dvh * .59)))}'+
 '.canvas-shell.is-portrait canvas{aspect-ratio:4 / 5}'+
 '@media(max-width:850px){.mode-switch.four-modes{gap:4px}.mode-switch.four-modes .mode-btn{padding:8px 4px;font-size:11px;min-height:43px}.canvas-shell.is-portrait{width:min(100%,calc(100vw - 28px))}}'+
 '@media(max-width:390px){.template-answer-grid{grid-template-columns:1fr}}';
 document.head.append(css);
 const cfg={
  caalors:{accent:'caAccent',subline:'caSubline',chapeau:'caChapeau'},
  sondage:{subline:'pollSubline',a:'pollA',b:'pollB',c:'pollC',d:'pollD',cta:'pollCTA',style:'pollStyle'}
 };
 let active=null;
 function updateFields(mode){
  if(!modes.includes(mode)){root.hidden=true;active=null;return;}
  root.hidden=false;active=mode;
  for(const other of modes){const e=root.querySelector('[data-format="'+other+'"]');if(e)e.hidden=other!==mode;}
  $('newTemplateSectionLabel').textContent=mode==='caalors'?'Ça alors ! · texte et accroche':'Le Sondage TV+ · réponses';
  for(const [key,id] of Object.entries(cfg[mode]))$(id).value=data[mode][key]||'';
  // Title remains the main headline field of TV+ Studio.
  const label=$('headline')?.previousElementSibling;
  if(label)label.childNodes[0].textContent=mode==='sondage'?'Question du sondage ':'Titre principal · Ça alors ! ';
  $('photoName')?.setAttribute('title',mode==='sondage'?'Photographie facultative pour le fond du sondage':'Photographie de la rubrique Ça alors !');
 }
 for(const mode of modes){
  for(const [key,id] of Object.entries(cfg[mode])){
   $(id).addEventListener('input',()=>{
    data[mode][key]=$(id).value;
    if(state.mode===mode)draw();
   });
   $(id).addEventListener('change',()=>{
    data[mode][key]=$(id).value;
    if(state.mode===mode)draw();
   });
  }
 }
 $('newTemplateReset').addEventListener('click',()=>{
  if(!modes.includes(state.mode))return;
  data[state.mode]={...defaults[state.mode]};
  updateFields(state.mode);draw();
  $('newTemplateAIStatus').textContent='Exemple restauré. Le titre et la photo de votre affiche restent inchangés.';
 });
 const NAVY='#071b48',DARK='#061536',BLUE='#124987',YELLOW='#ffca16';
 function rect(g,x,y,w,h,color,r=0){
  g.fillStyle=color;g.beginPath();
  if(r&&typeof g.roundRect==='function')g.roundRect(x,y,w,h,r);
  else g.rect(x,y,w,h);
  g.fill();
 }
 function fitLines(g,raw,maxWidth,fontSize,min=24,maxLines=3,weight=850){
  const words=String(raw||'').replace(/\s+/g,' ').trim().split(' ').filter(Boolean);
  if(!words.length)return {lines:[''],size:fontSize};
  function layout(size){
   g.font=weight+' '+size+'px "Barlow",Arial,sans-serif';
   const lines=[];let current='';
   for(const word of words){
    const test=current?current+' '+word:word;
    if(g.measureText(test).width<=maxWidth){current=test;continue;}
    if(current){lines.push(current);current='';}
    if(g.measureText(word).width<=maxWidth){current=word;continue;}
    // Split an exceptionally long unbroken word, never trim its text silently.
    let part='';
    for(const c of word){if(part&&g.measureText(part+c).width>maxWidth){lines.push(part);part=c;}else part+=c;}
    current=part;
   }
   if(current)lines.push(current);
   return lines;
  }
  for(let size=fontSize;size>=min;size-=2){
   const lines=layout(size);if(lines.length<=maxLines)return {lines,size};
  }
  return {lines:layout(min),size:min};
 }
 function textBlock(g,raw,x,y,width,maxH,fontSize,opt={}){
  const align=opt.align||'center',color=opt.color||'#fff',weight=opt.weight||800;
  const lineHeight=opt.lineHeight||1.13,limit=opt.lines||3;
  let fitted=fitLines(g,raw,width,fontSize,opt.min||22,limit,weight);
  // Ensure the last line stays within its intended rectangle.
  let size=fitted.size,lines=fitted.lines;
  while(size>18&&lines.length*size*lineHeight>maxH){size-=2;fitted=fitLines(g,raw,width,size,18,limit,weight);lines=fitted.lines;}
  g.textAlign=align;g.textBaseline='top';g.font=weight+' '+size+'px "Barlow",Arial,sans-serif';
  g.fillStyle=color;
  const leading=size*lineHeight,visible=lines.slice(0,Math.max(1,Math.floor(maxH/leading)));
  for(let i=0;i<visible.length;i++)g.fillText(visible[i],x,y+i*leading);
  return {size,lines:visible,height:visible.length*leading};
 }
 function coloredTitle(g,raw,needle,x,y,width,maxH,fontsize){
  const title=String(raw||'').trim(),accent=String(needle||'').trim();
  const fitted=fitLines(g,title,width,fontsize,30,3,900);
  const size=Math.min(fitted.size,Math.floor(maxH/(fitted.lines.length*1.12)));
  const lines=fitLines(g,title,width,size,20,10,900).lines;
  g.font='900 '+size+'px "Barlow",Arial,sans-serif';
  g.textBaseline='top';g.textAlign='left';
  let offset=0;const lower=title.toLocaleLowerCase('fr'),p=accent?lower.indexOf(accent.toLocaleLowerCase('fr')):-1;
  const accentStart=p,accentEnd=p+accent.length;
  // Map logical text positions to painted character advances on each line.
  for(let j=0;j<lines.length;j++){
   const line=lines[j],w=g.measureText(line).width;
   let cursor=0;
   const start=title.indexOf(line,offset);offset=Math.max(offset,start+line.length);
   let xx=x-w/2;
   for(let i=0;i<line.length;i++){
    const ch=line[i],at=start+i;
    g.fillStyle=p>=0&&at>=accentStart&&at<accentEnd?YELLOW:'#fff';
    g.fillText(ch,xx,y+j*size*1.12);
    xx+=g.measureText(ch).width;
    cursor++;
   }
  }
  return {size,height:lines.length*size*1.12};
 }
 function logo(g,x,y,w,h){
  if(!state.logo)return;
  const im=state.logo,r=Math.min(w/im.width,h/im.height);
  const iw=im.width*r,ih=im.height*r;g.drawImage(im,x+(w-iw)/2,y+(h-ih)/2,iw,ih);
 }
 function drawPhoto(g,W,H,mode){
  const grad=g.createLinearGradient(0,0,0,H);
  if(mode==='caalors'){grad.addColorStop(0,'#16628a');grad.addColorStop(.45,'#164d65');grad.addColorStop(1,'#061536');}
  else{grad.addColorStop(0,'#10518d');grad.addColorStop(.5,'#0d3c76');grad.addColorStop(1,'#061d54');}
  rect(g,0,0,W,H,grad);
  const settings=data[mode]||{};
  const useImage=!!state.image&&!state.sample&&(mode==='caalors'||settings.style==='photo');
  if(useImage){
   const img=state.image,scale=Math.max(W/img.width,H/img.height)*Math.max(1,state.zoom/100);
   const iw=img.width*scale,ih=img.height*scale;
   const dx=Math.max(-(iw-W)/2,Math.min((iw-W)/2,Number(state.dx)||0));
   const dy=Math.max(-(ih-H)/2,Math.min((ih-H)/2,Number(state.dy)||0));
   g.drawImage(img,(W-iw)/2+dx,(H-ih)/2+dy,iw,ih);
  }
  const veil=g.createLinearGradient(0,0,0,H);
  if(mode==='caalors'){
   veil.addColorStop(0,'rgba(2,16,39,.03)');
   veil.addColorStop(.35,'rgba(2,15,37,.12)');
   veil.addColorStop(.55,'rgba(3,14,42,.72)');
   veil.addColorStop(.77,'rgba(4,16,45,.96)');
   veil.addColorStop(1,'#061536');
  }else{
   veil.addColorStop(0,'rgba(7,28,77,.40)');
   veil.addColorStop(.7,'rgba(5,30,87,.78)');
   veil.addColorStop(1,'rgba(4,20,61,.98)');
  }
  rect(g,0,0,W,H,veil);
  if(mode==='sondage'&&!useImage){
   // Decorative radio/antenna traces, generated vectorially, not a false photograph.
   g.save();g.strokeStyle='rgba(176,211,247,.095)';g.lineWidth=3;
   for(let i=0;i<8;i++){
    g.beginPath();g.moveTo(30+i*155,430);g.lineTo(600,1150);g.lineTo(1180-i*110,430);g.stroke();
   }
   g.beginPath();g.ellipse(920,165,360,120,-.25,0,Math.PI*2);g.stroke();
   g.beginPath();g.ellipse(920,165,310,94,-.25,0,Math.PI*2);g.stroke();
   g.restore();
  }
 }
 function footer(g,W,H){
  const base=H-94;
  g.save();
  g.strokeStyle='rgba(255,255,255,.78)';g.lineWidth=2;
  g.beginPath();g.moveTo(95,base+12);g.lineTo(360,base+12);g.moveTo(W-360,base+12);g.lineTo(W-95,base+12);g.stroke();
  const icons=['instagram','facebook','x'],size=38,dx=66,left=(W-(3*size+2*dx))/2;
  g.fillStyle='#fff';
  icons.forEach((name,i)=>{
   g.save();g.translate(left+i*(size+dx),base-32);
   const path=typeof socialBrandShapes!=='undefined'?socialBrandShapes?.[name]:null;
   if(path){g.scale(size/24,size/24);g.fill(path)}
   else{g.font='900 35px Arial';g.textAlign='center';g.fillText(name==='instagram'?'◎':name==='facebook'?'f':'X',size/2,size/2)}
   g.restore();
  });
  g.font='450 29px "Barlow",Arial,sans-serif';g.fillStyle='#fff';g.textAlign='center';g.fillText('tvplusafrique.com',W/2,H-17);
  g.restore();
 }
 function drawCa(g){
  const W=1200,H=1200,d=data.caalors;
  drawPhoto(g,W,H,'caalors');
  logo(g,945,42,204,218);
  // Bright hand-lettered-style editorial badge, compact enough to leave photo visible.
  g.save();g.translate(112,435);g.rotate(-.055);
  g.shadowColor='rgba(0,0,0,.45)';g.shadowBlur=15;
  g.fillStyle='#e1a700';g.font='italic 900 110px "Barlow",Arial,sans-serif';
  g.fillText('Ça',0,0);g.fillText('alors !',-10,102);g.restore();
  g.save();g.strokeStyle=YELLOW;g.lineWidth=6;g.beginPath();g.moveTo(113,556);g.quadraticCurveTo(230,522,375,537);g.stroke();g.restore();
  const title=state.headline||'Votre titre principal ici';
  const titleInfo=coloredTitle(g,title,d.accent,600,624,1080,146,60);
  textBlock(g,d.subline,600,785,1090,111,45,{weight:900,lines:2,min:26});
  g.save();g.strokeStyle='rgba(255,199,24,.8)';g.lineWidth=2;g.beginPath();g.moveTo(70,905);g.lineTo(1130,905);g.stroke();g.restore();
  textBlock(g,d.chapeau,600,932,1070,108,30,{weight:600,color:'#f3c156',lines:3,min:19,lineHeight:1.1});
  footer(g,W,H);
  return {size:titleInfo.size};
 }
 function bubble(g,x,y,w,h,fill,corner=25){
  g.save();rect(g,x,y,w,h,fill,corner);
  g.beginPath();g.moveTo(x+w*.77,y+h-3);g.lineTo(x+w*.7,y+h+25);g.lineTo(x+w*.69,y+h-3);g.fill();g.restore();
 }
 function answer(g,letter,value,x,y,index){
  const W=510,H=125;
  rect(g,x,y,W,H,'#f9fbff',24);
  g.save();g.beginPath();g.arc(x+68,y+H/2,44,0,Math.PI*2);
  g.fillStyle=index===0||index===3?'#071969':YELLOW;g.fill();
  g.fillStyle=index===0||index===3?'#fff':DARK;
  g.textBaseline='middle';g.textAlign='center';g.font='900 58px "Barlow",Arial,sans-serif';
  g.fillText(letter,x+68,y+H/2+2);g.restore();
  const tmp=fitLines(g,value,345,40,24,3,850);
  const lineH=tmp.size*1.14;
  textBlock(g,value,x+150,y+(H-tmp.lines.length*lineH)/2,338,106,Math.min(40,tmp.size),{align:'left',color:'#0c235b',weight:850,lines:3,min:24,lineHeight:1.14});
 }
 function drawPoll(g){
  const W=1200,H=1500,d=data.sondage;
  drawPhoto(g,W,H,'sondage');
  logo(g,460,30,280,260);
  // Main "Le Sondage TV+" identity built as separate editable vector layers.
  bubble(g,135,326,215,150,YELLOW,23);
  rect(g,328,345,747,127,'#ffffff',24);
  rect(g,442,476,326,100,YELLOW,22);
  g.font='900 93px "Barlow",Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';
  g.fillStyle=NAVY;g.fillText('LE',245,406);
  g.font='900 104px "Barlow Semi Condensed","Barlow",Arial,sans-serif';
  g.fillText('SONDAGE',703,407);
  g.font='900 82px "Barlow",Arial,sans-serif';g.fillText('TV+',605,527);
  g.strokeStyle=YELLOW;g.lineWidth=6;g.beginPath();g.moveTo(405,592);g.quadraticCurveTo(600,610,795,592);g.stroke();
  const headline=state.headline||'Votre question ici';
  const h=textBlock(g,headline,600,630,1070,150,65,{weight:900,lines:3,min:34,lineHeight:1.04});
  rect(g,452,800,296,7,YELLOW,5);
  textBlock(g,d.subline,600,830,1070,96,35,{weight:700,lines:2,min:25,color:'#fff'});
  answer(g,'A',d.a,60,946,0);answer(g,'B',d.b,630,946,1);
  answer(g,'C',d.c,60,1090,2);answer(g,'D',d.d,630,1090,3);
  rect(g,128,1244,944,112,YELLOW,54);
  textBlock(g,d.cta,600,1266,815,74,37,{color:DARK,weight:900,lines:2,min:24,lineHeight:1.06});
  footer(g,W,H);
  return {size:h.size};
 }
 function drawMode(mode,{ctx:canvasCtx}){
  const g=canvasCtx;return mode==='caalors'?drawCa(g):drawPoll(g);
 }
 function snapshot(mode=state.mode){return modes.includes(mode)?{...data[mode]}:null;}
 function restore(mode,extra){
  if(!modes.includes(mode)||!extra||typeof extra!=='object')return;
  for(const key of Object.keys(defaults[mode])){
   const value=extra[key];
   if(typeof value==='string')data[mode][key]=value.slice(0,500);
  }
  if(state.mode===mode){updateFields(mode);draw();}
 }
 async function suggestAI(){
  const mode=state.mode;if(!modes.includes(mode))return;
  const button=$('newTemplateAI'),info=$('newTemplateAIStatus');button.disabled=true;
  info.textContent='Génération des propositions…';
  try{
   const d=data[mode],task=mode==='sondage'?'sondage':'ca_alors';
   const article=mode==='sondage'?String(d.subline||'')+' | Réponses : '+[d.a,d.b,d.c,d.d].join('; '):[d.subline,d.chapeau].join('\n');
   const resp=await fetch('/api/editorial-ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
     task,title:state.headline,article:article.slice(0,8000),format:mode,tone:'journalistique',language:'fr'
   }),cache:'no-store'});
   const out=await resp.json().catch(()=>({}));if(!resp.ok)throw Error(out.error||'Service OpenAI indisponible.');
   const result=out.result;
   if(result.title){state.headline=result.title;$('headline').value=result.title;$('headline').dispatchEvent(new Event('input',{bubbles:true}));}
   if(mode==='sondage'){
    const values=(result.options||[]).filter(Boolean).slice(0,4);
    if(values.length===4){[d.a,d.b,d.c,d.d]=values;updateFields(mode);}
   }else if(result.text){d.chapeau=result.text.slice(0,460);updateFields(mode);}
   draw();info.textContent='Propositions appliquées comme brouillon. Vérifiez les faits et les réponses avant export.';
  }catch(e){info.textContent='Suggestion indisponible : '+(e.message||String(e));}
  finally{button.disabled=false;}
 }
 $('newTemplateAI').addEventListener('click',suggestAI);
 window.TVPlusExtraTemplates={draw:drawMode,activate:updateFields,snapshot,restore,reset(mode){
  if(!modes.includes(mode))return;
  data[mode]={...defaults[mode]};updateFields(mode);
 },formats:modes};
 updateFields(state.mode);
})();