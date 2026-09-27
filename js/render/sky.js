import { clamp, DEG, GLSL_COMMON, lerp, renderer, scene, smooth, sq, TAU, THREE, V3 } from '../app.js';

/* ─────────── sky and light: Preetham daylight sky, analytic twilight and night, real sun over Riyadh ───────────
   The sky's shape and hue gradient come from the Preetham model (as in the three.js Sky example). Its absolute
   energy is rebalanced so that sun and sky irradiance follow a dusty clear atmosphere: Rayleigh + desert aerosol
   optical depths, Kasten–Young air mass. The same numbers drive the sun light, the image-based light, the aerial
   perspective and the exposure, so the frame is never tinted by hand.                                          */
const ATM = {
  lat: 24.71 * DEG, lon: 46.72,                       // Riyadh
  tauR: [0.034, 0.090, 0.205], tauA: [0.14, 0.16, 0.18], // optical depth at 680 / 550 / 450 nm (Rayleigh, dust haze)
  turbidity: 4.2, rayleigh: 1.35, mie: 0.0065, g: 0.8,
  sandAlb: [0.52, 0.36, 0.22],                         // linear albedo of the local sand (for bounce light)
  sunDir: new V3(0, 1, 0), moonDir: new V3(-.35, .62, .7).normalize(),
  Esun: [1, 1, 1], Esky: [.2, .2, .2], Emoon: 0, el: 0, key: 1, twi: 0, night: 0,
  betaR: new V3(), betaM: new V3(), sunE: 0, skyScale: new V3(1, 1, 1), sunDisk: new V3(),
  _cache: new Map(),
  /* solar position: declination for the chosen day, clock time in Arabia Standard Time (UTC+3) */
  sun(h, season, out) {
    const day = season === 'winter' ? 355 : 172;
    const g = TAU / 365 * (day - 1 + (h - 12) / 24);
    const decl = .006918 - .399912 * Math.cos(g) + .070257 * Math.sin(g) - .006758 * Math.cos(2 * g) + .000907 * Math.sin(2 * g) - .002697 * Math.cos(3 * g) + .00148 * Math.sin(3 * g);
    const eot = 229.18 * (.000075 + .001868 * Math.cos(g) - .032077 * Math.sin(g) - .014615 * Math.cos(2 * g) - .040849 * Math.sin(2 * g));
    const solar = h + (4 * (this.lon - 45) + eot) / 60;
    const H = (solar - 12) * 15 * DEG, L = this.lat;
    const e = -Math.cos(decl) * Math.sin(H);
    const n = Math.sin(decl) * Math.cos(L) - Math.cos(decl) * Math.cos(H) * Math.sin(L);
    const u = Math.sin(decl) * Math.sin(L) + Math.cos(decl) * Math.cos(H) * Math.cos(L);
    return out.set(e, u, -n).normalize();              // world: +X east, −Z north, +Y up
  },
  airmass(el) { const d = Math.max(el / DEG, -1.5); return 1 / (Math.max(Math.sin(Math.max(el, -1.5 * DEG)), 0) + .50572 * Math.pow(d + 6.07995, -1.6364)); },
  /* Preetham radiance (three.js Sky.js, ported) for calibration */
  preetham(d, s, out) {
    const za = Math.acos(Math.max(0, d[1])), inv = 1 / (Math.cos(za) + .15 * Math.pow(93.885 - za / DEG, -1.253));
    const ct = d[0] * s[0] + d[1] * s[1] + d[2] * s[2], rP = .0596831 * (1 + sq(ct * .5 + .5));
    const g = this.g, g2 = g * g, mP = .0795775 * (1 - g2) / Math.pow(1 - 2 * g * ct + g2, 1.5);
    const bR = [this.betaR.x, this.betaR.y, this.betaR.z], bM = [this.betaM.x, this.betaM.y, this.betaM.z];
    const k = clamp(Math.pow(1 - s[1], 5), 0, 1);
    for (let i = 0; i < 3; i++) {
      const Fex = Math.exp(-(bR[i] * 8.4e3 * inv + bM[i] * 1.25e3 * inv));
      const r = (bR[i] * rP + bM[i] * mP) / (bR[i] + bM[i]);
      let Lin = Math.pow(this.sunE * r * (1 - Fex), 1.5);
      Lin *= lerp(1, Math.pow(this.sunE * r * Fex, .5), k);
      out[i] = (Lin + .1 * Fex) * .04;
    }
    return out;
  },
  preethamE(s) {                                       // horizontal irradiance of the Preetham sky
    const key = Math.round(s[1] * 400) + ':' + Math.round(this.sunE);
    if (this._cache.has(key)) return this._cache.get(key);
    const E = [0, 0, 0], L = [0, 0, 0], NT = 14, NP = 28, sa = Math.atan2(s[2], s[0]);
    for (let i = 0; i < NT; i++) for (let j = 0; j < NP; j++) {
      const th = (i + .5) / NT * Math.PI / 2, ph = sa + (j + .5) / NP * TAU;
      this.preetham([Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)], s, L);
      const w = Math.cos(th) * Math.sin(th) * (Math.PI / 2 / NT) * (TAU / NP);
      E[0] += L[0] * w; E[1] += L[1] * w; E[2] += L[2] * w;
    }
    if (this._cache.size > 4000) this._cache.clear();
    this._cache.set(key, E);
    return E;
  },
  update(h, season, storm) {
    const s = this.sun(h, season, this.sunDir), el = Math.asin(clamp(s.y, -1, 1));
    this.el = el;
    // Preetham parameters (constant atmosphere; the sun's zenith angle drives it)
    const zc = clamp(s.y, -1, 1);
    this.sunE = 1000 * Math.max(0, 1 - Math.exp(-((1.6110731556870734 - Math.acos(zc)) / 1.5)));
    const tr = [5.804542996261093E-6, 1.3562911419845635E-5, 3.0265902468824876E-5], mc = [1.8399918514433978E14, 2.7798023919660528E14, 4.0790479543861094E14];
    const c = .2 * this.turbidity * 10E-18;
    this.betaR.set(tr[0] * this.rayleigh, tr[1] * this.rayleigh, tr[2] * this.rayleigh);
    this.betaM.set(.434 * c * mc[0] * this.mie, .434 * c * mc[1] * this.mie, .434 * c * mc[2] * this.mie);
    // direct sun: transmittance along the slant path, then the disc sinking below the horizon
    const m = this.airmass(el), vis = smooth(-.9 * DEG, .6 * DEG, el), dust = 1 + 2.5 * storm;
    for (let i = 0; i < 3; i++) this.Esun[i] = Math.exp(-m * (this.tauR[i] + this.tauA[i] * dust)) * vis;
    // diffuse sky: what the slant path scattered out, part of it reaching the ground; twilight tail below
    const se = Math.max(Math.sin(el), 0), F = .42 * (.55 + .45 * se);
    const twi = .0062 * Math.exp(clamp(el / DEG, -18, 0) * .72) * (1 - smooth(0, 5 * DEG, el) * .6);   // civil twilight fall-off
    const twiCol = [.55, .72, 1.0];
    for (let i = 0; i < 3; i++) {
      const Td = Math.exp(-m * (this.tauR[i] + this.tauA[i] * dust));
      const day = se * (1 - Td) * F;
      this.Esky[i] = day + twi * twiCol[i] * (1 - smooth(1 * DEG, 8 * DEG, el));
    }
    // night: moonlight (a stylised quarter-to-full moon) and airglow
    this.night = 1 - smooth(-14 * DEG, -5 * DEG, el);
    this.twi = (1 - smooth(2 * DEG, 10 * DEG, el)) * (1 - this.night * .92);
    const moonUp = Math.max(this.moonDir.y, 0);
    this.Emoon = .0016 * moonUp * this.night;
    const nightSky = [.00059, .00085, .0016];
    for (let i = 0; i < 3; i++) this.Esky[i] += nightSky[i] * this.night;
    // scale the Preetham sky so its irradiance matches the model (fade it out as the sun goes down)
    const EP = this.sunE > 1 ? this.preethamE([s.x, s.y, s.z]) : [1, 1, 1];
    const dayW = smooth(-1.5 * DEG, 3 * DEG, el);
    // energy from the model, hue mostly from Preetham (a clear sky is bluer than its irradiance suggests)
    const Ed = [0, 1, 2].map(i => Math.max(this.Esky[i] - twi * twiCol[i] * (1 - smooth(1 * DEG, 8 * DEG, el)) - nightSky[i] * this.night, 0));
    const lumD = Ed[0] * .2126 + Ed[1] * .7152 + Ed[2] * .0722, lumP = Math.max(EP[0] * .2126 + EP[1] * .7152 + EP[2] * .0722, 1e-9), rL = lumD / lumP;
    for (let i = 0; i < 3; i++) this.skyScale.setComponent(i, dayW * rL * Math.pow(Math.max(Ed[i] / Math.max(EP[i], 1e-9), 1e-9) / Math.max(rL, 1e-9), .3));
    // the sun disc radiance (irradiance over the disc's solid angle, capped for half floats)
    for (let i = 0; i < 3; i++) this.sunDisk.setComponent(i, Math.min(this.Esun[i] / 6.8e-5, 3.0e4));
    // exposure key: horizontal illuminance, compressed a little so dusk reads darker than noon
    const lum = a => a[0] * .2126 + a[1] * .7152 + a[2] * .0722;
    const Eh = lum(this.Esun) * se + lum(this.Esky) + this.Emoon * .8 * moonUp;
    this.key = Eh;
    return this;
  },
};

