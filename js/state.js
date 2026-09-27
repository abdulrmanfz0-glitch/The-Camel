import { wrap24 } from './app.js';

/* ─────────────────────────── numbers in two scripts ─────────────────────────── */
const AR_D = '٠١٢٣٤٥٦٧٨٩';
let LANG = 'ar';
try { if (localStorage.getItem('camel-lang') === 'en') LANG = 'en'; } catch (e) { /* storage blocked */ }
try { const l = new URLSearchParams(location.search).get('lang'); if (l === 'en' || l === 'ar') LANG = l; } catch (e) { /* no URL */ }
function num(n, dec = 0) {
  let s = Math.abs(n).toFixed(dec);
  if (n < 0 && Number(s) !== 0) s = '−' + s;
  if (LANG === 'ar') s = s.replace(/\d/g, d => AR_D[d]).replace('.', '٫');
  return s;
}
const digits = s => LANG === 'ar' ? String(s).replace(/\d/g, d => AR_D[d]) : String(s);
function pct(n, dec = 0) { return num(n, dec) + (LANG === 'ar' ? '٪' : '%'); }
function clock(h) {
  const x = wrap24(h), hh = Math.floor(x), mm = Math.floor((x - hh) * 60);
  return digits(String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0'));
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ─────────────────────────── state ─────────────────────────── */
const STATE = {
  chapter: 'home',
  hour: 16.6, season: 'summer', playing: false,
  loss: 4, hump: 85,
  stage: 'adult', sex: 'f',
  layer: 'skin',             // skin | muscle | organs | skeleton | thermal
  section: 0, explode: 0, peel: false,
  gait: 'stand', speed: 1, slow: false,
  action: null,              // couch | rise | drink | storm
  couched: false,
  storm: 0, drink: null,
  selected: null,            // id of the focused organ / disease / topic
  ui: true,
};
const BUS = (() => { const m = new Map(); return { on(k, f) { (m.get(k) || m.set(k, []).get(k)).push(f); }, emit(k, v) { (m.get(k) || []).forEach(f => f(v)); } }; })();

/* ════════════════════════════════════════════════════════════════
   content I — interface strings, chapters, anatomy, movement, climate
   Every string is { ar, en }. Arabic is the primary text.
   ════════════════════════════════════════════════════════════════ */
const L = (ar, en) => ({ ar, en });
const tt = x => x == null ? '' : typeof x === 'string' ? x : (x[LANG] != null ? x[LANG] : x.ar);

function setLANG(v) { LANG = v; }

export { LANG, num, digits, pct, clock, esc, STATE, BUS, L, tt, setLANG };
