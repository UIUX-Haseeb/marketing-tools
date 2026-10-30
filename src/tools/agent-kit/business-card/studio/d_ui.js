/* ====================== app state ====================== */
const PAD = 30; // pt of workspace around the card
const S = { doc: null, side: 'front', sel: [], z: 3, fit: true, snap: true, safe: false, showGuides: true, lock: false, tab: 'content', hist: [], hi: -1, binds: [], guide: null };
const ADMIN = /admin/.test(location.hash); const KIOSK = !ADMIN;
const LS_KEY = 'provident-bcard-studio-v2' + (ADMIN ? '-admin' : '');
const ws = () => $('#ws');
function isFrontOnly(el) { return S.side === 'front'; }
function curEls() { return S.doc.sides[S.side]; }
function elById(id, side) { return S.doc.sides[side || S.side].find(e => e.id === id); }
function selEls() { return S.sel.map(id => elById(id)).filter(Boolean); }
function toast(msg, ms) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), ms || 2600); }

/* ====================== history + persistence ====================== */
const strip = d => JSON.stringify(d, (k, v) => (k === 'assets' || k === '_by') ? undefined : v);
function pushHist() {
  const s = strip(S.doc); if (S.hist[S.hi] === s) return;
  S.hist = S.hist.slice(0, S.hi + 1); S.hist.push(s); if (S.hist.length > 11) S.hist.shift(); S.hi = S.hist.length - 1; save(); syncHistBtns();
}
function restore(s) { const a = S.doc.assets; S.doc = JSON.parse(s); S.doc.assets = a; S.sel = S.sel.filter(id => elById(id)); fullRefresh(); }
function undo() { if (S.hi > 0) { S.hi--; restore(S.hist[S.hi]); save(); syncHistBtns(); } }
function redo() { if (S.hi < S.hist.length - 1) { S.hi++; restore(S.hist[S.hi]); save(); syncHistBtns(); } }
function syncHistBtns() { $('#undo').disabled = S.hi <= 0; $('#redo').disabled = S.hi >= S.hist.length - 1; }
let saveT; function save() { clearTimeout(saveT); saveT = setTimeout(() => { if (KIOSK) return; try { localStorage.setItem(LS_KEY, JSON.stringify(S.doc)); } catch (e) { } }, 400); }
function commit() { pushHist(); }

/* ====================== canvas drawing ====================== */
let raf = 0;
function redraw() { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; drawCanvas(); }); }
function pxPerPt() { return S.z; }
function setZoom(z, fit) { S.fit = !!fit; S.z = clamp(z, 0.5, 14); applyZoom(); }
function applyZoom() {
  const sc = $('#scroll');
  if (S.fit) { const aw = sc.clientWidth - 24, ah = sc.clientHeight - 24; S.z = clamp(Math.min(aw / (W + 2 * PAD), ah / (H + 2 * PAD)), 0.5, 14); }
  const svg = ws(); svg.style.width = (W + 2 * PAD) * S.z + 'px'; svg.style.height = (H + 2 * PAD) * S.z + 'px';
  $('#zlabel').textContent = Math.round(S.z / (96 / 72 * 1) * 100 / 1) + '%';
  drawRulers(); drawOverlay();
}
function toPt(e) { const r = ws().getBoundingClientRect(); return [(e.clientX - r.left) / r.width * (W + 2 * PAD) - PAD, (e.clientY - r.top) / r.height * (H + 2 * PAD) - PAD]; }

function drawCanvas() {
  const doc = S.doc, side = S.side; layoutRows(doc);
  const g = guide => '';
  const art = orderedEls(doc, side).filter(e => e.visible).map(el => `<g data-id="${el.id}">${elementPrims(el, doc, 0).map(p => primSVG(p)).join('')}</g>`).join('');
  const vb = `${-PAD} ${-PAD} ${W + 2 * PAD} ${H + 2 * PAD}`;
  const svg = ws(); svg.setAttribute('viewBox', vb);
  $('#art').innerHTML = art;
  drawOverlay();
}
function selBBox(ids) { let bb = null; (ids || S.sel).forEach(id => { const el = elById(id); if (el && el.visible) bb = bboxUnion(bb, elBBox(el, S.doc)); }); return bb; }

