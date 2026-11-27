(async()=>{
  const P=Productions, $=id=>document.getElementById(id);
  const make=(tag,text)=>Object.assign(document.createElement(tag),{textContent:text});
  const routes=(id,view)=>'index.html?production='+id+(view?'&vue='+view:'');
  const videos=format=>['no','reportage'].includes(format);
  const assets=await P.list('assets');
  let selectedAsset=null,opening=false;
  async function start(format){
    if(opening)return;
    opening=true;
    try{
      const id=crypto.randomUUID();
      const view=videos(format)||selectedAsset?.file.type.startsWith('video/')?'video':'poster';
      await P.put('projects',{id,subject:'',autoTitle:true,format,assetId:selectedAsset?.id||'',view,updated:Date.now()});
      location.href=routes(id,view);
    }catch(error){opening=false;P.report(error);}
  }
  window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
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
    const use=make('button',label);
    const image=new Image();image.src='modeles/'+format+'.webp';image.alt='';use.prepend(image);
    use.onclick=()=>start(format);$('modelCards').append(use);
  }
  function addAsset(asset){
    const el=card($('assets'),asset.name,asset.file.type.startsWith('video/')?'Vidéo':'Image');preview(el,asset);
    const use=make('button','Utiliser ce média');use.onclick=()=>{selectedAsset=asset;$('selection').hidden=false;$('selection').querySelector('span').textContent=asset.name;$('modelCards').querySelector('button').focus();$('models').scrollIntoView();};el.append(use);
  }
  assets.forEach(addAsset);
  $('upload').onchange=async e=>{try{for(const file of e.target.files){const id=await P.asset(file);addAsset({id,name:file.name,file});}}catch(err){P.report(err);}finally{e.target.value='';}};
  const projects=(await P.list('projects')).sort((a,b)=>b.updated-a.updated);
  if(!projects.length)$('cards').append(make('p','Créez votre première production pour retrouver ici ses créations.'));
  for(const row of projects){
    const el=card($('cards'),row.subject||'Sans titre',P.formats[row.format]+' · '+new Date(row.updated).toLocaleString('fr-FR'));
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
  $('clearAsset').onclick=()=>{selectedAsset=null;$('selection').hidden=true;};
})().catch(Productions.report);
