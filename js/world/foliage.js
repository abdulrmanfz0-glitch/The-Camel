import { CU, hash, lerp, mergeGeos, Q, rng, TAU, terrainH, TEX, THREE, tintGeo, twig, V3 } from '../app.js';

/* ─────────── foliage cards, drawn once on canvases ─────────── */
function cardTexture(kind) {
  const S = kind === 'grass' ? 256 : 256, c = document.createElement('canvas'); c.width = S; c.height = S;
  const x = c.getContext('2d'), R = rng(kind === 'acacia' ? 11 : kind === 'arfaj' ? 23 : 37);
  x.clearRect(0, 0, S, S); x.lineCap = 'round';
  const hsl = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;
  if (kind === 'acacia') {
    // Vachellia tortilis: zig-zag twigs with paired white thorns; tiny bipinnate leaves in tufts
    const tufts = [];
    for (let b = 0; b < 12; b++) {
      let px = S / 2 + (R() - .5) * 60, py = S / 2 + (R() - .5) * 30, a = R() * TAU;
      x.strokeStyle = hsl(24, 18, 26); x.lineWidth = 2.2;
      for (let k = 0; k < 6; k++) {
        const L = 14 + R() * 12; a += (k % 2 ? .5 : -.5) + (R() - .5) * .3;
        const nx = px + Math.cos(a) * L, ny = py + Math.sin(a) * L;
        x.beginPath(); x.moveTo(px, py); x.lineTo(nx, ny); x.stroke(); x.lineWidth = Math.max(.8, x.lineWidth * .8);
        x.strokeStyle = 'rgba(236,232,220,.9)'; const tl = x.lineWidth;
        for (const sgn of [1, -1]) { x.lineWidth = .9; x.beginPath(); x.moveTo(nx, ny); x.lineTo(nx + Math.cos(a + sgn * 1.2) * 5, ny + Math.sin(a + sgn * 1.2) * 5); x.stroke(); }
        x.lineWidth = tl; x.strokeStyle = hsl(24, 18, 26);
        tufts.push([nx, ny]); px = nx; py = ny;
        if (px < 10 || py < 10 || px > S - 10 || py > S - 10) break;
      }
    }
    for (const [tx, ty] of tufts) for (let f = 0; f < 8; f++) {
      const a = R() * TAU, L = 8 + R() * 10, cx = tx + (R() - .5) * 6, cy = ty + (R() - .5) * 6;
      const hue = 68 + R() * 22, lig = 24 + R() * 16, sat = 22 + R() * 18;
      x.strokeStyle = hsl(hue, sat, lig - 6); x.lineWidth = .8;
      x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a) * L, cy + Math.sin(a) * L); x.stroke();
      for (let k = 1; k <= 6; k++) {
        const t = k / 7, qx = cx + Math.cos(a) * L * t, qy = cy + Math.sin(a) * L * t;
        x.fillStyle = hsl(hue + (R() - .5) * 10, sat, lig + (R() - .5) * 8);
        for (const sgn of [1, -1]) { x.beginPath(); x.ellipse(qx + Math.cos(a + sgn * 1.4) * 1.6, qy + Math.sin(a + sgn * 1.4) * 1.6, 1.5, .8, a + sgn * 1.4, 0, TAU); x.fill(); }
      }
    }
  } else if (kind === 'arfaj') {
    // Rhanterium epapposum: a thicket of thin whitish stems with tiny grey-green leaves
    for (let i = 0; i < 70; i++) {
      const x0 = S * (.2 + .6 * R()), y0 = S, a = -Math.PI / 2 + (R() - .5) * 1.6, L = S * (.5 + .45 * R());
      let px = x0, py = y0, aa = a;
      x.strokeStyle = hsl(40, 10, 70 + R() * 14, .95); x.lineWidth = 1.3;
      x.beginPath(); x.moveTo(px, py);
      for (let k = 0; k < 8; k++) { aa += (R() - .5) * .35; px += Math.cos(aa) * L / 8; py += Math.sin(aa) * L / 8; x.lineTo(px, py); }
      x.stroke();
      for (let k = 0; k < 10; k++) {
        const t = .3 + .7 * R(), qx = lerp(x0, px, t) + (R() - .5) * 8, qy = lerp(y0, py, t) + (R() - .5) * 8;
        x.fillStyle = hsl(70 + R() * 20, 14 + R() * 10, 38 + R() * 16, .95);
        x.beginPath(); x.ellipse(qx, qy, 1.8 + R() * 1.2, 1, R() * TAU, 0, TAU); x.fill();
      }
    }
  } else {
    // thumam / Stipagrostis: arching straw blades from one crown
    for (let i = 0; i < 90; i++) {
      const x0 = S / 2 + (R() - .5) * 26, a = -Math.PI / 2 + (R() - .5) * 1.5, L = S * (.45 + .5 * R());
      let px = x0, py = S - 2, aa = a;
      const g = x.createLinearGradient(0, S, 0, S - L);
      g.addColorStop(0, hsl(32, 16, 32)); g.addColorStop(.35, hsl(40, 28, 58)); g.addColorStop(1, hsl(44, 34, 76));
      x.strokeStyle = g; x.lineWidth = 1.4 + R() * .8;
      x.beginPath(); x.moveTo(px, py);
      for (let k = 0; k < 10; k++) { aa += (a < -Math.PI / 2 ? -1 : 1) * .045; px += Math.cos(aa) * L / 10; py += Math.sin(aa) * L / 10; x.lineTo(px, py); }
      x.stroke();
    }
  }
  return mipCoverage(c, .42);
}
/* a mip chain whose alpha-tested coverage stays constant: without it, cards thin out and vanish with distance */
function mipCoverage(c0, cut) {
  const cov = (d, k) => { let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] * k >= cut * 255) n++; return n / (d.length / 4); };
  const base = c0.getContext('2d').getImageData(0, 0, c0.width, c0.height).data, target = cov(base, 1);
  const levels = [c0];
  let prev = c0;
  while (prev.width > 1 || prev.height > 1) {
    const c = document.createElement('canvas'); c.width = Math.max(1, prev.width >> 1); c.height = Math.max(1, prev.height >> 1);
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(prev, 0, 0, c.width, c.height);
    const id = x.getImageData(0, 0, c.width, c.height), d = id.data;
    let lo = 1, hi = 8;
    for (let it = 0; it < 12; it++) { const m = (lo + hi) / 2; if (cov(d, m) < target) lo = m; else hi = m; }
    for (let i = 3; i < d.length; i += 4) d[i] = Math.min(255, d[i] * hi);
    x.putImageData(id, 0, 0);
    levels.push(c); prev = c;
  }
  const t = new THREE.Texture(c0); t.mipmaps = levels; t.generateMipmaps = false;
  t.minFilter = THREE.LinearMipmapLinearFilter; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.needsUpdate = true;
  return t;
}
/* foliage material: alpha-tested cards that keep one normal on both faces and glow a little when backlit */
function foliageMaterial(map, tint, opts = {}) {
  const m = new THREE.MeshStandardMaterial({ map, color: tint, alphaTest: .42, side: THREE.DoubleSide, roughness: .82, metalness: 0, vertexColors: !!opts.vc });
  if (Q.msaa) m.alphaToCoverage = true;
  m.onBeforeCompile = sh => {
    sh.uniforms.uSunV = CU.uSunV; sh.uniforms.uSunCol = CU.uSunCol; sh.uniforms.uSunI = CU.uSunI;
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uSunV, uSunCol; uniform float uSunI;')
      .replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\nnormal = normalize(vNormal); nonPerturbedNormal = normal;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        { float back = pow(max(dot(normalize(vViewPosition), uSunV), 0.0), 4.0);
          totalEmissiveRadiance += diffuseColor.rgb * uSunCol * uSunI * back * ${(opts.trans || .18).toFixed(3)}; }`);
  };
  m.userData.shadeMat = new THREE.MeshDepthMaterial({ map, alphaTest: .42, side: THREE.DoubleSide, depthPacking: THREE.RGBADepthPacking });
  return m;
}
/* a card: a quad centred on c, facing n, with its normal bent towards the crown's outside for rounder shading */
function card(c, n, up, w, h, outward, bend = .55, anchorBottom = false) {
  const g = new THREE.PlaneGeometry(w, h);
  if (anchorBottom) g.translate(0, h / 2, 0);
  const q = new THREE.Quaternion().setFromUnitVectors(new V3(0, 0, 1), n.clone().normalize());
  const upr = new V3(0, 1, 0).applyQuaternion(q), ang = Math.atan2(upr.clone().cross(up).dot(n), upr.dot(up));
  g.rotateZ(ang); g.applyQuaternion(q); g.translate(c.x, c.y, c.z);
  const nor = g.attributes.normal, p = g.attributes.position, v = new V3();
  for (let i = 0; i < nor.count; i++) {
    v.fromBufferAttribute(p, i).sub(outward.o).multiply(outward.s).normalize();
    v.lerp(n.clone().normalize(), 1 - bend).normalize();
    nor.setXYZ(i, v.x, v.y, v.z);
  }
  return g;
}

/* acacia (سَمُر / طَلح, Vachellia tortilis): several leaning stems, zig-zag limbs, a flat, layered, see-through crown */
function buildAcacia(seed, H = 3.6) {
  const R = rng(seed), wood = [], leaves = [], tips = [];
  const barkC = new THREE.Color('#ffffff');
  const Rc = H * (.95 + R() * .35);
  const grow = (p, dir, len, rad, depth) => {
    const end = p.clone().addScaledVector(dir, len);
    if (end.y > H * .93) end.y = H * .93 + (end.y - H * .93) * .25;
    wood.push(tintGeo(twig(p, end, rad, rad * .74, depth < 2 ? 8 : 5), barkC));
    if (depth >= 5 || rad < .011) { tips.push({ p: end, d: dir.clone() }); return; }
    if (depth >= 3) tips.push({ p: end.clone(), d: dir.clone() });
    const n = depth === 0 ? 2 + (R() < .5 ? 1 : 0) : 2;
    const out = new V3(end.x, 0, end.z); if (out.lengthSq() < 1e-4) out.set(R() - .5, 0, R() - .5); out.normalize();
    for (let i = 0; i < n; i++) {
      const spin = (i - (n - 1) / 2) * (.9 + R() * .5) + (R() - .5) * .4;
      const hd = out.clone().applyAxisAngle(new V3(0, 1, 0), spin);
      const upK = end.y < H * .6 ? .9 - depth * .12 : .25 - depth * .05;
      const nd = hd.multiplyScalar(1 - upK * .5).add(new V3(0, upK, 0)).normalize();
      const rem = Math.max(.2, (Rc - Math.hypot(end.x, end.z)));
      grow(end, nd, Math.min(len * (.72 + R() * .18), rem * .65 + .15), rad * (.66 + R() * .08), depth + 1);
    }
  };
  const stems = 1 + Math.floor(R() * 3);
  for (let i = 0; i < stems; i++) {
    const a = i / stems * TAU + R() * 1.2, lean = .16 + R() * .22;
    const d = new V3(Math.cos(a) * lean, 1, Math.sin(a) * lean).normalize();
    const base = new V3(Math.cos(a) * .06, -.12, Math.sin(a) * .06);
    grow(base, d, H * (.34 + R() * .12), .085 + .03 * R() + (stems === 1 ? .04 : 0), 0);
  }
  // twig sprays and leaf cards at the tips, in flat layers
  const cx = tips.reduce((s, t) => s + t.p.x, 0) / tips.length, cz = tips.reduce((s, t) => s + t.p.z, 0) / tips.length;
  const crown = { o: new V3(cx, H * .7, cz), s: new V3(1 / Rc, 1 / (H * .25), 1 / Rc) };
  const perTip = Math.max(5, Math.round(16 * Q.plants));
  for (const t of tips) {
    const hdir = new V3(t.d.x, 0, t.d.z); if (hdir.lengthSq() < 1e-4) hdir.set(1, 0, 0); hdir.normalize();
    for (let k = 0; k < 3; k++) {
      const a = (R() - .5) * 2.2, L = .3 + R() * .45;
      const e = t.p.clone().addScaledVector(hdir.clone().applyAxisAngle(new V3(0, 1, 0), a), L).add(new V3(0, (R() - .3) * .12, 0));
      wood.push(tintGeo(twig(t.p, e, .012, .004, 3), barkC));
    }
    for (let k = 0; k < perTip; k++) {
      const off = hdir.clone().applyAxisAngle(new V3(0, 1, 0), (R() - .5) * 3.4).multiplyScalar(.1 + R() * .75);
      const c = t.p.clone().add(off).add(new V3(0, (R() - .4) * .3, 0));
      const n = new V3((R() - .5) * 1.1, 1, (R() - .5) * 1.1).normalize();
      const s = .55 + R() * .4;
      leaves.push(card(c, n, hdir, s, s * (.8 + R() * .3), crown, .6));
    }
  }
  const grp = new THREE.Group();
  const bark = new THREE.MeshStandardMaterial({ map: TEX.t.bark_c, normalMap: TEX.t.bark_n, color: '#6b5d53', roughness: .96, vertexColors: true });
  const t = new THREE.Mesh(mergeGeos(wood), bark);
  const leafMat = foliageMaterial(ACACIA_TEX || (ACACIA_TEX = cardTexture('acacia')), new THREE.Color('#9eaa82'), { trans: .1 });
  const c = new THREE.Mesh(mergeGeos(leaves), leafMat);
  c.customDepthMaterial = leafMat.userData.shadeMat;
  t.castShadow = c.castShadow = true; t.receiveShadow = c.receiveShadow = true;
  grp.add(t, c);
  grp.userData.r = Rc;
  return grp;
}
let ACACIA_TEX = null;

/* arfaj (Rhanterium epapposum): a rounded cushion of whitish stems, 40–80 cm, tiny grey-green leaves */
function buildArfajGeometry(seed) {
  const R = rng(seed), wood = [], cards = [], stemC = new THREE.Color('#d8d0c0'), stemD = new THREE.Color('#9d917c');
  const W = .34 + R() * .08, Hh = .4 + R() * .12;
  const crown = { o: new V3(0, Hh * .35, 0), s: new V3(1 / W, 1 / Hh, 1 / W) };
  for (let i = 0; i < 28; i++) {
    const a = R() * TAU, el = Math.acos(1 - R() * .95);
    const tip = new V3(Math.sin(el) * Math.cos(a) * W, Math.cos(el) * Hh + .02, Math.sin(el) * Math.sin(a) * W);
    const base = new V3((R() - .5) * .05, 0, (R() - .5) * .05);
    const mid = base.clone().lerp(tip, .45).add(new V3(0, .06 + R() * .05, 0));
    const c = R() > .4 ? stemC : stemD;
    wood.push(tintGeo(twig(base, mid, .007, .005, 4), c), tintGeo(twig(mid, tip, .005, .002, 3), c));
  }
  const nC = Math.round(46 * Q.plants) + 12;
  for (let i = 0; i < nC; i++) {
    const a = R() * TAU, el = Math.acos(1 - R() * .9), rr = .55 + R() * .4;
    const p = new V3(Math.sin(el) * Math.cos(a) * W * rr, Math.cos(el) * Hh * rr + .03, Math.sin(el) * Math.sin(a) * W * rr);
    const n = p.clone().sub(new V3(0, Hh * .2, 0)).normalize().add(new V3((R() - .5) * .8, (R() - .5) * .5, (R() - .5) * .8)).normalize();
    const s = .24 + R() * .16;
    cards.push(card(p, n, new V3(0, 1, 0), s, s, crown, .7));
  }
  return { wood: mergeGeos(wood), cards: mergeGeos(cards) };
}
function buildShrubs() {
  const grp = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .9, color: '#b7ae9f' });
  const cardMat = foliageMaterial(cardTexture('arfaj'), new THREE.Color('#a9ad94'), { trans: .1 });
  const kinds = [buildArfajGeometry(3), buildArfajGeometry(17), buildArfajGeometry(41)];
  const R = rng(7), spots = [];
  const N = Math.round(80 * Q.plants);
  for (let i = 0; i < N; i++) {
    const r = 2.6 + Math.pow(R(), .8) * 40, a = R() * TAU, x = r * Math.cos(a), z = r * Math.sin(a);
    if (r < 5.4 && Math.abs(Math.atan2(z, x)) < 1.2) continue;
    spots.push([x, z, .6 + R() * .75, R() * TAU, i % 3]);
  }
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new V3(), p = new V3();
  for (let k = 0; k < 3; k++) {
    const mine = spots.filter(s => s[4] === k);
    const iw = new THREE.InstancedMesh(kinds[k].wood, woodMat, mine.length), ic = new THREE.InstancedMesh(kinds[k].cards, cardMat, mine.length);
    mine.forEach(([x, z, s, rot], i) => {
      p.set(x, terrainH(x, z) - .03, z); q.setFromAxisAngle(new V3(0, 1, 0), rot); sc.set(s * 1.1, s * (.85 + .3 * hash(x)), s * 1.1);
      M.compose(p, q, sc); iw.setMatrixAt(i, M); ic.setMatrixAt(i, M);
    });
    iw.castShadow = ic.castShadow = true; iw.receiveShadow = ic.receiveShadow = true;
    ic.customDepthMaterial = cardMat.userData.shadeMat;
    grp.add(iw, ic);
  }
  // thumām grass tussocks: three crossed cards of arching straw blades
  const tuftG = [];
  for (let i = 0; i < 3; i++) { const g = new THREE.PlaneGeometry(.62, .5); g.translate(0, .25, 0); g.rotateY(i / 3 * Math.PI); tuftG.push(g); }
  const tuft = mergeGeos(tuftG);
  { const n = tuft.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0); }
  const grassMat = foliageMaterial(cardTexture('grass'), new THREE.Color('#c2ad88'), { trans: .22 });
  const tufts = [];
  for (let i = 0; i < Math.round(70 * Q.plants); i++) { const r = 2.2 + R() * 30, a = R() * TAU; tufts.push([r * Math.cos(a), r * Math.sin(a), .6 + R() * .7, R() * TAU]); }
  const it = new THREE.InstancedMesh(tuft, grassMat, tufts.length);
  tufts.forEach(([x, z, s, rot], i) => { p.set(x, terrainH(x, z) - .02, z); q.setFromAxisAngle(new V3(0, 1, 0), rot); sc.set(s, s * (.8 + .4 * hash(z)), s); M.compose(p, q, sc); it.setMatrixAt(i, M); });
  it.castShadow = true; it.customDepthMaterial = grassMat.userData.shadeMat;
  grp.add(it);
  grp.userData.spots = spots;
  return grp;
}

/* rocks: weathered sandstone cobbles and boulders with desert varnish on their exposed faces */

export { buildAcacia, buildShrubs };
