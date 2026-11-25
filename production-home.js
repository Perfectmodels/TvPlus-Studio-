(async()=>{
  const P=Productions, $=id=>document.getElementById(id);
  const make=(tag,text)=>Object.assign(document.createElement(tag),{textContent:text});
  const routes=(id,view)=>'index.html?production='+id+(view?'&vue='+view:'');
  const videos=format=>['no','reportage'].includes(format);
  const assets=await P.list('assets');
  function create(format='alerte',asset=''){
    $('format').value=format;$('source').value=asset;$('create').showModal();$('subject').focus();
  }
  function card(parent,title,description){
    const el=document.createElement('article');el.append(make('h2',title),make('p',description));parent.append(el);return el;
  }
  function link(el,label,href){const a=make('a',label);a.href=href;el.append(a);return a;}
  function preview(el,asset){
    if(!asset)return;
    const media=document.createElement(asset.file.type.startsWith('video/')?'video':'img');
    media.src=URL.createObjectURL(asset.file);media.alt='';media.preload='metadata';el.prepend(media);
  }
  for(const [format,label] of Object.entries(P.formats)){
    $('format').add(new Option(label,format));
    const el=card($('modelCards'),label,videos(format)?'Montage vertical et légende':'Affiche, vidéo animée et légende');
    const image=new Image();image.src='modeles/'+format+'.webp';image.alt='Aperçu du modèle '+label;image.loading='lazy';el.prepend(image);
    const use=make('button','Utiliser ce modèle');use.onclick=()=>create(format);el.append(use);
  }
  function addAsset(asset){
    $('source').add(new Option(asset.name,asset.id));
    const el=card($('assets'),asset.name,asset.file.type.startsWith('video/')?'Vidéo':'Image');preview(el,asset);
    const use=make('button','Créer une production');use.onclick=()=>create(asset.file.type.startsWith('video/')?'reportage':'alerte',asset.id);el.append(use);
  }
  assets.forEach(addAsset);
  $('upload').onchange=async e=>{try{for(const file of e.target.files){const id=await P.asset(file);addAsset({id,name:file.name,file});}}catch(err){P.report(err);}finally{e.target.value='';}};
  const projects=(await P.list('projects')).sort((a,b)=>b.updated-a.updated);
  if(!projects.length)$('cards').append(make('p','Créez votre première production pour retrouver ici ses créations.'));
  for(const row of projects){
    const el=card($('cards'),row.subject,P.formats[row.format]+' · '+new Date(row.updated).toLocaleString('fr-FR'));
    const image=assets.find(a=>a.id===row.assetId||a.id===row.videoAsset);
    if(image)preview(el,image);else {const thumbnail=new Image();thumbnail.src='modeles/'+row.format+'.webp';thumbnail.alt='Modèle '+P.formats[row.format];el.prepend(thumbnail);}
    if(row.captionStatus)el.append(make('p','Légende · '+row.captionStatus));
    link(el,'Reprendre',routes(row.id,row.view));
    for(const [kind,label] of [['poster','Affiche'],['video','Vidéo']]){
      if(!row[kind+'Status'])continue;
      const status=make('p',label+' · '+row[kind+'Status']);el.append(status);
      if(row[kind+'Status']!=='Publié'){
        const done=make('button','Confirmer la publication');done.onclick=async()=>{try{await P.patch(row.id,{[kind+'Status']:'Publié'});status.textContent=label+' · Publié';done.remove();}catch(err){P.report(err);}};el.append(done);
      }
      const download=make('button',label+' · Télécharger');download.onclick=async()=>{try{const out=await P.get('exports',row.id+'-'+kind);const a=document.createElement('a');a.href=URL.createObjectURL(out.blob);a.download=out.name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),10000);}catch(err){P.report(err);}};el.append(download);
    }
  }
  function view(name){for(const b of document.querySelectorAll('[data-view]')){const on=b.dataset.view===name;$(b.dataset.view).hidden=!on;b.setAttribute('aria-current',on?'page':'false');}}
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));view('projects');
  $('newProject').onclick=()=>create();$('cancel').onclick=()=>$('create').close();
  $('create').querySelector('form').onsubmit=async e=>{e.preventDefault();const subject=$('subject').value.trim();if(!subject){$('subject').focus();return;}
    const submit=e.submitter;submit.disabled=true;
    try{const format=$('format').value,id=crypto.randomUUID(),assetId=$('source').value;
      const media=assetId&&await P.get('assets',assetId);
      const view=videos(format)||media?.file?.type.startsWith('video/')?'video':'poster';
      await P.put('projects',{id,subject,format,assetId,view,updated:Date.now()});location.href=routes(id,view);
    }catch(err){P.report(err);submit.disabled=false;}
  };
})().catch(Productions.report);
