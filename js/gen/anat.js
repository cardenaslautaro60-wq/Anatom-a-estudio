// Puntos de referencia anatómicos de la plantilla (varón adulto de 1,75 m, posición anatómica).
// Unidades: metros. y = altura desde el suelo, z = anterior, x = izquierda del sujeto.
// La plantilla femenina se obtiene mediante una deformación suave (ver warp.js) y estructuras propias.

import { add3, sub3, scale3, normalize, madd, cross3 } from './geom.js';

// ---------------- Columna vertebral ----------------
// [nombre, y del centro del cuerpo vertebral, z del centro, tipo]
export const VERTEBRAE = [
  ['C1', 1.578, -0.012, 'C'], ['C2', 1.558, -0.010, 'C'], ['C3', 1.539, -0.010, 'C'], ['C4', 1.521, -0.012, 'C'],
  ['C5', 1.503, -0.016, 'C'], ['C6', 1.485, -0.022, 'C'], ['C7', 1.466, -0.030, 'C'],
  ['T1', 1.444, -0.040, 'T'], ['T2', 1.420, -0.050, 'T'], ['T3', 1.395, -0.058, 'T'], ['T4', 1.370, -0.064, 'T'],
  ['T5', 1.344, -0.068, 'T'], ['T6', 1.318, -0.070, 'T'], ['T7', 1.291, -0.070, 'T'], ['T8', 1.264, -0.068, 'T'],
  ['T9', 1.236, -0.065, 'T'], ['T10', 1.207, -0.061, 'T'], ['T11', 1.177, -0.056, 'T'], ['T12', 1.146, -0.050, 'T'],
  ['L1', 1.112, -0.043, 'L'], ['L2', 1.076, -0.036, 'L'], ['L3', 1.040, -0.031, 'L'], ['L4', 1.004, -0.031, 'L'],
  ['L5', 0.969, -0.036, 'L'],
];
export const V = Object.fromEntries(VERTEBRAE.map(v => [v[0], { y: v[1], z: v[2], t: v[3] }]));

// Dimensiones del cuerpo vertebral y del conducto en función de la posición en la columna.
export function vertDims(name) {
  const i = VERTEBRAE.findIndex(v => v[0] === name);
  const t = VERTEBRAE[i][3];
  if (t === 'C') {
    const k = (i) / 6; // 0..1
    return { rx: 0.0085 + 0.002 * k, rz: 0.0075 + 0.001 * k, hh: 0.0052 + 0.0006 * k, rf: 0.0078, t };
  }
  if (t === 'T') {
    const k = (i - 7) / 11;
    return { rx: 0.0115 + 0.007 * k, rz: 0.0105 + 0.0055 * k, hh: 0.0075 + 0.0035 * k, rf: 0.0063 + 0.0004 * k, t };
  }
  const k = (i - 19) / 4;
  return { rx: 0.0205 + 0.0035 * k, rz: 0.0155 + 0.001 * k, hh: 0.0118 + 0.0006 * k, rf: 0.0078 + 0.0007 * k, t };
}

// z del centro del conducto vertebral para cada vértebra
export function canalOf(name) {
  const v = V[name], d = vertDims(name);
  return v.z - d.rz - d.rf * 0.92;
}

// Interpolación de la curva espinal (cuerpos) para cualquier y
export function spineZ(y) {
  const L = VERTEBRAE;
  if (y >= L[0][1]) return L[0][2];
  for (let i = 0; i < L.length - 1; i++) {
    if (y <= L[i][1] && y >= L[i + 1][1]) {
      const t = (L[i][1] - y) / (L[i][1] - L[i + 1][1]);
      return L[i][2] + (L[i + 1][2] - L[i][2]) * t;
    }
  }
  return L[L.length - 1][2];
}
export function canalZ(y) {
  const L = VERTEBRAE;
  if (y >= L[0][1]) return canalOf('C1');
  for (let i = 0; i < L.length - 1; i++) {
    if (y <= L[i][1] && y >= L[i + 1][1]) {
      const t = (L[i][1] - y) / (L[i][1] - L[i + 1][1]);
      return canalOf(L[i][0]) + (canalOf(L[i + 1][0]) - canalOf(L[i][0])) * t;
    }
  }
  return canalOf('L5');
}

