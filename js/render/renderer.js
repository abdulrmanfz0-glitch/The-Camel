import { Q, THREE } from '../app.js';

/* ════════════════════════════════════════════════════════════════
   engine: renderer, HDR post pipeline, sky + image-based light, camera
   ════════════════════════════════════════════════════════════════ */
const V3 = THREE.Vector3;
let renderer, scene, camera, post, sky, rig;
const lin = hex => new THREE.Color(hex);                           // three r170 converts sRGB hex to linear
const srgbArr = hex => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };   // linear triplet

function makeRenderer(canvas) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', alpha: false, stencil: false, depth: true });
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, Q.dpr));
  r.shadowMap.enabled = true;
  r.shadowMap.type = THREE.PCFSoftShadowMap;
  r.toneMapping = THREE.NoToneMapping;
  r.localClippingEnabled = true;
  r.setClearColor(0x0b1524, 1);
  return r;
}

/* sun shadows with physical penumbrae: the sun is a ~0.5° disc (a little wider through dust), so a shadow's
   soft edge grows with the gap between caster and receiver — crisp at the pads, softer under the belly.
   Percentage-closer soft shadows for an orthographic light, patched into three's shadow chunk.            */
const SUN_SHADOW = { half: 3.8, near: .5, far: 40 };
function patchSunShadows() {
  if (THREE.ShaderChunk.__sunPCSS) return;
  const W = SUN_SHADOW.half * 2, D = SUN_SHADOW.far - SUN_SHADOW.near;
  let sh = THREE.ShaderChunk.shadowmap_pars_fragment;
  const fn = `
    #define SUN_PCSS_ON
    #define SUN_N 16
    vec2 sunTap(int i, float rot){ float r = sqrt((float(i) + 0.5) / float(SUN_N)); float a = float(i) * 2.39996323 + rot; return vec2(cos(a), sin(a)) * r; }
    float sunPCSS(sampler2D map, vec2 mapSize, vec2 uv, float z){
      float texel = 1.0 / mapSize.x;
      float rot = 6.2831853 * fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
      float search = 14.0 * texel * (mapSize.x / 2048.0), bz = 0.0, nb = 0.0;
      for (int i = 0; i < SUN_N; i++) { float dz = unpackRGBAToDepth(texture2D(map, uv + sunTap(i, rot) * search)); if (dz < z) { bz += dz; nb += 1.0; } }
      if (nb < 0.5) return 1.0;
      bz /= nb;
      float pen = (z - bz) * ${D.toFixed(3)} * 0.0125 / ${W.toFixed(3)};
      float rad = clamp(pen, 1.25 * texel, search);
      float s = 0.0;
      for (int i = 0; i < SUN_N; i++) s += step(z, unpackRGBAToDepth(texture2D(map, uv + sunTap(i, rot + 1.7) * rad)));
      return s / float(SUN_N);
    }`;
  sh = sh.replace('#ifdef USE_SHADOWMAP', '#ifdef USE_SHADOWMAP' + fn);
  sh = sh.replace('#if defined( SHADOWMAP_TYPE_PCF )', '#if defined( SUN_PCSS_ON )\n\t\t\tshadow = sunPCSS( shadowMap, shadowMapSize, shadowCoord.xy, shadowCoord.z );\n\t\t#elif defined( SHADOWMAP_TYPE_PCF )');
  THREE.ShaderChunk.shadowmap_pars_fragment = sh;
  THREE.ShaderChunk.__sunPCSS = true;
}

function setRenderer(v) { renderer = v; }
function setScene(v) { scene = v; }
function setCamera(v) { camera = v; }
function setPost(v) { post = v; }
function setSky(v) { sky = v; }
function setRig(v) { rig = v; }

export { V3, renderer, scene, camera, post, sky, rig, makeRenderer, SUN_SHADOW, patchSunShadows, setRenderer,
  setScene, setCamera, setPost, setSky, setRig };
