import { ATLAS, clamp, CU, damp, easeInOut, hexLin, lerp, Q, rng, rotInv, SDF, STATE, TAU, THREE, V3, vnoise } from '../app.js';

function primsBounds(prims, vox) {
  let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
  for (const p of prims) {
    if (p.op === 1) continue;
    const pts = p.t === 0 ? [[p.c, Math.max(...p.r) / Math.min(1, p.sq ? p.sq[3] : 1)]] : [[p.a, p.ra], [p.b, p.rb]];
    for (const [c, r] of pts) for (let i = 0; i < 3; i++) { mn[i] = Math.min(mn[i], c[i] - r - (p.k || 0)); mx[i] = Math.max(mx[i], c[i] + r + (p.k || 0)); }
  }
  return { min: mn.map(v => v - 3 * vox), max: mx.map(v => v + 3 * vox) };
}

function anatomySpecs(cs, boneIx) {
  const E = (c, r, o = {}) => Object.assign({ t: 0, c, r, k: 0 }, o);
  const C = (a, b, ra, rb, o = {}) => Object.assign({ t: 1, a, b, ra, rb, k: 0 }, o);
  const pitch = cs.headPitch, P0 = cs.poll;
  const H = (u, v, w = 0) => [P0[0] + u * Math.cos(pitch) - v * Math.sin(pitch), P0[1] + u * Math.sin(pitch) + v * Math.cos(pitch), w];
  const tube = (pts, r0, r1, o = {}) => { const out = []; for (let i = 0; i < pts.length - 1; i++) out.push(C(pts[i], pts[i + 1], lerp(r0, r1, i / (pts.length - 1)), lerp(r0, r1, (i + 1) / (pts.length - 1)), Object.assign({ k: .01 }, o))); return out; };
  const catmull = (pts, n) => {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (let j = 0; j < n; j++) {
        const t = j / n, t2 = t * t, t3 = t2 * t;
        out.push([0, 1, 2].map(k => .5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  };
  const NECK = cs.neck, NR = cs.neckR;
  const neckLine = (off, zoff = 0) => [H(0.02, -0.1 + off * .3, zoff)].concat(NECK.slice().reverse().map((p, i, a) => [p[0] + .01, p[1] + off * NR[a.length - 1 - i], zoff]));
  const organs = [];
  const O = (id, bone, color, prims, extra = {}) => organs.push(Object.assign({ id, bone, color, prims, vox: .006 }, extra));

  /* heart and the great vessels */
  O('heart', 'chest', '#8e2426', [
    C([.535, 1.37, .02], [.455, 1.15, .045], .105, .045, { k: .03 }),
    E([.5, 1.43, .075], [.06, .05, .05], { k: .03 }), E([.565, 1.41, -.05], [.07, .055, .06], { k: .03 }),
    E([.49, 1.3, .055], [.07, .1, .05], { k: .04 }),
  ], { rough: .45, dir: [.35, -.9, .2] });
  const aorta = catmull([[.52, 1.42, .0], [.51, 1.55, .0], [.42, 1.6, .0], [.25, 1.6, 0], [-.1, 1.59, 0], [-.45, 1.56, 0], [-.58, 1.5, 0]], 4);
  const carL = catmull([[.5, 1.56, 0]].concat(neckLine(-.35, .028).reverse().slice(1)), 3), carR = carL.map(p => [p[0], p[1], -p[2]]);
  O('arteries', 'chest', '#a8231c', [...tube(aorta, .024, .018), ...tube(carL, .009, .007), ...tube(carR, .009, .007),
    ...tube([[.54, 1.4, -.02], [.49, 1.5, 0], [.4, 1.52, .09]], .018, .012), ...tube([[.49, 1.5, 0], [.4, 1.52, -.09]], .014, .012)], { rough: .4, vox: .005, part: 'vessels', dir: [.2, .4, .3] });
  const jugL = catmull([[.58, 1.43, -.02]].concat(neckLine(-.6, .06).reverse().slice(1)), 3), jugR = jugL.map(p => [p[0], p[1], -Math.abs(p[2])]);
  O('veins', 'chest', '#344c93', [...tube([[.53, 1.36, -.05], [.3, 1.36, -.06], [.05, 1.37, -.07], [-.25, 1.45, -.05], [-.5, 1.52, -.03]], .02, .016),
    ...tube(jugL.map(p => [p[0], p[1], Math.abs(p[2])]), .011, .009), ...tube(jugR, .011, .009)], { rough: .4, vox: .005, part: 'vessels', dir: [.2, .4, -.3] });

  /* lungs: no fissures, accessory lobe on the right; trachea down the neck */
  for (const sd of [1, -1]) {
    const pr = [
      E([.3, 1.5, .12 * sd], [.29, .21, .12], { k: .08 }), E([.08, 1.53, .11 * sd], [.2, .17, .11], { k: .08 }), E([.5, 1.47, .1 * sd], [.12, .13, .08], { k: .06 }),
      E([.49, 1.27, .03], [.15, .2, .12], { op: 1, k: .03 }),
    ];
    if (sd < 0) pr.splice(3, 0, E([.12, 1.33, -.05], [.1, .065, .055], { k: .03 }));
    O(sd > 0 ? 'lungL' : 'lungR', 'chest', '#d38f8c', pr, { rough: .55, part: 'lungs', dir: [.1, .5, sd * 1] });
  }
  const trach = catmull(neckLine(-.42).concat([[.45, 1.5, 0]]), 3);
  { const tp = trach[Math.min(3, trach.length - 1)];
    O('thyroid', 'chest', '#8f3a2f', [E([tp[0], tp[1], .024], [.024, .016, .009], { k: .004 }), E([tp[0], tp[1], -.024], [.024, .016, .009], { k: .004 }), C([tp[0], tp[1] - .012, .02], [tp[0], tp[1] - .012, -.02], .004, .004, { k: .003 })], { rough: .45, vox: .0025, dir: [.3, -.3, .8] }); }
  O('trachea', 'chest', '#e2b8a8', [...tube(trach, .02, .022), ...tube([[.45, 1.5, 0], [.36, 1.5, .09]], .016, .012), ...tube([[.45, 1.5, 0], [.36, 1.5, -.09]], .016, .012)], { rough: .5, vox: .005, part: 'lungs', dir: [.6, .3, 0] });

  /* abdomen: liver (right, cranial; no gallbladder), spleen (left), C1–C3, intestines */
  O('liver', 'root', '#6e2a1f', [E([.02, 1.4, -.1], [.1, .21, .14], { k: .05 }), E([-.06, 1.33, -.15], [.11, .15, .09], { k: .05 }), E([.04, 1.26, .02], [.07, .12, .09], { k: .05 })], { rough: .35, dir: [.2, .2, -1] });
  /* spleen (S30): rectangular, triangular in section, rounded edges; a wedge of capsules, thick edge to thin edge */
  { const d = [.34, .94, 0], w = [.94, -.34, 0], c = [0, 1.42, .235], hl = .13, at = (u, v, z) => [0, 1, 2].map(i => c[i] + d[i] * u + w[i] * v + (i === 2 ? z : 0));
    O('spleen', 'root', '#6a2847', [[-.045, .026, -.01], [-.01, .02, 0], [.025, .013, .006], [.055, .006, .01]].map(([v, r, z]) => C(at(-hl, v, z), at(hl, v, z), r, r, { k: .018 })), { rough: .4, dir: [0, .3, 1] }); }
  const c1 = [E([-.02, 1.28, .07], [.2, .19, .17], { k: .09 }), E([-.3, 1.27, .09], [.22, .18, .17], { k: .09 }), E([-.16, 1.47, .1], [.035, .1, .2], { op: 1, k: .05 })];
  for (let i = 0; i < 14; i++) c1.push(E([-.34 + i * .042, 1.13 + .02 * Math.sin(i), .1 + .05 * Math.cos(i * 1.7)], [.022, .014, .022], { k: .02, tag: 1 }));
  O('c1', 'root', '#c99d7c', c1, { rough: .5, tags: [{ color: hexLin('#c99d7c') }, { color: hexLin('#9d6a54') }], part: 'stomach', dir: [0, -.6, .8] });
  O('c2', 'root', '#c2876d', [E([.15, 1.2, -.04], [.07, .07, .07], { k: .02 })], { rough: .5, part: 'stomach', dir: [.4, -.7, -.3] });
  O('c3', 'root', '#b9795f', tube(catmull([[.15, 1.2, -.08], [.05, 1.12, -.15], [-.15, 1.12, -.19], [-.36, 1.18, -.19], [-.46, 1.29, -.15]], 4), .034, .052), { rough: .5, vox: .005, part: 'stomach', dir: [0, -.5, -.8] });
  const R = rng(1234), sip = [];
  let p = [-.1, 1.42, -.08];
  for (let i = 0; i < 70; i++) {
    sip.push(p.slice());
    const a = R() * TAU, b = (R() - .5) * 1.2;
    p = [clamp(p[0] + Math.cos(a) * .06, -.5, -.08), clamp(p[1] + Math.sin(b) * .05, 1.2, 1.52), clamp(p[2] + Math.sin(a) * .06, -.2, .02)];
  }
  O('intestine', 'root', '#d4a08b', tube(catmull(sip, 2), .017, .017), { rough: .45, vox: .005, part: 'intestines', dir: [-.3, -.4, -.8] });
  const spi = [];
  for (let i = 0; i <= 90; i++) { const t = i / 90, a = t * 3.2 * TAU, r = lerp(.03, .12, t); spi.push([-.32 + r * Math.cos(a), 1.4 + r * Math.sin(a), -.03 + .01 * Math.sin(a * 2)]); }
  for (let i = 0; i <= 80; i++) { const t = i / 80, a = t * 3.1 * TAU + Math.PI * .95, r = lerp(.11, .05, t); spi.push([-.32 + r * Math.cos(a), 1.4 + r * Math.sin(a), -.06 + .01 * Math.sin(a * 2)]); }
  O('colon', 'root', '#c38a6d', [...tube(spi, .012, .012), ...tube(catmull([[-.38, 1.47, -.08], [-.56, 1.52, -.05], [-.72, 1.55, 0], [-.83, 1.56, 0]], 3), .016, .015), E([-.54, 1.36, -.12], [.1, .04, .04], { k: .02 })], { rough: .45, vox: .004, part: 'intestines', dir: [-.5, .2, -.6] });

  /* kidneys, ureters, bladder; bicornuate uterus and ovaries; the udder (female) */
  for (const [sd, x, id] of [[1, -.36, 'kidneyL'], [-1, -.28, 'kidneyR']]) O(id, 'root', '#7a372c', [E([x, 1.58, .1 * sd], [.085, .05, .045], { k: .01 }), E([x, 1.575, .05 * sd], [.03, .02, .03], { op: 1, k: .01 })], { rough: .4, vox: .004, part: 'kidneys', dir: [-.2, .8, sd * .6] });
  O('ureters', 'root', '#d9b08f', [...tube([[-.36, 1.56, .06], [-.5, 1.46, .05], [-.6, 1.37, .02]], .0055, .005), ...tube([[-.28, 1.56, -.06], [-.5, 1.46, -.05], [-.6, 1.37, -.02]], .0055, .005)], { rough: .4, vox: .0035, dir: [-.2, .5, .4] });
  O('bladder', 'pelvis', '#d8b684', [E([-.62, 1.34, 0], [.07, .055, .06], { k: .01 })], { rough: .35, dir: [-.4, -.8, 0] });
  O('uterus', 'pelvis', '#d38585', [E([-.6, 1.43, 0], [.05, .033, .033], { k: .02 }), ...tube(catmull([[-.57, 1.43, .02], [-.5, 1.45, .06], [-.43, 1.42, .1], [-.4, 1.38, .1]], 3), .028, .02), ...tube(catmull([[-.57, 1.43, -.02], [-.51, 1.44, -.055], [-.47, 1.41, -.07]], 3), .023, .018),
    ...tube([[-.63, 1.43, 0], [-.8, 1.46, 0]], .02, .018)], { rough: .4, vox: .004, dir: [-.3, .6, .5], sex: 'f' });
  O('ovaries', 'pelvis', '#e8b9a6', [E([-.39, 1.36, .1], [.021, .016, .016], { k: .01 }), E([-.46, 1.39, -.075], [.019, .015, .015], { k: .01 })], { rough: .45, vox: .003, dir: [-.1, .5, .8], sex: 'f' });
  O('udder', 'root', '#e6c3a6', [E([-.3, 1.125, 0], [.1, .052, .078], { k: .03 }), ...[[.05, .042], [.05, -.042], [-.05, .042], [-.05, -.042]].map(([dx, dz]) => C([-.3 + dx, 1.09, dz], [-.3 + dx * 1.2, 1.02, dz * 1.15], .011, .008, { k: .01 }))], { rough: .5, vox: .004, dir: [0, -1, 0], sex: 'f' });
  /* male: testes high in the perineum, the dulla pushed out of the left side of the mouth, poll glands behind the head */
  O('testes', 'pelvis', '#e9d0c2', [E([-.785, 1.29, .034], [.042, .03, .026], { k: .01 }), E([-.785, 1.29, -.034], [.042, .03, .026], { k: .01 }), C([-.77, 1.33, .02], [-.72, 1.38, .01], .006, .005, { k: .005 }), C([-.77, 1.33, -.02], [-.72, 1.38, -.01], .006, .005, { k: .005 })], { rough: .4, vox: .004, dir: [-.8, -.3, 0], sex: 'm' });
  O('dulla', 'jaw', '#e08e9e', [C(H(.34, -.11, .03), H(.3, -.22, .07), .022, .05, { k: .03 }), E(H(.29, -.3, .08), [.06, .085, .045], { k: .04 })], { rough: .25, vox: .004, dir: [0, -.4, 1], sex: 'm' });
  O('pollGlands', 'head', '#4a3222', [E(H(-.1, .045, .036), [.036, .016, .022], { k: .01 }), E(H(-.1, .045, -.036), [.036, .016, .022], { k: .01 })], { rough: .5, vox: .003, dir: [-.6, .6, 0], sex: 'm' });
  /* airway, mouth, glands */
  O('larynx', 'head', '#e6c9b6', [E(H(-.005, -.185), [.042, .036, .03], { k: .015 }), C(H(-.05, -.17), H(.05, -.2), .028, .024, { k: .015 }), E(H(.045, -.16), [.018, .025, .016], { op: 1, k: .006 })], { rough: .45, vox: .003, dir: [0, -.8, .3] });
  O('tongue', 'jaw', '#b96f6c', [E(H(.28, -.098), [.17, .021, .031], { k: .02 }), E(H(.14, -.1), [.07, .03, .035], { k: .03 })], { rough: .35, vox: .003, dir: [.4, -.6, .5] });
  const tU = [], tL = [];
  for (const sd of [1, -1]) {
    tU.push(C(H(.18, -.07, .04 * sd), H(.36, -.08, .03 * sd), .012, .01, { k: .004 }), E(H(.4, -.092, .024 * sd), [.008, .013, .006], { k: .003 }), E(H(.44, -.09, .02 * sd), [.007, .011, .005], { k: .003 }));
    tL.push(C(H(.2, -.1, .04 * sd), H(.36, -.113, .028 * sd), .011, .009, { k: .004 }), E(H(.43, -.117, .02 * sd), [.007, .012, .006], { k: .003 }));
  }
  tL.push(E(H(.47, -.125), [.018, .01, .018], { k: .004 }));
  O('teethU', 'head', '#efe6d2', tU, { rough: .3, vox: .0025, part: 'teeth', dir: [0, .6, .6] });
  O('teethL', 'jaw', '#efe6d2', tL, { rough: .3, vox: .0025, part: 'teeth', dir: [0, -.6, .6] });
  O('pancreas', 'root', '#e2b48c', [E([-.2, 1.47, .1], [.12, .026, .05], { k: .03, m: rotInv(0, 25, 0) }), C([-.1, 1.44, .02], [-.05, 1.41, -.08], .022, .02, { k: .02 }), E([-.07, 1.4, -.12], [.08, .024, .038], { k: .03 })], { rough: .5, vox: .004, dir: [0, .4, .9] });
  O('adrenals', 'root', '#c78444', [E([-.27, 1.61, .06], [.022, .012, .012], { k: .006 }), E([-.19, 1.61, -.06], [.022, .012, .012], { k: .006 })], { rough: .45, vox: .0025, dir: [0, 1, 0] });
  /* lymph nodes: head, neck/chest, belly and hind leg (the prescapular and prefemoral nodes are ~9 cm long) */
  O('lymphHead', 'head', '#d9bb90', [...[1, -1].flatMap(sd => [E(H(.16, -.17, .045 * sd), [.02, .012, .01], { k: .004 }), E(H(-.03, -.12, .035 * sd), [.022, .014, .012], { k: .004 }), E(H(-.02, -.03, .08 * sd), [.018, .012, .008], { k: .004 })])], { rough: .5, vox: .0025, part: 'lymph', dir: [0, -.5, .5] });
  O('lymphBody', 'chest', '#d9bb90', [...[1, -1].flatMap(sd => [E([.74, 1.5, .15 * sd], [.045, .018, .012], { k: .004, m: rotInv(0, 0, -60) }), E([.8, 1.36, .07 * sd], [.02, .013, .01], { k: .004 })]), E([.25, 1.52, 0], [.03, .015, .015], { k: .004 })], { rough: .5, vox: .003, part: 'lymph', dir: [.4, .2, .5] });
  O('lymphHind', 'pelvis', '#d9bb90', [...[1, -1].flatMap(sd => [E([-.34, 1.3, .25 * sd], [.045, .02, .013], { k: .004, m: rotInv(0, 0, 70) }), E([-.63, 1.05, .18 * sd], [.022, .017, .012], { k: .004 })]), E([-.2, 1.35, -.05], [.03, .01, .02], { k: .004 })], { rough: .5, vox: .003, part: 'lymph', dir: [-.3, -.2, .5] });

  /* reserves and heat: hump fat, brain with its carotid rete, nasal turbinates */
  O('fat', 'hump', '#eecb6e', [E([-.05, 1.88, 0], [.3, .19, .16], { k: .1, m: rotInv(0, 0, -7) }), E([.2, 1.79, 0], [.2, .08, .12], { k: .1 })], { rough: .6, vox: .008, dir: [0, 1, 0], cut: '#f3d98e' });
  O('brain', 'head', '#e3c1b8', [E(H(.075, .015), [.066, .05, .056], { k: .02 }), E(H(-.005, .0), [.035, .034, .04], { k: .02 }), C(H(-.03, -.01), H(-.1, -.03), .018, .016, { k: .01 })], { rough: .5, vox: .003, dir: [0, 1, .4] });
  const rete = [];
  for (let i = 0; i < 9; i++) rete.push(C(H(.03 + .012 * (i % 3), -.035 - .004 * i, (i % 3 - 1) * .01), H(.08 + .01 * (i % 2), -.04 - .003 * i, ((i + 1) % 3 - 1) * .012), .0035, .0035, { k: .004 }));
  O('rete', 'head', '#b0241c', rete.concat(tube([H(.02, -.1), H(.05, -.045)], .005, .005)), { rough: .4, vox: .0022, part: 'brain', dir: [0, .6, .6] });
  const turb = [];
  for (const sd of [1, -1]) for (const [v, r] of [[.012, .02], [-.018, .017], [-.042, .013]]) turb.push(C(H(.22, v, .018 * sd), H(.46, v - .03, .014 * sd), r, r * .6, { k: .006, sq: [0, 0, 1, .55] }));
  O('turbinates', 'head', '#e2ab9d', turb, { rough: .5, vox: .003, dir: [.4, .8, 0] });
  O('esophagus', 'chest', '#c48a80', tube(catmull(neckLine(-.2, .02).concat([[.45, 1.55, .03], [.2, 1.5, .05], [.02, 1.42, .06]]), 3), .014, .016), { rough: .45, vox: .005, part: 'stomach', dir: [.5, .6, .4] });
  organs.forEach(o => { o.prims.forEach(pr => { if (pr.tag === undefined) pr.tag = 0; }); });
  return organs;
}

/* the skeleton, in regions so each build stays small; skinned to the camel's bones */
function skeletonSpecs(cs, boneIx) {
  const E = (c, r, o = {}) => Object.assign({ t: 0, c, r, k: .006 }, o);
  const C = (a, b, ra, rb, o = {}) => Object.assign({ t: 1, a, b, ra, rb, k: .006 }, o);
  const b = n => boneIx[n];
  const pitch = cs.headPitch, P0 = cs.poll;
  const H = (u, v, w = 0) => [P0[0] + u * Math.cos(pitch) - v * Math.sin(pitch), P0[1] + u * Math.sin(pitch) + v * Math.cos(pitch), w];
  const regions = [];
  const Rg = (id, prims, vox = .0045) => { prims.forEach(p => { if (p.tag === undefined) p.tag = 0; p.s = p.s || .012; }); regions.push({ id, prims, vox }); };
  const TOOTH = 1, CART = 2;
  // skull and mandible
  const hb = b('head'), jb = b('jaw'), sk = [
    E(H(.06, .0), [.1, .08, .075], { bone: hb }), E(H(-.03, .02), [.03, .05, .05], { bone: hb }),
    C(H(.12, .01), H(.46, -.07), .055, .03, { bone: hb, sq: [0, 0, 1, .8], k: .02 }), C(H(.14, .05), H(.4, .0), .02, .012, { bone: hb, k: .015 }),
    E(H(.47, -.08), [.04, .02, .025], { bone: hb }),
  ];
  for (const sd of [1, -1]) {
    sk.push(E(H(.13, .03, .085 * sd), [.036, .033, .013], { bone: hb }), C(H(.05, -.02, .07 * sd), H(.2, -.04, .07 * sd), .012, .012, { bone: hb }),
      C(H(.18, -.07, .04 * sd), H(.36, -.08, .03 * sd), .012, .01, { bone: hb, tag: TOOTH }),
      C(H(.02, -.03, .058 * sd), H(.08, -.12, .052 * sd), .022, .02, { bone: jb, sq: [0, 0, 1, .5] }), C(H(.08, -.12, .05 * sd), H(.46, -.14, .018 * sd), .02, .012, { bone: jb, sq: [0, 0, 1, .7] }),
      C(H(.2, -.1, .04 * sd), H(.36, -.115, .028 * sd), .011, .009, { bone: jb, tag: TOOTH }), E(H(.44, -.12, .02 * sd), [.008, .012, .006], { bone: jb, tag: TOOTH }));
  }
  sk.push(E(H(.475, -.13), [.02, .012, .02], { bone: jb, tag: TOOTH }));
  for (const sd of [1, -1]) sk.push(E(H(.13, .03, .1 * sd), [.03, .028, .03], { op: 1, bone: hb }));
  sk.push(E(H(.45, -.03), [.06, .02, .025], { op: 1, bone: hb }));
  Rg('skull', sk, .0035);
  // cervical vertebrae along the dorsal third of the neck
  const NECK = cs.neck, NR = cs.neckR, NB = ['chest', 'neck0', 'neck1', 'neck2', 'neck3'];
  const segs = []; let Lt = 0;
  for (let i = 0; i < NECK.length - 1; i++) {
    const a = NECK[i], c = NECK[i + 1], dx = c[0] - a[0], dy = c[1] - a[1], l = Math.hypot(dx, dy);
    const nx = -dy / l, ny = dx / l;
    segs.push({ a: [a[0] + nx * NR[i] * .3, a[1] + ny * NR[i] * .3], c: [c[0] + nx * NR[i + 1] * .3, c[1] + ny * NR[i + 1] * .3], l, bone: NB[i], s0: Lt }); Lt += l;
  }
  const at = s => { let g = segs[segs.length - 1]; for (const q of segs) if (s <= q.s0 + q.l) { g = q; break; } const t = (s - g.s0) / g.l; return { p: [lerp(g.a[0], g.c[0], t), lerp(g.a[1], g.c[1], t), 0], bone: g.bone }; };
  const cv = [];
  for (let i = 0; i < 7; i++) {
    const s0 = Lt * (.03 + i * .137), s1 = s0 + Lt * .12, A = at(s0), Bp = at(s1), mid = at((s0 + s1) / 2);
    const bn = b(mid.bone);
    cv.push(C(A.p, Bp.p, .026, .024, { bone: bn }), E(mid.p.map((v, k) => k === 1 ? v + .03 : v), [.04, .012, .03], { bone: bn }));
    for (const sd of [1, -1]) cv.push(E([mid.p[0], mid.p[1] - .01, .035 * sd], [.03, .01, .015], { bone: bn }));
  }
  const atlas = at(Lt * .995); cv.push(E([atlas.p[0], atlas.p[1], 0], [.03, .025, .06], { bone: b('neck3') }));
  Rg('neck', cv, .0045);
  // thoracic column, withers spines, ribs, sternum
  const th = [];
  const TX = i => lerp(.6, -.08, i / 11), TY = i => lerp(1.53, 1.63, i / 11);
  const spineH = [.26, .28, .27, .25, .22, .18, .14, .11, .09, .08, .075, .07];
  const stX = i => lerp(.6, .24, i / 6);
  for (let i = 0; i < 12; i++) {
    const x = TX(i), y = TY(i), bn = b(x > .2 ? 'chest' : 'root');
    th.push(C([x + .028, y, 0], [x - .028, y, 0], .026, .026, { bone: bn }));
    th.push(C([x, y + .02, 0], [x - Math.sin(.45) * spineH[i], y + .02 + Math.cos(.45) * spineH[i], 0], .012, .009, { bone: bn, sq: [0, 0, 1, .6] }));
    const w = [.17, .2, .22, .24, .25, .26, .26, .26, .255, .25, .24, .23][i];
    for (const sd of [1, -1]) {
      const p0 = [x, y - .01, .03 * sd], p1 = [x - .03, y - .04, .16 * sd], p2 = [x - .06 - .008 * i, y - .25, w * sd];
      const p3 = i < 7 ? [stX(i) + .04, 1.2 - .005 * i, .12 * sd] : [x - .12, 1.24 + .012 * (i - 7), (w - .04) * sd];
      const p4 = i < 7 ? [stX(i), 1.1, .03 * sd] : [x - .09 - .02 * (i - 7), 1.17 + .015 * (i - 7), (w - .08) * sd];
      th.push(C(p0, p1, .012, .012, { bone: bn }), C(p1, p2, .012, .011, { bone: bn }), C(p2, p3, .011, .01, { bone: bn }), C(p3, p4, .009, .008, { bone: bn, tag: CART }));
    }
  }
  th.push(C([.64, 1.2, 0], [.52, 1.11, 0], .028, .026, { bone: b('chest'), sq: [0, 0, 1, .6] }), C([.52, 1.11, 0], [.24, 1.07, 0], .026, .022, { bone: b('chest'), sq: [0, 0, 1, .6] }));
  Rg('thorax', th, .0045);
  // lumbar column, sacrum, pelvis
  const lp = [];
  for (let i = 0; i < 7; i++) {
    const x = lerp(-.15, -.5, i / 6), bn = b(x > -.3 ? 'root' : 'pelvis');
    lp.push(C([x + .025, 1.645, 0], [x - .025, 1.65, 0], .026, .026, { bone: bn }), C([x, 1.67, 0], [x - .02, 1.74, 0], .01, .008, { bone: bn, sq: [0, 0, 1, .5] }));
    for (const sd of [1, -1]) lp.push(C([x, 1.64, .02 * sd], [x - .01, 1.645, .11 * sd], .008, .006, { bone: bn, sq: [0, 1, 0, .5] }));
  }
  lp.push(C([-.55, 1.66, 0], [-.78, 1.62, 0], .03, .018, { bone: b('pelvis') }));
  for (const sd of [1, -1]) lp.push(
    C([-.44, 1.7, .17 * sd], [-.53, 1.47, .14 * sd], .03, .035, { bone: b('pelvis'), sq: [0, 0, 1, .55] }), C([-.44, 1.7, .17 * sd], [-.58, 1.66, .05 * sd], .025, .02, { bone: b('pelvis') }),
    C([-.53, 1.47, .14 * sd], [-.76, 1.58, .09 * sd], .025, .02, { bone: b('pelvis') }), E([-.77, 1.59, .09 * sd], [.025, .03, .022], { bone: b('pelvis') }),
    C([-.53, 1.44, .12 * sd], [-.62, 1.38, 0], .018, .016, { bone: b('pelvis') }), E([-.53, 1.46, .15 * sd], [.035, .035, .03], { bone: b('pelvis') }));
  Rg('pelvis', lp, .005);
  // tail: fifteen to twenty caudal vertebrae
  const tl = [], tp = [[-.79, 1.61], [-.86, 1.36], [-.87, 1.12], [-.87, .95]], tb = ['tail0', 'tail1', 'tail2'];
  for (let i = 0; i < 17; i++) {
    const s = i / 17 * 3, k = Math.min(2, Math.floor(s)), t = s - k, a = tp[k], c = tp[k + 1];
    const p = [lerp(a[0], c[0], t), lerp(a[1], c[1], t)], q = [lerp(a[0], c[0], t + .25), lerp(a[1], c[1], t + .25)];
    tl.push(C([p[0], p[1], 0], [q[0], q[1], 0], lerp(.02, .008, i / 16), lerp(.019, .007, i / 16), { bone: b(tb[k]) }));
  }
  Rg('tail', tl, .004);
  // limbs
  for (const [sd, S] of [[1, 'L'], [-1, 'R']]) {
    const z = p => [p[0], p[1], p[2] * sd], F = cs.fore, Hd = cs.hind;
    const fl = [
      C(z([.6, 1.74, .17]), z([.75, 1.39, .2]), .075, .03, { bone: b('scap' + S), sq: [0, 0, 1, .16], k: .01 }), C(z([.61, 1.72, .19]), z([.74, 1.42, .215]), .012, .01, { bone: b('scap' + S) }),
      E(z([.78, 1.36, .2]), [.045, .045, .04], { bone: b('hum' + S) }), C(z(F.sh), z(F.el), .038, .03, { bone: b('hum' + S) }),
      C(z(F.el), z([F.ca[0], F.ca[1] + .03, F.ca[2]]), .026, .022, { bone: b('rad' + S) }), C(z(F.el), z([.54, 1.15, .23]), .022, .018, { bone: b('rad' + S) }),
      E(z(F.ca), [.035, .035, .035], { bone: b('mc' + S) }), C(z([F.ca[0], F.ca[1] - .03, F.ca[2]]), z([F.fe[0], F.fe[1] + .02, F.fe[2]]), .02, .019, { bone: b('mc' + S) }),
    ];
    for (const t of [1, -1]) {
      const zz = F.fe[2] + .016 * t;
      fl.push(E(z([F.fe[0], F.fe[1] + .01, zz]), [.018, .018, .016], { bone: b('mc' + S) }),
        C(z([F.fe[0] + .005, F.fe[1], zz + .006 * t]), z([.69, .12, F.fe[2] + .034 * t]), .012, .011, { bone: b('pas' + S) }),
        C(z([.69, .12, F.fe[2] + .034 * t]), z([.725, .078, F.fe[2] + .04 * t]), .011, .01, { bone: b('pas' + S) }),
        E(z([.765, .055, F.fe[2] + .042 * t]), [.018, .009, .01], { bone: b('toe' + S) }));
    }
    Rg('fore' + S, fl, .004);
    const hl = [
      E(z([Hd.hip[0], Hd.hip[1], Hd.hip[2] - .015]), [.04, .04, .035], { bone: b('fem' + S) }), C(z(Hd.hip), z(Hd.st), .04, .032, { bone: b('fem' + S) }),
      E(z([Hd.st[0] + .04, Hd.st[1] + .02, Hd.st[2]]), [.015, .025, .015], { bone: b('tib' + S) }),
      C(z(Hd.st), z([Hd.ho[0], Hd.ho[1] + .02, Hd.ho[2]]), .03, .022, { bone: b('tib' + S) }),
      E(z(Hd.ho), [.03, .035, .03], { bone: b('mt' + S) }), C(z(Hd.ho), z([Hd.ho[0] - .06, Hd.ho[1] + .08, Hd.ho[2]]), .018, .016, { bone: b('mt' + S) }),
      C(z([Hd.ho[0], Hd.ho[1] - .03, Hd.ho[2]]), z([Hd.fe[0], Hd.fe[1] + .02, Hd.fe[2]]), .019, .018, { bone: b('mt' + S) }),
    ];
    for (const t of [1, -1]) {
      const zz = Hd.fe[2] + .015 * t;
      hl.push(E(z([Hd.fe[0], Hd.fe[1] + .01, zz]), [.017, .017, .015], { bone: b('mt' + S) }),
        C(z([Hd.fe[0] + .005, Hd.fe[1], zz]), z([Hd.fe[0] + .045, .12, Hd.fe[2] + .03 * t]), .011, .01, { bone: b('hpas' + S) }),
        C(z([Hd.fe[0] + .045, .12, Hd.fe[2] + .03 * t]), z([Hd.fe[0] + .08, .078, Hd.fe[2] + .036 * t]), .01, .009, { bone: b('hpas' + S) }),
        E(z([Hd.fe[0] + .115, .055, Hd.fe[2] + .038 * t]), [.016, .008, .009], { bone: b('htoe' + S) }));
    }
    Rg('hind' + S, hl, .004);
  }
  return regions;
}

const ANAT = {
  built: false, building: null, organs: [], bones: [], group: null, clip: [new THREE.Plane(new V3(-1, 0, 0), 99)], explode: 0,
  mats: {},
  async build(camel) {
    if (this.built) return;
    if (this.building) return this.building;
    this.building = (async () => {
      const spec = camel.spec, boneIx = {}; spec.bones.forEach((bb, i) => { boneIx[bb.name] = i; });
      const oSpecs = anatomySpecs(spec, boneIx), sSpecs = skeletonSpecs(spec, boneIx);
      const vs = Q.name === 'low' ? 1.4 : 1;
      const jobs = oSpecs.map(o => ({ prims: o.prims, voxel: o.vox * vs, bounds: primsBounds(o.prims, o.vox * vs), tags: o.tags || [{ color: hexLin(o.color) }], ao: true }))
        .concat(sSpecs.map(r => ({ prims: r.prims, voxel: r.vox * vs, bounds: primsBounds(r.prims, r.vox * vs), tags: [{ color: hexLin('#e9dfc8'), hair: 0 }, { color: hexLin('#f4efe2'), hair: 0 }, { color: hexLin('#b8c9cf'), hair: 0 }], bones: spec.bones, ao: true })));
      const res = await SDF.run(jobs);
      const mkGeo = (r, skin) => {
        const g = new THREE.BufferGeometry(), n = r.count;
        g.setAttribute('position', new THREE.BufferAttribute(r.pos, 3));
        g.setAttribute('normal', new THREE.BufferAttribute(r.nor, 3));
        const c = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) { const ao = .35 + .65 * r.col[i * 4 + 3]; c[i * 3] = r.col[i * 4] * ao; c[i * 3 + 1] = r.col[i * 4 + 1] * ao; c[i * 3 + 2] = r.col[i * 4 + 2] * ao; }
        g.setAttribute('color', new THREE.BufferAttribute(c, 3));
        if (skin) { g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(r.sIdx, 4)); g.setAttribute('skinWeight', new THREE.BufferAttribute(r.sW, 4)); }
        g.setIndex(new THREE.BufferAttribute(r.index, 1));
        g.computeBoundingSphere();
        return g;
      };
      oSpecs.forEach((o, i) => {
        const g = mkGeo(res[i], false);
        const m = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: o.rough || .5, clearcoat: .55, clearcoatRoughness: .25, side: THREE.DoubleSide, clippingPlanes: this.clip, emissive: new THREE.Color(0) });
        const les = { uLesK: { value: 0 }, uLesS: { value: 0 }, uLesSw: { value: 0 } };
        this.cutShader(m, o.cut || '#d7a08e', les);
        const mesh = new THREE.Mesh(g, m);
        mesh.userData.organ = o.id;
        const bone = camel.bone[o.bone];
        mesh.position.copy(bone.userData.rest).negate();
        const holder = new THREE.Group(); holder.add(mesh); bone.add(holder);
        mesh.castShadow = false; mesh.renderOrder = 5;
        const center = new V3(); g.computeBoundingBox(); g.boundingBox.getCenter(center);
        const dir = new V3(...(o.dir || [0, 0, 1])).normalize();
        this.organs.push({ id: o.id, part: o.part || o.id, mesh, holder, bone, center, dir, mat: m, sex: o.sex || null, les, rest: bone.userData.rest.clone() });
      });
      sSpecs.forEach((r, j) => {
        const g = mkGeo(res[oSpecs.length + j], true);
        const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .62, clippingPlanes: this.clip, side: THREE.DoubleSide, emissive: new THREE.Color(0) });
        this.cutShader(m, '#e7d6b2');
        const mesh = new THREE.SkinnedMesh(g, m);
        mesh.frustumCulled = false; mesh.castShadow = true; mesh.renderOrder = 4;
        camel.group.add(mesh); mesh.bind(camel.skeleton, camel.mesh.bindMatrix);
        this.bones.push({ id: r.id, mesh, mat: m });
      });
      this.camel = camel;
      this.built = true;
      this.setLayer(STATE.layer);
    })();
    return this.building;
  },
  /* the inside of anything the section plane cuts is shown as a flat, lit "cut" colour */
  cutShader(m, cut, les) {
    m.onBeforeCompile = sh => {
      sh.uniforms.uCut = { value: new THREE.Color(cut) };
      if (les) Object.assign(sh.uniforms, les, { uTime: CU.uTime, uInvExpo: CU.uInvExpo });
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vOP;' + (les ? '\nuniform float uLesSw;' : '')).replace('#include <begin_vertex>', '#include <begin_vertex>\nvOP = position;' + (les ? '\ntransformed += objectNormal * uLesSw;' : ''));
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uCut; varying vec3 vOP;' + (les ? `
        uniform float uLesK, uLesS, uTime, uInvExpo;
        float lh(vec3 p){ p = fract(p * .1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
        float ln(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(lh(i), lh(i + vec3(1,0,0)), f.x), mix(lh(i + vec3(0,1,0)), lh(i + vec3(1,1,0)), f.x), f.y), mix(mix(lh(i + vec3(0,0,1)), lh(i + vec3(1,0,1)), f.x), mix(lh(i + vec3(0,1,1)), lh(i + vec3(1,1,1)), f.x), f.y), f.z); }` : ''))
        .replace('#include <color_fragment>', '#include <color_fragment>\nif (!gl_FrontFacing) diffuseColor.rgb = uCut * 0.8;' + (les ? `
          float lesGlow = 0.0;
          if (uLesK > 0.5 && gl_FrontFacing) {
            float n1 = ln(vOP * 26.0), n2 = ln(vOP * 70.0);
            if (uLesK < 1.5) { diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.72, 0.12, 0.1) * (0.8 + 0.4 * n2), 0.5 * uLesS); lesGlow = 1.0; }                       // inflamed
            else if (uLesK < 2.5) { float pm = smoothstep(0.52, 0.68, n1); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.42, 0.07, 0.12), pm * 0.8 * uLesS); lesGlow = pm * 0.6; }   // patchy consolidation
            else if (uLesK < 3.5) { diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.9, 0.78, 0.55), 0.35 * uLesS); lesGlow = 0.5; }                                   // swollen
            else if (uLesK < 4.5) { diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.8, 0.42) * (0.85 + 0.3 * n1), 0.7 * uLesS); lesGlow = 0.6; }                 // abscess
            else { diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.05, 0.9, 0.85), 0.5); }
          }` : ''))
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>' + (les ? `
          totalEmissiveRadiance += vec3(0.9, 0.22, 0.12) * lesGlow * uLesS * (0.55 + 0.45 * sin(uTime * 2.2)) * 0.22 * uInvExpo;` : ''));
    };
  },
  /* the atlas organ → the meshes that draw it */
  meshesFor(aid) { const a = typeof ATLAS !== 'undefined' && ATLAS.organs[aid]; return a && a.mesh ? this.organs.filter(q => a.mesh.includes(q.id)) : this.organs.filter(q => q.id === aid || q.part === aid); },
  extras: [],
  /* disease looks on the organs: [[atlasOrgan, kind], …]; skin looks go to the coat shader */
  setVisuals(vis) {
    const KIND = { inflam: 1, patchy: 2, swell: 3, abscess: 4, cysts: 5, mass: 5, larvae: 1 };
    for (const o of this.organs) { o.les.uLesK.value = 0; o.les.uLesS.value = 0; o.les.uLesSw.value = 0; o.mat.transparent = false; o.mat.opacity = 1; o.mat.depthWrite = true; }
    for (const m of this.extras) { if (m.parent) m.parent.remove(m); m.geometry.dispose(); }
    this.extras = [];
    for (const [target, kind] of vis || []) {
      if (target === 'skin') continue;
      for (const o of this.meshesFor(target)) {
        o.les.uLesK.value = KIND[kind] || 1; o.les.uLesS.value = 1;
        if (kind === 'swell') o.les.uLesSw.value = o.part === 'lymph' ? .006 : .012;
        if (kind === 'abscess') o.les.uLesSw.value = .016;
        if (kind === 'cysts') this.addCysts(o, o.part === 'lungs' || o.id.startsWith('lung') ? 7 : 6);
        if (kind === 'mass') this.addMass(o);
        if (kind === 'larvae') this.addLarvae(o);
      }
    }
  },
  scaleOrgan(o, s) { o.mesh.scale.setScalar(s); o.mesh.position.copy(o.center).multiplyScalar(1 - s).sub(o.rest.clone().multiplyScalar(s)); },
  _pick(o, n, seed) { const p = o.mesh.geometry.attributes.position, nr = o.mesh.geometry.attributes.normal, R = rng(seed), out = []; for (let i = 0; i < n; i++) { const k = Math.floor(R() * p.count); out.push([new V3().fromBufferAttribute(p, k), new V3().fromBufferAttribute(nr, k), R()]); } return out; },
  addCysts(o, n) {
    const g = new THREE.SphereGeometry(1, 20, 14), mat = new THREE.MeshPhysicalMaterial({ color: '#efe6cf', roughness: .22, clearcoat: .8, transparent: true, opacity: .88, clippingPlanes: this.clip });
    const pts = this._pick(o, n, o.id.length * 97), im = new THREE.InstancedMesh(g, mat, pts.length), M = new THREE.Matrix4();
    pts.forEach(([p, nn, r], i) => { const rad = .016 + r * .024; M.makeScale(rad, rad, rad).setPosition(p.clone().addScaledVector(nn, rad * .35)); im.setMatrixAt(i, M); });
    im.renderOrder = 6; o.mesh.add(im); this.extras.push(im);
  },
  addMass(o) {
    o.mat.transparent = true; o.mat.opacity = .38; o.mat.depthWrite = false;
    const g = new THREE.IcosahedronGeometry(1, 3), a = g.attributes.position, v = new V3();
    for (let i = 0; i < a.count; i++) { v.fromBufferAttribute(a, i); const f = 1 + .22 * vnoise(v.x * 3 + 1, v.y * 3 + v.z * 2) + .08 * vnoise(v.z * 9, v.x * 9); a.setXYZ(i, v.x * f, v.y * f * .8, v.z * f); }
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: '#6f675c', roughness: .9, clippingPlanes: this.clip }));
    m.scale.setScalar(.11); m.position.copy(o.center).add(new V3(-.08, -.05, .02)); m.renderOrder = 4;
    o.mesh.add(m); this.extras.push(m);
  },
  addLarvae(o) {
    const g = new THREE.CapsuleGeometry(.0045, .016, 4, 10); g.rotateZ(Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({ color: '#e7dcc0', roughness: .6, clippingPlanes: this.clip });
    const pts = this._pick(o, 7, 5), im = new THREE.InstancedMesh(g, mat, pts.length), M = new THREE.Matrix4(), q = new THREE.Quaternion();
    pts.forEach(([p, nn, r], i) => { q.setFromEuler(new THREE.Euler(r * 3, r * 7, r * 5)); M.compose(p.clone().addScaledVector(nn, .004), q, new V3(1, 1, 1)); im.setMatrixAt(i, M); });
    im.renderOrder = 6; o.mesh.add(im); this.extras.push(im);
  },
  /* which organ is under the pointer (organs layer only) */
  pick(ray) {
    const list = this.organs.filter(o => o.holder.visible && o.mesh.visible).map(o => o.mesh);
    const hit = ray.intersectObjects(list, false)[0];
    return hit ? hit.object.userData.organ : null;
  },
  setLayer(layer) {
    if (!this.built) return;
    const showO = layer === 'organs', showS = layer === 'skeleton' || layer === 'organs';
    this.organs.forEach(o => { o.holder.visible = showO && (!o.sex || o.sex === STATE.sex); });
    this.bones.forEach(b => { b.mesh.visible = showS; b.mat.opacity = layer === 'organs' ? .35 : 1; b.mat.transparent = layer === 'organs'; b.mat.depthWrite = layer !== 'organs'; });
  },
  highlight(ids) {
    const set = new Set(ids || []);
    const t = performance.now() / 1000;
    this.organs.forEach(o => {
      const on = set.has(o.id) || set.has(o.part);
      if (o.les.uLesK.value > 0) { o.mat.emissive.setRGB(0, 0, 0); return; }
      o.mat.emissive.setRGB(on ? .5 : 0, on ? .28 : 0, on ? .05 : 0).multiplyScalar(on ? (.55 + .2 * Math.sin(t * 3)) * CU.uInvExpo.value : 0);
    });
  },
  update(dt) {
    if (!this.built) return;
    this.explode = damp(this.explode, STATE.explode, 3, dt);
    const e = easeInOut(clamp(this.explode, 0, 1));
    this.organs.forEach(o => { o.holder.position.copy(o.dir).multiplyScalar(e * .55); });
  },
  /* section plane in the camel's own frame: sagittal (keep the right half) or transverse at x */
  setSection(kind, x, camel) {
    const pl = this.clip[0];
    if (!kind) { pl.set(new V3(-1, 0, 0), 99); }
    else {
      const g = camel.group; g.updateMatrixWorld();
      const n = kind === 'sagittal' ? new V3(0, 0, -1) : new V3(-1, 0, 0), p = kind === 'sagittal' ? new V3(0, 0, x) : new V3(x, 0, 0);
      pl.setFromNormalAndCoplanarPoint(n, p).applyMatrix4(g.matrixWorld);
    }
  },
  anchor(id, out = new V3()) {
    const o = this.organs.find(q => q.id === id); if (!o) return null;
    return o.mesh.localToWorld(out.copy(o.center));
  },
};

export { ANAT };
