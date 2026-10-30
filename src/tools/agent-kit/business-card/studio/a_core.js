'use strict';
/* ====================== constants ====================== */
const MM = 72 / 25.4, W = 85 * MM, H = 55 * MM;
const C = { navy: '#1E273D', muted: '#666D7F', brass: '#AA8B4C', orange: '#F26530', paper: '#FCFBF7', white: '#FFFFFF' };
const PALETTE = [['Navy', '#1E273D'], ['Deep Navy', '#1A2942'], ['Provident Navy', '#2F4960'], ['Paper', '#FCFBF7'], ['Cream', '#F4F1EC'], ['White', '#FFFFFF'], ['Mist', '#ECE7DF'], ['Stone', '#D4CFC4'], ['Muted', '#666D7F'], ['Charcoal', '#1A1A1A'], ['Brass', '#AA8B4C'], ['Orange', '#F26530']];
const ROW_BASE = [103.689, 115.042, 126.394, 137.747];
const ROW_PITCH = 11.3525;
const ICON_DX = -14.619;       // icon origin relative to the text origin (pt)
const ICON_SIZE_REF = 6.25;    // icon scale is size / 6.25
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const r2 = v => Math.round(v * 100) / 100;
const mm = pt => pt / MM;
const pt = m => m * MM;
function uid(p = 'x') { return p + Math.random().toString(36).slice(2, 8); }
function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    const v = attrs[k];
    if (v === false || v == null) continue;
    if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  kids.flat().forEach(k => { if (k == null || k === false) return; e.append(k.nodeType ? k : document.createTextNode(k)); });
  return e;
}

/* ====================== fonts ====================== */
const fonts = {};
function b64buf(b) { const s = atob(b); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u.buffer; }
for (const w in FONTS_B64) {
  const ab = b64buf(FONTS_B64[w]);
  fonts[w] = opentype.parse(ab.slice(0));
  try { const ff = new FontFace('GSF', ab, { weight: String(w) }); ff.load().then(f => document.fonts.add(f)).catch(() => { }); } catch (e) { }
}
const WEIGHTS = [[300, 'Light'], [400, 'Regular'], [500, 'Medium']];

/* ====================== matrix + path helpers ====================== */
const I = [1, 0, 0, 1, 0, 0];
const mul = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];
const ap = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
const tr = (x, y) => [1, 0, 0, 1, x, y];
const sc = (s, t) => [s, 0, 0, t == null ? s : t, 0, 0];
const rot = (deg, cx, cy) => { const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return mul(tr(cx, cy), mul([c, s, -s, c, 0, 0], tr(-cx, -cy))); };
const mat = m => 'matrix(' + m.map(v => +v.toFixed(5)).join(' ') + ')';

