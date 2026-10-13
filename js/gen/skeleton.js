// Sistema esquelético: cráneo, columna, tórax, cinturas y miembros.
import {
  sphere, ellipsoid, ellipsoidAxis, capsule, roundCone, chain, roundBox, ellCyl, triangle, fan, ribbon,
  plane, union, sunion, sub, ssub, inter, offset, clipBounds, basisFromY, basisEuler, smax,
} from './sdf.js';
import { tube, smoothPath, add3, sub3, scale3, madd, normalize, lerp3, merge, splitByClass } from './geom.js';
import { meshSDF } from './mesher.js';
import {
  VERTEBRAE, V, vertDims, canalOf, SACRUM, HEAD, ARM, handFrame, handPt, FINGERS, fingerJoints,
  LEG, STERNUM, STERNAL_ATT, thoraxAt,
} from './anat.js';

const SYS = 'esqueletico';
const BONE = '#e8dfc8';
const CART = '#c9d6dc';

const mx = p => [-p[0], p[1], p[2]];

export function buildSkeleton(R) {
  skull(R);
  spine(R);
  thorax(R);
  upperLimb(R);
  pelvis(R);
  lowerLimb(R);
}

// ------------------------------------------------------------------ Cráneo
export function skullSDF() {
  const C = HEAD.cranium;
  const outer = sunion(0.014,
    ellipsoid(C.c, C.r),
    ellipsoid([0, 1.69, 0.03], [0.064, 0.055, 0.07]),                   // frente
    ellipsoid([0, 1.655, -0.07], [0.058, 0.05, 0.04]),                  // protuberancia occipital
    ellipsoid([0, 1.6, 0.06], [0.031, 0.036, 0.033]),                   // maxilar
    ellipsoid([0, 1.632, 0.075], [0.037, 0.016, 0.02]),                 // suelo de órbitas
  );
  const fine = sunion(0.008,
    outer,
    ellipsoid([0.05, 1.627, 0.062], [0.0095, 0.012, 0.012]), ellipsoid([-0.05, 1.627, 0.062], [0.0095, 0.012, 0.012]),
    capsule([0.056, 1.623, 0.05], [0.067, 1.62, 0.004], 0.0036), capsule([-0.056, 1.623, 0.05], [-0.067, 1.62, 0.004], 0.0036),
    capsule([-0.03, 1.667, 0.084], [0.03, 1.667, 0.084], 0.0058),       // arcos superciliares
    ellipsoid([0.053, 1.592, -0.034], [0.0075, 0.011, 0.008]), ellipsoid([-0.053, 1.592, -0.034], [0.0075, 0.011, 0.008]), // mastoides
    ellipsoid([0, 1.6, -0.028], [0.04, 0.02, 0.048]),                   // base del cráneo
    capsule([0, 1.652, 0.09], [0, 1.633, 0.098], 0.0042),               // huesos nasales
    alveolarArch(1.569, 0.0082),
  );
  const inner = ellipsoid([C.c[0], C.c[1] + 0.002, C.c[2]], [C.r[0] - 0.0058, C.r[1] - 0.0065, C.r[2] - 0.0062]);
  let s = sub(fine, inner);
  s = ssub(0.005, s,
    ellipsoid([0.033, 1.645, 0.086], [0.0185, 0.0175, 0.024]), ellipsoid([-0.033, 1.645, 0.086], [0.0185, 0.0175, 0.024]), // órbitas
    ellipsoid([0, 1.614, 0.1], [0.0105, 0.016, 0.03]),                                                             // apertura piriforme
    sphere([0.072, 1.612, -0.012], 0.005), sphere([-0.072, 1.612, -0.012], 0.005),                                  // meato acústico
    sphere([0, 1.58, -0.035], 0.016),                                                                               // agujero magno
    ellipsoid([0.084, 1.642, 0.022], [0.014, 0.026, 0.028]), ellipsoid([-0.084, 1.642, 0.022], [0.014, 0.026, 0.028]), // fosas temporales
  );
  return s;
}
function alveolarArch(y, r) {
  const pts = [];
  for (let i = -8; i <= 8; i++) {
    const t = i / 8;
    pts.push([0.032 * Math.sin(t * 1.35) / Math.sin(1.35), y, 0.084 - 0.058 * t * t]);
  }
  return chain(pts, r, 0.004);
}
const region = {
  box: (x0, y0, z0, x1, y1, z1) => roundBox([(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], [(x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2], 0),
};

function skull(R) {
  const S = skullSDF();
  // Regiones de cada hueso (negativas dentro)
  const nasal = ellipsoid([0, 1.643, 0.098], [0.0115, 0.0145, 0.012]);
  const zygL = union(ellipsoid([0.054, 1.627, 0.06], [0.019, 0.019, 0.02]), capsule([0.058, 1.622, 0.05], [0.064, 1.62, 0.026], 0.008));
  const zygR = union(ellipsoid([-0.054, 1.627, 0.06], [0.019, 0.019, 0.02]), capsule([-0.058, 1.622, 0.05], [-0.064, 1.62, 0.026], 0.008));
  const maxilla = inter(region.box(-0.05, 1.54, 0.02, 0.05, 1.637, 0.13));
  const sphL = union(ellipsoid([0.066, 1.646, 0.036], [0.018, 0.021, 0.011]));
  const sphR = union(ellipsoid([-0.066, 1.646, 0.036], [0.018, 0.021, 0.011]));
  const occ = plane([0, 1.712, -0.086], [0, 0.217, 0.976]);
  const flip = f => { const g = (x, y, z) => -f(x, y, z); g.b = [-1e9, -1e9, -1e9, 1e9, 1e9, 1e9]; return g; };
  const frontalR = inter(flip(plane([0, 1.745, 0.018], [0, 0.32, 0.95])), plane([0, 1.628, 0], [0, -1, 0]));
  const ysq = (z) => 1.684 - 22 * (z + 0.008) * (z + 0.008);
  const tempL = (x, y, z) => Math.max(0.04 - x, y - ysq(z), z - 0.046, -0.074 - z); tempL.b = [0.03, 1.5, -0.1, 0.1, 1.7, 0.06];
  const tempR = (x, y, z) => tempL(-x, y, z); tempR.b = [-0.1, 1.5, -0.1, -0.03, 1.7, 0.06];
  const parL = (x, y, z) => Math.max(-x, 1.652 - y); parL.b = [0, 1.6, -0.12, 0.1, 1.76, 0.1];
  const parR = (x, y, z) => Math.max(x, 1.652 - y); parR.b = [-0.1, 1.6, -0.12, 0, 1.76, 0.1];
  const rest = (x, y, z) => -1; rest.b = S.b;

  const order = [
    ['nasal', nasal, 'L+R', [-0.015, 1.62, 0.08, 0.015, 1.665, 0.115]],
    ['cigomatico', zygL, 'L', [0.03, 1.6, 0.0, 0.08, 1.65, 0.085]],
    ['cigomatico', zygR, 'R', [-0.08, 1.6, 0.0, -0.03, 1.65, 0.085]],
    ['maxilar', maxilla, null, [-0.05, 1.545, 0.02, 0.05, 1.64, 0.125]],
    ['esfenoides', sphL, 'L', [0.045, 1.62, 0.02, 0.085, 1.67, 0.05]],
    ['esfenoides', sphR, 'R', [-0.085, 1.62, 0.02, -0.045, 1.67, 0.05]],
    ['occipital', occ, null, [-0.08, 1.565, -0.115, 0.08, 1.725, -0.02]],
    ['frontal', frontalR, null, [-0.08, 1.625, -0.02, 0.08, 1.755, 0.11]],
    ['temporal', tempL, 'L', [0.035, 1.565, -0.085, 0.085, 1.7, 0.055]],
    ['temporal', tempR, 'R', [-0.085, 1.565, -0.085, -0.035, 1.7, 0.055]],
    ['parietal', parL, 'L', [0, 1.64, -0.11, 0.08, 1.755, 0.06]],
    ['parietal', parR, 'R', [-0.08, 1.64, -0.11, 0, 1.755, 0.06]],
    ['esfenoides-base', rest, null, [-0.07, 1.565, -0.07, 0.07, 1.665, 0.06]],
  ];
  const defs = order.map(([id, , side]) => ({
    id: id === 'esfenoides-base' ? 'esfenoides' : id,
    side: side === 'L+R' ? null : side,
    n: id === 'esfenoides-base' ? 'base' : undefined,
    label: id === 'esfenoides-base' ? 'Esfenoides (cuerpo y alas, base del cráneo)' : null,
  }));
  const regs = order.map(o => o[1]);
  R.group(SYS, defs, () => {
    const g = meshSDF(S, 0.0019);
    return splitByClass(g, regs.length, (x, y, z) => {
      for (let i = 0; i < regs.length; i++) if (regs[i](x, y, z) < 0) return i;
      return regs.length - 1;
    });
  }, { color: BONE, weight: 3 });

  // Mandíbula
  R.sdf('mandibula', SYS, mandibleSDF(), 0.0017, { color: BONE });
  // Dientes
  R.sdf('dientes', SYS, teethSDF(), 0.0009, { color: '#f4f0e6' });
  // Hioides
  R.geom('hioides', SYS, () => tube(smoothPath([[-0.021, 1.518, 0.004], [-0.012, 1.514, 0.024], [0, 1.512, 0.031], [0.012, 1.514, 0.024], [0.021, 1.518, 0.004]], 0.002), t => 0.0026 - 0.001 * Math.abs(t - 0.5), { radial: 10 }), { color: BONE });
}

export function mandibleSDF() {
  const line = (yOff) => {
    const pts = [];
    for (let i = -6; i <= 6; i++) {
      const t = i / 6;
      const a = Math.abs(t);
      pts.push([0.049 * Math.sin(t * 1.2) / Math.sin(1.2), 1.538 + 0.01 * a + yOff, 0.084 - 0.083 * Math.pow(a, 1.7)]);
    }
    return pts;
  };
  const top = line(0.0135), bot = line(-0.0125);
  const body = sunion(0.004, ribbon(top, bot, 0.0035), chain(bot, 0.0042, 0.003));
  const ramus = (s) => {
    const m = p => [p[0] * s, p[1], p[2]];
    const ang = m([0.049, 1.547, 0.0]), cond = m([0.053, 1.596, -0.002]), corB = m([0.046, 1.575, 0.026]);
    const bodyB = m([0.046, 1.553, 0.03]), corT = m([0.047, 1.6, 0.021]), notch = m([0.05, 1.586, 0.009]);
    return sunion(0.003,
      triangle(ang, cond, corB, 0.0032), triangle(ang, corB, bodyB, 0.0032), triangle(corB, corT, notch, 0.0026),
      ellipsoid(m([0.053, 1.6, -0.002]), [0.0095, 0.0048, 0.0055]),
      capsule(ang, cond, 0.0035));
  };
  return sunion(0.004, body, ramus(1), ramus(-1), ellipsoid([0, 1.527, 0.083], [0.014, 0.008, 0.006]));
}

function teethSDF() {
  // posiciones a lo largo del arco: [x, z, ancho, profundidad, tipo]
  const T = [
    [0.0045, 0.0845, 0.0043, 0.0032, 'i'], [0.0123, 0.0805, 0.0034, 0.003, 'i'], [0.0188, 0.0745, 0.0038, 0.0038, 'c'],
    [0.0228, 0.0665, 0.0035, 0.0044, 'p'], [0.0255, 0.0585, 0.0034, 0.0045, 'p'], [0.0283, 0.0485, 0.0052, 0.0052, 'm'],
    [0.0302, 0.0378, 0.0049, 0.0050, 'm'], [0.0316, 0.0278, 0.0044, 0.0046, 'm'],
  ];
  const parts = [];
  for (const s of [1, -1]) for (const up of [1, -1]) {
    for (const [x, z, w, d, k] of T) {
      const lowerShift = up < 0 ? 0.9 : 1; // arcada inferior ligeramente más estrecha
      const px = x * s * lowerShift, pz = z - (up < 0 ? 0.002 : 0);
      const yBase = 1.556 + 0.0008 * up;
      const hgt = k === 'c' ? 0.012 : k === 'i' ? 0.0105 : k === 'p' ? 0.0085 : 0.0075;
      const ang = Math.atan2(px, pz - 0.035);
      const bs = basisEuler(0, ang, 0);
      parts.push(ellipsoid([px, yBase + up * hgt * 0.5, pz], [w, hgt * 0.55, d], bs));
    }
  }
  return union(...parts);
}

// ------------------------------------------------------------------ Columna
function vertebraSDF(name) {
  const v = V[name], d = vertDims(name);
  const y = v.y, z = v.z, zc = canalOf(name), rf = d.rf;
  const t = d.t;
  const idx = VERTEBRAE.findIndex(q => q[0] === name);
  const pr = t === 'C' ? 0.0024 : t === 'T' ? 0.0028 : 0.0038;
  const parts = [];
  if (name === 'C1') {
    const zA = z + 0.006;
    parts.push(chain([[-0.012, y, zA - 0.006], [0, y, zA], [0.012, y, zA - 0.006]], 0.0034, 0.002));
    for (const s of [1, -1]) {
      parts.push(ellipsoid([0.0165 * s, y, zc + 0.006], [0.0062, 0.0062, 0.0095]));
      parts.push(chain([[0.017 * s, y, zc - 0.004], [0.013 * s, y + 0.001, zc - rf - 0.004], [0, y + 0.002, zc - rf - 0.008]], 0.0029, 0.002));
      parts.push(capsule([0.02 * s, y, zc + 0.005], [0.036 * s, y - 0.001, zc + 0.004], 0.0042));
    }
    parts.push(sphere([0, y + 0.001, zc - rf - 0.009], 0.0035));
    return sunion(0.002, ...parts);
  }
  // Cuerpo
  const body = ellCyl([0, y, z], d.rx, d.rz, d.hh, 0.0018);
  parts.push(body);
  if (name === 'C2') parts.push(roundCone([0, y + d.hh, z + 0.002], [0, 1.582, z + 0.004], 0.0045, 0.0036));
  for (const s of [1, -1]) {
    const pedA = [rf * 0.78 * s, y + d.hh * 0.25, z - d.rz * 0.72];
    const pedB = [rf * 1.02 * s, y + d.hh * 0.15, zc + rf * 0.2];
    const lamB = [0, y - d.hh * 0.25, zc - rf * 1.08];
    parts.push(capsule(pedA, pedB, pr));
    parts.push(capsule(pedB, lamB, pr * 0.95));
    // procesos articulares
    parts.push(sphere([rf * 1.08 * s, y + d.hh + 0.0015, zc + rf * 0.05], pr * 1.05));
    parts.push(sphere([rf * 0.95 * s, y - d.hh - 0.0012, zc - rf * 0.35], pr * 1.05));
    // procesos transversos
    if (t === 'C') {
      parts.push(capsule([rf * s, y, zc + rf * 0.7], [(rf + 0.0155) * s, y - 0.0015, zc + rf * 0.85], 0.0027));
    } else if (t === 'T') {
      const k = (idx - 7) / 11;
      const tipX = 0.034 - 0.009 * k;
      parts.push(capsule(pedB, [tipX * s, y + 0.003, zc - 0.007], 0.0034));
      parts.push(sphere([tipX * s, y + 0.003, zc - 0.007], 0.0042));
    } else {
      parts.push(capsule([rf * s, y, zc + 0.002], [0.04 * s, y + 0.001, zc + 0.003], 0.0032));
    }
  }
  // Proceso espinoso
  const sb = [0, y - d.hh * 0.25, zc - rf * 1.02];
  if (t === 'C') {
    if (name === 'C7') parts.push(roundCone(sb, add3(sb, [0, -0.012, -0.03]), 0.0038, 0.0042));
    else {
      const tip = add3(sb, [0, -0.006, -0.015 - (name === 'C2' ? 0.004 : 0)]);
      parts.push(capsule(sb, tip, 0.003));
      parts.push(sphere(add3(tip, [0.0032, 0, 0]), 0.0028), sphere(add3(tip, [-0.0032, 0, 0]), 0.0028));
    }
  } else if (t === 'T') {
    const k = (idx - 7) / 11;
    const steep = Math.sin(Math.PI * Math.min(1, k * 1.15));
    const dir = [0, -0.012 - 0.016 * steep, -0.024 + 0.006 * steep];
    parts.push(roundCone(sb, add3(sb, dir), 0.003, 0.0034));
  } else {
    parts.push(roundBox(add3(sb, [0, -0.003, -0.014]), [0.0032, 0.009, 0.0135], 0.0025));
  }
  return sunion(0.0022, ...parts);
}

function spine(R) {
  for (const [name, , , t] of VERTEBRAE) {
    let id = t === 'C' ? 'vertebra-cervical' : t === 'T' ? 'vertebra-toracica' : 'vertebra-lumbar';
    if (name === 'C1') id = 'atlas';
    if (name === 'C2') id = 'axis';
    if (name === 'C7') id = 'vertebra-prominente';
    R.sdf(id, SYS, vertebraSDF(name), 0.0014, { color: BONE, label: `Vértebra ${name}`, n: name });
  }
  // Discos intervertebrales
  const discs = [];
  for (let i = 1; i < VERTEBRAE.length; i++) {
    const a = VERTEBRAE[i - 1][0], b = VERTEBRAE[i][0];
    if (a === 'C1') continue;
    const da = vertDims(a), db = vertDims(b);
    const top = V[a].y - da.hh, bot = V[b].y + db.hh;
    const yc = (top + bot) / 2, hh = Math.max(0.0012, (top - bot) / 2 - 0.0003);
    discs.push(ellCyl([0, yc, (V[a].z + V[b].z) / 2], (da.rx + db.rx) / 2 * 0.98, (da.rz + db.rz) / 2 * 0.98, hh, Math.min(hh * 0.9, 0.0015)));
  }
  const l5 = vertDims('L5');
  const top = V.L5.y - l5.hh, bot = SACRUM.base[1];
  discs.push(ellCyl([0, (top + bot) / 2, -0.042], 0.022, 0.0155, (top - bot) / 2 - 0.0003, 0.0015, basisEuler(0.12, 0, 0)));
  R.sdf('disco-intervertebral', SYS, union(...discs), 0.0016, { color: '#b7c9d3' });

  // Sacro
  const a = SACRUM.base, b = SACRUM.apex;
  const ax = normalize(sub3(b, a));
  const segs = [];
  const sacParts = [];
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const c = add3(lerp3(a, b, t), [0, 0, -0.008 * Math.sin(Math.PI * t)]);
    const w = 0.022 - 0.014 * t, hgt = 0.011 - 0.003 * t, dep = 0.0145 - 0.008 * t;
    segs.push(c);
    sacParts.push(ellipsoid(add3(c, [0, -0.006 * (i === 0 ? 1 : 0), 0]), [w, hgt, dep], basisFromY(ax, [0, -ax[2], ax[1]])));
  }
  for (const s of [1, -1]) {
    sacParts.push(ellipsoid([0.032 * s, 0.94, -0.058], [0.021, 0.016, 0.017]));
    sacParts.push(fan([0.0, 0.905, -0.079], [[0.05 * s, 0.94, -0.066], [0.045 * s, 0.915, -0.078], [0.03 * s, 0.888, -0.088], [0.012 * s, 0.866, -0.097]], 0.0065));
  }
  sacParts.push(chain(segs.map(c => add3(c, scale3([0, -ax[2], ax[1]], -0.014))), 0.003));
  let sac = sunion(0.006, ...sacParts);
  const foramina = [];
  for (let i = 0; i < 4; i++) {
    const t = (i + 0.5) / 4.2;
    const c = add3(lerp3(a, b, t), [0, 0, -0.008 * Math.sin(Math.PI * t)]);
    for (const s of [1, -1]) foramina.push(capsule(add3(c, [0.016 * s * (1 - 0.35 * t), 0, 0.02]), add3(c, [0.016 * s * (1 - 0.35 * t), 0, -0.02]), 0.0032 - 0.0006 * i));
  }
  sac = sub(sac, ...foramina);
  R.sdf('sacro', SYS, sac, 0.0017, { color: BONE });
  // Cóccix
  const cc = [];
  const c0 = SACRUM.apex, c1 = SACRUM.coccyxTip;
  for (let i = 0; i < 4; i++) {
    const t = (i + 0.4) / 4;
    cc.push(ellipsoid(lerp3(c0, c1, t), [0.0075 - 0.0013 * i, 0.0036, 0.0045 - 0.0006 * i]));
  }
  R.sdf('coccix', SYS, sunion(0.002, ...cc), 0.001, { color: BONE });
}

// ------------------------------------------------------------------ Tórax
const RIB_END = [null,
  [0.032, 1.392], [0.048, 1.353], [0.062, 1.319], [0.075, 1.288], [0.087, 1.256], [0.098, 1.223],
  [0.107, 1.19], [0.115, 1.157], [0.12, 1.124], [0.123, 1.093], [null, 1.087, 1.72], [null, 1.112, 1.06],
];
// Devuelve los puntos (lado izquierdo) de la costilla n y su extremo anterior
export function ribPath(n) {
  const name = 'T' + n;
  const v = V[name], d = vertDims(name), zc = canalOf(name);
  const k = (n - 1) / 11;
  const tipX = 0.034 - 0.009 * k;
  const H = [d.rx * 0.95 + 0.0025, v.y + d.hh * 0.85, v.z - d.rz * 0.3];
  const Tb = [tipX + 0.002, v.y + 0.002, zc - 0.0105];
  const A = [tipX + 0.026 - 0.006 * (n === 1 ? 1 : 0), v.y - 0.006, zc - 0.022 + (n === 1 ? 0.012 : 0)];
  const [ex, ey, thE] = RIB_END[n];
  const yL = (A[1] + ey) / 2 - 0.008;
  const th = thoraxAt(yL);
  const a = th.rx + 0.0065;
  const cz = th.cz;
  const thA = Math.asin(Math.min(0.95, A[0] / a));
  const bB = (cz - A[2]) / Math.cos(thA);
  const thFront = thoraxAt(ey);
  const bF = thFront.rz + 0.009;
  const thEnd = thE !== undefined ? thE : Math.PI - Math.asin(Math.min(0.98, ex / a));
  const pts = [H, Tb];
  const N = 14;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const th2 = thA + (thEnd - thA) * t;
    const b = th2 < Math.PI / 2 ? bB : bF;
    const yy = A[1] + (ey - A[1]) * (0.5 - 0.5 * Math.cos(Math.PI * t)) * 0.6 + (ey - A[1]) * t * 0.4;
    pts.push([a * Math.sin(th2), yy, cz - b * Math.cos(th2)]);
  }
  return pts;
}
export function ribCartilage(n) {
  if (n > 10) return null;
  const p = ribPath(n);
  const E = p[p.length - 1];
  if (n <= 7) {
    const sy = STERNAL_ATT[n - 1];
    const sz = sternumZ(sy);
    const halfW = sternumHalfW(sy);
    const S = [halfW - 0.001, sy, sz - 0.002];
    const mid = add3(lerp3(E, S, 0.5), [0, n >= 5 ? 0.006 : 0, 0.006]);
    return [E, mid, S];
  }
  const prev = ribCartilage(n - 1);
  const tgt = lerp3(prev[0], prev[1], 0.55);
  const mid = add3(lerp3(E, tgt, 0.5), [0, 0, 0.006]);
  return [E, mid, add3(tgt, [0, -0.003, 0])];
}
function sternumZ(y) {
  const t = (STERNUM.notch[1] - y) / (STERNUM.notch[1] - STERNUM.xiphJoint[1]);
  return STERNUM.notch[2] + (STERNUM.xiphJoint[2] - STERNUM.notch[2]) * Math.min(1, Math.max(0, Math.pow(t, 0.8)));
}
function sternumHalfW(y) {
  if (y > STERNUM.angle[1]) return 0.025 - (STERNUM.notch[1] - y) * 0.15;
  return 0.0145 + (STERNUM.angle[1] - y) * 0.03;
}

