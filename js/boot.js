import { $, ANAT, applyLang, applyViewOffset, atlasFor, ATM, backToDay, buildKeys, BUS, camelFrame, camera,
  CHAPTERS, clamp, closeTopic, CONTACT, CU, damp, digits, drawDay, easeOut, ENV, focalFor, focusCam, FOOT,
  fovFor, frameChapter, go, HL, ic, INSET, LANG, lerp, localToWorldPt, makeRenderer, MODEL, MODEL3D,
  moreMenu, MOVEMENT, openOrgan, patchSunShadows, pct, pctRange, post, Post, Q, renderer, renderPanel, rig, Rig, root,
  scene, SEARCH, setGait, setHour, setLayer, setPlaying, setPost, setRenderer, setRig, sky, smooth, sq,
  STATE, TAU, terrainH, TEX, THREE, toast, TOURX, tt, tweenHour, U, UI, updateCallouts, updateGaitCursor,
  updateReadout, userSetTime, V3, VIEWS, WORLD, wrap24 } from './app.js';

/* ─────────── wiring ─────────── */
function initUI() {
  applyLang(LANG, true);
  BUS.on('anat', () => { if (U.pendingVis) { ANAT.setVisuals(U.pendingVis); U.pendingVis = null; } });
  buildKeys();
  $('#btnLang').onclick = () => applyLang(LANG === 'ar' ? 'en' : 'ar');
  $('#btnSearch').onclick = () => SEARCH.open();
  $('#btnTour').onclick = () => TOURX.on ? TOURX.stop() : TOURX.start();
  $('#btnKeys').onclick = () => { $('#keys').hidden = false; };
  $('#keys').onclick = e => { if (e.target.id === 'keys') $('#keys').hidden = true; };
  $('#brand').onclick = () => go('anatomy');
  $('#brand').onkeydown = e => { if (e.key === 'Enter') go('anatomy'); };
  document.addEventListener('click', e => { if (!$('#moreMenu').hidden && !e.target.closest('#moreMenu')) moreMenu(false); });
  $('#panelToggle').onclick = () => { document.body.classList.toggle('panel-off'); setTimeout(() => { applyViewOffset(); frameChapter(U.chapter); }, 460); };
  $('#tNext').onclick = () => TOURX.next(); $('#tPrev').onclick = () => TOURX.prev(); $('#tExit').onclick = () => TOURX.stop();
  $('#search').onclick = e => { if (e.target.id === 'search') SEARCH.close(); };
  $('#sq').addEventListener('input', e => SEARCH.run(e.target.value));
  $('#sq').addEventListener('keydown', e => { if (e.key === 'ArrowDown') { e.preventDefault(); SEARCH.move(1); } else if (e.key === 'ArrowUp') { e.preventDefault(); SEARCH.move(-1); } else if (e.key === 'Enter') { e.preventDefault(); SEARCH.pick(SEARCH.sel); } else if (e.key === 'Escape') SEARCH.close(); });
  $('#day').addEventListener('input', e => { userSetTime(); setPlaying(false); setHour(+e.target.value); });
  $('#playBtn').onclick = () => { userSetTime(); setPlaying(!STATE.playing); };
  $('#backDay').onclick = backToDay;
  // mobile sheet
  const sheetSizes = () => ({ peek: Math.round(innerHeight * .24), half: Math.round(innerHeight * .44), full: Math.round(innerHeight * .8) });
  const setSheet = k => { U.sheet = k; root.style.setProperty('--sheet-h', sheetSizes()[k] + 'px'); setTimeout(() => applyViewOffset(), 360); };
  setSheet('half');
  let drag = null;
  const hnd = $('#sheetHandle');
  hnd.addEventListener('pointerdown', e => { drag = { y: e.clientY, h: $('#panel').getBoundingClientRect().height, moved: 0 }; hnd.setPointerCapture(e.pointerId); document.body.classList.add('dragging-sheet'); });
  hnd.addEventListener('pointermove', e => { if (!drag) return; const h = clamp(drag.h + drag.y - e.clientY, 80, innerHeight * .85); drag.moved += Math.abs(e.movementY || 0); root.style.setProperty('--sheet-h', h + 'px'); });
  const end = e => { if (!drag) return; document.body.classList.remove('dragging-sheet'); const h = $('#panel').getBoundingClientRect().height, S = sheetSizes(); const moved = Math.abs(e.clientY - drag.y) > 6; drag = null; if (!moved) { setSheet(U.sheet === 'half' ? 'full' : U.sheet === 'full' ? 'peek' : 'half'); return; } const k = Object.keys(S).reduce((a, b) => Math.abs(S[a] - h) < Math.abs(S[b] - h) ? a : b); setSheet(k); };
  hnd.addEventListener('pointerup', end); hnd.addEventListener('pointercancel', end);
  hnd.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSheet(U.sheet === 'half' ? 'full' : U.sheet === 'full' ? 'peek' : 'half'); } });
  // keyboard
  addEventListener('keydown', e => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (e.key === 'Escape') { if (!$('#moreMenu').hidden) moreMenu(false); else if (!$('#search').hidden) SEARCH.close(); else if (!$('#keys').hidden) $('#keys').hidden = true; else if (TOURX.on) TOURX.stop(); else if (U.topic) closeTopic(); return; }
    if (tag === 'input' && e.target.type !== 'range' || tag === 'textarea' || !$('#search').hidden || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.code;
    if (e.key === '/' || k === 'Slash') { e.preventDefault(); SEARCH.open(); return; }
    if (/^Digit[1-8]$/.test(k)) { go(CHAPTERS[+k.slice(5) - 1].id); return; }
    if (k === 'Space' && tag !== 'button') { e.preventDefault(); userSetTime(); setPlaying(!STATE.playing); return; }
    if (k === 'ArrowRight' || k === 'ArrowLeft') { if (tag === 'input') return; const d = (k === 'ArrowRight') !== (root.dir === 'rtl') ? .25 : -.25; userSetTime(); setPlaying(false); setHour(STATE.hour + d); return; }
    if (k === 'KeyW') { const n = { stand: 'walk', walk: 'pace', pace: 'stand' }[STATE.gait]; if (U.chapter !== 'movement') go('movement'); setGait(n); focusCam(VIEWS.movement, true); return; }
    if (k === 'KeyK') { ACT.couch(); return; }
    if (k === 'KeyD') { ACT.drink(); return; }
    if (k === 'KeyS') { ACT.storm(); return; }
    if (k === 'KeyX') { if (U.chapter !== 'anatomy') go('anatomy'); STATE.explode = STATE.explode > .5 ? 0 : 1; if (STATE.explode > .5) setLayer('organs'); renderPanel(); return; }
    if (k === 'KeyL') { const order = ['skin', 'muscle', 'organs', 'skeleton']; if (U.chapter !== 'anatomy') go('anatomy'); setLayer(order[(order.indexOf(STATE.layer) + 1) % order.length]); return; }
    if (k === 'KeyP') { $('#panelToggle').click(); return; }
    if (k === 'KeyT') { TOURX.on ? TOURX.stop() : TOURX.start(); return; }
  });
  // user camera input stops following for a while
  $('#gl').addEventListener('pointerdown', () => { U.userT = performance.now(); });
  $('#gl').addEventListener('wheel', () => { U.userT = performance.now(); }, { passive: true });
  // peel window follows the pointer
  $('#gl').addEventListener('pointermove', e => { U.pointer = { x: e.clientX, y: e.clientY }; });
  addEventListener('resize', () => { drawDay(true); applyViewOffset(); });
  document.body.classList.toggle('dock-off', false);
  // deep link
  let hash = ''; try { hash = decodeURIComponent(location.hash.slice(1)); } catch (e) { /* no hash */ }
  const [hc, ht] = hash.split(/[./~]/);
  return { chapter: CHAPTERS.find(c => c.id === hc) ? hc : 'anatomy', topic: ht || null };
}

