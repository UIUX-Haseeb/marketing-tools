/* ====================== helpers: download / zip ====================== */
function download(blob, name) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.append(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
}
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u) { let c = 0xFFFFFFFF; for (let i = 0; i < u.length; i++) c = CRC[(c ^ u[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function makeZip(files) { // files: [{name, data:Uint8Array}] stored, no compression
  const enc = new TextEncoder(); const parts = []; const central = []; let off = 0;
  const d = new Date(); const dt = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)), dd = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate());
  files.forEach(f => {
    const nm = enc.encode(f.name), crc = crc32(f.data), sz = f.data.length;
    const lh = new DataView(new ArrayBuffer(30)); lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true); lh.setUint16(10, dt, true); lh.setUint16(12, dd, true); lh.setUint32(14, crc, true); lh.setUint32(18, sz, true); lh.setUint32(22, sz, true); lh.setUint16(26, nm.length, true); lh.setUint16(28, 0, true);
    parts.push(new Uint8Array(lh.buffer), nm, f.data);
    const ch = new DataView(new ArrayBuffer(46)); ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true); ch.setUint16(12, dt, true); ch.setUint16(14, dd, true); ch.setUint32(16, crc, true); ch.setUint32(20, sz, true); ch.setUint32(24, sz, true); ch.setUint16(28, nm.length, true); ch.setUint32(42, off, true);
    central.push(new Uint8Array(ch.buffer), nm); off += 30 + nm.length + sz;
  });
  let cs = 0; central.forEach(c => cs += c.length);
  const end = new DataView(new ArrayBuffer(22)); end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, cs, true); end.setUint32(16, off, true);
  return new Blob([...parts, ...central, new Uint8Array(end.buffer)], { type: 'application/zip' });
}

/* ====================== raster export ====================== */
function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('image load failed')); i.src = src; }); }
async function rasterize(doc, side, o) { // o: dpi, bleed, type ('image/png'|'image/jpeg'), q
  const b = o.bleed || 0; const wpx = Math.round((W + 2 * b) / 72 * o.dpi), hpx = Math.round((H + 2 * b) / 72 * o.dpi);
  const svg = buildSVG(doc, side, { bleed: b });
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = await loadImg(url);
    const cv = document.createElement('canvas'); cv.width = wpx; cv.height = hpx; const cx = cv.getContext('2d');
    if (o.type === 'image/jpeg') { cx.fillStyle = '#fff'; cx.fillRect(0, 0, wpx, hpx); }
    cx.drawImage(img, 0, 0, wpx, hpx);
    return { cv, wpx, hpx };
  } finally { URL.revokeObjectURL(url); }
}
const canvasBlob = (cv, type, q) => new Promise(r => cv.toBlob(r, type, q));

/* ====================== PDF writer ====================== */
async function deflate(u8) {
  if (typeof CompressionStream === 'undefined') return null;
  try { const cs = new CompressionStream('deflate'); const w = cs.writable.getWriter(); w.write(u8); w.close(); return new Uint8Array(await new Response(cs.readable).arrayBuffer()); } catch (e) { return null; }
}
class PDFDoc {
  constructor() { this.objs = []; this.enc = new TextEncoder(); }
  reserve() { this.objs.push(null); return this.objs.length; }
  set(id, dict, stream) { this.objs[id - 1] = { dict, stream }; return id; }
  add(dict, stream) { this.objs.push({ dict, stream }); return this.objs.length; }
  build(rootId, infoId) {
    const parts = []; const offs = []; let pos = 0; const push = u => { parts.push(u); pos += u.length; };
    push(this.enc.encode('%PDF-1.6\n%\xE2\xE3\xCF\xD3\n'));
    this.objs.forEach((o, i) => {
      offs[i] = pos; push(this.enc.encode(`${i + 1} 0 obj\n`));
      if (o.stream) { push(this.enc.encode(o.dict.replace(/>>\s*$/, `/Length ${o.stream.length} >>`) + '\nstream\n')); push(o.stream); push(this.enc.encode('\nendstream')); }
      else push(this.enc.encode(o.dict));
      push(this.enc.encode('\nendobj\n'));
    });
    const xr = pos; let x = `xref\n0 ${this.objs.length + 1}\n0000000000 65535 f \n`;
    offs.forEach(o => x += String(o).padStart(10, '0') + ' 00000 n \n');
    x += `trailer\n<< /Size ${this.objs.length + 1} /Root ${rootId} 0 R${infoId ? ` /Info ${infoId} 0 R` : ''} >>\nstartxref\n${xr}\n%%EOF`;
    push(this.enc.encode(x));
    return new Blob(parts, { type: 'application/pdf' });
  }
}
const n3 = v => (+v.toFixed(3)).toString();
function hexRGB(hx) { hx = hx.replace('#', ''); if (hx.length === 3) hx = hx.split('').map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(hx.substr(i, 2), 16) / 255); }