function thorax(R) {
  for (let n = 1; n <= 12; n++) {
    const pts = ribPath(n);
    const smooth = smoothPath(pts, 0.003);
    const id = n <= 7 ? 'costilla-verdadera' : n <= 10 ? 'costilla-falsa' : 'costilla-flotante';
    const flat = n === 1 ? 0.5 : 2.0;
    const r0 = n === 1 ? 0.0068 : 0.0031 + 0.0003 * Math.min(1, n / 6);
    R.biGeom(id, SYS, () => tube(smooth, (t) => {
      const head = t < 0.05 ? 1.25 : 1;
      const end = n >= 11 ? 1 - 0.5 * Math.max(0, (t - 0.8) / 0.2) : 1;
      return r0 * head * end * (t < 0.12 ? 0.85 + t : 1);
    }, { radial: 10, flat, up: [0, 1, 0] }), { color: BONE, label: `${n}.ª costilla`, n: 'c' + n });
  }
  // Cartílagos costales
  R.biGeom('cartilago-costal', SYS, () => {
    const gs = [];
    for (let n = 1; n <= 10; n++) {
      const c = ribCartilage(n);
      gs.push(tube(smoothPath(c, 0.003), n === 1 ? 0.0055 : 0.0042, { radial: 10, flat: 1.3, up: [0, 1, 0] }));
    }
    return merge(gs);
  }, { color: CART });

  // Esternón
  const sAx = normalize(sub3(STERNUM.xiphJoint, STERNUM.notch));
  const bs = basisFromY(sAx, [0, -sAx[2], sAx[1]]);
  const man = lerp3(STERNUM.notch, STERNUM.angle, 0.5);
  const manAx = normalize(sub3(STERNUM.angle, STERNUM.notch));
  const bsm = basisFromY(manAx, [0, -manAx[2], manAx[1]]);
  const body = lerp3(STERNUM.angle, STERNUM.xiphJoint, 0.5);
  const bodyAx = normalize(sub3(STERNUM.xiphJoint, STERNUM.angle));
  const bsb = basisFromY(bodyAx, [0, -bodyAx[2], bodyAx[1]]);
  void bs;
  let st = sunion(0.006,
    roundBox(add3(man, [0, 0.004, 0]), [0.021, 0.019, 0.0055], 0.004, bsm),
    roundBox(add3(man, [0, -0.008, 0]), [0.016, 0.014, 0.0055], 0.004, bsm),
    roundBox(body, [0.0145, 0.057, 0.0052], 0.004, bsb),
    roundBox(add3(body, [0, -0.03, 0.002]), [0.0165, 0.025, 0.0052], 0.004, bsb),
    roundCone(add3(STERNUM.xiphJoint, [0, 0.002, -0.001]), STERNUM.xiphTip, 0.0075, 0.0028),
  );
  st = ssub(0.003, st, sphere([0, STERNUM.notch[1] + 0.006, STERNUM.notch[2]], 0.008),
    sphere([0.026, 1.414, 0.058], 0.0075), sphere([-0.026, 1.414, 0.058], 0.0075));
  R.sdf('esternon', SYS, st, 0.0016, { color: BONE });
}

