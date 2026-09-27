/* ════════════════════════════════════════════════════════════════
   هندسة الناقة v2 — core: helpers, quality tiers, physiology model, state
   ════════════════════════════════════════════════════════════════ */
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const sq = x => x * x;
const lerp = (a, b, t) => a + (b - a) * t;
const inv = (a, b, x) => clamp((x - a) / (b - a), 0, 1);
const smooth = (a, b, x) => { const t = inv(a, b, x); return t * t * (3 - 2 * t); };
const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeIn = t => t * t * t;
const wrap24 = h => ((h % 24) + 24) % 24;
const wrap1 = x => x - Math.floor(x);
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));

function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function hash2(x, y) { return hash(x * 12.9898 + y * 78.233); }
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return lerp(lerp(a, b, u), lerp(c, d, u), v) * 2 - 1;
}
function fbm(x, y, o = 4) { let s = 0, a = .5, f = 1; for (let i = 0; i < o; i++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= .5; } return s; }
const rng = seed => { let s = seed >>> 0 || 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; };

/* ─────────────────────────── environment & quality tiers ─────────────────────────── */
const ENV = {
  mobile: matchMedia('(max-width: 760px)').matches || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent),
  touch: matchMedia('(pointer: coarse)').matches,
  reduce: matchMedia('(prefers-reduced-motion: reduce)').matches,
};
try { matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', e => { ENV.reduce = e.matches; }); } catch (e) { /* old Safari */ }
const TIERS = {
  low: { name: 'low', dpr: 1, msaa: 0, ssao: false, shells: 0, shadow: 1024, sdf: 0, terrain: .55, bloom: true, plants: .5, dof: false },
  medium: { name: 'medium', dpr: 1.5, msaa: 4, ssao: true, shells: 7, shadow: 2048, sdf: 1, terrain: .8, bloom: true, plants: .8, dof: true },
  high: { name: 'high', dpr: 2, msaa: 4, ssao: true, shells: 14, shadow: 2048, sdf: 1, terrain: 1, bloom: true, plants: 1, dof: true },
};
function pickTier() {
  let forced = null;
  try { forced = new URLSearchParams(location.search).get('q'); } catch (e) { /* no URL */ }
  if (forced && TIERS[forced]) return forced;
  try { const s = localStorage.getItem('camel-q'); if (s && TIERS[s]) return s; } catch (e) { /* storage blocked */ }
  const cores = navigator.hardwareConcurrency || 4, mem = navigator.deviceMemory || 8;
  if (ENV.mobile) return cores >= 8 && mem >= 6 ? 'medium' : 'low';
  return cores >= 8 ? 'high' : 'medium';
}
let Q = Object.assign({}, TIERS[pickTier()]);

export { $, $$, clamp, sq, lerp, smooth, easeInOut, easeOut, wrap24, wrap1, TAU, DEG, damp, hash, vnoise,
  fbm, rng, ENV, Q };