function drawOverlay() {
  const ov = $('#ov'); if (!ov) return; const z = S.z; const s1 = 1 / z; let o = '';
  // trim/safe
  if (S.safe) { const m = 3 * MM; o += `<rect x="${m}" y="${m}" width="${W - 2 * m}" height="${H - 2 * m}" fill="none" stroke="#e5484d" stroke-width="${s1}" stroke-dasharray="${4 * s1} ${3 * s1}" pointer-events="none"/>`; }
  // guides
  if (S.showGuides) {
    const gd = S.doc.guides[S.side];
    gd.v.forEach((x, i) => o += `<line data-guide="v:${i}" x1="${x}" x2="${x}" y1="${-PAD}" y2="${H + PAD}" stroke="#16b9c9" stroke-width="${s1}"/><line data-guide="v:${i}" x1="${x}" x2="${x}" y1="${-PAD}" y2="${H + PAD}" stroke="transparent" stroke-width="${8 * s1}" style="cursor:ew-resize"/>`);
    gd.h.forEach((y, i) => o += `<line data-guide="h:${i}" y1="${y}" y2="${y}" x1="${-PAD}" x2="${W + PAD}" stroke="#16b9c9" stroke-width="${s1}"/><line data-guide="h:${i}" y1="${y}" y2="${y}" x1="${-PAD}" x2="${W + PAD}" stroke="transparent" stroke-width="${8 * s1}" style="cursor:ns-resize"/>`);
  }
  // snap guides live
  (S.snapLines || []).forEach(l => o += l.v != null ? `<line x1="${l.v}" x2="${l.v}" y1="${-PAD}" y2="${H + PAD}" stroke="#e5484d" stroke-width="${s1}" pointer-events="none"/>` : `<line y1="${l.h}" y2="${l.h}" x1="${-PAD}" x2="${W + PAD}" stroke="#e5484d" stroke-width="${s1}" pointer-events="none"/>`);
  // hidden-element hint for sub-company logo
  const lg = S.doc.sides[S.side].find(e => e.id === 'logo');
  if (lg && lg.visible && lg.src === 'upload' && !S.doc.assets[lg.asset]) {
    const hh = logoH(lg, S.doc); o += `<rect x="${lg.x - 2}" y="${lg.y - 2}" width="${lg.w + 4}" height="${hh + 4}" fill="none" stroke="#B0905C" stroke-width="${s1}" stroke-dasharray="${3 * s1} ${2 * s1}" pointer-events="none"/><text x="${lg.x + lg.w / 2}" y="${lg.y + hh + 7}" text-anchor="middle" font-size="${4.4}" fill="#B0905C" font-family="GSF,sans-serif" pointer-events="none">Upload sub-company logo →  Design tab</text>`;
  }
  // selection
  const els = selEls().filter(e => e.visible);
  els.forEach(el => { const b = elBBox(el, S.doc); if (b) o += `<rect x="${b[0]}" y="${b[1]}" width="${b[2] - b[0]}" height="${b[3] - b[1]}" fill="none" stroke="#2F6BFF" stroke-width="${1.2 * s1}" pointer-events="none"/>`; });
  const bb = selBBox(); S.curBox = bb;
  if (bb && els.length) {
    if (els.length > 1) o += `<rect x="${bb[0]}" y="${bb[1]}" width="${bb[2] - bb[0]}" height="${bb[3] - bb[1]}" fill="none" stroke="#2F6BFF" stroke-dasharray="${3 * s1} ${2 * s1}" stroke-width="${s1}" pointer-events="none"/>`;
    const hs = 7 * s1; const canResize = els.length === 1 && !els[0].locked && !els[0].rot && !S.lock;
    if (canResize) [['nw', bb[0], bb[1]], ['ne', bb[2], bb[1]], ['sw', bb[0], bb[3]], ['se', bb[2], bb[3]]].forEach(([k, x, y]) => o += `<rect data-h="${k}" x="${x - hs / 2}" y="${y - hs / 2}" width="${hs}" height="${hs}" fill="#fff" stroke="#2F6BFF" stroke-width="${s1}" style="cursor:${k === 'nw' || k === 'se' ? 'nwse' : 'nesw'}-resize"/>`);
    // size readout
    o += `<text x="${bb[0]}" y="${bb[1] - 3 * s1}" font-size="${10 * s1}" fill="#2F6BFF" font-family="GSF,sans-serif" pointer-events="none">${r2(mm(bb[2] - bb[0]))} × ${r2(mm(bb[3] - bb[1]))} mm</text>`;
  }
  ov.innerHTML = o;
}