// ------------------------------------------------------------------ Miembro superior
export function claviclePts() {
  return [[0.022, 1.416, 0.06], [0.06, 1.423, 0.066], [0.105, 1.434, 0.044], [0.142, 1.443, 0.012], [0.167, 1.447, -0.012]];
}

export const SCAP = {
  SA: [0.07, 1.428, -0.098], IA: [0.088, 1.292, -0.116], MS: [0.073, 1.39, -0.106],
  G: [0.161, 1.402, -0.032], C: [0.108, 1.368, -0.094],
};
function scapulaSDF() {
  const { SA, IA, MS, G, C } = SCAP;
  const rim = [SA, [0.115, 1.432, -0.078], [0.138, 1.42, -0.055], [0.152, 1.4, -0.042], [0.149, 1.38, -0.051],
    [0.13, 1.332, -0.086], IA, [0.079, 1.338, -0.112], MS, SA];
  const body = fan(C, rim, 0.0017, 0.003);
  const latBorder = chain([[0.149, 1.38, -0.051], [0.13, 1.332, -0.086], IA], [0.0045, 0.004, 0.0035], 0.003);
  const medBorder = chain([SA, MS, [0.079, 1.338, -0.112], IA], 0.0022, 0.002);
  const supBorder = chain([SA, [0.115, 1.432, -0.078], [0.138, 1.42, -0.055]], 0.0022, 0.002);
  const glen = ellipsoid(G, [0.0058, 0.018, 0.012], basisEuler(0, 0.55, 0));
  const neck = capsule([0.15, 1.401, -0.042], G, 0.009);
  const spineL = [[0.075, 1.388, -0.109], [0.105, 1.402, -0.11], [0.135, 1.42, -0.096], [0.158, 1.435, -0.07]];
  const spineBase = [[0.078, 1.386, -0.104], [0.105, 1.396, -0.101], [0.13, 1.405, -0.09], [0.15, 1.412, -0.07]];
  const sp = sunion(0.004, chain(spineL, [0.0032, 0.0042, 0.0048, 0.005], 0.003), ribbon(spineL, spineBase, 0.0018));
  const acromion = ellipsoidAxis([0.157, 1.438, -0.07], [0.181, 1.446, -0.012], 0.0115, 0.0042, [0, 1, 0]);
  const coracoid = chain([[0.137, 1.418, -0.052], [0.141, 1.426, -0.032], [0.146, 1.418, -0.006]], [0.0055, 0.0046, 0.0038], 0.003);
  return sunion(0.003, body, latBorder, medBorder, supBorder, glen, neck, sp, acromion, coracoid);
}

