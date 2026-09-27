import { clamp, DEG, lerp, smooth, wrap24 } from '../app.js';

/* ─────────────────────────── physiology model ───────────────────────────
   Body temperature: Schmidt-Nielsen et al. 1957 — watered camels swing ≈2 °C a day;
   camels deprived of water in summer swing > 6 °C (≈34 → >40 °C). Sweating in the
   dehydrated, heterothermic camel starts near 40.5 °C. Air temperatures are an
   illustrative day, not a forecast: summer inland Arabia, and a winter day.        */
const MODEL = {
  mass: 500, cTissue: 3.5, latent: 2400, sweatOnset: 40.5,
  dry(loss) { return smooth(2, 10, loss); },
  heatLoad(season) { return season === 'winter' ? .12 : 1; },
  tMin(s, season) { return lerp(36.2, lerp(36.2, 34.2, this.heatLoad(season)), s); },
  tAmp(s, season) { const w = this.heatLoad(season); return lerp(lerp(.9, 2.0, w), lerp(1.2, 6.5, w), s); },
  bodyShape(h) {
    const x = wrap24(h - 7);
    return x <= 10.5 ? .5 - .5 * Math.cos(Math.PI * x / 10.5) : .5 + .5 * Math.cos(Math.PI * (x - 10.5) / 13.5);
  },
  airShape(h) {
    const x = wrap24(h - 5.5);
    return x <= 9.5 ? .5 - .5 * Math.cos(Math.PI * x / 9.5) : .5 + .5 * Math.cos(Math.PI * (x - 9.5) / 14.5);
  },
  tb(h, loss, season) { const s = this.dry(loss); return this.tMin(s, season) + this.tAmp(s, season) * this.bodyShape(h); },
  air(h, season) { return season === 'winter' ? 5 + 16 * this.airShape(h) : 26 + 18 * this.airShape(h); },
  sweat(h, loss, season) {
    const s = this.dry(loss), tb = this.tb(h, loss, season), a = this.air(h, season);
    const wet = (1 - s) * smooth(33, 40, a);
    const dry = s * smooth(this.sweatOnset - .25, this.sweatOnset + .2, tb);
    return clamp(wet + dry, 0, 1);
  },
  storedKJ(h, loss, season) { const s = this.dry(loss); return this.mass * this.cTissue * (this.tb(h, loss, season) - this.tMin(s, season)); },
  litres(kj) { return kj / this.latent; },
  /* an illustrative traffic light — the thresholds are teaching aids, not clinical cut-offs */
  status(st) {
    const a = this.air(st.hour, st.season), tb = this.tb(st.hour, st.loss, st.season), young = st.stage === 'newborn', old = st.stage === 'old';
    const r = [];
    let level = 0;
    if (st.season === 'summer') {
      if (a >= 40 && st.loss >= 20) { level = 2; r.push('heatDry'); }
      else if (tb >= 40.5) { level = Math.max(level, 1); r.push('tbHigh'); }
      if (st.loss >= 25) { level = 2; r.push('lossLimit'); }
      else if (st.loss >= 15) { level = Math.max(level, 1); r.push('lossHigh'); }
      if ((young || old) && a >= 40) { level = Math.max(level, 1); r.push('vulnerableHeat'); }
    } else {
      if (a <= 8 && (young || old)) { level = Math.max(level, a <= 5 ? 2 : 1); r.push('coldVulnerable'); }
      else if (a <= 6) { level = Math.max(level, 1); r.push('coldNight'); }
      if (st.loss >= 25) { level = 2; r.push('lossLimit'); } else if (st.loss >= 15) { level = Math.max(level, 1); r.push('lossHigh'); }
    }
    if (!r.length) r.push(st.season === 'winter' ? 'okWinter' : 'ok');
    return { level, reasons: r };
  },
};

/* sun direction at 24° N; summer = June solstice, winter = December solstice. World: +X east, −Z north, +Y up */
const SUN = {
  lat: 24 * DEG,
  dir(h, out, season = 'summer') {
    const dec = (season === 'winter' ? -23.4 : 23.4) * DEG;
    const H = (wrap24(h) - 12) * 15 * DEG;
    const e = -Math.cos(dec) * Math.sin(H);
    const n = Math.sin(dec) * Math.cos(this.lat) - Math.cos(dec) * Math.cos(H) * Math.sin(this.lat);
    const u = Math.sin(dec) * Math.sin(this.lat) + Math.cos(dec) * Math.cos(H) * Math.cos(this.lat);
    out.set(e, u, -n);
    return out;
  },
};

export { MODEL };
