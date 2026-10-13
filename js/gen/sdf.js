// Biblioteca mínima de campos de distancia con signo (SDF).
// Cada primitiva es una función (x, y, z) => distancia, con:
//   .b  -> caja envolvente [x0, y0, z0, x1, y1, z1]
//   .sp -> (cx, cy, cz, r) => versión simplificada válida dentro de la esfera (c, r)
// Las coordenadas están en metros: y hacia arriba, z hacia anterior, x hacia la izquierda del sujeto.

const { sqrt, abs, max, min } = Math;
const INF = 1e9;

function B(f, b) { f.b = b; return f; }

function norm(v) {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}
function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

// Base ortonormal a partir de un eje principal (local y) y una dirección aproximada para local z.
export function basisFromY(yAxis, zHint = [0, 0, 1]) {
  const v = norm(yAxis);
  let w = norm(zHint);
  let u = cross(v, w);
  if (Math.hypot(u[0], u[1], u[2]) < 1e-6) { w = [1, 0, 0]; u = cross(v, w); }
  u = norm(u);
  w = norm(cross(u, v));
  return { u, v, w };
}
export function basisRotY(angle) {
  const c = Math.cos(angle), s = Math.sin(angle);
  return { u: [c, 0, -s], v: [0, 1, 0], w: [s, 0, c] };
}
export function basisEuler(rx = 0, ry = 0, rz = 0) {
  // R = Ry * Rx * Rz  (columnas = ejes locales)
  const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry), cz = Math.cos(rz), sz = Math.sin(rz);
  const Rx = [[1, 0, 0], [0, cx, -sx], [0, sx, cx]];
  const Ry = [[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]];
  const Rz = [[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]];
  const mul = (A, Bm) => A.map((r, i) => [0, 1, 2].map(j => r[0] * Bm[0][j] + r[1] * Bm[1][j] + r[2] * Bm[2][j]));
  const R = mul(mul(Ry, Rx), Rz);
  return { u: [R[0][0], R[1][0], R[2][0]], v: [R[0][1], R[1][1], R[2][1]], w: [R[0][2], R[1][2], R[2][2]] };
}

function rotBounds(c, e, bs) {
  // e: semiejes locales; bs: base
  if (!bs) return [c[0] - e[0], c[1] - e[1], c[2] - e[2], c[0] + e[0], c[1] + e[1], c[2] + e[2]];
  const { u, v, w } = bs;
  const hx = abs(u[0]) * e[0] + abs(v[0]) * e[1] + abs(w[0]) * e[2];
  const hy = abs(u[1]) * e[0] + abs(v[1]) * e[1] + abs(w[1]) * e[2];
  const hz = abs(u[2]) * e[0] + abs(v[2]) * e[1] + abs(w[2]) * e[2];
  return [c[0] - hx, c[1] - hy, c[2] - hz, c[0] + hx, c[1] + hy, c[2] + hz];
}

export function sphere(c, r) {
  const [cx, cy, cz] = c;
  return B((x, y, z) => { const dx = x - cx, dy = y - cy, dz = z - cz; return sqrt(dx * dx + dy * dy + dz * dz) - r; },
    [cx - r, cy - r, cz - r, cx + r, cy + r, cz + r]);
}