function humerusSDF() {
  const { elbow: E, armLat: lat, humHead, humHeadR } = ARM;
  const medEpi = add3(madd(E, lat, -0.033), [0, 0.008, -0.006]);
  const latEpi = add3(madd(E, lat, 0.026), [0, 0.01, -0.003]);
  return sunion(0.006,
    sphere(humHead, humHeadR),
    ellipsoid([0.201, 1.404, -0.014], [0.011, 0.014, 0.013]),
    sphere([0.19, 1.392, 0.002], 0.0075),
    chain([[0.193, 1.375, -0.02], [0.203, 1.3, -0.019], [0.212, 1.21, -0.021], [0.22, 1.125, -0.024]], [0.0135, 0.0118, 0.011, 0.0118], 0.004),
    ellipsoid([0.211, 1.285, -0.016], [0.0065, 0.018, 0.0065]),
    triangle([0.221, 1.13, -0.024], medEpi, latEpi, 0.0055),
    capsule(medEpi, latEpi, 0.0055),
    ellipsoid(madd(E, lat, -0.009), [0.0115, 0.011, 0.0125], basisFromY(lat, [0, 0, 1])),
    sphere(add3(madd(E, lat, 0.013), [0, -0.002, 0.004]), 0.0098),
    sphere(medEpi, 0.0062),
  );
}

