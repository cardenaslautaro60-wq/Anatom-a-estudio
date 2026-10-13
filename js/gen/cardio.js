// Sistema cardiovascular: corazón (cámaras), arterias coronarias, grandes vasos y vasos periféricos.
import { ellipsoid, ellipsoidAxis, roundCone, sunion } from './sdf.js';
import { meshSDF } from './mesher.js';
import { tube, smoothPath, merge, splitByClass, normalize, sub3, add3, dot3, scale3, madd, lerp3, cross3, mirrorPts } from './geom.js';
import { ARM, handPt, fingerJoints } from './anat.js';
import { fpt } from './skeleton.js';

const SYS = 'cardiovascular';
const ART = '#c4302b';
const VEIN = '#3c5aa8';
const PULM_A = '#4b67b8'; // arterias pulmonares: sangre desoxigenada (azul por convención)
const PULM_V = '#c4423b';

export const HEART = {
  base: [0.0, 1.312, 0.008],
  apex: [0.082, 1.246, 0.064],
};
const AX = normalize(sub3(HEART.apex, HEART.base));

export function heartSDF() {
  const { base, apex } = HEART;
  return sunion(0.012,
    ellipsoidAxis(lerp3(base, apex, 0.08), lerp3(base, apex, 0.92), 0.043, 0.034, [0, 0.4, 1]),
    roundCone(lerp3(base, apex, 0.35), apex, 0.036, 0.009),
    ellipsoid([-0.031, 1.31, 0.018], [0.023, 0.029, 0.024]),
    ellipsoid([0.008, 1.322, -0.02], [0.031, 0.019, 0.02]),
    ellipsoid([-0.02, 1.336, 0.041], [0.011, 0.009, 0.01]),
    ellipsoid([0.039, 1.33, 0.022], [0.013, 0.008, 0.01]),
  );
}
// Clasificación de cámaras: 0 AD, 1 AI, 2 VD, 3 VI
const SEP_V = (() => { const v = [-0.6, 0.05, 0.8]; const d = dot3(v, AX); return normalize(sub3(v, scale3(AX, d))); })();
export function chamberOf(x, y, z) {
  const p = [x, y, z];
  const b0 = madd(HEART.base, AX, 0.03);
  const along = dot3(sub3(p, b0), AX);
  if (along < 0) {
    return dot3(sub3(p, [-0.012, 1.32, 0.0]), normalize([-0.8, 0.0, 0.6])) > 0 ? 0 : 1;
  }
  return dot3(sub3(p, HEART.base), SEP_V) > 0.004 ? 2 : 3;
}

// Proyecta puntos sobre la superficie de un SDF y los desplaza hacia fuera
function onSurface(f, pts, off = 0.0015) {
  return pts.map(p0 => {
    let p = p0.slice();
    for (let i = 0; i < 12; i++) {
      const e = 1e-4;
      const d = f(...p);
      const g = normalize([f(p[0] + e, p[1], p[2]) - f(p[0] - e, p[1], p[2]), f(p[0], p[1] + e, p[2]) - f(p[0], p[1] - e, p[2]), f(p[0], p[1], p[2] + e) - f(p[0], p[1], p[2] - e)]);
      p = sub3(p, scale3(g, d - off));
    }
    return p;
  });
}

function tubes(branches, radii, radial = 10) {
  return merge(branches.map((b, i) => tube(smoothPath(b, 0.003), Array.isArray(radii) ? radii[i] : radii, { radial })));
}