/* ====================== rulers ====================== */
function drawRulers() {
  const sc = $('#scroll'), svg = ws(); const dpr = window.devicePixelRatio || 1;
  const top = $('#rulerTop'), left = $('#rulerLeft'); if (!top) return;
  const sr = sc.getBoundingClientRect(), r = svg.getBoundingClientRect();
  const ox = r.left - sr.left + PAD * S.z, oy = r.top - sr.top + PAD * S.z; // card origin inside scroll viewport
  S.rulerOrigin = [ox, oy];
  const ppmm = S.z * MM; const steps = [0.5, 1, 2, 5, 10, 20, 50]; const major = steps.find(s => s * ppmm >= 46) || 50; const minor = major / (major >= 5 ? 5 : major >= 2 ? 4 : 5);
  const draw = (cv, horiz) => {
    const w = sc.clientWidth, hh = sc.clientHeight; const len = horiz ? w : hh, th = 20;
    cv.width = (horiz ? len : th) * dpr; cv.height = (horiz ? th : len) * dpr; cv.style.width = (horiz ? len : th) + 'px'; cv.style.height = (horiz ? th : len) + 'px';
    const c = cv.getContext('2d'); c.scale(dpr, dpr); c.fillStyle = '#F7F4EE'; c.fillRect(0, 0, horiz ? len : th, horiz ? th : len);
    c.strokeStyle = '#8A8F9C'; c.fillStyle = '#4b5263'; c.font = '9px GSF, sans-serif'; c.lineWidth = 1;
    const o0 = horiz ? ox : oy; const startMM = Math.floor((0 - o0) / ppmm / minor) * minor, endMM = Math.ceil((len - o0) / ppmm / minor) * minor;
    for (let v = startMM; v <= endMM + 1e-6; v += minor) {
      const p = Math.round(o0 + v * ppmm) + 0.5; const isMaj = Math.abs(v / major - Math.round(v / major)) < 1e-6; const L = isMaj ? 12 : (Math.abs(v / (major / 2) - Math.round(v / (major / 2))) < 1e-6 ? 8 : 5);
      c.beginPath(); if (horiz) { c.moveTo(p, th); c.lineTo(p, th - L); } else { c.moveTo(th, p); c.lineTo(th - L, p); } c.stroke();
      if (isMaj) { const lab = String(+v.toFixed(1)); if (horiz) c.fillText(lab, p + 2, 9); else { c.save(); c.translate(9, p + 2); c.rotate(-Math.PI / 2); c.textAlign = 'right'; c.fillText(lab, 0, 0); c.restore(); } }
    }
    // card extent
    c.fillStyle = 'rgba(176,144,92,.22)'; if (horiz) c.fillRect(ox, 0, W * S.z, th); else c.fillRect(0, oy, th, H * S.z);
    c.fillStyle = '#4b5263'; c.font = '8px GSF'; c.textAlign = 'left';
  };
  draw(top, true); draw(left, false);
}
function rulerCursor(e) {
  if (!S.rulerOrigin) return; const sc = $('#scroll').getBoundingClientRect(); const x = e.clientX - sc.left, y = e.clientY - sc.top;
  $('#curX').style.left = x + 'px'; $('#curY').style.top = y + 'px';
  const ppmm = S.z * MM; $('#coords').textContent = `x ${r2((x - S.rulerOrigin[0]) / ppmm)} mm   y ${r2((y - S.rulerOrigin[1]) / ppmm)} mm`;
}