// Punto del antebrazo: a lo largo desde el codo, lateral y anterior
function fpt(along, lat, ant = 0) {
  return add3(add3(madd(ARM.elbow, ARM.foreDir, along), scale3(ARM.foreLat, lat)), [0, 0, ant]);
}
function ulnaSDF() {
  return sunion(0.004,
    ellipsoid(fpt(-0.016, -0.009, -0.017), [0.009, 0.013, 0.009], basisFromY(ARM.foreDir)),
    capsule(fpt(-0.012, -0.009, -0.016), fpt(0.02, -0.011, -0.006), 0.0078),
    ellipsoid(fpt(0.007, -0.008, 0.006), [0.006, 0.006, 0.006]),
    chain([fpt(0.015, -0.011, -0.006), fpt(0.12, -0.0135, -0.004), fpt(0.232, -0.0165, -0.004)], [0.0078, 0.0058, 0.0045], 0.003),
    sphere(fpt(0.236, -0.0168, -0.004), 0.0068),
    capsule(fpt(0.236, -0.019, -0.006), fpt(0.244, -0.021, -0.006), 0.0028),
  );
}
function radiusSDF() {
  const bs = basisFromY(ARM.foreDir);
  return sunion(0.004,
    ellCyl(fpt(0.011, 0.013, 0.003), 0.0105, 0.0105, 0.0042, 0.0018, bs),
    capsule(fpt(0.013, 0.013, 0.003), fpt(0.03, 0.0115, 0.003), 0.0062),
    sphere(fpt(0.034, 0.008, 0.004), 0.0055),
    chain([fpt(0.03, 0.0115, 0.003), fpt(0.12, 0.0125, 0.004), fpt(0.215, 0.0125, 0.002)], [0.0062, 0.0068, 0.0085], 0.004),
    ellipsoid(fpt(0.232, 0.012, 0.001), [0.0145, 0.009, 0.0098], basisFromY(ARM.foreDir, [0, 0, 1])),
    capsule(fpt(0.232, 0.02, 0.0), fpt(0.244, 0.0245, 0.0), 0.0042),
  );
}