const SKY_GLSL = `
  uniform vec3 uSunDir, uMoonDir, uBetaR, uBetaM, uSkyScale, uSunDisk, uGroundE, uTwiCol;
  uniform float uSunE, uMieG, uTwi, uNight, uStorm, uThermal, uTwiK;
  vec3 preetham(vec3 d){
    float za = acos(max(0.0, d.y));
    float inv = 1.0 / (cos(za) + 0.15 * pow(max(93.885 - za * 57.2957795, 1e-3), -1.253));
    vec3 Fex = exp(-(uBetaR * 8.4e3 * inv + uBetaM * 1.25e3 * inv));
    float ct = dot(d, uSunDir);
    float rP = 0.0596831 * (1.0 + pow(ct * 0.5 + 0.5, 2.0));
    float g2 = uMieG * uMieG;
    float mP = 0.0795775 * (1.0 - g2) / pow(1.0 - 2.0 * uMieG * ct + g2, 1.5);
    vec3 r = (uBetaR * rP + uBetaM * mP) / (uBetaR + uBetaM);
    vec3 Lin = pow(uSunE * r * (1.0 - Fex), vec3(1.5));
    Lin *= mix(vec3(1.0), pow(uSunE * r * Fex, vec3(0.5)), clamp(pow(1.0 - uSunDir.y, 5.0), 0.0, 1.0));
    return (Lin + 0.1 * Fex) * 0.04;
  }
  /* twilight: warm band under the sun, the pink belt of Venus over the blue earth shadow opposite */
  vec3 twilightSky(vec3 d){
    float h = max(d.y, 0.0);
    vec2 a = normalize(d.xz + vec2(1e-5)), sa = normalize(uSunDir.xz + vec2(1e-5));
    float tw = dot(a, sa) * 0.5 + 0.5;
    float sunDown = clamp(-uSunDir.y * 12.0, 0.0, 1.0);
    vec3 warm = mix(vec3(1.0, 0.62, 0.34), vec3(1.0, 0.36, 0.12), sunDown);
    vec3 belt = vec3(0.66, 0.42, 0.52), shadow = vec3(0.2, 0.26, 0.46), zen = vec3(0.1, 0.18, 0.46);
    vec3 anti = mix(shadow, belt, smoothstep(0.02, 0.1, h) * (1.0 - smoothstep(0.12, 0.3, h)));
    vec3 band = mix(anti, warm, pow(tw, 2.5));
    float bh = exp(-h / mix(0.1, 0.22, tw * tw));
    return mix(zen, band, bh) * (1.0 + 2.2 * pow(max(dot(d, uSunDir), 0.0), 6.0) * (1.0 - sunDown * 0.6));
  }
  vec3 skyRad(vec3 d){
    vec3 dd = normalize(vec3(d.x, max(d.y, 0.0), d.z));
    vec3 c = preetham(dd) * uSkyScale;
    c += twilightSky(dd) * uTwiK * uTwiCol;
    c += vec3(0.00022, 0.00032, 0.0006) * uNight * (0.6 + 0.4 * dd.y);
    float md = max(dot(dd, uMoonDir), 0.0);
    c += vec3(0.55, 0.62, 0.75) * (pow(md, 12.0) * 0.004 + pow(md, 900.0) * 0.4 + smoothstep(0.99994, 0.99997, md) * 3.5) * uNight * step(0.0, uMoonDir.y);
    return c;
  }
  vec3 sunDiscRad(vec3 d){ float ct = dot(d, uSunDir); return uSunDisk * smoothstep(0.999955, 0.99997, ct) * step(-0.01, d.y); }`;

