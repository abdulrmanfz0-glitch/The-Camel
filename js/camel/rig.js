import { clamp, damp, DEG, lerp, smooth, TAU, terrainH, THREE, V3, wrap1 } from '../app.js';

const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _q3 = new THREE.Quaternion(), _e = new THREE.Euler(), _m4 = new THREE.Matrix4();
const _v1 = new V3(), _v2 = new V3(), _v3 = new V3(), _v4 = new V3(), _v5 = new V3();
const UP = new V3(0, 1, 0);

/* gaits (Dagg 1974; Alexander et al.): the camel walks in lateral sequence and paces, moving the two legs
   of one side together; it does not trot. offsets are the phase at which each foot lands (LH, LF, RH, RF). */
const GAITS = {
  walk: { stride: 1.55, speed: 1.1, duty: .66, off: { HL: 0, FL: .1, HR: .5, FR: .6 }, bob: .018, roll: 1.4, lift: .13, flex: 1 },
  pace: { stride: 2.5, speed: 2.9, duty: .47, off: { HL: 0, FL: .015, HR: .5, FR: .515 }, bob: .045, roll: 4.5, lift: .2, flex: 1.25 },
};

function rotZ(a) { return new THREE.Quaternion().setFromAxisAngle(new V3(0, 0, 1), a); }

class CamelRig {
  constructor(camel) {
    this.c = camel; const B = this.B = camel.bone;
    const R = n => B[n].userData.rest;
    this.sL = camel.spec.scale.leg; this.sB = camel.spec.scale.body;
    this.legs = {};
    for (const S of ['L', 'R']) {
      const sd = S === 'L' ? 1 : -1;
      this.legs['F' + S] = {
        key: 'F' + S, fore: true, sd, top: B['hum' + S], b1: B['hum' + S], b2: B['rad' + S], b3: B['mc' + S], b4: B['pas' + S], b5: B['toe' + S], scap: B['scap' + S],
        l1: R('hum' + S).distanceTo(R('rad' + S)), l2: R('rad' + S).distanceTo(R('mc' + S)), l3: R('mc' + S).distanceTo(R('pas' + S)),
        pastern: R('toe' + S).clone().sub(R('pas' + S)), padY: R('toe' + S).y,
        home: R('toe' + S).clone(), pole: new V3(-1, 0, 0),
      };
      this.legs['H' + S] = {
        key: 'H' + S, fore: false, sd, top: B['fem' + S], b1: B['fem' + S], b2: B['tib' + S], b3: B['mt' + S], b4: B['hpas' + S], b5: B['htoe' + S],
        l1: R('fem' + S).distanceTo(R('tib' + S)), l2: R('tib' + S).distanceTo(R('mt' + S)), l3: R('mt' + S).distanceTo(R('hpas' + S)),
        pastern: R('htoe' + S).clone().sub(R('hpas' + S)), padY: R('htoe' + S).y,
        home: R('htoe' + S).clone(), pole: new V3(1, 0, 0),
      };
    }
    for (const k in this.legs) {
      const L = this.legs[k];
      L.upDir = (L.fore ? R('mc' + k[1]).clone().sub(R('pas' + k[1])) : R('mt' + k[1]).clone().sub(R('hpas' + k[1]))).normalize();
      L.foot = new V3(); L.from = new V3(); L.to = new V3(); L.planted = true; L.load = 1; L.swing = 0; L.lastPhase = 0; L.yaw = 0;
      L.T = new V3(); L.F = new V3(); L.K = new V3(); L.toeQ = new THREE.Quaternion();
    }
    // world placement of the body
    this.pos = new V3(0, 0, 0); this.yaw = 0; this.pathR = 3.4 * Math.max(.6, this.sL); this.pathS = 0;
    this.gait = 'stand'; this.move = 0; this.speed = 0; this.phase = 0; this.timeScale = 1;
    this.couch = 0; this.couchTarget = 0;
    this.t = 0; this.blinkT = 2; this.blink = 0; this.earT = 3; this.earA = [0, 0]; this.tailT = 2; this.chew = 0; this.chewT = 5;
    this.look = { yaw: 0, pitch: 0, ty: 0, tp: 0, t: 1 };
    this.drink = 0; this.storm = 0; this.lids = 1; this.nict = 0; this.nictT = 0; this.breath = 0; this.resp = .16;
    this.onStep = null;
    this.placeFeetAtRest();
  }
  get S() { return this.sL; }
  placeFeetAtRest() {
    for (const k in this.legs) { const L = this.legs[k]; this.localToWorld(L.home, L.foot); L.foot.y = terrainH(L.foot.x, L.foot.z) + L.padY; L.planted = true; }
  }
  localToWorld(p, out) { const c = Math.cos(this.yaw), s = Math.sin(this.yaw); return out.set(this.pos.x + p.x * c + p.z * s, p.y, this.pos.z - p.x * s + p.z * c); }
  worldToLocal(p, out) { const c = Math.cos(this.yaw), s = Math.sin(this.yaw), dx = p.x - this.pos.x, dz = p.z - this.pos.z; return out.set(dx * c - dz * s, p.y, dx * s + dz * c); }
  /* body frame on the walking circle, anticlockwise seen from above; heading is the tangent */
  pathPoint(s, out) {                           // a circle through the origin; heading +X at s = 0
    const a = s / this.pathR;
    out.pos = (out.pos || new V3()).set(this.pathR * Math.sin(a), 0, this.pathR * (Math.cos(a) - 1));
    out.yaw = a;
    return out;
  }
  setGait(g) { this.gait = g; }