/* ====================== hit testing + snapping ====================== */
function hitTest(p, alt) {
  if (KIOSK) { const el = elById('bgimg'); if (el && el.visible && el.asset && S.sel.includes('bgimg')) { const b = elBBox(el, S.doc); if (b && p[0] >= b[0] && p[0] <= b[2] && p[1] >= b[1] && p[1] <= b[3]) return el; } return null; }
  const els = curEls().slice().reverse();
  const pad = 1.6;
  const test = el => { if (!el.visible || el.locked) return false; const b = elBBox(el, S.doc); return b && p[0] >= b[0] - pad && p[0] <= b[2] + pad && p[1] >= b[1] - pad && p[1] <= b[3] + pad; };
  for (const el of els) { if (['bg', 'bgimg', 'rect'].includes(el.kind) && !(el.kind === 'rect' && el.id !== 'panel')) continue; if (test(el)) return el; }
  for (const el of els) { if (el.kind === 'rect' && el.id === 'panel' && test(el)) return el; }
  if (alt) for (const el of els) if (el.kind === 'bgimg' || el.kind === 'image' || el.kind === 'bg') { if (el.kind === 'bg') return el; if (test(el)) return el; }
  return null;
}
function snapTargets(excl) {
  const xs = [0, W / 2, W, 3 * MM, W - 3 * MM], ys = [0, H / 2, H, 3 * MM, H - 3 * MM];
  curEls().forEach(el => { if (excl.includes(el.id) || !el.visible || ['bg', 'bgimg'].includes(el.kind)) return; const b = elBBox(el, S.doc); if (b) { xs.push(b[0], (b[0] + b[2]) / 2, b[2]); ys.push(b[1], (b[1] + b[3]) / 2, b[3]); } });
  S.doc.guides[S.side].v.forEach(x => xs.push(x)); S.doc.guides[S.side].h.forEach(y => ys.push(y));
  return [xs, ys];
}
function snapDelta(box, dx, dy, excl) {
  S.snapLines = []; if (!S.snap) return [dx, dy];
  const [xs, ys] = snapTargets(excl); const th = 5 / S.z;
  const bx = [box[0] + dx, (box[0] + box[2]) / 2 + dx, box[2] + dx], by = [box[1] + dy, (box[1] + box[3]) / 2 + dy, box[3] + dy];
  let bestX = null, bestY = null;
  bx.forEach(v => xs.forEach(t => { const d = t - v; if (Math.abs(d) < th && (bestX === null || Math.abs(d) < Math.abs(bestX.d))) bestX = { d, t }; }));
  by.forEach(v => ys.forEach(t => { const d = t - v; if (Math.abs(d) < th && (bestY === null || Math.abs(d) < Math.abs(bestY.d))) bestY = { d, t }; }));
  if (bestX) { dx += bestX.d; S.snapLines.push({ v: bestX.t }); } if (bestY) { dy += bestY.d; S.snapLines.push({ h: bestY.t }); }
  return [dx, dy];
}

