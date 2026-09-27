import { $, $$, ACT, ANAT, ANATOMY, ATLAS, buildGaitDiagram, CHAPTERS, chev, CLIMATE, closeTopic, CU, digits,
  drawDay, ENV, esc, focusCam, go, HEALTH, HL, HOME, ic, INSET, LANG, LIFE, MODEL3D, MOVEMENT, openTopic,
  pct, pctRange, PREVENT, setGait, setHash, setLayer, setSeason, setSection, setSlow, setStage, SOURCES,
  SOURCES_TXT, SRC_GROUPS, srcLinks, STATE, SYMPTOMS, TOURX, tt, U, UI, updateStatus, userSetTime, VIEWS,
  WORLD } from '../app.js';

/* ─────────── panel rendering ─────────── */
function renderPanel() {
  const ch = U.chapter, C = CHAPTERS.find(c => c.id === ch);
  const head = (title, lede) => `<div class="ch-kicker"><span class="n num">${digits(C.n)}</span><span>${tt(C.name)}</span></div><h2 class="ch-title">${tt(title)}</h2><p class="ch-lede">${tt(lede)}</p>`;
  let h = '';
  if (ch === 'home') h = renderHome();
  else if (ch === 'anatomy') h = head(ANATOMY.title, ANATOMY.lede) + renderAnatomy();
  else if (ch === 'movement') h = head(MOVEMENT.title, MOVEMENT.lede) + renderMovement();
  else if (ch === 'climate') h = head(CLIMATE.title, CLIMATE.lede) + renderClimate();
  else if (ch === 'life') h = head(LIFE.title, LIFE.lede) + renderLife();
  else if (ch === 'health') h = head(HEALTH.title, HEALTH.lede) + renderHealth();
  else if (ch === 'prevention') h = head(PREVENT.title, PREVENT.lede) + renderPrevention();
  else h = head(SOURCES_TXT.title, SOURCES_TXT.lede) + renderSources();
  $('#pcontent').innerHTML = h;
  wirePanel();
}
function topicHTML(tp, extra = '') {
  return `<div class="topic" data-topic="${tp.id}"><button aria-expanded="false"><span class="ti">${ic(tp.icon)}</span><span class="tt"><b>${tt(tp.title)}</b><span>${tt(tp.sum)}</span></span>${chev}</button><div class="body" hidden>${tt(tp.body)}${extra}${srcLinks(tp.src)}</div></div>`;
}
function renderHome() {
  return `<div class="ch-kicker"><span>${tt(HOME.kicker)}</span></div>
    <h2 class="hero-title">${tt(UI.title)}</h2>
    <p class="hero-hook">${tt(HOME.hook)}</p>
    <div class="btn-row"><button class="btn primary" id="homeTour">${tt(HOME.start)}</button><button class="btn" id="homeExplore">${tt(HOME.explore)}</button></div>
    <div class="sec-label">${tt(HOME.what)}</div>
    <div class="topics">${HOME.list.map(([a, b], i) => `<button class="topic" data-goto="${['anatomy', 'movement', 'climate', 'life'][i]}" style="text-align:start"><span style="display:flex;gap:11px;padding:11px 13px"><span class="ti">${ic(['heart', 'pace', 'sun', 'shield'][i])}</span><span class="tt"><b>${tt(a)}</b><span>${tt(b)}</span></span></span></button>`).join('')}</div>
    <p class="hint">${tt(HOME.howto)}</p><p class="note">${tt(HOME.model)}</p>`;
}
function renderAnatomy() {
  const A = ANATOMY;
  return `<div class="sec-label">${LANG === 'ar' ? 'الطبقة' : 'Layer'}</div>
    <div class="seg" role="group">${A.layers.map(([k, n]) => `<button data-layer="${k}" aria-pressed="${STATE.layer === k}">${tt(n)}</button>`).join('')}</div>
    <div class="sec-label">${tt(A.tools)}</div>
    <div class="row" style="margin-bottom:6px"><span style="font-size:13px;color:var(--bone-2);min-width:52px">${tt(A.section)}</span><div class="seg" style="flex:1">${[['', A.secOff], ['sagittal', A.secSag], ['trans', A.secTrans]].map(([k, n]) => `<button data-sec="${k}" aria-pressed="${(U.section || '') === k}">${tt(n)}</button>`).join('')}</div></div>
    <div class="sl" ${U.section ? '' : 'hidden'}><div class="sl-top"><label for="secPos">${tt(A.secPos)}</label></div><input class="rng" type="range" id="secPos" min="-0.9" max="2.2" step="0.01" value="${U.sectionX}"></div>
    <div class="row"><button class="btn small" id="btnExplode" aria-pressed="${STATE.explode > .5}">${tt(A.explode)}</button><button class="btn small" id="btnLabels" aria-pressed="${U.labels}">${tt(A.labels)}</button><button class="btn small" id="btnPeel" aria-pressed="${U.peel}">${tt(A.peel)}</button></div>
    <p class="hint" id="peelHint" ${U.peel ? '' : 'hidden'}>${tt(A.peelHint)}</p>
    ${renderAtlas()}
    <div class="sec-label">${tt(A.topicsLabel)}</div>
    <div class="topics">${A.topics.map(tp => topicHTML(tp, tp.id === 'hump' ? humpSlider() : '')).join('')}</div>`;
}
/* ─────────── the organ atlas ─────────── */
const sysOf = id => ATLAS.systems.find(x => x.organs.includes(id));
function renderAtlas() {
  const cur = U.topic && U.topic.startsWith('o-') ? U.topic.slice(2) : null;
  return `<div class="sec-label">${tt(ATLAS.title)}</div><p class="hint">${tt(ATLAS.lede)}</p>
    <div class="row" style="margin-bottom:8px"><span style="font-size:13px;color:var(--bone-2);min-width:52px">${tt(ATLAS.sexLabel)}</span><div class="seg" style="flex:1">${['f', 'm'].map(k => `<button data-sex="${k}" aria-pressed="${STATE.sex === k}">${tt(k === 'f' ? ATLAS.female : ATLAS.male)}</button>`).join('')}</div></div>
    <div class="atlas">${ATLAS.systems.map(sy => `<div class="asys"><div class="asys-h">${ic(sy.icon)}<b>${tt(sy.name)}</b></div><div class="chips">${sy.organs.map(id => { const o = ATLAS.organs[id]; return `<button class="chip" data-organ="${id}" aria-pressed="${cur === id}">${tt(o.name)}${o.sex ? ` <small>${o.sex === 'f' ? '♀' : '♂'}</small>` : ''}</button>`; }).join('')}</div></div>${cur && sy.organs.includes(cur) ? `<div id="organCard">${organCardHTML(cur)}</div>` : ''}`).join('')}${cur ? '' : '<div id="organCard"></div>'}</div>`;
}
function organCardHTML(id) {
  const o = ATLAS.organs[id], sy = sysOf(id);
  const dis = o.dis.map(did => HEALTH.list.find(d => d.id === did)).filter(Boolean);
  return `<div class="ocard"><div class="ocard-h"><span class="ti">${ic(sy.icon)}</span><div style="flex:1"><div class="kick">${tt(sy.name)}${o.sex ? ' · ' + tt(ATLAS.sexOnly[o.sex]) : ''}</div><h3>${tt(o.name)}</h3></div><button class="x" data-close-organ aria-label="${tt(ATLAS.back)}">×</button></div>
    <h4>${tt(ATLAS.fn)}</h4><p>${tt(o.fn)}</p><h4>${tt(ATLAS.camel)}</h4><p>${tt(o.camel)}</p>
    <h4>${tt(ATLAS.dis)}</h4>${dis.length ? `<div class="chips">${dis.map(d => `<button class="chip dis" data-godis="${d.id}">${tt(d.name)}${d.zoo ? ` <span class="flag z">${tt(UI.zoo)}</span>` : ''}</button>`).join('')}</div>` : `<p class="hint">${tt(ATLAS.noDis)}</p>`}
    <div class="vet">${ic('shield')}<span>${tt(UI.vet)}</span></div>${srcLinks(o.src)}</div>`;
}
function setSex(sx) {
  STATE.sex = sx;
  $$('[data-sex]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.sex === sx)));
  if (ANAT.built) ANAT.setLayer(STATE.layer);
  if (U.topic && U.topic.startsWith('o-')) { const o = ATLAS.organs[U.topic.slice(2)]; if (o && o.sex && o.sex !== sx) closeTopic(); }
}
function openOrgan(id, scroll) {
  const o = ATLAS.organs[id]; if (!o) return;
  if (U.chapter !== 'anatomy') { go('anatomy', 'o-' + id); return; }
  if (o.sex && STATE.sex !== o.sex) setSex(o.sex);
  $$('#pcontent .topic.open').forEach(t => { t.classList.remove('open'); const b = t.querySelector('.body'); if (b) b.hidden = true; t.firstElementChild.setAttribute('aria-expanded', 'false'); });
  U.topic = 'o-' + id; setHash();
  $$('[data-organ]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.organ === id)));
  const card = $('#organCard');
  if (card) {
    const chip = $(`[data-organ="${id}"]`), grp = chip && chip.closest('.asys');
    if (grp && grp.nextElementSibling !== card) grp.after(card);
    card.innerHTML = organCardHTML(id); wireOrganCard();
    if (scroll) setTimeout(() => (grp || card).scrollIntoView({ block: 'start', behavior: ENV.reduce ? 'auto' : 'smooth' }), 60);
  }
  clearDiseaseLook();
  HL.clear();
  setLayer(o.layer);
  HL.set(o.regions || [], o.mesh || [], '#ffb347');
  if (o.inset) INSET.show(o.inset); else INSET.hide();
  if (o.act === 'blink') U.nictT = 3.2;
  focusCam(o.cam);
}
function wireOrganCard() {
  $$('#organCard [data-godis]').forEach(b => b.onclick = () => go('health', b.dataset.godis));
  $$('#organCard [data-close-organ]').forEach(b => b.onclick = () => closeTopic());
}
/* a disease on the body: organ looks (inflamed, patchy, swollen, cysts…) and skin looks (mange, pox…) */
const SKIN_LES = { mange: 1, pox: 2, ringworm: 3, ticks: 4, foot: 5, redden: 6 };
function clearDiseaseLook() { CU.uLesK.value = 0; CU.uLesReg.value.fill(0); if (ANAT.built) ANAT.setVisuals(null); U.pendingVis = null; }
function showDiseaseLook(d) {
  clearDiseaseLook();
  const vis = d.vis || [];
  const skin = vis.find(v => v[0] === 'skin'), org = vis.filter(v => v[0] !== 'skin');
  for (const [t] of org) { const o = ATLAS.organs[t]; if (o && o.sex && o.sex !== STATE.sex) { setSex(o.sex); break; } }
  if (skin) { CU.uLesK.value = SKIN_LES[skin[1]] || 6; (skin[2] || []).forEach(r => { CU.uLesReg.value[r] = 1; }); }
  if (org.length) { if (ANAT.built) ANAT.setVisuals(org); else U.pendingVis = org; }
  return { skin, org };
}
function diseaseCam(d, look) {
  if (d.cam) return d.cam;
  const regs = look.skin ? look.skin[2] || [] : [];
  if (look.skin && !look.org.length || (look.skin && d.hl.layer === 'skin')) {
    if (regs.some(r => r === 11 || r === 10) && !regs.includes(0)) return { t: [1.78, 1.95, 0], r: .55, az: .75, el: .08 };
    if (regs.every(r => [6, 16, 7, 17].includes(r))) return { t: [.2, .45, 0], r: 1.9, az: .4, el: .1 };
    if (regs.length === 1 && regs[0] === 9) return { t: [-.3, 1.1, 0], r: .6, az: .45, el: .03 };
    return null;
  }
  const first = look.org[0] && ATLAS.organs[look.org[0][0]];
  return first ? Object.assign({}, first.cam, { r: first.cam.r * 1.1 }) : null;
}
/* the symptom finder */
function symResults() {
  const count = new Map();
  for (const [id, , dis] of SYMPTOMS.signs) if (U.signs.has(id)) dis.forEach(d => count.set(d, (count.get(d) || 0) + 1));
  return [...count.entries()].sort((a, b) => b[1] - a[1] || HEALTH.list.findIndex(d => d.id === a[0]) - HEALTH.list.findIndex(d => d.id === b[0]));
}
function renderSymRes() {
  if (!U.signs.size) return `<p class="hint">${tt(SYMPTOMS.none)}</p>`;
  return `<div class="symres">${symResults().map(([id, n]) => { const d = HEALTH.list.find(x => x.id === id); if (!d) return ''; const m = SYMPTOMS.signs.filter(sg => U.signs.has(sg[0]) && sg[2].includes(id)).map(sg => tt(sg[1])); return `<button class="symrow" data-symdis="${id}"><b>${tt(d.name)}</b><span class="num">${digits(n)} ${tt(SYMPTOMS.match)}</span><span class="m">${m.join(' · ')}</span></button>`; }).join('')}</div>`;
}
function renderSymptoms() {
  return `<details class="sym" ${U.symOpen ? 'open' : ''}><summary>${ic('alert')}<b>${tt(SYMPTOMS.title)}</b></summary>
    <p class="hint">${tt(SYMPTOMS.lede)}</p>
    <div class="chips">${SYMPTOMS.signs.map(([id, n]) => `<button class="chip" data-sign="${id}" aria-pressed="${U.signs.has(id)}">${tt(n)}</button>`).join('')}${U.signs.size ? `<button class="chip ghost" data-signclear>${tt(SYMPTOMS.clear)}</button>` : ''}</div>
    <div id="symRes">${renderSymRes()}</div>
    <div class="warnbox strong">${ic('alert')}<span>${tt(SYMPTOMS.warn)}</span></div></details>`;
}
const humpSlider = () => `<div class="sl"><div class="sl-top"><label for="humpR">${tt(CLIMATE.hump)}</label><output class="num" id="humpOut">${pct(STATE.hump)}</output></div><input class="rng" type="range" id="humpR" min="0" max="100" step="1" value="${STATE.hump}" style="--fill:var(--fat)"></div>`;
const lossSlider = () => `<div class="sl"><div class="sl-top"><label for="lossR">${tt(CLIMATE.loss)}</label><output class="num" id="lossOut">${pct(STATE.loss)}</output></div><input class="rng" type="range" id="lossR" min="0" max="28" step=".5" value="${STATE.loss}" style="--fill:var(--water)"><div class="sl-scale num"><span>${pct(0)}</span><span>${pct(12)}</span><span>${pct(25)}</span></div></div>`;
function renderMovement() {
  const M = MOVEMENT;
  return `<div class="seg" role="group">${M.gaits.map(([k, n]) => `<button data-gait="${k}" aria-pressed="${STATE.gait === k}">${tt(n)}</button>`).join('')}</div>
    <div class="row" style="margin-top:8px"><span style="font-size:13px;color:var(--bone-2);min-width:52px">${tt(M.speed)}</span><div class="seg" style="flex:1">${M.speeds.map(([k, n]) => `<button data-speed="${k}" aria-pressed="${STATE.speed === k}">${tt(n)} <small class="num">${digits(k)}×</small></button>`).join('')}</div></div>
    <div class="row" style="margin-top:8px"><button class="btn small" id="btnPairs" aria-pressed="${U.pairs}">${tt(M.pairs)}</button><button class="btn small" id="btnFollow" aria-pressed="${U.follow}">${tt(M.follow)}</button></div>
    <div class="sec-label">${tt(M.diagram)}</div><div class="gait" id="gaitDia"></div><p class="hint">${tt(M.dNote)}</p>
    <div class="sec-label">${tt(M.actions)}</div>
    <div class="row"><button class="btn small" id="actCouch">${ic('couch')}${tt(STATE.couched ? M.rise : M.couch)}</button><button class="btn small" id="actDrink">${ic('drop')}${tt(M.drink)}</button><button class="btn small" id="actStorm">${ic('wind')}${tt(M.storm)}</button></div>
    <div class="sec-label">${LANG === 'ar' ? 'افهم' : 'Understand'}</div>
    <div class="topics">${M.topics.map(tp => topicHTML(tp)).join('')}</div>`;
}
function renderClimate() {
  const C = CLIMATE;
  return `<div class="row"><span style="font-size:13px;color:var(--bone-2);min-width:52px">${tt(C.season)}</span><div class="seg" style="flex:1">${C.seasons.map(([k, n]) => `<button data-season="${k}" aria-pressed="${STATE.season === k}">${tt(n)}</button>`).join('')}</div></div>
    <div class="row" style="margin-top:6px"><span style="font-size:13px;color:var(--bone-2);min-width:52px">${tt(C.view)}</span><div class="seg" style="flex:1">${C.views.map(([k, n]) => `<button data-layer="${k}" aria-pressed="${STATE.layer === k}">${tt(n)}</button>`).join('')}</div></div>
    ${lossSlider()}${humpSlider()}
    <div class="status" id="statusBox" data-l="0"><div class="lamp"><i></i><i></i><i></i></div><div><b id="stTitle"></b><span id="stWhy"></span></div></div>
    <p class="hint">${tt(UI.illustrative)}</p>
    <div class="row"><button class="btn small" id="actDrink">${ic('drop')}${tt(MOVEMENT.drink)}</button><button class="btn small" id="actStorm">${ic('wind')}${tt(MOVEMENT.storm)}</button></div>
    <div class="sec-label">${LANG === 'ar' ? 'افهم' : 'Understand'}</div>
    <div class="topics">${C.topics.map(tp => topicHTML(tp)).join('')}</div>`;
}
function renderLife() {
  const F = LIFE;
  return `<div class="stages" role="group">${F.stages.map(s => `<button class="stage" data-stage="${s.id}" aria-pressed="${STATE.stage === s.id}"><b>${tt(s.name)}</b><span class="num">${tt(s.age)}</span></button>`).join('')}</div>
    <div id="lifeInfo"></div>
    <div class="sec-label">${tt(F.namesTitle)}</div>
    <table class="names"><thead><tr>${F.nameCols.map(c => `<th>${tt(c)}</th>`).join('')}</tr></thead><tbody>${F.names.map(n => `<tr data-st="${n[4]}"><td>${n[0]}</td><td>${tt(n[1])}</td><td>${tt(n[2])}</td><td>${tt(n[3])}</td></tr>`).join('')}</tbody></table>
    <p class="note">${tt(F.namesNote)}</p>
    <div class="topics"><div class="topic" data-topic="teeth"><button aria-expanded="false"><span class="ti">${ic('tooth')}</span><span class="tt"><b>${tt(F.teethTitle)}</b><span>${LANG === 'ar' ? '٢٢ لبنية و٣٤ دائمة' : '22 milk teeth, 34 permanent'}</span></span>${chev}</button><div class="body" hidden>${tt(F.teeth)}${teethFig()}${srcLinks(['teeth', 'msdAge', 'dental', 'thaalibi'])}</div></div></div>
    ${srcLinks(['gest', 'bw', 'wean', 'orphan', 'teeth', 'thaalibi', 'zakat', 'saudipedia'])}`;
}
function renderLifeInfo() {
  const el = $('#lifeInfo'); if (!el) return;
  const I = LIFE.info[STATE.stage], H = LIFE.hdr;
  el.innerHTML = `<div class="topics" style="margin-top:10px">${['body', 'food', 'behave', 'risk', 'climate'].map((k, i) => `<div class="topic${i === 0 ? ' open' : ''}" data-lk="${k}"><button aria-expanded="${i === 0}"><span class="ti">${ic(['hump', 'food', 'gait', 'alert', 'sun'][i])}</span><span class="tt"><b>${tt(H[k])}</b></span>${chev}</button><div class="body"${i === 0 ? '' : ' hidden'}><p>${tt(I[k])}</p></div></div>`).join('')}
    <div class="topic"><button aria-expanded="false"><span class="ti">${ic('shield')}</span><span class="tt"><b>${tt(H.ills)}</b><span>${I.ills.map(id => tt(HEALTH.list.find(d => d.id === id).name)).join(' · ')}</span></span></button></div></div>`;
  $$('#lifeInfo .topic[data-lk]>button').forEach(b => b.onclick = () => { const t = b.parentElement, open = !t.classList.contains('open'); t.classList.toggle('open', open); b.setAttribute('aria-expanded', open); t.querySelector('.body').hidden = !open; });
  const ills = $$('#lifeInfo .topic:last-child button'); ills.forEach(b => b.onclick = () => go('health'));
  $$('.names tr').forEach(r => r.classList.toggle('cur', r.dataset.st === STATE.stage));
}
function teethFig() {
  // lower jaw from the front: three incisors each side + canines; filled when permanent at the chosen stage
  const perm = { newborn: 0, juvenile: 0, adult: 4, old: 4 }[STATE.stage] || 0, worn = STATE.stage === 'old';
  let s = '';
  const lab = LANG === 'ar' ? ['قواطع لبنية', 'قواطع دائمة', 'ناب'] : ['milk incisors', 'permanent incisors', 'canine'];
  for (let i = 0; i < 3; i++) for (const sd of [-1, 1]) {
    const x = 150 + sd * (16 + i * 26), p = perm > i, h = p ? (worn ? 26 : 38) : 24, w = p ? 20 : 15;
    s += `<rect x="${x - w / 2}" y="${70 - h}" width="${w}" height="${h}" rx="6" fill="${p ? '#f1e9db' : 'rgba(241,233,219,.35)'}" stroke="rgba(241,233,219,.6)"/>`;
  }
  for (const sd of [-1, 1]) s += `<path d="M${150 + sd * 104} 70 l${sd * 6} -30 l${sd * 8} 30z" fill="${perm >= 4 ? '#f1e9db' : 'rgba(241,233,219,.25)'}"/>`;
  return `<figure class="fig"><svg viewBox="0 0 300 100"><path d="M40 72 Q150 100 260 72" fill="none" stroke="rgba(241,233,219,.4)" stroke-width="2"/>${s}<text x="150" y="94" text-anchor="middle" style="font-size:11px;fill:rgba(241,233,219,.6)">${lab[perm ? 1 : 0]} · ${lab[2]}</text></svg><figcaption>${LANG === 'ar' ? 'الفكّ السفلي من الأمام للمرحلة المختارة (تبسيط).' : 'Lower jaw from the front for the chosen stage (simplified).'}</figcaption></figure>`;
}
function renderHealth() {
  const Hh = HEALTH;
  const list = Hh.list.filter(d => U.filter === 'all' || (U.filter === 'zoo' ? d.zoo : d.sys.includes(U.filter)));
  return `<div class="warnbox">${ic('alert')}<span>${tt(Hh.disclaimer)}</span></div>
    ${renderSymptoms()}
    <div class="filters" role="group">${Hh.filters.map(([k, n]) => `<button data-filter="${k}" aria-pressed="${U.filter === k}">${tt(n)}</button>`).join('')}</div>
    <div class="topics">${list.map(d => `<div class="topic" data-dis="${d.id}"><button aria-expanded="false"><span class="ti">${ic(d.sys.includes('skin') ? 'coat' : d.sys.includes('resp') ? 'lungs' : d.sys.includes('gut') ? 'stomach' : d.sys.includes('repro') ? 'uterus' : d.sys.includes('move') ? 'foot' : 'heart')}</span><span class="tt"><b>${tt(d.name)}</b><span>${d.zoo ? `<span class="flag z">${tt(UI.zoo)}</span>` : ''}${d.vax ? `<span class="flag v">${tt(UI.flags.vaccine)}</span>` : ''}</span></span>${chev}</button>
      <div class="body" hidden>${['cause', 'spread', 'signs', 'dx', 'prev', 'tx'].map(k => `<h4>${tt(UI.hdr[k])}</h4><p>${tt(d[k])}</p>`).join('')}${d.zadv ? `<div class="zbox"><b>${tt(UI.zooAdvice)}:</b> ${tt(d.zadv)}</div>` : ''}${d.org && d.org.length ? `<h4>${tt(HEALTH.orgLabel)}</h4><div class="chips">${d.org.map(o => `<button class="chip" data-goorgan="${o}">${tt(ATLAS.organs[o].name)}</button>`).join('')}</div>` : ''}<div class="vet">${ic('shield')}<span>${tt(UI.vet)}</span></div>${srcLinks(d.src)}</div></div>`).join('')}</div>`;
}
function renderPrevention() {
  const P = PREVENT;
  return `<div class="warnbox">${ic('alert')}<span>${tt(P.honest)}</span></div>
    <div class="sec-label">${tt(P.tlTitle)}</div>
    <div class="tl">${P.timeline.map(([w, t]) => `<div class="tl-row"><span class="when">${tt(w)}</span><span class="what">${tt(t)}</span></div>`).join('')}</div>
    <div class="sec-label">${tt(P.vTitle)}</div>
    <table class="vtable"><thead><tr>${P.vCols.map(c => `<th>${tt(c)}</th>`).join('')}</tr></thead><tbody>${P.vaccines.map(([d, s, n]) => `<tr><td>${tt(d)}</td><td><span class="pill ${s}">${tt(P.vKey[s])}</span></td><td>${tt(n)}</td></tr>`).join('')}</tbody></table>
    <div class="sec-label">${tt(P.careTitle)}</div>
    <div class="topics">${P.care.map(([i, a, b]) => `<div class="topic"><button aria-expanded="false" style="cursor:default"><span class="ti">${ic(i)}</span><span class="tt"><b>${tt(a)}</b><span>${tt(b)}</span></span></button></div>`).join('')}</div>
    <div class="vet">${ic('shield')}<span>${tt(UI.vet)}</span></div>
    ${srcLinks(['cpVax', 'cpLive', 'mci', 'rev1', 'mersVax', 'resist', 'mewa', 'orphan'])}`;
}
function renderSources() {
  const m = MODEL3D.cfg && MODEL3D.ready ? MODEL3D.cfg : null;
  const model = m ? `<div class="sec-label">${LANG === 'ar' ? 'مجسّم الناقة' : 'Camel model'}</div><ul class="srcs"><li>${m.url ? `<a href="${esc(m.url)}" target="_blank" rel="noopener">${esc(m.title || 'Camel')}</a>` : esc(m.title || 'Camel')} — ${esc(m.author || '')} — ${esc(m.license || '')}</li></ul>` : '';
  return `${model}${tt(SOURCES_TXT.method)}${SRC_GROUPS.map(([g, n]) => { const items = SOURCES.filter(s => s[1] === g); return items.length ? `<div class="sec-label">${tt(n)}</div><ul class="srcs">${items.map(s => `<li><a href="${s[3]}" target="_blank" rel="noopener">${esc(s[2])}</a></li>`).join('')}</ul>` : ''; }).join('')}<p class="hint">${tt(SOURCES_TXT.built)}</p>`;
}

function wirePanel() {
  const on = (sel, ev, fn) => $$(sel).forEach(el => el.addEventListener(ev, fn));
  on('#homeTour', 'click', () => TOURX.start());
  on('#homeExplore', 'click', () => go('anatomy'));
  on('[data-goto]', 'click', e => go(e.currentTarget.dataset.goto));
  on('[data-layer]', 'click', e => { setLayer(e.currentTarget.dataset.layer); });
  on('[data-sec]', 'click', e => { const k = e.currentTarget.dataset.sec || null; setSection(k); if (k === 'sagittal') { if (STATE.layer === 'skin' || STATE.layer === 'muscle') setLayer('organs'); focusCam({ t: [.3, 1.3, 0], r: 1.4, az: 0, el: .05 }); } if (k === 'trans') { U.sectionX = .3; const s = $('#secPos'); if (s) { s.value = .3; pctRange(s); } focusCam({ t: [.3, 1.3, 0], r: 1.3, az: 1.05, el: .12 }); } });
  on('#secPos', 'input', e => { U.sectionX = +e.target.value; pctRange(e.target); });
  on('#btnExplode', 'click', e => { STATE.explode = STATE.explode > .5 ? 0 : 1; e.currentTarget.setAttribute('aria-pressed', String(STATE.explode > .5)); if (STATE.explode > .5 && STATE.layer !== 'organs') setLayer('organs'); });
  on('#btnLabels', 'click', e => { U.labels = !U.labels; e.currentTarget.setAttribute('aria-pressed', String(U.labels)); });
  on('#btnPeel', 'click', e => { U.peel = !U.peel; e.currentTarget.setAttribute('aria-pressed', String(U.peel)); $('#peelHint').hidden = !U.peel; if (U.peel && STATE.layer !== 'skin' && STATE.layer !== 'muscle') setLayer('skin'); if (U.peel && !ANAT.built) ANAT.build(WORLD.stages.adult.camel).then(() => ANAT.setLayer('peel')); });
  on('[data-gait]', 'click', e => { setGait(e.currentTarget.dataset.gait); if (U.chapter === 'movement') focusCam(VIEWS.movement, true); });
  on('[data-speed]', 'click', e => setSlow(+e.currentTarget.dataset.speed));
  on('#btnPairs', 'click', e => { U.pairs = !U.pairs; e.currentTarget.setAttribute('aria-pressed', String(U.pairs)); HL.pairs(U.pairs); });
  on('#btnFollow', 'click', e => { U.follow = !U.follow; e.currentTarget.setAttribute('aria-pressed', String(U.follow)); });
  on('#actCouch', 'click', () => ACT.couch());
  on('#actDrink', 'click', () => ACT.drink());
  on('#actStorm', 'click', () => ACT.storm());
  on('[data-season]', 'click', e => { userSetTime(); setSeason(e.currentTarget.dataset.season); });
  on('#lossR', 'input', e => { STATE.loss = +e.target.value; $('#lossOut').textContent = pct(STATE.loss, STATE.loss % 1 ? 1 : 0); pctRange(e.target); drawDay(true); });
  on('#humpR', 'input', e => { STATE.hump = +e.target.value; $('#humpOut').textContent = pct(STATE.hump); pctRange(e.target); });
  on('[data-stage]', 'click', e => setStage(e.currentTarget.dataset.stage));
  on('[data-filter]', 'click', e => { U.filter = e.currentTarget.dataset.filter; renderPanel(); });
  on('[data-sex]', 'click', e => setSex(e.currentTarget.dataset.sex));
  on('[data-organ]', 'click', e => { const id = e.currentTarget.dataset.organ; if (U.topic === 'o-' + id) closeTopic(); else openOrgan(id, true); });
  on('[data-goorgan]', 'click', e => go('anatomy', 'o-' + e.currentTarget.dataset.goorgan));
  on('details.sym', 'toggle', e => { U.symOpen = e.currentTarget.open; });
  on('[data-sign]', 'click', e => { const id = e.currentTarget.dataset.sign; if (U.signs.has(id)) U.signs.delete(id); else U.signs.add(id); e.currentTarget.setAttribute('aria-pressed', String(U.signs.has(id))); refreshSym(); });
  on('[data-signclear]', 'click', () => { U.signs.clear(); renderPanel(); });
  wireSymRes();
  wireOrganCard();
  $$('.rng').forEach(pctRange);
  // topics
  $$('.topic[data-topic]>button, .topic[data-dis]>button').forEach(b => b.addEventListener('click', () => {
    const t = b.parentElement, id = t.dataset.topic || t.dataset.dis;
    if (t.classList.contains('open')) closeTopic(); else openTopic(id);
  }));
  if (U.chapter === 'life') renderLifeInfo();
  if (U.chapter === 'movement') buildGaitDiagram();
  if (U.chapter === 'climate') updateStatus(true);
}

function refreshSym() {
  const r = $('#symRes'); if (r) { r.innerHTML = renderSymRes(); wireSymRes(); }
  const cl = $('[data-signclear]');
  if (!!cl !== U.signs.size > 0) { const y = $('#pscroll').scrollTop; renderPanel(); $('#pscroll').scrollTop = y; }
}
function wireSymRes() { $$('[data-symdis]').forEach(b => b.onclick = () => { const id = b.dataset.symdis; if (U.filter !== 'all') { U.filter = 'all'; renderPanel(); } openTopic(id, true); }); }

export { renderPanel, sysOf, openOrgan, clearDiseaseLook, showDiseaseLook, diseaseCam, renderLifeInfo };
