import { $, $$, ACT, ANATOMY, applyViewOffset, ATLAS, CHAPTERS, clamp, CLIMATE, clock, CU, digits, easeInOut,
  ENV, GAITS, go, HEALTH, L, LANG, lerp, LIFE, MODEL, MOVEMENT, norm, num, openTopic, PREVENT, root,
  samplePalette, setGait, setSlow, setStage, STATE, SYMPTOMS, sysOf, TAU, TOUR, tt, U, UI, WORLD, wrap24 } from '../app.js';

/* ─────────── dock: day canvas and live readout ─────────── */
const DAY = { dirty: true };
function drawDay(force) {
  const cv = $('#dayCanvas'); if (!cv) return;
  const knob = $('#dayKnob'), p = STATE.hour / 24;
  knob.style[root.dir === 'rtl' ? 'right' : 'left'] = `calc(${(p * 100).toFixed(3)}% - 1px)`;
  knob.style[root.dir === 'rtl' ? 'left' : 'right'] = 'auto';
  $('#clock').textContent = clock(STATE.hour);
  $('#day').value = STATE.hour;
  const r = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
  if (!r.width) return;
  if (cv.width !== Math.round(r.width * dpr) || force) {
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    const x = cv.getContext('2d'), W = cv.width, H = cv.height, rtl = root.dir === 'rtl';
    for (let i = 0; i < W; i++) {
      const h = (rtl ? 1 - i / W : i / W) * 24, P = samplePalette(h);
      const c = P.top.clone().lerp(P.hor, .55);
      x.fillStyle = `rgb(${Math.pow(c.r, 1 / 2.2) * 255 | 0},${Math.pow(c.g, 1 / 2.2) * 255 | 0},${Math.pow(c.b, 1 / 2.2) * 255 | 0})`;
      x.fillRect(i, 0, 1, H);
    }
    const tb = h => MODEL.tb(h, STATE.loss, STATE.season), air = h => MODEL.air(h, STATE.season);
    const lo = STATE.season === 'winter' ? 0 : 24, hi = 46, Y = t => H - (t - lo) / (hi - lo) * H * .9 - H * .05;
    const line = (f, col, wdt, dash) => { x.beginPath(); for (let i = 0; i <= 96; i++) { const h = i / 4, px = (rtl ? 1 - h / 24 : h / 24) * W; x[i ? 'lineTo' : 'moveTo'](px, Y(f(h))); } x.strokeStyle = col; x.lineWidth = wdt * dpr; x.setLineDash(dash ? [3 * dpr, 3 * dpr] : []); x.stroke(); };
    line(air, 'rgba(255,255,255,.55)', 1, true);
    line(tb, '#f2a14c', 2);
    x.setLineDash([]);
  }
}
function setHour(h) { STATE.hour = wrap24(h); U.hourTween = null; drawDay(); }
function hourTo(h, dur = 1.6) { let d = wrap24(h) - STATE.hour; if (d > 12) d -= 24; if (d < -12) d += 24; if (Math.abs(d) < .05) return; U.hourTween = { from: STATE.hour, d, t: 0, dur: ENV.reduce ? .01 : dur }; }
function tweenHour(dt) { const w = U.hourTween; if (!w) return; w.t = Math.min(1, w.t + dt / w.dur); STATE.hour = wrap24(w.from + w.d * easeInOut(w.t)); drawDay(); if (w.t >= 1) U.hourTween = null; }
function setPlaying(p) { STATE.playing = p; $('#playIc').innerHTML = p ? '<path d="M8 5v14M16 5v14"/>' : '<path d="M8 5.5v13l10-6.5z"/>'; }
function updateReadout() {
  const tb = MODEL.tb(STATE.hour, STATE.loss, STATE.season), air = MODEL.air(STATE.hour, STATE.season);
  const saved = STATE.season === 'summer' ? MODEL.litres(MODEL.storedKJ(STATE.hour, STATE.loss, STATE.season)) : 0;
  const u = tt(UI.deg);
  $('#roTb').innerHTML = `${num(tb, 1)}<small>${u}</small>`;
  $('#roAir').innerHTML = `${num(air, 0)}<small>${u}</small>`;
  $('#roSaved').innerHTML = `${num(saved, 1)}<small>${tt(UI.litre)}</small>`;
  const st = MODEL.status(STATE);
  const ro = $('#roStatus'); ro.textContent = tt(UI.st[st.level]); ro.style.color = ['var(--ok)', 'var(--warn)', 'var(--bad)'][st.level];
  CU.uTb.value = tb; CU.uTair.value = air; CU.uTmin.value = STATE.season === 'winter' ? -2 : 22; CU.uTmax.value = STATE.season === 'winter' ? 42 : 58;
  CU.uSolar.value = Math.max(0, WORLD.sunDir.y) * (STATE.season === 'winter' ? 10 : 22);
  updateStatus();
}
let lastStatus = '';
function updateStatus(force) {
  const box = $('#statusBox'); if (!box) return;
  const st = MODEL.status(STATE), key = st.level + st.reasons.join() + LANG;
  if (key === lastStatus && !force) return; lastStatus = key;
  box.dataset.l = st.level;
  $('#stTitle').textContent = tt(CLIMATE.statusLbl) + ': ' + tt(UI.st[st.level]);
  $('#stWhy').textContent = st.reasons.map(r => tt(CLIMATE.reasons[r])).join(' ');
}

