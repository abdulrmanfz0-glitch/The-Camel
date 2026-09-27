import { AIRU, ATM, buildAcacia, buildDust, buildFarLand, buildMotes, buildRocks, buildShrubs, buildTerrain,
  buildTrough, Camel, camelMaterials, CamelRig, camelSpec, camera, clamp, CU, damp, DEG, FOOT, lerp, makeSky,
  MODEL3D, post, Q, SANDU, scene, SDF, setCamera, setScene, setSky, SHADE, sky, smooth, STATE, SUN_SHADOW,
  terrainH, TEX, THREE, V3 } from '../app.js';

/* ════════════════════════════════════════════════════════════════
   the world: scene graph, sun & moon from the atmosphere model, image-based
   light from the same sky, the desert, and the camel for each life stage
   ════════════════════════════════════════════════════════════════ */
const WORLD = {
  camel: null, crig: null, stages: {}, building: {},
  sunDir: ATM.sunDir, moonDir: ATM.moonDir, envKey: '', envT: 0, expo: 3,
  init() {
    setScene(new THREE.Scene());
    setCamera(new THREE.PerspectiveCamera(30, innerWidth / innerHeight, .08, 3200));
    setSky(makeSky());
    scene.add(sky.back);
    // the post pass reads the same sky for its aerial perspective
    for (const k of ['uSunDir', 'uMoonDir', 'uBetaR', 'uBetaM', 'uSkyScale', 'uSunDisk', 'uGroundE', 'uTwiCol', 'uSunE', 'uMieG', 'uTwi', 'uNight', 'uStorm', 'uThermal', 'uTwiK', 'uDustCol']) post.m.comp.uniforms[k] = sky.u[k];
    this.sun = new THREE.DirectionalLight(0xffffff, 1);
    this.sun.castShadow = true;
    const S = SUN_SHADOW, sc = this.sun.shadow.camera; sc.left = -S.half; sc.right = S.half; sc.top = S.half; sc.bottom = -S.half; sc.near = S.near; sc.far = S.far;
    this.sun.shadow.mapSize.set(Q.shadow, Q.shadow); this.sun.shadow.bias = -.0003; this.sun.shadow.normalBias = .018; this.sun.shadow.radius = 2;
    scene.add(this.sun, this.sun.target);
    this.moon = new THREE.DirectionalLight(0x9fb4ff, 0);
    scene.add(this.moon);
    scene.fog = null;
    FOOT.init();
    TEX.apply();
    this.terrain = buildTerrain(); scene.add(this.terrain);
    this.far = buildFarLand(); scene.add(this.far);
    this.shrubs = buildShrubs(); scene.add(this.shrubs);
    this.rocks = buildRocks(); scene.add(this.rocks);
    this.trees = new THREE.Group();
    [[-9.5, -12, 3.9, 5], [13, 7.5, 3.3, 9], [-16, 9, 3.0, 13], [24, -19, 4.1, 21], [-31, -24, 3.6, 33], [36, 18, 3.4, 44]].forEach(([x, z, h, seed]) => { const t = buildAcacia(seed, h); t.position.set(x, terrainH(x, z) - .05, z); t.rotation.y = seed * 1.7; this.trees.add(t); });
    scene.add(this.trees);
    this.trees.children.forEach((t, i) => { if (i < 6) SANDU.uTrees.value[i].set(t.position.x, t.position.z, t.userData.r * .9); });
    this.trough = buildTrough(); this.trough.g.visible = false; scene.add(this.trough.g);
    this.dust = buildDust(); scene.add(this.dust.pts);
    this.motes = buildMotes(); scene.add(this.motes.pts);
    SHADE.init([this.terrain, this.shrubs, this.rocks, this.trees]);
    this.mats = camelMaterials();
  },

  /* build (or reuse) the body for a life stage */
  async loadStage(stage) {
    if (this.stages[stage]) return this.stages[stage];
    if (this.building[stage]) return this.building[stage];
    const spec = camelSpec(stage, Q.sdf);
    this.building[stage] = SDF.run([spec]).then(([res]) => {
      const camel = new Camel(res, spec, this.mats);
      const crig = new CamelRig(camel);
      crig.onStep = (L, p, yaw) => FOOT.stamp(p.x, p.z, yaw, (L.fore ? 1 : .88) * camel.spec.scale.leg, .8 + .2 * (crig.gait === 'pace' ? 1 : 0));
      this.stages[stage] = { camel, crig, spec };
      return this.stages[stage];
    });
    return this.building[stage];
  },
  show(stage) {
    const s = this.stages[stage]; if (!s) return;
    if (this.camel) { scene.remove(this.camel.group); }
    // the new body takes over the old one's place and heading
    if (this.crig) { s.crig.pos.copy(this.crig.pos); s.crig.yaw = this.crig.yaw; s.crig.pathS = this.crig.pathS; s.crig.placeFeetAtRest(); }
    this.camel = s.camel; this.crig = s.crig;
    scene.add(this.camel.group);
    this.camel.setMode(STATE.layer === 'thermal' ? 'thermal' : STATE.layer === 'muscle' ? 'muscle' : (STATE.layer === 'organs' || STATE.layer === 'skeleton') ? 'xray' : 'skin');
    CU.uLeg.value = s.spec.scale.leg;
    if (typeof MODEL3D !== 'undefined') MODEL3D.attach(this.camel);
  },

  /* sun, sky, exposure and air for the hour, season and weather — all from ATM */
  updateLight(dt, t) {
    const stormK = STATE.storm;
    const A = ATM.update(STATE.hour, STATE.season, stormK), u = sky.u;
    const lum = a => a[0] * .2126 + a[1] * .7152 + a[2] * .0722;
    const se = Math.max(A.sunDir.y, 0), Es = lum(A.Esun), Ek = lum(A.Esky);
    u.uSunE.value = A.sunE; u.uNight.value = A.night; u.uStars.value = A.night * (1 - stormK);
    u.uTwiK.value = .0062 * Math.exp(clamp(A.el / DEG, -18, 0) * .72) * (1 - smooth(0, 5 * DEG, A.el) * .6) * (1 - smooth(1 * DEG, 8 * DEG, A.el)) / 1.1;
    u.uStorm.value = stormK; u.uThermal.value = STATE.layer === 'thermal' ? 1 : 0; u.uTime.value = t;
    // the lit sand seen from above, for the lower half of the image-based light
    const Eg = [0, 1, 2].map(i => ATM.sandAlb[i] * (A.Esun[i] * se * .82 + A.Esky[i]) / Math.PI + ATM.sandAlb[i] * A.Emoon * Math.max(A.moonDir.y, 0) * .25);
    u.uGroundE.value.setRGB(Eg[0], Eg[1], Eg[2]);
    const dustE = (Es * se * .4 + Ek) / Math.PI;
    u.uDustCol.value.setRGB(.62 * dustE * 1.6, .46 * dustE * 1.6, .31 * dustE * 1.6);
    // sun and moon lights: irradiance at normal incidence (three's direct light is albedo/π · E · cosθ)
    const tgt = this.camel ? this.camel.group.position : new V3();
    this.sun.position.copy(tgt).addScaledVector(A.sunDir, 20);
    this.sun.target.position.copy(tgt);
    this.sun.color.setRGB(A.Esun[0] / Math.max(Es, 1e-6), A.Esun[1] / Math.max(Es, 1e-6), A.Esun[2] / Math.max(Es, 1e-6));
    this.sun.intensity = Es;
    this.sun.castShadow = Es * se > .004;
    this.moon.position.copy(tgt).addScaledVector(A.moonDir, 20); this.moon.target = this.sun.target;
    this.moon.color.setRGB(.62, .74, 1); this.moon.intensity = A.Emoon;
    // image-based light from the sky dome (regenerated only when the sky changes noticeably)
    this.envT -= dt;
    const az = Math.atan2(A.sunDir.z, A.sunDir.x);
    const key = [Math.round(A.el / DEG / .6), Math.round(az / DEG / 6), Math.round(stormK * 8), Math.round(A.night * 6), STATE.season].join();
    if (key !== this.envKey && this.envT <= 0) { sky.updateEnv(key, true); this.envKey = key; this.envT = .3; }
    scene.environmentIntensity = 1;
    // exposure: a photographer's meter on the horizontal illuminance, letting dusk and night fall darker
    const Eh = A.key;
    const bright = Math.pow(clamp(Eh / .75, 1e-6, 1.3), .1) * lerp(.2, 1, smooth(.0006, .03, Eh));
    const target = 2.4 * bright / Math.max(Eh, 1e-5);
    this.expo = this.expo ? Math.exp(damp(Math.log(this.expo), Math.log(target), 4, dt)) : target;
    const pp = post.params;
    pp.exposure.value = this.expo;
    CU.uInvExpo.value = 1 / this.expo;
    pp.extinction.value.set(3.0e-4, 3.6e-4, 4.4e-4).multiplyScalar(1 + 260 * stormK * stormK);
    pp.airK.value = 1;
    // night vision is rod vision: colour drains away and the scene reads blue (Purkinje shift)
    const scot = smooth(.004, .0006, Eh);
    pp.saturation.value = lerp(1.0, .38, scot) - .1 * stormK; pp.contrast.value = 1.04;
    pp.lift.value.set(0, 0, 0); pp.gain.value.set(lerp(1, .8, scot), lerp(1, .93, scot), lerp(1, 1.2, scot));
    pp.thermal.value = STATE.layer === 'thermal' ? 1 : 0;
    // camel shading inputs
    const v = A.sunDir.clone().transformDirection(camera.matrixWorldInverse);
    CU.uSunV.value.copy(v); CU.uSunCol.value.copy(this.sun.color); CU.uSunI.value = Es; CU.uSunW.value.copy(A.sunDir);
    CU.uDust.value = damp(CU.uDust.value, stormK, .4, dt);
    CU.uTime.value = t;
    SANDU.uWind.value = stormK;
    SHADE.update(A.sunDir, Es * se > .002);
    AIRU.uSunE.value.set(A.Esun[0], A.Esun[1], A.Esun[2]); AIRU.uSkyE.value.set(A.Esky[0], A.Esky[1], A.Esky[2]); AIRU.uSunW.value.copy(A.sunDir);
    return A;
  },
};

export { WORLD };