// Elipsoide (aproximación de Quilez). r = [a, b, c] en ejes locales de la base bs.
export function ellipsoid(c, r, bs) {
  const [cx, cy, cz] = c, [a, b, cc] = r;
  const ia = 1 / a, ib = 1 / b, ic = 1 / cc, ia2 = ia * ia, ib2 = ib * ib, ic2 = ic * ic;
  let f;
  if (!bs) {
    f = (x, y, z) => {
      const lx = x - cx, ly = y - cy, lz = z - cz;
      const k0 = sqrt(lx * lx * ia2 + ly * ly * ib2 + lz * lz * ic2);
      const k1 = sqrt(lx * lx * ia2 * ia2 + ly * ly * ib2 * ib2 + lz * lz * ic2 * ic2);
      return k1 < 1e-12 ? -min(a, b, cc) : k0 * (k0 - 1) / k1;
    };
  } else {
    const { u, v, w } = bs;
    f = (x, y, z) => {
      const px = x - cx, py = y - cy, pz = z - cz;
      const lx = px * u[0] + py * u[1] + pz * u[2];
      const ly = px * v[0] + py * v[1] + pz * v[2];
      const lz = px * w[0] + py * w[1] + pz * w[2];
      const k0 = sqrt(lx * lx * ia2 + ly * ly * ib2 + lz * lz * ic2);
      const k1 = sqrt(lx * lx * ia2 * ia2 + ly * ly * ib2 * ib2 + lz * lz * ic2 * ic2);
      return k1 < 1e-12 ? -min(a, b, cc) : k0 * (k0 - 1) / k1;
    };
  }
  return B(f, rotBounds(c, r, bs));
}

// Elipsoide orientado según un eje (a -> b) con radios transversales rx (hacia zHint) y ry.
export function ellipsoidAxis(a, b, rWide, rDeep, zHint = [0, 0, 1]) {
  const c = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / 2;
  const bs = basisFromY([b[0] - a[0], b[1] - a[1], b[2] - a[2]], zHint);
  return ellipsoid(c, [rWide, len, rDeep], bs);
}

export function capsule(a, b, r) {
  const [ax, ay, az] = a;
  const bax = b[0] - ax, bay = b[1] - ay, baz = b[2] - az;
  const dd = bax * bax + bay * bay + baz * baz || 1e-12;
  return B((x, y, z) => {
    const px = x - ax, py = y - ay, pz = z - az;
    let h = (px * bax + py * bay + pz * baz) / dd;
    h = h < 0 ? 0 : h > 1 ? 1 : h;
    const qx = px - bax * h, qy = py - bay * h, qz = pz - baz * h;
    return sqrt(qx * qx + qy * qy + qz * qz) - r;
  }, [min(a[0], b[0]) - r, min(a[1], b[1]) - r, min(a[2], b[2]) - r, max(a[0], b[0]) + r, max(a[1], b[1]) + r, max(a[2], b[2]) + r]);
}

// Cono redondeado (exacto, Quilez).
export function roundCone(a, b, r1, r2) {
  const bax = b[0] - a[0], bay = b[1] - a[1], baz = b[2] - a[2];
  const l2 = bax * bax + bay * bay + baz * baz;
  const rr = r1 - r2, a2 = l2 - rr * rr, il2 = 1 / l2;
  const [ax, ay, az] = a;
  const f = (x, y, z) => {
    const px = x - ax, py = y - ay, pz = z - az;
    const yv = px * bax + py * bay + pz * baz;
    const zv = yv - l2;
    const qx = px * l2 - bax * yv, qy = py * l2 - bay * yv, qz = pz * l2 - baz * yv;
    const x2 = qx * qx + qy * qy + qz * qz;
    const y2 = yv * yv * l2;
    const z2 = zv * zv * l2;
    const k = Math.sign(rr) * rr * rr * x2;
    if (Math.sign(zv) * a2 * z2 > k) return sqrt(x2 + z2) * il2 - r2;
    if (Math.sign(yv) * a2 * y2 < k) return sqrt(x2 + y2) * il2 - r1;
    return (sqrt(x2 * a2 * il2) + yv * rr) * il2 - r1;
  };
  const r = max(r1, r2);
  return B(f, [min(a[0], b[0]) - r, min(a[1], b[1]) - r, min(a[2], b[2]) - r, max(a[0], b[0]) + r, max(a[1], b[1]) + r, max(a[2], b[2]) + r]);
}

// Cadena de conos redondeados a través de puntos con radios.
export function chain(pts, radii, k = 0) {
  const parts = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const r1 = Array.isArray(radii) ? radii[i] : radii;
    const r2 = Array.isArray(radii) ? radii[i + 1] : radii;
    parts.push(roundCone(pts[i], pts[i + 1], r1, r2));
  }
  return k > 0 ? sunion(k, ...parts) : union(...parts);
}