/* ─────────── gait diagram ─────────── */
function buildGaitDiagram() {
  const el = $('#gaitDia'); if (!el) return;
  const g = GAITS[STATE.gait === 'pace' ? 'pace' : 'walk'], rows = ['HL', 'FL', 'HR', 'FR'], names = MOVEMENT.dLegs, W = 300, lab = 84, w = W - lab - 8;
  const rtl = root.dir === 'rtl', x0 = rtl ? 8 : lab, X = f => rtl ? x0 + w - f * w : x0 + f * w;
  let s = '';
  rows.forEach((k, i) => {
    const y = 8 + i * 22, col = k[1] === 'L' ? '#ffb347' : '#5cc8ff', off = g.off[k];
    s += `<text x="${rtl ? W - 2 : 2}" y="${y + 11}" text-anchor="${rtl ? 'end' : 'start'}" style="font-size:12.5px">${tt(names[i])}</text>`;
    s += `<rect x="${x0}" y="${y}" width="${w}" height="14" rx="4" fill="rgba(255,255,255,.05)"/>`;
    for (const shift of [0, -1, 1]) {
      const a = off + shift, b = off + g.duty + shift, aa = clamp(a, 0, 1), bb = clamp(b, 0, 1);
      if (bb > aa) { const xa = X(aa), xb = X(bb); s += `<rect x="${Math.min(xa, xb)}" y="${y + 1}" width="${Math.abs(xb - xa)}" height="12" rx="4" fill="${col}" opacity="${STATE.gait === 'stand' ? .25 : .75}"/>`; }
    }
  });
  s += `<line id="gaitCur" x1="${X(0)}" x2="${X(0)}" y1="4" y2="${8 + 4 * 22}" stroke="#fff" stroke-width="1.5"/>`;
  el.innerHTML = `<svg viewBox="0 0 ${W} ${16 + 4 * 22}">${s}</svg>`;
  el.__g = STATE.gait;
}
function updateGaitCursor() {
  const el = $('#gaitDia'); if (!el) return;
  if (el.__g !== STATE.gait) buildGaitDiagram();
  const c = $('#gaitCur'); if (!c || !WORLD.crig) return;
  const W = 300, lab = 84, w = W - lab - 8, rtl = root.dir === 'rtl', x0 = rtl ? 8 : lab, f = WORLD.crig.phase;
  const x = rtl ? x0 + w - f * w : x0 + f * w;
  c.setAttribute('x1', x); c.setAttribute('x2', x);
}

