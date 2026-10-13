// Sistema tegumentario: superficie corporal (piel).
import { sphere, ellipsoid, ellipsoidAxis, capsule, roundCone, roundBox, sunion, ssub, mirrorX, basisEuler } from './sdf.js';
import { ARM, handFrame, handPt, fingerJoints } from './anat.js';
import { add3, madd, scale3 } from './geom.js';

// Secciones del tronco: [y, cz, rx, rzF, rzB, exponente]
const TORSO = [
  [0.845, -0.006, 0.150, 0.080, 0.085, 2.2],
  [0.900, -0.012, 0.176, 0.090, 0.108, 2.3],
  [0.960, -0.010, 0.172, 0.097, 0.112, 2.4],
  [1.030, -0.004, 0.152, 0.102, 0.104, 2.3],
  [1.100, 0.000, 0.142, 0.100, 0.100, 2.2],
  [1.170, -0.002, 0.150, 0.103, 0.104, 2.3],
  [1.240, -0.006, 0.160, 0.111, 0.112, 2.5],
  [1.300, -0.008, 0.166, 0.115, 0.120, 2.6],
  [1.360, -0.012, 0.170, 0.104, 0.120, 2.6],
  [1.410, -0.018, 0.158, 0.084, 0.108, 2.4],
  [1.450, -0.024, 0.105, 0.066, 0.088, 2.2],
  [1.480, -0.022, 0.066, 0.056, 0.066, 2.0],
];
function cr(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}
function torsoParams(y, out) {
  const T = TORSO, n = T.length;
  let i = 0;
  if (y <= T[0][0]) i = 0; else if (y >= T[n - 1][0]) i = n - 2;
  else while (i < n - 2 && y > T[i + 1][0]) i++;
  const t = Math.min(1, Math.max(0, (y - T[i][0]) / (T[i + 1][0] - T[i][0])));
  const a = T[Math.max(0, i - 1)], b = T[i], c = T[i + 1], d = T[Math.min(n - 1, i + 2)];
  for (let k = 1; k < 6; k++) out[k] = cr(a[k], b[k], c[k], d[k], t);
  return out;
}

export function torsoSDF() {
  const y0 = TORSO[0][0], y1 = TORSO[TORSO.length - 1][0];
  // Tabla precalculada de parámetros por altura (paso 0,5 mm)
  const step = 0.0005, N = Math.ceil((y1 - y0) / step) + 1;
  const LUT = new Float64Array(N * 6), tmp = new Float64Array(6);
  for (let i = 0; i < N; i++) { torsoParams(y0 + i * step, tmp); LUT.set(tmp, i * 6); }
  const f = (x, y, z) => {
    let i = Math.round((y - y0) / step);
    if (i < 0) i = 0; else if (i >= N) i = N - 1;
    const o = i * 6;
    const cz = LUT[o + 1], rx = LUT[o + 2], rz = z > cz ? LUT[o + 3] : LUT[o + 4], e = LUT[o + 5];
    const px = Math.abs(x), pz = Math.abs(z - cz), m = rx < rz ? rx : rz;
    // mezcla entre elipse y rectángulo redondeado (más barato que una superelipse)
    const dE = (Math.sqrt((px / rx) ** 2 + (pz / rz) ** 2) - 1) * m * 0.92;
    const rc = 0.62 * m, qx = px - (rx - rc), qz = pz - (rz - rc);
    const ox = qx > 0 ? qx : 0, oz = qz > 0 ? qz : 0;
    const dR = Math.sqrt(ox * ox + oz * oz) + Math.min(Math.max(qx, qz), 0) - rc;
    const w = (e - 2) * 0.9;
    let d = dE + (dR - dE) * w;
    const dy = Math.max(y0 - y, y - y1);
    if (dy > 0) d = d > 0 ? Math.hypot(d, dy) : dy;
    return d;
  };
  f.b = [-0.2, y0 - 0.01, -0.14, 0.2, y1 + 0.01, 0.13];
  return f;
}

