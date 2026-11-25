/* TV+ Studio — Cadrage libre de la pastille.
   Extension autonome : ne modifie pas les autres formats, l'original ni l'export canvas. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  if (typeof state === 'undefined' || typeof draw !== 'function' ||
      typeof drawBackdrop !== 'function' || !$('photoDrop') || !$('canvasShell')) return;

  const W = 1200;
  const defaults = () => ({
    fit: 'cover', width: 100, height: 100, x: 50, y: 50,
    rotation: 0, flipX: false, flipY: false, opacity: 100, guides: true
  });
  let framing = defaults();
  const clamp = (v, min, max) => Math.min(max, Math.max(min, Number(v) || 0));
  const active = () => state.mode === 'pastille';
  const editable = () => active() && Boolean(state.image) && !state.sample;
  const frame = () => {
    const w = W * framing.width / 100;
    const h = W * framing.height / 100;
    return { x: (W - w) * framing.x / 100, y: (W - h) * framing.y / 100, w, h };
  };
  const panel = document.createElement('details');
  panel.id = 'pastillePhotoFraming';
  panel.className = 'tvplus-framing';
  panel.open = true;
  panel.innerHTML = [
    '<summary><strong>Photo · cadrage et placement libre</strong><small>Pastille uniquement</small></summary>',
    '<div class="pf-body">',
      '<p class="pf-intro">Réglez indépendamment <b>la taille du cadre</b> et <b>la photo à l’intérieur</b>. Les modifications restent réversibles.</p>',
      '<label class="pf-label" for="pfFit">Mode d’affichage</label>',
      '<select id="pfFit" class="pf-select"><option value="cover">Remplir le cadre (sans marges)</option><option value="contain">Photo entière (marges possibles)</option></select>',
      '<div class="pf-line"><label for="framingZoom">Zoom photo <output id="framingZoomText">100 %</output></label>',
        '<input type="range" id="framingZoom" min="100" max="500" step="1" value="100"></div>',
      '<div class="pf-grid"><div class="pf-line"><label for="framingX">Déplacement horizontal <output id="framingXText">0 px</output></label>',
        '<input type="range" id="framingX" min="-1200" max="1200" step="5" value="0"></div>',
      '<div class="pf-line"><label for="framingY">Déplacement vertical <output id="framingYText">0 px</output></label>',
        '<input type="range" id="framingY" min="-1200" max="1200" step="5" value="0"></div></div>',
      '<div class="pf-presets" aria-label="Déplacements précis">',
        '<button type="button" data-nudge="-25,0" aria-label="Déplacer la photo vers la gauche">←</button>',
        '<button type="button" data-nudge="0,-25" aria-label="Déplacer la photo vers le haut">↑</button>',
        '<button type="button" data-nudge="0,25" aria-label="Déplacer la photo vers le bas">↓</button>',
        '<button type="button" data-nudge="25,0" aria-label="Déplacer la photo vers la droite">→</button>',
        '<button type="button" id="pfCenter">Centrer la photo</button>',
      '</div>',
      '<details class="pf-sub" open><summary>Dimensions et position du cadre photo</summary><div class="pf-sub-body">',
        '<div class="pf-grid"><div class="pf-line"><label for="pfWidth">Largeur du cadre <output id="pfWidthText">100 %</output></label>',
          '<input id="pfWidth" type="range" min="20" max="100" step="1" value="100"></div>',
        '<div class="pf-line"><label for="pfHeight">Hauteur du cadre <output id="pfHeightText">100 %</output></label>',
          '<input id="pfHeight" type="range" min="20" max="100" step="1" value="100"></div>',
        '<div class="pf-line"><label for="pfX">Cadre : gauche / droite <output id="pfXText">Centre</output></label>',
          '<input id="pfX" type="range" min="0" max="100" step="1" value="50"></div>',
        '<div class="pf-line"><label for="pfY">Cadre : haut / bas <output id="pfYText">Centre</output></label>',
          '<input id="pfY" type="range" min="0" max="100" step="1" value="50"></div></div>',
        '<div class="pf-presets pf-frames" aria-label="Cadrages prédéfinis">',
          '<button type="button" data-frame="full">Plein cadre</button>',
          '<button type="button" data-frame="left">À gauche</button>',
          '<button type="button" data-frame="right">À droite</button>',
          '<button type="button" data-frame="top">En haut</button>',
          '<button type="button" data-frame="center">Centré</button>',
          '<button type="button" data-frame="portrait">Portrait</button>',
        '</div>',
      '</div></details>',
      '<details class="pf-sub"><summary>Rotation et transformations</summary><div class="pf-sub-body">',
        '<div class="pf-line"><label for="pfRotation">Rotation <output id="pfRotationText">0°</output></label>',
          '<input id="pfRotation" type="range" min="-180" max="180" step="1" value="0"></div>',
        '<div class="pf-presets"><button type="button" id="pfRotateLeft">↶ −90°</button>',
          '<button type="button" id="pfRotateRight">↷ +90°</button>',
          '<button type="button" id="pfFlipX" aria-pressed="false">Symétrie horizontale</button>',
          '<button type="button" id="pfFlipY" aria-pressed="false">Symétrie verticale</button></div>',
        '<div class="pf-line"><label for="pfOpacity">Opacité de la photo <output id="pfOpacityText">100 %</output></label>',
          '<input id="pfOpacity" type="range" min="10" max="100" step="1" value="100"></div>',
      '</div></details>',
      '<label class="pf-check"><input id="pfGuides" type="checkbox" checked>Afficher les limites du cadre dans l’aperçu (invisibles à l’export)</label>',
      '<div class="pf-actions"><button type="button" id="pfReset">Réinitialiser le cadrage</button></div>',
      '<p class="pf-help" id="pfHelp">Sur l’aperçu : glisser pour déplacer, pincer pour zoomer sur mobile. Ctrl + molette sur ordinateur. Flèches du clavier pour les ajustements fins.</p>',
    '</div>'
  ].join('');
  $('photoDrop').closest('.field').insertAdjacentElement('afterend', panel);

  const style = document.createElement('style');
  style.textContent = [
    '.tvplus-framing{background:#10273e;color:#eaf2ff;border:1px solid #48647f;border-radius:12px;margin:12px 0}',
    '.tvplus-framing[hidden]{display:none!important}',
    '.tvplus-framing>summary{display:flex;justify-content:space-between;align-items:center;gap:9px;cursor:pointer;padding:13px;font:800 12px Barlow,Arial,sans-serif}',
    '.tvplus-framing>summary small{font-size:10px;color:#9dbad5;text-align:right}',
    '.pf-body{padding:0 12px 13px;display:grid;gap:12px}',
    '.pf-intro,.pf-help{font:400 11px/1.55 Barlow,Arial,sans-serif;color:#b4c8dd;margin:0}',
    '.pf-label,.pf-line label{font:750 11px/1.5 Barlow,Arial,sans-serif}',
    '.pf-line{display:grid;gap:5px;min-width:0}',
    '.pf-line output{color:#ffce61;font-variant-numeric:tabular-nums}',
    '.pf-line input{width:100%;accent-color:#ffc52d;touch-action:pan-y;cursor:pointer}',
    '.pf-select{width:100%;background:#1e3955;color:#fff;border:1px solid #58728c;border-radius:8px;padding:10px;font:600 12px Barlow,Arial,sans-serif}',
    '.pf-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}',
    '.pf-presets{display:flex;flex-wrap:wrap;gap:6px}',
    '.pf-presets button,.pf-actions button{border:1px solid #58728c;border-radius:7px;padding:8px 10px;background:#23405e;color:#f4f8ff;font:750 11px Barlow,Arial,sans-serif;cursor:pointer;min-height:34px}',
    '.pf-presets button:hover,.pf-actions button:hover{border-color:#ffd16f}',
    '.pf-presets button[aria-pressed="true"]{background:#ad771a;border-color:#ffc52d;color:#fff}',
    '.pf-sub{border:1px solid #38546d;border-radius:9px;overflow:hidden}',
    '.pf-sub>summary{padding:10px 12px;cursor:pointer;font:800 11px Barlow,Arial,sans-serif;background:#183650}',
    '.pf-sub-body{display:grid;gap:12px;padding:12px}',
    '.pf-frames button{flex:1 1 27%;min-width:0}',
    '.pf-check{display:flex;align-items:flex-start;gap:9px;font:600 11px/1.4 Barlow,Arial,sans-serif;color:#c8d7eb}',
    '.pf-check input{accent-color:#ffc52d;margin:1px 0 0}',
    '.pf-actions button{width:100%;background:#324b60}',
    '.pf-guide{position:absolute;z-index:3;border:2px dashed rgba(255,211,86,.9);background:rgba(255,200,50,.045);box-sizing:border-box;pointer-events:none;transition:opacity .12s}',
    '#canvasShell{position:relative;touch-action:none;user-select:none}',
    '@media(max-width:440px){.pf-grid{grid-template-columns:1fr}.pf-frames button{flex:1 1 40%}.tvplus-framing>summary{flex-wrap:wrap}}'
  ].join('\n');
  document.head.appendChild(style);

  const shell = $('canvasShell');
  shell.tabIndex = 0;
  shell.setAttribute('aria-label', 'Aperçu interactif : glisser la photo, flèches pour déplacer, Ctrl + molette pour zoomer');
  const guide = document.createElement('div');
  guide.className = 'pf-guide';
  guide.setAttribute('aria-hidden', 'true');
  shell.appendChild(guide);
  const nativeBackdrop = drawBackdrop;

  function renderPastilleBackdrop() {
    if (!editable()) return nativeBackdrop();
    const img = state.image;
    const f = frame();
    const a = framing.rotation * Math.PI / 180;
    const c = Math.abs(Math.cos(a));
    const s = Math.abs(Math.sin(a));
    // Rotation-aware minimum scale: in "cover" mode the canvas frame stays filled at the center.
    const coverScale = Math.max((f.w * c + f.h * s) / img.width,
                                (f.w * s + f.h * c) / img.height);
    const containScale = Math.min(f.w / img.width, f.h / img.height);
    const base = framing.fit === 'cover' ? coverScale : containScale;
    const scale = base * clamp(state.zoom, framing.fit === 'cover' ? 100 : 20, 500) / 100;
    const iw = img.width * scale;
    const ih = img.height * scale;

    ctx.save();
    ctx.fillStyle = '#091a31';
    ctx.fillRect(0, 0, W, W);
    ctx.beginPath();
    ctx.rect(f.x, f.y, f.w, f.h);
    ctx.clip();
    ctx.globalAlpha = framing.opacity / 100;
    ctx.translate(f.x + f.w / 2 + (Number(state.dx) || 0),
                  f.y + f.h / 2 + (Number(state.dy) || 0));
    ctx.rotate(a);
    ctx.scale(framing.flipX ? -1 : 1, framing.flipY ? -1 : 1);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, -iw / 2, -ih / 2, iw, ih);
    ctx.restore();

    // Preserve the same TV+ dark-blue treatment; titles, logo and footer render afterwards.
    ctx.fillStyle = 'rgba(0,10,28,0.04)';
    ctx.fillRect(0, 0, W, W);
    const opacity = state.darkness / 100;
    const g = ctx.createLinearGradient(0, 490, 0, W);
    g.addColorStop(0, 'rgba(2,14,35,0)');
    g.addColorStop(.22, 'rgba(2,16,43,' + (.35 + opacity * .25).toFixed(3) + ')');
    g.addColorStop(.63, 'rgba(0,15,43,' + (.71 + opacity * .25).toFixed(3) + ')');
    g.addColorStop(1, 'rgba(0,17,49,0.99)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 490, W, 710);
  }
  drawBackdrop = function () {
    if (editable()) return renderPastilleBackdrop();
    return nativeBackdrop();
  };

  function updateGuides() {
    if (!editable() || !framing.guides || !panel.open) {
      guide.style.display = 'none';
      return;
    }
    const f = frame();
    guide.style.display = '';
    guide.style.left = (f.x / W * 100) + '%';
    guide.style.top = (f.y / W * 100) + '%';
    guide.style.width = (f.w / W * 100) + '%';
    guide.style.height = (f.h / W * 100) + '%';
  }
  function setOutput(id, value) {
    const input = $(id), out = $(id + 'Text');
    if (input && String(input.value) !== String(value)) input.value = String(value);
    if (out) out.textContent = String(value) + (id === 'pfRotation' ? '°' : '%');
  }
  function sync() {
    panel.hidden = !active();
    if (!active()) { guide.style.display = 'none'; return; }
    const minimum = framing.fit === 'cover' ? 100 : 20;
    $('framingZoom').min = minimum;
    if (state.zoom < minimum && editable()) {
      state.zoom = minimum;
      $('zoom').value = String(minimum);
      $('zoomLabel').textContent = minimum + ' %';
    }
    $('framingZoom').value = String(clamp(state.zoom, minimum, 500));
    $('framingZoomText').textContent = state.zoom + ' %';
    $('framingX').value = String(clamp(state.dx, -1200, 1200));
    $('framingY').value = String(clamp(state.dy, -1200, 1200));
    $('framingXText').textContent = Math.round(Number(state.dx) || 0) + ' px';
    $('framingYText').textContent = Math.round(Number(state.dy) || 0) + ' px';
    $('pfFit').value = framing.fit;
    for (const [id, v] of [
      ['pfWidth', framing.width], ['pfHeight', framing.height],
      ['pfX', framing.x], ['pfY', framing.y],
      ['pfRotation', framing.rotation], ['pfOpacity', framing.opacity]
    ]) setOutput(id, v);
    $('pfXText').textContent = framing.x === 50 ? 'Centre' : framing.x + ' %';
    $('pfYText').textContent = framing.y === 50 ? 'Centre' : framing.y + ' %';
    $('pfGuides').checked = framing.guides;
    $('pfFlipX').setAttribute('aria-pressed', String(framing.flipX));
    $('pfFlipY').setAttribute('aria-pressed', String(framing.flipY));
    $('pfHelp').textContent = state.sample
      ? 'Importez votre photo pour activer le cadre personnalisable. L’image d’exemple conserve sa mise en page originale.'
      : 'Glissez l’image sur l’aperçu, pincez pour zoomer sur mobile, ou utilisez Ctrl + molette. Cliquez sur l’aperçu puis utilisez les flèches du clavier.';
    updateGuides();
  }
  // Export uses the same draw() and canvas as the preview; guides are an HTML overlay only.
  const previousDraw = draw;
  draw = function () {
    previousDraw();
    sync();
  };

  function redraw() {
    if (framing.fit === 'cover' && state.zoom < 100) state.zoom = 100;
    $('zoom').value = String(state.zoom);
    $('zoomLabel').textContent = state.zoom + ' %';
    draw();
  }
  $('framingZoom').addEventListener('input', e => {
    state.zoom = Number(e.target.value);
    redraw();
  });
  $('pfFit').addEventListener('change', e => {
    framing.fit = e.target.value === 'contain' ? 'contain' : 'cover';
    redraw();
  });
  $('framingX').addEventListener('input', e => {
    state.dx = Number(e.target.value);
    redraw();
  });
  $('framingY').addEventListener('input', e => {
    state.dy = Number(e.target.value);
    redraw();
  });
  for (const [id, prop] of [
    ['pfWidth','width'], ['pfHeight','height'], ['pfX','x'], ['pfY','y'],
    ['pfRotation','rotation'], ['pfOpacity','opacity']
  ]) {
    $(id).addEventListener('input', e => {
      framing[prop] = Number(e.target.value);
      redraw();
    });
  }
  $('pfGuides').addEventListener('change', e => { framing.guides = e.target.checked; updateGuides(); });
  $('pfCenter').addEventListener('click', () => { state.dx = 0; state.dy = 0; redraw(); });
  panel.querySelectorAll('[data-nudge]').forEach(button => button.addEventListener('click', () => {
    const [x, y] = button.dataset.nudge.split(',').map(Number);
    state.dx = clamp((Number(state.dx) || 0) + x, -1200, 1200);
    state.dy = clamp((Number(state.dy) || 0) + y, -1200, 1200);
    redraw();
  }));
  const presets = {
    full: [100,100,50,50], left: [58,100,0,50],
    right: [58,100,100,50], top: [100,70,50,0],
    center: [80,75,50,50], portrait: [58,90,50,50]
  };
  panel.querySelectorAll('[data-frame]').forEach(button => button.addEventListener('click', () => {
    [framing.width, framing.height, framing.x, framing.y] = presets[button.dataset.frame];
    redraw();
  }));
  $('pfRotateLeft').addEventListener('click', () => { framing.rotation = ((framing.rotation - 90 + 540) % 360) - 180; redraw(); });
  $('pfRotateRight').addEventListener('click', () => { framing.rotation = ((framing.rotation + 90 + 540) % 360) - 180; redraw(); });
  $('pfFlipX').addEventListener('click', () => { framing.flipX = !framing.flipX; redraw(); });
  $('pfFlipY').addEventListener('click', () => { framing.flipY = !framing.flipY; redraw(); });
  function reset() {
    framing = defaults();
    state.zoom = 100;
    state.dx = 0;
    state.dy = 0;
    redraw();
  }
  $('pfReset').addEventListener('click', reset);
  $('resetPhoto').addEventListener('click', reset);
  $('resetAll').addEventListener('click', reset);
  $('photoInput').addEventListener('change', reset);
  $('photoDrop').addEventListener('drop', reset);
  $('zoom').max = '500';
  $('zoom').addEventListener('input', () => { if (active()) redraw(); });
  panel.addEventListener('toggle', updateGuides);

  // Capture the pointer events before the legacy single-pointer handler.
  // The original handler remains untouched in every other template.
  const pointers = new Map();
  let gesture = null;
  const point = e => ({ x:e.clientX, y:e.clientY });
  const span = entries => Math.hypot(entries[0].x - entries[1].x, entries[0].y - entries[1].y);
  const midpoint = entries => ({ x:(entries[0].x + entries[1].x)/2, y:(entries[0].y + entries[1].y)/2 });
  function begin() {
    const items = [...pointers.values()];
    if (items.length === 1) gesture = { kind:'move', start:items[0], dx:state.dx, dy:state.dy };
    else if (items.length >= 2) gesture = {
      kind:'pinch', distance:Math.max(1, span(items)), middle:midpoint(items),
      zoom:state.zoom, dx:state.dx, dy:state.dy
    };
  }
  shell.addEventListener('pointerdown', e => {
    if (!editable()) return;
    e.preventDefault(); e.stopImmediatePropagation();
    shell.focus({preventScroll:true});
    shell.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, point(e));
    begin();
  }, true);
  shell.addEventListener('pointermove', e => {
    if (!editable() || !pointers.has(e.pointerId)) return;
    e.preventDefault(); e.stopImmediatePropagation();
    pointers.set(e.pointerId, point(e));
    const rect = $('poster').getBoundingClientRect();
    const factor = rect.width ? W / rect.width : 1;
    const items = [...pointers.values()];
    if (!gesture) begin();
    if (gesture && gesture.kind === 'move' && items.length === 1) {
      state.dx = clamp(gesture.dx + (items[0].x - gesture.start.x) * factor, -1200, 1200);
      state.dy = clamp(gesture.dy + (items[0].y - gesture.start.y) * factor, -1200, 1200);
      redraw();
    } else if (gesture && gesture.kind === 'pinch' && items.length >= 2) {
      const middle = midpoint(items);
      state.zoom = clamp(gesture.zoom * span(items) / gesture.distance,
                         framing.fit === 'cover' ? 100 : 20, 500);
      state.dx = clamp(gesture.dx + (middle.x - gesture.middle.x) * factor, -1200, 1200);
      state.dy = clamp(gesture.dy + (middle.y - gesture.middle.y) * factor, -1200, 1200);
      redraw();
    }
  }, true);
  function endPointer(e) {
    if (!pointers.has(e.pointerId)) return;
    e.stopImmediatePropagation();
    pointers.delete(e.pointerId);
    try { if (shell.hasPointerCapture(e.pointerId)) shell.releasePointerCapture(e.pointerId); } catch (_) {}
    begin();
  }
  for (const event of ['pointerup','pointercancel','lostpointercapture']) {
    shell.addEventListener(event, endPointer, true);
  }
  shell.addEventListener('wheel', e => {
    if (!editable() || !(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    state.zoom = clamp(Number(state.zoom) * (e.deltaY < 0 ? 1.06 : .94),
                       framing.fit === 'cover' ? 100 : 20, 500);
    state.zoom = Math.round(state.zoom);
    redraw();
  }, {passive:false});
  shell.addEventListener('keydown', e => {
    if (!editable()) return;
    const delta = (e.shiftKey ? 40 : 8);
    const keys = {ArrowLeft:[-delta,0],ArrowRight:[delta,0],ArrowUp:[0,-delta],ArrowDown:[0,delta]};
    if (!keys[e.key]) return;
    e.preventDefault();
    state.dx = clamp(Number(state.dx) + keys[e.key][0], -1200, 1200);
    state.dy = clamp(Number(state.dy) + keys[e.key][1], -1200, 1200);
    redraw();
  });
  window.TVPlusPastilleFraming = {
    sync, frame, reset, restore(settings){for(const key of Object.keys(defaults()))if(key in settings)framing[key]=settings[key];sync();}, getSettings: () => ({...framing, zoom:state.zoom, dx:state.dx, dy:state.dy}),
    bounds: () => {
      const f = frame();
      if (!state.image) return {mx:0,my:0};
      const s = Math.max(f.w/state.image.width, f.h/state.image.height) * Math.max(1,state.zoom/100);
      return {mx:Math.max(0,(state.image.width*s-f.w)/2),my:Math.max(0,(state.image.height*s-f.h)/2)};
    }
  };
  sync();
})();
