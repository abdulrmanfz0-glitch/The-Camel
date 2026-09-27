/* ════════════════════════════════════════════════════════════════
   the dromedary, sculpted in signed-distance primitives
   metres · +X forward · +Y up · +Z her left side · ground at y = 0
   Adult female ≈ 1.85 m at the withers, ≈ 2.1 m at the top of the hump.
   ════════════════════════════════════════════════════════════════ */
const REG = { body: 0, head: 1, neck: 2, hump: 3, fore: 4, hind: 5, foot: 6, pad: 7, tail: 8, udder: 9, eye: 10, muzzle: 11, ear: 12, belly: 13, foreR: 14, hindR: 15, footR: 16, padR: 17 };
const s2l = c => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
const hexLin = h => { const n = parseInt(h.slice(1), 16); return [s2l((n >> 16 & 255) / 255), s2l((n >> 8 & 255) / 255), s2l((n & 255) / 255)]; };

/* coat and skin tags: colour (sRGB authored), hair length factor */
const CAMEL_TAGS = {
  coat:     { hex: '#b08457', hair: 1.0 },
  coatDark: { hex: '#8f6742', hair: 2.1 },
  coatLite: { hex: '#c7a57f', hair: 0.9 },
  leg:      { hex: '#b8956e', hair: 0.45 },
  face:     { hex: '#a27d56', hair: 0.2 },
  ear:      { hex: '#a07b56', hair: 0.35 },
  muzzle:   { hex: '#a4896d', hair: 0.2 },
  lipLine:  { hex: '#4a3d35', hair: 0.0 },
  skin:     { hex: '#4a3b31', hair: 0.05 },
  pad:      { hex: '#6a5d53', hair: 0.0 },
  sole:     { hex: '#5f5249', hair: 0.1 },
  nail:     { hex: '#3b332d', hair: 0.0 },
  tuft:     { hex: '#5b4029', hair: 2.8 },
  udder:    { hex: '#76604f', hair: 0.1 },
  earIn:    { hex: '#5a473a', hair: 0.6 },
  throat:   { hex: '#946d47', hair: 1.9 },
};
const TAG_NAMES = Object.keys(CAMEL_TAGS);

/* life stages: proportions relative to the adult sculpt.
   body/leg/neck/head scale factors, hump scale (x, y, z), coat length, voxel scale */
const STAGES = {
  newborn:  { sB: .43, sL: .66, sN: .47, sH: .58, face: .86, hump: [.6, .3, .7], hair: 2.1, vox: .62, tint: [1.07, 1.06, 1.05], plainHump: true },
  juvenile: { sB: .78, sL: .88, sN: .8, sH: .84, face: .95, hump: [.75, .55, .8], hair: 1.35, vox: .85, tint: [1.03, 1.02, 1.0], plainHump: true },
  adult:    { sB: 1, sL: 1, sN: 1, sH: 1, face: 1, hump: [1, 1, 1], hair: 1, vox: 1, tint: [1, 1, 1] },
  old:      { sB: 1, sL: 1, sN: .98, sH: 1, face: 1, hump: [.92, .72, .94], hair: .85, vox: 1, tint: [.93, .92, .92], old: true },
};

function rotInv(rx = 0, ry = 0, rz = 0) {            // degrees → inverse rotation (world offset → local), R = Rz·Ry·Rx
  const [a, b, c] = [rx, ry, rz].map(v => v * Math.PI / 180);
  const cx = Math.cos(a), sx = Math.sin(a), cy = Math.cos(b), sy = Math.sin(b), cz = Math.cos(c), sz = Math.sin(c);
  const R = [
    cz * cy, cz * sy * sx - sz * cx, cz * sy * cx + sz * sx,
    sz * cy, sz * sy * sx + cz * cx, sz * sy * cx - cz * sx,
    -sy, cy * sx, cy * cx];
  return [R[0], R[3], R[6], R[1], R[4], R[7], R[2], R[5], R[8]];
}

