import { $, $$, ACT, ANAT, buildKeys, BUS, camera, CHAPTERS, clamp, CU, DEG, drawDay, esc, focalFor, fovFor,
  hourTo, MODEL3D, openTopic, renderLifeInfo, renderPanel, rig, setLANG, setPlaying, SOURCES, STATE, THREE,
  tt, UI, V3, WORLD } from '../app.js';

/* ════════════════════════════════════════════════════════════════
   interface: chapters, panels, focus & framing, callouts, dock,
   insets, search, tour, keyboard, mobile sheet
   ════════════════════════════════════════════════════════════════ */
const root = document.documentElement;
const U = { chapter: 'home', topic: null, filter: 'all', labels: true, follow: true, pairs: false, peel: false, section: null, sectionX: 0, userT: 0, sheet: 'half', signs: new Set(), symOpen: false, nictT: 0, userTime: false, demo: null };

/* ─────────── tiny icon set ─────────── */
const ICONS = {
  hump: 'M3 17c2-7 5-10 9-10s7 3 9 10M3 17h18', stomach: 'M9 4c0 3-3 3-3 7 0 5 4 8 8 8s6-3 6-6-3-4-5-4-3-2-3-5', liver: 'M4 10c2-4 8-5 12-4s5 4 4 7-5 5-9 4-8-3-7-7z', heart: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z',
  lungs: 'M12 4v8M12 10c-2 0-3-2-5-2-2 0-3 3-3 7 0 2 1 4 3 4 3 0 5-2 5-5M12 10c2 0 3-2 5-2 2 0 3 3 3 7 0 2-1 4-3 4-3 0-5-2-5-5', nose: 'M10 3c0 6-4 9-4 13a3 3 0 0 0 6 0M14 3c0 6 4 9 4 13a3 3 0 0 1-6 0',
  brain: 'M8 6a3 3 0 0 1 4-1 3 3 0 0 1 4 1 3 3 0 0 1 3 4 3 3 0 0 1-1 5 3 3 0 0 1-4 3 3 3 0 0 1-4 0 3 3 0 0 1-4-3 3 3 0 0 1-1-5 3 3 0 0 1 3-4zM12 5v13', kidney: 'M14 4c-5 0-9 4-9 9s3 7 6 7 3-3 3-5-3-2-3-4 3-3 3-5c2 0 5 2 5 6', uterus: 'M12 20v-8M12 12c-3 0-4-3-7-4M12 12c3 0 4-3 7-4M5 8a1.5 1.5 0 1 0 0-.1M19 8a1.5 1.5 0 1 0 0-.1',
  bone: 'M7.5 7.5l9 9M6 5a1.8 1.8 0 1 0 .1 0M5 8a1.8 1.8 0 1 0 .1 0M18 19a1.8 1.8 0 1 0 .1 0M19 16a1.8 1.8 0 1 0 .1 0', leg: 'M9 3v8l-2 9h3M15 3v8l2 9h-3',
  gait: 'M5 20l3-6M10 20l2-8M14 20l2-6M19 20l-1-8M4 10h16', pace: 'M4 17h16M7 17V9M17 17V9M4 9c3-3 13-3 16 0', foot: 'M12 20c-4 0-6-3-5-7 1-3 3-3 5-3s4 0 5 3c1 4-1 7-5 7zM9 9c-1-3-3-5-2-6s3 1 3 5M15 9c1-3 3-5 2-6s-3 1-3 5',
  couch: 'M3 18h18M5 18c0-4 3-6 7-6h4c2 0 3 2 3 6M14 12l2-6h3', drop: 'M12 3.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5z', wind: 'M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h7',
  thermo: 'M10 13.5V5a2 2 0 1 1 4 0v8.5a4 4 0 1 1-4 0z', coat: 'M4 20c1-6 4-9 8-9s7 3 8 9M6 13l-1-3M9 11l-1-3M12 10.5V7M15 11l1-3M18 13l1-3', sun: 'M12 7a5 5 0 1 0 .1 0M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5',
  snow: 'M12 3v18M4 7.5l16 9M4 16.5l16-9', alert: 'M12 4l9 16H3zM12 10v4M12 17h.01', shield: 'M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z', syringe: 'M18 3l3 3M16 5l3 3-9 9H7v-3zM5 19l-2 2',
  worm: 'M4 16c2-6 6 2 8-4s6 2 8-4', tick: 'M12 8a4 4 0 1 0 .1 0M6 6l3 3M18 6l-3 3M5 12h3M16 12h3M6 18l3-3M18 18l-3-3', tooth: 'M7 4c2 0 3 1 5 1s3-1 5-1 3 2 3 5-2 5-2 8-1 3-2 3-1-4-2-4h-4c-1 0-1 4-2 4s-2 0-2-3-2-5-2-8 1-5 3-5z',
  food: 'M6 21V11M4 3v5a2 2 0 0 0 4 0V3M18 21V3c-2 1-4 3-4 7h4', shade: 'M3 11a9 7 0 0 1 18 0zM12 11v10', water: 'M12 3.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5z', quar: 'M4 4h16v16H4zM4 12h16M12 4v16', milk: 'M9 3h6v3l2 4v11H7V10l2-4z',
};
const ic = n => `<svg class="ic" viewBox="0 0 24 24"><path d="${ICONS[n] || ICONS.shield}"/></svg>`;
const chev = '<svg class="ic chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>';