// Sacro y cóccix
export const SACRUM = { base: [0, 0.948, -0.048], apex: [0, 0.858, -0.098], coccyxTip: [0, 0.836, -0.088] };

// ---------------- Cabeza ----------------
export const HEAD = {
  cranium: { c: [0, 1.664, -0.012], r: [0.0735, 0.083, 0.097] },
  eye: [0.032, 1.645, 0.071],
  eyeR: 0.0122,
  nasion: [0, 1.656, 0.089],
  chin: [0, 1.528, 0.084],
  occlusal: 1.556,
};

// ---------------- Miembro superior (izquierdo; x > 0) ----------------
const shoulder = [0.183, 1.402, -0.022];
const elbow = [0.226, 1.076, -0.022];
const wrist = [0.288, 0.838, -0.008];
const armDir = normalize(sub3(elbow, shoulder));
const foreDir = normalize(sub3(wrist, elbow));
function latOf(d) { const l = normalize([-d[1], d[0], 0]); return l[0] < 0 ? scale3(l, -1) : l; }
export const ARM = {
  shoulder, elbow, wrist, armDir, foreDir,
  armLat: latOf(armDir),
  foreLat: latOf(foreDir),
  humHead: shoulder,
  humHeadR: 0.0235,
};

// Mano en supinación: palma hacia +z, pulgar lateral.
export function handFrame() {
  const d = ARM.foreDir, l = ARM.foreLat;
  const n = normalize(cross3(l, d)); // aprox. +z (anterior/palmar)
  const pal = n[2] < 0 ? scale3(n, -1) : n;
  return { o: ARM.wrist, d, l, n: pal };
}
// Punto en coordenadas de la mano: a lo largo (d), lateral (l), palmar (n)
export function handPt(along, lat, palm = 0) {
  const { o, d, l, n } = handFrame();
  return add3(add3(madd(o, d, along), scale3(l, lat)), scale3(n, palm));
}

// Dedos: [lateral en MCP, longitud metacarpo, falanges...], de pulgar (1) a meñique (5)
export const FINGERS = [
  { lat: 0.019, mc: 0.044, ph: [0.031, 0.024], base: 0.03, spread: 0.55, palm: 0.012 },
  { lat: 0.0135, mc: 0.066, ph: [0.040, 0.024, 0.017], base: 0.034, spread: 0.06, palm: 0 },
  { lat: 0.0035, mc: 0.063, ph: [0.045, 0.028, 0.018], base: 0.034, spread: 0.0, palm: 0 },
  { lat: -0.0065, mc: 0.057, ph: [0.042, 0.027, 0.018], base: 0.034, spread: -0.05, palm: 0 },
  { lat: -0.0160, mc: 0.053, ph: [0.033, 0.020, 0.016], base: 0.033, spread: -0.11, palm: 0 },
];
export function fingerJoints(i) {
  // Devuelve la lista de puntos articulares (base del metacarpo, MCP, IF..., punta)
  const F = FINGERS[i];
  const { d, l, n } = handFrame();
  let dir = normalize(add3(d, scale3(l, F.spread)));
  if (i === 0) dir = normalize(add3(add3(scale3(d, 0.85), scale3(l, 0.33)), scale3(n, 0.42)));
  const base = handPt(F.base, F.lat * (i === 0 ? 0.9 : 0.92), F.palm * 0.5);
  const pts = [base];
  let p = madd(base, dir, F.mc);
  pts.push(p);
  for (const L of F.ph) { p = madd(p, dir, L + 0.002); pts.push(p); }
  return pts;
}

