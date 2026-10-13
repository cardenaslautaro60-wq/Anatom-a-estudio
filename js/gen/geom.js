// Utilidades de geometría: tubos de radio variable, curvas Catmull-Rom, fusión y espejo de mallas.

export function catmull(pts, samplesPerSeg = 12) {
  // Catmull-Rom centrípeta
  if (pts.length < 2) return pts.slice();
  const P = [extrap(pts[0], pts[1]), ...pts, extrap(pts[pts.length - 1], pts[pts.length - 2])];
  const out = [];
  for (let i = 1; i < P.length - 2; i++) {
    const p0 = P[i - 1], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2];
    const t0 = 0;
    const t1 = t0 + Math.pow(dist(p0, p1), 0.5) + 1e-6;
    const t2 = t1 + Math.pow(dist(p1, p2), 0.5) + 1e-6;
    const t3 = t2 + Math.pow(dist(p2, p3), 0.5) + 1e-6;
    for (let s = 0; s < samplesPerSeg; s++) {
      const t = t1 + (t2 - t1) * (s / samplesPerSeg);
      const A1 = lerpT(p0, p1, t0, t1, t), A2 = lerpT(p1, p2, t1, t2, t), A3 = lerpT(p2, p3, t2, t3, t);
      const B1 = lerpT(A1, A2, t0, t2, t), B2 = lerpT(A2, A3, t1, t3, t);
      out.push(lerpT(B1, B2, t1, t2, t));
    }
  }
  out.push(pts[pts.length - 1].slice());
  return out;
}
function extrap(a, b) { return [2 * a[0] - b[0], 2 * a[1] - b[1], 2 * a[2] - b[2]]; }
function lerpT(a, b, ta, tb, t) {
  const u = (t - ta) / (tb - ta);
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
}
export function dist(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); }

// Remuestrea una polilínea a paso aproximadamente constante.
export function resample(pts, step) {
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + dist(pts[i - 1], pts[i]));
  const total = L[L.length - 1];
  const n = Math.max(2, Math.ceil(total / step) + 1);
  const out = [];
  let j = 0;
  for (let i = 0; i < n; i++) {
    const s = total * i / (n - 1);
    while (j < L.length - 2 && L[j + 1] < s) j++;
    const u = (s - L[j]) / ((L[j + 1] - L[j]) || 1);
    const a = pts[j], b = pts[j + 1];
    out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]);
  }
  return out;
}

export function smoothPath(pts, step = 0.004) {
  return resample(catmull(pts, 16), step);
}

// Tubo a lo largo de pts (ya suavizados). radius: número o función(t in [0,1], i) -> r.
// opts: radial (segmentos), flat (relación del eje B), up (dirección de referencia para el eje B), caps
// Restricción opcional aplicada a los ejes de los tubos (p. ej. mantenerlos bajo la piel).
let TUBE_CONSTRAINT = null;
export function setTubeConstraint(fn) { TUBE_CONSTRAINT = fn; }