/* ====================== move / resize ====================== */
function toCustomImage(el) { if (el.id === 'bgimg') return; if (el.kind === 'image' && el.id === 'bgimg' && el.fit !== 'custom') { const b = imageBox(el, S.doc, 0); if (b) { el.x = b.x; el.y = b.y; el.w = b.w; el.h = b.h; el.fit = 'custom'; } } }
function moveEl(el, dx, dy) {
  if (el.kind === 'row') { el.ox += dx; el.oy += dy; return; }
  if (el.kind === 'bg') return;
  if (el.id === 'bgimg') { if (el.fit === 'custom') { el.x += dx; el.y += dy; } else { el.dx = (el.dx || 0) + dx; el.dy = (el.dy || 0) + dy; } return; }
  if (el.x != null) el.x += dx; if (el.y != null) el.y += dy;
}
function startDrag(e, ids, startPt) {
  const els = ids.map(id => elById(id)).filter(el => el && !el.locked); if (!els.length || S.lock) return;
  const orig = els.map(el => ({ el, x: el.x, y: el.y, ox: el.ox, oy: el.oy, dx: el.dx, dy: el.dy }));
  const box = selBBox(ids); let moved = false;
  const mv = ev => {
    let dx = toPt(ev)[0] - startPt[0], dy = toPt(ev)[1] - startPt[1];
    if (!moved && Math.hypot(dx, dy) * S.z < 3) return; moved = true;
    if (ev.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
    if (!ev.altKey && box) [dx, dy] = snapDelta(box, dx, dy, ids); else S.snapLines = [];
    orig.forEach(o => { Object.assign(o.el, { x: o.x, y: o.y, ox: o.ox, oy: o.oy, dx: o.dx, dy: o.dy }); moveEl(o.el, dx, dy); });
    redraw(); syncInspector();
  };
  const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); S.snapLines = []; if (moved) commit(); redraw(); };
  window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
}
function scaleElBy(el, f) {
  switch (el.kind) {
    case 'text': el.size *= f; el.lh *= f; if (el.fitW) el.fitW *= f; break;
    case 'pair': el.size *= f; break;
    case 'row': el.size *= f; break;
    case 'logo': el.w *= f; break;
    case 'image': if (el.id === 'bgimg') { el.zoom = clamp((el.zoom || 1) * f, 0.05, 12); break; } toCustomImage(el); el.w *= f; el.h *= f; break;
    case 'rect': el.w *= f; el.h *= f; break;
  }
}
function startResize(e, handle) {
  const el = selEls()[0]; if (!el) return; const b0 = elBBox(el, S.doc); const w0 = b0[2] - b0[0], h0 = b0[3] - b0[1];
  const anchor = [handle.includes('w') ? b0[2] : b0[0], handle.includes('n') ? b0[3] : b0[1]];
  const snap = JSON.parse(JSON.stringify(el)); toCustomImage(el); const snap2 = JSON.parse(JSON.stringify(el));
  const mv = ev => {
    const p = toPt(ev); Object.keys(snap2).forEach(k => el[k] = snap2[k]); delete el._by;
    let nw = Math.abs(p[0] - anchor[0]), nh = Math.abs(p[1] - anchor[1]);
    if (el.kind === 'rect' && !ev.shiftKey) { const x = Math.min(p[0], anchor[0]), y = Math.min(p[1], anchor[1]); el.x = x; el.y = y; el.w = Math.max(.5, nw); el.h = Math.max(.3, nh); }
    else {
      const f = clamp(Math.max(nw / w0, ev.shiftKey && el.kind === 'rect' ? nh / h0 : 0) || nw / w0, 0.05, 20); scaleElBy(el, f);
      const b1 = elBBox(el, S.doc); if (b1) { const a1 = [handle.includes('w') ? b1[2] : b1[0], handle.includes('n') ? b1[3] : b1[1]]; moveEl(el, anchor[0] - a1[0], anchor[1] - a1[1]); }
    }
    redraw(); syncInspector();
  };
  const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); commit(); redraw(); };
  window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
}
function scaleSelection(f, ids) {
  ids = ids || S.sel; const bb = selBBox(ids); if (!bb) return; const ax = (bb[0] + bb[2]) / 2, ay = (bb[1] + bb[3]) / 2; const els = ids.map(id => elById(id)).filter(e => e && e.id !== 'panel');
  const doc = S.doc; layoutRows(doc);
  els.forEach(el => {
    if (el.kind === 'row') { const tx = el.x + el.ox, by = el._by; scaleElBy(el, f); el.x = ax + (tx - ax) * f; el.ox = 0; el._pend = ay + (by - ay) * f; }
    else if (el.kind === 'rect' || el.kind === 'logo' || el.kind === 'image') { toCustomImage(el); el.x = ax + (el.x - ax) * f; el.y = ay + (el.y - ay) * f; scaleElBy(el, f); }
    else if (el.id === 'bgimg') { }
    else { el.x = ax + (el.x - ax) * f; el.y = ay + (el.y - ay) * f; scaleElBy(el, f); }
  });
  const rows = els.filter(e => e.kind === 'row');
  if (rows.length) { // new vertical layout of rows
    doc.rowPitch *= (rows.length === doc.sides.front.filter(e => e.kind === 'row').length) ? f : 1;
    rows.forEach(r => { r.oy = 0; });
    const all = doc.sides.front.filter(e => e.kind === 'row' && e.visible);
    const target = rows.filter(r => r.visible).sort((a, b) => a.slot - b.slot);
    if (target.length) { doc.rowBottom = target[target.length - 1]._pend; }
    rows.forEach(r => delete r._pend);
  }
  commit(); redraw(); syncInspector();
}