const pathCache = new Map();
function parsePath(d) {
  let r = pathCache.get(d); if (r) return r;
  const re = /([MLHVCQZmlhvcqz])|(-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)/g; let m; const segs = []; let cur = null;
  while ((m = re.exec(d))) { if (m[1]) { cur = { c: m[1], a: [] }; segs.push(cur); } else if (cur) cur.a.push(parseFloat(m[2])); }
  // expand implicit repeats
  const out = []; const n = { M: 2, L: 2, H: 1, V: 1, C: 6, Q: 4, Z: 0 };
  for (const s of segs) {
    const k = n[s.c.toUpperCase()]; if (k === 0) { out.push({ c: 'Z', a: [] }); continue; }
    for (let i = 0; i < s.a.length; i += k) out.push({ c: (i > 0 && s.c === 'M') ? 'L' : s.c, a: s.a.slice(i, i + k) });
  }
  pathCache.set(d, out); return out;
}
// iterate absolute points of a path -> callback(cmd, pts[])
function walk(d, fn) {
  let cx = 0, cy = 0, sx = 0, sy = 0;
  for (const s of parsePath(d)) {
    const a = s.a;
    switch (s.c) {
      case 'M': cx = a[0]; cy = a[1]; sx = cx; sy = cy; fn('M', [[cx, cy]]); break;
      case 'L': cx = a[0]; cy = a[1]; fn('L', [[cx, cy]]); break;
      case 'H': cx = a[0]; fn('L', [[cx, cy]]); break;
      case 'V': cy = a[0]; fn('L', [[cx, cy]]); break;
      case 'C': fn('C', [[a[0], a[1]], [a[2], a[3]], [a[4], a[5]]]); cx = a[4]; cy = a[5]; break;
      case 'Q': { const q = [a[0], a[1]], p = [a[2], a[3]];
        fn('C', [[cx + 2 / 3 * (q[0] - cx), cy + 2 / 3 * (q[1] - cy)], [p[0] + 2 / 3 * (q[0] - p[0]), p[1] + 2 / 3 * (q[1] - p[1])], p]); cx = p[0]; cy = p[1]; break; }
      case 'Z': cx = sx; cy = sy; fn('Z', []); break;
    }
  }
}
const bboxCache = new Map();
function localBBox(d) {
  let b = bboxCache.get(d); if (b) return b;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  walk(d, (c, pts) => pts.forEach(p => { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }));
  b = x0 > x1 ? null : [x0, y0, x1, y1]; bboxCache.set(d, b); return b;
}
function bboxUnion(a, b) { if (!a) return b; if (!b) return a; return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])]; }
function primBBox(p) {
  let box;
  if (p.t === 'p') box = localBBox(p.d); else box = [p.x, p.y, p.x + p.w, p.y + p.h];
  if (!box) return null;
  const pts = [[box[0], box[1]], [box[2], box[1]], [box[2], box[3]], [box[0], box[3]]].map(q => ap(p.m || I, q[0], q[1]));
  return [Math.min(...pts.map(q => q[0])), Math.min(...pts.map(q => q[1])), Math.max(...pts.map(q => q[0])), Math.max(...pts.map(q => q[1]))];
}
const rectD = (x, y, w, hh) => `M${x} ${y}H${x + w}V${y + hh}H${x}Z`;

/* ====================== text layout (outlined) ====================== */
const runCache = new Map();
function run(str, wt, size, track, wsp) {
  const key = str + '|' + wt + '|' + size + '|' + track + '|' + wsp;
  let r = runCache.get(key); if (r) return r;
  const f = fonts[wt] || fonts[400]; const gl = f.stringToGlyphs(str); const k = size / f.unitsPerEm; let x = 0, d = '';
  for (let i = 0; i < gl.length; i++) {
    const g = gl[i]; const p = g.getPath(x, 0, size);
    if (p.commands.length) d += p.toPathData(2);
    x += g.advanceWidth * k;
    if (i < gl.length - 1) { x += f.getKerningValue(g, gl[i + 1]) * k + track * size; if (str[i] === ' ') x += wsp * size; }
  }
  r = { d, adv: x }; if (runCache.size > 800) runCache.clear(); runCache.set(key, r); return r;
}
function spaceAdv(wt, size, track, wsp) { const f = fonts[wt] || fonts[400]; return f.charToGlyph(' ').advanceWidth * size / f.unitsPerEm + (2 * track + wsp) * size; }

/* ====================== assets ====================== */
// doc.assets[id] = {id,name,mime,url(dataURL),w,h}; runtime cache of object URLs
const objUrls = {};
function dataUrlToBlob(u) { const [h0, b] = u.split(','); const mime = /:(.*?);/.exec(h0)[1]; const bin = atob(b); const arr = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i); return new Blob([arr], { type: mime }); }
function assetHref(a) { if (!a) return ''; if (!objUrls[a.id]) { try { objUrls[a.id] = URL.createObjectURL(dataUrlToBlob(a.url)); } catch (e) { return a.url; } } return objUrls[a.id]; }