  /* ── main update ── */
  update(dt0, ctl) {
    const dt = dt0 * this.timeScale;
    this.t += dt;
    const B = this.B;
    // targets from controls
    const moving = (this.gait === 'walk' || this.gait === 'pace') && this.couch < .01 && !ctl.drink;
    const G = GAITS[this.gait] || GAITS.walk;
    const scale = Math.max(.55, this.sL);
    this.move = damp(this.move, moving ? 1 : 0, 2.2, dt);
    const vTarget = moving ? G.speed * scale : 0;
    this.speed = damp(this.speed, vTarget, 1.6, dt);
    this.couchTarget = ctl.couch ? 3 : 0;
    const cspd = .55;
    if (this.move < .05) this.couch = this.couch < this.couchTarget ? Math.min(this.couchTarget, this.couch + dt * cspd * 1.25) : Math.max(this.couchTarget, this.couch - dt * cspd * 1.1);
    this.drink = damp(this.drink, ctl.drink ? 1 : 0, 1.3, dt);
    this.storm = damp(this.storm, ctl.storm || 0, 1.5, dt);
    // advance along the path
    if (this.speed > .01) {
      this.pathS += this.speed * dt;
      const pp = this.pathPoint(this.pathS, {});
      this.pos.copy(pp.pos); this.yaw = pp.yaw;
      this.phase = wrap1(this.phase + this.speed / (G.stride * scale) * dt);
    }
    // reset pose
    for (const b of this.c.bones) { b.position.copy(b.userData.restPos); b.quaternion.identity(); b.scale.set(1, 1, 1); }
    const grp = this.c.group;
    grp.position.set(this.pos.x, 0, this.pos.z);
    grp.rotation.set(0, this.yaw, 0);
    grp.updateMatrixWorld(true);

    /* ── body: couching drops, gait bob and roll, breathing ── */
    const c = this.couch, S = this.sB;
    const k1 = smooth(0, 1, c), k2 = smooth(1, 2, c), k3 = smooth(2, 3, c);
    const df = (-.52 * k1 - .03 * k2 - .4 * k3) * S, dh = (-.02 * k1 - .88 * k2 - .05 * k3) * S;
    const span = .88 * S;
    const pitch = Math.atan2(df - dh, span);
    const ph = this.phase * TAU, mv = this.move;
    const bob = (G.bob * scale) * (.5 - .5 * Math.cos(2 * ph)) * mv;
    const roll = (G.roll * DEG) * Math.sin(ph) * mv * (this.gait === 'pace' ? 1 : .6);
    const sway = .025 * scale * Math.sin(ph) * mv;
    const breathF = this.resp * (1 + this.storm * .4);
    this.breath += dt * breathF * TAU;
    const br = Math.sin(this.breath);
    // weight shift while standing
    const idleSway = (1 - mv) * (1 - k1) * .012 * Math.sin(this.t * .23);
    B.root.position.y += (df + dh) / 2 - bob + (1 - mv) * .004 * br;
    B.root.position.z += sway + idleSway;
    B.root.quaternion.setFromEuler(_e.set(-roll, 0, pitch + (bob * .6), 'XYZ'));
    B.chest.scale.set(1, 1 + .012 * br, 1 + .016 * br);
    B.pelvis.quaternion.setFromEuler(_e.set(roll * .3, Math.sin(ph) * .03 * mv, 0));
    B.chest.quaternion.setFromEuler(_e.set(roll * .2, -Math.sin(ph) * .02 * mv, 0));
    B.hump.quaternion.setFromEuler(_e.set(-roll * .5 + Math.sin(ph * 2 - .6) * .01 * mv, 0, Math.sin(ph * 2 - .9) * .012 * mv));

    /* ── neck and head ── */
    this.updateHead(dt, ctl, ph, mv, k1, k2, k3);
    grp.updateMatrixWorld(true);

    /* ── legs ── */
    this.updateFeet(dt, G, scale);
    const Ck = this.couchTargets(c);
    for (const k in this.legs) this.solveLeg(this.legs[k], Ck ? Ck[k] : null, Ck ? Ck.w : 0);

    /* ── eyes, ears, tail, jaw ── */
    this.updateSmall(dt, ctl, mv);
    grp.updateMatrixWorld(true);
  }