/* ════════════════════════════════════════════════════════════════
   main: actions, boot, the frame loop
   ════════════════════════════════════════════════════════════════ */
const ACT = {
  couch(force) {
    const want = force === undefined ? !STATE.couched : !!force;
    if (want === STATE.couched) return;
    if (want) { if (STATE.gait !== 'stand') setGait('stand'); if (STATE.drink) return; }
    STATE.couched = want;
    toast(want ? UI.toast.couch : UI.toast.rise);
    const b = $('#actCouch'); if (b) b.innerHTML = ic('couch') + tt(want ? MOVEMENT.rise : MOVEMENT.couch);
  },
  drink() {
    if (STATE.drink || !WORLD.camel) return;
    setGait('stand');
    if (STATE.couched) ACT.couch(false);
    const s = WORLD.camel.spec.scale.body;
    STATE.drink = { t: 0, dur: 12, from: STATE.loss, lead: STATE.couched ? 3 : .4 };
    const p = localToWorldPt([1.6 * s + .12, 0, 0]);
    WORLD.trough.g.position.set(p.x, terrainH(p.x, p.z) - .02, p.z);
    WORLD.trough.g.rotation.y = camelFrame().yaw;
    WORLD.trough.g.scale.setScalar(.01); WORLD.trough.g.visible = true; WORLD.trough.setLevel(1);
    toast(UI.toast.drink, 4000);
    INSET.show('rbc');
  },
  storm() { if (STATE.stormT > 0) { ACT.stopStorm(); return; } STATE.stormT = 16; toast(UI.toast.storm, 4000); },
  stopStorm(now) { STATE.stormT = 0; if (now) STATE.storm = 0; },
};
STATE.stormT = 0;

