// Sistema digestivo: boca, glándulas salivales, faringe, esófago, estómago, intestinos, hígado, vesícula y páncreas.
import { ellipsoid, ellipsoidAxis, roundCone, chain, sphere, sunion, smax, basisEuler } from './sdf.js';
import { tube, smoothPath, merge, resample, catmull } from './geom.js';
import { diaphragmY, thoraxInterior } from './anat.js';

const SYS = 'digestivo';

function liverSDF() {
  const thx = thoraxInterior(0.003);
  const body = sunion(0.03,
    ellipsoid([-0.045, 1.165, -0.005], [0.09, 0.075, 0.085]),
    ellipsoid([0.02, 1.185, 0.035], [0.06, 0.035, 0.05]),
  );
  const f = (x, y, z) => {
    let d = body(x, y, z);
    if (d > 0.03) return d;
    d = smax(d, y - (diaphragmY(x, z) - 0.004), 0.008);
    d = smax(d, thx(x, y, z) + 0.002, 0.01);
    // superficie visceral: borde inferior oblicuo que asciende hacia la izquierda y hacia atrás
    const inf = 1.098 + 0.42 * (x + 0.06) + 0.18 * Math.max(0, 0.06 - z) - (x < -0.06 ? 0.25 * (x + 0.06) * (x + 0.06) * 10 : 0);
    d = smax(d, inf - y, 0.012);
    return d;
  };
  f.b = [-0.15, 1.04, -0.1, 0.1, 1.24, 0.11];
  return f;
}

function stomachSDF() {
  const pts = [[0.04, 1.19, -0.012], [0.066, 1.182, -0.012], [0.084, 1.15, 0.008], [0.078, 1.112, 0.03], [0.05, 1.09, 0.048], [0.02, 1.092, 0.05], [-0.004, 1.1, 0.046], [-0.014, 1.104, 0.042]];
  const rad = [0.013, 0.03, 0.033, 0.03, 0.024, 0.019, 0.014, 0.011];
  return sunion(0.012, chain(pts, rad, 0.012), sphere([0.07, 1.188, -0.014], 0.027));
}

// Intestino delgado: recorrido serpenteante determinista dentro del abdomen
function smallIntestinePath() {
  const pts = [[0.03, 1.075, 0.004], [0.045, 1.068, 0.015]];
  const rows = 11;
  for (let r = 0; r < rows; r++) {
    const y = 1.062 - r * 0.0115;
    const dir = r % 2 === 0 ? -1 : 1;
    const xa = 0.062, n = 9;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = dir < 0 ? xa - 2 * xa * t : -xa + 2 * xa * t;
      const wob = Math.sin(t * Math.PI * 4 + r * 1.3);
      const zz = 0.038 + 0.026 * Math.sin(t * Math.PI * 3 + r * 2.1);
      pts.push([x * (r > 8 ? 0.85 : 1), y + 0.006 * wob, zz]);
    }
  }
  pts.push([-0.06, 0.945, 0.028], [-0.072, 0.95, 0.026]);
  return resample(catmull(pts, 10), 0.004);
}

function haustra(base, period = 0.028, amp = 0.12) {
  return (t, i, L) => base * (1 + amp * Math.cos((i * 0.004 / period) * Math.PI * 2));
}