const CARPALS = [
  ['escafoides', 0.013, 0.0105, 0.002, [0.0075, 0.0055, 0.006]],
  ['semilunar', 0.0115, 0.0005, 0.001, [0.0062, 0.006, 0.0068]],
  ['piramidal', 0.013, -0.0098, 0.0, [0.0055, 0.0055, 0.0052]],
  ['pisiforme', 0.0145, -0.012, 0.0075, [0.0042, 0.0042, 0.0042]],
  ['trapecio', 0.029, 0.0155, 0.003, [0.0062, 0.0055, 0.0058]],
  ['trapezoide', 0.0305, 0.0068, 0.001, [0.0045, 0.006, 0.0052]],
  ['grande', 0.0285, -0.0018, 0.0, [0.0058, 0.0092, 0.0068]],
  ['ganchoso', 0.0285, -0.0115, 0.0, [0.0055, 0.0078, 0.0062]],
];
const FINGER_NAMES = ['pulgar', 'índice', 'medio', 'anular', 'meñique'];
const ORD = ['1.er', '2.º', '3.er', '4.º', '5.º'];

function upperLimb(R) {
  const H = 0.0022;
  R.biGeom('clavicula', SYS, () => tube(smoothPath(claviclePts(), 0.003), t => 0.0078 - 0.0022 * t, { radial: 14, flat: 0.82, up: [0, 0.3, 1] }), { color: BONE });
  R.bi('escapula', SYS, scapulaSDF(), 0.0016, { color: BONE });
  R.bi('humero', SYS, humerusSDF(), H, { color: BONE });
  R.bi('cubito', SYS, ulnaSDF(), 0.0017, { color: BONE });
  R.bi('radio', SYS, radiusSDF(), 0.0017, { color: BONE });
  const hf = handFrame();
  const hb = { u: hf.l, v: hf.d, w: hf.n };
  for (const [id, al, lat, palm, r] of CARPALS) {
    let f = ellipsoid(handPt(al, lat, palm), r, hb);
    if (id === 'ganchoso') f = sunion(0.003, f, sphere(handPt(al + 0.003, lat + 0.001, 0.0075), 0.0028));
    if (id === 'escafoides') f = sunion(0.003, f, sphere(handPt(al + 0.006, lat + 0.004, 0.006), 0.003));
    R.bi(id, SYS, f, 0.0009, { color: BONE });
  }
  for (let i = 0; i < 5; i++) {
    const J = fingerJoints(i);
    const F = FINGERS[i];
    const rs = i === 0 ? 1.15 : i === 4 ? 0.88 : 1;
    const mc = sunion(0.003, roundCone(J[0], J[1], 0.0048 * rs, 0.0033 * rs), sphere(J[0], 0.005 * rs), sphere(madd(J[1], normalize(sub3(J[0], J[1])), 0.002), 0.0046 * rs));
    R.bi('metacarpianos', SYS, mc, 0.001, { color: BONE, label: `${ORD[i]} metacarpiano (${FINGER_NAMES[i]})`, n: 'mc' + i });
    const names = i === 0 ? ['proximal', 'distal'] : ['proximal', 'media', 'distal'];
    for (let j = 0; j < F.ph.length; j++) {
      const a = J[j + 1], b = J[j + 2];
      const dir = normalize(sub3(b, a));
      const a2 = madd(a, dir, 0.0016), b2 = madd(b, dir, -0.0012);
      const r0 = (0.0045 - j * 0.0007) * rs, r1 = (0.0034 - j * 0.0005) * rs;
      const f = sunion(0.002, roundCone(a2, b2, r0, r1), sphere(madd(a2, dir, 0.001), r0 * 1.05));
      R.bi('falanges-mano', SYS, f, 0.0009, { color: BONE, label: `Falange ${names[j]} · ${FINGER_NAMES[i]}`, n: `f${i}${j}` });
    }
  }
}