const _cv = new V3();
let lastT = 0, fpsAcc = 0, fpsN = 0, lowFor = 0, qualityStep = 0, readoutT = 0, clockT = 0;
const QUALITY_STEPS = [
  () => { renderer.setPixelRatio(1); onResize(); },
  () => { Q.ssao = false; WORLD.camel && WORLD.camel.shells.forEach((m, i) => { if (i % 2) m.visible = false; }); Q.shells = Math.ceil(Q.shells / 2); },
  () => { Q.dof = false; Q.shells = 0; for (const k in WORLD.stages) WORLD.stages[k].camel.shells.forEach(m => { m.visible = false; }); },
];

function onResize() {
  const W = innerWidth, H = innerHeight;
  renderer.setSize(W, H, false);
  const pr = renderer.getPixelRatio();
  post.setSize(Math.round(W * pr), Math.round(H * pr));
  camera.aspect = W / H; camera.updateProjectionMatrix();
  if (typeof applyViewOffset === 'function' && WORLD.camel) applyViewOffset();
}

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(window.__maxDt || .05, Math.max(.001, (now - (lastT || now)) / 1000)); lastT = now;
  const t = now / 1000;
  // adaptive quality: step down if we stay slow
  fpsAcc += dt; fpsN++;
  if (fpsAcc > 2) { const fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0; lowFor = fps < 26 ? lowFor + 1 : 0; if (lowFor >= 2 && qualityStep < QUALITY_STEPS.length && document.visibilityState === 'visible') { QUALITY_STEPS[qualityStep++](); lowFor = 0; if (qualityStep === 1) toast(UI.toast.quality); } }
  // clock
  tweenHour(dt);
  if (STATE.playing) { STATE.hour = wrap24(STATE.hour + dt * (ENV.reduce ? .25 : .55)); clockT += dt; if (clockT > .05) { clockT = 0; drawDay(); } }
  // storm and drink timelines
  if (STATE.stormT > 0) STATE.stormT -= dt;
  STATE.storm = damp(STATE.storm, STATE.stormT > 0 ? 1 : 0, STATE.stormT > 0 ? .9 : .6, dt);
  if (STATE.storm < .002 && STATE.stormT <= 0) STATE.storm = 0;
  const D = STATE.drink;
  if (D) {
    D.t += dt;
    const k = clamp((D.t - D.lead - 1.6) / (D.dur - D.lead - 3.4), 0, 1);
    WORLD.trough.g.scale.setScalar(damp(WORLD.trough.g.scale.x, D.t < D.dur - .6 ? 1 : .01, 5, dt));
    WORLD.trough.setLevel(1 - k * .85);
    STATE.loss = lerp(D.from, 0, easeOut(k));
    const lr = $('#lossR'); if (lr) { lr.value = STATE.loss; pctRange(lr); $('#lossOut').textContent = pct(STATE.loss); }
    if (D.t > D.dur) { STATE.drink = null; WORLD.trough.g.visible = false; drawDay(true); }
  }
  // the body
  const cam = WORLD.camel, crig = WORLD.crig;
  if (cam && crig) {
    const drinking = D && D.t > D.lead && D.t < D.dur - 1.4;
    U.nictT = Math.max(0, U.nictT - dt);
    crig.update(dt, { couch: STATE.couched, drink: drinking, storm: STATE.storm, nostril: 0, nict: U.nictT > 0 ? Math.sin(Math.PI * clamp((3.2 - U.nictT) / 1.4, 0, 1)) * .95 : 0 });
    MODEL3D.update();
    const h = STATE.hump / 100;
    cam.setMorph('humpFull', smooth(.62, 1, h));
    cam.setMorph('humpEmpty', smooth(.5, 0, h) + (STATE.stage === 'old' ? .25 : 0));
    const thin = clamp(smooth(8, 26, STATE.loss) * .85 + (STATE.stage === 'old' ? .35 : 0), 0, 1);
    cam.setMorph('thin', thin); CU.uThin.value = thin; CU.uSB.value = cam.spec.scale.body;
    CU.uMale.value = damp(CU.uMale.value, STATE.sex === 'm' ? 1 : 0, 6, dt); cam.setMorph('male', CU.uMale.value);
    // contact occlusion: where the pads and the barrel meet the sand
    const sB = cam.spec.scale.body, sL = cam.spec.scale.leg;
    ['toeL', 'toeR', 'htoeL', 'htoeR'].forEach((n, i) => { const b = cam.bone[n]; b.getWorldPosition(_cv); CONTACT.feet[i].set(_cv.x, _cv.y - terrainH(_cv.x, _cv.z) - .045 * sL, _cv.z, .115 * sL); });
    cam.bone.root.getWorldPosition(_cv);
    CONTACT.body.set(_cv.x, _cv.y - terrainH(_cv.x, _cv.z) - .36 * sB, _cv.z, 0);
    CONTACT.ax.set(Math.cos(crig.yaw), -Math.sin(crig.yaw), .85 * sB, smooth(1.2, 2.8, crig.couch));
    // anatomy
    ANAT.update(dt);
    if (ANAT.built && STATE.stage === 'adult') {
      const peelOn = U.peel && U.chapter === 'anatomy';
      ANAT.organs.forEach(o => { o.holder.visible = (STATE.layer === 'organs' || peelOn) && (!o.sex || o.sex === STATE.sex); });
      ANAT.bones.forEach(b => { b.mesh.visible = STATE.layer === 'skeleton' || STATE.layer === 'organs' || peelOn; });
      if (U.section && U.chapter === 'anatomy') ANAT.setSection(U.section === 'sagittal' ? 'sagittal' : 'trans', U.section === 'sagittal' ? 0 : U.sectionX, cam);
      else ANAT.setSection(null);
    }
    // peel window: a sphere around the point under the pointer, on the body's mid-plane
    if (U.peel && U.chapter === 'anatomy' && U.pointer) {
      const ndc = new THREE.Vector2(U.pointer.x / innerWidth * 2 - 1, -(U.pointer.y / innerHeight) * 2 + 1);
      const ray = new THREE.Raycaster(); ray.setFromCamera(ndc, camera);
      const g = cam.group, n = camera.getWorldDirection(new V3()).negate(), c = g.position.clone().setY(1.25 * cam.spec.scale.body);
      const pl = new THREE.Plane().setFromNormalAndCoplanarPoint(n, c), hit = new V3();
      if (ray.ray.intersectPlane(pl, hit) && hit.distanceTo(c) < 1.6) CU.uPeel.value.set(hit.x, hit.y, hit.z, .42); else CU.uPeel.value.w = 0;
    } else CU.uPeel.value.w = 0;
  }
  // camera: follow the walking camel unless the user has taken over
  if (cam && U.follow && (U.chapter === 'movement' || TOURX.on) && performance.now() - U.userT > 3500 && !rig.fly) {
    const tl = U.followT || [0, 1, 0], p = localToWorldPt(tl);
    rig.target.lerp(p, 1 - Math.exp(-2.5 * dt));
    let d = (camelFrame().yaw + (U.followAz || 0)) - rig.theta; d = ((d + Math.PI) % TAU + TAU) % TAU - Math.PI;
    rig.theta += d * (1 - Math.exp(-1.2 * dt));
  }
  rig.update(dt);
  camera.updateMatrixWorld();
  sky.u.uCamInvView.value.copy(camera.matrixWorld); sky.u.uProjInv.value.copy(camera.projectionMatrixInverse); sky.u.uAspect.value = camera.aspect;
  WORLD.updateLight(dt, t);
  FOOT.update(dt, STATE.storm);
  WORLD.dust.update(dt, STATE.storm, rig.target, t);
  WORLD.dust.mat.uniforms.uPR.value = renderer.getPixelRatio();
  WORLD.motes.update(t, rig.target, (1 - STATE.storm) * (ENV.reduce ? .5 : 1));
  WORLD.motes.mat.uniforms.uPR.value = renderer.getPixelRatio();
  HL.apply(t);
  // post: depth of field in close-ups, heat shimmer on hot afternoons
  const pp = post.params;
  pp.aoStrength.value = .7; pp.bloom.value = .035; pp.vignette.value = .16; pp.grain.value = .011;
  // depth of field from the lens: a short telephoto at f/4 separates a close-up from the dunes behind it
  pp.focus.value = rig.r; pp.aperture.value = Q.dof && !ENV.reduce ? Math.min(1.6, .3 * sq(rig.focal / 50) / Math.max(rig.r, .3)) * smooth(9, 3, rig.r) : 0;
  const air = MODEL.air(STATE.hour, STATE.season);
  pp.shimmer.value = STATE.layer === 'thermal' || ENV.reduce ? 0 : smooth(36, 43, air) * smooth(.1, .4, WORLD.sunDir.y) * (1 - STATE.storm);
  post.render(scene, camera, t);
  // interface
  readoutT -= dt;
  if (readoutT <= 0) { readoutT = .12; updateReadout(); }
  updateCallouts(dt);
  if (U.chapter === 'movement') updateGaitCursor();
  INSET.update(dt);
  TOURX.update(dt);
}

