import { clamp, DEG, easeInOut, ENV, focalFor, fovFor, lerp, TAU, V3 } from '../app.js';

/* ─────────── camera rig with auto-fit into the free part of the screen ─────────── */
class Rig {
  constructor(cam, el) {
    this.cam = cam; this.el = el;
    this.target = new V3(0, 1, 1.9); this.r = 9; this.theta = -.55; this.phi = 1.2;
    this.v = { th: 0, ph: 0 }; this.fly = null; this.ptrs = new Map(); this.moved = 0;
    this.limits = { rMin: .9, rMax: 20, phMin: .14, phMax: 1.56 };
    this.follow = null; this.onTap = null; this.userMoved = 0;
    el.addEventListener('pointerdown', e => this.down(e));
    el.addEventListener('pointermove', e => this.move(e));
    el.addEventListener('pointerup', e => this.up(e));
    el.addEventListener('pointercancel', e => this.up(e));
    el.addEventListener('wheel', e => { e.preventDefault(); this.fly = null; this.userMoved = performance.now(); this.r = clamp(this.r * Math.exp(e.deltaY * .0011), this.limits.rMin, this.limits.rMax); }, { passive: false });
    el.addEventListener('contextmenu', e => e.preventDefault());
  }
  down(e) {
    try { this.el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    this.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    this.moved = 0; this.pan = e.button === 2 || e.shiftKey; this.pinch0 = null;
    this.el.classList.add('dragging');
  }
  move(e) {
    const p = this.ptrs.get(e.pointerId); if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    this.moved += Math.abs(dx) + Math.abs(dy);
    if (this.moved > 4) { this.fly = null; this.userMoved = performance.now(); }
    if (this.ptrs.size === 2) {
      const [a, b] = [...this.ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (this.pinch0) { this.r = clamp(this.r * this.pinch0 / Math.max(d, 1), this.limits.rMin, this.limits.rMax); this.panBy(dx * .5, dy * .5); }
      this.pinch0 = d; return;
    }
    if (this.pan) { this.panBy(dx, dy); return; }
    this.v.th = -dx * .006; this.v.ph = -dy * .006;
    this.theta += this.v.th; this.phi = clamp(this.phi + this.v.ph, this.limits.phMin, this.limits.phMax);
  }
  up(e) {
    const p = this.ptrs.get(e.pointerId); this.ptrs.delete(e.pointerId);
    if (this.ptrs.size < 2) this.pinch0 = null;
    if (!this.ptrs.size) this.el.classList.remove('dragging');
    if (p && this.moved < 6 && this.onTap && e.type === 'pointerup') this.onTap(e);
  }
  panBy(dx, dy) {
    const s = 2 * this.r * Math.tan(this.cam.fov * DEG / 2) / (this.el.clientHeight || 800);
    const right = new V3().setFromMatrixColumn(this.cam.matrixWorld, 0), up = new V3().setFromMatrixColumn(this.cam.matrixWorld, 1);
    this.target.addScaledVector(right, -dx * s).addScaledVector(up, dy * s);
    const xz = Math.hypot(this.target.x, this.target.z);
    if (xz > 4.2) { this.target.x *= 4.2 / xz; this.target.z *= 4.2 / xz; }
    this.target.y = clamp(this.target.y, .05, 3);
  }
  flyTo(goal, dur = 1.6) {
    let dth = goal.theta - this.theta; dth = ((dth + Math.PI) % TAU + TAU) % TAU - Math.PI;
    this.fly = { t: 0, dur: ENV.reduce ? .001 : dur, from: this.state, to: { target: goal.target.clone(), r: goal.r, theta: this.theta + dth, phi: goal.phi } };
    this.v.th = this.v.ph = 0;
  }
  get state() { return { target: this.target.clone(), r: this.r, theta: this.theta, phi: this.phi }; }
  update(dt) {
    if (this.fly) {
      const f = this.fly; f.t = Math.min(1, f.t + dt / f.dur);
      const e = easeInOut(f.t);
      this.target.lerpVectors(f.from.target, f.to.target, e);
      this.r = lerp(f.from.r, f.to.r, e) + Math.sin(Math.PI * e) * Math.min(1.1, Math.abs(f.to.r - f.from.r) * .12 + .15);
      this.theta = lerp(f.from.theta, f.to.theta, e); this.phi = lerp(f.from.phi, f.to.phi, e);
      if (f.t >= 1) this.fly = null;
    } else if (!this.ptrs.size) {
      const damp = Math.pow(.0009, dt);
      this.v.th *= damp; this.v.ph *= damp;
      if (Math.abs(this.v.th) > 1e-5 || Math.abs(this.v.ph) > 1e-5) { this.theta += this.v.th; this.phi = clamp(this.phi + this.v.ph, this.limits.phMin, this.limits.phMax); }
    }
    if (this.follow && !this.fly) this.target.lerp(this.follow(), 1 - Math.pow(.02, dt));
    const sp = Math.sin(this.phi);
    this.cam.position.set(this.target.x + this.r * sp * Math.sin(this.theta), this.target.y + this.r * Math.cos(this.phi), this.target.z + this.r * sp * Math.cos(this.theta));
    this.cam.lookAt(this.target);
    this.focal = focalFor(this.r);
    const fov = fovFor(this.focal, this.cam.aspect);
    if (Math.abs(fov - this.cam.fov) > 1e-3) { this.cam.fov = fov; this.cam.updateProjectionMatrix(); }
  }
  /* distance at which a set of world points fits inside a screen rectangle (px), for a given orientation */
  fitDistance(points, rect, theta, phi, target, pad = 24) {
    const cam = this.cam.clone(), W = innerWidth, H = innerHeight;
    cam.aspect = W / H; cam.clearViewOffset(); cam.updateProjectionMatrix();
    const need = { w: Math.max(40, rect.w - 2 * pad), h: Math.max(40, rect.h - 2 * pad) };
    let lo = .6, hi = 40;
    for (let it = 0; it < 22; it++) {
      const r = (lo + hi) / 2, sp = Math.sin(phi);
      cam.position.set(target.x + r * sp * Math.sin(theta), target.y + r * Math.cos(phi), target.z + r * sp * Math.cos(theta));
      cam.lookAt(target); cam.updateMatrixWorld();
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, behind = false;
      for (const p of points) {
        const v = p.clone().applyMatrix4(cam.matrixWorldInverse); if (v.z > -.05) { behind = true; break; }
        v.applyMatrix4(cam.projectionMatrix);
        x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y);
      }
      const w = (x1 - x0) / 2 * W, h = (y1 - y0) / 2 * H;
      if (behind || w > need.w || h > need.h) lo = r; else hi = r;
    }
    return hi;
  }
}

/* ════════════════════════════════════════════════════════════════
   the desert: red dune sand with grain and wind ripples, gravel and silt
   crust in the flats, footprints that keep their shape, acacia with layered
   crowns, arfaj and thumam, varnished rocks, a far escarpment, drifting dust
   ════════════════════════════════════════════════════════════════ */

/* photographic textures — Babylon.js Assets (CC BY 4.0), re-encoded to WebP in assets/tex */

export { Rig };