/* ─────────── helpers ─────────── */
let toastT = 0;
function toast(msg, ms = 2800) { const t = $('#toast'); t.textContent = tt(msg); t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms); }
function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } return null; }
const srcLinks = ids => ids && ids.length ? `<div class="src">${tt(UI.sources)}: ${ids.map(id => { const s = SOURCES.find(x => x[0] === id); return s ? `<a href="${s[3]}" target="_blank" rel="noopener">${esc(s[2].split(/[.(]/)[0].slice(0, 60))}</a>` : ''; }).filter(Boolean).join(' · ')}</div>` : '';
const pctRange = el => { const p = (el.value - el.min) / (el.max - el.min) * 100; el.style.setProperty('--p', p + '%'); };
function norm(s) {
  return String(s).toLowerCase().replace(/[ً-ٰٟـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/<[^>]+>/g, ' ');
}

/* ─────────── language ─────────── */
function applyLang(lang, first) {
  setLANG(lang);
  root.lang = lang; root.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.title = tt(UI.title);
  $$('[data-i18n]').forEach(el => { const v = UI[el.dataset.i18n]; if (v) el.textContent = tt(v); });
  $$('[data-i18n-aria]').forEach(el => { const v = UI[el.dataset.i18nAria]; if (v) el.setAttribute('aria-label', tt(v)); });
  $$('[data-i18n-title]').forEach(el => { const v = UI[el.dataset.i18nTitle]; if (v) el.title = tt(v); });
  $$('[data-i18n-ph]').forEach(el => { const v = UI[el.dataset.i18nPh]; if (v) el.placeholder = tt(v); });
  $('#btnLang').innerHTML = lang === 'ar' ? '<span class="latn">English</span>' : '<span>العربية</span>';
  $('#btnLang').lang = lang === 'ar' ? 'en' : 'ar';
  buildChapterNav();
  if (!first) { renderPanel(); drawDay(true); buildKeys(); if (camera && WORLD.camel) { applyViewOffset(); if (U.topic) openTopic(U.topic); else frameChapter(U.chapter); } }
  store('camel-lang', lang);
}

/* ─────────── chapters ─────────── */
function buildChapterNav() {
  $('#chapters').innerHTML = CHAPTERS.map(c => `<button class="chap" data-ch="${c.id}" aria-current="${c.id === U.chapter}">${tt(c.name)}</button>`).join('');
  $$('#chapters .chap').forEach(b => b.onclick = () => go(b.dataset.ch));
}
function go(ch, topic, opts = {}) {
  if (!CHAPTERS.find(c => c.id === ch)) ch = 'home';
  const changed = ch !== U.chapter;
  U.chapter = ch; U.topic = null;
  $$('#chapters .chap').forEach(b => b.setAttribute('aria-current', String(b.dataset.ch === ch)));
  const cur = $(`#chapters .chap[data-ch="${ch}"]`); if (cur && cur.scrollIntoView) try { cur.scrollIntoView({ block: 'nearest', inline: 'center' }); } catch (e) { /* old */ }
  if (changed || opts.force) enterChapter(ch);
  renderPanel();
  if (topic) openTopic(topic, true);
  if (!opts.noHash) setHash();
  $('#pscroll').scrollTop = 0;
}
function setHash() { try { history.replaceState(null, '', '#' + U.chapter + (U.topic ? '.' + U.topic : '')); } catch (e) { /* sandbox */ } }

/* each chapter sets up the scene the way its story needs */
function enterChapter(ch) {
  ACT.stopStorm(true);
  if (ch !== 'movement') { setGait('stand'); setSlow(1); U.pairs = false; }
  if (ch !== 'anatomy') { setLayer(ch === 'climate' ? STATE.layer === 'thermal' ? 'thermal' : 'skin' : 'skin'); setSection(null); STATE.explode = 0; U.peel = false; }
  if (ch !== 'life' && STATE.stage !== 'adult') setStage('adult');
  if (ch === 'health') setLayer('skin');
  document.body.classList.toggle('dock-off', !(ch === 'home' || ch === 'climate'));
  HL.clear();
  endTimeDemo();
  if (!U.userTime) { setPlaying(false); if (STATE.season !== 'summer') setSeason('summer'); hourTo(DAY_HOUR); }
  frameChapter(ch);
}
const VIEWS = {
  home: { t: [.62, 1.12, 0], box: 1, az: .62, el: .05 },
  anatomy: { t: [.62, 1.12, 0], box: 1, az: .02, el: .06 },
  movement: { t: [.55, 1.0, 0], box: 1, az: .12, el: .05 },
  climate: { t: [.6, 1.12, 0], box: 1, az: .5, el: .08 },
  life: { t: [.6, 1.12, 0], box: 1, az: .72, el: .07 },
  health: { t: [.62, 1.12, 0], box: 1, az: .3, el: .07 },
  prevention: { t: [.6, 1.12, 0], box: 1, az: -.55, el: .09 },
  sources: { t: [.6, 1.12, 0], box: 1, az: 1.35, el: .1 },
};
/* the scene always opens on the designed golden summer afternoon; never the device clock.
   Only the slider, or a topic that demonstrates night or winter, moves it (with a way back). */
const DAY_HOUR = 16.6;
const isTimeDemo = f => f.season === 'winter' || !!f.play || (f.hour != null && (f.hour < 6.5 || f.hour > 18.5));
function showBackDay(on) { const b = $('#backDay'); if (b) b.hidden = !on; }
function endTimeDemo() {
  const d = U.demo; if (!d) return; U.demo = null; showBackDay(false); setPlaying(false);
  if (STATE.season !== d.season) setSeason(d.season); hourTo(d.hour);
}
function backToDay() { U.demo = null; U.userTime = false; showBackDay(false); setPlaying(false); if (STATE.season !== 'summer') setSeason('summer'); hourTo(DAY_HOUR); }
function userSetTime() { U.userTime = true; U.demo = null; showBackDay(false); }
function frameChapter(ch) { focusCam(VIEWS[ch] || VIEWS.home, ch === 'movement'); }

/* ─────────── framing into the free part of the screen ─────────── */
function freeRect() {
  const W = innerWidth, H = innerHeight, mob = innerWidth <= 760;
  const top = mob ? ($('#chapters').getBoundingClientRect().bottom + 6) : $('#topbar').getBoundingClientRect().bottom;
  if (mob) {
    const sheet = document.body.classList.contains('panel-off') ? 0 : $('#panel').getBoundingClientRect().height;
    const dock = document.body.classList.contains('dock-off') ? 0 : $('#dock').getBoundingClientRect().height + 8;
    return { x: 0, y: top, w: W, h: Math.max(120, H - top - sheet - dock) };
  }
  const off = document.body.classList.contains('panel-off') || document.body.classList.contains('touring');
  const pw = off ? 0 : $('#panel').getBoundingClientRect().width + 28;
  const dockH = document.body.classList.contains('dock-off') || document.body.classList.contains('touring') ? 0 : $('#dock').getBoundingClientRect().height + 20;
  const x = root.dir === 'rtl' ? 0 : pw;
  return { x, y: top, w: W - pw, h: Math.max(160, H - top - dockH) };
}
function applyViewOffset() {
  if (!camera) return;
  const r = freeRect(), W = innerWidth, H = innerHeight;
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  camera.setViewOffset(W, H, W / 2 - cx, H / 2 - cy, W, H);
  U.rect = r;
}
function camelFrame() {
  const g = WORLD.camel.group;
  return { pos: g.position, yaw: g.rotation.y, s: WORLD.camel.spec.scale.body };
}
function localToWorldPt(p) { const f = camelFrame(), c = Math.cos(f.yaw), s = Math.sin(f.yaw); return new V3(f.pos.x + p[0] * c + p[2] * s, p[1], f.pos.z - p[0] * s + p[2] * c); }
function focusCam(v, follow, dur = 1.6) {
  if (!WORLD.camel) return;
  applyViewOffset();
  const s = STATE.stage === 'adult' || STATE.stage === 'old' ? 1 : WORLD.camel.spec.scale.body * 1.05 + .08;
  const tl = [v.t[0] * s, v.t[1] * s, v.t[2] * s];
  const target = localToWorldPt(tl);
  const r = U.rect;
  let dist = 6;
  for (let it = 0; it < 4; it++) {               // the lens depends on the distance, the distance on the lens
    const tanV = Math.tan(fovFor(focalFor(dist), innerWidth / innerHeight) * DEG / 2);
    const tv = tanV * r.h / innerHeight, th = tanV * r.w / innerHeight;
    if (v.box) {                                 // fit the whole animal: a box seen from this azimuth
      const hw = (Math.abs(Math.cos(v.az)) * 1.62 + Math.abs(Math.sin(v.az)) * .42) * s, hh = 1.2 * s, hd = (Math.abs(Math.sin(v.az)) * 1.62 + Math.abs(Math.cos(v.az)) * .42) * s;
      dist = Math.max(hw / th, hh / tv) * 1.16 + hd * .75;
    } else dist = v.r * s / Math.min(tv, th) * 1.04;
  }
  dist = clamp(dist, .45, 22);
  U.follow = !!follow; U.followAz = v.az; U.followT = tl;
  rig.flyTo({ target, r: dist, theta: camelFrame().yaw + v.az, phi: Math.PI / 2 - v.el }, dur);
}

/* ─────────── scene setters used by the panels ─────────── */
function setLayer(layer) {
  STATE.layer = layer;
  if (!WORLD.camel) return;
  if ((layer === 'organs' || layer === 'skeleton') && STATE.stage !== 'adult') { setStage('adult'); toast(UI.toast.adult); }
  const mode = layer === 'thermal' ? 'thermal' : layer === 'muscle' ? 'muscle' : (layer === 'organs' || layer === 'skeleton') ? 'xray' : 'skin';
  WORLD.camel.setMode(mode);
  MODEL3D.show(layer === 'skin');
  CU.uXray.value = layer === 'skeleton' ? .55 : 1;
  if (layer === 'organs' || layer === 'skeleton') {
    if (!ANAT.built) { toast(UI.toast.building, 4000); ANAT.build(WORLD.stages.adult.camel).then(() => { ANAT.setLayer(STATE.layer); BUS.emit('anat'); }); }
    else ANAT.setLayer(layer);
  } else if (ANAT.built) ANAT.setLayer(layer);
  $$('[data-layer]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.layer === layer)));
}
function setSection(kind) { U.section = kind; $$('[data-sec]').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.sec || null) === (kind || '')))); const s = $('#secPos'); if (s) s.closest('.sl').hidden = !kind; }
function setGait(g) { STATE.gait = g; if (WORLD.crig) WORLD.crig.setGait(g); $$('[data-gait]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.gait === g))); if (g !== 'stand' && STATE.couched) ACT.couch(false); }
function setSlow(k) { STATE.speed = k; if (WORLD.crig) WORLD.crig.timeScale = k; $$('[data-speed]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.speed === k))); }
function setSeason(s) { STATE.season = s; $$('[data-season]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.season === s))); CU.uCoat.value = s === 'winter' ? 1.35 : 1; drawDay(true); }
async function setStage(st) {
  if (STATE.stage === st && WORLD.camel && WORLD.camel.spec.stage === st) return;
  STATE.stage = st;
  $$('[data-stage]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.stage === st)));
  if (st !== 'adult' && (STATE.layer === 'organs' || STATE.layer === 'skeleton')) setLayer('skin');
  await WORLD.loadStage(st);
  if (STATE.stage !== st) return;
  WORLD.show(st);
  ANAT_visible();
  CU.uGrey.value = st === 'old' ? 1 : 0;
  if (U.chapter === 'life') focusCam(VIEWS.life, false, 1.2);
  renderLifeInfo();
}
function ANAT_visible() { if (!ANAT.built) return; const on = STATE.stage === 'adult'; ANAT.organs.forEach(o => { o.holder.visible = on && STATE.layer === 'organs'; }); ANAT.bones.forEach(b => { b.mesh.visible = on && (STATE.layer === 'skeleton' || STATE.layer === 'organs'); }); }

/* highlights: body regions (colour per region) and organs */
const HL = {
  regions: new Map(), organs: [],
  set(regions = [], organs = [], color = '#ffb347') { this.regions.clear(); const c = new THREE.Color(color); regions.forEach(r => this.regions.set(r, c)); this.organs = organs; },
  pairs(on) { this.regions.clear(); if (on) { const a = new THREE.Color('#ffb347'), b = new THREE.Color('#5cc8ff'); [4, 5, 6].forEach(r => this.regions.set(r, a)); [14, 15, 16].forEach(r => this.regions.set(r, b)); } },
  clear() { this.regions.clear(); this.organs = []; },
  apply(t) {
    const arr = CU.uHL.value, k = .75 + .25 * Math.sin(t * 3);
    for (let i = 0; i < arr.length; i++) { const c = this.regions.get(i); if (c) arr[i].set(c.r * k, c.g * k, c.b * k); else arr[i].set(0, 0, 0); }
    ANAT.highlight(this.organs);
  },
};

export { root, U, ic, chev, toast, srcLinks, pctRange, norm, applyLang, go, setHash, VIEWS, DAY_HOUR,
  isTimeDemo, showBackDay, endTimeDemo, backToDay, userSetTime, frameChapter, freeRect, applyViewOffset,
  camelFrame, localToWorldPt, focusCam, setLayer, setSection, setGait, setSlow, setSeason, setStage, HL };
