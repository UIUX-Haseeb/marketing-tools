/* ====================== refresh / tabs / modes ====================== */
function fullRefresh(light) {
  if (light) { syncInspector(); redraw(); drawOverlay(); buildLayersLight(); return; }
  S.binds = []; buildContent(); buildImages(); buildDesign(); buildLayers(); buildInspector(); $('#adjBar').style.display = (KIOSK && S.sel.includes('bgimg')) ? '' : 'none'; drawCanvas(); applyZoomLight(); syncTop(); syncInspector();
}
function buildLayersLight() { buildLayers(); }
function applyZoomLight() { drawRulers(); }
function showTab() { $$('.tab').forEach(t => t.classList.toggle('on', t.dataset.tab === S.tab)); $$('.pane').forEach(p => p.classList.toggle('on', p.id === 'pane-' + S.tab)); }
function setSide(s) { S.side = s; S.sel = []; fullRefresh(); }
function setMode(m, reset) {
  const first = !!S.doc;
  applyMode(S.doc, m, true); S.sel = [];
  if (m === 'sub') { ['front', 'back'].forEach(s => { const l = elById('logo', s); if (l && !S.doc.assets[l.asset]) { l.src = 'upload'; applyLibraryLogo(LOGOS[0], s, s === 'back' ? 'white' : 'color'); } }); }
  else { ['front', 'back'].forEach(s => { const l = elById('logo', s); if (l && !S.doc.assets[l.asset]) l.src = 'brand'; }); }
  commit(); fullRefresh();
}
function syncTop() {
  $$('#modeSeg button').forEach(b => b.classList.toggle('on', b.dataset.mode === S.doc.mode));
  $$('#sideSeg button').forEach(b => b.classList.toggle('on', b.dataset.side === S.side));
  $('#modeNote').textContent = MODES[S.doc.mode].note; $('#lockBtn').classList.toggle('on', S.lock); $('#lockBtn').textContent = S.lock ? '🔒 Layout locked' : '🔓 Free edit';
  $('#snapBtn').classList.toggle('on', S.snap);
  syncHistBtns();
}

/* ====================== file save / open ====================== */
function saveDesign() { download(new Blob([JSON.stringify(S.doc)], { type: 'application/json' }), (S.doc.fileName || 'Business Card') + '.bcard.json'); toast('Design file saved — open it again with “Open”'); }
function openDesign() {
  pickFile('.json,application/json', f => { const fr = new FileReader(); fr.onload = () => { try { const d = JSON.parse(fr.result); if (!d.sides) throw 0; if (!MODES[d.mode]) d.mode = 'agents'; S.doc = d; S.doc.flow = !ADMIN; S.doc.guides = S.doc.guides || { front: { v: [], h: [] }, back: { v: [], h: [] } }; S.doc.assets = S.doc.assets || {}; S.hist = []; S.hi = -1; S.sel = []; pushHist(); fullRefresh(); setZoom(1, true); toast('Design opened'); } catch (e) { toast('That is not a Business Card Studio file'); } }; fr.readAsText(f); });
}
function resetAll() { if (!confirm('Start again from the ' + MODES[S.doc.mode].label + ' template? Your edits will be cleared.')) return; const m = S.doc.mode; S.doc = newDoc(m); S.doc.flow = !ADMIN; S.hist = []; S.hi = -1; S.sel = []; pushHist(); fullRefresh(); }

