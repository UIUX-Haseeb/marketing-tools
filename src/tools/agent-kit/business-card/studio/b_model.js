/* ====================== document model ====================== */
function El(id, name, kind, props) { return Object.assign({ id, name, kind, visible: true, locked: false, opacity: 1, rot: 0 }, props); }
function txt(id, name, o) { return El(id, name, 'text', Object.assign({ text: '', x: 0, y: 0, wt: 400, size: 6.25, track: 0, wsp: 0, lh: 8.6, color: C.navy, align: 'left', upper: false, fitW: 0 }, o)); }

function baseElements() {
  const front = [
    El('bg', 'Background colour', 'bg', { fill: '#FFFFFF' }),
    El('bgimg', 'Background image', 'image', { asset: null, fit: 'cover', x: 0, y: 0, w: W, h: H, layer: 'behind', zoom: 1, dx: 0, dy: 0 }),
    El('panel', 'Left panel', 'rect', { x: 0, y: 0, w: 100.72, h: H, fill: C.paper }),
    El('logo', 'Logo', 'logo', { x: 18.16, y: 16.3, w: 64.65, src: 'brand', asset: null, colA: C.navy, colB: C.orange, scale: 1, ux: 18.16, uanchor: 'left', cy: 22.65 }),
    txt('name', 'Name', { text: 'Full Name', x: 117.69, y: 23.572, wt: 500, size: 8.75, track: -0.01, fitW: 110 }),
    txt('title', 'Job title', { text: 'JOB TITLE', x: 118.264, y: 32.785, size: 5.6, track: 0.035, color: C.muted, upper: true, fitW: 112 }),
    El('rule', 'Brass rule', 'rect', { x: 118.5, y: 41.5, w: 24.2, h: 0.35, fill: C.brass }),
    El('brn', 'BRN', 'pair', { label: 'BRN', value: '00000', x: 117.994, y: 54.5225, wt: 400, size: 6.5, track: 0, wsp: 0, colL: C.navy, colV: C.brass, align: 'left' }),
    El('orn', 'ORN', 'pair', { label: 'ORN', value: '1933', x: 18.27, y: 108.691, wt: 400, size: 6.5, track: 0, wsp: 0, colL: C.navy, colV: C.brass, align: 'left' }),
    txt('tagline', 'Extra line (optional)', { text: 'Part of the Provident Group', x: 18.2, y: 100, size: 5.6, track: 0.02, color: C.muted, visible: false }),
    txt('address', 'Address', { text: '1802, Marina Plaza,\nP.O. Box 450535,\nDubai, UAE.', x: 17.96, y: 119.42, size: 5.97, lh: 8.6, color: C.muted }),
    El('r_mobile', 'Mobile', 'row', { icon: 'mobile', text: '+971 00 000 0000', slot: 0, x: 133.119, ox: 0, oy: 0, size: 6.25, color: C.navy, iconColor: C.brass, showIcon: true, wt: 400, track: 0, fitW: 0 }),
    El('r_tel', 'Telephone', 'row', { icon: 'tel', text: '+971 4 323 3609', slot: 1, x: 133.119, ox: 0, oy: 0, size: 6.25, color: C.navy, iconColor: C.brass, showIcon: true, wt: 400, track: 0, fitW: 0 }),
    El('r_mail', 'Email', 'row', { icon: 'mail', text: 'name@providentestate.com', slot: 2, x: 133.119, ox: 0, oy: 0, size: 6.25, color: C.navy, iconColor: C.brass, showIcon: true, wt: 400, track: 0, fitW: 0 }),
    El('r_web', 'Website', 'row', { icon: 'web', text: 'www.providentestate.com', slot: 3, x: 133.119, ox: 0, oy: 0, size: 6.25, color: C.navy, iconColor: C.brass, showIcon: true, wt: 400, track: 0, fitW: 0 }),
  ];
  const lw = 107.6, lh = lw * 180 / 905;
  const back = [
    El('bg', 'Background colour', 'bg', { fill: C.navy }),
    El('bgimg', 'Background image', 'image', { asset: null, fit: 'cover', x: 0, y: 0, w: W, h: H, layer: 'behind', zoom: 1, dx: 0, dy: 0 }),
    El('logo', 'Logo', 'logo', { x: (W - lw) / 2, y: (H - lh) / 2, w: lw, src: 'brand', asset: null, colA: '#FFFFFF', colB: '#FFFFFF', scale: 1, ux: W / 2, uanchor: 'center', cy: H / 2 }),
  ];
  return { front, back };
}

