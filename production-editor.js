document.addEventListener('studio-drafts-ready', async event => {
  const P=Productions, $=id=>document.getElementById(id);
  if(!P.id)return;
  try{
    const project=await P.get('projects',P.id);
    if(!project){location.replace('productions.html');return;}
    const videoOnly=['reportage','no'].includes(project.format);
    const patch=async changes=>{Object.assign(project,changes);await P.patch(P.id,changes);};
    const input=(id,value)=>{
      const el=$(id);if(!el)return;el.value=value;
      el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));
    };
    if(!event.detail.restored){
      if(!videoOnly)$(project.format+'Btn')?.click();
      input('headline',project.subject);
      if(!localStorage.getItem(P.key('tvplus:caption-settings-v1')))input('studioCaptionType',project.format==='alerte'?'alerte':videoOnly?'reportage':'lire');
      const asset=project.assetId && await P.get('assets',project.assetId);
      if(asset?.file?.type.startsWith('image/')){
        const url=URL.createObjectURL(asset.file);
        try{state.image=await loadImage(url);state.sample=false;draw();}finally{URL.revokeObjectURL(url);}
      }
      await TVPlusEditorial.save();
    }
    const editor=document.querySelector('.format-navbar');
    const bar=document.createElement('section');bar.className='production-bar';
    bar.innerHTML='<a href="productions.html">Mes productions</a><strong></strong><button data-action="subject">Sujet</button><button data-action="poster">Affiche</button><button data-action="video">Vidéo</button><button data-action="caption">Légende</button><button data-action="jpg">Exporter JPG</button>';
    editor.before(bar);document.body.classList.add('production-active');
    const style=document.createElement('style');style.textContent='.production-active .format-navbar,.production-active .header-right,.production-active .flow-intro,.production-active [data-flow=drafts],.production-active [data-flow=poster].flow-desktop-btn{display:none!important}.production-bar{display:flex;align-items:center;flex-wrap:wrap;gap:8px;padding:12px clamp(12px,3vw,48px);background:#132139;color:white}.production-bar strong{flex:1;min-width:100px;overflow-wrap:anywhere}.production-bar a{color:#ffcf4a}.production-bar button{background:#233751;color:white;border:1px solid #60738a;border-radius:8px;padding:8px 12px}.production-active .flow-desktop-nav{position:static}.production-active.video-only .workspace,.production-active.video-only .flow-desktop-nav,.production-active.video-only .mobile-dock{display:none!important}.production-active.video-only:has(#studioEditorialDialog[open]) .workspace{display:grid!important}';
    document.head.append(style);
    if(videoOnly){document.body.classList.add('video-only');bar.querySelector('[data-action=poster]').hidden=true;bar.querySelector('[data-action=jpg]').hidden=true;}
    if(!videoOnly)installPosterInspector();
    const heading=bar.querySelector('strong');
    function markView(view){for(const b of bar.querySelectorAll('[data-action]'))if(['poster','video','caption'].includes(b.dataset.action))b.setAttribute('aria-pressed',String(b.dataset.action===view));}
    function title(){heading.textContent=project.subject+' · '+P.formats[project.format];document.title=project.subject+' · TV+ Studio';}
    title();
    const dlg=$('videoStudio');let initialized=false, opening=false,writeTimer;
    const saveVideo=()=>initialized?patch({video:ProductionVideo.snapshot()}):Promise.resolve();
    function queueVideo(){if(!initialized)return;clearTimeout(writeTimer);writeTimer=setTimeout(()=>saveVideo().catch(P.report),180);}
    for(const ev of ['input','change','pointerup','click'])dlg.addEventListener(ev,queueVideo);
    dlg.addEventListener('close',()=>{clearTimeout(writeTimer);saveVideo().catch(P.report);markView(videoOnly?'':'poster');});
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&initialized)saveVideo().catch(P.report);});
    async function openVideo(){
      if(opening||dlg.open)return;
      opening=true;
      try{
        if(!initialized){
          await mediaWrites;
          const assetId=project.videoAsset||project.assetId;
          const asset=assetId&&await P.get('assets',assetId);
          const fields={vsMode:project.format,vsTitle:project.videoTitle??state.headline,vsAuthor:$('speaker').value,vsRole:$('role').value,vsDetail:$('details').value,vsCategory:'__custom',vsCustomCategory:state.category,vsOptions:['pollA','pollB','pollC','pollD'].map(id=>$(id)?.value||'').join('\n')};
          ProductionVideo.restore(project.video||{fields},asset?.file);
          if(project.videoLogo){const logo=await P.get('assets',project.videoLogo);if(logo)ProductionVideo.setLogo(logo.file);}
          if(asset && !project.videoAsset)await patch({videoAsset:asset.id});
          initialized=true;
        }
        $('vsMode').closest('label').hidden=true;ProductionVideo.open();markView('video');await patch({view:'video'});
      }finally{opening=false;}
    }
    document.addEventListener('studio-open-video',()=>openVideo().catch(P.report));
    let mediaWrites=Promise.resolve();
    function rememberFile(event){
      const file=event.target.files?.[0];if(!file)return;
      const key={photoInput:'assetId',vsFile:'videoAsset',vsLogoFile:'videoLogo'}[event.target.id];
      if(!key)return;
      mediaWrites=mediaWrites.then(async()=>{const id=await P.asset(file);await patch({[key]:id});}).catch(P.report);
    }
    document.addEventListener('change',rememberFile,true);
    $('vsResetLogo').addEventListener('click',()=>patch({videoLogo:null}).catch(P.report));
    const setView=async view=>{
      if(view==='video'){await openVideo();return;}
      const stage=view==='caption'?'caption':'poster';
      document.querySelector('.flow-desktop-nav [data-flow="'+stage+'"]')?.click();
      markView(stage);await patch({view:stage});
    };
    document.addEventListener('click',e=>{
      const flow=e.target.closest('[data-flow]')?.dataset.flow;
      if(['caption','poster','preview'].includes(flow)){const view=flow==='caption'?'caption':'poster';markView(view);patch({view}).catch(P.report);}
    });
    const subject=document.createElement('dialog');subject.className='subject-sheet';subject.innerHTML='<form method="dialog"><h2>Fiche du sujet</h2><label>Titre du sujet<input required maxlength="250"></label><label>Source<input maxlength="1000"></label><label><input type="checkbox"> Reporter le titre sur l’affiche</label><label><input type="checkbox"> Reporter le titre dans la vidéo</label><label><input type="checkbox"> Reporter le titre dans la légende « À lire »</label><p>Une correction du sujet peut nécessiter une relecture de la vidéo et de la légende.</p><button value="cancel" formnovalidate>Annuler</button><button value="save">Enregistrer</button></form>';
    document.body.append(subject);
    const [name,source,apply,applyVideo,applyCaption]=subject.querySelectorAll('input');
    apply.closest('label').hidden=videoOnly;
    subject.addEventListener('close',async()=>{if(subject.returnValue!=='save'||!name.value.trim())return;try{const correction=name.value.trim()!==project.subject || source.value.trim()!==(project.source||'');
      const review={};if(correction){
        const latest=await P.get('projects',P.id);
        for(const kind of ['video','poster'])if(latest[kind+'Status'])review[kind+'Status']='À relire';
      }
      await patch({subject:name.value.trim(),source:source.value.trim(),...review});title();
      if(applyVideo.checked){
        if(initialized){$('vsTitle').value=project.subject;await saveVideo();}
        else if(project.video)await patch({video:{...project.video,fields:{...project.video.fields,vsTitle:project.subject}}});
        else await patch({videoTitle:project.subject});
      }
      if(applyCaption.checked)input('studioCaptionTitle',project.subject);
      if(apply.checked){input('headline',project.subject);await TVPlusEditorial.save();}}catch(err){P.report(err);}});
    bar.addEventListener('click',async e=>{
      const action=e.target.dataset.action;
      try{
        if(e.target.matches('a')){e.preventDefault();await mediaWrites;await saveVideo();await TVPlusEditorial.save();location.href='productions.html';}
        else if(action==='subject'){name.value=project.subject;source.value=project.source||'';apply.checked=false;applyVideo.checked=false;applyCaption.checked=false;applyCaption.closest('label').hidden=$('studioCaptionType').value!=='lire';subject.returnValue='';subject.showModal();}
        else if(action==='jpg'){
          $('studioFormat').value='image/jpeg';
          if(TVPlusEditorial.issues().length){TVPlusEditorial.show('quality');$('studioRunCheck').click();}
          else $('studioOptimizedExport').click();
        }
        else if(action)await setView(action);
      }catch(err){P.report(err);}
    });
    await setView(project.view||'poster');
  }catch(err){P.report(err);}
},{once:true});
