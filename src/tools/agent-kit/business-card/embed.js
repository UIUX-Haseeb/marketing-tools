'use strict';
/* ====================== Prov Toys embedding ======================
 * NOT part of the designer's build. `build.py` injects this as one extra <script> after the
 * studio's own, so `studio/` stays exactly as marketing delivered it and a new design drop is a
 * straight folder swap + rebuild. Same contract as the portal's copy (portal.prov.ae
 * /marketing-tools/business-card), so either host can drive either build.
 *
 * It runs after the app script and before DOMContentLoaded (= before the studio's `init()`), and
 * wraps three of the studio's global functions — `layoutRows`, `newDoc`, `buildContent` — by
 * reassigning them. If a future drop renames one of those, the wrap throws on load and the page
 * shows a blank card rather than an unlocked one; re-check them first.
 *
 * Contract with the host page (`business-card.tsx`), same-origin postMessage only:
 *   studio → host  { type: 'provident-bcard:ready' }                 once, after init()
 *   host → studio  { type: 'provident-bcard:card', card: {...} }     { fullName, position, brn, phone, email }
 *
 * Rules on top of the designer's kiosk mode:
 *   - Name, mobile and e-mail are PREFILLED and stay editable.
 *   - Job title and BRN are the person's record, never typed. They are re-stamped before every
 *     draw AND every export, so undo, Reset, the template switch or opening a .bcard.json file
 *     cannot put a typed value on the card.
 *   - A null BRN or null position hides that line instead of printing a placeholder.
 *   - No background images: the Images tab is hidden and the PNG is cleared from both sides.
 * With no card sent (a blank card) the studio behaves exactly as delivered, minus background images.
 */
(function () {
  const MSG = 'provident-bcard';
  let card = null; // { fullName, position, brn, phone, email }, trimmed; null = not sent

  const front = (doc, id) => doc && doc.sides && doc.sides.front.find(e => e.id === id);

  function lockRecordFields(doc) {
    if (!card) return;
    const title = front(doc, 'title'), brn = front(doc, 'brn');
    if (title) { title.text = card.position || ''; if (!card.position) title.visible = false; }
    if (brn) { brn.value = card.brn || ''; if (!card.brn) brn.visible = false; }
  }

  function fillCard(doc) {
    const set = (id, v) => { const e = front(doc, id); if (e) { e.text = v || ''; e.visible = !!v; } };
    set('name', card.fullName); set('r_mobile', card.phone); set('r_mail', card.email);
    // A new person starts with their record lines showing — the previous person may have had none.
    const title = front(doc, 'title'), brn = front(doc, 'brn');
    if (title) title.visible = !!card.position;
    if (brn) brn.visible = !!card.brn;
    doc.fileName = (card.fullName || 'Business Card') + ' - Business Card';
    lockRecordFields(doc);
  }

  function dropBackgroundImages(doc) {
    if (!KIOSK || !doc || !doc.sides) return;
    ['front', 'back'].forEach(side => { const e = doc.sides[side].find(x => x.id === 'bgimg'); if (e && e.asset) e.asset = null; });
  }

  // Every draw (canvas, SVG, PNG/JPEG, PDF) goes through layoutRows — the one choke point.
  const baseLayoutRows = layoutRows;
  layoutRows = function (doc) { lockRecordFields(doc); dropBackgroundImages(doc); return baseLayoutRows(doc); };

  // Reset rebuilds the doc from the template; keep the person on it.
  const baseNewDoc = newDoc;
  newDoc = function (mode) { const doc = baseNewDoc(mode); if (card) fillCard(doc); return doc; };

  // Grey out the two record fields in the Details tab (and their show toggle when there is nothing on file).
  const baseBuildContent = buildContent;
  buildContent = function () {
    baseBuildContent();
    if (KIOSK && S.side === 'back') {
      // The back panel points at the Images tab, which is hidden here.
      $$('#pane-content p.hint').forEach(p => { if (/Images tab/.test(p.textContent)) p.remove(); });
    }
    if (!card || !KIOSK || S.side !== 'front') return;
    const box = $('#pane-content');
    [['title', !!card.position], ['brn', !!card.brn]].forEach(([id, onFile]) => {
      const input = box.querySelector('input[data-focus="' + id + '"], textarea[data-focus="' + id + '"]');
      if (!input) return;
      input.disabled = true;
      input.title = onFile ? 'From the employee record — cannot be changed here' : 'Not on the employee record';
      if (!onFile) input.placeholder = 'Not on record';
      const eye = !onFile && input.closest('.crow') && input.closest('.crow').querySelector('.eye');
      if (eye) eye.disabled = true;
    });
    const sections = $$('section.sec', box);
    const person = sections.find(s => /person/i.test((s.querySelector('h4') || {}).textContent || '')) || sections[0];
    if (person) person.append(h('p', { class: 'hint' }, 'Job title and BRN are printed from the employee record and cannot be edited. Ask HR if either is wrong.'));
  };

  // The studio has no disabled-input style; without this a locked field looks typeable.
  // The Images tab (background PNG upload) and its "Adjusting the PNG" bar are not offered here.
  document.head.append(h('style', null, 'body.kiosk .tab[data-tab=images],body.kiosk #pane-images,body.kiosk #adjBar{display:none!important}#pane-content input:disabled{background:#F4F1EC;color:#666D7F;cursor:not-allowed}#pane-content .eye:disabled{opacity:.35;cursor:not-allowed}'));

  const text = v => (typeof v === 'string' && v.trim() ? v.trim() : null);

  window.addEventListener('message', ev => {
    if (ev.source !== window.parent || ev.origin !== location.origin) return;
    const m = ev.data;
    if (!m || m.type !== MSG + ':card' || !m.card) return;
    card = { fullName: text(m.card.fullName) || '', position: text(m.card.position), brn: text(m.card.brn), phone: text(m.card.phone), email: text(m.card.email) };
    if (!S.doc) return; // init() has not run; its newDoc() picks the card up
    fillCard(S.doc);
    // A new person is a new starting point: undo must not walk back to someone else's card or the blank template.
    S.hist = []; S.hi = -1; S.sel = []; pushHist(); fullRefresh();
  });

  // Registered after the studio's own DOMContentLoaded handler, so init() has already run.
  document.addEventListener('DOMContentLoaded', () => {
    if (window.parent !== window) window.parent.postMessage({ type: MSG + ':ready' }, location.origin);
  });
})();