/* Mode presets: only layout + visibility. Text typed by the user is kept when switching. */
const MODES = {
  agents: { label: 'Provident (Agents)', note: 'BRN + ORN shown', vis: { brn: true, rule: true, orn: true }, rowX: 133.119, logoSrc: 'brand' },
  sub: { label: 'Sub-companies', note: 'Same as Agents · pick a company logo', vis: { brn: true, rule: true, orn: true }, rowX: 133.119, logoSrc: 'upload' },
};
function applyMode(doc, mode, resetLayout) {
  doc.mode = mode; const M = MODES[mode];
  if (resetLayout) {
    const fresh = baseElements();
    ['front', 'back'].forEach(side => {
      const cur = doc.sides[side]; const out = [];
      fresh[side].forEach(f => {
        const e = cur.find(x => x.id === f.id); const n = Object.assign({}, f);
        if (e) { ['text', 'label', 'value', 'asset', 'src'].forEach(k => { if (k in e) n[k] = e[k]; }); if (e.kind === 'bg') n.fill = e.fill; if (e.id === 'logo') { ['colA', 'colB', 'scale', 'w', 'ux', 'uanchor', 'cy', 'visible'].forEach(k => { if (k in e) n[k] = e[k]; }); if (!e.asset) { n.w = f.w; } } if (e.id === 'bgimg') ['zoom', 'dx', 'dy', 'fit', 'layer', 'opacity', 'visible'].forEach(k => { if (k in e) n[k] = e[k]; }); if (e.id === 'panel') ['visible', 'fill'].forEach(k => { if (k in e) n[k] = e[k]; }); if (!(f.id in M.vis) && 'visible' in e && !['logo', 'bgimg', 'panel'].includes(f.id)) n.visible = e.visible; }
        out.push(n);
      });
      cur.forEach(e => { if (!fresh[side].some(f => f.id === e.id)) out.push(e); });   // keep custom elements on top
      doc.sides[side] = out;
    });
    doc.rowBottom = ROW_BASE[3]; doc.rowPitch = ROW_PITCH;
  }
  const g = id => doc.sides.front.find(e => e.id === id);
  Object.keys(M.vis).forEach(id => { const e = g(id); if (e) e.visible = M.vis[id]; });
  if (resetLayout) ['r_mobile', 'r_tel', 'r_mail', 'r_web'].forEach(id => { const e = g(id); if (e) { e.x = M.rowX; e.ox = 0; e.oy = 0; } });
}
function newDoc(mode) {
  const b = baseElements();
  const doc = { v: 1, mode: 'agents', reflow: true, fileName: 'Business Card', assets: {}, sides: { front: b.front, back: b.back }, guides: { front: { v: [], h: [] }, back: { v: [], h: [] }, }, rowBottom: ROW_BASE[3], rowPitch: ROW_PITCH };
  applyMode(doc, mode || 'agents', true);
  if (mode === 'sub') { doc.sides.front.find(e => e.id === 'logo').src = 'upload'; doc.sides.back.find(e => e.id === 'logo').src = 'upload'; }
  return doc;
}

/* ====================== element -> drawing primitives ====================== */
// prim: {t:'p', d, fill, op, m, live?}  |  {t:'i', asset, x,y,w,h, op, m}
function getEl(doc, side, id) { return doc.sides[side].find(e => e.id === id); }