async function imageForPdf(asset, pxW, pxH) {
  // returns {w,h,filter,data,smask?}
  const img = await loadImg(asset.url);
  const cv = document.createElement('canvas'); cv.width = pxW; cv.height = pxH; const cx = cv.getContext('2d', { willReadFrequently: true });
  cx.drawImage(img, 0, 0, pxW, pxH);
  const px = cx.getImageData(0, 0, pxW, pxH).data; let alpha = false;
  for (let i = 3; i < px.length; i += 4) if (px[i] < 250) { alpha = true; break; }
  if (!alpha) {
    const cv2 = document.createElement('canvas'); cv2.width = pxW; cv2.height = pxH; const c2 = cv2.getContext('2d'); c2.fillStyle = '#fff'; c2.fillRect(0, 0, pxW, pxH); c2.drawImage(img, 0, 0, pxW, pxH);
    const blob = await canvasBlob(cv2, 'image/jpeg', 0.95);
    return { w: pxW, h: pxH, jpeg: new Uint8Array(await blob.arrayBuffer()) };
  }
  const rgb = new Uint8Array(pxW * pxH * 3), a = new Uint8Array(pxW * pxH);
  for (let i = 0, j = 0, k = 0; i < px.length; i += 4, j += 3, k++) {
    const al = px[i + 3]; a[k] = al;
    if (al === 0) { rgb[j] = rgb[j + 1] = rgb[j + 2] = 255; } else if (al === 255) { rgb[j] = px[i]; rgb[j + 1] = px[i + 1]; rgb[j + 2] = px[i + 2]; }
    else { rgb[j] = Math.min(255, px[i] * 255 / al); rgb[j + 1] = Math.min(255, px[i + 1] * 255 / al); rgb[j + 2] = Math.min(255, px[i + 2] * 255 / al); }
  }
  return { w: pxW, h: pxH, rgb, alpha: a };
}

