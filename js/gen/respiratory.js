// Sistema respiratorio: laringe, tráquea, bronquios, árbol bronquial, pulmones (lóbulos) y diafragma.
import { ellipsoid, ellipsoidAxis, capsule, triangle, torus, sunion, ssub, smax, basisEuler, union } from './sdf.js';
import { meshSDF } from './mesher.js';
import { tube, smoothPath, merge, splitByClass, normalize, sub3, add3, madd, lerp3 } from './geom.js';
import { thoraxInterior, diaphragmY, thoraxAt } from './anat.js';
import { heartSDF } from './cardio.js';

const SYS = 'respiratorio';
const CART = '#cdd5d6';
const LUNG = { sup: '#e7a1a6', med: '#d9858d', inf: '#df949a' };

function larynxSDF(sex) {
  const fem = sex === 'F';
  const zA = fem ? 0.036 : 0.043;
  const plates = [];
  for (const s of [1, -1]) {
    const a1 = [0, 1.514, zA], a2 = [0, 1.49, zA - 0.004];
    const b1 = [0.02 * s, 1.52, 0.014], b2 = [0.019 * s, 1.488, 0.012];
    plates.push(triangle(a1, b1, b2, 0.0013), triangle(a1, b2, a2, 0.0013));
    plates.push(capsule(b1, [0.019 * s, 1.53, 0.008], 0.0016), capsule(b2, [0.017 * s, 1.482, 0.01], 0.0016));
  }
  const thyroid = sunion(0.003, ...plates);
  const cricoid = sunion(0.004, torus([0, 1.472, 0.02], 0.0105, 0.0024), ellipsoid([0, 1.478, 0.008], [0.009, 0.01, 0.0025]));
  const epiglottis = ellipsoid([0, 1.528, 0.024], [0.0085, 0.013, 0.0016], basisEuler(-0.35, 0, 0));
  const arytenoid = union(ellipsoid([0.006, 1.484, 0.011], [0.0025, 0.004, 0.0025]), ellipsoid([-0.006, 1.484, 0.011], [0.0025, 0.004, 0.0025]));
  return union(thyroid, cricoid, epiglottis, arytenoid);
}

// Mediastino (región ocupada entre los pulmones)
function mediastinum() {
  const H = heartSDF();
  const parts = sunion(0.01,
    (() => { const f = (x, y, z) => Math.abs(x) - 0.024 + (z < -0.04 ? -0.002 : 0); f.b = [-0.03, 1.0, -0.2, 0.03, 1.5, 0.2]; return f; })(),
    H,
    capsule([0.026, 1.38, -0.045], [0.022, 1.16, -0.045], 0.016),   // aorta descendente
    capsule([0.0, 1.392, 0.0], [0.024, 1.385, -0.03], 0.018),      // cayado
    capsule([-0.026, 1.4, 0.02], [-0.026, 1.326, 0.022], 0.014),   // vena cava superior
  );
  return parts;
}

function lungSDF(side) {
  const thx = thoraxInterior(0.004);
  const med = mediastinum();
  const f = (x, y, z) => {
    if (side * x < 0.004) return 0.01 + Math.abs(x);
    let d = thx(x, y, z);
    d = smax(d, diaphragmY(x, z) + 0.004 - y, 0.012);
    if (d > 0.02) return d;
    d = smax(d, 0.008 - med(x, y, z), 0.01);
    return d;
  };
  f.b = side > 0 ? [0.0, 1.05, -0.12, 0.15, 1.47, 0.12] : [-0.15, 1.05, -0.12, 0.0, 1.47, 0.12];
  return f;
}
// Clasificación de lóbulos por cisuras
function lobeR(x, y, z) {
  const obl = (y - 1.372) * 0.75 + (z + 0.09) * 0.66;
  if (obl < 0) return 2;            // inferior
  if (y < 1.31 && z > -0.045) return 1; // medio
  return 0;                          // superior
}
function lobeL(x, y, z) {
  const obl = (y - 1.38) * 0.75 + (z + 0.09) * 0.66;
  return obl < 0 ? 1 : 0;
}