export function buildCardio(R) {
  // ---------------- Corazón ----------------
  const H = heartSDF();
  const defs = [
    { id: 'auricula-derecha', color: '#b5474d' }, { id: 'auricula-izquierda', color: '#c25a5c' },
    { id: 'ventriculo-derecho', color: '#a83a3f' }, { id: 'ventriculo-izquierdo', color: '#963036' },
  ];
  R.group(SYS, defs, () => splitByClass(meshSDF(H, 0.0016), 4, chamberOf), { weight: 1.5 });

  // Arterias coronarias (sobre los surcos)
  R.geom('arterias-coronarias', SYS, () => {
    const lad = [], cx = [], rca = [];
    const b0 = madd(HEART.base, AX, 0.03);
    const side = normalize(cross3(AX, SEP_V));
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      lad.push(add3(madd(lerp3(madd(HEART.base, AX, 0.025), HEART.apex, t), SEP_V, 0.004), scale3(side, -0.03 * (1 - t))));
    }
    for (let i = 0; i <= 10; i++) {
      const a = (i / 10) * 2.6;
      const dir = add3(scale3(SEP_V, Math.cos(a)), scale3(side, -Math.sin(a)));
      cx.push(madd(b0, dir, 0.04));
      const dir2 = add3(scale3(SEP_V, Math.cos(a)), scale3(side, Math.sin(a)));
      rca.push(madd(b0, dir2, 0.04));
    }
    const L = onSurface(H, lad), C = onSurface(H, cx), Rr = onSurface(H, rca);
    return tubes([L, C, Rr], [0.0018, 0.0016, 0.0018], 8);
  }, { color: ART });

  // ---------------- Grandes vasos ----------------
  const aorta = [[0.009, 1.305, 0.022], [0.002, 1.335, 0.034], [0.0, 1.372, 0.032], [0.006, 1.392, 0.014], [0.017, 1.392, -0.012], [0.024, 1.382, -0.034], [0.026, 1.35, -0.048], [0.026, 1.28, -0.052], [0.02, 1.2, -0.046], [0.008, 1.15, -0.037], [0.008, 1.1, -0.022], [0.01, 1.05, -0.012], [0.01, 1.008, -0.01]];
  R.geom('aorta', SYS, () => tube(smoothPath(aorta, 0.003), t => 0.0135 - 0.005 * t, { radial: 16 }), { color: ART });
  R.geom('tronco-braquiocefalico', SYS, () => tube(smoothPath([[0.0, 1.385, 0.028], [-0.008, 1.405, 0.026], [-0.016, 1.428, 0.021]], 0.002), 0.0062, { radial: 12 }), { color: ART });
  const carL = [[0.008, 1.392, 0.019], [0.016, 1.42, 0.02], [0.023, 1.46, 0.02], [0.026, 1.5, 0.021], [0.027, 1.518, 0.022]];
  const carR = [[-0.016, 1.428, 0.021], [-0.022, 1.46, 0.02], [-0.026, 1.5, 0.021], [-0.027, 1.518, 0.022]];
  R.geom('arteria-carotida-comun', SYS, () => tube(smoothPath(carL, 0.003), 0.0042, { radial: 10 }), { side: 'L', color: ART });
  R.geom('arteria-carotida-comun', SYS, () => tube(smoothPath(carR, 0.003), 0.0042, { radial: 10 }), { side: 'R', color: ART });
  const bif = [0.027, 1.518, 0.022];
  R.biGeom('arteria-carotida-interna', SYS, () => tube(smoothPath([bif, [0.03, 1.55, 0.012], [0.031, 1.575, 0.002], [0.028, 1.6, 0.0], [0.022, 1.625, 0.008]], 0.003), 0.0032), { color: ART });
  R.biGeom('arteria-carotida-externa', SYS, () => tubes([
    [bif, [0.033, 1.54, 0.03], [0.04, 1.56, 0.028], [0.05, 1.59, 0.0], [0.062, 1.62, -0.006], [0.068, 1.66, 0.0], [0.07, 1.69, 0.01]],
    [[0.033, 1.54, 0.03], [0.042, 1.538, 0.05], [0.045, 1.55, 0.066], [0.033, 1.575, 0.086], [0.02, 1.61, 0.093]],
  ], [0.0028, 0.0018], 8), { color: ART });
  const subL = [[0.015, 1.39, 0.0], [0.024, 1.418, -0.004], [0.045, 1.434, -0.003], [0.075, 1.43, 0.0]];
  const subR = [[-0.016, 1.428, 0.021], [-0.03, 1.434, 0.01], [-0.05, 1.436, 0.0], [-0.075, 1.43, 0.0]];
  R.geom('arteria-subclavia', SYS, () => tube(smoothPath(subL, 0.003), 0.0048), { side: 'L', color: ART });
  R.geom('arteria-subclavia', SYS, () => tube(smoothPath(subR, 0.003), 0.0048), { side: 'R', color: ART });
  R.biGeom('arteria-vertebral', SYS, () => tube(smoothPath([[0.034, 1.432, -0.004], [0.026, 1.45, -0.014], [0.022, 1.48, -0.018], [0.021, 1.53, -0.012], [0.022, 1.57, -0.016], [0.012, 1.595, -0.022], [0.0, 1.605, -0.016]], 0.003), 0.0021, { radial: 8 }), { color: ART });

  // Miembro superior
  const axA = [0.075, 1.43, 0.0];
  R.biGeom('arteria-axilar', SYS, () => tube(smoothPath([axA, [0.11, 1.405, -0.004], [0.135, 1.385, -0.008], [0.152, 1.372, -0.008]], 0.003), 0.0042), { color: ART });
  const cub = fpt(0.012, 0.0, 0.018);
  R.biGeom('arteria-braquial', SYS, () => tube(smoothPath([[0.152, 1.372, -0.008], [0.178, 1.25, -0.004], [0.2, 1.15, 0.004], [0.212, 1.1, 0.012], cub], 0.003), t => 0.0036 - 0.0006 * t), { color: ART });
  R.biGeom('arteria-radial', SYS, () => tube(smoothPath([cub, fpt(0.035, 0.006, 0.016), fpt(0.13, 0.016, 0.013), fpt(0.236, 0.019, 0.01), handPt(0.008, 0.022, 0.0), handPt(0.03, 0.016, -0.004), handPt(0.042, 0.01, 0.004)], 0.003), 0.0022, { radial: 8 }), { color: ART });
  R.biGeom('arteria-cubital', SYS, () => tube(smoothPath([cub, fpt(0.035, -0.008, 0.013), fpt(0.12, -0.014, 0.011), fpt(0.236, -0.014, 0.011), handPt(0.03, -0.01, 0.011)], 0.003), 0.0023, { radial: 8 }), { color: ART });
  R.biGeom('arcos-palmares', SYS, () => {
    const sup = [handPt(0.03, -0.01, 0.011), handPt(0.05, -0.006, 0.012), handPt(0.053, 0.004, 0.012), handPt(0.046, 0.014, 0.01)];
    const deep = [handPt(0.042, 0.01, 0.004), handPt(0.038, 0.0, 0.004), handPt(0.036, -0.012, 0.004)];
    const dig = [1, 2, 3, 4].map(i => { const J = fingerJoints(i); return [lerp3(sup[1], sup[2], (4 - i) / 3), add3(J[1], [0, 0, 0.007]), add3(J[2], [0, 0, 0.006])]; });
    return tubes([sup, deep, ...dig], [0.0016, 0.0014, 0.001, 0.001, 0.001, 0.001], 6);
  }, { color: ART });

  // Ramas abdominales
  R.geom('tronco-celiaco', SYS, () => tubes([
    [[0.008, 1.152, -0.03], [0.008, 1.156, -0.012], [0.006, 1.158, -0.004]],
    [[0.006, 1.158, -0.004], [-0.015, 1.158, 0.0], [-0.032, 1.162, 0.006]],
    [[0.006, 1.158, -0.004], [0.04, 1.15, -0.014], [0.07, 1.148, -0.028], [0.09, 1.152, -0.044]],
    [[0.006, 1.158, -0.004], [0.016, 1.175, 0.002], [0.032, 1.19, -0.006]],
  ], [0.0035, 0.0026, 0.0026, 0.0018]), { color: ART });
  R.geom('arteria-mesenterica-superior', SYS, () => {
    const main = [[0.008, 1.128, -0.022], [0.006, 1.11, 0.004], [0.002, 1.08, 0.022], [-0.004, 1.04, 0.034], [-0.015, 1.0, 0.035], [-0.03, 0.97, 0.03]];
    const br = [];
    for (let i = 1; i < 5; i++) {
      const p = lerp3(main[2], main[5], i / 5);
      br.push([p, add3(p, [0.03, -0.01, 0.01]), add3(p, [0.05, -0.02, 0.0])]);
      br.push([p, add3(p, [-0.03, 0.0, 0.0]), add3(p, [-0.05, -0.005, -0.004])]);
    }
    return tubes([main, ...br], [0.0036, ...br.map(() => 0.0013)], 8);
  }, { color: ART });
  R.geom('arteria-mesenterica-inferior', SYS, () => tube(smoothPath([[0.01, 1.04, -0.004], [0.025, 1.02, 0.0], [0.04, 0.99, -0.004], [0.05, 0.96, -0.004]], 0.003), 0.0022, { radial: 8 }), { color: ART });
  R.geom('arteria-renal', SYS, () => tube(smoothPath([[0.008, 1.093, -0.02], [0.025, 1.093, -0.028], [0.036, 1.095, -0.036]], 0.003), 0.0032), { side: 'L', color: ART });
  R.geom('arteria-renal', SYS, () => tube(smoothPath([[0.008, 1.088, -0.02], [-0.01, 1.087, -0.026], [-0.025, 1.084, -0.032], [-0.037, 1.08, -0.036]], 0.003), 0.0032), { side: 'R', color: ART });

  // Pelvis y miembro inferior
  const aBif = [0.01, 1.008, -0.01];
  const ci = [0.048, 0.958, -0.016];
  R.biGeom('arteria-iliaca-comun', SYS, () => tube(smoothPath([aBif, [0.03, 0.985, -0.012], ci], 0.003), 0.0055), { color: ART });
  R.biGeom('arteria-iliaca-interna', SYS, () => tubes([[ci, [0.056, 0.935, -0.035], [0.052, 0.91, -0.05]], [[0.056, 0.935, -0.035], [0.04, 0.9, -0.02], [0.03, 0.885, 0.0]]], [0.0036, 0.0016]), { color: ART });
  const ing = [0.082, 0.905, 0.052];
  R.biGeom('arteria-iliaca-externa', SYS, () => tube(smoothPath([ci, [0.062, 0.93, 0.015], [0.074, 0.915, 0.04], ing], 0.003), 0.0045), { color: ART });
  const pop = [0.092, 0.52, -0.035];
  R.biGeom('arteria-femoral', SYS, () => tubes([
    [ing, [0.088, 0.85, 0.056], [0.084, 0.76, 0.042], [0.076, 0.66, 0.018], [0.076, 0.6, 0.0], [0.084, 0.56, -0.022], pop],
    [[0.088, 0.85, 0.056], [0.1, 0.8, 0.035], [0.11, 0.72, 0.012], [0.112, 0.64, -0.004]],
  ], [0.0045, 0.003]), { color: ART });
  const tri = [0.094, 0.445, -0.03];
  R.biGeom('arteria-poplitea', SYS, () => tube(smoothPath([pop, [0.094, 0.49, -0.036], tri], 0.003), 0.0038), { color: ART });
  R.biGeom('arteria-tibial-anterior', SYS, () => tube(smoothPath([tri, [0.106, 0.43, -0.012], [0.106, 0.4, 0.002], [0.101, 0.25, 0.006], [0.095, 0.1, 0.012], [0.09, 0.055, 0.05], [0.086, 0.04, 0.09]], 0.003), 0.0024, { radial: 8 }), { color: ART });
  R.biGeom('arteria-tibial-posterior', SYS, () => tubes([
    [tri, [0.088, 0.35, -0.03], [0.083, 0.22, -0.028], [0.076, 0.085, -0.024], [0.08, 0.035, 0.0], [0.088, 0.02, 0.05]],
    [[0.092, 0.42, -0.03], [0.105, 0.3, -0.03], [0.108, 0.12, -0.022]],
  ], [0.0026, 0.0018]), { color: ART });

  // Circulación pulmonar
  R.geom('tronco-pulmonar', SYS, () => tubes([
    [[0.02, 1.302, 0.05], [0.025, 1.33, 0.042], [0.026, 1.35, 0.026], [0.02, 1.36, 0.008]],
    [[0.02, 1.36, 0.008], [0.04, 1.36, -0.002], [0.056, 1.348, -0.012]],
    [[0.02, 1.36, 0.008], [0.0, 1.356, -0.002], [-0.025, 1.352, -0.006], [-0.052, 1.342, -0.012]],
  ], [0.0115, 0.0078, 0.0078], 14), { color: PULM_A });
  R.geom('venas-pulmonares', SYS, () => tubes([
    [[0.058, 1.334, -0.004], [0.04, 1.33, -0.012], [0.024, 1.325, -0.02]],
    [[0.055, 1.3, -0.028], [0.04, 1.306, -0.028], [0.022, 1.313, -0.028]],
    [[-0.052, 1.33, -0.002], [-0.03, 1.326, -0.012], [-0.012, 1.324, -0.02]],
    [[-0.05, 1.298, -0.028], [-0.03, 1.305, -0.03], [-0.012, 1.312, -0.03]],
  ], 0.0055), { color: PULM_V });

  // ---------------- Venas ----------------
  R.geom('vena-cava-superior', SYS, () => tube(smoothPath([[-0.025, 1.4, 0.02], [-0.026, 1.36, 0.022], [-0.026, 1.326, 0.022]], 0.003), 0.0095, { radial: 14 }), { color: VEIN });
  R.geom('vena-cava-inferior', SYS, () => tube(smoothPath([[-0.012, 0.975, -0.006], [-0.02, 1.03, -0.006], [-0.022, 1.1, -0.012], [-0.024, 1.18, -0.012], [-0.022, 1.245, -0.002], [-0.026, 1.282, 0.01]], 0.003), 0.0105, { radial: 14 }), { color: VEIN });
  R.geom('venas-braquiocefalicas', SYS, () => tubes([
    [[0.042, 1.428, 0.02], [0.02, 1.412, 0.03], [0.0, 1.404, 0.03], [-0.025, 1.4, 0.02]],
    [[-0.042, 1.428, 0.02], [-0.032, 1.414, 0.02], [-0.025, 1.4, 0.02]],
  ], 0.0072, 12), { color: VEIN });
  R.biGeom('vena-yugular-interna', SYS, () => tube(smoothPath([[0.042, 1.428, 0.02], [0.04, 1.47, 0.018], [0.038, 1.52, 0.012], [0.036, 1.565, -0.006], [0.034, 1.588, -0.016]], 0.003), 0.0068, { radial: 12 }), { color: VEIN });
  R.biGeom('vena-yugular-externa', SYS, () => tube(smoothPath([[0.06, 1.578, -0.01], [0.06, 1.53, -0.005], [0.055, 1.47, 0.0], [0.05, 1.432, 0.014]], 0.003), 0.0022, { radial: 8 }), { color: VEIN });
  R.biGeom('vena-subclavia', SYS, () => tube(smoothPath([[0.042, 1.428, 0.02], [0.075, 1.424, 0.012], [0.11, 1.4, 0.004], [0.135, 1.38, 0.0], [0.152, 1.368, -0.004]], 0.003), 0.0058), { color: VEIN });
  R.biGeom('vena-cefalica', SYS, () => tube(smoothPath([[0.11, 1.415, 0.03], [0.155, 1.4, 0.04], [0.2, 1.3, 0.03], [0.222, 1.18, 0.022], [0.238, 1.1, 0.014], fpt(0.02, 0.03, 0.02), fpt(0.12, 0.034, 0.015), fpt(0.22, 0.03, 0.002), handPt(0.03, 0.02, -0.012)], 0.003), 0.0024, { radial: 8 }), { color: VEIN });
  R.biGeom('vena-basilica', SYS, () => tube(smoothPath([[0.152, 1.368, -0.004], [0.172, 1.27, -0.016], [0.192, 1.17, -0.012], [0.205, 1.1, -0.01], fpt(0.02, -0.028, 0.012), fpt(0.12, -0.03, 0.008), fpt(0.22, -0.024, -0.002), handPt(0.03, -0.014, -0.012)], 0.003), 0.0024, { radial: 8 }), { color: VEIN });
  R.biGeom('vena-mediana-cubital', SYS, () => tube(smoothPath([fpt(0.025, 0.031, 0.02), fpt(0.01, 0.0, 0.026), fpt(-0.005, -0.026, 0.016)], 0.002), 0.0022, { radial: 8 }), { color: VEIN });
  R.geom('vena-renal', SYS, () => tube(smoothPath([[0.036, 1.096, -0.032], [0.02, 1.097, -0.012], [0.008, 1.097, 0.002], [-0.01, 1.098, -0.004], [-0.02, 1.098, -0.01]], 0.003), 0.0042), { side: 'L', color: VEIN });
  R.geom('vena-renal', SYS, () => tube(smoothPath([[-0.037, 1.086, -0.03], [-0.028, 1.09, -0.02], [-0.022, 1.093, -0.012]], 0.003), 0.0042), { side: 'R', color: VEIN });
  R.geom('vena-acigos', SYS, () => tube(smoothPath([[-0.012, 1.11, -0.04], [-0.014, 1.2, -0.052], [-0.015, 1.3, -0.06], [-0.016, 1.36, -0.055], [-0.02, 1.372, -0.03], [-0.025, 1.372, -0.002], [-0.025, 1.372, 0.012]], 0.003), 0.0042), { color: VEIN });
  R.geom('vena-porta', SYS, () => tubes([
    [[-0.004, 1.115, 0.008], [-0.014, 1.135, 0.01], [-0.026, 1.155, 0.012], [-0.038, 1.168, 0.016]],
    [[0.085, 1.14, -0.04], [0.06, 1.13, -0.022], [0.03, 1.122, -0.006], [-0.004, 1.115, 0.008]],
    [[-0.004, 1.115, 0.008], [-0.006, 1.08, 0.02], [-0.012, 1.04, 0.03], [-0.022, 1.0, 0.03]],
  ], [0.0062, 0.0042, 0.0045], 10), { color: '#5b4aa0' });
  const vci = [-0.012, 0.975, -0.006];
  const vic = [0.04, 0.955, -0.02];
  R.geom('vena-iliaca-comun', SYS, () => tube(smoothPath([vci, [0.015, 0.97, -0.016], vic], 0.003), 0.0062), { side: 'L', color: VEIN });
  R.geom('vena-iliaca-comun', SYS, () => tube(smoothPath([vci, [-0.03, 0.965, -0.016], mirrorPts([vic])[0]], 0.003), 0.0062), { side: 'R', color: VEIN });
  R.biGeom('vena-iliaca-externa', SYS, () => tube(smoothPath([vic, [0.052, 0.932, 0.01], [0.066, 0.914, 0.038], [0.072, 0.905, 0.052]], 0.003), 0.0055), { color: VEIN });
  R.biGeom('vena-femoral', SYS, () => tube(smoothPath([[0.072, 0.905, 0.052], [0.078, 0.85, 0.052], [0.076, 0.76, 0.036], [0.07, 0.66, 0.012], [0.072, 0.6, -0.006], [0.082, 0.56, -0.03], [0.09, 0.52, -0.042], [0.094, 0.445, -0.038]], 0.003), 0.005), { color: VEIN });
  R.biGeom('vena-safena-mayor', SYS, () => tube(smoothPath([[0.08, 0.04, 0.07], [0.07, 0.07, 0.02], [0.067, 0.095, 0.002], [0.062, 0.2, -0.012], [0.06, 0.32, -0.022], [0.058, 0.45, -0.032], [0.058, 0.52, -0.035], [0.052, 0.62, -0.02], [0.05, 0.72, 0.012], [0.058, 0.82, 0.05], [0.068, 0.858, 0.062], [0.075, 0.872, 0.054]], 0.003), 0.0026, { radial: 8 }), { color: VEIN });
  R.biGeom('vena-safena-menor', SYS, () => tube(smoothPath([[0.122, 0.05, 0.0], [0.122, 0.075, -0.035], [0.11, 0.15, -0.05], [0.098, 0.3, -0.062], [0.095, 0.42, -0.055], [0.094, 0.47, -0.045]], 0.003), 0.002, { radial: 8 }), { color: VEIN });
}
