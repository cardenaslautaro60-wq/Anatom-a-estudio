// Sistema nervioso: encéfalo (lóbulos), cerebelo, tronco del encéfalo, médula, nervios y ojos.
import { ellipsoid, roundCone, sphere, sunion, ssub, displace, smax } from './sdf.js';
import { meshSDF } from './mesher.js';
import { tube, smoothPath, merge, splitByClass, add3, madd, mirrorPts, lerp3 } from './geom.js';
import { VERTEBRAE, V, canalZ, vertDims, ARM, handPt, fingerJoints, HEAD, SACRUM } from './anat.js';
import { fpt, ribPath } from './skeleton.js';

const SYS = 'nervioso';
const NERVE = '#e9c84a';
const LOBE = { frontal: '#e3b6a6', parietal: '#d3afc4', temporal: '#b6c3da', occipital: '#bfd3b0' };

// Línea del surco lateral (cisura de Silvio)
const yLS = z => 1.646 - 0.26 * z;
const CS_P0 = [0, 1.737, -0.012], CS_N = [0, 0.383, 0.924];
const csDist = (x, y, z) => (y - CS_P0[1]) * CS_N[1] + (z - CS_P0[2]) * CS_N[2];

function cerebrumSDF() {
  const hemi = (s) => sunion(0.016,
    ellipsoid([0.0335 * s, 1.675, -0.012], [0.0325, 0.0615, 0.085]),
    ellipsoid([0.047 * s, 1.629, 0.0], [0.021, 0.022, 0.04]),
  );
  let c = sunion(0.002, hemi(1), hemi(-1));
  // Base del lóbulo frontal (sobre los techos orbitarios) y separación del cerebelo
  const base = (x, y, z) => (z > 0.02 ? 1.651 + 0.32 * (z - 0.02) - y : -1);
  base.b = c.b;
  c = (() => { const a = c; const f = (x, y, z) => smax(a(x, y, z), base(x, y, z), 0.01); f.b = a.b; f.sp = (cx, cy, cz, r) => { const s = a.sp ? a.sp(cx, cy, cz, r) : a; return (x, y, z) => smax(s(x, y, z), base(x, y, z), 0.01); }; return f; })();
  c = ssub(0.006, c, ellipsoid([0, 1.612, -0.06], [0.054, 0.024, 0.036]));
  // Circunvoluciones (patrón giroide) y surcos principales
  const k = 2 * Math.PI / 0.024;
  const gyri = (x, y, z) => {
    const ax = Math.abs(x);
    const g = Math.sin(k * ax) * Math.cos(k * y) + Math.sin(k * y) * Math.cos(k * z) + Math.sin(k * z) * Math.cos(k * ax);
    let d = 0.0019 * Math.exp(-(g * g) / 0.09);
    const ls = y - yLS(z);
    if (ax > 0.035 && z > -0.045) d += 0.0032 * Math.exp(-(ls * ls) / 0.0000045);
    const cs = csDist(x, y, z);
    if (y > yLS(z) + 0.004) d += 0.0024 * Math.exp(-(cs * cs) / 0.0000035);
    return d;
  };
  return displace(c, gyri, 0.006);
}

function lobeOf(x, y, z) {
  const ax = Math.abs(x);
  const left = x >= 0 ? 0 : 1;
  let lobe;
  if (z < -0.064 + 0.1 * (y - 1.68)) lobe = 3;                    // occipital
  else if (y < yLS(z) && ax > 0.018 && z > -0.068) lobe = 2;       // temporal
  else if (csDist(x, y, z) > 0) lobe = 0;                         // frontal
  else lobe = 1;                                                  // parietal
  return lobe * 2 + left;
}

function cerebellumSDF() {
  const c = sunion(0.01,
    ellipsoid([0.024, 1.613, -0.061], [0.029, 0.0195, 0.03]),
    ellipsoid([-0.024, 1.613, -0.061], [0.029, 0.0195, 0.03]),
    ellipsoid([0, 1.612, -0.058], [0.012, 0.018, 0.027]),
  );
  const folia = (x, y, z) => {
    const r = Math.hypot(y - 1.635, z + 0.04);
    return 0.0011 * Math.exp(-Math.pow(Math.sin(r * 2 * Math.PI / 0.0042), 2) / 0.12);
  };
  return displace(c, folia, 0.0015);
}