  updateHead(dt, ctl, ph, mv, k1, k2, k3) {
    const B = this.B, L = this.look;
    // wandering gaze while idle
    L.t -= dt;
    if (L.t < 0) { L.t = 3 + Math.random() * 5; L.ty = (Math.random() - .5) * .7 * (1 - mv * .7); L.tp = (Math.random() - .45) * .25; }
    L.yaw = damp(L.yaw, L.ty, 1.2, dt); L.pitch = damp(L.pitch, L.tp, 1.2, dt);
    const dr = smooth(0, 1, this.drink), st = this.storm;
    const nod = Math.sin(ph * 2 - .8) * .05 * mv;
    const cz = k1 * .1 - k2 * .05 + k3 * .12;           // couching: the neck rises as the body goes down
    const a0 = -.04 * mv + cz - dr * .62 - st * .22 + nod * .4;
    const a1 = -.03 * mv - dr * .45 - st * .12 + nod * .5;
    const a2 = .02 + nod * .4 - dr * .28 - st * .05;
    const a3 = -dr * .12 + st * .1;
    const ah = L.pitch * .5 + dr * .95 + st * -.12 - nod * .6;
    const yaw = L.yaw * (1 - dr) * (1 - st * .6) + st * .35;
    B.neck0.quaternion.setFromEuler(_e.set(0, yaw * .15, a0));
    B.neck1.quaternion.setFromEuler(_e.set(0, yaw * .25, a1));
    B.neck2.quaternion.setFromEuler(_e.set(0, yaw * .3, a2));
    B.neck3.quaternion.setFromEuler(_e.set(0, yaw * .3, a3));
    B.head.quaternion.setFromEuler(_e.set(L.yaw * .08, 0, ah));
  }