/* ---- automatic flow of the right-hand column (long names wrap, everything below follows) ---- */
function wrapLines(str, wt, size, track, maxW, upper, hard) {
  const out = [];
  String(str || '').split('\n').forEach(par => {
    const words = (upper ? par.toUpperCase() : par).split(/\s+/).filter(Boolean); if (!words.length) { out.push(''); return; }
    let cur = '';
    const chunks = [];
    words.forEach(w => { if (hard && run(w, wt, size, track, 0).adv > maxW) { let piece = ''; for (const ch of w) { if (piece && run(piece + ch, wt, size, track, 0).adv > maxW) { chunks.push(piece); piece = ch; } else piece += ch; } chunks.push(piece); } else chunks.push(w); });
    chunks.forEach(w => { const t = cur ? cur + ' ' + w : w; if (!cur || run(t, wt, size, track, 0).adv <= maxW) cur = t; else { out.push(cur); cur = w; } });
    out.push(cur);
  });
  return out;
}
function fitFlow(str, wt, size0, track, maxW, minSize, upper) {
  let size = size0, lines;
  for (;;) { lines = wrapLines(str, wt, size, track, maxW, upper); const mx = Math.max(0, ...lines.map(l => run(l, wt, size, track, 0).adv)); if (mx <= maxW + 0.01 || size <= minSize) break; size = Math.max(minSize, +(size - 0.1).toFixed(2)); }
  if (Math.max(0, ...lines.map(l => run(l, wt, size, track, 0).adv)) > maxW + 0.01) lines = wrapLines(str, wt, size, track, maxW, upper, true);
  return { lines, size };
}
function flowFront(doc) {
  const F = doc.sides.front; const g = id => F.find(e => e.id === id); if (!g('name')) return;
  if (doc.flow === false) { F.forEach(e => { delete e._lines; delete e._size; delete e._pitch; delete e._y; }); return; }
  const name = g('name'), title = g('title'), rule = g('rule'), brn = g('brn'), orn = g('orn'), addr = g('address'), tag = g('tagline'), panel = g('panel');
  const colW = W - 117.69 - 14;
  const nf = fitFlow(name.text, name.wt, name.size, name.track, colW, name.size, false);
  name._lines = nf.lines; name._size = nf.size; name._pitch = nf.size * 1.2; name._y = name.y;
  const nL = name.visible ? Math.max(1, nf.lines.length) : 1; const nameLast = name.y + (nL - 1) * name._pitch;
  const tf = fitFlow(title.text, title.wt, title.size, title.track, colW, title.size, true);
  title._lines = tf.lines; title._size = tf.size; title._pitch = tf.size * 1.32; title._y = nameLast + 9.213;
  const tL = title.visible ? Math.max(1, tf.lines.length) : 1; const titleLast = title._y + (tL - 1) * title._pitch;
  rule._y = titleLast + 8.715; brn._y = rule._y + 13.0225;
  const aW = 100.72 - 17.96 - 10;
  const af = fitFlow(addr.text, addr.wt, addr.size, addr.track || 0, aW, 4.6, false);
  addr._lines = af.lines; addr._size = af.size; addr._pitch = addr.lh * af.size / addr.size;
  const n = Math.max(1, af.lines.length); const last = addr.y + 2 * addr.lh; const first = last - (n - 1) * addr._pitch; addr._y = first;
  orn._y = first - 10.73; tag._y = (orn.visible ? orn._y : first - 1.2) - 9.6;
  F.filter(e => e.kind === 'row').forEach(r => { r.fitW = Math.max(20, W - (r.x + r.ox) - 13); });
}
function layoutRows(doc) {
  flowFront(doc);
  const rows = doc.sides.front.filter(e => e.kind === 'row');
  const vis = rows.filter(e => e.visible).sort((a, b) => a.slot - b.slot);
  const rb = doc.rowBottom != null ? doc.rowBottom : ROW_BASE[3], rp = doc.rowPitch || ROW_PITCH;
  rows.forEach(e => { e._by = rb - (3 - e.slot) * rp + e.oy; });
  if (doc.reflow) vis.forEach((e, i) => { e._by = rb - (vis.length - 1 - i) * rp + e.oy; });
}

