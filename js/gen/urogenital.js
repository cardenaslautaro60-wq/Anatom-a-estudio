// Sistemas urinario y reproductor (masculino o femenino según el modelo).
import { ellipsoid, ellipsoidAxis, roundCone, sphere, capsule, sunion, ssub, basisEuler, union } from './sdf.js';
import { tube, smoothPath, merge, mirrorPts, add3, lerp3 } from './geom.js';

const URI = 'urinario';
const REP = 'reproductor';

function kidneySDF(s, y) {
  const c = [0.056 * s, y, -0.048];
  const bs = basisEuler(0, -0.55 * s, 0.2 * s);
  const k = ellipsoid(c, [0.027, 0.054, 0.018], bs);
  const hil = sphere(add3(c, [-0.03 * s, 0, 0.012]), 0.0125);
  return sunion(0.004, ssub(0.008, k, hil), roundCone(add3(c, [-0.018 * s, 0.0, 0.006]), [0.036 * s, y - 0.012, -0.03], 0.0085, 0.0032));
}

export function buildUrinaryReproductive(R) {
  const F = R.sex === 'F';
  // ---------------- Urinario ----------------
  R.sdf('rinon', URI, kidneySDF(1, 1.104), 0.0018, { side: 'L', color: '#8d3b37' });
  R.sdf('rinon', URI, kidneySDF(-1, 1.089), 0.0018, { side: 'R', color: '#8d3b37' });
  const bl = F ? [0, 0.887, 0.04] : [0, 0.892, 0.035];
  const ureter = (s, y) => [[0.036 * s, y - 0.012, -0.03], [0.042 * s, 1.04, -0.004], [0.05 * s, 0.98, 0.0], [0.06 * s, 0.93, -0.02], [0.062 * s, 0.9, -0.03], [0.045 * s, 0.882, -0.004], [0.02 * s, bl[1] - 0.008, bl[2] - 0.008]];
  R.geom('ureter', URI, () => tube(smoothPath(ureter(1, 1.104), 0.003), 0.0025, { radial: 8 }), { side: 'L', color: '#e0be6a' });
  R.geom('ureter', URI, () => tube(smoothPath(ureter(-1, 1.089), 0.003), 0.0025, { radial: 8 }), { side: 'R', color: '#e0be6a' });
  R.sdf('vejiga', URI, sunion(0.01, ellipsoid(bl, F ? [0.034, 0.024, 0.026] : [0.033, 0.028, 0.027]), roundCone([0, bl[1] - 0.015, bl[2]], [0, 0.866, F ? 0.042 : 0.037], 0.012, 0.005)), 0.0016, { color: '#d6ae63' });
  if (F) {
    R.geom('uretra', URI, () => tube(smoothPath([[0, 0.866, 0.042], [0, 0.855, 0.05], [0, 0.845, 0.056]], 0.002), 0.003, { radial: 8 }), { color: '#e0be6a' });
  } else {
    R.geom('uretra', URI, () => tube(smoothPath([[0, 0.866, 0.037], [0, 0.852, 0.036], [0, 0.838, 0.045], [0, 0.836, 0.062], [0, 0.852, 0.08], [0, 0.845, 0.09], [0, 0.825, 0.096], [0, 0.8, 0.102]], 0.002), 0.0024, { radial: 8 }), { color: '#e0be6a' });
  }

  // ---------------- Reproductor ----------------
  if (!F) {
    R.sdf('prostata', REP, ellipsoid([0, 0.851, 0.036], [0.0195, 0.0145, 0.0135]), 0.0011, { color: '#c88a74' });
    R.bi('vesicula-seminal', REP, ellipsoidAxis([0.008, 0.866, 0.008], [0.03, 0.884, -0.002], 0.0055, 0.0042, [0, 0, 1]), 0.0009, { color: '#d39c84' });
    R.bi('testiculo', REP, ellipsoid([0.016, 0.808, 0.07], [0.0112, 0.0195, 0.0128], basisEuler(0.15, 0, 0)), 0.0009, { color: '#e6c3a4' });
    R.biGeom('epididimo', REP, () => tube(smoothPath([[0.016, 0.83, 0.067], [0.022, 0.822, 0.058], [0.024, 0.806, 0.056], [0.02, 0.79, 0.062]], 0.002), t => 0.0042 - 0.002 * t, { radial: 10 }), { color: '#cf9a80' });
    R.biGeom('conducto-deferente', REP, () => tube(smoothPath([[0.02, 0.79, 0.062], [0.024, 0.812, 0.06], [0.026, 0.84, 0.075], [0.034, 0.875, 0.078], [0.048, 0.9, 0.07], [0.064, 0.914, 0.056], [0.064, 0.92, 0.035], [0.055, 0.905, 0.006], [0.035, 0.885, -0.002], [0.016, 0.87, 0.008], [0.006, 0.862, 0.018], [0.003, 0.853, 0.03]], 0.002), 0.0016, { radial: 8 }), { color: '#d9a98d' });
    R.sdf('pene', REP, sunion(0.006, roundCone([0, 0.862, 0.08], [0, 0.814, 0.096], 0.0105, 0.0105), sphere([0, 0.808, 0.099], 0.0118), roundCone([0, 0.838, 0.06], [0, 0.858, 0.078], 0.007, 0.0095)), 0.0012, { color: '#c98b78' });
  } else {
    const cervix = [0, 0.893, -0.014];
    R.sdf('utero', REP, sunion(0.012, ellipsoidAxis([0, 0.905, -0.002], [0, 0.948, 0.034], 0.025, 0.016, [0, -0.6, 0.8]), roundCone(cervix, [0, 0.907, -0.0], 0.0115, 0.013)), 0.0014, { color: '#c97b86' });
    R.biGeom('trompa-uterina', REP, () => merge([
      tube(smoothPath([[0.018, 0.942, 0.026], [0.038, 0.948, 0.018], [0.058, 0.944, 0.006], [0.07, 0.932, -0.004], [0.068, 0.918, -0.012]], 0.002), t => 0.0019 + 0.0022 * t, { radial: 10 }),
      ...[0, 1, 2, 3, 4].map(k => tube(smoothPath([[0.068, 0.918, -0.012], [0.068 - 0.006 + k * 0.003, 0.908, -0.016 + (k % 2) * 0.004]], 0.002), 0.0012, { radial: 6 })),
    ]), { color: '#d48d97' });
    R.bi('ovario', REP, ellipsoid([0.058, 0.913, -0.01], [0.0075, 0.0145, 0.0095], basisEuler(0.3, 0, 0.2)), 0.0009, { color: '#e3b7b0' });
    R.geom('vagina', REP, () => tube(smoothPath([[0, 0.895, -0.018], [0, 0.88, -0.014], [0, 0.862, 0.006], [0, 0.848, 0.03]], 0.002), 0.0085, { radial: 14, up: [1, 0, 0], flat: 1.45 }), { color: '#d3909a' });
    R.sdf('vulva', REP, union(
      ellipsoidAxis([0.0085, 0.852, 0.072], [0.0085, 0.845, 0.03], 0.0048, 0.0045, [1, 0, 0]),
      ellipsoidAxis([-0.0085, 0.852, 0.072], [-0.0085, 0.845, 0.03], 0.0048, 0.0045, [1, 0, 0]),
      sphere([0, 0.861, 0.074], 0.0028),
    ), 0.0009, { color: '#d39a8f' });
    // Glándulas mamarias: lóbulos y conductos galactóforos convergiendo en el pezón
    R.biGeom('glandula-mamaria', REP, () => {
      const nip = [0.101, 1.262, 0.142];
      const gs = [];
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const lobe = [0.088 + 0.03 * Math.cos(a), 1.27 + 0.03 * Math.sin(a), 0.105];
        gs.push(tube(smoothPath([lobe, lerp3(lobe, nip, 0.5), nip], 0.003), t => 0.006 - 0.0045 * t, { radial: 8 }));
      }
      return merge(gs);
    }, { color: '#e9b6a2' });
  }
  void capsule; void mirrorPts;
}