/* ====================== pointer handling on canvas ====================== */
function initCanvas() {
  const svg = ws();
  svg.addEventListener('pointerdown', e => {
    if (e.button !== 0) return; const p = toPt(e);
    const hd = e.target.closest && e.target.closest('[data-h]'); if (hd) { e.preventDefault(); startResize(e, hd.dataset.h); return; }
    const gd = e.target.closest && e.target.closest('[data-guide]');
    if (gd) { e.preventDefault(); startGuideDrag(gd.dataset.guide); return; }
    let el = hitTest(p, e.altKey);
    // inside current multi-selection box -> drag all
    if (!el && S.sel.length > 1 && S.curBox && p[0] >= S.curBox[0] && p[0] <= S.curBox[2] && p[1] >= S.curBox[1] && p[1] <= S.curBox[3]) { startDrag(e, S.sel, p); return; }
    if (!el) { if (!e.shiftKey) { S.sel = []; refreshSel(); } return; }
    if (e.shiftKey) { S.sel = S.sel.includes(el.id) ? S.sel.filter(i => i !== el.id) : [...S.sel, el.id]; refreshSel(); return; }
    if (!S.sel.includes(el.id)) { S.sel = [el.id]; refreshSel(); }
    e.preventDefault(); startDrag(e, S.sel, p);
  });
  svg.addEventListener('dblclick', e => {
    const gd = e.target.closest && e.target.closest('[data-guide]'); if (gd) { const [k, i] = gd.dataset.guide.split(':'); S.doc.guides[S.side][k].splice(+i, 1); commit(); drawOverlay(); return; }
    const el = hitTest(toPt(e), e.altKey); if (el && ['text', 'pair', 'row'].includes(el.kind)) { S.tab = 'content'; showTab(); const inp = $(`[data-focus="${el.id}"]`); if (inp) { inp.focus(); inp.select && inp.select(); } }
  });
  $('#scroll').addEventListener('pointermove', rulerCursor); $('#scroll').addEventListener('pointerleave', () => { $('#curX').style.left = '-5px'; $('#curY').style.top = '-5px'; });
  $('#scroll').addEventListener('scroll', () => { drawRulers(); });
  $('#scroll').addEventListener('wheel', e => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); setZoom(S.z * (e.deltaY < 0 ? 1.1 : 0.9)); } }, { passive: false });
  // guides from rulers
  [['#rulerTop', 'h'], ['#rulerLeft', 'v']].forEach(([sel, kind]) => $(sel).addEventListener('pointerdown', e => { e.preventDefault(); const gd = S.doc.guides[S.side]; gd[kind].push(0); startGuideDrag(kind + ':' + (gd[kind].length - 1), true); }));
  window.addEventListener('resize', () => { applyZoom(); });
}
function startGuideDrag(key, isNew) {
  const [k, i] = key.split(':'); const arr = S.doc.guides[S.side][k]; let last = null;
  const mv = ev => { const p = toPt(ev); let v = k === 'v' ? p[0] : p[1]; if (S.snap) { const cands = k === 'v' ? [0, W / 2, W] : [0, H / 2, H]; cands.forEach(c => { if (Math.abs(c - v) < 4 / S.z) v = c; }); } arr[i] = v; last = ev; S.showGuides = true; drawOverlay(); const lbl = $('#coords'); lbl.textContent = `${k === 'v' ? 'x' : 'y'} ${r2(mm(v))} mm (guide)`; };
  const up = ev => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up);
    const sc = $('#scroll').getBoundingClientRect(); const out = ev.clientX < sc.left + 20 || ev.clientY < sc.top + 20 || ev.clientX > sc.right || ev.clientY > sc.bottom;
    if (out || (isNew && !last)) arr.splice(i, 1); commit(); drawOverlay(); };
  window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
}
function refreshSel() { drawOverlay(); buildInspector(); syncLayerSel(); if (typeof buildImages === 'function') { buildImages(); } const ab = $('#adjBar'); if (ab) ab.style.display = (KIOSK && S.sel.includes('bgimg')) ? '' : 'none'; }