// ------------------------------------------------------------------ Pelvis
function coxalSDF() {
  const A = [0.084, 0.942, -0.004];
  const crest = [[0.117, 0.972, 0.066], [0.134, 0.996, 0.046], [0.144, 1.015, 0.012], [0.141, 1.022, -0.02], [0.124, 1.016, -0.054], [0.094, 1.003, -0.076], [0.062, 0.99, -0.087], [0.046, 0.98, -0.085]];
  const sacroIliac = [[0.046, 0.98, -0.085], [0.05, 0.96, -0.072], [0.056, 0.938, -0.066]];
  const wing = sunion(0.005, fan(A, [...crest, ...sacroIliac], 0.0028, 0.006), chain(crest, [0.0055, 0.006, 0.0062, 0.0064, 0.0064, 0.006, 0.0062, 0.0066], 0.003));
  // Acetábulo
  const Hc = LEG.hip;
  const open = normalize([0.62, -0.42, 0.45]);
  let acet = sub(sphere(madd(Hc, open, -0.004), 0.031), sphere(Hc, 0.0255));
  acet = inter(acet, (() => { const f = (x, y, z) => (x - Hc[0]) * open[0] + (y - Hc[1]) * open[1] + (z - Hc[2]) * open[2] - 0.006; f.b = [-1e9, -1e9, -1e9, 1e9, 1e9, 1e9]; return f; })());
  const ASIS = [0.117, 0.972, 0.066];
  const pubis = sunion(0.004,
    capsule([0.074, 0.918, 0.03], [0.026, 0.886, 0.072], 0.0072),
    ellipsoid([0.017, 0.877, 0.071], [0.0115, 0.019, 0.0085], basisEuler(-0.35, 0.25, 0)),
    capsule([0.02, 0.862, 0.064], [0.047, 0.836, 0.012], 0.0058),
    ellipsoid([0.092, 0.932, 0.044], [0.009, 0.008, 0.009]),
  );
  const ischium = sunion(0.004,
    capsule([0.083, 0.905, -0.02], [0.066, 0.848, -0.03], 0.0105),
    ellipsoid([0.064, 0.841, -0.029], [0.011, 0.018, 0.015], basisEuler(0.3, 0, 0)),
    capsule([0.06, 0.834, -0.015], [0.048, 0.836, 0.012], 0.0062),
    capsule([0.066, 0.885, -0.042], [0.05, 0.884, -0.05], 0.004),
    capsule([0.075, 0.94, -0.045], [0.07, 0.9, -0.04], 0.006),
  );
  return sunion(0.006, wing, acet, pubis, ischium, capsule([0.06, 0.94, -0.066], [0.075, 0.928, -0.03], 0.008));
}
function pelvis(R) {
  R.bi('coxal', SYS, coxalSDF(), 0.002, { color: BONE });
}