  /* gait: feet stay planted in stance, swing on an arc to where the body will be */
  updateFeet(dt, G, scale) {
    const pp = {};
    for (const k in this.legs) {
      const L = this.legs[k];
      const off = G.off[k];
      const phi = wrap1(this.phase - off);
      const stance = phi < G.duty;
      if (this.move < .02 || this.couch > .01) {
        // standing: feet drift back under the body so the stance is square
        const home = this.localToWorld(L.home, _v1); home.y = terrainH(home.x, home.z) + L.padY;
        if (L.foot.distanceTo(home) > .05 && this.couch < .01) {
          L.swing = Math.min(1, L.swing + dt * 2.2);
          if (!L.planted || L.swing < 1) { L.planted = false; }
          L.foot.lerp(home, 1 - Math.exp(-6 * dt));
          L.foot.y = home.y + Math.sin(Math.min(1, L.swing) * Math.PI) * .05 * scale;
          if (L.foot.distanceTo(home) < .05) { L.planted = true; L.swing = 0; }
        } else { L.planted = true; L.swing = 0; }
        L.load = 1; L.phiS = 0; L.yaw = this.yaw;
        continue;
      }
      if (stance) {
        if (!L.planted) {                             // touch-down
          L.planted = true; L.foot.copy(L.to);
          if (this.onStep) this.onStep(L, L.foot, this.yaw);
        }
        L.load = Math.sin(Math.PI * phi / G.duty);
        L.swing = 0;
      } else {
        const u = (phi - G.duty) / (1 - G.duty);
        if (L.planted) {                              // lift-off: aim where the leg will be at mid-stance
          L.planted = false; L.from.copy(L.foot);
          const dphi = (1 - phi) + G.duty / 2, dts = dphi / Math.max(1e-3, this.speed / (G.stride * scale));
          this.pathPoint(this.pathS + this.speed * dts, pp);
          const c = Math.cos(pp.yaw), s = Math.sin(pp.yaw), h = L.home;
          L.to.set(pp.pos.x + h.x * c + h.z * s, 0, pp.pos.z - h.x * s + h.z * c);
          L.to.y = terrainH(L.to.x, L.to.z) + L.padY;
          L.yaw = pp.yaw;
        }
        const e = u * u * (3 - 2 * u);
        L.foot.lerpVectors(L.from, L.to, e);
        L.foot.y = lerp(L.from.y, L.to.y, e) + Math.sin(Math.PI * Math.pow(u, .8)) * G.lift * scale * (L.fore ? 1 : .8);
        L.swing = u; L.load = 0;
      }
    }
  }

  /* couching keyframes, group frame: kneel on the carpi, fold the hind legs, settle on the chest pad */
  couchTargets(c) {
    if (c < .005) return null;
    const S = this.sB, Ls = this.sL, out = { w: 0 };
    const k1 = smooth(0, 1, c), k2 = smooth(1, 2, c), k3 = smooth(2, 3, c);
    out.w = Math.max(k1, k2);
    const P = (x, y, z) => new V3(x, y, z);
    for (const S2 of ['L', 'R']) {
      const sd = S2 === 'L' ? 1 : -1, zF = .2 * sd * S, zH = .2 * sd * S;
      // fore: stand → kneel (carpus down in front) → couched (knees tucked forward under the chest)
      const kneelF = { K: P(.7 * S, .065 * Ls, zF), F: P(.28 * S, .06 * Ls, zF * 1.05), T: P(.15 * S, .1 * Ls, zF * 1.05), rot: 2.6 };
      const couchF = { K: P(1.0 * S, .065 * Ls, zF * .95), F: P(.58 * S, .055 * Ls, zF * 1.12), T: P(.45 * S, .1 * Ls, zF * 1.12), rot: 2.7 };
      const f = kneelF;
      const mixT = (a, b, t) => ({ K: a.K.clone().lerp(b.K, t), F: a.F.clone().lerp(b.F, t), T: a.T.clone().lerp(b.T, t), rot: lerp(a.rot, b.rot, t) });
      out['F' + S2] = Object.assign(mixT(f, couchF, k3), { w: k1 });
      // hind: straight until the second stage, then folded with the stifle forward on the ground
      const sitH = { K: P(-.8 * S, .1 * Ls, zH * 1.1), F: P(-.42 * S, .06 * Ls, zH * 1.15), T: P(-.3 * S, .05 * Ls, zH * 1.15), rot: 0 };
      out['H' + S2] = Object.assign(sitH, { w: k2 });
    }
    return out;
  }

  aim(bone, childRest, target) {
    // rotate bone (rest rotation identity) so that its child joint lies toward target, with minimal twist from the parent
    const par = bone.parent;
    par.updateWorldMatrix(true, false);
    par.getWorldQuaternion(_q);
    bone.updateWorldMatrix(true, false);
    const origin = _v4.setFromMatrixPosition(bone.matrixWorld);
    const cur = _v5.copy(childRest).applyQuaternion(_q).normalize();
    const want = _v3.copy(target).sub(origin).normalize();
    _q2.setFromUnitVectors(cur, want).multiply(_q);                // world rotation
    bone.quaternion.copy(_q.invert()).multiply(_q2);
    bone.updateWorldMatrix(false, true);
  }