export function tube(pts, radius, opts = {}) {
  if (TUBE_CONSTRAINT && opts.constrain !== false) {
    const rf = typeof radius === 'function' ? radius : () => radius;
    pts = pts.map((p, i) => TUBE_CONSTRAINT(p, rf(i / Math.max(1, pts.length - 1), i)));
  }
  const radial = opts.radial || 12;
  const flat = opts.flat || 1;
  const caps = opts.caps !== false;
  const n = pts.length;
  const rad = typeof radius === 'function' ? radius : () => radius;
  // Tangentes
  const T = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    T.push(normalize([b[0] - a[0], b[1] - a[1], b[2] - a[2]]));
  }
  // Marcos
  const N = [], Bv = [];
  if (opts.up) {
    for (let i = 0; i < n; i++) {
      const up = typeof opts.up === 'function' ? opts.up(i / (n - 1), pts[i]) : opts.up;
      let b = sub3(up, scale3(T[i], dot3(up, T[i])));
      if (len3(b) < 1e-6) b = perp(T[i]);
      b = normalize(b);
      Bv.push(b); N.push(normalize(cross3(b, T[i])));
    }
  } else {
    let nrm = perp(T[0]);
    for (let i = 0; i < n; i++) {
      if (i > 0) {
        const ax = cross3(T[i - 1], T[i]);
        const s = len3(ax);
        if (s > 1e-8) {
          const ang = Math.asin(Math.min(1, s));
          nrm = rotate(nrm, normalize(ax), ang);
        }
        nrm = normalize(sub3(nrm, scale3(T[i], dot3(nrm, T[i]))));
      }
      N.push(nrm); Bv.push(normalize(cross3(T[i], nrm)));
    }
  }
  const pos = [], nor = [], idx = [];
  const ring = (c, t, nn, bb, r, normalOverride) => {
    for (let k = 0; k < radial; k++) {
      const a = (k / radial) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);
      pos.push(c[0] + (nn[0] * ca + bb[0] * sa * flat) * r, c[1] + (nn[1] * ca + bb[1] * sa * flat) * r, c[2] + (nn[2] * ca + bb[2] * sa * flat) * r);
      if (normalOverride) nor.push(...normalOverride);
      else {
        const v = normalize([nn[0] * ca * flat + bb[0] * sa, nn[1] * ca * flat + bb[1] * sa, nn[2] * ca * flat + bb[2] * sa]);
        nor.push(v[0], v[1], v[2]);
      }
    }
  };
  const rings = [];
  const capSteps = 4;
  if (caps) {
    const r0 = rad(0, 0);
    for (let s = capSteps; s >= 1; s--) {
      const ang = (s / capSteps) * Math.PI / 2;
      const c = sub3(pts[0], scale3(T[0], Math.sin(ang) * r0 * 0.9));
      rings.push([c, N[0], Bv[0], r0 * Math.cos(ang) + 1e-5, ang, -1]);
    }
  }
  for (let i = 0; i < n; i++) rings.push([pts[i], N[i], Bv[i], rad(i / (n - 1), i), 0, 0, i]);
  if (caps) {
    const r1 = rad(1, n - 1);
    for (let s = 1; s <= capSteps; s++) {
      const ang = (s / capSteps) * Math.PI / 2;
      const c = add3(pts[n - 1], scale3(T[n - 1], Math.sin(ang) * r1 * 0.9));
      rings.push([c, N[n - 1], Bv[n - 1], r1 * Math.cos(ang) + 1e-5, ang, 1]);
    }
  }
  for (const [c, nn, bb, r, ang, dir, i] of rings) {
    if (dir) {
      // normal inclinada hacia el extremo
      const t = dir < 0 ? T[0] : T[n - 1];
      const before = pos.length;
      ring(c, t, nn, bb, r);
      for (let k = before; k < pos.length; k += 3) {
        const j = k; const ox = nor[j], oy = nor[j + 1], oz = nor[j + 2];
        const ca = Math.cos(ang), sa = Math.sin(ang) * dir;
        const v = normalize([ox * ca + t[0] * sa, oy * ca + t[1] * sa, oz * ca + t[2] * sa]);
        nor[j] = v[0]; nor[j + 1] = v[1]; nor[j + 2] = v[2];
      }
    } else ring(c, T[i], nn, bb, r);
  }
  const nr = rings.length;
  for (let i = 0; i < nr - 1; i++) {
    for (let k = 0; k < radial; k++) {
      const a = i * radial + k, b = i * radial + (k + 1) % radial;
      const c = (i + 1) * radial + k, d = (i + 1) * radial + (k + 1) % radial;
      idx.push(a, c, b, b, c, d);
    }
  }
  // tapas planas mínimas (cierre)
  if (caps) {
    const first = pos.length / 3; pos.push(...sub3(pts[0], scale3(T[0], rad(0, 0) * 0.9))); nor.push(...scale3(T[0], -1));
    for (let k = 0; k < radial; k++) idx.push(first, k, (k + 1) % radial);
    const last = pos.length / 3; pos.push(...add3(pts[n - 1], scale3(T[n - 1], rad(1, n - 1) * 0.9))); nor.push(...T[n - 1]);
    const base = (nr - 1) * radial;
    for (let k = 0; k < radial; k++) idx.push(last, base + (k + 1) % radial, base + k);
  }
  const g = { pos: new Float32Array(pos), nor: new Float32Array(nor), idx: new Uint32Array(idx) };
  fixWinding(g);
  return g;
}

// Asegura que las caras apunten en el sentido de las normales de vértice.
function fixWinding(g) {
  let agree = 0;
  const { pos, nor, idx } = g;
  for (let i = 0; i < idx.length; i += 3) {
    const a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
    const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    agree += (nx * nor[a] + ny * nor[a + 1] + nz * nor[a + 2]) > 0 ? 1 : -1;
  }
  if (agree < 0) for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
}

