// Extracción de superficies "Surface Nets" dispersa por bloques a partir de un SDF.
// Devuelve { pos: Float32Array, nor: Float32Array, idx: Uint32Array }.

const BS = 8; // celdas por bloque

export function meshSDF(f, h, opts = {}) {
  const b = opts.bounds || f.b;
  const pad = 2 * h;
  const x0 = b[0] - pad, y0 = b[1] - pad, z0 = b[2] - pad;
  const nx = Math.max(2, Math.ceil((b[3] + pad - x0) / h) + 1);
  const ny = Math.max(2, Math.ceil((b[4] + pad - y0) / h) + 1);
  const nz = Math.max(2, Math.ceil((b[5] + pad - z0) / h) + 1);
  if (nx * ny * nz > 6e7) throw new Error('Malla demasiado grande');
  const ncx = nx - 1, ncy = ny - 1, ncz = nz - 1; // celdas
  const nbx = Math.ceil(ncx / BS), nby = Math.ceil(ncy / BS), nbz = Math.ceil(ncz / BS);
  const S = BS + 1, S2 = S * S;
  const rBlock = Math.sqrt(3) * BS * h * 0.5;
  const skip = rBlock * 1.3 + 2 * h;

  const pos = [], nor = [];
  const vmap = new Map();
  const cells = []; // [key, flags]

  const evalBlock = new Float32Array(S * S * S);
  const eps = h * 0.35;

  for (let bk = 0; bk < nbz; bk++) for (let bj = 0; bj < nby; bj++) for (let bi = 0; bi < nbx; bi++) {
    const ci = bi * BS, cj = bj * BS, ck = bk * BS;
    const cx = x0 + (ci + BS / 2) * h, cy = y0 + (cj + BS / 2) * h, cz = z0 + (ck + BS / 2) * h;
    const dc = f(cx, cy, cz);
    if (Math.abs(dc) > skip) continue;
    const g = f.sp ? f.sp(cx, cy, cz, rBlock + 2 * h) : f;
    // Muestreo
    let hasNeg = false, hasPos = false;
    for (let k = 0; k < S; k++) {
      const z = z0 + (ck + k) * h;
      for (let j = 0; j < S; j++) {
        const y = y0 + (cj + j) * h;
        let o = k * S2 + j * S;
        for (let i = 0; i < S; i++) {
          const v = g(x0 + (ci + i) * h, y, z);
          evalBlock[o + i] = v;
          if (v < 0) hasNeg = true; else hasPos = true;
        }
      }
    }
    if (!(hasNeg && hasPos)) continue;
    const imax = Math.min(BS, ncx - ci), jmax = Math.min(BS, ncy - cj), kmax = Math.min(BS, ncz - ck);
    for (let k = 0; k < kmax; k++) for (let j = 0; j < jmax; j++) for (let i = 0; i < imax; i++) {
      const o = k * S2 + j * S + i;
      const v0 = evalBlock[o], v1 = evalBlock[o + 1], v2 = evalBlock[o + S], v3 = evalBlock[o + S + 1];
      const v4 = evalBlock[o + S2], v5 = evalBlock[o + S2 + 1], v6 = evalBlock[o + S2 + S], v7 = evalBlock[o + S2 + S + 1];
      let mask = 0;
      if (v0 < 0) mask |= 1; if (v1 < 0) mask |= 2; if (v2 < 0) mask |= 4; if (v3 < 0) mask |= 8;
      if (v4 < 0) mask |= 16; if (v5 < 0) mask |= 32; if (v6 < 0) mask |= 64; if (v7 < 0) mask |= 128;
      if (mask === 0 || mask === 255) continue;
      // Promedio de cruces en las 12 aristas
      let sx = 0, sy = 0, sz = 0, cnt = 0;
      const vs = [v0, v1, v2, v3, v4, v5, v6, v7];
      for (let e = 0; e < 12; e++) {
        const a = EA[e], c = EB[e];
        const va = vs[a], vb = vs[c];
        if ((va < 0) === (vb < 0)) continue;
        const t = va / (va - vb);
        sx += CX[a] + (CX[c] - CX[a]) * t;
        sy += CY[a] + (CY[c] - CY[a]) * t;
        sz += CZ[a] + (CZ[c] - CZ[a]) * t;
        cnt++;
      }
      let px = x0 + (ci + i + sx / cnt) * h, py = y0 + (cj + j + sy / cnt) * h, pz = z0 + (ck + k + sz / cnt) * h;
      // Proyección sobre la superficie y normal por gradiente (tetraedro)
      const a1 = g(px + eps, py - eps, pz - eps), a2 = g(px - eps, py - eps, pz + eps);
      const a3 = g(px - eps, py + eps, pz - eps), a4 = g(px + eps, py + eps, pz + eps);
      let gx = a1 - a2 - a3 + a4, gy = -a1 - a2 + a3 + a4, gz = -a1 + a2 - a3 + a4;
      const gl = Math.sqrt(gx * gx + gy * gy + gz * gz);
      if (gl > 1e-12) {
        gx /= gl; gy /= gl; gz /= gl;
        if (!opts.noProject) {
          let d = (a1 + a2 + a3 + a4) * 0.25;
          if (d > h * 0.6) d = h * 0.6; else if (d < -h * 0.6) d = -h * 0.6;
          px -= gx * d; py -= gy * d; pz -= gz * d;
        }
      }
      const gi = ci + i, gj = cj + j, gk = ck + k;
      const key = gi + nx * (gj + ny * gk);
      vmap.set(key, pos.length / 3);
      pos.push(px, py, pz);
      nor.push(gx, gy, gz);
      let flags = 0;
      if ((v0 < 0) !== (v1 < 0)) flags |= 1; // arista +x desde la esquina 0
      if ((v0 < 0) !== (v2 < 0)) flags |= 2; // arista +y
      if ((v0 < 0) !== (v4 < 0)) flags |= 4; // arista +z
      if (v0 < 0) flags |= 8;
      cells.push(key, flags);
    }
  }

  const idx = [];
  const sx = 1, sy = nx, sz = nx * ny;
  const quad = (a, b, c, d, flip) => {
    const ia = vmap.get(a), ib = vmap.get(b), ic = vmap.get(c), id = vmap.get(d);
    if (ia === undefined || ib === undefined || ic === undefined || id === undefined) return;
    if (flip) idx.push(ia, ib, ic, ia, ic, id);
    else idx.push(ia, ic, ib, ia, id, ic);
  };
  for (let n = 0; n < cells.length; n += 2) {
    const key = cells[n], flags = cells[n + 1];
    const inside = (flags & 8) !== 0;
    const gi = key % nx, rest = (key - gi) / nx, gj = rest % ny, gk = (rest - gj) / ny;
    if (flags & 1 && gj > 0 && gk > 0) quad(key, key - sy, key - sy - sz, key - sz, inside);
    if (flags & 2 && gi > 0 && gk > 0) quad(key, key - sz, key - sx - sz, key - sx, inside);
    if (flags & 4 && gi > 0 && gj > 0) quad(key, key - sx, key - sx - sy, key - sy, inside);
  }
  return { pos: new Float32Array(pos), nor: new Float32Array(nor), idx: new Uint32Array(idx) };
}

// Esquinas de la celda: índice = i + 2j + 4k
const CX = [0, 1, 0, 1, 0, 1, 0, 1], CY = [0, 0, 1, 1, 0, 0, 1, 1], CZ = [0, 0, 0, 0, 1, 1, 1, 1];
const EA = [0, 2, 4, 6, 0, 1, 4, 5, 0, 1, 2, 3];
const EB = [1, 3, 5, 7, 2, 3, 6, 7, 4, 5, 6, 7];
