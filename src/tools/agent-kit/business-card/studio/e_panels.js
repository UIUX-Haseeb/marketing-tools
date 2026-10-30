/* ====================== form controls ====================== */
function bindCtl(input, get, setFn) { S.binds.push({ input, get, setFn, grp: S.grp }); return input; }
function syncInspector() {
  S.binds.forEach(b => { if (document.activeElement === b.input) return; let v; try { v = b.get(); } catch (e) { return; } if (b.input.type === 'checkbox') b.input.checked = !!v; else if (v != null && b.input.value !== String(v)) b.input.value = v; if (b.input.dataset.seg) { $$('button', b.input).forEach(x => x.classList.toggle('on', x.dataset.v === String(v))); } });
}
function fNum(label, get, set, o) {
  o = o || {}; const inp = h('input', { type: 'number', step: o.step || 0.1, min: o.min, max: o.max, 'data-focus': o.focus });
  inp.addEventListener('input', () => { const v = parseFloat(inp.value); if (isNaN(v)) return; set(v); redraw(); syncOthers(inp); });
  inp.addEventListener('change', () => { commit(); fullRefresh(true); });
  bindCtl(inp, () => r2(get()), null);
  return h('label', { class: 'f' + (o.cls ? ' ' + o.cls : '') }, h('span', null, label), inp, o.unit ? h('em', null, o.unit) : null);
}
function syncOthers(except) { S.binds.forEach(b => { if (b.input !== except && document.activeElement !== b.input) { try { const v = b.get(); if (b.input.type === 'checkbox') b.input.checked = !!v; else if (v != null) b.input.value = v; } catch (e) { } } }); }
function fText(label, get, set, o) {
  o = o || {}; const inp = h(o.multi ? 'textarea' : 'input', { type: 'text', rows: o.rows || 3, 'data-focus': o.focus, placeholder: o.ph || '' });
  inp.addEventListener('input', () => { set(inp.value); redraw(); drawOverlay(); });
  inp.addEventListener('change', commit);
  bindCtl(inp, get, null);
  return h('label', { class: 'f wide' }, label ? h('span', null, label) : null, inp);
}
function fSelect(label, opts, get, set) {
  const s = h('select', null, opts.map(([v, t]) => h('option', { value: v }, t)));
  s.addEventListener('change', () => { set(s.value); commit(); fullRefresh(true); });
  bindCtl(s, () => String(get()), null); return h('label', { class: 'f' }, h('span', null, label), s);
}
function fCheck(label, get, set) {
  const c = h('input', { type: 'checkbox' }); c.addEventListener('change', () => { set(c.checked); commit(); fullRefresh(true); });
  bindCtl(c, get, null); return h('label', { class: 'f chk' }, c, h('span', null, label));
}
function fSeg(label, opts, get, set) {
  const box = h('div', { class: 'seg sm', 'data-seg': 1 }, opts.map(([v, t]) => h('button', { type: 'button', 'data-v': v, onclick: () => { set(v); commit(); fullRefresh(true); } }, t)));
  bindCtl(box, get, null); return h('div', { class: 'f' }, h('span', null, label), box);
}
function fColor(label, get, set) {
  const hex = h('input', { type: 'text', class: 'hex', maxlength: 9 }), pick = h('input', { type: 'color', class: 'pick' });
  const apply = v => { set(v); redraw(); syncOthers(hex); };
  hex.addEventListener('input', () => { if (/^#[0-9a-fA-F]{6}$/.test(hex.value)) { pick.value = hex.value; apply(hex.value.toUpperCase()); } });
  hex.addEventListener('change', commit);
  pick.addEventListener('input', () => { hex.value = pick.value.toUpperCase(); apply(pick.value.toUpperCase()); }); pick.addEventListener('change', commit);
  bindCtl(hex, () => (get() || '').toUpperCase(), null); bindCtl(pick, () => (get() || '#000000').slice(0, 7), null);
  const sw = h('div', { class: 'sw' }, PALETTE.map(([n, c]) => h('button', { type: 'button', title: n + ' ' + c, style: { background: c }, onclick: () => { apply(c); hex.value = c; pick.value = c; commit(); } })));
  return h('div', { class: 'f col' }, h('span', null, label), h('div', { class: 'cr' }, pick, hex), sw);
}
function fButtons(items) { return h('div', { class: 'btnrow' }, items.map(([t, fn, cls]) => h('button', { type: 'button', class: 'btn sm ' + (cls || ''), onclick: fn }, t))); }
function section(title, ...kids) { return h('section', { class: 'sec' }, h('h4', null, title), ...kids); }

/* ====================== file upload ====================== */
function pickFile(accept, cb) { const i = h('input', { type: 'file', accept }); i.onchange = () => { if (i.files[0]) cb(i.files[0]); }; i.click(); }
function readAsset(file) {
  return new Promise((res, rej) => {
    const fr = new FileReader(); fr.onerror = rej;
    fr.onload = async () => {
      let url = fr.result; let mime = file.type || (/\.svg$/i.test(file.name) ? 'image/svg+xml' : 'image/png');
      if (mime === 'image/svg+xml' && !url.startsWith('data:image/svg+xml')) url = 'data:image/svg+xml;base64,' + url.split(',')[1];
      try {
        const im = await loadImg(url); let w = im.naturalWidth, hh = im.naturalHeight;
        if (mime === 'image/svg+xml') { const txt = atob(url.split(',')[1]); const vb = /viewBox="([\d.\s\-eE,]+)"/.exec(txt); if (vb) { const v = vb[1].split(/[\s,]+/).map(Number); if (v[2] > 0 && v[3] > 0) { w = v[2]; hh = v[3]; } } if (!w || !hh) { w = 300; hh = 100; } }
        const a = { id: uid('a'), name: file.name, mime, url, w, h: hh }; S.doc.assets[a.id] = a; res(a);
      } catch (e) { rej(e); }
    }; fr.readAsDataURL(file);
  });
}
function uploadInto(el, kind) { // kind: 'bgimg' | 'logo' | 'image'
  pickFile('.png,.jpg,.jpeg,.svg,.webp,image/*', async f => {
    try {
      const a = await readAsset(f);
      if (kind === 'bgimg') { el.asset = a.id; el.visible = true; el.fit = 'cover'; el.dx = 0; el.dy = 0; el.zoom = 1; S.sel = ['bgimg']; }
      else if (kind === 'logo') {
        el.asset = a.id; el.src = 'upload'; el.visible = true; el.scale = 1; const ratio = a.h / a.w; const back = S.side === 'back';
        const maxW = back ? 107.6 : 64.65, maxH = back ? 40 : 24; el.w = Math.min(maxW, maxH / ratio);
        if (back) { el.uanchor = 'center'; el.ux = W / 2; el.cy = H / 2; } else { el.uanchor = 'left'; el.ux = 18.16; el.cy = 22.65; }
      }
      else { el.asset = a.id; const asp = a.h / a.w; el.h = el.w * asp; }
      commit(); fullRefresh(); toast(f.name + ' loaded');
    } catch (e) { toast('Could not read that image'); }
  });
}
function addImageElement() {
  pickFile('.png,.jpg,.jpeg,.svg,.webp,image/*', async f => {
    try { const a = await readAsset(f); const w = Math.min(W * 0.5, 60); const el = El(uid('i'), f.name.replace(/\.[^.]+$/, ''), 'image', { asset: a.id, fit: 'custom', x: (W - w) / 2, y: (H - w * a.h / a.w) / 2, w, h: w * a.h / a.w });
      S.doc.sides[S.side].push(el); S.sel = [el.id]; commit(); fullRefresh(); } catch (e) { toast('Could not read that image'); }
  });
}

/* ====================== inspector ====================== */
function alignSel(mode) {
  const els = selEls().filter(e => !e.locked && e.kind !== 'bg'); if (!els.length) return;
  const group = selBBox(els.map(e => e.id)); const ref = els.length > 1 ? group : [0, 0, W, H];
  els.forEach(el => { const b = elBBox(el, S.doc); if (!b) return; let dx = 0, dy = 0; const cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
    if (mode === 'l') dx = ref[0] - b[0]; if (mode === 'c') dx = (ref[0] + ref[2]) / 2 - cx; if (mode === 'r') dx = ref[2] - b[2];
    if (mode === 't') dy = ref[1] - b[1]; if (mode === 'm') dy = (ref[1] + ref[3]) / 2 - cy; if (mode === 'b') dy = ref[3] - b[3]; moveEl(el, dx, dy); });
  commit(); redraw(); syncInspector();
}
function zMove(dir) { const arr = S.doc.sides[S.side]; selEls().forEach(el => { const i = arr.indexOf(el); const j = clamp(i + dir, 0, arr.length - 1); arr.splice(i, 1); arr.splice(j, 0, el); }); commit(); fullRefresh(); }
function buildInspector() {
  const box = $('#insp'); box.innerHTML = ''; S.binds = S.binds.filter(b => b.grp !== 'insp'); S.grp = 'insp';
  const els = selEls();
  if (!els.length) {
    box.append(h('div', { class: 'empty' }, h('b', null, 'Nothing selected'), h('p', null, 'Click any element on the card to edit it. Drag to move, use the corner handles to resize, and hold Shift to select several. Everything can be hidden with the eye icon in the Layers tab, or by pressing H.'),
      h('p', { class: 'hint' }, 'Tip: Ctrl/⌘+A selects every element so you can move or scale the whole design together.'),
      fButtons([['Select all', () => { S.sel = curEls().filter(el => !['bg', 'bgimg'].includes(el.kind) && el.id !== 'panel' && el.visible).map(el => el.id); refreshSel(); }]])));
    return;
  }
  const el = els[0]; const multi = els.length > 1;
  box.append(h('div', { class: 'ihead' }, h('b', null, multi ? `${els.length} elements selected` : el.name), multi ? null : h('span', { class: 'tag' }, el.kind)));
  // common toolbar
  box.append(h('div', { class: 'btnrow tight' },
    h('button', { class: 'ic', title: 'Hide / show (H)', onclick: toggleSelVisible }, '👁'),
    h('button', { class: 'ic', title: 'Lock / unlock', onclick: () => { const v = !els[0].locked; els.forEach(e => e.locked = v); commit(); fullRefresh(); } }, els[0].locked ? '🔒' : '🔓'),
    h('button', { class: 'ic', title: 'Duplicate (Ctrl+D)', onclick: dupSel }, '⧉'),
    h('button', { class: 'ic', title: 'Bring forward', onclick: () => zMove(1) }, '↑'),
    h('button', { class: 'ic', title: 'Send backward', onclick: () => zMove(-1) }, '↓'),
    h('button', { class: 'ic danger', title: 'Delete / hide (Del)', onclick: delSel }, '✕')));
  // alignment
  box.append(section(multi ? 'Align to each other' : 'Align to card', h('div', { class: 'btnrow tight' }, [['l', '⇤', 'Left'], ['c', '↔', 'Centre horizontally'], ['r', '⇥', 'Right'], ['t', '⤒', 'Top'], ['m', '↕', 'Middle vertically'], ['b', '⤓', 'Bottom']].map(([k, t, tt]) => h('button', { class: 'ic', title: tt, onclick: () => alignSel(k) }, t)))));
  if (multi) {
    const f = h('input', { type: 'number', value: 100, min: 10, max: 400, step: 1 });
    box.append(section('Scale selection', h('div', { class: 'f' }, h('span', null, 'Scale %'), f, h('em', null, '%')), fButtons([['Apply scale', () => { const v = parseFloat(f.value); if (v > 0) scaleSelection(v / 100); f.value = 100; }], ['−5%', () => scaleSelection(.95)], ['+5%', () => scaleSelection(1.05)]]),
      h('p', { class: 'hint' }, 'Scales text, icons, spacing and positions together around the centre of the selection (the panel and backgrounds stay put). Use Ctrl/⌘+A first to scale the whole card layout.')));
    box.append(section('Position', h('p', { class: 'hint' }, 'Drag on the canvas or use arrow keys (Shift = 1 mm, Alt = fine).')));
    return;
  }
  const bb = () => elBBox(el, S.doc) || [0, 0, 0, 0];
  const posX = fNum('X', () => mm(bb()[0]), v => { const d = pt(v) - bb()[0]; moveEl(el, d, 0); }, { step: .1, unit: 'mm' });
  const posY = fNum('Y', () => mm(bb()[1]), v => { const d = pt(v) - bb()[1]; moveEl(el, 0, d); }, { step: .1, unit: 'mm' });
  const sizeFields = [];
  if (['rect'].includes(el.kind)) sizeFields.push(fNum('Width', () => mm(el.w), v => el.w = pt(v), { unit: 'mm' }), fNum('Height', () => mm(el.h), v => el.h = pt(v), { unit: 'mm', step: .05 }));
  if (['image', 'logo'].includes(el.kind)) sizeFields.push(fNum('Width', () => mm(bb()[2] - bb()[0]), v => { toCustomImage(el); const f = pt(v) / (bb()[2] - bb()[0] || 1); scaleElBy(el, f); }, { unit: 'mm' }));
  box.append(section('Position & size', h('div', { class: 'grid2' }, posX, posY, ...sizeFields, fNum('Rotate', () => el.rot || 0, v => el.rot = v, { step: 1, unit: '°' }), fNum('Opacity', () => Math.round((el.opacity == null ? 1 : el.opacity) * 100), v => el.opacity = clamp(v, 0, 100) / 100, { step: 5, unit: '%' }))));
  if (el.kind === 'text') {
    box.append(section('Text', fText('', () => el.text, v => el.text = v, { multi: true, rows: 3, focus: el.id }),
      h('div', { class: 'grid2' }, fSelect('Weight', WEIGHTS, () => el.wt, v => el.wt = +v), fNum('Size', () => el.size, v => el.size = v, { step: .05, unit: 'pt', min: 1 }),
        fNum('Tracking', () => r2((el.track || 0) * 100), v => el.track = v / 100, { step: .5, unit: '%' }), fNum('Line height', () => el.lh, v => el.lh = v, { step: .1, unit: 'pt' }),
        fNum('Auto-shrink to', () => el.fitW ? mm(el.fitW) : 0, v => el.fitW = v > 0 ? pt(v) : 0, { step: 1, unit: 'mm' })),
      fSeg('Align', [['left', 'Left'], ['center', 'Centre'], ['right', 'Right']], () => el.align, v => { const b = bb(); const old = el.align; el.align = v; }), fCheck('UPPERCASE', () => el.upper, v => el.upper = v), fColor('Colour', () => el.color, v => el.color = v),
      h('p', { class: 'hint' }, 'Auto-shrink keeps a long name inside the width you set (0 = off).')));
  }
  if (el.kind === 'pair') box.append(section('Label + value', fText('Label', () => el.label, v => el.label = v, { focus: el.id }), fText('Value', () => el.value, v => el.value = v),
    h('div', { class: 'grid2' }, fSelect('Weight', WEIGHTS, () => el.wt, v => el.wt = +v), fNum('Size', () => el.size, v => el.size = v, { step: .05, unit: 'pt', min: 1 }), fNum('Tracking', () => r2((el.track || 0) * 100), v => el.track = v / 100, { step: .5, unit: '%' })),
    fColor('Label colour', () => el.colL, v => el.colL = v), fColor('Value colour', () => el.colV, v => el.colV = v)));
  if (el.kind === 'row') box.append(section('Contact line', fText('Text', () => el.text, v => el.text = v, { focus: el.id }),
    fSelect('Icon', [['mobile', 'Mobile'], ['tel', 'Telephone'], ['mail', 'Email'], ['web', 'Website']], () => el.icon, v => el.icon = v), fCheck('Show icon', () => el.showIcon, v => el.showIcon = v),
    h('div', { class: 'grid2' }, fSelect('Weight', WEIGHTS, () => el.wt, v => el.wt = +v), fNum('Size', () => el.size, v => el.size = v, { step: .05, unit: 'pt', min: 1 }), fNum('Auto-shrink to', () => el.fitW ? mm(el.fitW) : 0, v => el.fitW = v > 0 ? pt(v) : 0, { step: 1, unit: 'mm' })),
    fColor('Text colour', () => el.color, v => el.color = v), fColor('Icon colour', () => el.iconColor, v => el.iconColor = v),
    h('p', { class: 'hint' }, 'When “Close gaps when hiding” is on (Design tab), hidden lines never leave an empty space.')));
  if (el.kind === 'rect') box.append(section('Fill', fColor('Colour', () => el.fill, v => el.fill = v)));
  if (el.kind === 'bg') box.append(section('Background colour', fColor('Colour', () => el.fill, v => el.fill = v)));
  if (el.kind === 'logo') box.append(logoSection(el));
  if (el.kind === 'image') box.append(imageSection(el));
}
function logoSection(el) {
  const hasAsset = !!S.doc.assets[el.asset];
  return section('Logo', fSeg('Source', [['brand', 'Provident'], ['upload', 'Uploaded']], () => el.src, v => { if (v === 'upload' && !hasAsset) { uploadInto(el, 'logo'); } else el.src = v; }),
    fButtons([[hasAsset ? 'Replace logo (SVG / PNG)…' : 'Upload logo (SVG / PNG)…', () => uploadInto(el, 'logo')], hasAsset ? ['Remove', () => { el.asset = null; el.src = 'brand'; commit(); fullRefresh(); }] : null].filter(Boolean)),
    el.src === 'brand' ? h('div', null, fSeg('Colours', [['navy', 'Navy + orange'], ['white', 'All white'], ['navyonly', 'All navy']], () => (el.colA === '#FFFFFF' && el.colB === '#FFFFFF') ? 'white' : (el.colA === C.navy && el.colB === C.orange) ? 'navy' : (el.colA === C.navy && el.colB === C.navy) ? 'navyonly' : '', v => { if (v === 'white') { el.colA = el.colB = '#FFFFFF'; } else if (v === 'navy') { el.colA = C.navy; el.colB = C.orange; } else { el.colA = el.colB = C.navy; } }), fColor('Wordmark colour', () => el.colA, v => el.colA = v), fColor('Dot colour', () => el.colB, v => el.colB = v)) : null,
    h('p', { class: 'hint' }, 'The Provident logo is the supplied brand vector — never redrawn. Uploaded SVG stays vector in SVG export; PDF embeds it at 600 dpi.'));
}
function imageSection(el) {
  const isBg = el.id === 'bgimg'; const a = S.doc.assets[el.asset];
  const parts = [fButtons([[a ? 'Replace image…' : 'Upload image…', () => uploadInto(el, isBg ? 'bgimg' : 'image')], a && isBg ? ['Remove', () => { el.asset = null; commit(); fullRefresh(); }] : null].filter(Boolean))];
  if (isBg) parts.push(fSeg('Fit', [['cover', 'Fill card'], ['contain', 'Fit inside'], ['custom', 'Free']], () => el.fit, v => { if (v === 'custom') toCustomImage(el); else { el.fit = v; el.dx = el.dy = 0; el.zoom = 1; } }), fNum('Zoom', () => Math.round((el.zoom || 1) * 100), v => { el.zoom = Math.max(.1, v / 100); }, { step: 5, unit: '%' }), h('p', { class: 'hint' }, 'Drag the image on the card to reposition it. Alt+click selects it from the canvas.'));
  else parts.push(fCheck('Flip horizontally', () => el.flipX, v => el.flipX = v));
  return section('Image', ...parts);
}

/* ====================== layers tab ====================== */
function buildLayers() {
  const box = $('#pane-layers'); box.innerHTML = '';
  const add = h('div', { class: 'btnrow' },
    h('button', { class: 'btn sm', onclick: () => { const el = txt(uid('t'), 'Text', { text: 'New text', x: W / 2, y: H / 2, align: 'center', size: 7 }); S.doc.sides[S.side].push(el); S.sel = [el.id]; commit(); fullRefresh(); } }, '+ Text'),
    h('button', { class: 'btn sm', onclick: addImageElement }, '+ Image / stamp'),
    h('button', { class: 'btn sm', onclick: () => { const el = El(uid('r'), 'Shape', 'rect', { x: W / 2 - 20, y: H / 2, w: 40, h: 0.3, fill: C.brass }); S.doc.sides[S.side].push(el); S.sel = [el.id]; commit(); fullRefresh(); } }, '+ Line / shape'));
  box.append(add);
  const list = h('div', { class: 'layers' });
  curEls().slice().reverse().forEach(el => {
    const row = h('div', { class: 'layer' + (S.sel.includes(el.id) ? ' sel' : '') + (el.visible ? '' : ' off'), 'data-id': el.id, onclick: e => { if (e.shiftKey) S.sel = S.sel.includes(el.id) ? S.sel.filter(i => i !== el.id) : [...S.sel, el.id]; else S.sel = [el.id]; refreshSel(); } },
      h('button', { class: 'eye', title: el.visible ? 'Hide' : 'Show', onclick: e => { e.stopPropagation(); el.visible = !el.visible; commit(); fullRefresh(); } }, el.visible ? '👁' : '◌'),
      h('span', { class: 'nm' }, el.name, el.kind === 'row' || el.kind === 'text' ? h('small', null, ' ' + String(el.text || '').split('\n')[0].slice(0, 22)) : el.kind === 'pair' ? h('small', null, ` ${el.label} ${el.value}`) : null),
      h('button', { class: 'lk', title: 'Lock', onclick: e => { e.stopPropagation(); el.locked = !el.locked; commit(); fullRefresh(); } }, el.locked ? '🔒' : '🔓'));
    list.append(row);
  });
  box.append(list, h('p', { class: 'hint' }, 'Top of the list = front-most. Use the ↑ ↓ buttons in the right panel to reorder.'));
}
function syncLayerSel() { $$('#pane-layers .layer').forEach(r => r.classList.toggle('sel', S.sel.includes(r.dataset.id))); }

/* ====================== content tab ====================== */
function contentRow(label, el, field, o) {
  o = o || {}; const e = elById(el, 'front'); if (!e) return null;
  const inp = h(o.multi ? 'textarea' : 'input', { type: 'text', rows: 3, 'data-focus': el });
  inp.addEventListener('input', () => { e[field] = inp.value; redraw(); drawOverlay(); }); inp.addEventListener('change', commit);
  S.binds.push({ input: inp, get: () => e[field], grp: 'content' });
  const vis = h('button', { class: 'eye' + (e.visible ? '' : ' off'), title: 'Show / hide', onclick: ev => { e.visible = !e.visible; vis.textContent = e.visible ? '👁' : '◌'; vis.classList.toggle('off', !e.visible); commit(); redraw(); drawOverlay(); buildLayers(); } }, e.visible ? '👁' : '◌');
  return h('div', { class: 'crow' }, h('span', { class: 'lb' }, label), inp, vis);
}
function toggleRow(label, e) {
  const vis = h('button', { class: 'eye' + (e.visible ? '' : ' off'), title: 'Show / hide', onclick: () => { e.visible = !e.visible; vis.textContent = e.visible ? '👁' : '◌'; vis.classList.toggle('off', !e.visible); commit(); redraw(); drawOverlay(); } }, e.visible ? '👁' : '◌');
  return h('div', { class: 'crow tog' }, h('span', { class: 'lb wide' }, label), vis);
}

/* ====================== company logo picker (sub-company template) ====================== */
const svgUrl = svg => 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
function applyLibraryLogo(lg, side, tone) {
  const el = elById('logo', side); const aid = 'lg_' + lg.id + '_' + tone;
  if (!S.doc.assets[aid]) S.doc.assets[aid] = { id: aid, name: lg.company + ' – ' + lg.variant, mime: 'image/svg+xml', url: svgUrl(tone === 'white' ? lg.white : lg.color), w: lg.w, h: lg.h, lib: lg.id };
  const a = S.doc.assets[aid]; el.asset = aid; el.src = 'upload'; el.visible = true; el.scale = 1; const ratio = a.h / a.w; const back = side === 'back';
  const maxW = back ? 107.6 : 64.65, maxH = back ? 40 : 24; el.w = Math.min(maxW, maxH / ratio);
  if (back) { el.uanchor = 'center'; el.ux = W / 2; el.cy = H / 2; } else { el.uanchor = 'left'; el.ux = 18.16; el.cy = 22.65; }
}
function logoPicker(side) {
  const el = elById('logo', side); const tone = side === 'back' ? 'white' : 'color'; const cur = el.asset;
  const grid = h('div', { class: 'lgrid ' + (side === 'back' ? 'dark' : '') });
  LOGOS.forEach(lg => {
    const aid = 'lg_' + lg.id + '_' + tone;
    grid.append(h('button', { class: 'lgbtn' + (cur === aid ? ' on' : ''), title: lg.company + ' – ' + lg.variant, onclick: () => { applyLibraryLogo(lg, side, tone); commit(); fullRefresh(); } },
      h('img', { src: svgUrl(tone === 'white' ? lg.white : lg.color), alt: lg.company + ' ' + lg.variant })));
  });
  const hasOwn = S.doc.assets[cur] && !S.doc.assets[cur].lib;
  return section(side === 'back' ? 'Company logo · back (white)' : 'Company logo · front', grid,
    fButtons([[hasOwn ? 'Replace with your own logo…' : 'Upload a different logo (SVG / PNG)…', () => uploadInto(el, 'logo')]]),
    h('p', { class: 'hint' }, side === 'back' ? 'Back logos are white to sit on the navy back. Pick the company, or upload your own.' : 'Front logos keep their colours so they show on the cream panel.'));
}
function buildContent() {
  const box = $('#pane-content'); box.innerHTML = ''; S.grp = 'content';
  if (S.side === 'back') { const lg = elById('logo', 'back'); box.append(h('div', { class: 'empty' }, h('p', null, 'The back of the card carries the logo only.'), ...(S.doc.mode === 'sub' ? [logoPicker('back')] : []), toggleRow('Show logo on back', lg), h('p', { class: 'hint' }, 'Add or change the back background PNG in the Images tab.'), fButtons([['Go to front', () => setSide('front')]]))); return; }
  const pairRow = (label, id) => { const e = elById(id, 'front'); const l = KIOSK ? h('b', { class: 'fixlab' }, '') : h('input', { type: 'text', class: 'tiny', 'data-focus': id }), v = h('input', { type: 'text', 'data-focus': KIOSK ? id : null });
    if (!KIOSK) l.addEventListener('input', () => { e.label = l.value; redraw(); drawOverlay(); }); v.addEventListener('input', () => { e.value = v.value; redraw(); drawOverlay(); }); if (!KIOSK) l.addEventListener('change', commit); v.addEventListener('change', commit);
    if (!KIOSK) S.binds.push({ input: l, get: () => e.label, grp: 'content' }); else l.textContent = e.label; S.binds.push({ input: v, get: () => e.value, grp: 'content' });
    const vis = h('button', { class: 'eye' + (e.visible ? '' : ' off'), title: 'Show / hide', onclick: () => { e.visible = !e.visible; vis.textContent = e.visible ? '👁' : '◌'; commit(); redraw(); drawOverlay(); buildLayers(); } }, e.visible ? '👁' : '◌');
    return h('div', { class: 'crow' }, h('span', { class: 'lb' }, label), h('div', { class: 'two' }, l, v), vis); };
  box.append(
    ...(S.doc.mode === 'sub' ? [logoPicker('front')] : []),
    section('Person', contentRow('Name', 'name', 'text'), contentRow('Job title', 'title', 'text'),
      h('p', { class: 'hint' }, KIOSK ? 'Long names and titles wrap to the next line automatically — the line, BRN and everything below move down to suit.' : 'Long name? Select it and use “Auto-shrink to”.')),
    section('Registration', pairRow('BRN', 'brn'), elById('rule', 'front') ? h('div', { class: 'crow' }, h('span', { class: 'lb' }, 'Gold line'), h('span'), (() => { const e = elById('rule', 'front'); const b = h('button', { class: 'eye' + (e.visible ? '' : ' off'), onclick: () => { e.visible = !e.visible; b.textContent = e.visible ? '👁' : '◌'; commit(); redraw(); drawOverlay(); buildLayers(); } }, e.visible ? '👁' : '◌'); return b; })()) : null, pairRow('ORN', 'orn')),
    section('Contact', contentRow('Mobile', 'r_mobile', 'text'), contentRow('Telephone', 'r_tel', 'text'), contentRow('Email', 'r_mail', 'text'), contentRow('Website', 'r_web', 'text')),
    section('Office', contentRow('Address', 'address', 'text', { multi: true }), contentRow('Extra line', 'tagline', 'text')),
    section('Show / hide', toggleRow('Logo', elById('logo', 'front')), toggleRow('Left panel (cream)', elById('panel', 'front'))));
}

/* ====================== design tab ====================== */
function buildDesign() {
  const box = $('#pane-design'); box.innerHTML = ''; S.grp = 'design';
  const d = S.doc, side = S.side; const g = id => elById(id, side);
  const bg = g('bg'), bgimg = g('bgimg'), logo = g('logo'), panel = g('panel');
  box.append(
    section(`${side === 'front' ? 'Front' : 'Back'} background`,
      fColor('Colour', () => bg.fill, v => bg.fill = v),
      fButtons([[bgimg.asset ? 'Replace background image…' : 'Upload background image (PNG / JPG)…', () => uploadInto(bgimg, 'bgimg')], bgimg.asset ? [bgimg.visible ? 'Hide' : 'Show', () => { bgimg.visible = !bgimg.visible; commit(); fullRefresh(); }] : null, bgimg.asset ? ['Remove', () => { bgimg.asset = null; commit(); fullRefresh(); }, 'danger'] : null, bgimg.asset ? ['Move / scale on card', () => { S.sel = ['bgimg']; refreshSel(); }] : null].filter(Boolean)),
      bgimg.asset ? fNum('Image opacity', () => Math.round(bgimg.opacity * 100), v => bgimg.opacity = clamp(v, 0, 100) / 100, { step: 5, unit: '%' }) : null,
      h('p', { class: 'hint' }, 'The background image sits above the colour. Move it, zoom it, hide it or delete it any time — nothing is baked in.')));
  if (side === 'front' && panel) box.append(section('Left panel', fCheck('Show panel', () => panel.visible, v => panel.visible = v), fColor('Panel colour', () => panel.fill, v => panel.fill = v),
    fNum('Panel width', () => mm(panel.w), v => panel.w = pt(clamp(v, 5, 85) ), { unit: 'mm', step: .5 }), fNum('Panel opacity', () => Math.round(panel.opacity * 100), v => panel.opacity = clamp(v, 0, 100) / 100, { step: 5, unit: '%' })));
  box.append(section('Logo', fCheck('Show logo', () => logo.visible, v => logo.visible = v), logoSection(logo), fButtons([['Select logo on card', () => { S.sel = ['logo']; refreshSel(); }]])));
  if (side === 'front') box.append(section('Layout', fCheck('Close gaps when hiding contact lines', () => d.reflow, v => d.reflow = v),
    fButtons([['Reset layout to ' + MODES[d.mode].label + ' template', () => { applyMode(d, d.mode, true); S.sel = []; commit(); fullRefresh(); toast('Layout reset'); }]])));
  box.append(section('Helpers', fCheck('Snap to edges / guides', () => S.snap, v => S.snap = v), fCheck('Show safe margin (3 mm)', () => S.safe, v => { S.safe = v; drawOverlay(); }), fCheck('Show guides', () => S.showGuides, v => { S.showGuides = v; drawOverlay(); }),
    fButtons([['Clear guides', () => { d.guides[side] = { v: [], h: [] }; commit(); drawOverlay(); }]]), h('p', { class: 'hint' }, 'Drag from the rulers to pull out a guide. Double-click a guide to remove it.')));
}

/* ====================== Images tab (kiosk) ====================== */
function adjustImage(side) { if (S.side !== side) { S.side = side; } const el = elById('bgimg', side); S.sel = ['bgimg']; fullRefresh(); }
function buildImages() {
  const box = $('#pane-images'); box.innerHTML = ''; S.binds = S.binds.filter(b => b.grp !== 'img'); S.grp = 'img';
  const side = S.side, sideName = side === 'front' ? 'Front' : 'Back'; const el = elById('bgimg', side); const a = S.doc.assets[el.asset];
  const done = () => { S.sel = []; refreshSel(); buildImages(); };
  const adj = S.sel.includes('bgimg');
  box.append(section(`${sideName} background PNG`,
    h('p', { class: 'hint', style: { marginTop: 0 } }, 'Upload one PNG / JPG for the ' + sideName.toLowerCase() + ' of the card. Scale it, move it, hide it or remove it any time.'),
    fButtons([[a ? 'Replace PNG…' : 'Upload PNG…', () => uploadInto(el, 'bgimg')], a ? [el.visible ? 'Hide' : 'Show', () => { el.visible = !el.visible; commit(); fullRefresh(); }] : null, a ? ['Remove', () => { el.asset = null; S.sel = []; commit(); fullRefresh(); }, 'danger'] : null].filter(Boolean)),
    a ? h('div', { class: 'imgname' }, a.name) : h('p', { class: 'hint' }, 'No image yet — the card uses its normal background.')));
  if (a) {
    box.append(section('Scale & position',
      fButtons([[adj ? 'Done adjusting' : 'Adjust on card (drag / scale)', () => { if (adj) done(); else { S.sel = ['bgimg']; refreshSel(); buildImages(); } }, adj ? 'pri' : '']]),
      fNum('Scale', () => Math.round((el.zoom || 1) * 100), v => { el.zoom = clamp(v / 100, 0.05, 12); }, { step: 5, unit: '%', min: 5, max: 1200 }),
      h('input', { type: 'range', min: 5, max: 400, step: 1, class: 'rng', value: Math.round((el.zoom || 1) * 100), oninput: e => { el.zoom = clamp(+e.target.value / 100, 0.05, 12); redraw(); syncOthers(e.target); drawOverlay(); }, onchange: () => { commit(); fullRefresh(true); } }),
      h('div', { class: 'grid2' }, fNum('Left / right', () => mm(el.dx || 0), v => el.dx = pt(v), { step: .5, unit: 'mm' }), fNum('Up / down', () => mm(el.dy || 0), v => el.dy = pt(v), { step: .5, unit: 'mm' })),
      fSeg('Fit', [['cover', 'Fill card'], ['contain', 'Fit inside']], () => el.fit, v => { el.fit = v; el.dx = el.dy = 0; el.zoom = 1; }),
      fButtons([['Reset position', () => { el.dx = el.dy = 0; el.zoom = 1; commit(); fullRefresh(); }]]),
      h('p', { class: 'hint' }, 'With “Adjust on card” on, drag the image on the card, or use the corner handles to scale it. Rulers (mm) and guides snap it into place — drag from a ruler to pull out a guide.')),
      section('Look', fSeg('Layer', [['behind', 'Behind'], ['top', 'On top']], () => el.layer || 'behind', v => el.layer = v), fNum('Opacity', () => Math.round((el.opacity == null ? 1 : el.opacity) * 100), v => el.opacity = clamp(v, 0, 100) / 100, { step: 5, unit: '%' })));
  }
  if (side === 'front') box.append(section('Left panel', toggleRow('Show cream left panel', elById('panel', 'front')), h('p', { class: 'hint' }, 'Switch the panel off if you want the PNG to show across the whole front.')));
  if (S.doc.mode === 'sub') {
    const lg = elById('logo', side); const la = S.doc.assets[lg.asset];
    box.append(section(`${sideName} company logo`, h('p', { class: 'hint', style: { marginTop: 0 } }, 'Upload the sub-company logo (SVG or PNG). It sits in the same fixed spot as the Provident logo.'),
      fButtons([[la ? 'Replace logo…' : 'Upload logo…', () => uploadInto(lg, 'logo')], la ? ['Remove', () => { lg.asset = null; lg.src = 'upload'; commit(); fullRefresh(); }, 'danger'] : null].filter(Boolean)),
      la ? fNum('Logo size', () => Math.round((lg.scale || 1) * 100), v => lg.scale = clamp(v / 100, .3, 1.6), { step: 5, unit: '%' }) : null));
  }
}
