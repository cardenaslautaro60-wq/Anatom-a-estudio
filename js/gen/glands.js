// Sistemas endocrino y linfático.
import { ellipsoid, sphere, roundCone, sunion, union, basisEuler } from './sdf.js';
import { tube, smoothPath, merge } from './geom.js';

const END = 'endocrino';
const LYM = 'linfatico';
const ENDC = '#8e6ac4';
const LYMC = '#5aa874';

function nodes(list, r = 0.0032) {
  return union(...list.map(([x, y, z, s]) => ellipsoid([x, y, z], [r * (s || 1), r * 1.3 * (s || 1), r * (s || 1)])));
}

export function buildGlands(R) {
  // ---------------- Endocrino ----------------
  R.sdf('hipofisis', END, sunion(0.002, sphere([0, 1.627, 0.01], 0.0052), roundCone([0, 1.63, 0.01], [0, 1.642, 0.006], 0.0016, 0.0012)), 0.0006, { color: ENDC });
  R.sdf('glandula-pineal', END, ellipsoid([0, 1.656, -0.03], [0.0026, 0.0026, 0.0038]), 0.0005, { color: ENDC });
  R.sdf('tiroides', END, sunion(0.004,
    ellipsoid([0.017, 1.457, 0.021], [0.0075, 0.02, 0.009], basisEuler(0, 0, -0.12)),
    ellipsoid([-0.017, 1.457, 0.021], [0.0075, 0.02, 0.009], basisEuler(0, 0, 0.12)),
    ellipsoid([0, 1.449, 0.03], [0.011, 0.005, 0.0038]),
  ), 0.0011, { color: '#a26fbf' });
  R.bi('paratiroides', END, union(sphere([0.02, 1.469, 0.013], 0.0027), sphere([0.02, 1.443, 0.012], 0.0027)), 0.0005, { color: '#c39adf' });
  R.sdf('glandula-suprarrenal', END, ellipsoid([0.04, 1.16, -0.043], [0.0115, 0.02, 0.0055], basisEuler(0.2, -0.5, -0.4)), 0.0009, { side: 'L', color: '#d2a640' });
  R.sdf('glandula-suprarrenal', END, ellipsoid([-0.042, 1.147, -0.045], [0.012, 0.016, 0.0065], basisEuler(0.2, 0.5, 0.3)), 0.0009, { side: 'R', color: '#d2a640' });

  // ---------------- Linfático ----------------
  R.sdf('timo', LYM, union(ellipsoid([0.008, 1.384, 0.047], [0.0105, 0.024, 0.0065]), ellipsoid([-0.007, 1.38, 0.047], [0.0105, 0.026, 0.0065])), 0.001, { color: '#83b98c' });
  R.sdf('bazo', LYM, ellipsoid([0.1, 1.142, -0.056], [0.016, 0.045, 0.03], basisEuler(0.55, -0.55, 0.15)), 0.0016, { color: '#6c2f4c' });
  R.bi('amigdala-palatina', LYM, ellipsoid([0.016, 1.562, 0.03], [0.0038, 0.0075, 0.0048]), 0.0006, { color: '#c97a86' });
  R.bi('ganglios-cervicales', LYM, nodes([[0.045, 1.55, 0.012], [0.046, 1.53, 0.016, 1.2], [0.044, 1.51, 0.014], [0.045, 1.49, 0.01, 0.9], [0.043, 1.47, 0.012], [0.055, 1.5, -0.01], [0.052, 1.535, -0.015, 0.8], [0.032, 1.53, 0.045, 0.9]]), 0.0008, { color: LYMC });
  R.bi('ganglios-axilares', LYM, nodes([[0.135, 1.375, -0.012, 1.2], [0.14, 1.36, -0.002], [0.13, 1.35, -0.02], [0.125, 1.39, 0.0, 0.9], [0.145, 1.345, -0.012], [0.118, 1.37, -0.022, 0.8]]), 0.0008, { color: LYMC });
  R.bi('ganglios-inguinales', LYM, nodes([[0.078, 0.89, 0.065, 1.2], [0.065, 0.885, 0.068], [0.09, 0.875, 0.062], [0.082, 0.86, 0.06, 0.9], [0.072, 0.848, 0.058]]), 0.0008, { color: LYMC });
  R.sdf('ganglios-mesentericos', LYM, nodes([[0.0, 1.06, 0.04], [0.015, 1.05, 0.035], [-0.012, 1.045, 0.036], [0.022, 1.03, 0.03], [-0.02, 1.025, 0.032], [0.005, 1.035, 0.038], [0.01, 1.075, 0.03], [-0.008, 1.08, 0.028]], 0.0028), 0.0008, { color: LYMC });
  R.sdf('ganglios-paraaorticos', LYM, nodes([[0.022, 1.12, -0.024], [-0.008, 1.1, -0.02], [0.024, 1.07, -0.016], [-0.006, 1.05, -0.012], [0.024, 1.03, -0.012], [0.03, 0.99, -0.02], [-0.022, 0.99, -0.02]], 0.0028), 0.0008, { color: LYMC });
  R.geom('conducto-toracico', LYM, () => merge([
    tube(smoothPath([[0.004, 1.11, -0.034], [0.004, 1.16, -0.042], [0.0, 1.22, -0.05], [0.002, 1.3, -0.052], [0.01, 1.36, -0.05], [0.016, 1.41, -0.032], [0.026, 1.448, -0.012], [0.038, 1.452, 0.004], [0.042, 1.432, 0.016]], 0.003), 0.0017, { radial: 8 }),
  ]), { color: '#9bd0a8' });
  R.sdf('cisterna-quilo', LYM, ellipsoid([0.004, 1.11, -0.032], [0.005, 0.012, 0.0045]), 0.0007, { color: '#9bd0a8' });
}