/* ====================== export ====================== */
const safeName = s => (s || 'Business Card').replace(/[\\/:*?"<>|]+/g, '-').trim() || 'Business Card';
function exportOpts() {
  const f = $('#expForm'); const v = n => f.elements[n].value;
  return { fmt: v('fmt'), sides: v('sides'), bleedMM: parseFloat(v('bleed')) || 0, marks: f.elements.marks.checked, dpi: parseInt(v('dpi')), q: parseFloat(v('q')), live: f.elements.live.checked, name: safeName(v('fname')) };
}
function syncExportForm() {
  const o = exportOpts(); const f = $('#expForm');
  const isPdf = o.fmt === 'pdfprint' || o.fmt === 'pdfdigital', isRaster = o.fmt === 'png' || o.fmt === 'jpg';
  $('#rowMarks').style.display = o.fmt === 'pdfprint' ? '' : 'none'; $('#rowDpi').style.display = isRaster ? '' : 'none'; $('#rowQ').style.display = o.fmt === 'jpg' ? '' : 'none'; $('#rowLive').style.display = o.fmt === 'svg' ? '' : 'none';
  $('#rowBleed').style.display = o.fmt === 'pdfdigital' ? 'none' : '';
  const b = pt(o.bleedMM), wpx = Math.round((W + 2 * b) / 72 * o.dpi), hpx = Math.round((H + 2 * b) / 72 * o.dpi);
  let note = '';
  if (o.fmt === 'pdfprint') note = `Trim 85 × 55 mm${o.bleedMM ? ' + ' + o.bleedMM + ' mm bleed' : ''}${o.marks ? ' with crop marks, registration targets, colour bars and page info — the same layout as your printing PDFs.' : '.'} Text is outlined, so no fonts are needed at the printer.`;
  if (o.fmt === 'pdfdigital') note = 'Page is exactly 85 × 55 mm (like your digital card PDFs). Text outlined, logo and icons vector.';
  if (o.fmt === 'svg') note = 'Vector SVG. Text is outlined by default so it opens identically everywhere; tick “live text” to keep it editable (needs Google Sans Flex installed).';
  if (o.fmt === 'png') note = `PNG, ${wpx} × ${hpx} px (${o.dpi} dpi).`;
  if (o.fmt === 'jpg') note = `JPEG, ${wpx} × ${hpx} px (${o.dpi} dpi).`;
  $('#expNote').textContent = note;
  const l = elById('logo', 'front'); const warn = S.doc.mode === 'sub' && (!S.doc.assets[elById('logo', 'front').asset] && elById('logo', 'front').visible);
  $('#expWarn').style.display = warn ? '' : 'none';
}
async function runExport() {
  const o = exportOpts(); const doc = S.doc; const sides = o.sides === 'both' ? ['front', 'back'] : [o.sides]; const b = pt(o.bleedMM);
  const btn = $('#expGo'); btn.disabled = true; btn.textContent = 'Preparing…';
  try {
    if (o.fmt === 'pdfprint' || o.fmt === 'pdfdigital') {
      const blob = await buildPDF(doc, sides, { marks: o.fmt === 'pdfprint' && o.marks, bleed: o.fmt === 'pdfdigital' ? 0 : b, fileName: o.name, imgDpi: 600 });
      download(blob, o.name + (o.sides === 'both' ? '' : ' - ' + (o.sides === 'front' ? 'Front' : 'Back')) + '.pdf');
    } else {
      const files = [];
      for (const s of sides) {
        const tag = sides.length > 1 ? ' - ' + (s === 'front' ? 'Front' : 'Back') : (o.sides === 'front' ? ' - Front' : ' - Back');
        if (o.fmt === 'svg') files.push({ name: o.name + tag + '.svg', data: new TextEncoder().encode(buildSVG(doc, s, { bleed: b, live: o.live })) });
        else { const type = o.fmt === 'png' ? 'image/png' : 'image/jpeg'; const r = await rasterize(doc, s, { dpi: o.dpi, bleed: b, type }); const blob = await canvasBlob(r.cv, type, o.q); files.push({ name: o.name + tag + (o.fmt === 'png' ? '.png' : '.jpg'), data: new Uint8Array(await blob.arrayBuffer()) }); }
      }
      if (files.length === 1) download(new Blob([files[0].data], { type: o.fmt === 'svg' ? 'image/svg+xml' : o.fmt === 'png' ? 'image/png' : 'image/jpeg' }), files[0].name);
      else download(makeZip(files), o.name + ' (' + o.fmt.toUpperCase() + ').zip');
    }
    toast('Downloaded ✓'); $('#expDlg').close();
  } catch (e) { console.error(e); toast('Export failed: ' + (e && e.message || e), 5000); }
  btn.disabled = false; btn.textContent = 'Download';
}

/* ====================== init ====================== */
function init() {
  let doc = null;
  try { if (KIOSK) { localStorage.removeItem(LS_KEY); localStorage.removeItem(LS_KEY + '-admin'); } const raw = KIOSK ? null : localStorage.getItem(LS_KEY); if (raw) { doc = JSON.parse(raw); if (!doc.sides) doc = null; } } catch (e) { }
  if (doc && !MODES[doc.mode]) doc = null;
  S.doc = doc || newDoc('agents'); S.doc.flow = !ADMIN; document.body.classList.toggle('kiosk', KIOSK); if (!S.doc.assets) S.doc.assets = {}; if (!S.doc.guides) S.doc.guides = { front: { v: [], h: [] }, back: { v: [], h: [] } };
  if (S.doc.rowBottom == null) { S.doc.rowBottom = ROW_BASE[3]; S.doc.rowPitch = ROW_PITCH; }
  $('#modeSeg').innerHTML = ''; Object.keys(MODES).forEach(m => $('#modeSeg').append(h('button', { 'data-mode': m, onclick: () => setMode(m) }, MODES[m].label)));
  $$('#sideSeg button').forEach(b => b.onclick = () => setSide(b.dataset.side));
  $$('.tab').forEach(t => t.onclick = () => { S.tab = t.dataset.tab; showTab(); });
  $('#adjDone').onclick = () => { S.sel = []; fullRefresh(); }; $('#undo').onclick = undo; $('#redo').onclick = redo; $('#saveBtn').onclick = saveDesign; $('#openBtn').onclick = openDesign; $('#resetBtn').onclick = resetAll;
  $('#lockBtn').onclick = () => { S.lock = !S.lock; syncTop(); drawOverlay(); toast(S.lock ? 'Layout locked — text and images can still be edited, nothing can be dragged.' : 'Free edit on'); };
  $('#snapBtn').onclick = () => { S.snap = !S.snap; syncTop(); buildDesign(); };
  $('#zin').onclick = () => setZoom(S.z * 1.2); $('#zout').onclick = () => setZoom(S.z / 1.2); $('#zfit').onclick = () => setZoom(1, true);
  $('#expBtn').onclick = () => { const n = $('#expForm').elements.fname; if (!n.value) n.value = S.doc.fileName || 'Business Card'; syncExportForm(); $('#expDlg').showModal(); };
  $('#expForm').addEventListener('input', syncExportForm); $('#expForm').addEventListener('change', syncExportForm);
  $('#expForm').elements.fname.addEventListener('input', e => { S.doc.fileName = e.target.value; });
  $('#expGo').onclick = runExport; $('#expCancel').onclick = () => $('#expDlg').close();
  $('#expForm').addEventListener('submit', e => e.preventDefault());
  initCanvas(); pushHist(); showTab(); fullRefresh(); applyZoom();
  new ResizeObserver(() => { if (S.fit) applyZoom(); else drawRulers(); }).observe($('#scroll'));
  window.addEventListener('beforeunload', () => { if (KIOSK) return; try { localStorage.setItem(LS_KEY, JSON.stringify(S.doc)); } catch (e) { } });
}
document.addEventListener('DOMContentLoaded', init);
