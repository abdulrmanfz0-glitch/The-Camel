import { $, $$, ACT, ANAT, ANATOMY, ATLAS, camera, clearDiseaseLook, CLIMATE, damp, DAY_HOUR, diseaseCam,
  endTimeDemo, ENV, focusCam, frameChapter, freeRect, HEALTH, HL, INSET, isTimeDemo, L, MOVEMENT, openOrgan,
  setGait, setHash, setHour, setLayer, setPlaying, setSeason, setSlow, showBackDay, showDiseaseLook, STATE,
  tt, U, V3, VIEWS, WORLD } from '../app.js';

/* ─────────── topics: open one at a time, with a scene focus ─────────── */
function findTopic(id) {
  for (const set of [ANATOMY.topics, MOVEMENT.topics, CLIMATE.topics]) { const t = set.find(x => x.id === id); if (t) return t; }
  const d = HEALTH.list.find(x => x.id === id); if (d) return { id, disease: d, focus: Object.assign({}, d.hl) };
  if (id === 'teeth') return { id, focus: { cam: { t: [1.95, 1.9, 0], r: .3, az: .9, el: .1 } } };
  return null;
}
function openTopic(id, scroll) {
  if (id && id.startsWith('o-')) { openOrgan(id.slice(2), scroll); return; }
  const tp = findTopic(id); if (!tp) return;
  const oc = $('#organCard'); if (oc) oc.innerHTML = ''; $$('[data-organ]').forEach(b => b.setAttribute('aria-pressed', 'false'));
  $$('#pcontent .topic.open').forEach(t => { if (t.dataset.topic || t.dataset.dis) { t.classList.remove('open'); const b = t.querySelector('.body'); if (b) b.hidden = true; t.firstElementChild.setAttribute('aria-expanded', 'false'); } });
  const el = $(`#pcontent .topic[data-topic="${id}"], #pcontent .topic[data-dis="${id}"]`);
  if (el) { el.classList.add('open'); el.querySelector('.body').hidden = false; el.firstElementChild.setAttribute('aria-expanded', 'true'); if (scroll) setTimeout(() => el.scrollIntoView({ block: 'start', behavior: ENV.reduce ? 'auto' : 'smooth' }), 60); }
  U.topic = id; setHash();
  applyFocus(tp.focus || {}, tp);
}
function closeTopic() {
  endTimeDemo();
  $$('#pcontent .topic.open').forEach(t => { if (t.dataset.topic || t.dataset.dis) { t.classList.remove('open'); const b = t.querySelector('.body'); if (b) b.hidden = true; t.firstElementChild.setAttribute('aria-expanded', 'false'); } });
  const oc = $('#organCard'); if (oc) oc.innerHTML = ''; $$('[data-organ]').forEach(b => b.setAttribute('aria-pressed', 'false'));
  U.topic = null; setHash(); INSET.hide(); HL.clear(); clearDiseaseLook(); if (U.pairs) HL.pairs(true);
  frameChapter(U.chapter);
}
function applyFocus(f, tp) {
  HL.clear(); clearDiseaseLook();
  if (tp && tp.disease) {
    const d = tp.disease, look = showDiseaseLook(d);
    const layer = d.hl.layer === 'thermal' ? 'thermal' : look.org.length && !(look.skin && d.hl.layer === 'skin') ? 'organs' : 'skin';
    setLayer(layer);
    const ids = []; look.org.forEach(([t]) => { const o = ATLAS.organs[t]; if (o && o.mesh) ids.push(...o.mesh); });
    HL.set(look.skin ? [] : (d.hl.regions || []), ids, '#ff8a5c');
    INSET.hide();
    const cam = diseaseCam(d, look);
    focusCam(cam || (layer === 'organs' ? VIEWS.anatomy : VIEWS.health));
    return;
  }
  if (f.layer) setLayer(f.layer);
  else if (U.chapter === 'health') setLayer('skin');
  if (isTimeDemo(f)) {
    if (!U.demo) U.demo = { hour: STATE.playing ? DAY_HOUR : STATE.hour, season: STATE.season };
    if (f.season) setSeason(f.season);
    if (f.hour != null) setHour(f.hour);
    if (f.play) setPlaying(true);
    showBackDay(true);
  } else endTimeDemo();
  if (f.gait) setGait(f.gait);
  if (f.speed) setSlow(f.speed);
  if (f.pairs) { U.pairs = true; const b = $('#btnPairs'); if (b) b.setAttribute('aria-pressed', 'true'); HL.pairs(true); }
  if (f.regions || f.organs) { const reg = HL.regions.size ? null : f.regions; if (reg || f.organs) { const keep = new Map(HL.regions); HL.set(f.regions || [], f.organs || [], tp && tp.disease ? '#ff8a5c' : '#ffb347'); keep.forEach((v, k) => HL.regions.set(k, v)); } }
  if (f.act === 'couch' && !STATE.couched) ACT.couch(true);
  if (f.act === 'drink') ACT.drink();
  if (f.act === 'storm') ACT.storm();
  if (tp && tp.inset) INSET.show(tp.inset); else INSET.hide();
  if (f.cam) focusCam(f.cam, !!f.follow);
  else if (tp && tp.disease) focusCam(f.layer === 'organs' ? VIEWS.anatomy : VIEWS.health);
}