  solveLeg(L, ck, cw) {
    const grp = this.c.group, yawQ = _q3.setFromAxisAngle(UP, this.yaw);
    // 1. targets in world space from the gait
    const T = L.T.copy(L.foot);
    const up = _v1.copy(L.upDir).applyQuaternion(yawQ);
    const past = _v2.copy(L.pastern).applyQuaternion(yawQ);
    const F = L.F.copy(T).sub(past);
    // shoulder/hip position right now
    L.top.parent.updateWorldMatrix(true, false);
    const top = new V3().copy(L.top.userData.restPos).applyMatrix4(L.top.parent.matrixWorld);
    const fwd = new V3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    let dir;
    if (L.planted) {
      // stance: the cannon leans with the column of the leg; the fetlock sinks a little under load
      dir = up.clone().lerp(top.clone().sub(F).normalize(), .35).normalize();
      F.y -= .012 * L.load * this.sL;
    } else {
      const u = L.swing, fx = (GAITS[this.gait] || GAITS.walk).flex;
      const ang = L.fore ? (-1.2 * Math.sin(Math.PI * Math.pow(u, .8)) + .22 * u * u * u) * fx : (-.38 + .7 * u - .15 * Math.sin(Math.PI * u)) * fx;
      dir = up.clone().applyAxisAngle(new V3(Math.sin(this.yaw), 0, Math.cos(this.yaw)), ang);
    }
    const K = L.K.copy(F).addScaledVector(dir, L.l3);
    // the shoulder blade rocks with the leg
    if (L.scap && !(ck && ck.w > .5)) {
      const rel = this.worldToLocal(F, _v5).x - L.home.x;
      L.scap.quaternion.setFromAxisAngle(new V3(0, 0, 1), clamp(-rel * .12, -.08, .08));
      L.scap.updateWorldMatrix(false, true);
      top.copy(L.top.userData.restPos).applyMatrix4(L.top.parent.matrixWorld);
    }
    // 2. blend towards couching keyframes (given in the body's ground frame)
    if (ck && ck.w > 0) {
      const w = ck.w, toW = p => this.localToWorld(p, new V3()).setY(p.y + 0);
      K.lerp(toW(ck.K), w); F.lerp(toW(ck.F), w); T.lerp(toW(ck.T), w);
    }
    // 3. two-bone IK from shoulder/hip to carpus/hock
    const d = K.clone().sub(top), dist = clamp(d.length(), Math.abs(L.l1 - L.l2) + 1e-3, L.l1 + L.l2 - 1e-3);
    d.normalize();
    const cosA = clamp((L.l1 * L.l1 + dist * dist - L.l2 * L.l2) / (2 * L.l1 * dist), -1, 1), sinA = Math.sqrt(1 - cosA * cosA);
    const pole = L.pole.clone().applyQuaternion(yawQ);
    const perp = pole.sub(d.clone().multiplyScalar(pole.dot(d))).normalize();
    const mid = top.clone().addScaledVector(d, L.l1 * cosA).addScaledVector(perp, L.l1 * sinA);
    const Kr = top.clone().addScaledVector(d, dist);
    this.aim(L.b1, L.b2.userData.restPos, mid);
    this.aim(L.b2, L.b3.userData.restPos, Kr);
    this.aim(L.b3, L.b4.userData.restPos, F);
    this.aim(L.b4, L.b5.userData.restPos, T);
    // 4. the foot: flat on the sand in stance, toes down in swing, folded when couched
    const parQ = new THREE.Quaternion(); L.b5.parent.getWorldQuaternion(parQ);
    let wq = new THREE.Quaternion().setFromAxisAngle(UP, L.planted ? (L.yaw || this.yaw) : this.yaw);
    if (!L.planted) wq.multiply(rotZ(-Math.sin(Math.PI * L.swing) * (L.fore ? .9 : .6) - (L.fore ? .2 : .1) * L.swing));
    if (ck && ck.w > 0) wq.slerp(_q.setFromAxisAngle(UP, this.yaw).multiply(rotZ(ck.rot)), ck.w);
    L.b5.quaternion.copy(parQ.invert()).multiply(wq);
    // pads spread under load
    const spread = 1 + .09 * L.load * (1 - (ck ? ck.w : 0));
    L.b5.scale.set(1 + (spread - 1) * .6, 1 - (spread - 1) * .8, spread);
    L.b5.updateWorldMatrix(false, true);
  }

