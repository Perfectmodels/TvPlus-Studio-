(function tvplusWorkflow() {
  "use strict";
  const $=id=>document.getElementById(id);
  const workspace=document.querySelector(".workspace");
  const formats=document.querySelector(".format-navbar");
  const dock=document.querySelector(".mobile-dock");
  const editor=window.TVPlusEditorial;
  if(!workspace||!formats||!dock||!editor)return;
  const nav=document.createElement("nav");
  nav.id="tvplusWorkflowNav";nav.className="flow-desktop-nav";
  nav.setAttribute("aria-label","Étapes de publication TV+");
  nav.innerHTML=`
    <div class="flow-intro"><strong>PUBLICATION</strong><small>Du visuel à Facebook</small></div>
    <div class="flow-actions">
    <button type="button" data-flow="poster"><span class="flow-number">01</span> Affiche</button>
    <button type="button" data-flow="enhance"><span class="flow-number">02</span> Améliorer photo</button>
    <button type="button" data-flow="crop"><span class="flow-number">↳</span> Recadrer</button>
    <button type="button" data-flow="caption"><span class="flow-number">03</span> Légende Facebook</button>
    <button type="button" data-flow="quality"><span class="flow-number">04</span> Vérifier / Exporter</button>
    <button type="button" data-flow="drafts"><span class="flow-number">⋯</span> Brouillons</button>
    </div>`;
  formats.insertAdjacentElement("afterend",nav);
  const svg=markup=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+markup+'</svg>';
  const icons={
    poster:svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4Z"/>'),
    photo:svg('<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 16-5-5L5 21"/>'),
    caption:svg('<path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3"/><path d="M8 10h5M8 14h5"/><path d="m17 3 4 4-9 9-4 1 1-4Z"/>'),
    preview:svg('<rect x="2.5" y="4" width="19" height="14" rx="2"/><path d="M8 21h8M12 18v3"/><path d="m10 9 5 2.5-5 2.5Z"/>'),
    quality:svg('<path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M5 19h14"/>')
  };
  for(const [key,name] of [["poster","Affiche"],["photo","Photo"],["caption","Légende"],["preview","Aperçu"],["quality","Exporter"]]){
    const b=document.createElement("button");b.type="button";b.className="flow-dock-btn";b.dataset.flow=key;
    b.setAttribute("aria-label",name==="Photo"?"Afficher les outils photo":name==="Exporter"?"Vérifier et exporter l’image":name);
    b.innerHTML=icons[key]+"<span>"+name+"</span>";dock.append(b);
  }
  const palette=document.createElement("aside");palette.className="flow-photo-panel";palette.id="tvplusPhotoQuickMenu";
  palette.hidden=true;palette.setAttribute("aria-label","Outils photo");
  palette.innerHTML=`
    <div class="flow-photo-title"><strong>Outils photo</strong><button type="button" data-photo="close" aria-label="Fermer">×</button></div>
    <button type="button" data-photo="enhance"><strong>Améliorer la photo</strong><small>Luminosité, couleurs, netteté et IA optionnelle</small></button>
    <button type="button" data-photo="crop"><strong>Recadrer la photo</strong><small>Format JPG 1200 × 600</small></button>
    <button type="button" data-photo="upload"><strong>Importer une autre photo</strong><small>Fichier JPG, PNG ou WebP</small></button>`;
  document.body.append(palette);
  const css=document.createElement("style");css.id="tvplus-workflow-style";
  css.textContent=String.raw`
.header-right #studioEditorialOpen,.format-tool.studio-extras{display:none!important}
.flow-desktop-nav{position:sticky;top:var(--flow-nav-top,143px);z-index:24;max-width:1570px;margin:0 auto;padding:8px clamp(12px,1.7vw,25px);border-bottom:1px solid #34475f;background:#0b1728f9;backdrop-filter:blur(14px);display:flex;gap:13px;align-items:center}
.flow-intro{display:flex;flex-direction:column;flex-shrink:0;min-width:147px;gap:2px}
.flow-intro strong{color:#ffcd42;letter-spacing:1.4px;font-size:10px}
.flow-intro small{font-size:10px;color:#acc0d8}
.flow-actions{display:flex;flex:1;gap:6px;min-width:0;overflow-x:auto;scrollbar-width:none}
.flow-actions::-webkit-scrollbar{display:none}
.flow-actions button{flex:1 0 auto;display:flex;justify-content:center;align-items:center;gap:7px;min-height:40px;white-space:nowrap;border-radius:9px;background:#182b45;border:1px solid #37516c;color:#e5edf7;font:800 12px Barlow,Arial,sans-serif;cursor:pointer;padding:8px 10px}
.flow-actions button:hover{background:#29445f;border-color:#ffd058}
.flow-actions button[data-active="true"]{background:#ffc21b;color:#0b192e;border-color:#ffc21b}
.flow-actions .flow-number{font-size:11px;font-weight:900;color:#ffce4d}
.flow-actions button[data-active="true"] .flow-number{color:#152940}
.flow-photo-panel[hidden]{display:none!important}
.flow-photo-panel{position:fixed;z-index:38;bottom:calc(73px + env(safe-area-inset-bottom));right:12px;width:min(350px,calc(100vw - 24px));background:#102138;border:1px solid #516681;border-radius:14px;box-shadow:0 20px 60px #000b;display:flex;flex-direction:column;gap:7px;padding:12px}
.flow-photo-title{display:flex;align-items:center;justify-content:space-between;padding:1px 4px 7px;font-size:14px;color:#f1f5fa}
.flow-photo-title button{width:34px;min-height:31px;border-radius:8px;background:#26394f;border:1px solid #516681;color:white;font-size:20px;cursor:pointer}
.flow-photo-panel>button{display:flex;flex-direction:column;gap:3px;text-align:left;min-height:55px;border-radius:9px;padding:10px 12px;border:1px solid #3a536f;background:#1b314c;color:white;cursor:pointer}
.flow-photo-panel>button strong{font-size:12px}.flow-photo-panel>button small{font-size:10px;color:#abc3da}
.flow-photo-panel>button:hover{border-color:#ffd057;background:#2a4563}
.mobile-dock .flow-dock-btn{display:none}
.workspace[data-workflow-panel="editorial"] .preview-pane{display:none!important}
.workspace[data-workflow-panel="editorial"]>.panel{grid-column:1;grid-row:1}
dialog.studio-editorial-dialog.studio-inline{position:relative!important;inset:auto!important;top:auto!important;right:auto!important;bottom:auto!important;left:auto!important;margin:0!important;width:100%!important;max-width:none!important;min-width:0!important;grid-column:2;grid-row:1;height:calc(100dvh - var(--flow-content-top,205px) - 12px)!important;max-height:none!important;min-height:390px;border-radius:14px!important;background:#101b2c;border:1px solid #304762;box-shadow:0 4px 25px #0003}
dialog.studio-editorial-dialog.studio-inline[open]{display:flex!important;flex-direction:column}
dialog.studio-editorial-dialog.studio-inline .studio-editorial-main{overflow-y:auto;scrollbar-width:thin}
@media(min-width:851px){
 .workspace>.panel{height:calc(100dvh - var(--flow-content-top,205px) - 12px)!important;min-height:390px}
 .workspace>.preview-pane{top:var(--flow-content-top,205px)!important;height:calc(100dvh - var(--flow-content-top,205px) - 12px)!important;min-height:390px}
 .workspace .preview-pane .canvas-shell{width:min(100%,calc(100dvh - var(--flow-content-top,205px) - 190px),620px)}
 .workspace .preview-pane .canvas-shell.is-wide{width:min(100%,calc((100dvh - var(--flow-content-top,205px) - 190px)*16/9),900px)}
}
@media(min-width:851px) and (max-width:1100px){
 .flow-intro{display:none}.flow-actions button{padding:8px 9px;font-size:11px}
}
@media(max-width:850px){
 .flow-desktop-nav{display:none!important}
 .mobile-view-switch{display:none!important}
 .workspace{display:block!important;padding-bottom:calc(83px + env(safe-area-inset-bottom))!important}
 .workspace>.panel{height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important}
 .workspace>.preview-pane{height:auto!important;min-height:0!important;max-height:none!important;top:auto!important}
 .workspace[data-workflow-panel="editorial"]>.panel,
 .workspace[data-workflow-panel="editorial"]>.preview-pane{display:none!important}
 dialog.studio-editorial-dialog.studio-inline{height:auto!important;max-height:none!important;min-height:calc(100dvh - 185px)!important;width:100%!important;max-width:none!important;margin:0!important;border-radius:13px!important;overflow:visible!important}
 dialog.studio-editorial-dialog.studio-inline .studio-editorial-main{overflow:visible!important;max-height:none!important;flex:1 0 auto}
 .mobile-dock{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:2px!important;z-index:36!important;padding:5px 5px calc(6px + env(safe-area-inset-bottom))!important;background:#0a192bfa;border-top:1px solid #354e6b}
 .mobile-dock #mobileTogglePreview,.mobile-dock #mobileQuickExport{display:none!important}
 .mobile-dock .flow-dock-btn{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-height:55px!important;min-width:0;padding:5px 1px!important;color:#adbfd7;background:transparent;border:1px solid transparent;border-radius:9px;font:750 10px Barlow,Arial,sans-serif;cursor:pointer}
 .mobile-dock .flow-dock-btn svg{width:20px;height:20px;flex-shrink:0}
 .mobile-dock .flow-dock-btn span{white-space:nowrap;font-size:10px}
 .mobile-dock .flow-dock-btn[data-active="true"]{color:#ffd064;border-color:#3b526d;background:#20344c}
 .mobile-dock .flow-dock-btn:focus-visible{outline:2px solid #ffc622;outline-offset:-2px}
 .flow-photo-panel{left:10px;right:10px;bottom:calc(73px + env(safe-area-inset-bottom));margin:0 auto;max-height:calc(100dvh - 170px);overflow-y:auto}
 .workspace[data-workflow-panel="editorial"] .studio-editorial-head{position:sticky;top:0;z-index:2;background:#101b2c}
 .workspace[data-workflow-panel="editorial"] .studio-editorial-tabs{position:sticky;top:62px;z-index:2;background:#101b2c}
}
@media(max-width:375px){.mobile-dock .flow-dock-btn svg{width:18px;height:18px}.mobile-dock .flow-dock-btn span{font-size:9px}}
`;
  document.head.append(css);
  const mobile=()=>window.matchMedia("(max-width:850px)").matches;
  function resize(){
    const headerH=document.querySelector(".new-appbar")?.getBoundingClientRect().height||62;
    const formatH=formats.getBoundingClientRect().height||80;
    const flowH=mobile()?0:nav.getBoundingClientRect().height||58;
    document.documentElement.style.setProperty("--flow-nav-top",(headerH+formatH)+"px");
    document.documentElement.style.setProperty("--flow-content-top",(headerH+formatH+flowH+6)+"px");
  }
  function active(stage){
    nav.querySelectorAll("[data-flow]").forEach(btn=>{const on=btn.dataset.flow===stage;btn.dataset.active=String(on);if(on)btn.setAttribute("aria-current","step");else btn.removeAttribute("aria-current");});
    dock.querySelectorAll("[data-flow]").forEach(btn=>{const on=btn.dataset.flow===stage;btn.dataset.active=String(on);btn.setAttribute("aria-pressed",String(on));});
  }
  const photoButton=dock.querySelector('[data-flow="photo"]');
  function closePalette(){palette.hidden=true;photoButton?.setAttribute("aria-expanded","false");}
  function view(m){document.querySelector('.mobile-switch-btn[data-show="'+m+'"]')?.click();}
  function go(stage){
    if(stage!=="photo")closePalette();
    if(stage==="poster"||stage==="preview"){
      editor.close();view(stage==="poster"?"editor":"preview");active(stage);
      if(mobile())window.scrollTo({top:0,behavior:"instant"});
    }else if(stage==="photo"){
      const opening=palette.hidden;palette.hidden=!opening;photoButton?.setAttribute("aria-expanded",String(opening));
      active(opening?"photo":workspace.dataset.workflowPanel==="editorial"?"caption":workspace.dataset.mobileView==="preview"?"preview":"poster");
    }else if(stage==="enhance"||stage==="crop"){
      editor.close();
      $(stage==="enhance"?"openEnhanceTool":"openCropTool")?.click();active("photo");
    }else if(stage==="upload"){
      editor.close();view("editor");active("poster");$("photoInput")?.click();
    }else if(stage==="caption"||stage==="quality"||stage==="drafts"){
      editor.show(stage);active(stage);
    }
  }
  nav.addEventListener("click",ev=>{const b=ev.target.closest("button[data-flow]");if(b)go(b.dataset.flow);});
  dock.addEventListener("click",ev=>{const b=ev.target.closest("button[data-flow]");if(b)go(b.dataset.flow);});
  palette.addEventListener("click",ev=>{const b=ev.target.closest("button[data-photo]");if(!b)return;closePalette();if(b.dataset.photo!=="close")go(b.dataset.photo);});
  document.addEventListener("pointerdown",ev=>{if(!palette.hidden&&!palette.contains(ev.target)&&!photoButton.contains(ev.target))closePalette();},true);
  document.addEventListener("keydown",ev=>{if(ev.key==="Escape"&&!palette.hidden){closePalette();ev.stopPropagation();}});
  document.addEventListener("tvplus:workflow-stage",ev=>{const s=ev.detail?.stage||"poster";active(s==="poster"?(workspace.dataset.mobileView==="preview"?"preview":"poster"):s);});
  document.querySelectorAll(".mobile-switch-btn").forEach(b=>b.addEventListener("click",()=>{if(workspace.dataset.workflowPanel!=="editorial")active(b.dataset.show==="preview"?"preview":"poster");}));
  window.addEventListener("resize",resize);
  if(window.ResizeObserver){const observer=new ResizeObserver(resize);observer.observe(formats);}
  resize();active("poster");
})();