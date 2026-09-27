import { ANAT, sq, TAU, THREE } from '../app.js';

/* ════════════════════════════════════════════════════════════════
   the living body: skinned mesh from the SDF build, coat shading,
   fur shells, eyes with lids, lashes and the third eyelid
   ════════════════════════════════════════════════════════════════ */
const GLSL_NOISE3 = `
  float h13(vec3 p){ p = fract(p * .1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
  float vn3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(h13(i), h13(i + vec3(1,0,0)), f.x), mix(h13(i + vec3(0,1,0)), h13(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(h13(i + vec3(0,0,1)), h13(i + vec3(1,0,1)), f.x), mix(h13(i + vec3(0,1,1)), h13(i + vec3(1,1,1)), f.x), f.y), f.z); }
  vec3 flowDir(vec3 n){ vec3 g = normalize(vec3(-0.55, -0.83, 0.0)); vec3 t = g - dot(g, n) * n; float l = length(t); return l > 1e-3 ? t / l : normalize(cross(n, vec3(0.0, 0.0, 1.0)) + 1e-4); }`;
const GLSL_BUMP = `
  vec3 bumpN(vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection) {
    vec3 vSigmaX = normalize(dFdx(surf_pos.xyz)); vec3 vSigmaY = normalize(dFdy(surf_pos.xyz)); vec3 vN = surf_norm;
    vec3 R1 = cross(vSigmaY, vN); vec3 R2 = cross(vN, vSigmaX);
    float fDet = dot(vSigmaX, R1) * faceDirection;
    vec3 vGrad = sign(fDet) * (dHdxy.x * R1 + dHdxy.y * R2);
    return normalize(abs(fDet) * surf_norm - vGrad); }`;
/* skin disease looks (awareness only, never gory): mange, pox, ringworm, ticks, sore pads, reddening */
const LES_GLSL = `
  uniform float uLesK, uLesReg[20], uMale;
  float lesReg(){ int r = int(vRegion + 0.5); float m = 0.0; for (int i = 0; i < 20; i++) if (i == r) m = uLesReg[i]; return m; }
  // returns x: hairless amount, y: crust/scab amount, z: raised relief, w: redness
  vec4 lesion(vec3 P){
    if (uLesK < 0.5) return vec4(0.0);
    float m = lesReg();
    if (m < 0.01) return vec4(0.0);
    if (uLesK < 1.5) {                                   // sarcoptic mange: patchy hair loss, thickened, wrinkled grey skin and crusts
      float a = smoothstep(0.5, 0.66, vn3(P * 16.0) * 0.65 + vn3(P * 45.0) * 0.35);
      float wr = sin(dot(P, vec3(420.0, 230.0, 330.0)) + vn3(P * 70.0) * 5.0) * 0.5 + 0.5;
      return vec4(a * 0.9, a * 0.35 * wr, a * wr * 0.35, a * 0.12) * m;
    }
    if (uLesK < 2.5) {                                   // camelpox: papules, pustules and dark scabs ~1 cm
      vec3 q = P * 70.0, id = floor(q), f = fract(q) - 0.5;
      float on = step(0.5, h13(id)), d = length(f - (vec3(h13(id + 3.1), h13(id + 5.7), h13(id + 9.2)) - 0.5) * 0.4);
      float spot = on * smoothstep(0.36, 0.22, d), core = on * smoothstep(0.15, 0.05, d);
      return vec4(spot * 0.8, core, spot * 1.3, spot * (1.0 - core)) * m;
    }
    if (uLesK < 3.5) {                                   // ringworm: round, dry, greyish, hairless patches 3–6 cm
      vec3 q = P * 7.5, id = floor(q), f = fract(q) - 0.5;
      float on = step(0.55, h13(id + 1.7)), rr = 0.2 + 0.12 * h13(id + 6.1);
      float d = length(f - (vec3(h13(id + 2.1), h13(id + 4.3), h13(id + 8.8)) - 0.5) * 0.35) + (vn3(P * 60.0) - 0.5) * 0.08;
      float patch2 = on * smoothstep(rr, rr - 0.05, d);
      return vec4(patch2, patch2 * (0.45 + 0.4 * vn3(P * 140.0)), patch2 * 0.35, 0.0) * m;
    }
    if (uLesK < 4.5) {                                   // ticks: small dark bodies clustered on thin skin
      vec3 q = P * 110.0, id = floor(q), f = fract(q) - 0.5;
      float on = step(0.84, h13(id + 4.4)) * smoothstep(0.3, 0.55, vn3(P * 9.0));
      float t = on * smoothstep(0.28, 0.16, length(f));
      return vec4(0.0, t, t * 1.4, 0.0) * m;
    }
    if (uLesK < 5.5) {                                   // sore, cracked pads: raw patches and deep fissures
      float c = smoothstep(0.5, 0.68, vn3(P * 30.0));
      float cr = smoothstep(0.035, 0.0, abs(vn3(P * 55.0) - 0.5));
      return vec4(0.0, cr * 0.6, c * 0.4 - cr * 0.6, max(c, cr)) * m;
    }
    return vec4(0.0, 0.0, 0.0, 0.8) * m;                 // reddening (inflamed udder skin)
  }`;