function headSDF(sex) {
  const fem = sex === 'F';
  const face = sunion(0.02,
    ellipsoid([0, 1.664, -0.012], [0.0795, 0.089, 0.103]),
    ellipsoid([0, 1.69, 0.03], [0.07, 0.06, 0.076]),
    ellipsoid([0, 1.655, -0.07], [0.064, 0.056, 0.046]),
    ellipsoid([0.043, 1.603, 0.048], [0.031, 0.036, 0.036]), ellipsoid([-0.043, 1.603, 0.048], [0.031, 0.036, 0.036]),
    ellipsoid([0.05, 1.572, 0.018], [0.024, 0.032, 0.03]), ellipsoid([-0.05, 1.572, 0.018], [0.024, 0.032, 0.03]),
    ellipsoid([0, 1.578, 0.064], [0.034, 0.032, 0.03]),
    ellipsoid([0, 1.547, 0.066], [0.03, 0.022, 0.024]),
    capsule([0.052, 1.556, 0.004], [0.02, 1.532, 0.072], fem ? 0.0095 : 0.011), capsule([-0.052, 1.556, 0.004], [-0.02, 1.532, 0.072], fem ? 0.0095 : 0.011),
    ellipsoid([0, 1.529, 0.08], [0.019, 0.013, 0.011]),
  );
  const det = sunion(0.006,
    face,
    roundCone([0, 1.652, 0.093], [0, 1.608, 0.117], 0.0062, 0.0105),
    ellipsoid([0, 1.604, 0.103], [0.0165, 0.009, 0.012]),
    ellipsoid([0, 1.562, 0.09], [0.023, 0.011, 0.0095]),
    capsule([-0.03, 1.668, 0.091], [0.03, 1.668, 0.091], 0.007),
  );
  const withEyes = sunion(0.004,
    ssub(0.01, det, ellipsoid([0.033, 1.646, 0.098], [0.016, 0.01, 0.013]), ellipsoid([-0.033, 1.646, 0.098], [0.016, 0.01, 0.013])),
    sphere([0.032, 1.645, 0.077], 0.0125), sphere([-0.032, 1.645, 0.077], 0.0125),
  );
  const ear = ellipsoid([0.079, 1.636, -0.014], [0.0075, 0.029, 0.017], basisEuler(0, 0.35, -0.12));
  return sunion(0.006, withEyes, ear, mirrorX(ear));
}

function armSDF() {
  const { elbow: E, foreDir: d, foreLat: l } = ARM;
  const fp = (a, lat = 0, ant = 0) => add3(add3(madd(E, d, a), scale3(l, lat)), [0, 0, ant]);
  const hf = handFrame();
  const hb = { u: hf.l, v: hf.d, w: hf.n };
  const fingers = [];
  for (let i = 0; i < 5; i++) {
    const J = fingerJoints(i);
    const tip = J[J.length - 1];
    if (i === 0) fingers.push(roundCone(J[0], J[1], 0.0135, 0.0105), roundCone(J[1], tip, 0.0105, 0.0085));
    else fingers.push(roundCone(J[1], madd(tip, hf.d, -0.003), 0.0092, 0.0074));
  }
  const hand = sunion(0.008,
    roundBox(handPt(0.062, 0.001, 0.0), [0.043, 0.042, 0.0125], 0.011, hb),
    roundBox(handPt(0.025, 0.0, 0.0), [0.03, 0.025, 0.014], 0.012, hb),
    ...fingers,
  );
  return sunion(0.022,
    ellipsoid([0.197, 1.392, -0.018], [0.047, 0.06, 0.052]),
    roundCone([0.196, 1.37, -0.02], [0.226, 1.09, -0.022], 0.046, 0.035),
    ellipsoidAxis([0.205, 1.32, -0.006], [0.219, 1.14, -0.006], 0.036, 0.04),
    sphere(add3(E, [0, 0, -0.004]), 0.037),
    ellipsoidAxis(fp(-0.01), fp(0.17), 0.042, 0.035),
    roundCone(fp(0.02), fp(0.232), 0.038, 0.0255),
    hand,
  );
}