// ---------------- Pelvis y miembro inferior (izquierdo) ----------------
export const LEG = {
  hip: [0.088, 0.925, 0.004],       // centro de la cabeza femoral
  headR: 0.0235,
  troch: [0.152, 0.913, -0.012],
  kneeF: [0.094, 0.512, -0.006],    // centro de los cóndilos femorales
  knee: [0.093, 0.495, -0.006],
  ankle: [0.089, 0.083, -0.012],
};

export const PELVIS = {
  asis: [0.117, 0.972, 0.066],
  crestTop: [0.143, 1.022, -0.014],
  psis: [0.044, 0.982, -0.084],
  pubicTubercle: [0.022, 0.882, 0.078],
  symphysis: [0, 0.877, 0.074],
  ischialTub: [0.064, 0.842, -0.030],
};

// ---------------- Tórax ----------------
export const STERNUM = { notch: [0, 1.414, 0.058], angle: [0, 1.369, 0.075], xiphJoint: [0, 1.257, 0.098], xiphTip: [0, 1.218, 0.094] };

// Puntos de inserción esternal de los cartílagos costales (1..7)
export const STERNAL_ATT = [1.402, 1.369, 1.345, 1.320, 1.296, 1.272, 1.258];

// Diafragma: altura de la cúpula en (x, z)
export function diaphragmY(x, z) {
  const right = x < 0;
  const ax = right ? -0.06 : 0.06;
  const apex = right ? 1.228 : 1.214;
  const dx = x - ax, dz = z - 0.0;
  // centro tendinoso más plano y descenso hacia los recesos costofrénicos
  let y = apex - 5.2 * (dx * dx) - 5.5 * dz * dz;
  // posteriormente desciende más
  if (z < -0.02) y -= 2.5 * (z + 0.02) * (z + 0.02);
  // zona central (pericardio) un poco más baja
  y -= 0.008 * Math.exp(-((x * x) / 0.0012));
  return y;
}

// Contorno interno de la caja torácica: centro z, semiejes x (lateral) y z, por altura.
const THX = [
  // y, cz, rx, rz
  [1.44, -0.010, 0.045, 0.040],
  [1.41, -0.008, 0.075, 0.055],
  [1.37, -0.006, 0.100, 0.070],
  [1.32, -0.004, 0.118, 0.082],
  [1.26, -0.003, 0.127, 0.088],
  [1.20, -0.002, 0.129, 0.088],
  [1.14, -0.003, 0.124, 0.084],
  [1.08, -0.004, 0.115, 0.078],
];
export function thoraxAt(y) {
  if (y >= THX[0][0]) return { cz: THX[0][1], rx: THX[0][2], rz: THX[0][3] };
  for (let i = 0; i < THX.length - 1; i++) {
    if (y <= THX[i][0] && y >= THX[i + 1][0]) {
      const t = (THX[i][0] - y) / (THX[i][0] - THX[i + 1][0]);
      const s = t * t * (3 - 2 * t);
      const L = (k) => THX[i][k] + (THX[i + 1][k] - THX[i][k]) * s;
      return { cz: L(1), rx: L(2), rz: L(3) };
    }
  }
  const e = THX[THX.length - 1];
  return { cz: e[1], rx: e[2], rz: e[3] };
}
// SDF aproximado del interior torácico (negativo dentro)
export function thoraxInterior(inset = 0) {
  const f = (x, y, z) => {
    const t = thoraxAt(y);
    const rx = t.rx - inset, rz = t.rz - inset;
    // la columna hace relieve dentro del tórax
    const k = Math.sqrt((x / rx) ** 2 + ((z - t.cz) / rz) ** 2);
    let d = (k - 1) * Math.min(rx, rz);
    const top = 1.455 - inset * 0.5;
    if (y > top) d = Math.max(d, y - top);
    return d;
  };
  f.b = [-0.14, 1.0, -0.11, 0.14, 1.47, 0.11];
  return f;
}
export { shoulder, elbow, wrist };