function fitScale(el, widths) { if (!el.fitW) return 1; const w = Math.max(0, ...widths); return w > el.fitW ? el.fitW / w : 1; }

function textPrims(el) {
  const out = []; const flow = !!el._lines;
  const lines = flow ? el._lines : String(el.text || '').split('\n');
  const up = s => (!flow && el.upper) ? s.toUpperCase() : s;
  const k = flow ? 1 : fitScale(el, lines.map(l => run(up(l), el.wt, el.size, el.track, el.wsp).adv));
  const size = (flow ? el._size : el.size) * k, pitch = flow ? el._pitch : el.lh, y0 = el._y != null ? el._y : el.y;
  lines.forEach((ln, i) => {
    const s = up(ln); if (!s.trim()) return;
    const r = run(s, el.wt, size, el.track, el.wsp);
    let x = el.x; if (el.align === 'center') x -= r.adv / 2; else if (el.align === 'right') x -= r.adv;
    const y = y0 + i * pitch;
    out.push({ t: 'p', d: r.d, fill: el.color, op: el.opacity, m: tr(x, y), live: { text: s, x, y, size, wt: el.wt, track: el.track, fill: el.color } });
  });
  return out;
}
function pairPrims(el) {
  const a = run(el.label || '', el.wt, el.size, el.track, el.wsp), b = run(el.value || '', el.wt, el.size, el.track, el.wsp);
  const gap = (el.label && el.value) ? spaceAdv(el.wt, el.size, el.track, el.wsp) : 0;
  const total = a.adv + gap + b.adv; let x = el.x;
  if (el.align === 'center') x -= total / 2; else if (el.align === 'right') x -= total;
  const out = [];
  const yy = el._y != null ? el._y : el.y;
  if (el.label) out.push({ t: 'p', d: a.d, fill: el.colL, op: el.opacity, m: tr(x, yy), live: { text: el.label, x, y: yy, size: el.size, wt: el.wt, track: el.track, fill: el.colL } });
  if (el.value) out.push({ t: 'p', d: b.d, fill: el.colV, op: el.opacity, m: tr(x + a.adv + gap, yy), live: { text: el.value, x: x + a.adv + gap, y: yy, size: el.size, wt: el.wt, track: el.track, fill: el.colV } });
  return out;
}
const ICON_CENTER = true; let ICON_CENTER_REF = null; const _icC = new Map();
function iconExtent(ic) {  // [left, right] of the icon relative to its origin
  if (_icC.has(ic)) return _icC.get(ic);
  let x0 = 1e9, x1 = -1e9; ic.d.forEach(d => { const b = localBBox(d); if (b) { x0 = Math.min(x0, b[0]); x1 = Math.max(x1, b[2]); } });
  const r = [x0 - ic.ox, x1 - ic.ox]; _icC.set(ic, r); return r;
}
function iconCentre(ic) { const e = iconExtent(ic); return (e[0] + e[1]) / 2; }
function iconRefCentre() {  // centre line = centre of the widest icon
  if (ICON_CENTER_REF == null) { let best = null; Object.values(DATA.ICONS).forEach(ic => { const e = iconExtent(ic); if (!best || e[1] - e[0] > best[1] - best[0]) best = e; }); ICON_CENTER_REF = (best[0] + best[1]) / 2; }
  return ICON_CENTER_REF;
}
function rowPrims(el) {
  const out = []; const by = el._by != null ? el._by : (S.doc.rowBottom - (3 - el.slot) * S.doc.rowPitch) + el.oy; const tx = el.x + el.ox;
  const s = el.size / ICON_SIZE_REF;
  const ic = DATA.ICONS[el.icon];
  if (el.showIcon && ic) { const cx = iconCentre(ic) ; const ref = iconRefCentre(); const dx = ICON_CENTER ? (ref - cx) : 0; ic.d.forEach(d => out.push({ t: 'p', d, fill: el.iconColor, op: el.opacity, m: mul(tr(tx + ICON_DX * s + dx * s, by), mul(sc(s), tr(-ic.ox, -ic.by))) })); }
  const txtS = String(el.text || '');
  if (txtS.trim()) {
    const k0 = el.fitW ? Math.min(1, el.fitW / run(txtS, el.wt, el.size, el.track, 0).adv) : 1;
    const size = el.size * k0; const r = run(txtS, el.wt, size, el.track, 0);
    out.push({ t: 'p', d: r.d, fill: el.color, op: el.opacity, m: tr(tx, by), live: { text: txtS, x: tx, y: by, size, wt: el.wt, track: el.track, fill: el.color } });
  }
  return out;
}
function logoPrims(el, doc) {
  const a = el.src === 'upload' ? doc.assets[el.asset] : null;
  if (a) { const w = el.w * (el.scale || 1), hh = w * a.h / a.w; const x = el.uanchor === 'center' ? el.ux - w / 2 : el.ux; return [{ t: 'i', asset: a, x, y: el.cy - hh / 2, w, h: hh, op: el.opacity, m: I }]; }
  const s = el.w / DATA.LOGO.vb[0]; const m = mul(tr(el.x, el.y), sc(s));
  const out = DATA.LOGO.main.map(d => ({ t: 'p', d, fill: el.colA, op: el.opacity, m }));
  out.push({ t: 'p', d: DATA.LOGO.dot, fill: el.colB, op: el.opacity, m });
  return out;
}
function logoH(el, doc) { const a = el.src === 'upload' ? doc.assets[el.asset] : null; return a ? el.w * a.h / a.w : el.w * DATA.LOGO.vb[1] / DATA.LOGO.vb[0]; }