export function buildNervous(R) {
  // ---------------- Encéfalo ----------------
  const names = ['frontal', 'parietal', 'temporal', 'occipital'];
  const defs = [];
  for (const n of names) for (const side of ['L', 'R']) defs.push({ id: 'lobulo-' + n, side, color: LOBE[n] });
  R.group(SYS, defs, () => {
    const g = meshSDF(cerebrumSDF(), 0.0014);
    return splitByClass(g, 8, lobeOf);
  }, { weight: 3 });
  R.sdf('cerebelo', SYS, cerebellumSDF(), 0.0011, { color: '#d9a99c' });
  R.sdf('mesencefalo', SYS, sunion(0.004, ellipsoid([0, 1.642, -0.022], [0.012, 0.009, 0.0105]), ellipsoid([0.005, 1.648, -0.034], [0.004, 0.004, 0.004]), ellipsoid([-0.005, 1.648, -0.034], [0.004, 0.004, 0.004])), 0.0009, { color: '#d8aa8f' });
  R.sdf('protuberancia', SYS, ellipsoid([0, 1.624, -0.019], [0.0135, 0.0105, 0.0118]), 0.0009, { color: '#d2a088' });
  R.sdf('bulbo-raquideo', SYS, roundCone([0, 1.611, -0.026], [0, 1.586, -0.03], 0.0088, 0.0062), 0.0008, { color: '#d0a48a' });

  // ---------------- Médula espinal ----------------
  const cordPts = [];
  for (let y = 1.586; y >= 1.098; y -= 0.008) {
    const zc = y > 1.578 ? -0.03 + (1.586 - y) / 0.008 * (canalZ(1.578) + 0.03) : canalZ(y);
    cordPts.push([0, y, zc]);
  }
  const cordR = t => {
    const y = 1.586 - t * (1.586 - 1.098);
    let r = 0.0048;
    r += 0.0015 * Math.exp(-(((y - 1.49) / 0.04) ** 2));  // intumescencia cervical
    r += 0.0011 * Math.exp(-(((y - 1.18) / 0.03) ** 2));  // intumescencia lumbar
    if (y < 1.14) r *= Math.max(0.15, (y - 1.098) / 0.042); // cono medular
    return r;
  };
  R.geom('medula-espinal', SYS, () => tube(smoothPath(cordPts, 0.003), cordR, { radial: 12 }), { color: '#efd27a' });
  // Cola de caballo
  R.geom('cola-de-caballo', SYS, () => {
    const gs = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const ox = Math.cos(a) * 0.0035, oz = Math.sin(a) * 0.0025;
      const pts = [];
      for (let y = 1.11; y >= 0.94; y -= 0.01) pts.push([ox * (0.6 + (1.11 - y) * 2), y, canalZ(Math.max(y, 0.97)) + oz - (y < 0.97 ? (0.97 - y) * 1.6 : 0)]);
      gs.push(tube(smoothPath(pts, 0.005), 0.0009, { radial: 6 }));
    }
    return merge(gs);
  }, { color: NERVE });

  // Nervios espinales (raíces que salen por los agujeros intervertebrales)
  R.biGeom('nervios-espinales', SYS, () => {
    const gs = [];
    for (let i = 0; i < VERTEBRAE.length; i++) {
      const [name, y, , t] = VERTEBRAE[i];
      const d = vertDims(name);
      const yy = y - d.hh - 0.002;
      const zc = canalZ(yy);
      const drop = t === 'L' ? 0.022 : t === 'T' ? 0.008 : 0.004;
      const start = [0.004, Math.min(yy + drop * 1.3, 1.582), zc];
      const pts = [start, [d.rf + 0.004, yy + 0.002, zc + 0.002], [d.rf + 0.016, yy - 0.006, zc + 0.006], [d.rf + 0.03, yy - 0.014, zc + 0.012]];
      gs.push(tube(smoothPath(pts, 0.003), 0.0016, { radial: 6 }));
    }
    // sacros
    for (let k = 0; k < 4; k++) {
      const c = lerp3(SACRUM.base, SACRUM.apex, (k + 0.6) / 4.2);
      gs.push(tube(smoothPath([[0.004, c[1] + 0.03, c[2] - 0.012], [0.014, c[1] + 0.003, c[2] + 0.004], [0.022, c[1] - 0.004, c[2] + 0.022], [0.035, c[1] - 0.012, c[2] + 0.03]], 0.003), 0.0016, { radial: 6 }));
    }
    return merge(gs);
  }, { color: NERVE });

  // ---------------- Nervios periféricos (lado izquierdo; el derecho por simetría) ----------------
  const nerve = (id, pts, r, extra = {}) => R.biGeom(id, SYS, () => {
    const branches = Array.isArray(pts[0][0]) ? pts : [pts];
    return merge(branches.map((p, i) => tube(smoothPath(p, 0.004), typeof r === 'function' ? r : (Array.isArray(r) ? r[i] : r), { radial: 8 })));
  }, { color: NERVE, ...extra });

  const E = ARM.elbow, lat = ARM.armLat;
  const axilla = [0.148, 1.372, -0.014];
  nerve('plexo-braquial', [
    [[0.016, 1.505, -0.02], [0.04, 1.47, -0.012], [0.08, 1.43, -0.008], [0.118, 1.405, -0.008], axilla],
    [[0.017, 1.487, -0.024], [0.045, 1.455, -0.014], [0.085, 1.425, -0.01]],
    [[0.018, 1.469, -0.03], [0.048, 1.445, -0.018], [0.09, 1.42, -0.012]],
    [[0.019, 1.45, -0.038], [0.05, 1.433, -0.024], [0.095, 1.415, -0.014]],
    [[0.02, 1.428, -0.046], [0.05, 1.418, -0.03], [0.1, 1.405, -0.016]],
  ], [0.0045, 0.0028, 0.0028, 0.0028, 0.0026]);
  const fingersTo = (ids, lat0) => ids.map(i => { const J = fingerJoints(i); return [handPt(0.05, lat0, 0.009), add3(J[1], [0, 0, 0.006]), add3(J[J.length - 2], [0, 0, 0.005])]; });
  nerve('nervio-mediano', [
    [axilla, [0.18, 1.25, -0.008], [0.205, 1.13, -0.003], fpt(0.005, -0.004, 0.016), fpt(0.12, 0.0, 0.012), fpt(0.235, 0.002, 0.011), handPt(0.04, 0.003, 0.009), handPt(0.05, 0.004, 0.009)],
    ...fingersTo([0, 1, 2], 0.004),
  ], (t) => 0.0029 * (1 - 0.3 * t));
  const medEpiBack = add3(madd(E, lat, -0.031), [0, 0.006, -0.016]);
  nerve('nervio-cubital', [
    [axilla, [0.172, 1.25, -0.022], [0.19, 1.13, -0.032], medEpiBack, fpt(0.06, -0.02, 0.0), fpt(0.2, -0.017, 0.006), handPt(0.015, -0.009, 0.011), handPt(0.04, -0.012, 0.009)],
    ...fingersTo([3, 4], -0.012),
  ], (t) => 0.0026 * (1 - 0.3 * t));
  nerve('nervio-radial', [
    [axilla, [0.172, 1.31, -0.046], [0.205, 1.235, -0.043], [0.232, 1.16, -0.02], [0.244, 1.1, -0.004], fpt(0.02, 0.022, 0.008), fpt(0.15, 0.024, 0.006), fpt(0.225, 0.024, -0.008), handPt(0.04, 0.02, -0.014)],
    [fpt(0.02, 0.022, 0.008), fpt(0.06, 0.012, -0.012), fpt(0.15, 0.006, -0.016)],
  ], [0.003, 0.0018]);
  nerve('nervio-musculocutaneo', [axilla, [0.168, 1.33, 0.0], [0.2, 1.2, 0.012], [0.214, 1.12, 0.012], fpt(0.0, 0.02, 0.012), fpt(0.12, 0.026, 0.013)], 0.0018);
  nerve('nervio-axilar', [axilla, [0.165, 1.365, -0.04], [0.192, 1.352, -0.04], [0.214, 1.36, -0.02]], 0.0018);

  // Miembro inferior
  nerve('nervio-femoral', [
    [[0.025, 1.06, -0.03], [0.045, 1.0, -0.018], [0.06, 0.955, 0.0], [0.072, 0.912, 0.05], [0.074, 0.88, 0.055]],
    [[0.074, 0.88, 0.055], [0.09, 0.82, 0.06], [0.1, 0.74, 0.06]],
    [[0.074, 0.88, 0.055], [0.06, 0.8, 0.045], [0.062, 0.7, 0.03], [0.064, 0.6, 0.0], [0.07, 0.52, -0.022], [0.075, 0.4, -0.012], [0.074, 0.2, -0.004], [0.074, 0.09, 0.012], [0.08, 0.05, 0.05]],
  ], [0.0036, 0.002, 0.0015]);
  const bif = [0.095, 0.565, -0.04];
  nerve('nervio-ciatico', [[0.022, 0.93, -0.062], [0.05, 0.915, -0.07], [0.075, 0.895, -0.07], [0.1, 0.85, -0.06], [0.104, 0.75, -0.05], [0.1, 0.65, -0.045], bif], (t) => 0.0062 - 0.0012 * t);
  nerve('nervio-tibial', [bif, [0.093, 0.5, -0.036], [0.09, 0.4, -0.034], [0.086, 0.25, -0.03], [0.08, 0.13, -0.024], [0.074, 0.085, -0.026], [0.078, 0.04, -0.005], [0.09, 0.02, 0.04], [0.095, 0.015, 0.09]], (t) => 0.0045 - 0.002 * t);
  nerve('nervio-peroneo-comun', [
    [bif, [0.112, 0.51, -0.032], [0.126, 0.455, -0.026], [0.13, 0.437, -0.012], [0.124, 0.43, 0.004]],
    [[0.124, 0.43, 0.004], [0.112, 0.35, 0.006], [0.104, 0.22, 0.012], [0.098, 0.1, 0.02], [0.09, 0.055, 0.06], [0.087, 0.035, 0.12]],
    [[0.124, 0.43, 0.004], [0.128, 0.33, -0.006], [0.122, 0.2, -0.004], [0.112, 0.09, 0.012], [0.105, 0.04, 0.07]],
  ], [0.0034, 0.0018, 0.0016]);

  // Tronco y cabeza
  R.biGeom('nervios-intercostales', SYS, () => {
    const gs = [];
    for (let n = 1; n <= 12; n++) {
      const p = ribPath(n).slice(1).map(q => [q[0] * 0.97, q[1] - 0.0075, q[2] * 0.97]);
      gs.push(tube(smoothPath(p, 0.004), 0.0011, { radial: 6 }));
    }
    return merge(gs);
  }, { color: NERVE });
  nerve('nervio-vago', [[0.01, 1.6, -0.022], [0.03, 1.59, -0.022], [0.032, 1.53, -0.002], [0.03, 1.45, 0.006], [0.028, 1.395, 0.012], [0.03, 1.36, -0.02], [0.016, 1.3, -0.04], [0.014, 1.23, -0.032], [0.022, 1.2, -0.022], [0.04, 1.18, 0.0]], 0.0016);
  nerve('nervio-frenico', [[0.032, 1.53, -0.012], [0.04, 1.47, -0.002], [0.044, 1.42, 0.012], [0.05, 1.37, 0.028], [0.068, 1.31, 0.05], [0.08, 1.265, 0.05], [0.082, 1.225, 0.035]], 0.0012);
  const fn0 = [0.05, 1.596, -0.024], fp = [0.056, 1.6, 0.0];
  nerve('nervio-facial', [
    [fn0, fp],
    [fp, [0.062, 1.625, 0.03], [0.064, 1.66, 0.05]],
    [fp, [0.062, 1.618, 0.045], [0.05, 1.628, 0.075]],
    [fp, [0.058, 1.595, 0.04], [0.04, 1.585, 0.08]],
    [fp, [0.054, 1.565, 0.035], [0.035, 1.545, 0.07]],
    [fp, [0.05, 1.55, 0.005], [0.042, 1.52, 0.02]],
  ], [0.0016, 0.001, 0.001, 0.001, 0.001, 0.001]);
  // Nervios ópticos y quiasma
  R.geom('nervio-optico', SYS, () => {
    const L = [[HEAD.eye[0], HEAD.eye[1], HEAD.eye[2] - 0.011], [0.024, 1.642, 0.04], [0.012, 1.64, 0.022], [0.0, 1.638, 0.016]];
    const tract = [[0.0, 1.638, 0.016], [0.012, 1.64, 0.008], [0.02, 1.645, -0.008], [0.026, 1.652, -0.02]];
    return merge([L, mirrorPts(L), tract, mirrorPts(tract)].map(p => tube(smoothPath(p, 0.003), 0.0021, { radial: 8 })));
  }, { color: NERVE });
  // Globos oculares
  R.bi('ojo', SYS, sunion(0.003, sphere(HEAD.eye, HEAD.eyeR), sphere(add3(HEAD.eye, [0, 0, 0.0075]), 0.0072)), 0.0009, { color: '#f1efe9' });
  void V;
}