// Caja redondeada con base opcional. h = semiextensiones.
export function roundBox(c, h, r = 0, bs) {
  const [cx, cy, cz] = c, [hx, hy, hz] = [h[0] - r, h[1] - r, h[2] - r];
  const loc = bs ? bs : null;
  const f = (x, y, z) => {
    let px = x - cx, py = y - cy, pz = z - cz;
    if (loc) {
      const lx = px * loc.u[0] + py * loc.u[1] + pz * loc.u[2];
      const ly = px * loc.v[0] + py * loc.v[1] + pz * loc.v[2];
      const lz = px * loc.w[0] + py * loc.w[1] + pz * loc.w[2];
      px = lx; py = ly; pz = lz;
    }
    const qx = abs(px) - hx, qy = abs(py) - hy, qz = abs(pz) - hz;
    const ox = max(qx, 0), oy = max(qy, 0), oz = max(qz, 0);
    return sqrt(ox * ox + oy * oy + oz * oz) + min(max(qx, max(qy, qz)), 0) - r;
  };
  return B(f, rotBounds(c, h, bs));
}

// Cilindro elíptico vertical (en ejes locales) con bordes redondeados.
export function ellCyl(c, rx, rz, hh, round = 0, bs) {
  const [cx, cy, cz] = c;
  const m = min(rx, rz);
  const f = (x, y, z) => {
    let px = x - cx, py = y - cy, pz = z - cz;
    if (bs) {
      const lx = px * bs.u[0] + py * bs.u[1] + pz * bs.u[2];
      const ly = px * bs.v[0] + py * bs.v[1] + pz * bs.v[2];
      const lz = px * bs.w[0] + py * bs.w[1] + pz * bs.w[2];
      px = lx; py = ly; pz = lz;
    }
    const d2 = (sqrt((px / (rx - round)) ** 2 + (pz / (rz - round)) ** 2) - 1) * (m - round);
    const dy = abs(py) - (hh - round);
    const ox = max(d2, 0), oy = max(dy, 0);
    return min(max(d2, dy), 0) + sqrt(ox * ox + oy * oy) - round;
  };
  return B(f, rotBounds(c, [rx, hh, rz], bs));
}

// Toro en el plano local xz.
export function torus(c, R, r, bs) {
  const [cx, cy, cz] = c;
  const f = (x, y, z) => {
    let px = x - cx, py = y - cy, pz = z - cz;
    if (bs) {
      const lx = px * bs.u[0] + py * bs.u[1] + pz * bs.u[2];
      const ly = px * bs.v[0] + py * bs.v[1] + pz * bs.v[2];
      const lz = px * bs.w[0] + py * bs.w[1] + pz * bs.w[2];
      px = lx; py = ly; pz = lz;
    }
    const q = sqrt(px * px + pz * pz) - R;
    return sqrt(q * q + py * py) - r;
  };
  return B(f, rotBounds(c, [R + r, r, R + r], bs));
}

