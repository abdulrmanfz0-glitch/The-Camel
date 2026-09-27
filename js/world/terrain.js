import { clamp, CU, DEG, ENV, fbm, GLSL_NOISE3, lerp, Q, renderer, smooth, TAU, THREE, V3, vnoise, wrap1 } from '../app.js';

const TEX = {
  base: 'assets/tex/', t: {}, ok: {}, names: ['sand_d', 'gravel_c', 'gravel_n', 'crust_c', 'rock_n', 'bark_c', 'bark_n'],
  small: n => (ENV.mobile || Q.name === 'low') && !/crust|rock_n/.test(n),
  apply() {
    if (this.made) return; this.made = true;
    const ph = document.createElement('canvas'); ph.width = ph.height = 4;
    const px = ph.getContext('2d'); px.fillStyle = '#808080'; px.fillRect(0, 0, 4, 4);
    const an = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    for (const n of this.names) {
      const t = new THREE.Texture(ph); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.flipY = false; t.anisotropy = an;
      t.colorSpace = n.endsWith('_c') ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.needsUpdate = true;
      if (n.endsWith('_n')) { const c2 = document.createElement('canvas'); c2.width = c2.height = 4; const x2 = c2.getContext('2d'); x2.fillStyle = '#8080ff'; x2.fillRect(0, 0, 4, 4); t.image = c2; }
      this.t[n] = t; this.ok[n] = { value: 0 };
    }
  },
  /* fetch every file, decode off the main thread where possible; missing files leave the procedural fallback */
  load(onOne) {
    this.apply();
    return Promise.all(this.names.map(async n => {
      const url = this.base + n + (this.small(n) ? '_lo' : '') + '.webp';
      try {
        const r = await fetch(url); if (!r.ok) throw new Error(r.status);
        const blob = await r.blob();
        let img;
        if (typeof createImageBitmap === 'function') img = await createImageBitmap(blob, { imageOrientation: 'none', premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
        else { img = new Image(); img.src = URL.createObjectURL(blob); await img.decode(); }
        const t = this.t[n]; t.image = img; t.needsUpdate = true; this.ok[n].value = 1;
      } catch (e) { /* offline or opened from disk: the shaders fall back to procedural detail */ }
      if (onOne) onOne(n);
    }));
  },
};

const PLAY_R = 7.5;          // the flat sand where she walks
function terrainH(x, z) {
  const r = Math.hypot(x, z);
  let h = 0.035 * fbm(x * .45 + 7.1, z * .45 - 2.3, 3) + 0.012 * vnoise(x * 1.9, z * 1.9);
  const w = smooth(PLAY_R + .5, 26, r);
  if (w > 0) {
    // long linear dunes aligned with the prevailing north-north-westerly wind, crests wandering
    const a = 18 * DEG, u = x * Math.cos(a) + z * Math.sin(a), v = -x * Math.sin(a) + z * Math.cos(a);
    const crest = u + 7 * Math.sin(v * .041) + 2.6 * Math.sin(v * .13 + 1.7);
    const P = 46, t = wrap1(crest / P + .23), ap = .7;
    const prof = t < ap ? Math.pow(t / ap, 1.5) : Math.pow((1 - t) / (1 - ap), .7);
    const H = lerp(1.8, 11, smooth(12, 150, r)) * (.72 + .28 * fbm(v * .01 + 3, u * .004, 2));
    h += H * prof * w;
    h += w * 2.4 * smooth(.25, .9, fbm(x * .018 + 11, z * .018 - 4, 3) + .35) * smooth(15, 60, r);
    h += w * .5 * fbm(x * .09, z * .09, 3);
  }
  return h;
}
function terrainNormal(x, z, out = new V3()) {
  const e = .03;
  return out.set(terrainH(x - e, z) - terrainH(x + e, z), 2 * e, terrainH(x, z - e) - terrainH(x, z + e)).normalize();
}

/* footprints: a height map around the play area (R = depression, G = raised rim) that the wind slowly erases */
const FOOT = {
  size: 24, res: 1024, rt: null, scene: null, cam: null, stampMat: null, fadeMat: null, pending: [], quad: null,
  init() {
    this.rt = new THREE.WebGLRenderTarget(this.res, this.res, { type: THREE.UnsignedByteType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    this.cam = new THREE.OrthographicCamera(-this.size / 2, this.size / 2, this.size / 2, -this.size / 2, -1, 1);
    this.scene = new THREE.Scene();
    this.stampMat = new THREE.ShaderMaterial({
      uniforms: { uDepth: { value: 1 } }, transparent: true, depthTest: false, depthWrite: false,
      blending: THREE.CustomBlending, blendEquation: THREE.MaxEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float uDepth; varying vec2 vUv;
        float blob(vec2 p, vec2 c, vec2 r){ vec2 d = (p - c) / r; return 1.0 - dot(d, d); }
        void main(){
          vec2 p = vUv * 2.0 - 1.0;
          // a camel's print: a broad oval sole with two toe lobes in front and a shallow cleft between them
          float pad = blob(p, vec2(0.0, -0.16), vec2(0.6, 0.62));
          float t1 = blob(p, vec2(-0.29, 0.5), vec2(0.28, 0.36)), t2 = blob(p, vec2(0.29, 0.5), vec2(0.28, 0.36));
          float m = max(pad, max(t1, t2));
          m -= smoothstep(0.07, 0.0, abs(p.x)) * step(0.22, p.y) * 0.7;
          float dep = smoothstep(0.0, 0.3, m) * (0.8 + 0.2 * smoothstep(0.6, -0.4, p.y));
          float rim = smoothstep(-0.6, -0.1, m) * smoothstep(0.08, -0.12, m) * (0.7 + 0.5 * smoothstep(0.0, -0.9, p.y));
          gl_FragColor = vec4(dep * uDepth, rim * uDepth, 0.0, 1.0);
        }`,
    });
    this.fadeMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, depthTest: false, depthWrite: false,
      blending: THREE.CustomBlending, blendEquation: THREE.ReverseSubtractEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(this.size, this.size), this.fadeMat);
    this.pool = [];
    renderer.setRenderTarget(this.rt); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.setRenderTarget(null);
  },
  stamp(x, z, yaw, s = 1, depth = 1) { this.pending.push([x, z, yaw, s, depth]); },
  update(dt, wind) {
    const fadeAmt = dt * (0.0025 + wind * 0.25);
    this.acc = (this.acc || 0) + fadeAmt;
    if (!this.pending.length && this.acc < 1 / 255) return;
    this.scene.clear();
    if (this.acc >= 1 / 255) {
      const q = Math.floor(this.acc * 255) / 255; this.acc -= q;
      this.fadeMat.color.setRGB(q, q, 0);
      this.scene.add(this.quad);
    }
    this.pending.forEach(([x, z, yaw, s, depth], i) => {
      let m = this.pool[i];
      if (!m) { m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.stampMat.clone()); this.pool[i] = m; }
      m.position.set(x, -z, 0); m.rotation.set(0, 0, -yaw - Math.PI / 2); m.scale.set(.2 * s, .25 * s, 1);
      m.material.uniforms.uDepth.value = depth;
      this.scene.add(m);
    });
    this.pending.length = 0;
    const ac = renderer.autoClear; renderer.autoClear = false;
    renderer.setRenderTarget(this.rt); renderer.render(this.scene, this.cam); renderer.setRenderTarget(null);
    renderer.autoClear = ac;
  },
};

/* long shadows of the landscape itself — acacias, shrubs, rocks and dune crests — from a second,
   sun-aligned depth map over the walkable area (the camel keeps three's sharper, PCSS-filtered map) */
const SHADE = {
  size: 96, res: 2048, rt: null, cam: null, scene: null, M: new THREE.Matrix4(), last: new V3(), on: false,
  u: { uShadeTex: { value: null }, uShadeM: { value: new THREE.Matrix4() }, uShadeOn: { value: 0 }, uShadeTexel: { value: 1 / 2048 } },
  init(groups) {
    this.res = Q.name === 'low' ? 1024 : 2048;
    this.u.uShadeTexel.value = 1 / this.res;
    this.rt = new THREE.WebGLRenderTarget(this.res, this.res, { depthBuffer: true, depthTexture: new THREE.DepthTexture(this.res, this.res, THREE.UnsignedIntType), type: THREE.UnsignedByteType });
    this.rt.depthTexture.minFilter = this.rt.depthTexture.magFilter = THREE.NearestFilter;
    this.u.uShadeTex.value = this.rt.depthTexture;
    const h = this.size / 2;
    this.cam = new THREE.OrthographicCamera(-h, h, h, -h, 45, 200);
    this.scene = new THREE.Scene();
    this.scene.matrixWorldAutoUpdate = false;
    const depth = new THREE.MeshBasicMaterial({ colorWrite: false });
    // proxies share geometry and instance matrices; alpha-tested cards keep their cut-outs
    const add = o => {
      o.updateWorldMatrix(true, false);
      let p;
      const mat = o.material && o.material.userData.shadeMat ? o.material.userData.shadeMat : depth;
      if (o.isInstancedMesh) { p = new THREE.InstancedMesh(o.geometry, mat, o.count); p.instanceMatrix = o.instanceMatrix; }
      else p = new THREE.Mesh(o.geometry, mat);
      p.matrixAutoUpdate = false; p.matrix.copy(o.matrixWorld); p.matrixWorld.copy(o.matrixWorld); p.frustumCulled = false;
      this.scene.add(p);
    };
    for (const g of groups) g.traverse(o => { if (o.isMesh && o.userData.shade !== false) add(o); });
  },
  update(sunDir, lit) {
    this.on = lit;
    this.u.uShadeOn.value = lit ? 1 : 0;
    if (!lit || !this.rt) return;
    if (this.last.distanceToSquared(sunDir) < 2e-6) return;
    this.last.copy(sunDir);
    const c = this.cam;
    c.position.copy(sunDir).multiplyScalar(120); c.up.set(0, 1, 0); if (Math.abs(sunDir.y) > .98) c.up.set(0, 0, 1);
    c.lookAt(0, 0, 0); c.updateMatrixWorld(); c.updateProjectionMatrix();
    const bias = new THREE.Matrix4().set(.5, 0, 0, .5, 0, .5, 0, .5, 0, 0, .5, .5, 0, 0, 0, 1);
    this.u.uShadeM.value.copy(bias).multiply(c.projectionMatrix).multiply(c.matrixWorldInverse);
    const cc = new THREE.Color(); renderer.getClearColor(cc); const ca = renderer.getClearAlpha();
    renderer.setRenderTarget(this.rt); renderer.setClearColor(0xffffff, 1); renderer.clear(); renderer.render(this.scene, c); renderer.setRenderTarget(null);
    renderer.setClearColor(cc, ca);
  },
};
const SHADE_GLSL = `
  uniform sampler2D uShadeTex; uniform mat4 uShadeM; uniform float uShadeOn, uShadeTexel;
  float envShade(vec3 wp, vec3 wn){
    if (uShadeOn < 0.5) return 1.0;
    vec4 p = uShadeM * vec4(wp + wn * 0.09, 1.0);
    if (p.x < 0.0 || p.y < 0.0 || p.x > 1.0 || p.y > 1.0 || p.z > 1.0) return 1.0;
    float s = 0.0;
    for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++) s += step(p.z - 0.0016, texture2D(uShadeTex, p.xy + vec2(float(i), float(j)) * uShadeTexel * 1.3).x);
    return s / 9.0;
  }`;

/* contact occlusion under the camel: her four pads and the barrel above the sand */
const CONTACT = { feet: Array.from({ length: 4 }, () => new THREE.Vector4(0, -9, 0, .12)), body: new THREE.Vector4(0, 1.2, 0, 0), ax: new THREE.Vector4(1, 0, .9, 0) };
const SANDU = {
  uWind: { value: 0 }, uFeet: { value: CONTACT.feet }, uBody: { value: CONTACT.body }, uBodyAx: { value: CONTACT.ax },
  uTrees: { value: Array.from({ length: 6 }, () => new THREE.Vector3(0, 0, -999)) },
};

function makeSandMaterial() {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .93, metalness: 0 });
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, SANDU, SHADE.u);
    sh.uniforms.uFoot = { value: FOOT.rt.texture }; sh.uniforms.uFootSize = { value: FOOT.size };
    sh.uniforms.uTime = CU.uTime;
    sh.uniforms.tSand = { value: TEX.t.sand_d }; sh.uniforms.tGravC = { value: TEX.t.gravel_c }; sh.uniforms.tGravN = { value: TEX.t.gravel_n }; sh.uniforms.tCrust = { value: TEX.t.crust_c };
    sh.uniforms.okSand = TEX.ok.sand_d; sh.uniforms.okGrav = TEX.ok.gravel_c; sh.uniforms.okCrust = TEX.ok.crust_c;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vW; varying vec3 vWN;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvW = (modelMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(modelMatrix) * objectNormal);');
    if (Q.name === 'low') sh.fragmentShader = '#define LOWQ\n' + sh.fragmentShader;
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vW; varying vec3 vWN;
      uniform sampler2D uFoot, tSand, tGravC, tGravN, tCrust; uniform float uFootSize, uTime, uWind, okSand, okGrav, okCrust;
      uniform vec4 uFeet[4]; uniform vec4 uBody; uniform vec4 uBodyAx; uniform vec3 uTrees[6];
      ${GLSL_NOISE3}
      ${SHADE_GLSL}
      vec2 footUV(vec2 p){ return vec2(p.x / uFootSize + 0.5, -p.y / uFootSize + 0.5); }
      float footH(vec2 p){ vec2 uv = footUV(p); if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return 0.0; vec4 f = texture2D(uFoot, uv); return f.g * 0.35 - f.r; }
      /* wind ripples: crests across the north-north-westerly wind, ~9 cm apart, gentle upwind and steep downwind */
      float ripH(vec2 p){
        float a = 0.3 + (vn3(vec3(p * 0.09, 2.0)) - 0.5) * 0.9;
        vec2 d = vec2(sin(a), cos(a));
        float w = vn3(vec3(p * 0.45, 1.3)) * 2.4 + vn3(vec3(p * 1.6, 7.1)) * 0.8 + vn3(vec3(p * 4.1, 3.3)) * 0.22;
        float sp = 0.082 + 0.03 * vn3(vec3(p * 0.3, 5.0));
        float f = fract(dot(p, d) / sp + w);
        float h = f < 0.72 ? f / 0.72 : (1.0 - f) / 0.28;
        float amp = smoothstep(0.15, 0.55, vn3(vec3(p * 0.6, 9.0))) * (0.6 + 0.4 * vn3(vec3(p * 2.7, 4.0)));
        return h * h * (3.0 - 2.0 * h) * amp;
      }
      float lumT(vec3 c){ return dot(c, vec3(0.2126, 0.7152, 0.0722)); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec2 P = vW.xz;
        float fw = length(fwidth(P));
        float nearK = 1.0 - smoothstep(0.012, 0.09, fw);               // fine detail only where a pixel is small
        float fh = footH(P);
        float slope = 1.0 - clamp(vWN.y, 0.0, 1.0);
        // where the sand lies: gravel in the interdune flats, silty crust around the acacias of the wadi floor
        float rC = length(P);
        float nT = 99.0; for (int i = 0; i < 6; i++) nT = min(nT, length(P - uTrees[i].xy) / max(uTrees[i].z, 0.1));
        float crustK = smoothstep(1.2, 0.6, nT + (vn3(vec3(P * 0.35, 4.0)) - 0.5) * 0.7 + (vn3(vec3(P * 1.7, 8.0)) - 0.5) * 0.25) * okCrust;
        float grav = smoothstep(0.58, 0.8, vn3(vec3(P * 0.045, 2.0)) * 0.7 + vn3(vec3(P * 0.3, 5.0)) * 0.3 + (1.0 - smoothstep(0.0, 1.2, vW.y)) * 0.12 - slope * 0.6);
        grav *= smoothstep(4.5, 9.0, rC) * okGrav;
        grav = max(grav, crustK * 0.35 * okGrav);
        // grain: the photographed sand at two scales, rotated against each other to hide repeats
        vec2 u1 = P / 0.34, u2 = mat2(0.8, -0.6, 0.6, 0.8) * P / 2.3;
        float g1 = mix(0.5, texture2D(tSand, u1).r, okSand), g2 = mix(0.5, texture2D(tSand, u2).r, okSand);
        float grain = mix(0.5, g1, nearK * 0.9 + 0.1) * 0.7 + g2 * 0.3;
        vec3 base = diffuseColor.rgb;
        base *= 0.84 + 0.34 * grain;
        base *= 0.93 + 0.14 * vn3(vec3(P * 0.9, 11.0));
        // ripples: crests a touch paler (coarser grains), troughs darker; smoothed away by feet, slopes, gravel
        float ripK = (1.0 - smoothstep(0.012, 0.045, fw)) * (1.0 - smoothstep(0.25, 0.55, slope)) * (1.0 - clamp(-fh * 3.0, 0.0, 1.0)) * (1.0 - grav) * (1.0 - crustK)
                     * smoothstep(0.25, 0.6, vn3(vec3(P * 0.12, 6.0)) + 0.35);
        float rh = ripH(P);
        base *= 1.0 + (rh - 0.5) * 0.1 * ripK;
        // gravel lag: the photo's pebbles tinted towards the local sand
        vec3 gc = texture2D(tGravC, P / 1.7).rgb;
        vec3 gT = mix(gc, vec3(lumT(gc)) * base / max(lumT(base), 1e-3) * 1.05, 0.55);
        base = mix(base, gT, grav);
        vec3 cc = texture2D(tCrust, P / 2.6).rgb;
        vec3 cT = vec3(lumT(cc)) * base / max(lumT(base), 1e-3);
        base = mix(base, mix(cc * vec3(0.95, 0.86, 0.74), cT, 0.55) * 0.82, crustK * 0.8);
        // footprints: compacted, slightly darker sand in the pits
        base *= mix(1.0, 0.86, clamp(-fh, 0.0, 1.0));
        diffuseColor.rgb = base;
        float hR = rh * ripK;`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        {
          vec3 n = normalize(vWN);
          // footprints
          float e = 0.012;
          float f0 = footH(P), fx = footH(P + vec2(e, 0.0)), fz = footH(P + vec2(0.0, e));
          n = normalize(n + vec3(-(fx - f0) / e, 0.0, -(fz - f0) / e) * 0.035);
          // ripples (analytic height, central differences)
          #ifdef LOWQ
          ripK = 0.0; nearK = 0.0;
          #endif
          if (ripK > 0.001) {
            float r1 = ripH(P + vec2(0.006, 0.0)), r2 = ripH(P - vec2(0.006, 0.0)), r3 = ripH(P + vec2(0.0, 0.006)), r4 = ripH(P - vec2(0.0, 0.006));
            n = normalize(n + vec3(-(r1 - r2), 0.0, -(r3 - r4)) / 0.012 * 0.0048 * ripK);
          }
          // grain relief from the sand photo, only where it is resolved
          if (nearK > 0.01) {
            vec2 tx = max(vec2(1.0 / 1024.0), fwidth(u1));
            float a = texture2D(tSand, u1 + vec2(tx.x, 0.0)).r - texture2D(tSand, u1 - vec2(tx.x, 0.0)).r;
            float b = texture2D(tSand, u1 + vec2(0.0, tx.y)).r - texture2D(tSand, u1 - vec2(0.0, tx.y)).r;
            n = normalize(n + vec3(-a, 0.0, -b) * 0.35 * nearK * okSand * (1.0 - grav));
          }
          // pebbles
          if (grav > 0.01) {
            vec3 gn = texture2D(tGravN, P / 1.7).xyz * 2.0 - 1.0;
            n = normalize(mix(n, normalize(vec3(gn.x, gn.z, -gn.y) + n * 0.6), grav * 0.8));
          }
          normal = normalize((viewMatrix * vec4(n, 0.0)).xyz);
        }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(0.9, 0.97, grav);`)
      .replace('#include <aomap_fragment>', `#include <aomap_fragment>
        {
          // contact occlusion where the pads meet the sand and under the barrel
          float ao = 1.0;
          for (int i = 0; i < 4; i++) {
            vec4 f = uFeet[i];
            float d = length(vW.xz - f.xz);
            ao *= 1.0 - 0.62 * smoothstep(f.w * 2.1, f.w * 0.55, d) * smoothstep(0.3, 0.02, f.y);
          }
          vec2 q = vW.xz - uBody.xz;
          float along = dot(q, uBodyAx.xy), across = dot(q, vec2(-uBodyAx.y, uBodyAx.x));
          float el = length(vec2(along / (uBodyAx.z + 0.35), across / mix(0.62, 0.55, uBodyAx.w)));
          ao *= 1.0 - mix(0.3, 0.72, uBodyAx.w) * exp(-el * el * mix(1.3, 2.6, uBodyAx.w)) * smoothstep(2.2, 0.4, uBody.y);
          ao *= 1.0 - 0.25 * clamp(-fh, 0.0, 1.0);
          reflectedLight.indirectDiffuse *= ao;
          reflectedLight.directDiffuse *= mix(1.0, ao, 0.25);
          float es = envShade(vW, normalize(vWN));
          reflectedLight.directDiffuse *= es; reflectedLight.directSpecular *= es;
        }`);
  };
  return m;
}

function buildTerrain() {
  const NA = Math.round(420 * Q.terrain);
  const radii = [0];
  let r = 0;
  while (r < 440) { const dr = Math.max(.07 / Q.terrain, r * .034 / Q.terrain); r += dr; radii.push(r); }
  const pos = [], col = [], idx = [];
  // red dune sand of the Dahna belt east of Riyadh: paler, yellower crests; redder, coarser troughs
  const cBase = new THREE.Color('#c78e5d'), cCrest = new THREE.Color('#d6a674'), cTrough = new THREE.Color('#b47b4f'), cWarm = new THREE.Color('#be7e4f'), c = new THREE.Color();
  const _tv = new V3();
  const push = (x, z) => {
    const y = terrainH(x, z);
    pos.push(x, y, z);
    const n = fbm(x * .07 + 2, z * .07 - 5, 3) * .5 + .5, slope = 1 - terrainNormal(x, z, _tv).y;
    c.copy(cBase).lerp(y > 1.5 ? cCrest : cTrough, clamp(Math.abs(y - 1.5) / 6, 0, 1) * .7).lerp(cWarm, n * .3);
    c.lerp(cTrough, clamp(slope * 2.5, 0, .45));
    c.multiplyScalar(.96 + .08 * vnoise(x * 1.3, z * 1.3));
    col.push(c.r, c.g, c.b);
  };
  push(0, 0);
  for (let i = 1; i < radii.length; i++) for (let j = 0; j < NA; j++) { const a = j / NA * TAU; push(radii[i] * Math.cos(a), radii[i] * Math.sin(a)); }
  for (let j = 0; j < NA; j++) idx.push(0, 1 + (j + 1) % NA, 1 + j);
  for (let i = 1; i < radii.length - 1; i++) for (let j = 0; j < NA; j++) {
    const a = 1 + (i - 1) * NA + j, b = 1 + (i - 1) * NA + (j + 1) % NA, cc = 1 + i * NA + j, d = 1 + i * NA + (j + 1) % NA;
    idx.push(a, b, cc, b, d, cc);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, makeSandMaterial());
  m.receiveShadow = true; m.castShadow = false;
  return m;
}

/* merge simple geometries into one (positions, normals, colours, uvs) */
function mergeGeos(list) {
  let nv = 0, ni = 0;
  for (const g of list) { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), idx = new Uint32Array(ni);
  let ov = 0, oi = 0;
  for (const g of list) {
    const n = g.attributes.position.count;
    pos.set(g.attributes.position.array, ov * 3);
    if (!g.attributes.normal) g.computeVertexNormals();
    nor.set(g.attributes.normal.array, ov * 3);
    if (g.attributes.color) col.set(g.attributes.color.array, ov * 3); else col.fill(1, ov * 3, (ov + n) * 3);
    if (g.attributes.uv) uv.set(g.attributes.uv.array, ov * 2);
    if (g.index) for (let i = 0; i < g.index.count; i++) idx[oi++] = g.index.array[i] + ov;
    else for (let i = 0; i < n; i++) idx[oi++] = i + ov;
    ov += n;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  return out;
}
function tintGeo(g, color) {
  const n = g.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = color.r; a[i * 3 + 1] = color.g; a[i * 3 + 2] = color.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return g;
}
/* a tapered branch from p0 to p1, bark uvs in metres (u around, v along) */
function twig(p0, p1, r0, r1, seg = 5) {
  const g = new THREE.CylinderGeometry(r1, r0, 1, seg, 1, true);
  g.translate(0, .5, 0);
  const d = p1.clone().sub(p0), len = d.length();
  g.scale(1, len, 1);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Math.max(1, Math.round(TAU * r0 / .35)), uv.getY(i) * len / .5);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), d.normalize()));
  g.translate(p0.x, p0.y, p0.z);
  return g;
}

export { TEX, terrainH, FOOT, SHADE, SHADE_GLSL, CONTACT, SANDU, buildTerrain, mergeGeos, tintGeo, twig };