async function boot() {
  const bar = $('#ldBar'), step = $('#ldStep');
  const prog = (p, i) => { bar.style.width = (p * 100).toFixed(0) + '%'; if (i != null) step.textContent = tt(UI.ldSteps[i]); };
  const deep = initUI();
  prog(.12, 0);
  const canvas = $('#gl');
  try { setRenderer(makeRenderer(canvas)); }
  catch (e) { $('#ldErr').hidden = false; $('#ldErr').textContent = tt(UI.errGL); bar.parentElement.hidden = true; return; }
  setPost(new Post(renderer));
  if (Q.name !== 'low') patchSunShadows();
  let texDone = 0;
  const texN = TEX.names.length;
  const texP = TEX.load(() => { texDone++; if (texDone < texN) $('#ldStep').textContent = tt(UI.ldTex) + ' ' + digits(texDone) + '/' + digits(texN); });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, Q.dpr));
  await new Promise(r => setTimeout(r, 20));
  prog(.22, 1);
  await new Promise(r => setTimeout(r, 20));
  WORLD.init();
  onResize();
  setRig(new Rig(camera, canvas));
  // tap an organ to open its card
  rig.onTap = e => {
    if (U.chapter !== 'anatomy' || STATE.layer !== 'organs' || !ANAT.built) return;
    const ndc = new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, camera);
    const id = ANAT.pick(ray), aid = id && atlasFor(id);
    if (aid) openOrgan(aid, true);
  };
  prog(.4, 2);
  // the sculpt runs in a worker; the bar follows it (estimated) and the textures (counted)
  let sdfP = 0;
  const tick = setInterval(() => { sdfP = Math.min(1, sdfP + .04); bar.style.width = (40 + 36 * sdfP + 12 * texDone / texN).toFixed(0) + '%'; }, 250);
  try { await WORLD.loadStage('adult'); } catch (e) { clearInterval(tick); $('#ldErr').hidden = false; $('#ldErr').textContent = String(e && e.message || e); return; }
  clearInterval(tick);
  step.textContent = tt(UI.ldSteps[2]);
  await Promise.race([texP, new Promise(r => setTimeout(r, 12000))]);
  prog(.92, 3);
  WORLD.show('adult');
  // an optional photographic model (assets/camel/camel.json → GLB); the procedural camel stays if there is none
  MODEL3D.load(p => { bar.style.width = (92 + 6 * p).toFixed(0) + '%'; }).then(ok => { if (ok && WORLD.camel) MODEL3D.attach(WORLD.camel); });
  // one frame of warm-up so every shader compiles before the reveal
  applyViewOffset();
  U.chapter = deep.chapter;
  go(deep.chapter, deep.topic, { force: true, noHash: true });
  const v = rig.fly ? rig.fly.to : null;
  if (v && !ENV.reduce) { rig.fly = null; rig.target.copy(v.target).add(new V3(0, .4, 0)); rig.r = v.r * 1.9; rig.theta = v.theta - .7; rig.phi = v.phi - .12; rig.flyTo(v, 3.2); }
  prog(1, 4);
  drawDay(true);
  requestAnimationFrame(frame);
  setTimeout(() => $('#loader').classList.add('done'), 350);
  addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', () => { lastT = 0; });
  // warm the other life stages in the background, one at a time
  setTimeout(async () => { for (const s of ['newborn', 'juvenile', 'old']) { try { await WORLD.loadStage(s); } catch (e) { /* stays unavailable */ } } }, 5000);
}
boot();

window.__v = { get rig() { return rig; }, STATE, WORLD, U, post, applyViewOffset, get camera() { return camera; }, fovFor, focalFor, ATM, TEX, CU, MODEL3D, ANAT };

export { ACT };
