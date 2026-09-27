/* ════════════════════════════════════════════════════════════════
   SDF kernel: sculpt with signed-distance primitives and smooth blends,
   polygonise with narrow-band surface nets, then derive skin weights,
   colour regions, ambient occlusion, thickness and morph targets.
   Runs inside a Web Worker (built from this function's source) and
   falls back to the main thread when workers are unavailable.
   Primitives are packed into a Float64Array so the hot loops stay monomorphic.
   ════════════════════════════════════════════════════════════════ */
function SDFKERNEL(scope) {
  'use strict';
  const sqrt = Math.sqrt, abs = Math.abs, max = Math.max, min = Math.min, exp = Math.exp;
  const ST = 44;   // stride of one packed primitive
  // 0 t · 1 op · 2 k · 3-5 centre · 6-8 radii (ra, rb for cones) · 9 hasM · 10-18 inverse rotation · 19 squash factor · 20-22 squash axis
  // 23 hasFloor · 24 floor · 25-27 a · 28-30 b−a · 31 l2 · 32 rr · 33 a2 · 34 il2 · 35 R · 36 Rk · 37 lipschitz · 38 tag · 39 bone · 40 σ weight · 41 σ colour · 42 region · 43 min radius

  function pack(prims) {
    const n = prims.length, P = new Float64Array(n * ST);
    for (let i = 0; i < n; i++) {
      const p = prims[i], o = i * ST;
      P[o] = p.t; P[o + 1] = p.op || 0; P[o + 2] = p.k || 0;
      let R;
      if (p.t === 1 || p.t === 2) {
        const ra = p.t === 2 ? p.r : p.ra, rb = p.t === 2 ? p.r : p.rb;
        const bx = p.b[0] - p.a[0], by = p.b[1] - p.a[1], bz = p.b[2] - p.a[2], l2 = bx * bx + by * by + bz * bz || 1e-9;
        P[o + 6] = ra; P[o + 7] = rb;
        P[o + 25] = p.a[0]; P[o + 26] = p.a[1]; P[o + 27] = p.a[2]; P[o + 28] = bx; P[o + 29] = by; P[o + 30] = bz;
        P[o + 31] = l2; P[o + 32] = ra - rb; P[o + 33] = l2 - (ra - rb) * (ra - rb); P[o + 34] = 1 / l2;
        P[o + 3] = (p.a[0] + p.b[0]) / 2; P[o + 4] = (p.a[1] + p.b[1]) / 2; P[o + 5] = (p.a[2] + p.b[2]) / 2;
        R = sqrt(l2) / 2 + max(ra, rb); P[o + 43] = min(ra, rb);
        P[o] = 1;
      } else {
        P[o + 3] = p.c[0]; P[o + 4] = p.c[1]; P[o + 5] = p.c[2];
        P[o + 6] = p.r[0]; P[o + 7] = p.r[1]; P[o + 8] = p.r[2];
        R = max(p.r[0], p.r[1], p.r[2]); P[o + 43] = min(p.r[0], p.r[1], p.r[2]);
        if (p.m) { P[o + 9] = 1; for (let j = 0; j < 9; j++) P[o + 10 + j] = p.m[j]; }
      }
      P[o + 37] = 1;
      if (p.sq) {
        const l = sqrt(p.sq[0] * p.sq[0] + p.sq[1] * p.sq[1] + p.sq[2] * p.sq[2]) || 1;
        P[o + 20] = p.sq[0] / l; P[o + 21] = p.sq[1] / l; P[o + 22] = p.sq[2] / l; P[o + 19] = 1 / p.sq[3] - 1;
        R = R / min(1, p.sq[3]); P[o + 37] = min(1, p.sq[3]);
      }
      if (p.floor !== undefined) { P[o + 23] = 1; P[o + 24] = p.floor; }
      P[o + 35] = R; P[o + 36] = R + P[o + 2] + 0.01;
      P[o + 38] = p.tag || 0; P[o + 39] = p.bone === undefined ? -1 : p.bone;
      P[o + 40] = p.s || 0.035; P[o + 41] = p.cs || 0.012; P[o + 42] = p.reg === undefined ? -1 : p.reg;
    }
    return P;
  }

  function dist(P, o, x, y, z) {
    const sf = P[o + 19];
    if (sf !== 0) {
      const s = ((x - P[o + 3]) * P[o + 20] + (y - P[o + 4]) * P[o + 21] + (z - P[o + 5]) * P[o + 22]) * sf;
      x += s * P[o + 20]; y += s * P[o + 21]; z += s * P[o + 22];
    }
    let d;
    if (P[o] === 0) {
      let px = x - P[o + 3], py = y - P[o + 4], pz = z - P[o + 5];
      if (P[o + 9] !== 0) {
        const a = P[o + 10] * px + P[o + 11] * py + P[o + 12] * pz, b = P[o + 13] * px + P[o + 14] * py + P[o + 15] * pz, c = P[o + 16] * px + P[o + 17] * py + P[o + 18] * pz;
        px = a; py = b; pz = c;
      }
      const rx = P[o + 6], ry = P[o + 7], rz = P[o + 8];
      const ax = px / rx, ay = py / ry, az = pz / rz, k0 = sqrt(ax * ax + ay * ay + az * az);
      const bx = ax / rx, by = ay / ry, bz = az / rz, k1 = sqrt(bx * bx + by * by + bz * bz);
      d = k1 > 1e-12 ? k0 * (k0 - 1) / k1 : -P[o + 43];
    } else {
      const bx = P[o + 28], by = P[o + 29], bz = P[o + 30], l2 = P[o + 31], rr = P[o + 32], a2 = P[o + 33], il2 = P[o + 34];
      const pax = x - P[o + 25], pay = y - P[o + 26], paz = z - P[o + 27];
      const yy = pax * bx + pay * by + paz * bz, zz = yy - l2;
      const qx = pax * l2 - bx * yy, qy = pay * l2 - by * yy, qz = paz * l2 - bz * yy;
      const x2 = qx * qx + qy * qy + qz * qz, y2 = yy * yy * l2, z2 = zz * zz * l2;
      const k = (rr > 0 ? 1 : rr < 0 ? -1 : 0) * rr * rr * x2;
      if ((zz > 0 ? a2 : zz < 0 ? -a2 : 0) * z2 > k) d = sqrt(x2 + z2) * il2 - P[o + 7];
      else if ((yy > 0 ? a2 : yy < 0 ? -a2 : 0) * y2 < k) d = sqrt(x2 + y2) * il2 - P[o + 6];
      else d = (sqrt(x2 * a2 * il2) + yy * rr) * il2 - P[o + 6];
    }
    if (P[o + 23] !== 0) { const f = P[o + 24] - y; if (f > d) d = f; }
    return d;
  }
  function field(P, L, x, y, z) {
    let d = 1e9;
    for (let n = 0; n < L.length; n++) {
      const o = L[n] * ST, di = dist(P, o, x, y, z), k = P[o + 2];
      if (P[o + 1] === 1) {       // smooth subtraction
        const a = -d;
        if (k <= 0) d = -(a < di ? a : di);
        else { const h = max(k - abs(a - di), 0) / k; d = -((a < di ? a : di) - h * h * k * 0.25); }
      } else if (k <= 0) { if (di < d) d = di; }
      else { const h = max(k - abs(d - di), 0) / k; d = (d < di ? d : di) - h * h * k * 0.25; }
    }
    return d;
  }

  function build(spec) {
    const T0 = Date.now();
    const P = pack(spec.prims), NP = spec.prims.length;
    const vox = spec.voxel, B = 8;
    const mn = spec.bounds.min, mx = spec.bounds.max;
    const nx = Math.ceil((mx[0] - mn[0]) / vox) + 1, ny = Math.ceil((mx[1] - mn[1]) / vox) + 1, nz = Math.ceil((mx[2] - mn[2]) / vox) + 1;
    const bnx = Math.ceil((nx - 1) / B), bny = Math.ceil((ny - 1) / B), bnz = Math.ceil((nz - 1) / B);
    const blockR = sqrt(3) * B * vox / 2;
    const NB = bnx * bny * bnz, lists = new Array(NB), flagged = new Uint8Array(NB);
    const dc = new Float64Array(NP), tmp = new Int32Array(NP);
    for (let bk = 0; bk < bnz; bk++) for (let bj = 0; bj < bny; bj++) for (let bi = 0; bi < bnx; bi++) {
      const cx = mn[0] + (bi + .5) * B * vox, cy = mn[1] + (bj + .5) * B * vox, cz = mn[2] + (bk + .5) * B * vox;
      // conservative culling: a primitive only alters the smooth union where it lies within k of the minimum
      let dmin = 1e9;
      for (let n = 0; n < NP; n++) {
        const o = n * ST, dx = cx - P[o + 3], dy = cy - P[o + 4], dz = cz - P[o + 5];
        if (sqrt(dx * dx + dy * dy + dz * dz) > P[o + 36] + blockR + 0.25) { dc[n] = 1e9; continue; }
        const d = dist(P, o, cx, cy, cz) * P[o + 37];
        dc[n] = d;
        if (P[o + 1] !== 1 && d < dmin) dmin = d;
      }
      let c = 0, unions = 0;
      for (let n = 0; n < NP; n++) {
        const o = n * ST, d = dc[n];
        if (d > 1e8) continue;
        if (P[o + 1] === 1 ? d < blockR * 1.25 + P[o + 2] + vox : d < dmin + 2.5 * blockR + P[o + 2] * 1.2 + vox) { tmp[c++] = n; if (P[o + 1] !== 1) unions++; }
      }
      const bid = bi + bnx * (bj + bny * bk);
      const L = lists[bid] = tmp.slice(0, c);
      if (!unions) continue;
      const d = field(P, L, cx, cy, cz);
      if (abs(d) < blockR * 1.3 + 2 * vox) flagged[bid] = 1;
    }
    const T1 = Date.now();
    const N = nx * ny * nz, val = new Float32Array(N).fill(NaN);
    for (let bk = 0; bk < bnz; bk++) for (let bj = 0; bj < bny; bj++) for (let bi = 0; bi < bnx; bi++) {
      const bid = bi + bnx * (bj + bny * bk);
      if (!flagged[bid]) continue;
      const L = lists[bid];
      const i1 = min(nx - 1, bi * B + B), j1 = min(ny - 1, bj * B + B), k1 = min(nz - 1, bk * B + B);
      for (let k = bk * B; k <= k1; k++) for (let j = bj * B; j <= j1; j++) {
        const row = nx * (j + ny * k), y = mn[1] + j * vox, z = mn[2] + k * vox;
        for (let i = bi * B; i <= i1; i++) {
          const id = i + row;
          if (val[id] === val[id]) continue;
          val[id] = field(P, L, mn[0] + i * vox, y, z);
        }
      }
    }
    const listAt = (x, y, z) => {
      const bi = min(bnx - 1, max(0, Math.floor((x - mn[0]) / (B * vox)))), bj = min(bny - 1, max(0, Math.floor((y - mn[1]) / (B * vox)))), bk = min(bnz - 1, max(0, Math.floor((z - mn[2]) / (B * vox))));
      return lists[bi + bnx * (bj + bny * bk)];
    };
    const T2 = Date.now();
    // surface nets: one vertex per sign-changing cell at the mean of its edge crossings
    const cell = new Int32Array(N).fill(-1);
    let verts = new Float32Array(65536 * 3), nv = 0;
    const EA = [0, 2, 4, 6, 0, 1, 4, 5, 0, 1, 2, 3], EB = [1, 3, 5, 7, 2, 3, 6, 7, 4, 5, 6, 7];
    const COX = [0, 1, 0, 1, 0, 1, 0, 1], COY = [0, 0, 1, 1, 0, 0, 1, 1], COZ = [0, 0, 0, 0, 1, 1, 1, 1];
    const OFF = COX.map((_, c) => COX[c] + nx * (COY[c] + ny * COZ[c]));
    const g = new Float64Array(8);
    for (let bk = 0; bk < bnz; bk++) for (let bj = 0; bj < bny; bj++) for (let bi = 0; bi < bnx; bi++) {
      if (!flagged[bi + bnx * (bj + bny * bk)]) continue;
      const i1 = min(nx - 2, bi * B + B - 1), j1 = min(ny - 2, bj * B + B - 1), k1 = min(nz - 2, bk * B + B - 1);
      for (let k = bk * B; k <= k1; k++) for (let j = bj * B; j <= j1; j++) for (let i = bi * B; i <= i1; i++) {
        const id = i + nx * (j + ny * k);
        let mask = 0, bad = false;
        for (let c = 0; c < 8; c++) {
          const v = val[id + OFF[c]];
          if (v !== v) { bad = true; break; }
          g[c] = v; if (v < 0) mask |= 1 << c;
        }
        if (bad || mask === 0 || mask === 255) continue;
        let sx = 0, sy = 0, sz = 0, cnt = 0;
        for (let e = 0; e < 12; e++) {
          const a = EA[e], b = EB[e];
          if (((mask >> a) & 1) === ((mask >> b) & 1)) continue;
          const t = g[a] / (g[a] - g[b]);
          sx += COX[a] + t * (COX[b] - COX[a]); sy += COY[a] + t * (COY[b] - COY[a]); sz += COZ[a] + t * (COZ[b] - COZ[a]);
          cnt++;
        }
        if (nv * 3 + 3 > verts.length) { const nvb = new Float32Array(verts.length * 2); nvb.set(verts); verts = nvb; }
        cell[id] = nv;
        verts[nv * 3] = mn[0] + (i + sx / cnt) * vox; verts[nv * 3 + 1] = mn[1] + (j + sy / cnt) * vox; verts[nv * 3 + 2] = mn[2] + (k + sz / cnt) * vox;
        nv++;
      }
    }
    let quads = new Int32Array(nv * 4 * 3 + 16), nq = 0;
    const SX = 1, SY = nx, SZ = nx * ny;
    const pushQ = (a, b, c, d) => { if (nq * 4 + 4 > quads.length) { const q2 = new Int32Array(quads.length * 2); q2.set(quads); quads = q2; } quads[nq * 4] = a; quads[nq * 4 + 1] = b; quads[nq * 4 + 2] = c; quads[nq * 4 + 3] = d; nq++; };
    for (let k = 1; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
      const id = i + nx * (j + ny * k), c0 = cell[id];
      if (c0 < 0) continue;
      const inside = val[id] < 0;
      if ((val[id + SX] < 0) !== inside) {
        const a = cell[id - SY], b = cell[id - SY - SZ], c = cell[id - SZ];
        if (a >= 0 && b >= 0 && c >= 0) { if (inside) pushQ(c0, a, b, c); else pushQ(c0, c, b, a); }
      }
      if ((val[id + SY] < 0) !== inside) {
        const a = cell[id - SZ], b = cell[id - SX - SZ], c = cell[id - SX];
        if (a >= 0 && b >= 0 && c >= 0) { if (inside) pushQ(c0, a, b, c); else pushQ(c0, c, b, a); }
      }
      if ((val[id + SZ] < 0) !== inside) {
        const a = cell[id - SX], b = cell[id - SX - SY], c = cell[id - SY];
        if (a >= 0 && b >= 0 && c >= 0) { if (inside) pushQ(c0, a, b, c); else pushQ(c0, c, b, a); }
      }
    }
    const T3 = Date.now();
    // project onto the surface and take the gradient (tetrahedral differences)
    const pos = verts.slice(0, nv * 3), nor = new Float32Array(nv * 3);
    const h = vox * .3;
    for (let v = 0; v < nv; v++) {
      let x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2];
      const L = listAt(x, y, z);
      let gx = 0, gy = 1, gz = 0;
      for (let it = 0; it < 3; it++) {
        const a = field(P, L, x + h, y - h, z - h), b = field(P, L, x - h, y - h, z + h), c = field(P, L, x - h, y + h, z - h), d = field(P, L, x + h, y + h, z + h);
        gx = a - b - c + d; gy = -a - b + c + d; gz = -a + b - c + d;
        const l = sqrt(gx * gx + gy * gy + gz * gz) || 1;
        gx /= l; gy /= l; gz /= l;
        if (it < 2) { const f = (a + b + c + d) * 0.25, s = max(-vox, min(vox, f)); x -= gx * s; y -= gy * s; z -= gz * s; }
      }
      pos[v * 3] = x; pos[v * 3 + 1] = y; pos[v * 3 + 2] = z;
      nor[v * 3] = gx; nor[v * 3 + 1] = gy; nor[v * 3 + 2] = gz;
    }
    // triangles, splitting each quad along its shorter diagonal
    const tri = new Uint32Array(nq * 6);
    const d2 = (a, b) => { const dx = pos[a * 3] - pos[b * 3], dy = pos[a * 3 + 1] - pos[b * 3 + 1], dz = pos[a * 3 + 2] - pos[b * 3 + 2]; return dx * dx + dy * dy + dz * dz; };
    for (let q = 0; q < nq; q++) {
      const a = quads[q * 4], b = quads[q * 4 + 1], c = quads[q * 4 + 2], d = quads[q * 4 + 3], o = q * 6;
      if (d2(a, c) < d2(b, d)) { tri[o] = a; tri[o + 1] = b; tri[o + 2] = c; tri[o + 3] = a; tri[o + 4] = c; tri[o + 5] = d; }
      else { tri[o] = a; tri[o + 1] = b; tri[o + 2] = d; tri[o + 3] = b; tri[o + 4] = c; tri[o + 5] = d; }
    }
    const out = { pos, nor, index: tri, count: nv };
    // per-vertex colour, coat length, region, skin weights, AO and thickness
    const tags = spec.tags || [], nb = Array.isArray(spec.bones) ? spec.bones.length : (spec.bones || 0);
    const TC = new Float64Array(tags.length * 4 + 4);
    tags.forEach((t, i) => { TC[i * 4] = t.color[0]; TC[i * 4 + 1] = t.color[1]; TC[i * 4 + 2] = t.color[2]; TC[i * 4 + 3] = t.hair === undefined ? 1 : t.hair; });
    const col = new Float32Array(nv * 4), hair = new Float32Array(nv), thin = new Float32Array(nv), region = new Float32Array(nv);
    const sIdx = nb ? new Uint16Array(nv * 4) : null, sW = nb ? new Float32Array(nv * 4) : null;
    const acc = new Float64Array(max(1, nb)), dsv = new Float64Array(NP);
    const AOH = [0.012, 0.03, 0.06, 0.1, 0.16], AOW = [0.3, 0.25, 0.2, 0.15, 0.1];
    const aoOn = spec.ao !== false;
    for (let v = 0; v < nv; v++) {
      const x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2], nxv = nor[v * 3], nyv = nor[v * 3 + 1], nzv = nor[v * 3 + 2];
      const L = listAt(x, y, z);
      let dmin = 1e9, best = -1;
      for (let n = 0; n < L.length; n++) {
        const o = L[n] * ST;
        if (P[o + 1] === 1) continue;
        const d = dist(P, o, x, y, z);
        dsv[n] = d;
        if (d < dmin) { dmin = d; best = L[n]; }
      }
      let cr = 0, cg = 0, cb = 0, cw = 0, hw = 0;
      if (nb) acc.fill(0);
      for (let n = 0; n < L.length; n++) {
        const o = L[n] * ST;
        if (P[o + 1] === 1) continue;
        const d = dsv[n] - dmin, wc = exp(-d / P[o + 41]), t = P[o + 38] * 4;
        cr += TC[t] * wc; cg += TC[t + 1] * wc; cb += TC[t + 2] * wc; hw += TC[t + 3] * wc; cw += wc;
        const bone = P[o + 39];
        if (nb && bone >= 0) acc[bone] += exp(-d / P[o + 40]);
      }
      if (cw > 0) { col[v * 4] = cr / cw; col[v * 4 + 1] = cg / cw; col[v * 4 + 2] = cb / cw; hair[v] = hw / cw; }
      if (best >= 0) { const o = best * ST; region[v] = P[o + 42] >= 0 ? P[o + 42] : ((tags[P[o + 38]] || {}).region || 0); }
      if (nb) {
        let t0 = -1, t1 = -1, t2 = -1, t3 = -1, w0 = 0, w1 = 0, w2 = 0, w3 = 0;
        for (let b = 0; b < nb; b++) {
          const w = acc[b];
          if (w <= w3) continue;
          if (w > w0) { t3 = t2; w3 = w2; t2 = t1; w2 = w1; t1 = t0; w1 = w0; t0 = b; w0 = w; }
          else if (w > w1) { t3 = t2; w3 = w2; t2 = t1; w2 = w1; t1 = b; w1 = w; }
          else if (w > w2) { t3 = t2; w3 = w2; t2 = b; w2 = w; }
          else { t3 = b; w3 = w; }
        }
        const sum = w0 + w1 + w2 + w3 || 1, o = v * 4;
        sIdx[o] = max(0, t0); sIdx[o + 1] = max(0, t1); sIdx[o + 2] = max(0, t2); sIdx[o + 3] = max(0, t3);
        sW[o] = w0 / sum; sW[o + 1] = w1 / sum; sW[o + 2] = w2 / sum; sW[o + 3] = w3 / sum;
      }
      let ao = 1;
      if (aoOn) {
        let occ = 0;
        for (let s = 0; s < 5; s++) {
          const hh = AOH[s], px = x + nxv * hh, py = y + nyv * hh, pz = z + nzv * hh;
          const d = field(P, listAt(px, py, pz), px, py, pz);
          occ += AOW[s] * max(0, min(1, (hh - d) / hh));
        }
        ao = max(0, 1 - occ * 1.35);
        const t = 0.035, di = -field(P, L, x - nxv * t, y - nyv * t, z - nzv * t);
        thin[v] = 1 - max(0, min(1, di / t));
      }
      col[v * 4 + 3] = ao;
    }
    Object.assign(out, { col, hair, thin, region, sIdx, sW });
    const T4 = Date.now();
    // morph targets: slide each nearby vertex along its normal onto the variant surface
    out.morphs = {};
    for (const vr of (spec.variants || [])) {
      const PV = pack(vr.prims), changed = vr.changed || [], margin = vr.margin || 0.12;
      const delta = new Float32Array(nv * 3);
      const extra = new Int32Array(NP + changed.length + 8);
      for (let v = 0; v < nv; v++) {
        const x0 = pos[v * 3], y0 = pos[v * 3 + 1], z0 = pos[v * 3 + 2];
        let near = false;
        for (let c = 0; c < changed.length; c++) {
          const o = changed[c] * ST, dx = x0 - PV[o + 3], dy = y0 - PV[o + 4], dz = z0 - PV[o + 5];
          if (sqrt(dx * dx + dy * dy + dz * dz) < PV[o + 36] + margin) { near = true; break; }
        }
        if (!near) continue;
        const base = listAt(x0, y0, z0);
        let n = 0;
        for (let i = 0; i < base.length; i++) extra[n++] = base[i];
        for (let c = 0; c < changed.length; c++) { let has = false; for (let i = 0; i < base.length; i++) if (base[i] === changed[c]) { has = true; break; } if (!has) extra[n++] = changed[c]; }
        const L = extra.slice(0, n).sort();
        let nxv = nor[v * 3], nyv = nor[v * 3 + 1], nzv = nor[v * 3 + 2];
        if (vr.downRegion !== undefined && region[v] === vr.downRegion) { nxv = 0; nyv = -1; nzv = 0; }   // slide straight up onto the new surface
        let x = x0, y = y0, z = z0;
        for (let it = 0; it < 6; it++) {
          const f = field(PV, L, x, y, z), s = max(-0.08, min(0.08, f));
          x -= nxv * s; y -= nyv * s; z -= nzv * s;
        }
        // a vertex that never reached the new surface along its direction stays where it was (no spikes)
        if (abs(field(PV, L, x, y, z)) > 2 * vox) continue;
        delta[v * 3] = x - x0; delta[v * 3 + 1] = y - y0; delta[v * 3 + 2] = z - z0;
      }
      out.morphs[vr.name] = delta;
    }
    out.timing = [T1 - T0, T2 - T1, T3 - T2, T4 - T3, Date.now() - T4];
    return out;
  }
  function transfers(o) {
    const t = [o.pos.buffer, o.nor.buffer, o.index.buffer, o.col.buffer, o.hair.buffer, o.thin.buffer, o.region.buffer];
    if (o.sIdx) t.push(o.sIdx.buffer, o.sW.buffer);
    for (const k in o.morphs) t.push(o.morphs[k].buffer);
    return t;
  }
  if (scope) {
    scope.onmessage = e => {
      const { id, specs } = e.data;
      try {
        const res = specs.map(build);
        const tr = [];
        res.forEach(r => tr.push(...transfers(r)));
        scope.postMessage({ id, res }, tr);
      } catch (err) { scope.postMessage({ id, error: String(err && err.stack || err) }); }
    };
  }
  return { build, pack, field, dist, ST };
}

/* main-thread client: one worker, promise per job, graceful fallback */
const SDF = (() => {
  let worker = null, seq = 0;
  const pending = new Map();
  try {
    const src = '(' + SDFKERNEL.toString() + ')(self);';
    worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
    worker.onmessage = e => {
      const p = pending.get(e.data.id);
      if (!p) return;
      pending.delete(e.data.id);
      if (e.data.error) p.reject(new Error(e.data.error)); else p.resolve(e.data.res);
    };
    worker.onerror = e => { if (e && e.preventDefault) e.preventDefault(); worker = null; for (const [, p] of pending) p.retry(); pending.clear(); };
  } catch (e) { worker = null; }
  let local = null;
  const runLocal = specs => { local = local || SDFKERNEL(null); return specs.map(local.build); };
  return {
    run(specs) {
      if (!worker) return new Promise(r => setTimeout(() => r(runLocal(specs)), 0));
      return new Promise((resolve, reject) => {
        const id = ++seq;
        pending.set(id, { resolve, reject, retry: () => resolve(runLocal(specs)) });
        worker.postMessage({ id, specs });
      });
    },
  };
})();

export { SDFKERNEL, SDF };