// Tubo a partir de puntos de control (suavizado automático).
export function tubeCurve(ctrl, radius, opts = {}) {
  const pts = ctrl.length > 2 ? smoothPath(ctrl, opts.step || 0.004) : resample(ctrl, opts.step || 0.004);
  return tube(pts, radius, opts);
}

export function merge(list) {
  list = list.filter(Boolean);
  let nv = 0, ni = 0;
  for (const g of list) { nv += g.pos.length; ni += g.idx.length; }
  const pos = new Float32Array(nv), nor = new Float32Array(nv), idx = new Uint32Array(ni);
  let ov = 0, oi = 0;
  for (const g of list) {
    pos.set(g.pos, ov); nor.set(g.nor, ov);
    const base = ov / 3;
    for (let i = 0; i < g.idx.length; i++) idx[oi + i] = g.idx[i] + base;
    ov += g.pos.length; oi += g.idx.length;
  }
  return { pos, nor, idx };
}

export function mirrorGeom(g) {
  const pos = g.pos.slice(), nor = g.nor.slice(), idx = g.idx.slice();
  for (let i = 0; i < pos.length; i += 3) { pos[i] = -pos[i]; nor[i] = -nor[i]; }
  for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
  return { pos, nor, idx };
}

export function mirrorPts(pts) { return pts.map(p => [-p[0], p[1], p[2]]); }

// Normales por promedio de caras (para mallas sin normales analíticas).
export function computeNormals(g) {
  const { pos, idx } = g;
  const nor = new Float32Array(pos.length);
  for (let i = 0; i < idx.length; i += 3) {
    const a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
    const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    for (const o of [a, b, c]) { nor[o] += nx; nor[o + 1] += ny; nor[o + 2] += nz; }
  }
  for (let i = 0; i < nor.length; i += 3) {
    const l = Math.hypot(nor[i], nor[i + 1], nor[i + 2]) || 1;
    nor[i] /= l; nor[i + 1] /= l; nor[i + 2] /= l;
  }
  g.nor = nor;
  return g;
}

// ---- vectores ----
export function add3(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
export function sub3(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
export function scale3(a, s) { return [a[0] * s, a[1] * s, a[2] * s]; }
export function dot3(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
export function cross3(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
export function len3(a) { return Math.hypot(a[0], a[1], a[2]); }
export function normalize(a) { const l = len3(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
export function lerp3(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
export function madd(a, b, s) { return [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s]; }
function perp(t) {
  const a = Math.abs(t[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  return normalize(cross3(a, t));
}
function rotate(v, k, ang) {
  const c = Math.cos(ang), s = Math.sin(ang);
  const kv = cross3(k, v), kd = dot3(k, v);
  return [v[0] * c + kv[0] * s + k[0] * kd * (1 - c), v[1] * c + kv[1] * s + k[1] * kd * (1 - c), v[2] * c + kv[2] * s + k[2] * kd * (1 - c)];
}

// Divide una malla en sub-mallas según una función de clasificación evaluada en el baricentro de cada triángulo.
// classify(x, y, z) -> índice de clase (0..n-1) o -1 para descartar.
export function splitByClass(g, n, classify) {
  const { pos, nor, idx } = g;
  const outs = Array.from({ length: n }, () => ({ map: new Map(), pos: [], nor: [], idx: [] }));
  for (let i = 0; i < idx.length; i += 3) {
    const a = idx[i], b = idx[i + 1], c = idx[i + 2];
    const cx = (pos[a * 3] + pos[b * 3] + pos[c * 3]) / 3;
    const cy = (pos[a * 3 + 1] + pos[b * 3 + 1] + pos[c * 3 + 1]) / 3;
    const cz = (pos[a * 3 + 2] + pos[b * 3 + 2] + pos[c * 3 + 2]) / 3;
    const k = classify(cx, cy, cz);
    if (k < 0 || k >= n) continue;
    const o = outs[k];
    for (const v of [a, b, c]) {
      let j = o.map.get(v);
      if (j === undefined) {
        j = o.pos.length / 3;
        o.map.set(v, j);
        o.pos.push(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]);
        o.nor.push(nor[v * 3], nor[v * 3 + 1], nor[v * 3 + 2]);
      }
      o.idx.push(j);
    }
  }
  return outs.map(o => ({ pos: new Float32Array(o.pos), nor: new Float32Array(o.nor), idx: new Uint32Array(o.idx) }));
}