function makeSky() {
  const u = {
    uSunDir: { value: ATM.sunDir }, uMoonDir: { value: ATM.moonDir }, uBetaR: { value: ATM.betaR }, uBetaM: { value: ATM.betaM },
    uSkyScale: { value: ATM.skyScale }, uSunDisk: { value: ATM.sunDisk }, uGroundE: { value: new THREE.Color() }, uTwiCol: { value: new V3(1, 1, 1) },
    uSunE: { value: 0 }, uMieG: { value: ATM.g }, uTwi: { value: 0 }, uNight: { value: 0 }, uStorm: { value: 0 }, uThermal: { value: 0 }, uTwiK: { value: 0 },
    uDustCol: { value: new THREE.Color() }, uAspect: { value: 1 }, uTime: { value: 0 }, uStars: { value: 0 },
    uCamInvView: { value: new THREE.Matrix4() }, uProjInv: { value: new THREE.Matrix4() },
  };
  // screen-space backdrop: the sky in the real view direction, behind everything
  const back = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: u, depthTest: false, depthWrite: false,
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 1.0, 1.0); }`,
    fragmentShader: `varying vec2 vUv; ${SKY_GLSL} uniform vec3 uDustCol; uniform float uAspect, uTime, uStars; uniform mat4 uCamInvView, uProjInv;
      ${GLSL_COMMON}
      float h31(vec3 p){ p = fract(p * .1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
      float starField(vec3 d){
        vec3 a = abs(d); vec2 uv; float face;
        if (a.x > a.y && a.x > a.z) { uv = d.yz / a.x; face = sign(d.x); } else if (a.y > a.z) { uv = d.xz / a.y; face = 2.0 + sign(d.y); } else { uv = d.xy / a.z; face = 4.0 + sign(d.z); }
        vec2 q = uv * 190.0, id = floor(q), f = fract(q) - 0.5;
        float r = h31(vec3(id, face * 7.0));
        vec2 o = (vec2(h31(vec3(id, face + 3.1)), h31(vec3(id, face + 9.7))) - 0.5) * 0.6;
        float s = step(0.965, r) * smoothstep(0.1, 0.0, length(f - o));
        return s * (0.4 + 2.2 * pow(max(r - 0.965, 0.0) / 0.035, 3.0)) * (0.7 + 0.3 * sin(uTime * 1.3 + r * 90.0));
      }
      void main(){
        vec4 v = uProjInv * vec4(vUv * 2.0 - 1.0, 1.0, 1.0); v /= v.w;
        vec3 d = normalize((uCamInvView * vec4(v.xyz, 0.0)).xyz);
        vec3 c = skyRad(d) + sunDiscRad(d);
        vec3 dn = normalize(vec3(d.x, max(d.y, 0.0), d.z));
        float el = max(d.y, 0.0);
        vec3 gal = normalize(vec3(0.35, 0.55, -0.76));
        float band = exp(-pow(dot(dn, gal) / 0.2, 2.0)) * (0.55 + 0.45 * vn2(vec2(atan(dn.z, dn.x) * 6.0, dn.y * 8.0)));
        c += (vec3(0.95, 0.97, 1.0) * starField(dn) * 0.0016 + vec3(0.33, 0.36, 0.5) * band * 0.00012) * uStars * smoothstep(0.0, 0.25, el);
        c = mix(c, uDustCol * (0.75 + 0.35 * el), uStorm * 0.92);
        c = mix(c, vec3(0.006, 0.003, 0.016), uThermal);
        gl_FragColor = vec4(c, 1.0);
      }`,
  }));
  back.frustumCulled = false; back.renderOrder = -100;
  // environment dome for PMREM (not in the main scene): sky above, lit sand below
  const envScene = new THREE.Scene();
  const dome = new THREE.Mesh(new THREE.SphereGeometry(50, 48, 24), new THREE.ShaderMaterial({
    uniforms: u, side: THREE.BackSide, depthWrite: false,
    vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `varying vec3 vD; ${SKY_GLSL} uniform vec3 uDustCol;
      void main(){ vec3 d = normalize(vD); vec3 c = skyRad(d);
        c = mix(c, uGroundE, smoothstep(0.0, -0.08, d.y));
        c = mix(c, uDustCol, uStorm * 0.8);
        gl_FragColor = vec4(c, 1.0); }`,
  }));
  envScene.add(dome);
  const pmrem = new THREE.PMREMGenerator(renderer);
  let envRT = null, lastKey = '';
  return {
    u, back, envScene,
    updateEnv(key, force) {
      if (!force && key === lastKey) return;
      lastKey = key;
      const rt = pmrem.fromScene(envScene, 0.0, 0.1, 100);
      if (envRT) envRT.dispose();
      envRT = rt;
      scene.environment = rt.texture;
    },
  };
}

/* the dock's day strip keeps a hand-made palette (interface only, not the render) */
/* palette keyed by hour (sRGB authored; the renderer works in linear) */
const PAL = [
  [4.6, { top: '#070c18', hor: '#141f38', low: '#06090f', sun: '#ffb070', sunI: 0, amb: .08, moon: .32, ink: 0, stars: 1, sat: .82, lift: '#05070d', gain: '#9fb2d8' }],
  [5.0, { top: '#0c1631', hor: '#343350', low: '#0a0d18', sun: '#ff9a5a', sunI: 0, amb: .12, moon: .22, ink: 0, stars: .8, sat: .85, lift: '#06070c', gain: '#b8b6cf' }],
  [5.4, { top: '#1b2c54', hor: '#c07f6c', low: '#171722', sun: '#ff9258', sunI: .7, amb: .22, moon: 0, ink: 0, stars: .25, sat: .95, lift: '#080607', gain: '#f2cdb9' }],
  [6.1, { top: '#30528a', hor: '#f0a878', low: '#2a2328', sun: '#ffac6a', sunI: 1.6, amb: .35, moon: 0, ink: .2, stars: 0, sat: 1.02, lift: '#070504', gain: '#ffe4cc' }],
  [7.6, { top: '#4c80bf', hor: '#f0d2a4', low: '#4a403a', sun: '#ffd8a8', sunI: 2.6, amb: .55, moon: 0, ink: .8, stars: 0, sat: 1.0, lift: '#040404', gain: '#fff2e2' }],
  [10.2, { top: '#6a9fd5', hor: '#ece5d2', low: '#6a655d', sun: '#fff0dc', sunI: 3.3, amb: .7, moon: 0, ink: 1, stars: 0, sat: .96, lift: '#040404', gain: '#fff6ea' }],
  [12.8, { top: '#7aadde', hor: '#f3efe4', low: '#7d766b', sun: '#fff8ee', sunI: 3.5, amb: .75, moon: 0, ink: 1, stars: 0, sat: .9, lift: '#060504', gain: '#fffaf0' }],
  [15.6, { top: '#6a9dd2', hor: '#f1ddb6', low: '#665b50', sun: '#ffe6c0', sunI: 3.2, amb: .68, moon: 0, ink: 1, stars: 0, sat: .98, lift: '#050403', gain: '#fff1dc' }],
  [17.3, { top: '#4d71a3', hor: '#f3b77a', low: '#45372f', sun: '#ffc07a', sunI: 2.5, amb: .5, moon: 0, ink: .45, stars: 0, sat: 1.06, lift: '#070403', gain: '#ffe0bf' }],
  [18.35, { top: '#33487a', hor: '#e97e50', low: '#2a1f25', sun: '#ff8a48', sunI: 1.4, amb: .32, moon: 0, ink: .1, stars: 0, sat: 1.1, lift: '#080404', gain: '#ffcfae' }],
  [18.9, { top: '#1f2b57', hor: '#8e4b5b', low: '#16151f', sun: '#ff6a3a', sunI: .25, amb: .2, moon: .05, ink: 0, stars: .15, sat: 1.0, lift: '#060407', gain: '#e5b9be' }],
  [19.7, { top: '#0f1936', hor: '#2c2c4d', low: '#0b0f1b', sun: '#ff6a3a', sunI: 0, amb: .12, moon: .24, ink: 0, stars: .7, sat: .86, lift: '#05060c', gain: '#a7b5d6' }],
  [20.8, { top: '#08101f', hor: '#16223c', low: '#070a12', sun: '#ff6a3a', sunI: 0, amb: .08, moon: .32, ink: 0, stars: 1, sat: .82, lift: '#05070d', gain: '#9fb2d8' }],
  [28.6, null],
];
PAL[PAL.length - 1][1] = PAL[0][1];
const PALC = PAL.map(([h, p]) => [h, Object.fromEntries(Object.entries(p).map(([k, v]) => [k, typeof v === 'string' ? new THREE.Color(v) : v]))]);
const PX = {};
function samplePalette(h) {
  let x = h; while (x < 4.6) x += 24; while (x >= 28.6) x -= 24;
  let i = 0; while (i < PALC.length - 2 && x >= PALC[i + 1][0]) i++;
  const [h0, a] = PALC[i], [h1, b] = PALC[i + 1];
  const t = smooth(0, 1, (x - h0) / (h1 - h0));
  for (const k in a) {
    if (a[k] && a[k].isColor) { PX[k] = PX[k] || new THREE.Color(); PX[k].copy(a[k]).lerp(b[k], t); }
    else PX[k] = lerp(a[k], b[k], t);
  }
  return PX;
}

/* lenses: 35 mm-equivalent focal length on the frame's long side — wide for the landscape,
   a normal lens for the whole animal, a short telephoto for close-ups (as a photographer would) */
function focalFor(r) { return r > 12 ? lerp(40, 30, smooth(12, 24, r)) : r > 4.5 ? lerp(50, 40, smooth(4.5, 12, r)) : lerp(100, 50, smooth(.5, 4.5, r)); }
function fovFor(f, aspect) { const h = 2 * Math.atan(18 / f); return (aspect >= 1 ? 2 * Math.atan(Math.tan(h / 2) / aspect) : h) / DEG; }

export { ATM, SKY_GLSL, makeSky, samplePalette, focalFor, fovFor };