  updateSmall(dt, ctl, mv) {
    const B = this.B, cam = this.c;
    // blinking, and eyes narrowing in blowing sand
    this.blinkT -= dt;
    if (this.blinkT < 0) { this.blink = .16; this.blinkT = 2.5 + Math.random() * 4.5 - this.storm * 1.5; }
    const bl = this.blink > 0 ? Math.sin(Math.PI * (1 - this.blink / .16)) : 0;
    this.blink = Math.max(0, this.blink - dt);
    const open = clamp(lerp(1, .32, this.storm) * (1 - bl) - (ctl.sleepy || 0) * .3, 0, 1);
    // third eyelid sweeps across every few seconds in the storm
    this.nictT -= dt;
    if (this.storm > .3 && this.nictT < 0) { this.nictT = 1.6 + Math.random() * 1.6; this.nictP = 0; }
    if (this.nictP !== undefined && this.nictP < 1) this.nictP += dt / .7;
    const nict = this.nictP !== undefined && this.nictP < 1 ? Math.sin(Math.PI * this.nictP) : 0;
    cam.setLids(open, Math.max(nict * this.storm, ctl.nict || 0));
    cam.setMorph('nostrilClosed', smooth(.1, .8, this.storm) * (.85 + .15 * Math.sin(this.t * 2.2)) + (ctl.nostril || 0));
    // ears: flicks, and flattened back in the storm
    this.earT -= dt;
    if (this.earT < 0) { this.earT = 1.5 + Math.random() * 4; this.earA = [(Math.random() - .5) * .8, (Math.random() - .5) * .8]; }
    this.earS = this.earS || [0, 0];
    for (let i = 0; i < 2; i++) this.earS[i] = damp(this.earS[i], this.earA[i], 6, dt);
    B.earL.quaternion.setFromEuler(_e.set(this.earS[0] * .5, this.earS[0], -this.storm * .9));
    B.earR.quaternion.setFromEuler(_e.set(-this.earS[1] * .5, -this.earS[1], -this.storm * .9));
    // tail: a slow pendulum, the occasional swish; clamped down in the storm
    this.tailT -= dt;
    if (this.tailT < 0) { this.tailT = 2 + Math.random() * 5; this.swish = 1; }
    this.swish = Math.max(0, (this.swish || 0) - dt * .9);
    const sw = Math.sin(this.t * 7) * this.swish * .5 * (1 - this.storm);
    const pend = Math.sin(this.t * 1.1) * .06 + Math.sin(this.phase * TAU) * .12 * mv;
    B.tail0.quaternion.setFromEuler(_e.set(pend + sw, 0, .05 - this.storm * .12));
    B.tail1.quaternion.setFromEuler(_e.set(pend * 1.3 + sw * 1.4, 0, 0));
    B.tail2.quaternion.setFromEuler(_e.set(pend * 1.5 + sw * 1.8, 0, 0));
    // chewing the cud: lateral grinding in bouts (a camelid habit), or gulping while drinking
    this.chewT -= dt;
    if (this.chewT < 0) { this.chewing = !this.chewing; this.chewT = this.chewing ? 6 + Math.random() * 6 : 4 + Math.random() * 6; }
    const chewK = this.chewing && mv < .3 && this.storm < .2 ? 1 : 0;
    this.chew = damp(this.chew, chewK, 3, dt);
    const cph = this.t * 1.35 * TAU;
    const open2 = this.chew * (.5 + .5 * Math.sin(cph)) * .09 + this.drink * (.03 + .03 * Math.sin(this.t * 9));
    B.jaw.quaternion.setFromEuler(_e.set(0, Math.sin(cph + .6) * .06 * this.chew, -open2));
    B.lip.quaternion.setFromEuler(_e.set(0, Math.sin(this.t * 3.1) * .03 * (1 - this.storm), Math.sin(this.t * 2.3) * .03 - this.drink * .05));
  }
}

/* ════════════════════════════════════════════════════════════════
   the anatomy atlas (adult female): organs as rigid parts hung on the rig,
   a full skeleton skinned to the same bones, section plane, exploded view
   Vertebral formula C7 T12 L7 S5 Ca15–20; no gallbladder; lungs without
   fissures but with an accessory lobe on the right; C1–C3 stomach;
   bicornuate uterus with the longer left horn.
   ════════════════════════════════════════════════════════════════ */

export { GAITS, CamelRig };
