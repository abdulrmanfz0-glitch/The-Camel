import { clamp, DEG, ENV, fbm, GLSL_NOISE3, lerp, mergeGeos, Q, rng, SHADE, SHADE_GLSL, smooth, TAU,
  terrainH, TEX, THREE, tintGeo, V3, vnoise } from '../app.js';

function rockMaterial() {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .9, metalness: 0 });
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, SHADE.u);
    sh.uniforms.tRockN = { value: TEX.t.rock_n }; sh.uniforms.okRock = TEX.ok.rock_n;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vW; varying vec3 vWN;')
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
        #ifdef USE_INSTANCING
          vW = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * objectNormal);
        #else
          vW = (modelMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(modelMatrix) * objectNormal);
        #endif`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vW; varying vec3 vWN; uniform sampler2D tRockN; uniform float okRock;
      ${GLSL_NOISE3}
      ${SHADE_GLSL}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        {
          vec3 n = normalize(vWN);
          float strata = sin(vW.y * 38.0 + vn3(vW * 1.3) * 5.0) * 0.5 + 0.5;
          float varnish = smoothstep(0.1, 0.8, n.y) * smoothstep(0.35, 0.75, vn3(vW * 2.2)) ;
          vec3 c = diffuseColor.rgb * (0.86 + 0.22 * strata) * (0.85 + 0.3 * vn3(vW * 7.0));
          c = mix(c, c * vec3(0.42, 0.3, 0.24), varnish * 0.75);
          diffuseColor.rgb = c;
        }`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        {
          vec3 n = normalize(vWN), w = pow(abs(n), vec3(4.0)); w /= w.x + w.y + w.z;
          vec3 tx = texture2D(tRockN, vW.zy * 0.9).xyz * 2.0 - 1.0, ty = texture2D(tRockN, vW.xz * 0.9).xyz * 2.0 - 1.0, tz = texture2D(tRockN, vW.xy * 0.9).xyz * 2.0 - 1.0;
          vec3 pert = vec3(0.0, tx.y, tx.x) * w.x + vec3(ty.x, 0.0, ty.y) * w.y + vec3(tz.x, tz.y, 0.0) * w.z;
          n = normalize(n + pert * 0.9 * okRock);
          normal = normalize((viewMatrix * vec4(n, 0.0)).xyz);
        }`)
      .replace('#include <aomap_fragment>', `#include <aomap_fragment>
        { float es = envShade(vW, normalize(vWN)); reflectedLight.directDiffuse *= es; reflectedLight.directSpecular *= es; }`);
  };
  return m;
}
function rockGeo(seed, r, flat = .55) {
  const g = new THREE.IcosahedronGeometry(r, 3), a = g.attributes.position, v = new V3(), R = rng(seed);
  const cuts = Array.from({ length: 4 }, () => [new V3(R() - .5, (R() - .2) * .6, R() - .5).normalize(), r * (.55 + R() * .3)]);
  for (let i = 0; i < a.count; i++) {
    v.fromBufferAttribute(a, i);
    const d = v.clone().normalize();
    let f = 1 + .22 * vnoise(d.x * 2.1 + seed, d.z * 2.1 - seed) + .08 * vnoise(d.y * 5 + seed, d.x * 5);
    v.multiplyScalar(f);
    for (const [cn, cd] of cuts) { const s = v.dot(cn); if (s > cd) v.addScaledVector(cn, cd - s); }       // fractured faces
    v.y = v.y > 0 ? v.y * flat : Math.max(v.y * .5, -r * .25);
    a.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}
function buildRocks() {
  const grp = new THREE.Group(), R = rng(99), mat = rockMaterial();
  const base = new THREE.Color('#b08a66'), pale = new THREE.Color('#c9ab86');
  const kinds = [0, 1, 2, 3].map(k => tintGeo(rockGeo(k * 7 + 3, 1, .5 + k * .08), base.clone().lerp(pale, k / 4)));
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new V3(), p = new V3();
  for (let k = 0; k < 4; k++) {
    const list = [];
    for (let i = 0; i < 14; i++) { const r = 3.4 + R() * 34, a = R() * TAU; list.push([r * Math.cos(a), r * Math.sin(a), .04 + R() * R() * .32]); }
    const inst = new THREE.InstancedMesh(kinds[k], mat, list.length);
    list.forEach(([x, z, s], i) => { p.set(x, terrainH(x, z) + s * .05, z); q.setFromEuler(new THREE.Euler((R() - .5) * .3, R() * TAU, (R() - .5) * .3)); sc.set(s * (1 + R() * .5), s, s * (1 + R() * .4)); M.compose(p, q, sc); inst.setMatrixAt(i, M); });
    inst.castShadow = inst.receiveShadow = true;
    grp.add(inst);
  }
  // two low sandstone outcrops in the middle distance: stacked, eroded beds
  for (const [x, z, s, seed] of [[17, -14, 1.6, 5], [-21, 13, 1.25, 8]]) {
    const beds = [], RR = rng(seed * 13);
    let y = 0;
    for (let b = 0; b < 4; b++) {
      const w = s * (2.2 - b * .38) * (.9 + RR() * .2), h = s * (.28 + RR() * .12);
      const g = rockGeo(seed * 10 + b, 1, .35); g.scale(w, h * 1.8, w * (.6 + RR() * .25)); g.rotateY(RR() * .5); g.translate((RR() - .5) * s * .4, y + h * .45, (RR() - .5) * s * .3);
      beds.push(tintGeo(g, base.clone().lerp(pale, RR())));
      y += h * .8;
    }
    const m = new THREE.Mesh(mergeGeos(beds), mat);
    m.position.set(x, terrainH(x, z) - .08, z); m.rotation.y = seed;
    m.castShadow = m.receiveShadow = true;
    grp.add(m);
  }
  return grp;
}

/* the far land: a plain that runs out to the horizon and an escarpment of pale limestone over red talus,
   2–3 km away, softened only by the air in front of it */
function farH(x, z) {
  const r = Math.hypot(x, z);
  return lerp(terrainH(x * Math.min(1, 430 / r), z * Math.min(1, 430 / r)), 0, smooth(430, 700, r)) + smooth(500, 1400, r) * (6 * fbm(x * .002, z * .002, 3) + 3);
}
function buildFarLand() {
  const grp = new THREE.Group();
  // plain ring
  const pos = [], col = [], idx = [], NA = 160, radii = [];
  for (let r = 420; r < 3100; r *= 1.06) radii.push(r);
  const c = new THREE.Color(), cB = new THREE.Color('#c38654'), cD = new THREE.Color('#a8704a');
  radii.forEach((r, i) => { for (let j = 0; j < NA; j++) { const a = j / NA * TAU, x = r * Math.cos(a), z = r * Math.sin(a); pos.push(x, farH(x, z) - .5, z); c.copy(cB).lerp(cD, .5 + .5 * fbm(x * .004, z * .004, 2)); col.push(c.r, c.g, c.b); } });
  for (let i = 0; i < radii.length - 1; i++) for (let j = 0; j < NA; j++) { const a = i * NA + j, b = i * NA + (j + 1) % NA, cc = (i + 1) * NA + j, d = (i + 1) * NA + (j + 1) % NA; idx.push(a, b, cc, b, d, cc); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  const plain = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  plain.userData.shade = false;
  grp.add(plain);
  // escarpment: an arc to the west-north-west, with talus, a cliff band and a caprock; gullies cut into it
  const U = 420, V = 26, ep = [], ec = [], ei = [];
  const a0 = 150 * DEG, a1 = 262 * DEG;
  const cT = new THREE.Color('#b77f55'), cF = new THREE.Color('#c79a6e'), cBand = new THREE.Color('#a9795a'), cCap = new THREE.Color('#d8c7a8');
  for (let i = 0; i <= U; i++) {
    const t = i / U, a = lerp(a0, a1, t);
    const D = 2150 + 380 * fbm(t * 5 + 3, 1.7, 3) + 250 * Math.sin(t * 7.3);
    const Hc = (95 + 55 * fbm(t * 9, 4.2, 3)) * smooth(0, .06, t) * smooth(1, .92, t);
    const gully = Math.pow(Math.abs(vnoise(t * 140, 2.1)), .6);
    for (let j = 0; j <= V; j++) {
      const s = j / V;
      let h, back;
      if (s < .45) { const k = s / .45; h = Hc * .42 * Math.pow(k, 1.4); back = -120 * (1 - k); }        // talus apron
      else if (s < .88) { const k = (s - .45) / .43; h = Hc * (.42 + .52 * k); back = k * 18 - gully * 22 * (1 - Math.abs(k - .5) * 1.4); }  // cliff face
      else { const k = (s - .88) / .12; h = Hc * (.94 + .06 * Math.sin(k * 1.57)); back = 18 + k * 260; }                              // caprock and dip slope
      const rr = D + back, x = rr * Math.cos(a), z = rr * Math.sin(a);
      ep.push(x, h + farH(x, z) - 1, z);
      c.copy(s < .45 ? cT : s < .88 ? cF : cCap);
      if (s >= .45 && s < .88) { const band = Math.sin(h * .35 + fbm(t * 30, 1, 2) * 2) * .5 + .5; c.lerp(cBand, band * .5); if (h / Hc > .8) c.lerp(cCap, .5); }
      c.multiplyScalar(.9 + .18 * vnoise(t * 60, s * 8));
      ec.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < U; i++) for (let j = 0; j < V; j++) { const a = i * (V + 1) + j, b = a + 1, cc = a + V + 1, d = cc + 1; ei.push(a, cc, b, b, cc, d); }
  const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.Float32BufferAttribute(ep, 3)); eg.setAttribute('color', new THREE.Float32BufferAttribute(ec, 3)); eg.setIndex(ei); eg.computeVertexNormals();
  const em = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 });
  em.onBeforeCompile = sh => {
    sh.uniforms.tRockN = { value: TEX.t.rock_n };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vW;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vW; uniform sampler2D tRockN;')
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        { vec3 t = texture2D(tRockN, vec2(atan(vW.z, vW.x) * 900.0, vW.y) / 22.0).xyz * 2.0 - 1.0;
          normal = normalize(normal + (viewMatrix * vec4(t.x, t.y * 0.6, t.x, 0.0)).xyz * 0.6); }`);
  };
  const esc = new THREE.Mesh(eg, em); esc.userData.shade = false;
  grp.add(esc);
  return grp;
}

/* a stone trough for drinking */
function buildTrough() {
  const g = new THREE.Group();
  const prof = [[.34, -.05], [.38, .02], [.4, .3], [.37, .36], [.33, .37], [.31, .33], [.3, .08], [0, .08]].map(([r, y]) => new THREE.Vector2(r, y));
  const geo = new THREE.LatheGeometry(prof, 48), a = geo.attributes.position, colr = new Float32Array(a.count * 3), v = new V3(), c = new THREE.Color();
  for (let i = 0; i < a.count; i++) {
    v.fromBufferAttribute(a, i);
    const n = fbm(Math.atan2(v.z, v.x) * 3 + v.y * 9, v.y * 12);
    c.set('#9b8a74').multiplyScalar(.88 + .2 * n);
    colr[i * 3] = c.r; colr[i * 3 + 1] = c.g; colr[i * 3 + 2] = c.b;
    a.setXYZ(i, v.x * (1 + n * .02), v.y, v.z * (1 + n * .02));
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colr, 3)); geo.computeVertexNormals();
  const stone = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .92 }));
  stone.castShadow = stone.receiveShadow = true;
  const water = new THREE.Mesh(new THREE.CircleGeometry(.305, 48), new THREE.MeshPhysicalMaterial({ color: '#2b4c52', roughness: .04, metalness: 0, transparent: true, opacity: .88, clearcoat: 1 }));
  water.rotation.x = -Math.PI / 2; water.position.y = .085;
  g.add(stone, water);
  return { g, water, setLevel(l) { water.visible = l > .01; water.position.y = lerp(.085, .3, clamp(l, 0, 1)); } };
}

/* shared by the dust shaders: sun and sky light in the atmosphere model's units */
const AIRU = { uSunE: { value: new V3() }, uSkyE: { value: new V3() }, uSunW: { value: new V3() } };

/* wind-borne sand in a storm: far sheets, near grains and low streamers that travel with the view */
function buildDust() {
  const N = Math.round((ENV.mobile ? 1600 : 4200) * (Q.name === 'low' ? .6 : 1));
  const pos = new Float32Array(N * 3), seed = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) { seed[i * 4] = Math.random(); seed[i * 4 + 1] = Math.pow(Math.random(), 1.8); seed[i * 4 + 2] = Math.random(); seed[i * 4 + 3] = Math.random(); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false,
    uniforms: Object.assign({ uT: { value: 0 }, uK: { value: 0 }, uC: { value: new V3() }, uPR: { value: 1 }, uCol: { value: new THREE.Color('#a47c52') } }, AIRU),
    vertexShader: `attribute vec4 aSeed; uniform float uT, uK, uPR; uniform vec3 uC; varying float vA;
      void main(){
        float box = 16.0;
        vec3 p = vec3(aSeed.x * 2.0 - 1.0, aSeed.y, aSeed.z * 2.0 - 1.0) * vec3(box, 4.0, box);
        float sp = 6.0 + aSeed.w * 9.0;
        p.x = mod(p.x - uT * sp - uC.x + box, 2.0 * box) - box + uC.x;
        p.z += uC.z + sin(uT * 2.0 + aSeed.w * 30.0) * 0.4;
        p.y += sin(uT * 3.0 + aSeed.x * 40.0) * 0.15;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (1.6 + aSeed.w * 3.4) * uPR * (8.0 / -mv.z);
        vA = uK * (0.35 + 0.65 * aSeed.w) * smoothstep(0.0, 1.5, -mv.z);
      }`,
    fragmentShader: `uniform vec3 uCol, uSunE, uSkyE, uSunW; varying float vA;
      void main(){ vec2 d = gl_PointCoord - 0.5; float r = dot(d, d) * 4.0; if (r > 1.0) discard;
        vec3 L = (uSunE * max(uSunW.y, 0.0) * 0.5 + uSkyE) / 3.14159;
        gl_FragColor = vec4(uCol * L * 1.6, (1.0 - r) * vA); }`,
  });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false; pts.visible = false; pts.renderOrder = 20;
  return { pts, mat, update(dt, k, center, t) { pts.visible = k > .003; mat.uniforms.uT.value = t; mat.uniforms.uK.value = k; mat.uniforms.uC.value.copy(center); } };
}

/* fine airborne dust on a calm day: invisible against the light, glowing when the sun is behind it */
function buildMotes() {
  const N = ENV.mobile ? 500 : 1400;
  const seed = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) { seed[i * 4] = Math.random(); seed[i * 4 + 1] = Math.random(); seed[i * 4 + 2] = Math.random(); seed[i * 4 + 3] = Math.random(); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: Object.assign({ uT: { value: 0 }, uC: { value: new V3() }, uPR: { value: 1 }, uK: { value: 1 } }, AIRU),
    vertexShader: `attribute vec4 aSeed; uniform float uT, uPR; uniform vec3 uC; varying float vA; varying vec3 vV;
      void main(){
        vec2 box = vec2(7.0);
        vec2 q = (aSeed.xz * 2.0 - 1.0) * box + vec2(uT * (0.18 + aSeed.w * 0.2), uT * 0.05);
        q = mod(q - uC.xz + box, 2.0 * box) - box + uC.xz;
        vec3 p = vec3(q.x, 0.05 + aSeed.y * 2.8 + sin(uT * 0.4 + aSeed.w * 20.0) * 0.2, q.y);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (1.0 + aSeed.w * 1.6) * uPR;
        vA = smoothstep(0.3, 1.2, -mv.z) * smoothstep(9.0, 4.0, -mv.z);
        vV = normalize(p - cameraPosition);
      }`,
    fragmentShader: `uniform vec3 uSunE, uSkyE, uSunW; uniform float uK; varying float vA; varying vec3 vV;
      void main(){ vec2 d = gl_PointCoord - 0.5; float r = dot(d, d) * 4.0; if (r > 1.0) discard;
        float ct = dot(vV, uSunW), g = 0.75;
        float hg = (1.0 - g * g) / pow(1.0 + g * g - 2.0 * g * ct, 1.5) / 12.566;
        vec3 L = uSunE * hg * 0.9 + uSkyE * 0.02;
        gl_FragColor = vec4(L * (1.0 - r) * vA * uK, 1.0); }`,
  });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false; pts.renderOrder = 21;
  return { pts, mat, update(t, center, k) { mat.uniforms.uT.value = t; mat.uniforms.uC.value.copy(center); mat.uniforms.uK.value = k; } };
}

export { buildRocks, buildFarLand, buildTrough, AIRU, buildDust, buildMotes };