/* ─────────── insets: the microscopic and the hidden ─────────── */
const FIGL = {
  turb: L('المحارات', 'turbinates'), exhale: L('زفير دافئ رطب', 'warm, moist breath'), out: L('يخرج أبرد وأجفّ', 'leaves cooler, drier'),
  cortex: L('القشرة', 'cortex'), medulla: L('اللبّ', 'medulla'), loop: L('عُرى طويلة', 'long loops'),
  camel: L('كرية الناقة: بيضاوية', 'camel cell: oval'), other: L('معظم الثدييات: قرص', 'most mammals: a disc'),
};
const INSET = {
  kind: null, cells: [], t: 0,
  show(kind) {
    this.kind = kind; const el = $('#inset'); el.classList.remove('off');
    setTimeout(() => this.wire(), 0);
    const f = k => tt(FIGL[k]);
    const close = `<button class="btn small" style="height:26px;padding:0 9px" data-x aria-label="${tt(UI.close)}">×</button>`;
    if (kind === 'rbc') {
      el.innerHTML = `<div class="ih"><span>${LANG === 'ar' ? 'تحت المجهر: كريات الدم الحمراء' : 'Under the microscope: red cells'}</span>${close}</div><canvas id="rbcCv" width="460" height="300"></canvas><p>${LANG === 'ar' ? 'بيضاوية. حين تشرب بسرعة تنتفخ ولا تنفجر.' : 'Oval. When she drinks fast they swell and do not burst.'}</p>`;
      if (!this.cells.length) for (let i = 0; i < 22; i++) this.cells.push({ x: Math.random() * 460, y: 20 + Math.random() * 260, a: Math.random() * Math.PI, s: .6 + Math.random() * .6, v: 10 + Math.random() * 14, p: Math.random() * 6 });
    } else if (kind === 'nose') {
      const spiral = (cx, cy) => { let d = ''; for (let i = 0; i <= 60; i++) { const a = i / 60 * 5.5 * Math.PI, r = 14 * (1 - i / 70); d += (i ? 'L' : 'M') + (cx + r * Math.cos(a)).toFixed(1) + ' ' + (cy + r * Math.sin(a)).toFixed(1); } return `<path d="${d}" stroke="rgba(243,235,221,.7)" fill="none" stroke-width="1.1"/>`; };
      el.innerHTML = `<div class="ih"><span>${LANG === 'ar' ? 'مقطع في الأنف' : 'Inside the nose'}</span>${close}</div>` +
        `<svg viewBox="0 0 300 124" style="background:#101a28">` +
        `<defs><linearGradient id="gB" x1="${root.dir === 'rtl' ? 1 : 0}" x2="${root.dir === 'rtl' ? 0 : 1}"><stop offset="0" stop-color="#f2a14c"/><stop offset="1" stop-color="#9cc4e8"/></linearGradient></defs>` +
        `<path d="M16 36 H250 Q282 36 282 60 Q282 84 250 84 H16" stroke="rgba(243,235,221,.5)" fill="none"/>` +
        `${spiral(110, 60)}${spiral(150, 60)}` +
        `${spiral(190, 60)}<path d="M24 60 H276" stroke="url(#gB)" stroke-width="2" fill="none" stroke-dasharray="5 5"><animate attributeName="stroke-dashoffset" from="20" to="0" dur="1s" repeatCount="indefinite"/></path>` +
        `<circle cx="120" cy="92" r="3" fill="#9cc4e8"/>` +
        `<circle cx="160" cy="95" r="2.5" fill="#9cc4e8"/>` +
        `<circle cx="196" cy="92" r="2" fill="#9cc4e8"/>` +
        `<text x="150" y="24" text-anchor="middle" fill="rgba(243,235,221,.8)" style="font-size:12px">${f('turb')}</text>` +
        `<text x="70" y="112" text-anchor="middle" fill="rgba(243,235,221,.7)" style="font-size:11px">${f('exhale')}</text>` +
        `<text x="236" y="112" text-anchor="middle" fill="rgba(243,235,221,.7)" style="font-size:11px">${f('out')}</text></svg>` +
        `<p>${LANG === 'ar' ? 'نحو ٦٠٪ من ماء التنفّس يُستردّ (تقدير ١٩٨١).' : 'About 60% of respiratory water is recovered (1981 estimate).'}</p>`;
    } else if (kind === 'kidney') {
      let loops = ''; for (let i = 0; i < 7; i++) { const a = (-.9 + i * .3), x0 = 150 + Math.sin(a) * 88, y0 = 64 - Math.cos(a) * 46, x1 = 150 + Math.sin(a) * 26, y1 = 66 - Math.cos(a) * 14; loops += `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} L${x1.toFixed(1)} ${y1.toFixed(1)}" stroke="rgba(243,235,221,.75)" stroke-width="1.2"/>`; }
      el.innerHTML = `<div class="ih"><span>${LANG === 'ar' ? 'مقطع في الكلية' : 'A kidney in section'}</span>${close}</div>` +
        `<svg viewBox="0 0 300 124" style="background:#1a0d10">` +
        `<path d="M150 10 C230 8 262 60 236 96 C218 120 188 110 170 98 C160 92 140 92 130 98 C112 110 82 120 64 96 C38 60 70 8 150 10Z" fill="rgba(140,48,41,.35)" stroke="#b0504a" stroke-width="1.4"/>` +
        `<path d="M150 22 C218 22 244 62 224 90 C212 104 190 100 176 90 C162 82 138 82 124 90 C110 100 88 104 76 90 C56 62 82 22 150 22Z" fill="rgba(140,48,41,.4)" stroke="rgba(243,235,221,.35)" stroke-dasharray="3 3"/>${loops}` +
        `<text x="262" y="24" text-anchor="middle" fill="rgba(243,235,221,.8)" style="font-size:11px">${f('cortex')}</text>` +
        `<text x="150" y="118" text-anchor="middle" fill="rgba(243,235,221,.8)" style="font-size:11px">${f('medulla')} · ${f('loop')}</text></svg>` +
        `<p>${LANG === 'ar' ? 'لبّ عميق وعُرى طويلة تعيد امتصاص الماء.' : 'A deep medulla with long loops that reclaim water.'}</p>`;
    }
  },
  hide() { this.kind = null; $('#inset').classList.add('off'); },
  wire() { const b = $('#inset [data-x]'); if (b) b.onclick = () => this.hide(); },
  update(dt) {
    if (this.kind !== 'rbc') return;
    const cv = $('#rbcCv'); if (!cv) return;
    const x = cv.getContext('2d'), W = 460, H = 300; this.t += dt;
    const swell = STATE.drink ? Math.sin(Math.PI * clamp(STATE.drink.t / STATE.drink.dur, 0, 1)) : 0, dry = MODEL.dry(STATE.loss);
    const bg = x.createRadialGradient(W * .45, H * .4, 20, W / 2, H / 2, W * .6);
    bg.addColorStop(0, `rgb(${lerp(88, 128, swell) | 0},${lerp(26, 46, swell) | 0},${lerp(30, 48, swell) | 0})`); bg.addColorStop(1, 'rgb(40,9,14)');
    x.fillStyle = bg; x.fillRect(0, 0, W, H);
    for (const c of this.cells) {
      c.x += c.v * dt * (root.dir === 'rtl' ? -1 : 1); if (c.x > W + 40) c.x = -40; if (c.x < -40) c.x = W + 40;
      const rx = 30 * c.s * (1 + .12 * swell - .06 * dry), ry = 17 * c.s * (1 + .55 * swell - .1 * dry);
      x.save(); x.translate(c.x, c.y + Math.sin(this.t + c.p) * 4); x.rotate(c.a + Math.sin(this.t * 1.3 + c.p) * .12);
      const g = x.createRadialGradient(-rx * .2, -ry * .3, 1, 0, 0, rx); g.addColorStop(0, '#ef7068'); g.addColorStop(.55, '#c8343c'); g.addColorStop(1, '#8f1a23');
      x.fillStyle = g; x.beginPath(); x.ellipse(0, 0, rx, ry, 0, 0, TAU); x.fill(); x.strokeStyle = 'rgba(255,200,190,.25)'; x.stroke(); x.restore();
    }
  },
};