export function buildDigestive(R) {
  // Boca y glándulas salivales
  R.sdf('lengua', SYS, sunion(0.01, ellipsoid([0, 1.565, 0.053], [0.0205, 0.0095, 0.031]), roundCone([0, 1.56, 0.03], [0, 1.535, 0.018], 0.014, 0.008)), 0.0012, { color: '#c9696a' });
  R.bi('glandula-parotida', SYS, ellipsoid([0.058, 1.586, 0.002], [0.0095, 0.024, 0.017], basisEuler(0, 0.2, 0)), 0.0016, { color: '#e2b98a' });
  R.bi('glandula-submandibular', SYS, ellipsoid([0.034, 1.536, 0.034], [0.009, 0.0075, 0.016]), 0.0012, { color: '#e2b98a' });
  R.bi('glandula-sublingual', SYS, ellipsoid([0.014, 1.548, 0.058], [0.0042, 0.004, 0.013]), 0.0008, { color: '#e2b98a' });

  // Tubo digestivo alto
  R.geom('faringe', SYS, () => tube(smoothPath([[0, 1.618, -0.004], [0, 1.6, 0.004], [0, 1.565, 0.008], [0, 1.52, 0.008], [0, 1.49, 0.006], [0, 1.468, 0.004]], 0.003), t => 0.0125 - 0.004 * t, { radial: 14, up: [1, 0, 0], flat: 1.35 }), { color: '#cf8a7f' });
  R.geom('esofago', SYS, () => tube(smoothPath([[0, 1.468, 0.004], [0.0, 1.43, -0.006], [0.002, 1.39, -0.022], [0.004, 1.35, -0.038], [0.005, 1.3, -0.047], [0.008, 1.25, -0.044], [0.013, 1.215, -0.033], [0.024, 1.199, -0.021], [0.04, 1.19, -0.012]], 0.003), 0.0068, { radial: 12, up: [1, 0, 0], flat: 1.25 }), { color: '#c97d70' });
  R.sdf('estomago', SYS, stomachSDF(), 0.0024, { color: '#d98d78' });
  R.geom('duodeno', SYS, () => tube(smoothPath([[-0.014, 1.104, 0.042], [-0.034, 1.104, 0.031], [-0.05, 1.094, 0.014], [-0.055, 1.062, 0.006], [-0.049, 1.032, 0.01], [-0.026, 1.022, 0.016], [0.012, 1.024, 0.014], [0.029, 1.048, 0.008], [0.03, 1.075, 0.004]], 0.003), 0.0115, { radial: 14 }), { color: '#dc9a83' });

  // Intestino delgado: yeyuno (2/5 proximales) e íleon (3/5 distales)
  const path = smallIntestinePath();
  const cut = Math.floor(path.length * 0.4);
  R.geom('yeyuno', SYS, () => tube(path.slice(0, cut + 1), 0.0112, { radial: 12 }), { color: '#e0a48f' });
  R.geom('ileon', SYS, () => tube(path.slice(cut), 0.0102, { radial: 12 }), { color: '#d6987f' });

  // Intestino grueso
  R.sdf('ciego', SYS, sunion(0.01, ellipsoid([-0.086, 0.958, 0.024], [0.026, 0.028, 0.025]), sphere([-0.08, 0.95, 0.03], 0.02)), 0.002, { color: '#c99577' });
  R.geom('apendice', SYS, () => tube(smoothPath([[-0.078, 0.94, 0.034], [-0.07, 0.922, 0.04], [-0.06, 0.906, 0.036], [-0.052, 0.898, 0.028]], 0.002), 0.0036, { radial: 10 }), { color: '#c08a6d' });
  const colonSeg = (id, pts, r) => R.geom(id, SYS, () => {
    const p = smoothPath(pts, 0.004);
    return tube(p, haustra(r), { radial: 16 });
  }, { color: '#c99577' });
  colonSeg('colon-ascendente', [[-0.09, 0.972, 0.02], [-0.096, 1.01, 0.014], [-0.098, 1.045, 0.01], [-0.094, 1.07, 0.012]], 0.0215);
  colonSeg('colon-transverso', [[-0.094, 1.07, 0.012], [-0.075, 1.07, 0.04], [-0.045, 1.055, 0.062], [-0.01, 1.04, 0.07], [0.03, 1.05, 0.066], [0.062, 1.07, 0.05], [0.088, 1.1, 0.02], [0.098, 1.118, -0.008]], 0.0205);
  colonSeg('colon-descendente', [[0.098, 1.118, -0.008], [0.103, 1.08, -0.016], [0.103, 1.03, -0.016], [0.098, 0.985, -0.01], [0.09, 0.958, 0.0]], 0.0185);
  colonSeg('colon-sigmoide', [[0.09, 0.958, 0.0], [0.072, 0.935, 0.028], [0.045, 0.932, 0.04], [0.024, 0.945, 0.024], [0.008, 0.94, -0.012], [0.002, 0.928, -0.042], [0.0, 0.915, -0.058]], 0.0165);
  R.geom('recto', SYS, () => tube(smoothPath([[0.0, 0.915, -0.058], [0.0, 0.9, -0.066], [0.0, 0.882, -0.066], [0.0, 0.867, -0.055], [0.0, 0.858, -0.046]], 0.003), t => 0.0145 + 0.004 * Math.sin(Math.PI * t), { radial: 16 }), { color: '#c08c70' });
  R.geom('canal-anal', SYS, () => tube(smoothPath([[0.0, 0.858, -0.046], [0.0, 0.85, -0.042], [0.0, 0.842, -0.039]], 0.002), 0.0075, { radial: 12 }), { color: '#b9806a' });

  // Glándulas anexas
  R.sdf('higado', SYS, liverSDF(), 0.0026, { color: '#7a2f27', weight: 2 });
  R.sdf('vesicula-biliar', SYS, sunion(0.008, ellipsoidAxis([-0.064, 1.088, 0.066], [-0.046, 1.12, 0.03], 0.0125, 0.012), roundCone([-0.046, 1.12, 0.03], [-0.038, 1.135, 0.018], 0.007, 0.003)), 0.0013, { color: '#4f7f3a' });
  R.geom('vias-biliares', SYS, () => tube(smoothPath([[-0.038, 1.135, 0.018], [-0.034, 1.142, 0.014], [-0.03, 1.13, 0.012], [-0.033, 1.11, 0.01], [-0.04, 1.08, 0.012], [-0.046, 1.066, 0.01]], 0.002), 0.0022, { radial: 8 }), { color: '#6f9a3d' });
  R.sdf('pancreas', SYS, chain([[-0.04, 1.062, 0.016], [-0.032, 1.085, 0.02], [-0.01, 1.1, 0.02], [0.02, 1.112, 0.008], [0.05, 1.122, -0.012], [0.078, 1.132, -0.032]], [0.014, 0.014, 0.011, 0.0105, 0.0095, 0.008], 0.01), 0.002, { color: '#e3c07f' });
}
