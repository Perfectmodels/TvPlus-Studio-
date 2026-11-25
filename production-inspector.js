function installPosterInspector() {
  const $=id=>document.getElementById(id);
  const workspace=document.querySelector('.workspace');
  const panel=workspace.querySelector('.panel');
  const inspector=document.createElement('aside');
  inspector.className='panel production-inspector';
  inspector.innerHTML='<div class="inspector-heading"><h2>Réglages</h2><button type="button" data-close>Fermer</button></div><div class="inspector-tabs"><button data-inspect="text">Texte</button><button data-inspect="photo">Image</button></div><div data-controls="text"></div><div data-controls="photo"></div>';
  workspace.append(inspector);
  const get=section=>inspector.querySelector('[data-controls="'+section+'"]');
  for(const node of [$('fontScale')?.closest('.field'),$('pastilleSpacingField'),$('appearanceDetails'),$('vt-quoteX')?.closest('details')])if(node)get('text').append(node);
  for(const node of [$('pastillePhotoFraming'),$('mediaDetails'),$('verbatimX')?.closest('.field')])if(node)get('photo').append(node);
  if(['alerte','pastille'].includes(state.mode)){
    const baseX=state.mode==='alerte'?48:65,baseY=state.mode==='alerte'?493:754;
    for(const [axis,label,initial,min,max] of [['X','Position horizontale du titre',baseX,24,300],['Y','Position verticale du titre',baseY,380,870]]){
      const field=document.createElement('label');field.className='field';
      const slider=document.createElement('input');slider.type='range';slider.min=min;slider.max=max;
      const key='headline'+axis;slider.value=state[key]??initial;
      field.append(label,slider);get('text').append(field);
      slider.oninput=()=>{state[key]=Number(slider.value);draw();};
    }
  }
  const heading=panel.querySelector('.settings-stack .section-label');
  if(heading && !heading.parentElement.querySelector('input,select,button'))heading.hidden=true;
  const launcher=document.createElement('button');launcher.type='button';launcher.textContent='Réglages du visuel';launcher.className='inspector-launch';
  workspace.querySelector('.preview-header').append(launcher);
  function inspect(name,open=true){
    for(const section of ['text','photo']){
      get(section).hidden=section!==name;
      inspector.querySelector('[data-inspect="'+section+'"]').setAttribute('aria-pressed',String(section===name));
    }
    if(open)inspector.dataset.open='true';
  }
  for(const btn of inspector.querySelectorAll('[data-inspect]'))btn.onclick=()=>inspect(btn.dataset.inspect);
  inspector.querySelector('[data-close]').onclick=()=>{delete inspector.dataset.open;launcher.focus();};
  launcher.onclick=()=>inspect('text');
  $('headline').addEventListener('focus',()=>{if(innerWidth>1000)inspect('text');});
  $('canvasShell').addEventListener('pointerup',e=>{
    if(innerWidth<1001)return;
    const box=$('poster').getBoundingClientRect();inspect((e.clientY-box.top)/box.height>.55?'text':'photo');
  });
  inspect('text',false);
}