// Triángulo grueso (distancia exacta a un triángulo 3D menos un grosor).
export function triangle(a, b, c, t) {
  {
    const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const cr = cross(e1, e2);
    if (Math.hypot(cr[0], cr[1], cr[2]) < 1e-10) {
      // triángulo degenerado: usar el segmento más largo
      const d1 = Math.hypot(...e1), d2 = Math.hypot(...e2);
      return d1 > d2 ? capsule(a, b, t) : capsule(a, c, t);
    }
  }
  const ba = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const cb = [c[0] - b[0], c[1] - b[1], c[2] - b[2]];
  const ac = [a[0] - c[0], a[1] - c[1], a[2] - c[2]];
  const nor = cross(ba, ac);
  const nba = cross(ba, nor), ncb = cross(cb, nor), nac = cross(ac, nor);
  const dba = ba[0] ** 2 + ba[1] ** 2 + ba[2] ** 2, dcb = cb[0] ** 2 + cb[1] ** 2 + cb[2] ** 2, dac = ac[0] ** 2 + ac[1] ** 2 + ac[2] ** 2;
  const dnor = nor[0] ** 2 + nor[1] ** 2 + nor[2] ** 2;
  const clamp = v => v < 0 ? 0 : v > 1 ? 1 : v;
  const f = (x, y, z) => {
    const pa0 = x - a[0], pa1 = y - a[1], pa2 = z - a[2];
    const pb0 = x - b[0], pb1 = y - b[1], pb2 = z - b[2];
    const pc0 = x - c[0], pc1 = y - c[1], pc2 = z - c[2];
    const s = Math.sign(nba[0] * pa0 + nba[1] * pa1 + nba[2] * pa2) +
      Math.sign(ncb[0] * pb0 + ncb[1] * pb1 + ncb[2] * pb2) +
      Math.sign(nac[0] * pc0 + nac[1] * pc1 + nac[2] * pc2);
    let d2;
    if (s < 2) {
      let h = clamp((ba[0] * pa0 + ba[1] * pa1 + ba[2] * pa2) / dba);
      let qx = ba[0] * h - pa0, qy = ba[1] * h - pa1, qz = ba[2] * h - pa2;
      let m = qx * qx + qy * qy + qz * qz;
      h = clamp((cb[0] * pb0 + cb[1] * pb1 + cb[2] * pb2) / dcb);
      qx = cb[0] * h - pb0; qy = cb[1] * h - pb1; qz = cb[2] * h - pb2;
      m = min(m, qx * qx + qy * qy + qz * qz);
      h = clamp((ac[0] * pc0 + ac[1] * pc1 + ac[2] * pc2) / dac);
      qx = ac[0] * h - pc0; qy = ac[1] * h - pc1; qz = ac[2] * h - pc2;
      d2 = min(m, qx * qx + qy * qy + qz * qz);
    } else {
      const dn = nor[0] * pa0 + nor[1] * pa1 + nor[2] * pa2;
      d2 = dn * dn / dnor;
    }
    return sqrt(d2) - t;
  };
  return B(f, [min(a[0], b[0], c[0]) - t, min(a[1], b[1], c[1]) - t, min(a[2], b[2], c[2]) - t,
    max(a[0], b[0], c[0]) + t, max(a[1], b[1], c[1]) + t, max(a[2], b[2], c[2]) + t]);
}

// Abanico de triángulos gruesos desde un vértice común hacia una polilínea.
export function fan(apex, rim, t, k = 0.004) {
  const tris = [];
  for (let i = 0; i < rim.length - 1; i++) tris.push(triangle(apex, rim[i], rim[i + 1], t));
  return sunion(k, ...tris);
}
// Lámina entre dos polilíneas (cinta) formada por triángulos gruesos.
export function ribbon(lineA, lineB, t, k = 0.003) {
  const tris = [];
  for (let i = 0; i < lineA.length - 1; i++) {
    tris.push(triangle(lineA[i], lineB[i], lineB[i + 1], t));
    tris.push(triangle(lineA[i], lineB[i + 1], lineA[i + 1], t));
  }
  return sunion(k, ...tris);
}

// Semiespacio: negativo del lado opuesto a n (dot(p - p0, n) <= 0 está dentro).
export function plane(p0, n) {
  const [nx, ny, nz] = norm(n);
  const [px0, py0, pz0] = p0;
  return B((x, y, z) => (x - px0) * nx + (y - py0) * ny + (z - pz0) * nz, [-INF, -INF, -INF, INF, INF, INF]);
}

// ---------- Operadores ----------