/* ─────────── search palette ─────────── */
const SEARCH = {
  idx: null, sel: 0, res: [],
  build() {
    const I = [];
    const add = (kind, title, sub, act, extra = '') => I.push({ kind, title, sub, act, key: norm(tt(title) + ' ' + tt(sub) + ' ' + (typeof title === 'object' ? title.ar + ' ' + title.en : '') + ' ' + extra) });
    CHAPTERS.forEach(c => add(L('فصل', 'Chapter'), c.name, L('', ''), () => go(c.id)));
    ANATOMY.topics.forEach(t => add(L('تشريح', 'Anatomy'), t.title, t.sum, () => go('anatomy', t.id), t.body.ar + t.body.en));
    MOVEMENT.topics.forEach(t => add(L('حركة', 'Movement'), t.title, t.sum, () => go('movement', t.id), t.body.ar + t.body.en));
    CLIMATE.topics.forEach(t => add(L('مناخ', 'Climate'), t.title, t.sum, () => go('climate', t.id), t.body.ar + t.body.en));
    HEALTH.list.forEach(d => add(L('مرض', 'Disease'), d.name, d.signs, () => go('health', d.id), [d.cause, d.spread].map(x => x.ar + x.en).join(' ')));
    Object.values(ATLAS.organs).forEach(o => add(L('عضو', 'Organ'), o.name, sysOf(o.id).name, () => go('anatomy', 'o-' + o.id), o.fn.ar + o.fn.en + o.camel.ar + o.camel.en));
    SYMPTOMS.signs.forEach(([id, n]) => add(L('علامة', 'Sign'), n, SYMPTOMS.title, () => { U.signs.add(id); U.symOpen = true; U.filter = 'all'; go('health'); }));
    LIFE.stages.forEach(s => add(L('العمر', 'Age'), s.name, s.age, () => { go('life'); setStage(s.id); }));
    LIFE.names.forEach(n => add(L('اسم', 'Name'), L(n[0], n[0]), n[1], () => go('life'), n[2].ar + n[2].en));
    PREVENT.care.forEach(([i, a, b]) => add(L('وقاية', 'Prevention'), a, b, () => go('prevention')));
    add(L('فعل', 'Action'), L('اشربي', 'Drink'), L('نحو مئة لتر', 'about 100 L'), () => { go('movement'); ACT.drink(); });
    add(L('فعل', 'Action'), L('عاصفة رملية', 'Sandstorm'), L('الجفن الثالث والمنخران', 'third eyelid, nostrils'), () => { go('movement'); ACT.storm(); });
    add(L('فعل', 'Action'), L('ابرُك', 'Couch'), L('البروك والنهوض', 'couching and rising'), () => { go('movement', 'couch'); });
    add(L('فعل', 'Action'), L('الرهوان بالتصوير البطيء', 'Pace in slow motion'), L('', ''), () => go('movement', 'pace'));
    this.idx = I;
  },
  open() { this.build(); $('#search').hidden = false; const q = $('#sq'); q.value = ''; this.run(''); q.focus(); },
  close() { $('#search').hidden = true; },
  run(q) {
    const n = norm(q.trim());
    const res = !n ? this.idx.filter(i => i.kind.en === 'Chapter' || i.kind.en === 'Action') : this.idx.map(i => ({ i, s: norm(tt(i.title)).startsWith(n) ? 3 : norm(tt(i.title)).includes(n) ? 2 : i.key.includes(n) ? 1 : 0 })).filter(x => x.s).sort((a, b) => b.s - a.s).map(x => x.i);
    this.res = res.slice(0, 40); this.sel = 0;
    $('#sres').innerHTML = this.res.length ? this.res.map((r, k) => `<button class="s-item" role="option" aria-selected="${k === 0}" data-k="${k}"><span class="k">${tt(r.kind)}</span><span><b>${tt(r.title)}</b>${tt(r.sub) ? `<span>${tt(r.sub)}</span>` : ''}</span></button>`).join('') : `<div class="s-empty">${tt(UI.searchNone)}</div>`;
    $$('#sres .s-item').forEach(b => b.onclick = () => this.pick(+b.dataset.k));
  },
  move(d) { if (!this.res.length) return; this.sel = (this.sel + d + this.res.length) % this.res.length; $$('#sres .s-item').forEach((b, k) => b.setAttribute('aria-selected', String(k === this.sel))); const b = $(`#sres .s-item[data-k="${this.sel}"]`); if (b) b.scrollIntoView({ block: 'nearest' }); },
  pick(k) { const r = this.res[k]; if (!r) return; this.close(); r.act(); },
};