async function buildPDF(doc, sides, o) {
  // o: {marks:boolean, bleed:pt, fileName, imgDpi}
  const b = o.bleed || 0; const M = o.marks ? 33 + b : b;
  const PW = W + 2 * M, PH = H + 2 * M; const enc = new TextEncoder();
  const pdf = new PDFDoc(); const catalog = pdf.reserve(), pages = pdf.reserve();
  const fontCour = pdf.add('<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>');
  const pageIds = [];
  const pageXY = (x, y) => [M + x, PH - (M + y)];
  for (let si = 0; si < sides.length; si++) {
    const side = sides[si]; const prims = sidePrims(doc, side, b);
    let cs = ''; const xobjs = {}; const gss = {}; let nImg = 0;
    const gs = op => { const k = 'G' + Math.round(op * 1000); if (!gss[k]) gss[k] = op; return k; };
    // artwork, clipped to bleed box
    const [cx0, cy0] = pageXY(-b, H + b);
    cs += `q ${n3(cx0)} ${n3(cy0)} ${n3(W + 2 * b)} ${n3(H + 2 * b)} re W n\n`;
    for (const p of prims) {
      if (p.t === 'p') {
        const [r, g, bl] = hexRGB(p.fill); let ops = '';
        walk(p.d, (c, pts) => {
          const q = pts.map(pp => { const t = ap(p.m || I, pp[0], pp[1]); return pageXY(t[0], t[1]); });
          if (c === 'M') ops += `${n3(q[0][0])} ${n3(q[0][1])} m\n`;
          else if (c === 'L') ops += `${n3(q[0][0])} ${n3(q[0][1])} l\n`;
          else if (c === 'C') ops += `${n3(q[0][0])} ${n3(q[0][1])} ${n3(q[1][0])} ${n3(q[1][1])} ${n3(q[2][0])} ${n3(q[2][1])} c\n`;
          else if (c === 'Z') ops += 'h\n';
        });
        cs += `q ${p.op < 1 ? '/' + gs(p.op) + ' gs ' : ''}${n3(r)} ${n3(g)} ${n3(bl)} rg\n${ops}f\nQ\n`;
      } else {
        const a = p.asset; const pxW = clamp(Math.round(p.w / 72 * (o.imgDpi || 600)), 8, 6000), pxH = clamp(Math.round(p.h / 72 * (o.imgDpi || 600)), 8, 6000);
        const sc2 = Math.min(1, a.mime === 'image/svg+xml' ? 1 : a.w / pxW);
        const tw = a.mime === 'image/svg+xml' ? pxW : Math.min(pxW, a.w), th = a.mime === 'image/svg+xml' ? pxH : Math.min(pxH, a.h);
        const im = await imageForPdf(a, Math.max(1, Math.round(tw)), Math.max(1, Math.round(th)));
        const name = 'Im' + (++nImg); let smask = null;
        if (im.jpeg) xobjs[name] = pdf.add(`<< /Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode >>`, im.jpeg);
        else {
          const mk = async (u8, base) => { const z = await deflate(u8); return pdf.add(base.replace(/>>$/, z ? '/Filter /FlateDecode >>' : '>>'), z || u8); };
          const sm = await mk(im.alpha, `<< /Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /ColorSpace /DeviceGray /BitsPerComponent 8 >>`);
          xobjs[name] = await mk(im.rgb, `<< /Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /SMask ${sm} 0 R >>`);
        }
        const T = (u, v) => { let lx = p.x + (p.flipX ? (1 - u) : u) * p.w, ly = p.y + (1 - v) * p.h; const t = ap(p.m || I, lx, ly); return pageXY(t[0], t[1]); };
        const o0 = T(0, 0), o1 = T(1, 0), o2 = T(0, 1);
        cs += `q ${p.op < 1 ? '/' + gs(p.op) + ' gs ' : ''}${n3(o1[0] - o0[0])} ${n3(o1[1] - o0[1])} ${n3(o2[0] - o0[0])} ${n3(o2[1] - o0[1])} ${n3(o0[0])} ${n3(o0[1])} cm /${name} Do Q\n`;
      }
    }
    cs += 'Q\n';
    if (o.marks) cs += printerMarks(M, b, PW, PH, `${o.fileName}.pdf   ${si + 1}`);
    const bytes = enc.encode(cs); const z = await deflate(bytes);
    const content = pdf.add(z ? '<< /Filter /FlateDecode >>' : '<< >>', z || bytes);
    const gsd = Object.keys(gss).map(k => `/${k} << /ca ${gss[k]} /CA ${gss[k]} >>`).join(' ');
    const xo = Object.keys(xobjs).map(k => `/${k} ${xobjs[k]} 0 R`).join(' ');
    const trim = [M, M, M + W, M + H].map(n3).join(' '), bleedB = [M - b, M - b, M + W + b, M + H + b].map(n3).join(' ');
    pageIds.push(pdf.add(`<< /Type /Page /Parent ${pages} 0 R /MediaBox [0 0 ${n3(PW)} ${n3(PH)}] /TrimBox [${trim}] /BleedBox [${bleedB}] /ArtBox [${trim}] /Resources << /ProcSet [/PDF /ImageB /ImageC] /Font << /F1 ${fontCour} 0 R >> /XObject << ${xo} >> /ExtGState << ${gsd} >> >> /Contents ${content} 0 R >>`));
  }
  pdf.set(pages, `<< /Type /Pages /Kids [${pageIds.map(i => i + ' 0 R').join(' ')}] /Count ${pageIds.length} >>`);
  pdf.set(catalog, `<< /Type /Catalog /Pages ${pages} 0 R >>`);
  const info = pdf.add(`<< /Title (${o.fileName.replace(/[^\x20-\x7E]/g, '?').replace(/([()\\])/g, '\\$1')}) /Creator (Provident Business Card Studio) /Producer (Provident Business Card Studio) >>`);
  return pdf.build(catalog, info);
}