function boundsUnion(fs, pad = 0) {
  const b = [INF, INF, INF, -INF, -INF, -INF];
  for (const f of fs) for (let i = 0; i < 3; i++) { b[i] = min(b[i], f.b[i] - pad); b[i + 3] = max(b[i + 3], f.b[i + 3] + pad); }
  return b;
}
function boundsInter(fs) {
  const b = [-INF, -INF, -INF, INF, INF, INF];
  for (const f of fs) for (let i = 0; i < 3; i++) { b[i] = max(b[i], f.b[i]); b[i + 3] = min(b[i + 3], f.b[i + 3]); }
  return b;
}

export function smin(a, b, k) {
  const h = max(k - abs(a - b), 0) / k;
  return min(a, b) - h * h * k * 0.25;
}
export function smax(a, b, k) {
  const h = max(k - abs(a - b), 0) / k;
  return max(a, b) + h * h * k * 0.25;
}

function makeUnion(fs, k) {
  const n = fs.length;
  let f;
  if (n === 1) return fs[0];
  if (k > 0) {
    if (n === 2) { const [a, b] = fs; f = (x, y, z) => smin(a(x, y, z), b(x, y, z), k); }
    else f = (x, y, z) => { let d = fs[0](x, y, z); for (let i = 1; i < n; i++) d = smin(d, fs[i](x, y, z), k); return d; };
  } else {
    if (n === 2) { const [a, b] = fs; f = (x, y, z) => min(a(x, y, z), b(x, y, z)); }
    else f = (x, y, z) => { let d = fs[0](x, y, z); for (let i = 1; i < n; i++) { const e = fs[i](x, y, z); if (e < d) d = e; } return d; };
  }
  f.b = boundsUnion(fs, k * 0.25);
  // Simplificación local: descarta hijos que no pueden influir dentro de la esfera (c, r).
  f.sp = (cx, cy, cz, r) => {
    const vals = fs.map(g => g(cx, cy, cz));
    let m = INF;
    for (const v of vals) if (v < m) m = v;
    const keep = [];
    for (let i = 0; i < n; i++) if (vals[i] - 2 * r - k <= m) { const g = fs[i]; let s = g.sp ? g.sp(cx, cy, cz, r) : g; if (!s.b) s.b = g.b; keep.push(s); }
    if (keep.length === n && keep.every((g, i) => g === fs[i])) return f;
    return makeUnion(keep, k);
  };
  return f;
}
export const union = (...fs) => makeUnion(fs.flat().filter(Boolean), 0);
export const sunion = (k, ...fs) => makeUnion(fs.flat().filter(Boolean), k);

function spc(a, cx, cy, cz, r) {
  if (!a.sp) return a;
  const s = a.sp(cx, cy, cz, r);
  if (!s.b) s.b = a.b;
  return s;
}
function specKids(fs, cx, cy, cz, r) {
  return fs.map(g => {
    if (!g.sp) return g;
    const s = g.sp(cx, cy, cz, r);
    if (!s.b) s.b = g.b;
    return s;
  });
}