function camelSpec(stageName = 'adult', quality = 1) {
  const ST = STAGES[stageName] || STAGES.adult;
  const prims = [], bones = [], boneIx = {};
  let G = 'body', RG = REG.body;
  const T = n => TAG_NAMES.indexOf(n);
  const E = (c, r, o = {}) => prims.push(Object.assign({ t: 0, c: c.slice(), r: r.slice(), g: G, reg: RG }, o, o.tag ? { tag: T(o.tag) } : { tag: T('coat') }));
  const C = (a, b, ra, rb, o = {}) => prims.push(Object.assign({ t: 1, a: a.slice(), b: b.slice(), ra, rb, g: G, reg: RG }, o, o.tag ? { tag: T(o.tag) } : { tag: T('coat') }));
  const B = (name, parent, p, g) => { boneIx[name] = bones.length; bones.push({ name, parent, p: p.slice(), g: g || G }); };
  const anchors = {};
  const A = (name, p, bone, g) => { anchors[name] = { p: p.slice(), bone, g: g || G }; };

  /* ───── skeleton (rest pose) ───── */
  G = 'body';
  B('root', null, [0.02, 1.45, 0]);
  B('pelvis', 'root', [-0.46, 1.52, 0]);
  B('chest', 'root', [0.42, 1.5, 0]);
  G = 'hump'; B('hump', 'root', [-0.04, 1.8, 0]); A('humpTop', [-0.06, 2.12, 0], 'hump'); A('humpCore', [-0.05, 1.86, 0], 'hump');
  G = 'body'; A('sternalPad', [0.42, 0.985, 0], 'chest'); A('withers', [0.5, 1.86, 0], 'chest'); A('flank', [-0.2, 1.4, 0.34], 'root');
  A('tailTip', [-0.87, 0.93, 0], 'tail2', 'tail');
  G = 'neck';
  const NECK = [[0.64, 1.53, 0], [0.92, 1.46, 0], [1.18, 1.44, 0], [1.4, 1.53, 0], [1.55, 1.76, 0], [1.62, 2.0, 0]];
  B('neck0', 'chest', NECK[1]); B('neck1', 'neck0', NECK[2]); B('neck2', 'neck1', NECK[3]); B('neck3', 'neck2', NECK[4]);
  G = 'head';
  const POLL = [1.63, 2.05, 0], HEAD_PITCH = -17 * Math.PI / 180;
  const H = (u, v, w = 0) => {                       // head-local (u forward along the face, v up, w left) → world
    const f = ST.face;
    const uu = u * (u > 0.12 ? f : 1) + (u > 0.12 ? 0.12 * (1 - f) : 0);
    const c = Math.cos(HEAD_PITCH), s = Math.sin(HEAD_PITCH);
    return [POLL[0] + uu * c - v * s, POLL[1] + uu * s + v * c, w];
  };
  B('head', 'neck3', POLL); B('jaw', 'head', H(0.1, -0.1)); B('lip', 'head', H(0.47, -0.07));
  B('earL', 'head', H(-0.02, 0.1, 0.07)); B('earR', 'head', H(-0.02, 0.1, -0.07));
  for (const [sd, S] of [[1, 'L'], [-1, 'R']]) {
    A('eye' + S, H(0.13, 0.03, 0.09 * sd), 'head');
    A('eyeFwd' + S, H(0.13 + 0.45, 0.03 + 0.1, 0.094 * sd + 0.9 * sd), 'head');     // a point the eye looks towards (sets its axis)
    A('nostril' + S, H(0.505, -0.002, 0.036 * sd), 'head');
    A('earTip' + S, H(-0.03, 0.15, 0.1 * sd), 'ear' + S);
  }
  A('mouth', H(0.47, -0.13), 'jaw'); A('lip', H(0.575, -0.09), 'lip'); A('chin', H(0.47, -0.2), 'jaw');
  A('brain', H(0.06, 0.02), 'head'); A('turbinates', H(0.38, -0.03), 'head');
  G = 'tail';
  B('tail0', 'pelvis', [-0.8, 1.6, 0]); B('tail1', 'tail0', [-0.86, 1.36, 0]); B('tail2', 'tail1', [-0.87, 1.12, 0]);
  const FORE = { scap: [0.6, 1.74, 0.17], sh: [0.77, 1.34, 0.2], el: [0.59, 1.1, 0.235], ca: [0.63, 0.63, 0.215], fe: [0.64, 0.19, 0.21], to: [0.72, 0.05, 0.21] };
  const HIND = { hip: [-0.52, 1.46, 0.165], st: [-0.34, 0.99, 0.2], ho: [-0.6, 0.58, 0.185], fe: [-0.565, 0.19, 0.185], to: [-0.495, 0.05, 0.185] };
  const zs = (p, s) => [p[0], p[1], p[2] * s];
  for (const [sd, S] of [[1, 'L'], [-1, 'R']]) {
    G = 'fore' + S;
    A('elbowPad' + S, zs([0.53, 1.06, 0.285], sd), 'rad' + S); A('carpalPad' + S, zs([0.7, 0.625, 0.215], sd), 'mc' + S); A('footF' + S, zs([0.72, 0.01, 0.21], sd), 'toe' + S);
    B('scap' + S, 'chest', zs(FORE.scap, sd)); B('hum' + S, 'scap' + S, zs(FORE.sh, sd)); B('rad' + S, 'hum' + S, zs(FORE.el, sd));
    B('mc' + S, 'rad' + S, zs(FORE.ca, sd)); B('pas' + S, 'mc' + S, zs(FORE.fe, sd)); B('toe' + S, 'pas' + S, zs(FORE.to, sd));
    G = 'hind' + S;
    A('stiflePad' + S, zs([-0.28, 0.97, 0.245], sd), 'tib' + S); A('footH' + S, zs([-0.5, 0.01, 0.185], sd), 'htoe' + S);
    B('fem' + S, 'pelvis', zs(HIND.hip, sd)); B('tib' + S, 'fem' + S, zs(HIND.st, sd)); B('mt' + S, 'tib' + S, zs(HIND.ho, sd));
    B('hpas' + S, 'mt' + S, zs(HIND.fe, sd)); B('htoe' + S, 'hpas' + S, zs(HIND.to, sd));
  }
  const bn = n => boneIx[n];

  /* ───── trunk: a deep, narrow chest, a barrel that tucks up into the flank, a sloping croup ───── */
  G = 'body'; RG = REG.body;
  E([0.34, 1.42, 0], [0.44, 0.37, 0.25], { k: 0.15, bone: bn('chest'), s: 0.12 });                      // thorax
  E([0.48, 1.6, 0], [0.24, 0.2, 0.14], { k: 0.14, bone: bn('chest'), s: 0.1 });                         // withers
  E([0.66, 1.38, 0], [0.18, 0.24, 0.19], { k: 0.12, bone: bn('chest'), s: 0.08 });                       // brisket / point of chest
  E([0.4, 1.1, 0], [0.24, 0.1, 0.14], { k: 0.14, bone: bn('chest'), s: 0.08 });                          // keel down to the pad
  RG = REG.belly;
  E([-0.1, 1.46, 0], [0.42, 0.3, 0.3], { k: 0.18, bone: bn('root'), s: 0.14, m: rotInv(0, 0, 7) });    // barrel, tucked up towards the flank
  E([0.08, 1.2, 0], [0.26, 0.1, 0.2], { k: 0.14, bone: bn('root'), s: 0.12, tag: 'coatLite' });       // belly floor
  RG = REG.body;
  E([-0.46, 1.59, 0], [0.3, 0.21, 0.2], { k: 0.16, bone: bn('pelvis'), s: 0.1 });                      // loin and croup
  E([-0.67, 1.55, 0], [0.15, 0.18, 0.15], { k: 0.12, bone: bn('pelvis'), s: 0.08 });                   // buttock
  E([-0.3, 1.72, 0], [0.26, 0.09, 0.14], { k: 0.14, bone: bn('pelvis'), s: 0.1 });                      // loin top
  for (const sd of [1, -1]) {
    E([-0.44, 1.7, 0.165 * sd], [0.055, 0.045, 0.045], { k: 0.07, bone: bn('pelvis'), s: 0.06, id: 'coxa' });  // hip point (tuber coxae)
    E([-0.76, 1.6, 0.085 * sd], [0.045, 0.045, 0.045], { k: 0.06, bone: bn('pelvis'), s: 0.06, id: 'ischii' }); // pin bone
    E([0.77, 1.33, 0.155 * sd], [0.055, 0.065, 0.045], { k: 0.14, bone: bn('chest'), s: 0.06 });          // point of shoulder
  }
  RG = REG.pad;
  E([0.42, 1.035, 0], [0.19, 0.05, 0.12], { k: 0.05, bone: bn('chest'), tag: 'pad', cs: 0.006, s: 0.08, id: 'sternalPad' });
  RG = REG.udder;
  E([-0.3, 1.1, 0], [0.12, 0.065, 0.09], { k: 0.07, bone: bn('root'), tag: 'udder', cs: 0.02, id: 'udder' });
  for (const [dx, dz] of [[0.05, 0.042], [0.05, -0.042], [-0.05, 0.042], [-0.05, -0.042]]) C([-0.3 + dx, 1.07, dz], [-0.3 + dx * 1.2, 1.0, dz * 1.15], 0.012, 0.009, { k: 0.015, bone: bn('root'), tag: 'udder', cs: 0.005, id: 'teat' });

  /* ───── hump: a single fat store rising behind the withers, falling to the loin ───── */
  G = 'hump'; RG = REG.hump;
  [
    E([-0.06, 1.82, 0], [0.34, 0.34, 0.2], { k: 0.15, bone: bn('hump'), tag: 'coatDark', cs: 0.05, s: 0.1, id: 'humpDome', m: rotInv(0, 0, -7) }),
    E([0.24, 1.75, 0], [0.24, 0.09, 0.15], { k: 0.17, bone: bn('hump'), tag: 'coat', cs: 0.05, s: 0.1, id: 'humpFront', m: rotInv(0, 0, 14) }),
    E([-0.34, 1.72, 0], [0.18, 0.09, 0.15], { k: 0.16, bone: bn('hump'), tag: 'coat', cs: 0.05, s: 0.1, id: 'humpBack' }),
  ];

  /* ───── neck: long, deep and thin from side to side, an S from the chest to the poll ───── */
  G = 'neck'; RG = REG.neck;
  const NR = [0.2, 0.162, 0.132, 0.113, 0.1, 0.09];
  const NS = [0.58, 0.6, 0.64, 0.7, 0.76, 0.82];
  const NB = ['chest', 'neck0', 'neck1', 'neck2', 'neck3'];
  for (let i = 0; i < NECK.length - 1; i++) {
    C(NECK[i], NECK[i + 1], NR[i], NR[i + 1], { k: i ? 0.07 : 0.14, bone: bn(NB[i]), sq: [0, 0, 1, (NS[i] + NS[i + 1]) / 2], s: 0.07 });
  }
  C([0.95, 1.58, 0], [1.3, 1.6, 0], 0.052, 0.046, { k: 0.1, bone: bn('neck1'), tag: 'coatDark', sq: [0, 0, 1, 0.6], s: 0.08, cs: 0.03 });   // crest hair
  C([0.9, 1.32, 0], [1.3, 1.37, 0], 0.058, 0.044, { k: 0.1, bone: bn('neck1'), tag: 'throat', sq: [0, 0, 1, 0.66], s: 0.08, cs: 0.03 });   // ventral neck fringe
  E([1.5, 1.86, 0], [0.05, 0.065, 0.045], { k: 0.06, bone: bn('neck3'), tag: 'throat', s: 0.05 });                                        // larynx

  /* ───── head: a long face, rounded cranium, overhanging split upper lip, drooping lower lip ───── */
  G = 'head'; RG = REG.head;
  const hb = bn('head'), jb = bn('jaw'), lb = bn('lip');
  E(H(0.08, 0.0), [0.125, 0.105, 0.094], { k: 0.06, bone: hb, tag: 'face' });                              // cranium
  C(H(0.1, 0.035), H(0.46, 0.0), 0.058, 0.042, { k: 0.06, bone: hb, tag: 'face', sq: [0, 0, 1, 0.84] });   // nasal bridge
  C(H(0.2, 0.05), H(0.42, 0.02), 0.022, 0.016, { k: 0.04, bone: hb, tag: 'face' });                         // the slight Roman convexity of the nose
  for (const sd of [1, -1]) {
    E(H(0.2, -0.055, 0.045 * sd), [0.12, 0.058, 0.034], { k: 0.05, bone: hb, tag: 'face', m: rotInv(0, 0, -8) });  // cheek / masseter
    E(H(0.34, -0.05, 0.036 * sd), [0.14, 0.05, 0.028], { k: 0.05, bone: hb, tag: 'face', m: rotInv(0, 0, -6) });   // the flat side of the face down to the muzzle
    RG = REG.eye;
    E(H(0.118, 0.07, 0.078 * sd), [0.056, 0.026, 0.036], { k: 0.035, bone: hb, tag: 'face' });                  // brow ridge (heavy upper lid)
    E(H(0.13, 0.03, 0.084 * sd), [0.035, 0.031, 0.027], { k: 0.03, bone: hb, tag: 'face', cs: 0.006 });         // orbit
    RG = REG.head;
  }
  RG = REG.muzzle;
  E(H(0.455, -0.04), [0.076, 0.05, 0.04], { k: 0.045, bone: hb, tag: 'muzzle' });                          // muzzle
  C(H(0.08, -0.092), H(0.44, -0.118), 0.046, 0.026, { k: 0.045, bone: jb, tag: 'face', sq: [0, 0, 1, 0.72] }); // mandible
  for (const sd of [1, -1]) E(H(0.505, -0.084, 0.021 * sd), [0.042, 0.03, 0.022], { k: 0.026, bone: lb, tag: 'muzzle', cs: 0.01 });  // split upper lip
  E(H(0.44, -0.116), [0.07, 0.004, 0.046], { k: 0.003, bone: jb, tag: 'lipLine', cs: 0.004 });
  for (const sd of [1, -1]) E(H(0.5, -0.01, 0.03 * sd), [0.028, 0.0035, 0.006], { k: 0.002, bone: hb, tag: 'lipLine', cs: 0.003, m: rotInv(20 * sd, -38 * sd, -22) });   // dark inside the nostril slits
  E(H(0.482, -0.14), [0.062, 0.026, 0.035], { k: 0.026, bone: jb, tag: 'muzzle', id: 'lowerLip' });        // pendulous lower lip
  E(H(0.34, -0.148), [0.08, 0.03, 0.03], { k: 0.045, bone: jb, tag: 'face' });                          // chin line
  G = 'head'; RG = REG.ear;
  for (const [sd, S] of [[1, 'L'], [-1, 'R']]) {
    C(H(0.012, 0.07, 0.066 * sd), H(-0.024, 0.13, 0.094 * sd), 0.022, 0.02, { k: 0.03, bone: bn('ear' + S), tag: 'ear', sq: [0.55, 0.15, 0.82 * sd, 0.5], s: 0.02 });
  }
  // subtractions (after all unions)
  RG = REG.muzzle;
  E(H(0.565, -0.09), [0.05, 0.062, 0.0055], { op: 1, k: 0.012, bone: lb, id: 'lipSplit' });
  for (const sd of [1, -1]) {
    E(H(0.505, -0.004, 0.033 * sd), [0.03, 0.004, 0.008], { op: 1, k: 0.004, bone: hb, m: rotInv(20 * sd, -38 * sd, -22), id: 'nostril' });
    RG = REG.eye;
    E(H(0.13, 0.028, 0.104 * sd), [0.022, 0.019, 0.016], { op: 1, k: 0.01, bone: hb, id: 'socket' });
    RG = REG.ear;
    C(H(0.008, 0.09, 0.08 * sd), H(-0.018, 0.135, 0.1 * sd), 0.011, 0.008, { op: 1, k: 0.006, bone: bn('ear' + (sd > 0 ? 'L' : 'R')), sq: [0.55, 0.15, 0.82 * sd, 0.42] });
  }

  /* ───── tail ───── */
  G = 'tail'; RG = REG.tail;
  C([-0.78, 1.62, 0], [-0.86, 1.36, 0], 0.044, 0.032, { k: 0.06, bone: bn('tail0') });
  C([-0.86, 1.36, 0], [-0.87, 1.12, 0], 0.032, 0.024, { k: 0.03, bone: bn('tail1') });
  C([-0.87, 1.12, 0], [-0.87, 0.98, 0], 0.026, 0.02, { k: 0.03, bone: bn('tail2'), tag: 'tuft', cs: 0.04 });
  E([-0.875, 1.0, 0], [0.026, 0.08, 0.022], { k: 0.04, bone: bn('tail2'), tag: 'tuft', cs: 0.04 });

  /* ───── legs: muscle gathered high, then bone and tendon; broad soft pads ───── */
  for (const [sd, S] of [[1, 'L'], [-1, 'R']]) {
    const z = (p, dz = 0) => [p[0], p[1], (p[2] + dz) * sd];
    const F = FORE, rx = a => a * sd, rr = (l, r) => sd > 0 ? l : r;
    G = 'fore' + S; RG = rr(REG.fore, REG.foreR);
    E(z([0.67, 1.52, 0.17]), [0.14, 0.25, 0.062], { k: 0.15, bone: bn('scap' + S), m: rotInv(rx(4), 0, -22), s: 0.08 });          // scapula and its muscles
    C(z(F.sh), z(F.el), 0.095, 0.07, { k: 0.08, bone: bn('hum' + S), s: 0.05 });                                                      // upper arm
    E(z([0.6, 1.24, 0.195]), [0.12, 0.11, 0.062], { k: 0.14, bone: bn('hum' + S), s: 0.05 });                                        // triceps
    C(z(F.el), z(F.ca, 0), 0.062, 0.033, { k: 0.05, bone: bn('rad' + S), tag: 'leg', s: 0.04 });                                     // forearm
    E(z([0.608, 0.99, 0.22]), [0.058, 0.15, 0.05], { k: 0.09, bone: bn('rad' + S), tag: 'leg', s: 0.04 });                          // forearm muscles, tapering to tendon
    E(z([0.632, 0.632, 0.215]), [0.034, 0.05, 0.046], { k: 0.035, bone: bn('mc' + S), tag: 'leg', s: 0.022, id: 'carpus' });        // carpus: flat-fronted, wider than deep
    E(z([0.6, 0.64, 0.215]), [0.02, 0.028, 0.022], { k: 0.02, bone: bn('mc' + S), tag: 'leg', s: 0.022 });                          // accessory carpal bone behind
    C(z(F.ca, -0.002), z(F.fe), 0.03, 0.027, { k: 0.02, bone: bn('mc' + S), tag: 'leg', s: 0.025 });                                  // cannon
    E(z([0.606, 0.4, 0.21]), [0.019, 0.17, 0.021], { k: 0.022, bone: bn('mc' + S), tag: 'leg', s: 0.025, id: 'tendonF' });          // flexor tendons
    E(z([0.644, 0.185, 0.21]), [0.036, 0.038, 0.042], { k: 0.04, bone: bn('pas' + S), tag: 'leg', s: 0.022 });                       // fetlock
    for (const t of [1, -1]) C(z([0.66, 0.16, 0.21 + 0.028 * t]), z([0.735, 0.062, 0.21 + 0.043 * t]), 0.026, 0.024, { k: 0.016, bone: bn('pas' + S), tag: 'leg', s: 0.025 });
    RG = rr(REG.foot, REG.footR);
    E(z([0.712, 0.036, 0.21]), [0.112, 0.04, 0.094], { k: 0.028, bone: bn('toe' + S), tag: 'leg', floor: 0.0, s: 0.03, id: 'padF', cs: 0.01 });      // the cushion
    for (const t of [1, -1]) E(z([0.755, 0.062, 0.21 + 0.036 * t]), [0.06, 0.03, 0.034], { k: 0.022, bone: bn('toe' + S), tag: 'leg', s: 0.03 });  // the two toes on top
    E(z([0.712, 0.012, 0.21]), [0.116, 0.013, 0.097], { k: 0.012, bone: bn('toe' + S), tag: 'sole', floor: 0.0, s: 0.03, cs: 0.006 });
    for (const t of [1, -1]) E(z([0.82, 0.045, 0.21 + 0.036 * t]), [0.018, 0.012, 0.014], { k: 0.008, bone: bn('toe' + S), tag: 'nail', cs: 0.004, s: 0.02, m: rotInv(0, 0, -25) });
    RG = rr(REG.pad, REG.padR);
    E(z([0.53, 1.07, 0.24]), [0.05, 0.043, 0.032], { k: 0.022, bone: bn('rad' + S), tag: 'pad', cs: 0.005, s: 0.03, id: 'elbowPad' });
    E(z([0.662, 0.625, 0.215]), [0.014, 0.054, 0.044], { k: 0.016, bone: bn('mc' + S), tag: 'pad', cs: 0.005, s: 0.02, id: 'carpalPad' });
    RG = rr(REG.foot, REG.footR);
    E(z([0.875, 0.058, 0.21]), [0.075, 0.048, 0.005], { op: 1, k: 0.01, bone: bn('toe' + S), id: 'cleft' });

    const Hd = HIND;
    G = 'hind' + S; RG = rr(REG.hind, REG.hindR);
    E(z([-0.555, 1.46, 0.14]), [0.2, 0.2, 0.08], { k: 0.16, bone: bn('fem' + S), s: 0.08 });                                          // hip and gluteals
    C(z(Hd.hip), z(Hd.st), 0.115, 0.064, { k: 0.08, bone: bn('fem' + S), s: 0.05 });                                                  // thigh
    E(z([-0.575, 1.3, 0.155]), [0.085, 0.19, 0.064], { k: 0.13, bone: bn('fem' + S), s: 0.05 });                                     // hamstrings
    E(z([-0.405, 1.2, 0.175]), [0.085, 0.17, 0.058], { k: 0.12, bone: bn('fem' + S), s: 0.05 });                                     // quadriceps
    E(z(Hd.st), [0.05, 0.052, 0.048], { k: 0.05, bone: bn('tib' + S), tag: 'leg', s: 0.03 });                                      // stifle
    C(z(Hd.st), z(Hd.ho), 0.06, 0.034, { k: 0.045, bone: bn('tib' + S), tag: 'leg', s: 0.04 });                                     // gaskin
    E(z([-0.47, 0.84, 0.186]), [0.06, 0.12, 0.045], { k: 0.05, bone: bn('tib' + S), tag: 'leg', s: 0.04 });                          // gastrocnemius
    E(z(Hd.ho), [0.042, 0.047, 0.037], { k: 0.045, bone: bn('mt' + S), tag: 'leg', s: 0.022, id: 'hock' });                        // hock
    E(z([-0.647, 0.61, 0.185]), [0.026, 0.042, 0.025], { k: 0.025, bone: bn('mt' + S), tag: 'leg', s: 0.022 });                    // point of hock
    C(z(Hd.ho, -0.002), z(Hd.fe), 0.029, 0.026, { k: 0.02, bone: bn('mt' + S), tag: 'leg', s: 0.025 });                              // hind cannon
    E(z([-0.593, 0.38, 0.185]), [0.019, 0.155, 0.02], { k: 0.022, bone: bn('mt' + S), tag: 'leg', s: 0.025, id: 'tendonH' });
    E(z([-0.56, 0.185, 0.185]), [0.035, 0.037, 0.04], { k: 0.04, bone: bn('hpas' + S), tag: 'leg', s: 0.022 });
    for (const t of [1, -1]) C(z([-0.55, 0.16, 0.185 + 0.026 * t]), z([-0.495, 0.058, 0.185 + 0.038 * t]), 0.025, 0.023, { k: 0.016, bone: bn('hpas' + S), tag: 'leg', s: 0.025 });
    RG = rr(REG.foot, REG.footR);
    E(z([-0.498, 0.034, 0.185]), [0.098, 0.037, 0.083], { k: 0.026, bone: bn('htoe' + S), tag: 'leg', floor: 0.0, s: 0.03, id: 'padH', cs: 0.01 });
    for (const t of [1, -1]) E(z([-0.458, 0.058, 0.185 + 0.032 * t]), [0.055, 0.028, 0.031], { k: 0.02, bone: bn('htoe' + S), tag: 'leg', s: 0.03 });
    E(z([-0.498, 0.012, 0.185]), [0.102, 0.012, 0.086], { k: 0.012, bone: bn('htoe' + S), tag: 'sole', floor: 0.0, s: 0.03, cs: 0.006 });
    for (const t of [1, -1]) E(z([-0.405, 0.044, 0.185 + 0.032 * t]), [0.017, 0.011, 0.013], { k: 0.009, bone: bn('htoe' + S), tag: 'nail', cs: 0.004, s: 0.02 });
    RG = rr(REG.pad, REG.padR);
    E(z([-0.285, 0.97, 0.2]), [0.032, 0.046, 0.036], { k: 0.018, bone: bn('tib' + S), tag: 'pad', cs: 0.005, s: 0.03, id: 'stiflePad' });
    RG = rr(REG.foot, REG.footR);
    E(z([-0.37, 0.052, 0.185]), [0.065, 0.043, 0.005], { op: 1, k: 0.01, bone: bn('htoe' + S), id: 'cleft' });
  }

  /* ───── old age: sharper bones, drooping lip, sunken flanks ───── */
  if (ST.old) for (const p of prims) {
    if (p.id === 'coxa' || p.id === 'ischii') { p.r = p.r.map(v => v * 1.35); p.k *= .6; }
    if (p.id === 'lowerLip') { p.c[1] -= .014; p.r[1] *= 1.2; }
  }

  if (ST.plainHump) for (const p of prims) if (p.id && p.id.startsWith('hump')) p.tag = T('coat');

  /* ───── proportions for the life stage ───── */
  const c0 = [0.02, 1.45, 0];
  const aF = FORE.sh, aH = HIND.hip, aN = NECK[0], aT = [-0.8, 1.6, 0], aHump = [-0.04, 1.7, 0];
  const bodyT = p => [c0[0] + ST.sB * (p[0] - c0[0]), c0[1] + ST.sB * (p[1] - c0[1]), c0[2] + ST.sB * (p[2] - c0[2])];
  const hipB = bodyT([aH[0], aH[1], 0]);
  const lift = ST.sL * aH[1] - hipB[1];
  const shB = bodyT([aF[0], aF[1], 0]);
  const sLyF = (shB[1] + lift) / aF[1];
  const up = p => [p[0], p[1] + lift, p[2]];
  const neckB = up(bodyT(aN));
  const pollN = [neckB[0] + ST.sN * (POLL[0] - aN[0]), neckB[1] + ST.sN * (POLL[1] - aN[1]), 0];
  const X = {
    body: { f: p => up(bodyT(p)), s: ST.sB },
    hump: { f: p => { const q = up(bodyT(aHump)); const h = ST.hump; return [q[0] + ST.sB * h[0] * (p[0] - aHump[0]), q[1] + ST.sB * h[1] * (p[1] - aHump[1]), q[2] + ST.sB * h[2] * (p[2] - aHump[2])]; }, s: ST.sB, v: ST.hump },
    neck: { f: p => [neckB[0] + ST.sN * (p[0] - aN[0]), neckB[1] + ST.sN * (p[1] - aN[1]), ST.sN * p[2]], s: ST.sN },
    head: { f: p => [pollN[0] + ST.sH * (p[0] - POLL[0]), pollN[1] + ST.sH * (p[1] - POLL[1]), ST.sH * p[2]], s: ST.sH },
    tail: { f: p => { const q = up(bodyT(aT)); return [q[0] + ST.sB * (p[0] - aT[0]), q[1] + ST.sL * (p[1] - aT[1]), q[2] + ST.sB * p[2]]; }, s: ST.sB },
  };
  for (const [S, sd] of [['L', 1], ['R', -1]]) {
    const A = [aF[0], aF[1], aF[2] * sd], Ab = up(bodyT(A)), Hh = [aH[0], aH[1], aH[2] * sd], Hb = up(bodyT(Hh));
    X['fore' + S] = { f: p => [Ab[0] + ST.sL * (p[0] - A[0]), Ab[1] + sLyF * (p[1] - A[1]), Ab[2] + ST.sL * (p[2] - A[2])], s: ST.sL };
    X['hind' + S] = { f: p => [Hb[0] + ST.sL * (p[0] - Hh[0]), Hb[1] + ST.sL * (p[1] - Hh[1]), Hb[2] + ST.sL * (p[2] - Hh[2])], s: ST.sL };
  }
  for (const p of prims) {
    const x = X[p.g], s = x.s;
    if (p.t === 0) {
      p.c = x.f(p.c);
      p.r = x.v ? p.r.map((r, i) => r * s * x.v[i]) : p.r.map(r => r * s);
    } else { p.a = x.f(p.a); p.b = x.f(p.b); p.ra *= s; p.rb *= s; }
    p.k *= s; if (p.s) p.s *= s; if (p.cs) p.cs *= s;
    if (p.floor !== undefined) p.floor = x.f([0, p.floor, 0])[1];
  }
  for (const b of bones) b.p = X[b.g].f(b.p);
  for (const k in anchors) anchors[k].p = X[anchors[k].g].f(anchors[k].p);

  /* ───── morph variants ───── */
  const clone = () => prims.map(p => JSON.parse(JSON.stringify(p)));
  const variants = [];
  const hs = ST.sB;
  { // hump full: fat reserves topped up
    const V = clone(), ch = [];
    V.forEach((p, i) => { if (p.id && p.id.startsWith('hump')) { p.r = p.r.map((r, j) => r * [1.08, 1.2, 1.12][j]); p.c[1] += 0.035 * hs; ch.push(i); } });
    variants.push({ name: 'humpFull', prims: V, changed: ch });
  }
  { // hump spent: slumps, shrinks and falls to one side
    const V = clone(), ch = [];
    V.forEach((p, i) => {
      if (!p.id || !p.id.startsWith('hump')) return;
      p.r = p.r.map((r, j) => r * [0.9, 0.36, 0.86][j]); p.c[1] -= (p.id === 'humpDome' ? 0.13 : 0.05) * hs;
      if (p.id === 'humpDome') { p.c[2] += 0.07 * hs; p.m = rotInv(24, 0, 0); p.c[1] += 0.01 * hs; }
      ch.push(i);
    });
    variants.push({ name: 'humpEmpty', prims: V, changed: ch, margin: 0.2 });
  }
  { // thin: dehydrated / underfed — tucked flank, sharper hips, visible ribs
    const V = clone(), ch = [];
    V.forEach((p, i) => {
      if (p.reg === REG.belly) { p.r = p.r.map((r, j) => r * [1, 0.9, 0.88][j]); p.c[1] += 0.03 * hs; ch.push(i); }
      if (p.id === 'coxa' || p.id === 'ischii') { p.r = p.r.map(r => r * 1.3); p.k *= 0.5; ch.push(i); }
    });
    for (const sd of [1, -1]) for (let r = 0; r < 6; r++) {
      const x = 0.24 - r * 0.1;
      V.push({ t: 1, a: X.body.f([x + 0.02, 1.72, 0.22 * sd]), b: X.body.f([x - 0.06, 1.2, 0.27 * sd]), ra: 0.018 * hs, rb: 0.016 * hs, op: 1, k: 0.03 * hs, g: 'body', reg: REG.body, tag: T('coat'), bone: bn('chest') });
      ch.push(V.length - 1);
    }
    variants.push({ name: 'thin', prims: V, changed: ch, margin: 0.1 });
  }
  { // male: no udder; the scrotum high in the perineum and the prepuce under the belly
    const V = clone(), ch = [];
    V.forEach((p, i) => { if (p.id === 'udder' || p.id === 'teat') { if (p.t === 0) { p.r = p.r.map(r => r * .2); p.c[1] += .06 * hs; } else { p.ra *= .2; p.rb *= .2; p.a[1] += .08 * hs; p.b[1] += .1 * hs; } ch.push(i); } });
    for (const sd of [1, -1]) { V.push({ t: 0, c: X.body.f([-0.79, 1.29, 0.03 * sd]), r: [0.05 * hs, 0.042 * hs, 0.034 * hs], k: 0.03 * hs, g: 'body', reg: REG.body, tag: T('coatLite'), bone: bn('pelvis') }); ch.push(V.length - 1); }
    V.push({ t: 0, c: X.body.f([-0.12, 1.13, 0]), r: [0.07 * hs, 0.035 * hs, 0.032 * hs], k: 0.04 * hs, g: 'body', reg: REG.belly, tag: T('coatLite'), bone: bn('root') }); ch.push(V.length - 1);
    variants.push({ name: 'male', prims: V, changed: ch, margin: 0.12, downRegion: REG.udder });
  }
  { // nostrils sealed against blowing sand
    const V = clone(), ch = [];
    V.forEach((p, i) => { if (p.id === 'nostril') { p.r = [p.r[0] * 0.9, p.r[1] * 0.2, p.r[2] * 0.3]; ch.push(i); } });
    variants.push({ name: 'nostrilClosed', prims: V, changed: ch, margin: 0.03 });
  }

  /* tags → linear colours with the stage tint */
  const tags = TAG_NAMES.map(n => {
    const t = CAMEL_TAGS[n], c = hexLin(n === 'muzzle' && ST.old ? '#bdb2a4' : t.hex);
    return { color: c.map((v, i) => v * ST.tint[i]), hair: t.hair * (t.hair > 0.3 ? ST.hair : 1), region: 0 };
  });

  // unions first, then subtractions (the field is evaluated in index order); keep morph indices consistent
  const order = prims.map((p, i) => i).sort((a, b) => (prims[a].op === 1) - (prims[b].op === 1) || a - b);
  const remap = new Map(order.map((o, n) => [o, n]));
  const reorder = arr => { const out = order.map(i => arr[i]); for (let i = prims.length; i < arr.length; i++) out.push(arr[i]); return out; };
  for (const v of variants) { v.prims = reorder(v.prims); v.changed = v.changed.map(i => i < prims.length ? remap.get(i) : i); }
  const P2 = reorder(prims);

  const vox = [0.0135, 0.0105, 0.0088][quality] * ST.vox;
  let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
  for (const p of P2) {
    if (p.op === 1) continue;
    const pts = p.t === 0 ? [[p.c, Math.max(...p.r)]] : [[p.a, p.ra], [p.b, p.rb]];
    for (const [c, r] of pts) for (let i = 0; i < 3; i++) { mn[i] = Math.min(mn[i], c[i] - r - p.k); mx[i] = Math.max(mx[i], c[i] + r + p.k); }
  }
  mn = mn.map(v => v - 3 * vox); mx = mx.map(v => v + 3 * vox); mn[1] = Math.max(mn[1], -2 * vox);
  return { stage: stageName, neck: NECK, neckR: NR, poll: POLL, headPitch: HEAD_PITCH, fore: FORE, hind: HIND, prims: P2, tags, bones, anchors, scale: { body: ST.sB, leg: ST.sL, neck: ST.sN, head: ST.sH }, variants, voxel: vox, bounds: { min: mn, max: mx }, ao: true };
}

export { hexLin, rotInv, camelSpec };