const HEAT_GLSL = `
  vec3 heatPal(float t){ t = clamp(t, 0.0, 1.0);
    vec3 c0 = vec3(0.02,0.01,0.09), c1 = vec3(0.16,0.02,0.33), c2 = vec3(0.55,0.06,0.33),
         c3 = vec3(0.9,0.27,0.12), c4 = vec3(1.0,0.62,0.12), c5 = vec3(1.0,0.95,0.7);
    float s = t * 5.0;
    if (s < 1.0) return mix(c0, c1, s); if (s < 2.0) return mix(c1, c2, s - 1.0);
    if (s < 3.0) return mix(c2, c3, s - 2.0); if (s < 4.0) return mix(c3, c4, s - 3.0); return mix(c4, c5, s - 4.0); }`;

/* uniforms shared by every camel material (one camel on screen at a time) */
const CU = {
  uTime: { value: 0 }, uSunV: { value: new THREE.Vector3(0, 1, 0) }, uSunCol: { value: new THREE.Color(1, 1, 1) }, uSunI: { value: 1 },
  uHL: { value: Array.from({ length: 20 }, () => new THREE.Vector3()) }, uHLCol: { value: new THREE.Color('#ffb347') },
  uPeel: { value: new THREE.Vector4(0, -99, 0, 0) }, uDust: { value: 0 }, uCoat: { value: 1 }, uGrey: { value: 0 },
  uTb: { value: 37 }, uTair: { value: 30 }, uTmin: { value: 0 }, uTmax: { value: 50 }, uSolar: { value: 0 }, uSunW: { value: new THREE.Vector3(0, 1, 0) },
  uFurLen: { value: 0.012 }, uBumpS: { value: 1 }, uXray: { value: 1 }, uLeg: { value: 1 }, uInvExpo: { value: .3 }, uThin: { value: 0 }, uSB: { value: 1 }, uLesK: { value: 0 }, uLesReg: { value: new Array(20).fill(0) }, uMale: { value: 0 },
};