function legSDF(sex) {
  const fem = sex === 'F';
  const toes = [];
  const T = [[0.07, 0.019, 0.137, 0.05, 0.0105], [0.084, 0.0165, 0.142, 0.043, 0.0078], [0.098, 0.0145, 0.137, 0.037, 0.0075], [0.111, 0.0125, 0.129, 0.033, 0.0072], [0.124, 0.0112, 0.119, 0.027, 0.0068]];
  for (const [x, y, z, L, r] of T) toes.push(roundCone([x, y + 0.004, z - 0.02], [x, y - 0.002, z + L - r], r * 1.15, r));
  const foot = sunion(0.012,
    sphere([0.097, 0.034, -0.05], 0.03),
    roundCone([0.09, 0.095, -0.013], [0.094, 0.04, 0.02], 0.032, 0.036),
    roundBox([0.097, 0.026, 0.05], [0.038, 0.024, 0.07], 0.02, basisEuler(0.06, 0.08, 0)),
    ...toes,
  );
  return sunion(0.03,
    roundCone([0.095, 0.875, -0.006], [0.094, 0.52, 0.0], fem ? 0.096 : 0.089, 0.05),
    ellipsoidAxis([0.1, 0.84, 0.01], [0.096, 0.56, 0.02], 0.058, 0.06),
    sphere([0.095, 0.5, 0.002], 0.045),
    roundCone([0.094, 0.48, -0.008], [0.09, 0.1, -0.014], 0.047, 0.031),
    ellipsoid([0.097, 0.36, -0.03], [0.043, 0.09, 0.043]),
    foot,
  );
}

export function skinSDF(sex = 'M', opts = {}) {
  const fem = sex === 'F';
  const arm = armSDF();
  const leg = legSDF(sex);
  const parts = [
    torsoSDF(),
    roundCone([0, 1.585, -0.016], [0, 1.455, -0.026], 0.052, 0.06),
    // trapecio / hombros
    capsule([0.05, 1.45, -0.03], [0.18, 1.428, -0.02], 0.048), capsule([-0.05, 1.45, -0.03], [-0.18, 1.428, -0.02], 0.048),
    // glúteos
    ellipsoid([0.066, 0.92, -0.08], fem ? [0.08, 0.092, 0.068] : [0.074, 0.084, 0.06]),
    ellipsoid([-0.066, 0.92, -0.08], fem ? [0.08, 0.092, 0.068] : [0.074, 0.084, 0.06]),
    arm, mirrorX(arm), leg, mirrorX(leg),
  ];
  if (!fem) parts.push(sphere([0, 1.497, 0.036], 0.012));
  // relieve de las clavículas
  for (const sx of [1, -1]) parts.push(capsule([0.03 * sx, 1.416, 0.056], [0.105 * sx, 1.434, 0.04], 0.016), capsule([0.105 * sx, 1.434, 0.04], [0.16 * sx, 1.444, 0.0], 0.016));
  let body = sunion(0.035, ...parts);
  const extra = [];
  if (!opts.noBreasts && fem) {
    for (const s of [1, -1]) {
      extra.push(ellipsoid([0.088 * s, 1.27, 0.096], [0.062, 0.062, 0.052], basisEuler(0, 0.28 * s, 0)));
      extra.push(sphere([0.101 * s, 1.262, 0.148], 0.0065));
    }
    extra.push(ellipsoid([0, 0.874, 0.07], [0.04, 0.022, 0.013]));
  }
  if (!fem && !opts.noGenitals) {
    extra.push(roundCone([0, 0.862, 0.084], [0, 0.808, 0.1], 0.0125, 0.013));
    extra.push(sphere([0, 0.805, 0.101], 0.0142));
    extra.push(ellipsoid([0.013, 0.822, 0.068], [0.019, 0.027, 0.022]), ellipsoid([-0.013, 0.824, 0.068], [0.019, 0.027, 0.022]));
  }
  if (extra.length) body = sunion(0.014, body, ...extra);
  return sunion(0.02, body, headSDF(sex));
}

export function buildSkin(R) {
  R.sdf('piel', 'piel', skinSDF(R.sex), 0.0042, { color: '#d9a58a', weight: 8 });
}