/* ─────────── the guided tour ─────────── */
const TOURX = {
  i: 0, on: false, t: 0, dur: 11,
  start() { this.on = true; this.i = 0; document.body.classList.add('touring'); $('#tour').hidden = false; this.show(); },
  stop() { this.on = false; document.body.classList.remove('touring'); $('#tour').hidden = true; setSlow(1); ACT.stopStorm(); applyViewOffset(); go('home', null, { force: true }); },
  show() {
    const s = TOUR[this.i]; this.t = 0;
    $('#tStep').textContent = digits(`${this.i + 1} / ${TOUR.length}`);
    $('#tTitle').textContent = tt(s.title); $('#tText').textContent = tt(s.text);
    $('#tPrev').disabled = this.i === 0; $('#tNext').textContent = tt(this.i === TOUR.length - 1 ? UI.done : UI.next);
    if (STATE.couched && s.topic !== 'couch') ACT.couch(false);
    if (s.ch !== 'movement') setGait('stand');
    go(s.ch, null, { noHash: true, force: true });
    if (s.stage) setStage(s.stage);
    applyViewOffset();
    if (s.topic) setTimeout(() => { if (this.on) openTopic(s.topic); }, 150);
  },
  next() { if (this.i < TOUR.length - 1) { this.i++; this.show(); } else this.stop(); },
  prev() { if (this.i > 0) { this.i--; this.show(); } },
  update(dt) { if (!this.on) return; this.t += dt; $('#tBar').style.width = Math.min(100, this.t / this.dur * 100) + '%'; if (this.t > this.dur && !ENV.reduce) this.next(); },
};

/* ─────────── keyboard help ─────────── */
function buildKeys() { $('#keysBox').innerHTML = `<h3 style="margin:0 0 12px">${tt(UI.keysTitle)}</h3><div class="keys">${UI.keys.map(([k, d]) => `<kbd>${k}</kbd><span>${tt(d)}</span>`).join('')}</div><div style="margin-top:14px"><button class="btn small" onclick="document.getElementById('keys').hidden=true">${tt(UI.close)}</button></div>`; }

export { drawDay, setHour, hourTo, tweenHour, setPlaying, updateReadout, updateStatus, buildGaitDiagram,
  updateGaitCursor, INSET, SEARCH, TOURX, buildKeys };