// ------------------------------------------------------------------ Miembro inferior
function femurSDF() {
  const { hip, headR } = LEG;
  return sunion(0.007,
    sphere(hip, headR),
    roundCone(hip, [0.131, 0.902, -0.005], 0.0145, 0.0165),
    ellipsoid([0.151, 0.912, -0.014], [0.014, 0.025, 0.018]),
    sphere([0.127, 0.857, -0.017], 0.0085),
    capsule([0.151, 0.905, -0.022], [0.128, 0.858, -0.02], 0.0055),
    chain([[0.141, 0.89, -0.006], [0.131, 0.78, 0.004], [0.114, 0.64, 0.004], [0.101, 0.56, -0.004]], [0.0158, 0.0138, 0.0135, 0.0155], 0.005),
    ellipsoid([0.095, 0.535, -0.006], [0.031, 0.03, 0.022]),
    sub(union(
      ellipsoid([0.076, 0.512, -0.012], [0.0145, 0.022, 0.03]),
      ellipsoid([0.114, 0.512, -0.01], [0.015, 0.021, 0.028]),
    ), capsule([0.095, 0.49, -0.04], [0.095, 0.497, 0.0], 0.0065)),
  );
}
function patellaSDF() {
  return sunion(0.006, ellipsoid([0.096, 0.53, 0.031], [0.0205, 0.02, 0.0095], basisEuler(-0.15, 0, 0)), ellipsoid([0.096, 0.514, 0.032], [0.012, 0.012, 0.007]));
}
function tibiaSDF() {
  return sunion(0.006,
    ellCyl([0.094, 0.478, -0.006], 0.037, 0.026, 0.0085, 0.004),
    roundCone([0.094, 0.468, -0.006], [0.093, 0.415, 0.0], 0.026, 0.0145),
    sphere([0.098, 0.446, 0.021], 0.0072),
    chain([[0.093, 0.43, 0.0], [0.092, 0.27, 0.0], [0.091, 0.13, -0.006]], [0.0145, 0.0112, 0.0125], 0.005),
    ellipsoid([0.09, 0.1, -0.008], [0.02, 0.016, 0.0185]),
    capsule([0.074, 0.098, -0.008], [0.073, 0.069, -0.008], 0.0066),
  );
}
function fibulaSDF() {
  return sunion(0.004,
    sphere([0.122, 0.453, -0.025], 0.0088),
    chain([[0.122, 0.443, -0.023], [0.118, 0.27, -0.02], [0.116, 0.11, -0.016]], [0.0062, 0.0055, 0.006], 0.003),
    capsule([0.116, 0.1, -0.016], [0.117, 0.064, -0.018], 0.0076),
  );
}
const TARSALS = [
  ['astragalo', () => sunion(0.004, ellipsoid([0.091, 0.07, -0.012], [0.0165, 0.0128, 0.022]), roundCone([0.09, 0.066, 0.004], [0.085, 0.06, 0.023], 0.0105, 0.0098))],
  ['calcaneo', () => sunion(0.006, ellipsoid([0.096, 0.039, -0.03], [0.0158, 0.019, 0.037], basisEuler(0.18, 0, 0)), sphere([0.098, 0.031, -0.063], 0.017), sphere([0.079, 0.05, -0.015], 0.0062), ellipsoid([0.104, 0.033, 0.0], [0.011, 0.011, 0.012]))],
  ['navicular', () => ellipsoid([0.082, 0.058, 0.034], [0.0158, 0.011, 0.0072], basisEuler(0, 0.2, 0.3))],
  ['cuboides', () => ellipsoid([0.111, 0.034, 0.027], [0.0108, 0.0108, 0.0158])],
  ['cuneiforme-medial', () => ellipsoid([0.074, 0.046, 0.052], [0.0072, 0.0132, 0.011])],
  ['cuneiforme-intermedio', () => ellipsoid([0.086, 0.05, 0.047], [0.0055, 0.01, 0.0078])],
  ['cuneiforme-lateral', () => ellipsoid([0.098, 0.046, 0.05], [0.006, 0.0102, 0.0098])],
];
const MT = [
  [[0.074, 0.04, 0.064], [0.07, 0.02, 0.128], 0.0078, 0.0092],
  [[0.086, 0.044, 0.059], [0.084, 0.018, 0.135], 0.0046, 0.006],
  [[0.097, 0.042, 0.061], [0.098, 0.016, 0.13], 0.0043, 0.0058],
  [[0.108, 0.036, 0.057], [0.111, 0.014, 0.122], 0.0041, 0.0056],
  [[0.118, 0.028, 0.05], [0.124, 0.012, 0.112], 0.0043, 0.0056],
];
const TOE_NAMES = ['dedo gordo (hallux)', '2.º dedo', '3.er dedo', '4.º dedo', '5.º dedo'];
const TOES = [
  [[0.07, 0.019, 0.137], [0.027, 0.022], 0.0062],
  [[0.084, 0.0165, 0.142], [0.021, 0.011, 0.008], 0.0037],
  [[0.098, 0.0145, 0.137], [0.019, 0.009, 0.0075], 0.0035],
  [[0.111, 0.0125, 0.129], [0.017, 0.008, 0.007], 0.0033],
  [[0.124, 0.0112, 0.119], [0.0145, 0.006, 0.006], 0.0032],
];

function lowerLimb(R) {
  R.bi('femur', SYS, femurSDF(), 0.0025, { color: BONE });
  R.bi('rotula', SYS, patellaSDF(), 0.0015, { color: BONE });
  R.bi('tibia', SYS, tibiaSDF(), 0.0022, { color: BONE });
  R.bi('perone', SYS, fibulaSDF(), 0.0016, { color: BONE });
  for (const [id, mk] of TARSALS) R.bi(id, SYS, mk(), 0.0012, { color: BONE });
  MT.forEach(([a, b, r, rh], i) => {
    let f = sunion(0.003, roundCone(a, b, r * 1.25, r), sphere(b, rh));
    if (i === 4) f = sunion(0.003, f, sphere([0.124, 0.025, 0.046], 0.0062));
    R.bi('metatarsianos', SYS, f, 0.0011, { color: BONE, label: `${ORD[i]} metatarsiano`, n: 'mt' + i });
  });
  TOES.forEach(([start, lens, r], i) => {
    let p = start;
    const dir = normalize([0, -0.12, 1]);
    const names = lens.length === 2 ? ['proximal', 'distal'] : ['proximal', 'media', 'distal'];
    lens.forEach((L, j) => {
      const q = madd(p, dir, L);
      const rr = r * (1 - j * 0.12);
      const f = sunion(0.002, roundCone(madd(p, dir, 0.0012), madd(q, dir, -0.001), rr, rr * 0.82), sphere(madd(p, dir, 0.002), rr * 1.05));
      R.bi('falanges-pie', SYS, f, 0.001, { color: BONE, label: `Falange ${names[j]} · ${TOE_NAMES[i]}`, n: `p${i}${j}` });
      p = madd(q, dir, 0.0015);
    });
  });
}

export { scapulaSDF, humerusSDF, femurSDF, tibiaSDF, fpt, sternumZ, sternumHalfW };
void plane; void offset; void clipBounds; void smax; void CART;