/* Printer's marks, laid out after the Illustrator print files supplied (crop marks, registration targets, colour bars, grey ramp, star targets, page info). */
function printerMarks(M, b, PW, PH, info) {
  let s = ''; const X = x => n3(x), Y = y => n3(PH - y); // y measured from top
  const tl = M, tt = M, tr_ = M + W, tb = M + H; const off = 6 + b;
  s = 'q 1 1 1 1 K 0.25 w\n';
  [tl, tr_].forEach((x, i) => [tt, tb].forEach((y, j) => {
    const dx = i === 0 ? -1 : 1, dy = j === 0 ? -1 : 1;
    s += `${X(x + dx * off)} ${Y(y)} m ${X(i === 0 ? 0 : PW)} ${Y(y)} l S\n`;
    s += `${X(x)} ${Y(y + dy * off)} m ${X(x)} ${Y(j === 0 ? 0 : PH)} l S\n`;
  }));
  // registration targets
  const reg = (cx, cy) => {
    const r = 4.2, k = 0.5523 * r; let t = '';
    t += `${X(cx + r)} ${Y(cy)} m ${X(cx + r)} ${Y(cy - k)} ${X(cx + k)} ${Y(cy - r)} ${X(cx)} ${Y(cy - r)} c ${X(cx - k)} ${Y(cy - r)} ${X(cx - r)} ${Y(cy - k)} ${X(cx - r)} ${Y(cy)} c ${X(cx - r)} ${Y(cy + k)} ${X(cx - k)} ${Y(cy + r)} ${X(cx)} ${Y(cy + r)} c ${X(cx + k)} ${Y(cy + r)} ${X(cx + r)} ${Y(cy + k)} ${X(cx + r)} ${Y(cy)} c S\n`;
    t += `${X(cx - 7.5)} ${Y(cy)} m ${X(cx + 7.5)} ${Y(cy)} l S ${X(cx)} ${Y(cy - 7.5)} m ${X(cx)} ${Y(cy + 7.5)} l S\n`;
    const r2_ = 2, k2 = 0.5523 * r2_;
    t += `${X(cx + r2_)} ${Y(cy)} m ${X(cx + r2_)} ${Y(cy - k2)} ${X(cx + k2)} ${Y(cy - r2_)} ${X(cx)} ${Y(cy - r2_)} c ${X(cx - k2)} ${Y(cy - r2_)} ${X(cx - r2_)} ${Y(cy - k2)} ${X(cx - r2_)} ${Y(cy)} c ${X(cx - r2_)} ${Y(cy + k2)} ${X(cx - k2)} ${Y(cy + r2_)} ${X(cx)} ${Y(cy + r2_)} c ${X(cx + k2)} ${Y(cy + r2_)} ${X(cx + r2_)} ${Y(cy + k2)} ${X(cx + r2_)} ${Y(cy)} c f\n`;
    return t;
  };
  const ex = M * 0.435, ey = M * 0.436; // centre of the margin strip
  s += 'q 1 1 1 1 k\n';
  s += reg(tl + 14.9, ey) + reg(tr_ - 17.2, ey) + reg(tl + 14.9, PH - ey) + reg(tr_ - 17.2, PH - ey);
  s += reg(ex, tt + 18.5) + reg(ex, tb - 16) + reg(PW - ex, tt + 18.5) + reg(PW - ex, tb - 16);
  s += 'Q\n';
  // star targets (top-left, bottom-right)
  const star = (cx, cy, r) => { let t = ''; const n = 36; for (let i = 0; i < n; i += 2) { const a0 = i / n * 2 * Math.PI, a1 = (i + 1) / n * 2 * Math.PI; t += `${X(cx)} ${Y(cy)} m ${X(cx + r * Math.cos(a0))} ${Y(cy + r * Math.sin(a0))} l ${X(cx + r * Math.cos(a1))} ${Y(cy + r * Math.sin(a1))} l h f\n`; } return t; };
  s += 'q 1 1 1 1 k\n' + star(M * 0.5, ey, 9) + star(PW - M * 0.41, PH - ey + 1.5, 9) + 'Q\n';
  // colour bars
  const bars = [['C', '1 0 0 0'], ['M', '0 1 0 0'], ['Y', '0 0 1 0'], ['CM', '1 1 0 0'], ['MY', '0 1 1 0'], ['CY', '1 0 1 0'], ['CMY', '1 1 1 0'], ['K', '0 0 0 1']];
  const bh = 14.4, by0 = tt + 19, lx = M * 0.185, bw = 13.7, rx = PW - M * 0.63;
  bars.forEach(([n, c], i) => {
    s += `${c} k ${X(lx)} ${Y(by0 + (i + 1) * bh)} ${bw} ${bh} re f\n${c} k ${X(rx)} ${Y(by0 + (i + 1) * bh)} ${bw} ${bh} re f\n`;
    const dark = (n === 'CM' || n === 'CMY' || n === 'K' || n === 'MY') ? '1 g' : '0 g';
    s += `BT /F1 4.5 Tf ${dark} ${X(lx + bw / 2 - n.length * 1.35)} ${Y(by0 + i * bh + bh / 2 + 1.5)} Td (${n}) Tj ET\n`;
  });
  // grey ramp
  const gy = tb + M * 0.33, gh = M * 0.49; // top edge from page top
  for (let i = 0; i < 10; i++) s += `0 0 0 ${(1 - i / 10).toFixed(2)} k ${X(tl + 45.5 + i * 15)} ${Y(gy + gh)} 15 ${n3(gh)} re f\n`;
  // page info (top right)
  const txt = info.replace(/[^\x20-\x7E]/g, '?').replace(/([()\\])/g, '\\$1');
  const wTxt = txt.length * 3.6;
  s += `BT /F1 6 Tf 0 0 0 1 k ${X(PW - 2.5 - wTxt)} ${Y(11.3)} Td (${txt}) Tj ET\n`;
  s += 'Q\n'; return s;
}
