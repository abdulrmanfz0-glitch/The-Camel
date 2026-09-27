import { eyeTexture, hash, lerp, Q, TAU, THREE, V3 } from '../app.js';

class Camel {
  constructor(res, spec, mats) {
    this.spec = spec; this.res = res; this.M = mats;
    this.group = new THREE.Group(); this.group.name = 'camel';
    // skeleton (rest pose: every bone unrotated, positioned at its joint)
    this.bones = []; this.bone = {};
    for (const b of spec.bones) {
      const bone = new THREE.Bone(); bone.name = b.name;
      bone.userData.rest = new V3(...b.p);
      this.bones.push(bone); this.bone[b.name] = bone;
    }
    spec.bones.forEach((b, i) => {
      const bone = this.bones[i];
      if (b.parent) { const par = this.bone[b.parent]; par.add(bone); bone.position.copy(bone.userData.rest).sub(par.userData.rest); }
      else { this.group.add(bone); bone.position.copy(bone.userData.rest); }
      bone.userData.restPos = bone.position.clone();
    });
    this.group.updateMatrixWorld(true);
    // geometry
    const g = new THREE.BufferGeometry(), n = res.count;
    g.setAttribute('position', new THREE.BufferAttribute(res.pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(res.nor, 3));
    const col = new Float32Array(n * 3), ao = new Float32Array(n);
    for (let i = 0; i < n; i++) { col[i * 3] = res.col[i * 4]; col[i * 3 + 1] = res.col[i * 4 + 1]; col[i * 3 + 2] = res.col[i * 4 + 2]; ao[i] = .25 + .75 * res.col[i * 4 + 3]; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('vao', new THREE.BufferAttribute(ao, 1));
    g.setAttribute('hair', new THREE.BufferAttribute(res.hair, 1));
    g.setAttribute('thin', new THREE.BufferAttribute(res.thin, 1));
    g.setAttribute('region', new THREE.BufferAttribute(res.region, 1));
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(res.sIdx, 4));
    g.setAttribute('skinWeight', new THREE.BufferAttribute(res.sW, 4));
    g.setIndex(new THREE.BufferAttribute(res.index, 1));
    this.morphNames = Object.keys(res.morphs);
    g.morphAttributes.position = this.morphNames.map(k => new THREE.BufferAttribute(res.morphs[k], 3));
    g.morphTargetsRelative = true;
    g.computeBoundingSphere();
    this.geometry = g;
    this.skeleton = new THREE.Skeleton(this.bones);
    this.mesh = new THREE.SkinnedMesh(g, mats.skin);
    this.mesh.castShadow = true; this.mesh.receiveShadow = true; this.mesh.frustumCulled = false;
    this.group.add(this.mesh);
    this.mesh.bind(this.skeleton);
    this.morph = {}; this.morphNames.forEach((k, i) => { this.morph[k] = i; });
    this.mesh.morphTargetInfluences = this.morphNames.map(() => 0);
    // fur shells
    this.shells = [];
    for (let i = 1; i <= Q.shells; i++) {
      const m = new THREE.SkinnedMesh(g, mats.shell(i / Q.shells));
      m.bind(this.skeleton, this.mesh.bindMatrix);
      m.morphTargetInfluences = this.mesh.morphTargetInfluences;
      m.frustumCulled = false; m.renderOrder = 1 + i; m.receiveShadow = true;
      this.group.add(m); this.shells.push(m);
    }
    this.buildEyes();
    this.mode = 'skin';
  }
  anchorWorld(name, out = new V3()) {
    const a = this.spec.anchors[name], b = this.bone[a.bone];
    b.updateWorldMatrix(true, false);
    return out.set(...a.p).sub(b.userData.rest).applyMatrix4(b.matrixWorld);
  }
  anchorLocal(name) { const a = this.spec.anchors[name], b = this.bone[a.bone]; return { bone: b, p: new V3(...a.p).sub(b.userData.rest) }; }
  setMorph(name, v) { const i = this.morph[name]; if (i !== undefined) this.mesh.morphTargetInfluences[i] = v; }
  setMode(mode) {
    this.mode = mode;
    const m = { skin: this.M.skin, muscle: this.M.muscle, xray: this.M.xray, thermal: this.M.thermal }[mode] || this.M.skin;
    this.mesh.material = m;
    const furOn = mode === 'skin';
    this.shells.forEach(s => { s.visible = furOn; });
    this.mesh.castShadow = mode !== 'xray';
    this.mesh.renderOrder = mode === 'xray' ? 10 : 0;
    for (const e of this.eyes) e.root.visible = mode === 'skin' || mode === 'thermal';
  }

  buildEyes() {
    this.eyes = [];
    const tex = eyeTexture();
    const eyeMat = new THREE.MeshPhysicalMaterial({ map: tex, roughness: .35, clearcoat: 1, clearcoatRoughness: .04, ior: 1.376, specularIntensity: .6 });
    const lidMat = new THREE.MeshStandardMaterial({ color: '#6d5037', roughness: .8 });
    const rimMat = new THREE.MeshStandardMaterial({ color: '#241b16', roughness: .5 });
    const lashMat = new THREE.MeshStandardMaterial({ color: '#17110d', roughness: .7, side: THREE.DoubleSide });
    const nicMat = new THREE.MeshPhysicalMaterial({ color: '#f1d8cf', roughness: .25, transmission: 0, transparent: true, opacity: .72, clearcoat: .6, side: THREE.DoubleSide, depthWrite: false });
    const s = this.spec.scale.head, R = 0.0205 * s;
    for (const S of ['L', 'R']) {
      const sd = S === 'L' ? 1 : -1;
      const a = this.anchorLocal('eye' + S), f = this.anchorLocal('eyeFwd' + S);
      const root = new THREE.Group();
      root.position.copy(a.p);
      const zAx = f.p.clone().sub(a.p).normalize(), yAx = new V3(0, 1, 0), xAx = new V3().crossVectors(yAx, zAx).normalize();
      yAx.crossVectors(zAx, xAx).normalize();
      root.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAx, yAx, zAx));
      a.bone.add(root);
      const ballG = new THREE.SphereGeometry(R, 40, 28); ballG.rotateX(Math.PI / 2);   // pole → +Z (the cornea)
      const ball = new THREE.Mesh(ballG, eyeMat); root.add(ball);
      // lids: spherical caps that rotate about the eye's horizontal axis
      const capG = (r, t0, t1) => { const gg = new THREE.SphereGeometry(r, 36, 12, 0, TAU, t0, t1 - t0); return gg; };
      const upper = new THREE.Group(), lower = new THREE.Group();
      const up = new THREE.Mesh(capG(R * 1.13, 0, Math.PI * .5), lidMat), upRim = new THREE.Mesh(new THREE.TorusGeometry(R * 1.13, R * .09, 6, 40, Math.PI), rimMat);
      upRim.rotation.x = Math.PI / 2; upRim.rotation.z = 0;
      upper.add(up, upRim);
      const lo = new THREE.Mesh(capG(R * 1.1, Math.PI * .5, Math.PI), lidMat), loRim = new THREE.Mesh(new THREE.TorusGeometry(R * 1.1, R * .08, 6, 40, Math.PI), rimMat);
      loRim.rotation.x = Math.PI / 2;
      lower.add(lo, loRim);
      // lashes: two rows of long curved lashes on the upper lid, one short row below
      const lash = (n, len, rim, row, dir) => {
        const pos = [], idx = [];
        for (let i = 0; i < n; i++) {
          const ph = lerp(-1.25, 1.25, (i + hash(i * 7.1 + row) * .6) / n) + (row ? .05 : 0);
          const base = new V3(Math.sin(ph) * rim, 0, Math.cos(ph) * rim);
          const out = base.clone().normalize();
          const L = len * (1 - .45 * Math.abs(ph) / 1.3) * (.8 + .4 * hash(i * 3.3 + row * 5));
          const w = R * .035;
          const side = new V3(Math.cos(ph), 0, -Math.sin(ph)).multiplyScalar(w);
          const segs = 4, b0 = pos.length / 3;
          for (let k = 0; k <= segs; k++) {
            const t = k / segs;
            const p = base.clone().addScaledVector(out, L * t * .75).addScaledVector(new V3(0, dir, 0), L * (t * t * .7 + t * .15));
            const ww = 1 - t * .85;
            pos.push(p.x + side.x * ww, p.y, p.z + side.z * ww, p.x - side.x * ww, p.y, p.z - side.z * ww);
          }
          for (let k = 0; k < segs; k++) { const o = b0 + k * 2; idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); }
        }
        const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gg.setIndex(idx); gg.computeVertexNormals();
        return new THREE.Mesh(gg, lashMat);
      };
      upper.add(lash(26, R * 1.35, R * 1.16, 0, 1), lash(20, R * 1.05, R * 1.13, 1, .8));
      lower.add(lash(16, R * .5, R * 1.12, 2, -1));
      root.add(upper, lower);
      // third eyelid (membrana nictitans): a thin translucent sheet that sweeps from the front corner
      const nic = new THREE.Group(), nm = new THREE.Mesh(new THREE.SphereGeometry(R * 1.035, 32, 16, 0, Math.PI * .95, Math.PI * .2, Math.PI * .6), nicMat);
      nic.add(nm); root.add(nic);
      this.eyes.push({ root, ball, upper, lower, nic, sd, R });
    }
    this.setLids(1, 0);
  }
  /* open: 0 closed … 1 wide open; nict: 0 hidden … 1 across the eye */
  setLids(open, nict = 0) {
    for (const e of this.eyes) {
      e.upper.rotation.x = lerp(.05, -.95, open);
      e.lower.rotation.x = lerp(-.02, .38, open);
      e.nic.rotation.y = lerp(2.05, 0, nict) * e.sd;
      e.nic.visible = nict > .02;
    }
  }
}

/* ════════════════════════════════════════════════════════════════
   the rig: every frame the pose is rebuilt from targets —
   feet from the gait (or the couching keyframes), legs by IK,
   neck and head by layered FK, plus the small motions of a living animal
   ════════════════════════════════════════════════════════════════ */

export { Camel };