function camelMaterials() {
  const common = (sh, extraV = '', extraF = '') => {
    Object.assign(sh.uniforms, CU);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        attribute float hair; attribute float thin; attribute float region; attribute float vao;
        varying float vHair, vThin, vRegion, vAO; varying vec3 vRest, vRestN, vWorld;
        uniform float uShell, uFurLen, uCoat;
        ${GLSL_NOISE3}
        ${extraV}`)
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
        vec3 restN = normalize(objectNormal);`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vRest = position; vRestN = restN; vHair = hair; vThin = thin; vRegion = region; vAO = vao;`)
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
        vWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying float vHair, vThin, vRegion, vAO; varying vec3 vRest, vRestN, vWorld;
        uniform float uTime, uSunI, uDust, uCoat, uGrey, uBumpS, uInvExpo, uThin, uSB, uLeg; uniform vec3 uSunV, uSunCol, uHLCol; uniform vec4 uPeel; uniform vec3 uHL[20];
        ${GLSL_NOISE3}
        ${GLSL_BUMP}
        ${LES_GLSL}
        ${extraF}
        vec3 regionHL(){ int r = int(vRegion + 0.5); vec3 h = vec3(0.0);
          for (int i = 0; i < 20; i++) if (i == r) h = uHL[i];
          return h; }`)
      .replace('void main() {', `void main() {
        if (uPeel.w > 0.0 && distance(vWorld, uPeel.xyz) < uPeel.w) discard;`);
  };

  /* coat & skin: physically based, with procedural hair streaks and derivative bump */
  const skin = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .82, metalness: 0, sheen: .6, sheenRoughness: .55, sheenColor: new THREE.Color('#e8c99a'), specularIntensity: .45, side: THREE.DoubleSide, clippingPlanes: ANAT.clip, shadowSide: THREE.FrontSide });
  skin.onBeforeCompile = sh => {
    common(sh);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec3 n0 = normalize(vRestN), fl = flowDir(n0), bt = normalize(cross(n0, fl));
        float hairy = clamp(vHair, 0.0, 2.2);
        int rg = int(vRegion + 0.5);
        bool isLeg = rg == 4 || rg == 5 || rg == 14 || rg == 15, isFoot = rg == 6 || rg == 16, isPad = rg == 7 || rg == 17;
        vec3 P = vRest / max(uSB, 0.01);
        float yL = vRest.y / max(uLeg, 0.01);
        // hair: fine streaks along the flow, coarser clumps where the coat is long (hump, crest, throat)
        float coarse = smoothstep(1.0, 2.0, hairy);
        float streak = vn3(vec3(dot(vRest, bt) * mix(900.0, 420.0, coarse), dot(vRest, fl) * mix(70.0, 34.0, coarse), dot(vRest, n0) * 300.0));
        float clump = vn3(vRest * mix(38.0, 22.0, coarse) + vec3(dot(vRest, fl) * 20.0));
        float patchy = vn3(vRest * 6.0) * 0.6 + vn3(vRest * 17.0) * 0.4;
        vec3 base = diffuseColor.rgb;
        float tuft = vn3(vec3(dot(vRest, bt) * 70.0, dot(vRest, fl) * 26.0, dot(vRest, n0) * 70.0));
        float shed = smoothstep(0.62, 0.78, vn3(vRest * 4.5 + 3.0)) * smoothstep(0.4, 1.2, hairy);
        base *= mix(1.0, 0.78 + 0.36 * streak, clamp(hairy, 0.45, 1.0));
        base *= 0.88 + 0.24 * patchy;
        base *= mix(1.0, 0.8 + 0.4 * tuft, min(hairy, 1.0) * 0.8);
        base = mix(base, base * vec3(1.16, 1.09, 0.97), smoothstep(0.55, 0.9, clump) * min(hairy, 1.0) * 0.7);
        base = mix(base, base * vec3(0.8, 0.74, 0.7), shed * 0.45);
        // countershading: sun-bleached, darker back; paler belly and inner legs
        base *= mix(1.0, 0.88, smoothstep(1.75, 2.1, P.y) * (1.0 - step(0.5, float(isLeg))));
        base = mix(base, base * vec3(1.16, 1.12, 1.06), smoothstep(-0.2, -0.75, n0.y) * 0.6);
        // lower legs: dust caked on the short hair, heaviest round the fetlocks
        float dustLeg = (isLeg || isFoot) ? smoothstep(0.7, 0.2, yL) * (0.55 + 0.45 * vn3(vRest * 24.0)) : 0.0;
        base = mix(base, vec3(0.6, 0.47, 0.34) * (0.9 + 0.2 * streak), dustLeg * 0.3);
        // calluses: bare, grey, cracked skin
        float cells = 0.0;
        if (isPad) {
          vec3 q = vRest * 90.0, id = floor(q), f = fract(q); float d1 = 1.0, d2 = 1.0;
          for (int k = 0; k < 8; k++) { vec3 o = vec3(float(k & 1), float((k >> 1) & 1), float((k >> 2) & 1)); vec3 r = o + vec3(h13(id + o), h13(id + o + 7.1), h13(id + o + 3.7)) - f; float d = dot(r, r); if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
          cells = 1.0 - smoothstep(0.0, 0.06, sqrt(d2) - sqrt(d1));
          base *= (0.9 + 0.2 * vn3(vRest * 40.0)) * (1.0 - 0.35 * cells);
        }
        if (isFoot) base *= 0.92 + 0.12 * vn3(vRest * 60.0);
        float greyZone = max(1.0 - step(0.5, abs(vRegion - 11.0)), 0.5 * (1.0 - step(0.5, abs(vRegion - 10.0))));
        base = mix(base, vec3(dot(base, vec3(.3,.59,.11))) * vec3(1.05, 1.03, 1.0) * 1.15, uGrey * greyZone * 0.75);
        base = mix(base, vec3(0.62, 0.5, 0.36), uDust * smoothstep(0.1, 0.9, n0.y) * 0.55);
        if (uMale > 0.5 && rg == 9) base = mix(base, vec3(0.6, 0.45, 0.31), 0.6);
        vec4 les = lesion(vRest);
        base = mix(base, vec3(0.42, 0.35, 0.3) * (0.85 + 0.3 * streak), les.x * 0.5);             // bare, greyish skin
        vec3 crust = uLesK < 1.5 ? vec3(0.34, 0.29, 0.26) : uLesK < 2.5 ? vec3(0.2, 0.13, 0.1) : uLesK < 3.5 ? vec3(0.6, 0.56, 0.5) : uLesK < 4.5 ? vec3(0.16, 0.12, 0.1) : vec3(0.22, 0.12, 0.1);
        base = mix(base, crust, les.y * 0.8);
        base = mix(base, vec3(0.66, 0.26, 0.22), les.w * 0.55);
        diffuseColor.rgb = gl_FrontFacing ? base : vec3(0.5, 0.13, 0.1);
        // relief drawn by hand: ribs under the flank, folds of loose skin on the neck, creases at the knee, tendons
        float hH = streak * 0.35 * max(min(hairy, 1.0), 0.5) + clump * 0.45 + tuft * 0.8 * min(hairy, 1.0) - shed * 0.5;
        float relief = (vn3(vRest * 260.0) - 0.5) * (1.0 - min(hairy, 1.0)) * 0.9;
        if (rg == 0 || rg == 13) {
          float rib = sin((P.x + (P.y - 1.2) * 0.32) / 0.093 * 6.2831) * 0.5 + 0.5;
          float m = smoothstep(0.1, 0.27, abs(P.z)) * smoothstep(1.02, 1.32, P.y) * smoothstep(1.72, 1.44, P.y) * smoothstep(-0.4, -0.1, P.x) * smoothstep(0.56, 0.26, P.x);
          relief += rib * m * mix(0.35, 1.4, uThin);
        }
        if (rg == 2) {
          float fold = sin(P.x / 0.047 * 6.2831 + vn3(vRest * 9.0) * 5.0) * 0.5 + 0.5;
          float m = smoothstep(0.15, -0.35, n0.y) * smoothstep(0.62, 0.75, P.x) * smoothstep(1.42, 1.25, P.x);
          relief += pow(fold, 3.0) * m * 1.3;
        }
        if (isLeg) {
          float knee = smoothstep(0.06, 0.0, abs(yL - 0.66)) + smoothstep(0.05, 0.0, abs(yL - 0.2)) * 0.7;
          relief += pow(sin(yL / 0.011 * 6.2831) * 0.5 + 0.5, 2.0) * knee * smoothstep(0.1, 0.5, abs(n0.x)) * 0.8;
          // the groove between the cannon bone and the flexor tendons behind it
          float fore = (rg == 4 || rg == 14) ? 1.0 : 0.0;
          float tt = clamp((yL - 0.19) / 0.42, 0.0, 1.0);
          float ax = mix(mix(-0.565, -0.6, tt) - 0.012, mix(0.64, 0.632, tt) - 0.017, fore);
          float cannon = smoothstep(0.2, 0.26, yL) * smoothstep(0.6, 0.54, yL);
          relief -= exp(-pow((vRest.x - ax) / 0.0055, 2.0)) * cannon * smoothstep(0.3, 0.7, abs(n0.z)) * 1.6;
          relief += (vn3(vec3(vRest.x * 160.0, vRest.y * 8.0, vRest.z * 160.0)) - 0.5) * smoothstep(0.55, 0.3, yL) * 0.4;
        }
        if (isPad) relief -= cells * 0.8;
        hH += relief * 1.6 + les.z * 2.2;`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        {
          float wet = (rg == 11) ? smoothstep(0.45, 0.52, vRest.x / max(uSB, 0.01) - 1.1) : 0.0;
          roughnessFactor = mix(0.55, 0.88, clamp(vHair * 1.4, 0.0, 1.0)) - vThin * 0.05;
          roughnessFactor = isPad ? 0.93 : roughnessFactor;
          roughnessFactor = mix(roughnessFactor, 0.93, dustLeg * 0.6);
          roughnessFactor = mix(roughnessFactor, 0.62, wet * (1.0 - step(0.3, vHair)));
          roughnessFactor = mix(roughnessFactor, 0.95, max(les.x, les.y));
        }`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        {
          float fade = uBumpS * (1.0 - smoothstep(0.004, 0.02, length(fwidth(vRest))));
          vec2 dh = vec2(dFdx(hH), dFdy(hH)) * 0.0016 * fade;
          normal = bumpN(-vViewPosition, normal, dh, faceDirection);
        }`)
      .replace('#include <lights_physical_fragment>', `#include <lights_physical_fragment>
        #ifdef USE_SHEEN
          material.sheenColor *= clamp(vHair, 0.0, 1.0);
        #endif`)
      .replace('#include <aomap_fragment>', `#include <aomap_fragment>
        reflectedLight.indirectDiffuse *= vAO; reflectedLight.indirectSpecular *= vAO;
        reflectedLight.directDiffuse *= mix(1.0, vAO, 0.35);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        {
          float back = pow(max(dot(normalize(vViewPosition), -uSunV) * 0.5 + 0.5, 0.0), 3.0);
          float sssW = (1.0 - step(0.5, abs(vRegion - 12.0))) * 0.1;
          totalEmissiveRadiance += vec3(0.9, 0.28, 0.12) * uSunCol * uSunI * vThin * back * 0.18 * sssW;
          vec3 hl = regionHL();
          float fr = pow(1.0 - abs(dot(normalize(vViewPosition), normal)), 2.0);
          totalEmissiveRadiance += hl * (0.12 + 0.55 * fr) * (0.85 + 0.15 * sin(uTime * 3.0)) * uInvExpo;
        }`);
  };

  /* fur shells: the same skinned surface pushed out along its rest normal, strands carved by alpha test */
  const shell = n => {
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .92, metalness: 0, clippingPlanes: ANAT.clip });
    m.userData.layer = n;
    m.onBeforeCompile = sh => {
      sh.uniforms.uShell = { value: n };
      common(sh);
      sh.vertexShader = sh.vertexShader.replace('#include <skinning_vertex>', `
        {
          float len = uFurLen * uCoat * max(vHair, 0.0);
          vec3 fl = flowDir(restN);
          transformed += (restN * 0.85 + fl * 0.55 * uShell) * uShell * len;
        }
        #include <skinning_vertex>`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uShell;')
        .replace('#include <color_fragment>', `#include <color_fragment>
          {
            if (vHair < 0.12) discard;
            { vec4 ls = lesion(vRest); if (ls.x > 0.35 || ls.y > 0.5) discard; }
            vec3 fl = flowDir(normalize(vRestN)), n0 = normalize(vRestN), bt = normalize(cross(n0, fl));
            float coarse = smoothstep(1.0, 2.0, vHair);
            vec3 q = vec3(dot(vRest, bt) * mix(520.0, 300.0, coarse), dot(vRest, fl) * mix(150.0, 80.0, coarse), dot(vRest, n0) * mix(520.0, 300.0, coarse));
            vec3 cell = floor(q), f = fract(q) - 0.5;
            float r = h13(cell), len = 0.35 + 0.65 * r;
            float px = length(fwidth(vRest));                       // strands smaller than a pixel only sparkle: fade the shells out
            if (h13(cell + 7.0) < smoothstep(0.0022, 0.0055, px)) discard;
            float thick = (1.0 - uShell / len) * 0.5;
            if (uShell > len || length(f.xz) > thick || vn3(vRest * 70.0) < 0.18 * uShell) discard;
            float coat = mix(0.6, 0.98, uShell) * (0.86 + 0.26 * r);
            diffuseColor.rgb *= coat;
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.62, 0.5, 0.36), uDust * uShell * 0.6);
          }`)
        .replace('#include <aomap_fragment>', `#include <aomap_fragment>
          reflectedLight.indirectDiffuse *= mix(vAO, 1.0, uShell * 0.6); reflectedLight.directDiffuse *= mix(0.55, 1.0, uShell);`);
    };
    m.customProgramCacheKey = () => 'shell';
    return m;
  };

  /* muscle layer: same surface, read as the muscles under the skin */
  const muscle = new THREE.MeshStandardMaterial({ roughness: .55, metalness: 0, color: '#ffffff', side: THREE.DoubleSide, clippingPlanes: ANAT.clip, shadowSide: THREE.FrontSide });
  muscle.onBeforeCompile = sh => {
    common(sh);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec3 fl = flowDir(normalize(vRestN)), bt = normalize(cross(normalize(vRestN), fl));
        int rg = int(vRegion + 0.5);
        float fib = vn3(vec3(dot(vRest, bt) * 260.0, dot(vRest, fl) * 12.0, 0.0));
        float sheet = smoothstep(0.35, 0.75, vn3(vRest * 9.0));
        vec3 red = mix(vec3(0.42, 0.08, 0.07), vec3(0.62, 0.16, 0.12), fib);
        vec3 tendon = vec3(0.86, 0.8, 0.72) * (0.9 + 0.1 * fib);
        vec3 fat = vec3(0.93, 0.8, 0.52);
        vec3 c = red;
        if (rg == 6 || rg == 7 || rg == 16 || rg == 17) c = vec3(0.35, 0.3, 0.27);                    // feet and pads: horn and callus
        if (rg == 3) c = mix(fat, fat * 0.9, fib);                            // hump: fat, not muscle
        float lowleg = (rg == 4 || rg == 5 || rg == 14 || rg == 15) ? smoothstep(0.75, 0.55, vWorld.y / max(uLeg, 0.01)) : 0.0;
        c = mix(c, tendon, max(lowleg, sheet * 0.12));
        diffuseColor.rgb = gl_FrontFacing ? c : vec3(0.45, 0.1, 0.08);
        float hH = fib;`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        normal = bumpN(-vViewPosition, normal, vec2(dFdx(hH), dFdy(hH)) * 0.0025, faceDirection);`)
      .replace('#include <aomap_fragment>', `#include <aomap_fragment>
        reflectedLight.indirectDiffuse *= vAO;`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        totalEmissiveRadiance += regionHL() * 0.35 * uInvExpo;`);

  };

  /* x-ray ghost: a fresnel veil so the organs and skeleton read through the body */
  const xray = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, color: '#ffffff', clippingPlanes: ANAT.clip });
  xray.onBeforeCompile = sh => {
    common(sh, '', 'uniform float uXray;');
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vNV; varying vec3 vVV;')
      .replace('#include <fog_vertex>', `#include <fog_vertex>
        vNV = normalize(normalMatrix * objectNormal); vVV = -mvPosition.xyz;`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vNV; varying vec3 vVV;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        float f = 1.0 - abs(dot(normalize(vNV), normalize(vVV)));
        float a = (0.06 + pow(f, 2.0) * 0.72) * uXray;
        diffuseColor = vec4(mix(vec3(0.55, 0.72, 0.95), vec3(1.0, 0.93, 0.8), f) * (0.4 + 0.6 * f), a);
        vec3 hl = regionHL(); diffuseColor.rgb += hl * 0.5; diffuseColor.a += max(hl.r, max(hl.g, hl.b)) * 0.12 * uXray;
        diffuseColor.rgb *= uInvExpo;`);
    sh.uniforms.uXray = CU.uXray;
  };

  /* thermal camera: surface temperature from body core, coat insulation and sunlight */
  const thermal = new THREE.MeshBasicMaterial({ color: '#ffffff', fog: false });
  thermal.onBeforeCompile = sh => {
    common(sh, '', `uniform float uTb, uTair, uTmin, uTmax, uSolar; uniform vec3 uSunW; ${HEAT_GLSL}`);
    Object.assign(sh.uniforms, { uTb: CU.uTb, uTair: CU.uTair, uTmin: CU.uTmin, uTmax: CU.uTmax, uSolar: CU.uSolar, uSunW: CU.uSunW });
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vNW;')
      .replace('#include <fog_vertex>', `#include <fog_vertex>
        vNW = normalize(mat3(modelMatrix) * objectNormal);`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vNW;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        float ins = clamp(vHair / 1.4, 0.0, 1.0);
        float sun = max(dot(normalize(vNW), uSunW), 0.0);
        float T = mix(uTb - 0.6, uTair, ins * 0.55) + uSolar * sun * (0.25 + ins);
        T += (vn3(vRest * 40.0) - 0.5) * 0.5;
        float tn = clamp((T - uTmin) / (uTmax - uTmin), 0.0, 0.985);
        diffuseColor.rgb = vec3(-log(1.0 - tn) / 1.6) * uInvExpo;   // decoded by the thermal pass: 1 - exp(-1.6 l · exposure) = tn`);
  };
  thermal.toneMapped = false;
  return { skin, shell, muscle, xray, thermal };
}