/* ====================== keyboard ====================== */
function typing(e) { const t = e.target; return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable); }
window.addEventListener('keydown', e => {
  if (typing(e)) return; const mod = e.ctrlKey || e.metaKey;
  if (KIOSK && !(e.key === 'Escape' || e.key.startsWith('Arrow') || (mod && ['z', 'y'].includes(e.key.toLowerCase())))) return;
  if (KIOSK && e.key.startsWith('Arrow') && !S.sel.includes('bgimg')) return;
  if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
  if (mod && e.key.toLowerCase() === 'a') { e.preventDefault(); S.sel = curEls().filter(el => !['bg', 'bgimg'].includes(el.kind) && el.id !== 'panel' && el.visible).map(el => el.id); refreshSel(); return; }
  if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); dupSel(); return; }
  if (e.key === 'Escape') { S.sel = []; refreshSel(); return; }
  if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); delSel(); return; }
  if (e.key === 'h' && !mod) { toggleSelVisible(); return; }
  if (e.key.startsWith('Arrow') && S.sel.length && !S.lock) {
    e.preventDefault(); const st = (e.shiftKey ? 1 : 0.1) * MM * (e.altKey ? 0.1 : 1); const dx = e.key === 'ArrowLeft' ? -st : e.key === 'ArrowRight' ? st : 0, dy = e.key === 'ArrowUp' ? -st : e.key === 'ArrowDown' ? st : 0;
    selEls().filter(x => !x.locked).forEach(el => moveEl(el, dx, dy)); commit(); redraw(); syncInspector();
  }
});
function delSel() {
  const els = selEls(); if (!els.length) return; const keepBase = ['bg', 'bgimg', 'panel', 'logo', 'name', 'title', 'rule', 'brn', 'orn', 'address', 'tagline', 'r_mobile', 'r_tel', 'r_mail', 'r_web'];
  els.forEach(el => { if (keepBase.includes(el.id)) { if (el.id === 'bgimg') { el.asset = null; } el.visible = false; } else S.doc.sides[S.side] = S.doc.sides[S.side].filter(x => x.id !== el.id); });
  S.sel = S.sel.filter(id => elById(id) && elById(id).visible); commit(); fullRefresh();
}
function toggleSelVisible() { selEls().forEach(el => el.visible = !el.visible); commit(); fullRefresh(); }
function dupSel() {
  const out = []; selEls().forEach(el => { const c = JSON.parse(JSON.stringify(el)); c.id = uid('c'); c.name = el.name + ' copy'; moveEl(c, 3, 3); if (c.kind === 'row') { layoutRows(S.doc); Object.assign(c, { kind: 'text', x: el.x + el.ox, y: el._by, wt: el.wt, lh: 8.6, wsp: 0, align: 'left', upper: false, fitW: 0 }); delete c.ox; delete c.oy; delete c.slot; moveEl(c, 3, 3); } const arr = S.doc.sides[S.side]; arr.splice(arr.indexOf(el) + 1, 0, c); out.push(c.id); });
  S.sel = out; commit(); fullRefresh();
}