/* ─────────── callouts: collision-free labels in two columns ─────────── */
const CO = { els: new Map(), svg: null, pos: new Map() };
function calloutItems() {
  if (!WORLD.camel || !U.labels) return [];
  const items = [], A = ANATOMY, cam = WORLD.camel;
  if (U.chapter === 'anatomy' && !U.topic) {
    if (STATE.layer === 'organs' && ANAT.built && STATE.stage === 'adult') {
      for (const id of A.labelSets.organs) { const p = ANAT.anchor(id); if (p) items.push({ id, text: tt(A.organs[id]), p, topic: organTopic(id) }); }
    } else if (STATE.layer === 'skeleton' || STATE.layer === 'muscle') {
      for (const id of A.labelSets[STATE.layer === 'skeleton' ? 'skeleton' : 'muscle']) {
        const [txt, bone, pt] = A.pts[id], b = cam.bone[bone]; if (!b) continue;
        const sideZ = pt[2] * sideSign();
        items.push({ id, text: tt(txt), p: new V3(pt[0], pt[1], sideZ).sub(b.userData.rest).applyMatrix4(b.matrixWorld), topic: id === 'thighM' || id === 'tendons' ? 'legs' : 'skeleton' });
      }
    } else if (STATE.layer === 'skin') {
      const S = sideSign() > 0 ? 'L' : 'R';
      const ext = [['humpTop', L('السنام', 'Hump'), 'hump'], ['eye' + S, L('العين', 'Eye'), 'storm'], ['nostril' + S, L('المنخر', 'Nostril'), 'nose'], ['lip', L('الشفة المشقوقة', 'Split lip'), 'nose'], ['sternalPad', L('الكِركِرة', 'Chest pad'), 'couch'], ['carpalPad' + S, L('ثفنة الرسغ', 'Carpal pad'), 'couch'], ['footF' + S, L('الخُفّ', 'Foot'), 'foot'], ['stiflePad' + S, L('ثفنة الركبة', 'Stifle pad'), 'couch']];
      for (const [a, t, top] of ext) if (cam.spec.anchors[a]) items.push({ id: a, text: tt(t), p: cam.anchorWorld(a), topic: top });
    }
  }
  return items;
}
function atlasFor(meshId) { for (const o of Object.values(ATLAS.organs)) if (o.mesh && o.mesh.includes(meshId)) return o.id; return null; }
function organTopic(id) { return { heart: 'heart', arteries: 'heart', veins: 'heart', lungL: 'lungs', lungR: 'lungs', trachea: 'lungs', liver: 'liver', spleen: 'liver', c1: 'stomach', c2: 'stomach', c3: 'stomach', esophagus: 'stomach', intestine: 'kidneys', colon: 'kidneys', kidneyL: 'kidneys', kidneyR: 'kidneys', bladder: 'repro', uterus: 'repro', fat: 'hump', brain: 'brain', rete: 'brain', turbinates: 'nose' }[id]; }
function sideSign() { const g = WORLD.camel.group, d = camera.position.clone().sub(g.position); const lz = -d.x * Math.sin(g.rotation.y) + d.z * Math.cos(g.rotation.y); return lz >= 0 ? 1 : -1; }
function updateCallouts(dt) {
  const layer = $('#callouts'), svg = $('#leaders');
  const items = document.body.classList.contains('touring') ? [] : calloutItems();
  const seen = new Set(), r = U.rect || freeRect();
  const pts = [];
  camera.updateMatrixWorld();
  for (const it of items) {
    const v = it.p.clone().project(camera);
    if (v.z > 1 || v.z < -1) continue;
    const x = (v.x * .5 + .5) * innerWidth, y = (-v.y * .5 + .5) * innerHeight;
    if (x < r.x - 40 || x > r.x + r.w + 40 || y < r.y || y > r.y + r.h) continue;
    pts.push(Object.assign({ x, y }, it));
  }
  if (pts.length) {
    const minX = Math.min(...pts.map(p => p.x)), maxX = Math.max(...pts.map(p => p.x)), cx = (minX + maxX) / 2;
    const cols = [pts.filter(p => p.x < cx), pts.filter(p => p.x >= cx)];
    cols.forEach((col, ci) => {
      col.sort((a, b) => a.y - b.y);
      const gap = innerWidth <= 760 ? 26 : 32;
      for (let i = 0; i < col.length; i++) col[i].ly = Math.max(col[i].y, i ? col[i - 1].ly + gap : r.y + 16);
      for (let i = col.length - 1; i >= 0; i--) col[i].ly = Math.min(col[i].ly, i < col.length - 1 ? col[i + 1].ly - gap : r.y + r.h - 16);
      const edge = ci === 0 ? Math.max(r.x + 12, minX - (innerWidth <= 760 ? 30 : 70)) : Math.min(r.x + r.w - 12, maxX + (innerWidth <= 760 ? 30 : 70));
      col.forEach(p => { p.lx = edge; p.side = ci; });
    });
  }
  let paths = '';
  for (const p of pts) {
    seen.add(p.id);
    let el = CO.els.get(p.id);
    if (!el) { el = document.createElement('button'); el.className = 'co'; el.innerHTML = '<span class="d"></span><span class="t"></span>'; el.onclick = () => { const aid = atlasFor(p.id); if (aid && STATE.layer === 'organs') openOrgan(aid, true); else if (p.topic) openTopic(p.topic, true); }; layer.appendChild(el); CO.els.set(p.id, el); }
    el.classList.remove('hidden');
    el.querySelector('.t').textContent = p.text;
    const prev = CO.pos.get(p.id) || { y: p.ly, x: p.lx };
    const ny = damp(prev.y, p.ly, 10, dt), nx = damp(prev.x, p.lx, 10, dt);
    CO.pos.set(p.id, { x: nx, y: ny });
    const w = el.offsetWidth || 90;
    const left = p.side === 0 ? Math.max(r.x + 6, nx - w) : Math.min(r.x + r.w - w - 6, nx);
    el.style.left = left + 'px'; el.style.top = ny + 'px';
    el.classList.toggle('on', organTopic(p.id) === U.topic);
    const ex = p.side === 0 ? nx - 4 : nx + 4;
    paths += `<path d="M${p.x.toFixed(1)} ${p.y.toFixed(1)} L${(ex + (p.side === 0 ? 10 : -10)).toFixed(1)} ${ny.toFixed(1)} L${ex.toFixed(1)} ${ny.toFixed(1)}" stroke="rgba(243,235,221,.55)" stroke-width="1" fill="none"/><circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3" fill="#46cdb8" stroke="rgba(8,14,24,.8)" stroke-width="1.5"/>`;
  }
  svg.innerHTML = paths;
  for (const [id, el] of CO.els) if (!seen.has(id)) { el.classList.add('hidden'); if (!el.__rm) el.__rm = setTimeout(() => { if (el.classList.contains('hidden')) { el.remove(); CO.els.delete(id); CO.pos.delete(id); } el.__rm = 0; }, 400); } else if (el.__rm) { clearTimeout(el.__rm); el.__rm = 0; }
}

export { openTopic, closeTopic, atlasFor, updateCallouts };
