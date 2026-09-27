import { ANAT, CU, DEG, ENV, Q, SDFKERNEL, STATE, THREE, V3 } from '../app.js';

/* ════════════════════════════════════════════════════════════════
   optional photographic model. If assets/camel/camel.json exists, the GLB it names is
   loaded with three's GLTFLoader (+ meshopt), turned to face +X, scaled to the rig, and
   driven by the procedural rig: by retargeting its own skeleton through a bone map, or —
   for an unrigged scan — by skinning it to the rig's bones from the sculpt's own field.
   The procedural body stays underneath for the anatomy layers, footprints and highlights.
   See ASSETS_NEEDED.md for the files and the config format.
   ════════════════════════════════════════════════════════════════ */
const MODEL3D = {
  cfg: null, scene: null, ready: false, on: false, mode: null, camel: null, meshes: [], pairs: [], err: null,
  base: 'assets/camel/',
  /* read the config; returns false quietly when there is no model to load */
  async load(onProgress) {
    let cfg;
    try {
      const r = await fetch(this.base + 'camel.json', { cache: 'no-cache' });
      if (!r.ok) return false;
      cfg = await r.json();
    } catch (e) { return false; }
    this.cfg = cfg;
    try {
      const jsm = 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/';
      const [{ GLTFLoader }, meshopt] = await Promise.all([import(jsm + 'loaders/GLTFLoader.js'), import(jsm + 'libs/meshopt_decoder.module.js').catch(() => null)]);
      const loader = new GLTFLoader();
      if (meshopt && meshopt.MeshoptDecoder) loader.setMeshoptDecoder(meshopt.MeshoptDecoder);
      const file = (ENV.mobile || Q.name === 'low') && cfg.fileLow ? cfg.fileLow : (cfg.file || 'camel.glb');
      const gltf = await new Promise((res, rej) => loader.load(this.base + file, res, e => { if (onProgress && e.total) onProgress(e.loaded / e.total); }, rej));
      this.scene = gltf.scene;
      return true;
    } catch (e) {
      this.err = String(e && e.message || e);
      console.warn('camel model not loaded, keeping the procedural camel:', this.err);
      return false;
    }
  },
  /* place the model on a procedural camel (called whenever the adult body is shown) */
  attach(camel) {
    if (!this.scene || camel.spec.stage !== 'adult') { this.show(false); return; }
    if (this.camel === camel && this.ready) { this.show(STATE.layer === 'skin'); return; }
    this.camel = camel;
    const cfg = this.cfg, root = this.scene;
    // orientation: the config names the model's forward and up axes
    const ax = s => ({ '+X': new V3(1, 0, 0), '-X': new V3(-1, 0, 0), '+Y': new V3(0, 1, 0), '-Y': new V3(0, -1, 0), '+Z': new V3(0, 0, 1), '-Z': new V3(0, 0, -1) }[s || '+Z']);
    const fwd = ax(cfg.forward || '+Z'), up = ax(cfg.up || '+Y'), side = new V3().crossVectors(fwd, up);
    const m = new THREE.Matrix4().makeBasis(fwd, up, side).invert();          // model axes → camel axes (+X fwd, +Y up, +Z left)
    const holder = new THREE.Group(); holder.name = 'camelModel';
    const inner = new THREE.Group(); inner.quaternion.setFromRotationMatrix(m); inner.rotateY((cfg.yawDeg || 0) * DEG);
    inner.add(root); holder.add(inner);
    // scale: hump top at the rig's hump height (or a factor from the config); feet on the ground; centred on the barrel
    // measure the model in the camel's own frame (she may have walked and turned already)
    const box = new THREE.Box3(), lb = () => {
      camel.group.updateMatrixWorld(true); holder.updateMatrixWorld(true);
      const gInv = new THREE.Matrix4().copy(camel.group.matrixWorld).invert(), M = new THREE.Matrix4(), v = new V3();
      box.makeEmpty();
      root.traverse(o => { if (!o.isMesh) return; M.multiplyMatrices(gInv, o.matrixWorld); const pa = o.geometry.attributes.position; for (let i = 0; i < pa.count; i += 3) box.expandByPoint(v.fromBufferAttribute(pa, i).applyMatrix4(M)); });
    };
    camel.group.add(holder);
    lb();
    // the procedural body's own extent at rest is the target
    const pb = new THREE.Box3().setFromBufferAttribute(camel.geometry.attributes.position);
    const s = typeof cfg.scale === 'number' ? cfg.scale : (pb.max.y - pb.min.y) / Math.max(box.max.y - box.min.y, 1e-3);
    const h0 = box.max.y - box.min.y;
    inner.scale.setScalar(s); lb();
    this.fit = { s, h0, h1: box.max.y - box.min.y, pb: [pb.min.toArray(), pb.max.toArray()], box: [box.min.toArray(), box.max.toArray()] };
    const off = cfg.offset || [0, 0, 0];
    inner.position.set((pb.min.x + pb.max.x) / 2 - (box.min.x + box.max.x) / 2 + off[0], pb.min.y - box.min.y + off[1], (pb.min.z + pb.max.z) / 2 - (box.min.z + box.max.z) / 2 + off[2]);
    holder.updateMatrixWorld(true);
    this.holder = holder;
    // meshes: shadows, and the peel / section / highlight hooks
    this.meshes = [];
    root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; this.meshes.push(o); this.hook(o.material); } });
    const skinned = this.meshes.filter(o => o.isSkinnedMesh);
    const map = cfg.boneMap || (skinned.length ? this.guessMap(skinned[0].skeleton) : null);
    if (skinned.length && map && Object.keys(map).length >= 6) this.setupRetarget(map);
    else this.autoSkin(camel);
    this.ready = true;
    this.show(STATE.layer === 'skin');
  },
  show(on) {
    this.on = !!(on && this.ready && this.holder);
    if (this.holder) this.holder.visible = this.on;
    if (this.camel) {
      this.camel.mesh.visible = !this.on || STATE.layer !== 'skin';
      this.camel.shells.forEach(sh => { sh.visible = !this.on && STATE.layer === 'skin' && Q.shells > 0; });
      for (const e of this.camel.eyes) e.root.visible = !this.on && (STATE.layer === 'skin' || STATE.layer === 'thermal');
    }
  },
  /* the model shares the section plane and the peel window with the rest of the body */
  hook(mat) {
    (Array.isArray(mat) ? mat : [mat]).forEach(mm => {
      if (!mm || mm.userData.hooked) return; mm.userData.hooked = true;
      mm.clippingPlanes = ANAT.clip; mm.side = THREE.DoubleSide; mm.shadowSide = THREE.FrontSide;
      const prev = mm.onBeforeCompile;
      mm.onBeforeCompile = (sh, r) => {
        if (prev) prev(sh, r);
        sh.uniforms.uPeel = CU.uPeel;
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWm;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWm = (modelMatrix * vec4(transformed, 1.0)).xyz;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWm; uniform vec4 uPeel;')
          .replace('void main() {', 'void main() {\n if (uPeel.w > 0.0 && distance(vWm, uPeel.xyz) < uPeel.w) discard;');
      };
      mm.needsUpdate = true;
    });
  },
  /* common rig names → our bones (Blender Rigify / generic quadruped rigs) */
  guessMap(skel) {
    const names = skel.bones.map(b => b.name), map = {};
    const find = (...pats) => names.find(n => pats.every(p => p.test(n)));
    const L = /(\.l$|_l$|left|\.L|_L\b|L$)/i, R = /(\.r$|_r$|right|\.R|_R\b|R$)/i;
    const tryMap = (ours, pats, side) => { const n = find(...pats, ...(side ? [side] : [])); if (n) map[ours] = n; };
    tryMap('pelvis', [/(pelvis|hips?)/i]); tryMap('root', [/(spine|spine0|spine_01)$/i]); tryMap('chest', [/(chest|spine0?3|spine_03|ribcage)/i]);
    tryMap('neck0', [/neck.?0?1?$/i]); tryMap('neck2', [/neck.?0?3/i]); tryMap('head', [/^head|[^a-z]head$/i]); tryMap('jaw', [/jaw/i]);
    for (const [S, side] of [['L', L], ['R', R]]) {
      tryMap('scap' + S, [/(shoulder|scapula|clavicle)/i], side); tryMap('hum' + S, [/(upper.?arm|humerus)/i], side); tryMap('rad' + S, [/(fore.?arm|radius|lower.?arm)/i], side);
      tryMap('mc' + S, [/(hand|carpus|wrist|metacarp|front.?foot)/i], side); tryMap('fem' + S, [/(thigh|femur|upper.?leg)/i], side); tryMap('tib' + S, [/(shin|calf|tibia|lower.?leg)/i], side);
      tryMap('mt' + S, [/(foot|tarsus|metatars|hind.?foot)/i], side);
    }
    return map;
  },
  /* 1. rigged model: copy the rig's bone rotations onto the model's bones, relative to both rest poses */
  setupRetarget(map) {
    this.mode = 'retarget';
    const cg = this.camel.group, inv = new THREE.Quaternion();
    cg.updateMatrixWorld(true);
    const gq = cg.getWorldQuaternion(new THREE.Quaternion()).invert();
    const skel = this.meshes.find(o => o.isSkinnedMesh).skeleton;
    const byName = new Map(skel.bones.map(b => [b.name, b]));
    this.pairs = [];
    for (const [ours, theirs] of Object.entries(map)) {
      const a = this.camel.bone[ours], b = byName.get(theirs);
      if (!a || !b) continue;
      const restB = gq.clone().multiply(b.getWorldQuaternion(new THREE.Quaternion()));   // model bone, group space, at rest
      this.pairs.push({ a, b, restB, restLocal: b.quaternion.clone() });
    }
    // parents first, so each bone's group-space parent rotation is up to date when it is solved
    const depth = o => { let d = 0; while (o.parent) { d++; o = o.parent; } return d; };
    this.pairs.sort((p, q) => depth(p.b) - depth(q.b));
    const hip = this.pairs.find(p => p.a.name === 'pelvis' || p.a.name === 'root');
    if (hip) { this.hip = hip.b; this.hipRest = hip.b.position.clone(); this.rootRest = this.camel.bone.root.position.clone(); }
    this._q = inv;
  },
  /* 2. unrigged model: weights from the sculpt's primitives (the same rule the SDF kernel uses) */
  autoSkin(camel) {
    this.mode = 'autoskin';
    const K = SDFKERNEL(null), P = K.pack(camel.spec.prims), NP = camel.spec.prims.length, ST = K.ST, nb = camel.spec.bones.length;
    const toGroup = new THREE.Matrix4(), gInv = new THREE.Matrix4().copy(camel.group.matrixWorld).invert();
    for (const o of this.meshes) {
      o.updateWorldMatrix(true, false);
      toGroup.multiplyMatrices(gInv, o.matrixWorld);
      const g = o.geometry.clone(); g.applyMatrix4(toGroup);
      const pos = g.attributes.position, n = pos.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4), acc = new Float64Array(nb), dv = new Float64Array(NP);
      for (let v = 0; v < n; v++) {
        const x = pos.getX(v), y = pos.getY(v), z = pos.getZ(v);
        let dmin = 1e9;
        for (let k = 0; k < NP; k++) { const oo = k * ST; dv[k] = P[oo + 1] === 1 || P[oo + 39] < 0 ? 1e9 : K.dist(P, oo, x, y, z); if (dv[k] < dmin) dmin = dv[k]; }
        acc.fill(0);
        for (let k = 0; k < NP; k++) if (dv[k] < 1e8) acc[P[k * ST + 39]] += Math.exp(-(dv[k] - dmin) / P[k * ST + 40]);
        const idx = [...acc.keys()].sort((a, b) => acc[b] - acc[a]).slice(0, 4), sum = idx.reduce((s2, i) => s2 + acc[i], 0) || 1;
        idx.forEach((bi, j) => { si[v * 4 + j] = bi; sw[v * 4 + j] = acc[bi] / sum; });
      }
      g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
      g.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
      const sm = new THREE.SkinnedMesh(g, o.material);
      sm.castShadow = sm.receiveShadow = true; sm.frustumCulled = false;
      camel.group.add(sm); sm.bind(camel.skeleton, camel.mesh.bindMatrix);
      o.visible = false;
      o.userData.replaced = sm;
      (this.skinned = this.skinned || []).push(sm);
    }
    this.holder.visible = false;
    this.holder = new THREE.Group(); this.skinned.forEach(sm => this.holder.add(sm)); camel.group.add(this.holder);
    this.skinned.forEach(sm => sm.bind(camel.skeleton, camel.mesh.bindMatrix));
  },
  update() {
    if (!this.on || this.mode !== 'retarget') return;
    const cg = this.camel.group;
    const gq = cg.getWorldQuaternion(new THREE.Quaternion()).invert();
    const pq = new THREE.Quaternion(), aq = new THREE.Quaternion();
    for (const p of this.pairs) {
      aq.copy(gq).multiply(p.a.getWorldQuaternion(pq));                // our bone's rotation from rest, group space
      const target = aq.clone().multiply(p.restB);                       // the model bone's wanted group-space rotation
      const parentQ = gq.clone().multiply(p.b.parent.getWorldQuaternion(pq));
      p.b.quaternion.copy(parentQ.invert().multiply(target));
      p.b.updateMatrixWorld(true);
    }
    if (this.hip) {
      const d = this.camel.bone.root.position.clone().sub(this.rootRest);
      const ps = new V3(); this.hip.parent.getWorldScale(ps); const gs = new V3(); cg.getWorldScale(gs);
      this.hip.position.copy(this.hipRest).add(d.multiplyScalar(gs.x / Math.max(ps.x, 1e-6)));
    }
  },
};

export { MODEL3D };