export function inter(...fs) {
  fs = fs.flat();
  const n = fs.length;
  const f = n === 2 ? ((a, b) => (x, y, z) => max(a(x, y, z), b(x, y, z)))(fs[0], fs[1])
    : (x, y, z) => { let d = fs[0](x, y, z); for (let i = 1; i < n; i++) { const e = fs[i](x, y, z); if (e > d) d = e; } return d; };
  f.b = boundsInter(fs);
  f.sp = (cx, cy, cz, r) => {
    // Si un hijo es claramente negativo en toda la esfera, se puede omitir.
    const keep = [];
    for (const g of fs) { if (g(cx, cy, cz) + 2 * r < 0 && fs.length > 1) continue; keep.push(g); }
    if (!keep.length) keep.push(fs[0]);
    const kids = specKids(keep, cx, cy, cz, r);
    return kids.length === 1 ? kids[0] : inter(...kids);
  };
  return f;
}
export function sinter(k, ...fs) {
  fs = fs.flat();
  const n = fs.length;
  const f = (x, y, z) => { let d = fs[0](x, y, z); for (let i = 1; i < n; i++) d = smax(d, fs[i](x, y, z), k); return d; };
  f.b = boundsInter(fs);
  f.sp = (cx, cy, cz, r) => sinter(k, ...specKids(fs, cx, cy, cz, r));
  return f;
}
export function sub(a, ...bs) {
  const bb = bs.length === 1 ? bs[0] : union(...bs);
  const f = (x, y, z) => max(a(x, y, z), -bb(x, y, z));
  f.b = a.b.slice();
  f.sp = (cx, cy, cz, r) => {
    if (bb(cx, cy, cz) - 2 * r > 0) return spc(a, cx, cy, cz, r);
    const [a2, b2] = specKids([a, bb], cx, cy, cz, r);
    return sub(a2, b2);
  };
  return f;
}
export function ssub(k, a, ...bs) {
  const bb = bs.length === 1 ? bs[0] : union(...bs);
  const f = (x, y, z) => smax(a(x, y, z), -bb(x, y, z), k);
  f.b = a.b.slice();
  f.sp = (cx, cy, cz, r) => {
    if (bb(cx, cy, cz) - 2 * r - k > 0) return spc(a, cx, cy, cz, r);
    const [a2, b2] = specKids([a, bb], cx, cy, cz, r);
    return ssub(k, a2, b2);
  };
  return f;
}
export function shell(a, t) {
  const f = (x, y, z) => abs(a(x, y, z)) - t;
  f.b = a.b.map((v, i) => i < 3 ? v - t : v + t);
  f.sp = (cx, cy, cz, r) => shell(spc(a, cx, cy, cz, r), t);
  return f;
}
export function offset(a, t) {
  const f = (x, y, z) => a(x, y, z) - t;
  f.b = a.b.map((v, i) => i < 3 ? v - max(t, 0) : v + max(t, 0));
  f.sp = (cx, cy, cz, r) => offset(spc(a, cx, cy, cz, r), t);
  return f;
}
export function mirrorX(a) {
  const f = (x, y, z) => a(-x, y, z);
  f.b = [-a.b[3], a.b[1], a.b[2], -a.b[0], a.b[4], a.b[5]];
  f.sp = (cx, cy, cz, r) => { const s = spc(a, -cx, cy, cz, r); return s === a ? f : mirrorX(s); };
  return f;
}
// Desplazamiento de superficie por una función de ruido g(x,y,z) (valor sumado a la distancia).
export function displace(a, g, amp) {
  const f = (x, y, z) => a(x, y, z) + g(x, y, z);
  f.b = a.b.map((v, i) => i < 3 ? v - amp : v + amp);
  f.sp = (cx, cy, cz, r) => displace(spc(a, cx, cy, cz, r + amp), g, amp);
  return f;
}
export function withBounds(a, b) {
  const f = (x, y, z) => a(x, y, z);
  f.b = b;
  f.sp = a.sp;
  return f;
}
export function clipBounds(a, b) {
  const f = (x, y, z) => a(x, y, z);
  f.b = boundsInter([a, { b }]);
  f.sp = a.sp;
  return f;
}

// Polígono 2D (distancia exacta, Quilez). pts: [[u, v], ...]
export function poly2d(pts) {
  const n = pts.length;
  return (px, py) => {
    let d = (px - pts[0][0]) ** 2 + (py - pts[0][1]) ** 2;
    let s = 1;
    for (let i = 0, j = n - 1; i < n; j = i, i++) {
      const ex = pts[j][0] - pts[i][0], ey = pts[j][1] - pts[i][1];
      const wx = px - pts[i][0], wy = py - pts[i][1];
      let h = (wx * ex + wy * ey) / (ex * ex + ey * ey);
      h = h < 0 ? 0 : h > 1 ? 1 : h;
      const bx = wx - ex * h, by = wy - ey * h;
      d = min(d, bx * bx + by * by);
      const c1 = py >= pts[i][1], c2 = py < pts[j][1], c3 = ex * wy > ey * wx;
      if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) s = -s;
    }
    return s * sqrt(d);
  };
}

export { norm, cross };