// Árbol bronquial simple y determinista
function bronchialTree() {
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const branches = [];
  const grow = (p, dir, len, r, depth) => {
    const q = madd(p, dir, len);
    branches.push([[p, lerp3(p, q, 0.5), q], r]);
    if (depth <= 0) return;
    for (let k = 0; k < 2; k++) {
      const jitter = [(rnd() - 0.5) * 0.9, (rnd() - 0.5) * 0.9, (rnd() - 0.5) * 0.9];
      const nd = normalize(add3(dir, jitter));
      grow(q, nd, len * 0.72, r * 0.72, depth - 1);
    }
  };
  const lobes = [
    [[-0.052, 1.322, -0.02], [-0.075, 1.4, -0.01]],
    [[-0.055, 1.31, -0.018], [-0.075, 1.28, 0.045]],
    [[-0.055, 1.305, -0.022], [-0.085, 1.22, -0.045]],
    [[0.056, 1.322, -0.018], [0.075, 1.39, -0.0]],
    [[0.056, 1.315, -0.016], [0.07, 1.27, 0.05]],
    [[0.056, 1.308, -0.022], [0.088, 1.22, -0.045]],
  ];
  for (const [a, b] of lobes) {
    const dir = normalize(sub3(b, a));
    grow(a, dir, 0.03, 0.0038, 3);
  }
  return merge(branches.map(([pts, r]) => tube(smoothPath(pts, 0.003), r, { radial: 6 })));
}

function diaphragmSDF() {
  const thx = thoraxInterior(-0.002);
  const f = (x, y, z) => {
    const t = thoraxAt(Math.min(y, 1.26));
    const wall = (Math.sqrt((x / (t.rx + 0.004)) ** 2 + ((z - t.cz) / (t.rz + 0.004)) ** 2) - 1) * Math.min(t.rx, t.rz);
    const dome = (y - diaphragmY(x, z)) * 0.7;
    let d = Math.abs(Math.max(dome, wall)) - 0.0022;
    // inserción en el reborde costal y en la columna
    const cmFront = 1.228 - 1.0 * Math.abs(x), cmLat = 1.1;
    const tz = Math.min(1, Math.max(0, z / 0.085));
    const cm = z > 0 ? cmLat + (cmFront - cmLat) * tz * tz * (3 - 2 * tz) : cmLat - 0.02 * Math.min(1, -z / 0.09);
    d = Math.max(d, cm - y);
    // hiatos: cava (T8), esofágico (T10) y aórtico (T12)
    const holes = [[-0.022, -0.002, 0.0105], [0.012, -0.034, 0.0085], [0.012, -0.044, 0.011]];
    for (const [hx, hz, hr] of holes) d = Math.max(d, hr - Math.hypot(x - hx, z - hz));
    return d;
  };
  f.b = [-0.14, 1.07, -0.1, 0.14, 1.25, 0.1];
  void thx;
  return f;
}

export function buildRespiratory(R) {
  R.sdf('laringe', SYS, larynxSDF(R.sex), 0.0009, { color: CART });
  R.geom('traquea', SYS, () => tube(smoothPath([[0, 1.463, 0.02], [0, 1.43, 0.015], [0, 1.4, 0.006], [0, 1.375, -0.004], [0.001, 1.355, -0.011]], 0.0015),
    t => 0.0082 + 0.0008 * Math.max(0, Math.cos(2 * Math.PI * t * 17)), { radial: 16 }), { color: CART });
  R.geom('bronquios-principales', SYS, () => merge([
    tube(smoothPath([[0.001, 1.355, -0.011], [-0.014, 1.345, -0.013], [-0.034, 1.333, -0.016], [-0.05, 1.323, -0.019]], 0.002), 0.0064, { radial: 12 }),
    tube(smoothPath([[0.001, 1.355, -0.011], [0.018, 1.348, -0.013], [0.04, 1.336, -0.015], [0.056, 1.322, -0.018]], 0.002), 0.0054, { radial: 12 }),
  ]), { color: CART });
  R.geom('arbol-bronquial', SYS, () => bronchialTree(), { color: '#d9c7bd' });

  R.group(SYS, [
    { id: 'pulmon-derecho-superior', color: LUNG.sup }, { id: 'pulmon-derecho-medio', color: LUNG.med }, { id: 'pulmon-derecho-inferior', color: LUNG.inf },
  ], () => splitByClass(meshSDF(lungSDF(-1), 0.0026), 3, lobeR), { weight: 2 });
  R.group(SYS, [
    { id: 'pulmon-izquierdo-superior', color: LUNG.sup }, { id: 'pulmon-izquierdo-inferior', color: LUNG.inf },
  ], () => splitByClass(meshSDF(lungSDF(1), 0.0026), 2, lobeL), { weight: 2 });

  R.sdf('diafragma', SYS, diaphragmSDF(), 0.0024, { color: '#c4695d' });
  void ellipsoidAxis; void ssub;
}