/* ─────────── eye texture: very dark brown iris, horizontal oval pupil ─────────── */
function eyeTexture() {
  const W = 512, H = 256, c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'), img = x.createImageData(W, H), d = img.data;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const u = i / W * TAU, v = j / H;                     // v = 0 at the front pole
    const ax = .19, ay = .095, rp = ax * ay / Math.sqrt(sq(ay * Math.cos(u)) + sq(ax * Math.sin(u)));
    const ri = .56;
    let r, g, b;
    if (v < rp) { r = 6; g = 5; b = 5; }
    else if (v < ri) {
      const t = (v - rp) / (ri - rp), st = .5 + .5 * Math.sin(u * 70 + Math.sin(u * 13) * 3) * Math.sin(u * 23 + t * 6);
      const L = 9 + 14 * t + 12 * st * (1 - t);
      r = L * 1.35; g = L * .95; b = L * .7;
      if (t > .88) { const e = (t - .88) / .12; r *= 1 - e * .6; g *= 1 - e * .6; b *= 1 - e * .6; }
    } else { const t = (v - ri) / (1 - ri); r = 150 - 60 * t; g = 128 - 55 * t; b = 110 - 45 * t; }
    const o = (j * W + i) * 4; d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

export { GLSL_NOISE3, CU, camelMaterials, eyeTexture };
