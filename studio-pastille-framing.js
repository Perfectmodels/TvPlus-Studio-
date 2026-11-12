/* TV+ Studio — Pastille image precision. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
if(typeof state==='undefined'||typeof draw!=='function'||!$('photoDrop'))return;
const panel=document.createElement('details');panel.id='pastillePhotoFraming';panel.className='tvplus-framing';panel.open=true;
panel.innerHTML=`<summary><strong>Cadrage précis de la photo</strong><small>Pastille · sans déformation</small></summary>
<div class="framing-body"><label>Zoom <output id="framingZoomText">100 %</output><input id="framingZoom" type="range" min="100" max="320" value="100"></label>
<label>Position horizontale <output id="framingXText">Centré</output><input id="framingX" type="range" min="-100" max="100" value="0"></label>
<label>Position verticale <output id="framingYText">Centré</output><input id="framingY" type="range" min="-100" max="100" value="0"></label>
<div class="framing-presets">
<button data-preset="center" type="button">Centrer</button><button data-preset="top" type="button">Haut</button><button data-preset="bottom" type="button">Bas</button>
<button data-preset="left" type="button">Gauche</button><button data-preset="right" type="button">Droite</button><button data-preset="reset" type="button">Réinitialiser</button></div>
<p>Glissez la photo dans l’aperçu ou réglez sa position. Les proportions restent intactes, sans bord vide.</p></div>`;
$('photoDrop').closest('.field').insertAdjacentElement('afterend',panel);
const css=document.createElement('style');
css.textContent=`.tvplus-framing{background:#10273e;color:#e9f3ff;border:1px solid #456383;border-radius:12px;margin:12px 0}
.tvplus-framing[hidden]{display:none!important}.tvplus-framing summary{display:flex;justify-content:space-between;align-items:center;cursor:pointer;padding:12px;font:800 12px Barlow,Arial,sans-serif}
.tvplus-framing summary small{color:#9ebcda;font-size:10px}.framing-body{padding:0 12px 13px;display:grid;gap:9px}
.framing-body label{display:grid;gap:5px;font:750 11px Barlow,Arial,sans-serif}.framing-body output{float:right;color:#ffd26c}
.framing-body input{width:100%;accent-color:#ffc52d;cursor:pointer}.framing-body input:disabled{opacity:.4}
.framing-presets{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.framing-presets button{border:1px solid #4d6582;border-radius:7px;padding:9px 3px;background:#23405e;color:#fff;font:750 10px Barlow,Arial,sans-serif;cursor:pointer}
.framing-body p{font:400 11px/1.45 Barlow,Arial,sans-serif;color:#aec5dc;margin:0}
#canvasShell{touch-action:none}`;
document.head.append(css);
const z=$('framingZoom'),x=$('framingX'),y=$('framingY'),originalZoom=$('zoom');originalZoom.max='320';
function bounds(){
 if(!state.image)return {mx:0,my:0};
 const w=1200,h=state.sample?885:1200;
 const s=Math.max(w/state.image.width,h/state.image.height)*Math.max(1,state.zoom/100);
 return {mx:Math.max(0,(state.image.width*s-w)/2),my:Math.max(0,(state.image.height*s-h)/2)};
}
function clamp(){
 if(state.mode!=='pastille')return;
 const {mx,my}=bounds();state.dx=Math.max(-mx,Math.min(mx,Number(state.dx)||0));state.dy=Math.max(-my,Math.min(my,Number(state.dy)||0));
}
function sync(){
 panel.hidden=state.mode!=='pastille';if(panel.hidden)return;
 const {mx,my}=bounds();z.value=state.zoom;$('framingZoomText').textContent=state.zoom+' %';
 const xp=mx?Math.round(state.dx/mx*100):0,yp=my?Math.round(state.dy/my*100):0;
 x.value=xp;y.value=yp;x.disabled=mx<1;y.disabled=my<1;
 $('framingXText').textContent=xp===0?'Centré':(xp>0?'+':'')+xp+' %';
 $('framingYText').textContent=yp===0?'Centré':(yp>0?'+':'')+yp+' %';
}
const inheritedDraw=draw;draw=function(){clamp();inheritedDraw();sync();};
z.addEventListener('input',()=>{state.zoom=Number(z.value);originalZoom.value=z.value;$('zoomLabel').textContent=z.value+' %';draw()});
x.addEventListener('input',()=>{state.dx=bounds().mx*Number(x.value)/100;draw()});
y.addEventListener('input',()=>{state.dy=bounds().my*Number(y.value)/100;draw()});
panel.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>{
 const p=b.dataset.preset;if(p==='reset'){state.zoom=100;originalZoom.value='100';$('zoomLabel').textContent='100 %';}
 const {mx,my}=bounds();state.dx=p==='left'?-mx:p==='right'?mx:0;state.dy=p==='top'?-my:p==='bottom'?my:0;draw();
}));
$('canvasShell').addEventListener('pointermove',sync);
window.TVPlusPastilleFraming={sync,bounds};
sync();
})();