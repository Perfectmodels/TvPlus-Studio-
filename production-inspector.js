// Draw the editable treatment on the photo layer, before branding and text.
function imageGradient(context,width,height,angle,start,end){
  const radians=angle*Math.PI/180;
  const x=Math.sin(radians),y=Math.cos(radians);
  const length=Math.abs(width*x)+Math.abs(height*y);
  const left=(width-length*x)/2,top=(height-length*y)/2;
  const from=length*start/100,to=Math.max(from+1,length*end/100);
  return context.createLinearGradient(left+x*from,top+y*from,left+x*to,top+y*to);
}
// At high opacity, bring the solid part of the gradient closer to its start.
function setShadeStops(shade,color,opacity){
  const alpha=Math.max(0,Math.min(100,opacity))/100;
  const solidAt=1-0.78*alpha*alpha;
  const solid=color+Math.round(255*alpha).toString(16).padStart(2,'0');
  shade.addColorStop(0,color+'00');
  shade.addColorStop(solidAt,solid);
  if(solidAt<1)shade.addColorStop(1,solid);
}
function paintPosterGradient(context,width,height){
  const {angle,start,opacity,color}=state.posterGradient;
  const shade=imageGradient(context,width,height,angle,start,100);
  setShadeStops(shade,color,opacity);
  context.save();
  context.globalAlpha=1;
  context.fillStyle=shade;
  context.fillRect(0,0,width,height);
  context.restore();
}
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
  const photoTools=document.createElement('div');photoTools.className='manual-photo';
  get('photo').prepend(photoTools);
  function slider(label,min,max,initial,unit,change){
    const line=document.createElement('label'),input=document.createElement('input'),out=document.createElement('output');
    input.type='range';input.min=min;input.max=max;
    const display=value=>{input.value=Math.round(value);out.value=input.value+unit;};
    input.oninput=()=>{display(input.value);change(Number(input.value));};
    display(initial);line.append(label,out,input);photoTools.append(line);return display;
  }
  const save=()=>{draw();window.TVPlusEditorial.scheduleSave();};
  if(state.mode!=='pastille'){
    const zoom=$('zoom');zoom.max=400;
    const updateZoom=slider('Zoom photo',100,400,state.zoom,' %',value=>{zoom.value=value;zoom.dispatchEvent(new Event('input',{bubbles:true}));save();});
    const positions=['dx','dy'].map((key,i)=>slider(i?'Position verticale':'Position horizontale',-1600,1600,state[key],' px',value=>{state[key]=value;save();}));
    function refresh(){updateZoom(state.zoom);positions[0](state.dx);positions[1](state.dy);}
    $('canvasShell').addEventListener('pointermove',refresh);
    $('canvasShell').addEventListener('pointerup',refresh);
    zoom.addEventListener('input',refresh);
    const center=document.createElement('button');center.textContent='Recentrer la photo';center.onclick=()=>{state.dx=state.dy=0;refresh();save();};photoTools.append(center);
  }
  if(state.mode==='sondage'){
    const use=document.createElement('button');use.textContent='Utiliser la photo comme fond';
    use.onclick=()=>{const style=$('pollStyle');style.value='photo';style.dispatchEvent(new Event('change',{bubbles:true}));save();};photoTools.prepend(use);
  }
  const defaults={angle:0,start:25,color:'#071731',opacity:75};
  const settings=()=>state.posterGradient||defaults;
  const update=(key,value)=>{state.posterGradient={...settings(),[key]:value};save();};
  const sub=document.createElement('h3');sub.textContent='Dégradé';photoTools.append(sub);
  const fields=[['opacity','Opacité',100,' %'],['start','Début du dégradé',99,' %'],['angle','Orientation',360,'°']];
  const sync=fields.map(([key,label,max,unit])=>slider(label,0,max,settings()[key],unit,value=>update(key,value)));
  const color=document.createElement('input'),label=document.createElement('label');color.type='color';color.value=settings().color;
  color.oninput=()=>update('color',color.value);label.append('Couleur',color);photoTools.append(label);
  const reset=document.createElement('button');reset.textContent='Rétablir le dégradé du modèle';
  reset.onclick=()=>{state.posterGradient=null;sync.forEach((set,i)=>set(defaults[fields[i][0]]));color.value=defaults.color;save();};photoTools.append(reset);
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
  const launcher=document.createElement('button');launcher.type='button';launcher.textContent='Image et dégradé';launcher.className='inspector-launch';
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
  launcher.onclick=()=>inspect('photo');
  $('headline').addEventListener('focus',()=>{if(innerWidth>1000)inspect('text');});
  $('canvasShell').addEventListener('pointerup',e=>{
    if(innerWidth<1001||!get('photo').hidden)return;
    const box=$('poster').getBoundingClientRect();inspect((e.clientY-box.top)/box.height>.55?'text':'photo');
  });
  inspect('text',false);
}