function imageBox(el, doc, bleed) {
  const a = doc.assets[el.asset]; if (!a) return null;
  if (el.id === 'bgimg' && (KIOSK_FIT || el.fit !== 'custom')) {
    const nat = a.w / a.h; const bx = -bleed, by = -bleed, bw = W + 2 * bleed, bh = H + 2 * bleed; const bAsp = bw / bh; let w, hh;
    const wide = nat > bAsp;
    if (el.fit === 'cover') { if (wide) { hh = bh; w = bh * nat; } else { w = bw; hh = bw / nat; } }
    else { if (wide) { w = bw; hh = bw / nat; } else { hh = bh; w = bh * nat; } }
    const z = el.zoom || 1; w *= z; hh *= z;
    return { x: bx + (bw - w) / 2 + (el.dx || 0), y: by + (bh - hh) / 2 + (el.dy || 0), w, h: hh };
  }
  return { x: el.x, y: el.y, w: el.w, h: el.h };
}
function elementPrims(el, doc, bleed) {
  bleed = bleed || 0; let prims = [];
  switch (el.kind) {
    case 'bg': prims = [{ t: 'p', d: rectD(-bleed, -bleed, W + 2 * bleed, H + 2 * bleed), fill: el.fill, op: el.opacity, m: I }]; break;
    case 'rect': {
      const ry = el._y != null ? el._y : el.y; let x0 = el.x, y0 = ry, x1 = el.x + el.w, y1 = ry + el.h; const e = 0.06;
      if (bleed) { if (x0 <= e) x0 = -bleed; if (y0 <= e) y0 = -bleed; if (x1 >= W - e) x1 = W + bleed; if (y1 >= H - e) y1 = H + bleed; }
      prims = [{ t: 'p', d: rectD(x0, y0, x1 - x0, y1 - y0), fill: el.fill, op: el.opacity, m: I }]; break;
    }
    case 'image': {
      const bx = imageBox(el, doc, bleed);
      if (bx) {
        const a = doc.assets[el.asset];
        const cx = bx.x + bx.w / 2, cy = bx.y + bx.h / 2; // zoom about centre handled in imageBox for bgimg
        prims = [{ t: 'i', asset: a, x: bx.x, y: bx.y, w: bx.w, h: bx.h, op: el.opacity, m: I, flipX: el.flipX }];
      } break;
    }
    case 'logo': prims = logoPrims(el, doc); break;
    case 'text': prims = textPrims(el); break;
    case 'pair': prims = pairPrims(el); break;
    case 'row': prims = rowPrims(el); break;
  }
  if (el.rot) {
    let bb = null; prims.forEach(p => bb = bboxUnion(bb, primBBox(p)));
    if (bb) { const R = rot(el.rot, (bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2); prims.forEach(p => p.m = mul(R, p.m || I)); }
  }
  return prims;
}
function elBBox(el, doc) {
  let bb = null; elementPrims(el, doc, 0).forEach(p => bb = bboxUnion(bb, primBBox(p)));
  return bb;
}
function orderedEls(doc, side) { const arr = doc.sides[side]; const top = arr.filter(e => e.id === 'bgimg' && e.layer === 'top'); return arr.filter(e => !(e.id === 'bgimg' && e.layer === 'top')).concat(top); }
function sidePrims(doc, side, bleed, opts) {
  layoutRows(doc); const out = [];
  orderedEls(doc, side).forEach(el => { if (!el.visible) return; elementPrims(el, doc, bleed).forEach(p => { p.el = el.id; out.push(p); }); });
  return out;
}

/* ====================== prims -> SVG ====================== */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
function primSVG(p, o) {
  o = o || {};
  if (p.t === 'p') {
    if (o.live && p.live) {
      const l = p.live; const fam = "'Google Sans Flex','GSF',sans-serif";
      return `<text x="${+l.x.toFixed(3)}" y="${+l.y.toFixed(3)}" font-family="${fam}" font-weight="${l.wt}" font-size="${+l.size.toFixed(3)}" letter-spacing="${+(l.track * l.size).toFixed(3)}" fill="${l.fill}"${p.op < 1 ? ` fill-opacity="${p.op}"` : ''}${p.m && p.m.slice(0, 4).join() !== '1,0,0,1' ? '' : ''}>${esc(l.text)}</text>`;
    }
    return `<path d="${p.d}" fill="${p.fill}"${p.op < 1 ? ` fill-opacity="${p.op}"` : ''}${p.m !== I && p.m ? ` transform="${mat(p.m)}"` : ''}/>`;
  }
  const href = o.dataUrl ? p.asset.url : assetHref(p.asset);
  let tf = p.m && p.m !== I ? mat(p.m) : '';
  if (p.flipX) tf = (tf ? tf + ' ' : '') + `translate(${p.x * 2 + p.w} 0) scale(-1 1)`;
  return `<image href="${href}" x="${+p.x.toFixed(3)}" y="${+p.y.toFixed(3)}" width="${+p.w.toFixed(3)}" height="${+p.h.toFixed(3)}" preserveAspectRatio="none"${p.op < 1 ? ` opacity="${p.op}"` : ''}${tf ? ` transform="${tf}"` : ''}/>`;
}
function buildSVG(doc, side, o) {
  o = o || {}; const b = o.bleed || 0;
  layoutRows(doc);
  const body = sidePrims(doc, side, b).map(p => primSVG(p, { dataUrl: true, live: o.live })).join('');
  const wmm = +((W + 2 * b) / MM).toFixed(3), hmm = +((H + 2 * b) / MM).toFixed(3);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${wmm}mm" height="${hmm}mm" viewBox="${-b} ${-b} ${+(W + 2 * b).toFixed(4)} ${+(H + 2 * b).toFixed(4)}"><title>${esc(doc.fileName)} – ${side}</title><defs><clipPath id="trim"><rect x="${-b}" y="${-b}" width="${+(W + 2 * b).toFixed(4)}" height="${+(H + 2 * b).toFixed(4)}"/></clipPath></defs><g clip-path="url(#trim)">${body}</g></svg>`;
}

const KIOSK_FIT = !/admin/.test(location.hash);
