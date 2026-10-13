// Sistema muscular. Los músculos superficiales se modelan como láminas bajo la piel definidas por
// polígonos sobre mapas cilíndricos "desenrollados" de cada segmento corporal (tronco, brazo, antebrazo,
// muslo, pierna). Los músculos profundos se modelan con primitivas.
import { ellipsoid, roundCone, chain, capsule, sphere, torus, sunion, union, inter, shell, sub, poly2d, basisFromY, basisEuler, smax, fan } from './sdf.js';
import { skinSDF } from './skin.js';
import { ARM, LEG, thoraxInterior, HEAD } from './anat.js';
import { normalize, sub3, dot3, cross3, add3, madd, scale3 } from './geom.js';

const SYS = 'muscular';
const RED = ['#b4443d', '#a63c36', '#bf4d45', '#ad4038'];
const TENDON = '#e3d6bf';
let colorIdx = 0;
const nextColor = () => RED[(colorIdx++) % RED.length];

// Mapa cilíndrico: eje A->B, referencia angular ref (θ = 0), lateral lat (θ > 0), radio de referencia R
function cylMap(A, B, ref, lat, R) {
  const ax = normalize(sub3(B, A));
  const L = Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]);
  let r0 = sub3(ref, scale3(ax, dot3(ref, ax)));
  r0 = normalize(r0);
  let l0 = sub3(lat, scale3(ax, dot3(lat, ax)));
  l0 = sub3(l0, scale3(r0, dot3(l0, r0)));
  l0 = normalize(l0);
  return {
    A, ax, L, R, r0, l0,
    map(x, y, z, out) {
      const px = x - A[0], py = y - A[1], pz = z - A[2];
      const u = px * ax[0] + py * ax[1] + pz * ax[2];
      const qx = px - ax[0] * u, qy = py - ax[1] * u, qz = pz - ax[2] * u;
      const c = qx * r0[0] + qy * r0[1] + qz * r0[2];
      const s = qx * l0[0] + qy * l0[1] + qz * l0[2];
      out[0] = Math.atan2(s, c) * R;
      out[1] = u;
      out[2] = Math.hypot(qx, qy, qz);
      return out;
    },
    toWorld(s, u, rho) {
      const th = s / R;
      const d = add3(scale3(r0, Math.cos(th)), scale3(l0, Math.sin(th)));
      return add3(madd(A, ax, u), scale3(d, rho));
    },
  };
}

function smoothstep(e0, e1, x) { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); }

// Lámina muscular bajo la piel delimitada por uno o varios polígonos en el mapa.
function surfMuscle(skin, M, polys, o = {}) {
  const d0 = o.depth ?? 0.0012;
  const tMax = o.thick ?? 0.009, tMin = o.thin ?? 0.0018, w = o.ramp ?? 0.018;
  const P = polys.map(p => poly2d(p));
  const X = (o.exclude || []).map(p => poly2d(p));
  const groove = o.groove; // [[u, ancho, profundidad]]
  const margin = o.margin ?? 0.006;
  const make = (sk0) => {
    const tmp = [0, 0, 0];
    return (x, y, z) => {
      M.map(x, y, z, tmp);
      const s = tmp[0], u = tmp[1];
      let dp = 1e9;
      for (let i = 0; i < P.length; i++) { const e = P[i](s, u); if (e < dp) dp = e; }
      for (let i = 0; i < X.length; i++) { const e = -X[i](s, u); if (e > dp) dp = e; }
      if (o.maxRho && tmp[2] > o.maxRho) dp = Math.max(dp, tmp[2] - o.maxRho);
      if (dp > margin) return dp;
      const sk = sk0(x, y, z);
      let t = tMin + (tMax - tMin) * smoothstep(0, w, -dp);
      if (groove) for (const [gu, gw, gd] of groove) { const k = Math.abs(u - gu) / gw; if (k < 1) t -= gd * (1 - k * k); }
      const outer = sk + d0, inner = -(sk + d0 + t);
      return Math.max(outer, inner, dp);
    };
  };
  const f = make(skin);
  f.sp = (cx, cy, cz, r) => make(skin.sp ? skin.sp(cx, cy, cz, r + 0.03) : skin);
  // caja envolvente por muestreo del mapa
  const b = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9];
  for (const poly of polys) {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], c = poly[(i + 1) % poly.length];
      for (let k = 0; k <= 6; k++) {
        const s = a[0] + (c[0] - a[0]) * k / 6, u = a[1] + (c[1] - a[1]) * k / 6;
        for (const rho of [0.25 * M.R, M.R, 1.5 * M.R, 2.0 * M.R]) {
          const p = M.toWorld(s, u, rho);
          for (let j = 0; j < 3; j++) { b[j] = Math.min(b[j], p[j]); b[j + 3] = Math.max(b[j + 3], p[j]); }
        }
      }
    }
  }
  for (let j = 0; j < 3; j++) { b[j] = Math.max(b[j] - 0.01, skin.b[j]); b[j + 3] = Math.min(b[j + 3] + 0.01, skin.b[j + 3]); }
  f.b = b;
  return f;
}

// Línea gruesa en el mapa (para músculos en cinta como el sartorio)
function strap(pts, halfW) {
  const left = [], right = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], c = pts[Math.min(pts.length - 1, i + 1)];
    const dx = c[0] - a[0], dy = c[1] - a[1], l = Math.hypot(dx, dy) || 1;
    const nx = -dy / l, ny = dx / l;
    const hw = typeof halfW === 'function' ? halfW(i / (pts.length - 1)) : halfW;
    left.push([pts[i][0] + nx * hw, pts[i][1] + ny * hw]);
    right.push([pts[i][0] - nx * hw, pts[i][1] - ny * hw]);
  }
  return [...left, ...right.reverse()];
}

// Recorta una forma para que quede dentro de la piel
function clipSkin(f, skin, inset = 0.0015) {
  const make = (sk) => (x, y, z) => { const d = f(x, y, z); if (d > 0.004) return d; return Math.max(d, sk(x, y, z) + inset); };
  const g = make(skin);
  g.b = f.b;
  g.sp = (cx, cy, cz, r) => make(skin.sp ? skin.sp(cx, cy, cz, r + 0.02) : skin);
  return g;
}

export function buildMuscles(R) {
  const skin = skinSDF(R.sex, { noBreasts: true, noGenitals: true });
  const H = 0.0035;
  const add = (id, f, h = H, o = {}) => R.bi(id, SYS, f, h, { color: o.color || nextColor(), label: o.label });

  // ---------------- Mapas ----------------
  const ZP = [0, 0, 1], ZN = [0, 0, -1], XP = [1, 0, 0];
  const T = cylMap([0, 0.8, -0.005], [0, 1.6, -0.005], ZP, XP, 0.15);       // tronco (θ = 0 anterior)
  const Arm = cylMap([0.196, 1.4, -0.02], ARM.elbow, ZP, ARM.armLat, 0.042);
  const ArmP = cylMap([0.196, 1.4, -0.02], ARM.elbow, ZN, ARM.armLat, 0.042);
  const Fo = cylMap(ARM.elbow, ARM.wrist, ZP, ARM.foreLat, 0.034);
  const FoP = cylMap(ARM.elbow, ARM.wrist, ZN, ARM.foreLat, 0.034);
  const Th = cylMap([0.095, 0.9, -0.005], [0.094, 0.5, 0.0], ZP, XP, 0.07);
  const ThP = cylMap([0.095, 0.9, -0.005], [0.094, 0.5, 0.0], ZN, XP, 0.07);
  const Lg = cylMap([0.094, 0.49, -0.006], [0.09, 0.09, -0.012], ZP, XP, 0.042);
  const LgP = cylMap([0.094, 0.49, -0.006], [0.09, 0.09, -0.012], ZN, XP, 0.042);

  // ---------------- Tronco anterior ----------------
  const pect = [[0.012, 0.615], [0.06, 0.625], [0.13, 0.63], [0.185, 0.612], [0.205, 0.585], [0.19, 0.555], [0.15, 0.495], [0.1, 0.447], [0.045, 0.44], [0.012, 0.455]];
  add('pectoral-mayor', surfMuscle(skin, T, [pect], { thick: 0.013, maxRho: 0.25 }));
  const rectus = [[0.006, 0.075], [0.028, 0.075], [0.058, 0.2], [0.072, 0.33], [0.08, 0.438], [0.045, 0.436], [0.006, 0.44]];
  add('recto-abdomen', surfMuscle(skin, T, [rectus], { thick: 0.01, groove: [[0.255, 0.006, 0.006], [0.325, 0.006, 0.006], [0.39, 0.006, 0.006]] }));
  const serr = [[0.245, 0.6], [0.205, 0.585], [0.218, 0.56], [0.19, 0.535], [0.208, 0.512], [0.185, 0.488], [0.203, 0.466], [0.19, 0.442], [0.235, 0.448], [0.29, 0.47], [0.3, 0.55], [0.282, 0.6]];
  add('serrato-anterior', surfMuscle(skin, T, [serr], { thick: 0.007, maxRho: 0.22 }));
  const obl = [[0.082, 0.432], [0.14, 0.44], [0.19, 0.442], [0.203, 0.466], [0.185, 0.488], [0.208, 0.512], [0.236, 0.446], [0.29, 0.468], [0.3, 0.33], [0.28, 0.21], [0.2, 0.17], [0.13, 0.118], [0.085, 0.09], [0.074, 0.2], [0.07, 0.33]];
  add('oblicuo-externo', surfMuscle(skin, T, [obl], { thick: 0.008, exclude: [rectus, serr], maxRho: 0.22 }));

  // ---------------- Tronco posterior ----------------
  const trap = [[0.471, 0.345], [0.42, 0.44], [0.37, 0.53], [0.33, 0.585], [0.27, 0.615], [0.245, 0.64], [0.255, 0.66], [0.32, 0.665], [0.375, 0.7], [0.405, 0.775], [0.471, 0.795]];
  add('musculo-trapecio', surfMuscle(skin, T, [trap], { thick: 0.011, ramp: 0.03, maxRho: 0.24 }));
  const lat = [[0.471, 0.33], [0.418, 0.43], [0.367, 0.518], [0.326, 0.57], [0.3, 0.585], [0.278, 0.585], [0.258, 0.555], [0.262, 0.45], [0.29, 0.28], [0.34, 0.2], [0.42, 0.172], [0.471, 0.172]];
  add('dorsal-ancho', surfMuscle(skin, T, [lat], { thick: 0.009, exclude: [trap], maxRho: 0.24 }));
  const infra = [[0.37, 0.535], [0.335, 0.583], [0.3, 0.585], [0.312, 0.55], [0.34, 0.52]];
  add('infraespinoso', surfMuscle(skin, T, [infra], { thick: 0.01, exclude: [trap], maxRho: 0.22 }));
  const teres = [[0.34, 0.52], [0.31, 0.548], [0.298, 0.585], [0.28, 0.578], [0.3, 0.535], [0.325, 0.515]];
  add('redondo-mayor', surfMuscle(skin, T, [teres], { thick: 0.01, exclude: [trap, lat, infra], maxRho: 0.22 }));
  // erector de la columna (profundo, bajo el dorsal ancho y el trapecio)
  const erector = [[0.471, 0.15], [0.418, 0.15], [0.405, 0.3], [0.41, 0.45], [0.425, 0.62], [0.471, 0.66]];
  add('erector-columna', surfMuscle(skin, T, [erector], { depth: 0.011, thick: 0.02, ramp: 0.02 }));
  const gmax = [[0.471, 0.185], [0.4, 0.195], [0.335, 0.165], [0.3, 0.1], [0.305, 0.045], [0.37, 0.02], [0.44, 0.028], [0.471, 0.06]];
  add('gluteo-mayor', surfMuscle(skin, T, [gmax], { thick: 0.022, ramp: 0.04 }));
  const gmed = [[0.3, 0.1], [0.335, 0.165], [0.4, 0.195], [0.395, 0.215], [0.32, 0.225], [0.265, 0.19], [0.255, 0.13], [0.27, 0.1]];
  add('gluteo-medio', surfMuscle(skin, T, [gmed], { thick: 0.014 }));

  // ---------------- Cuello y cabeza ----------------
  add('esternocleidomastoideo', clipSkin(sunion(0.01, roundCone([0.052, 1.592, -0.028], [0.03, 1.5, 0.02], 0.0085, 0.0095), roundCone([0.03, 1.5, 0.02], [0.02, 1.425, 0.058], 0.0095, 0.0068), roundCone([0.03, 1.48, 0.03], [0.045, 1.43, 0.055], 0.006, 0.006)), skin), 0.0022);
  const headShell = (region, d0 = 0.001, t = 0.004) => {
    const make = (sk) => (x, y, z) => { const r = region(x, y, z); if (r > 0.004) return r; const s = sk(x, y, z); return Math.max(r, s + d0, -(s + d0 + t)); };
    const f = make(skin);
    f.b = region.b;
    f.sp = (cx, cy, cz, r) => make(skin.sp(cx, cy, cz, r + 0.02));
    return f;
  };
  add('musculo-temporal', headShell(ellipsoid([0.074, 1.668, -0.002], [0.025, 0.045, 0.05]), 0.0012, 0.006), 0.0022);
  add('masetero', clipSkin(ellipsoid([0.053, 1.578, 0.022], [0.0115, 0.027, 0.0155], basisEuler(0.25, 0, 0)), skin, 0.002), 0.0018);
  const frontalis = (() => { const e = ellipsoid([0.028, 1.708, 0.07], [0.034, 0.04, 0.05]); const f = (x, y, z) => Math.max(e(x, y, z), 0.0 - x * 50 > 0 ? 0.01 : -1); f.b = e.b; return f; })();
  add('occipitofrontal', headShell(frontalis, 0.0008, 0.0025), 0.002);
  const eye = HEAD.eye;
  add('orbicular-ojo', clipSkin(torus([eye[0], eye[1], eye[2] + 0.017], 0.0145, 0.0035, basisEuler(Math.PI / 2, 0, 0)), skin, 0.001), 0.0012);
  R.sdf('orbicular-boca', SYS, clipSkin(torus([0, 1.562, 0.088], 0.0135, 0.0042, basisEuler(Math.PI / 2 - 0.15, 0, 0)), skin, 0.001), 0.0012, { color: nextColor() });

  // ---------------- Miembro superior ----------------
  const delt = [[-0.04, -0.035], [0.02, -0.07], [0.09, -0.06], [0.135, -0.01], [0.128, 0.06], [0.078, 0.125], [0.064, 0.13], [0.03, 0.085], [-0.025, 0.035]];
  add('deltoides', surfMuscle(skin, Arm, [delt], { thick: 0.016, ramp: 0.03, maxRho: 0.09 }));
  const bic = [[-0.012, 0.085], [0.014, 0.085], [0.027, 0.17], [0.021, 0.27], [0.004, 0.315], [-0.012, 0.305], [-0.026, 0.2]];
  add('biceps-braquial', surfMuscle(skin, Arm, [bic], { thick: 0.02, ramp: 0.025, exclude: [delt], maxRho: 0.08 }));
  add('braquial', surfMuscle(skin, Arm, [[[0.027, 0.17], [0.048, 0.19], [0.05, 0.29], [0.022, 0.305], [0.021, 0.27]], [[-0.026, 0.2], [-0.05, 0.22], [-0.042, 0.3], [-0.012, 0.31]]], { thick: 0.01, exclude: [bic], maxRho: 0.08 }));
  const tri = [[-0.06, 0.09], [0.055, 0.1], [0.06, 0.25], [0.035, 0.315], [-0.03, 0.315], [-0.058, 0.24]];
  add('triceps-braquial', surfMuscle(skin, ArmP, [tri], { thick: 0.016, ramp: 0.03, maxRho: 0.08 }));
  const brr = [[0.026, -0.075], [0.055, -0.065], [0.058, 0.05], [0.042, 0.15], [0.03, 0.235], [0.021, 0.235], [0.02, 0.08], [0.016, 0.0]];
  add('braquiorradial', surfMuscle(skin, Fo, [brr], { thick: 0.012, maxRho: 0.07 }));
  add('flexores-antebrazo', surfMuscle(skin, Fo, [[[-0.088, 0.0], [-0.04, -0.012], [0.015, -0.005], [0.02, 0.06], [0.014, 0.17], [0.0, 0.225], [-0.035, 0.21], [-0.075, 0.13]]], { thick: 0.012, exclude: [brr], maxRho: 0.06 }));
  add('extensores-antebrazo', surfMuscle(skin, FoP, [[[-0.02, -0.005], [0.03, -0.03], [0.06, 0.02], [0.055, 0.12], [0.035, 0.205], [0.0, 0.215], [-0.022, 0.15]]], { thick: 0.011, maxRho: 0.06 }));

  // ---------------- Miembro inferior ----------------
  const sart = strap([[0.03, -0.075], [0.012, 0.03], [-0.03, 0.15], [-0.075, 0.27], [-0.11, 0.38], [-0.118, 0.44]], 0.011);
  add('sartorio', surfMuscle(skin, Th, [sart], { thick: 0.008, ramp: 0.008, maxRho: 0.13 }));
  const rf = [[-0.012, 0.03], [0.014, 0.03], [0.031, 0.16], [0.022, 0.3], [0.008, 0.37], [-0.008, 0.37], [-0.02, 0.3], [-0.026, 0.16]];
  add('recto-femoral', surfMuscle(skin, Th, [rf], { thick: 0.02, ramp: 0.03, exclude: [sart], maxRho: 0.13 }));
  add('vasto-lateral', surfMuscle(skin, Th, [[[0.03, 0.06], [0.1, 0.05], [0.118, 0.2], [0.095, 0.33], [0.035, 0.385], [0.022, 0.33], [0.033, 0.16]]], { thick: 0.018, ramp: 0.03, exclude: [rf], maxRho: 0.13 }));
  add('vasto-medial', surfMuscle(skin, Th, [[[-0.02, 0.19], [-0.062, 0.22], [-0.075, 0.32], [-0.05, 0.385], [-0.012, 0.388], [-0.02, 0.3]]], { thick: 0.016, exclude: [rf, sart], maxRho: 0.13 }));
  add('tensor-fascia-lata', surfMuscle(skin, Th, [[[0.04, -0.07], [0.075, -0.075], [0.1, 0.09], [0.08, 0.11], [0.05, 0.02]]], { thick: 0.01, exclude: [sart], maxRho: 0.13 }));
  add('aductores', surfMuscle(skin, Th, [[[-0.025, 0.0], [-0.17, 0.02], [-0.19, 0.14], [-0.15, 0.27], [-0.09, 0.27], [-0.04, 0.12]]], { thick: 0.016, exclude: [sart, rf], maxRho: 0.13 }));
  const bf = [[0.004, 0.08], [0.045, 0.065], [0.075, 0.2], [0.085, 0.33], [0.075, 0.415], [0.055, 0.415], [0.035, 0.3], [0.008, 0.2]];
  add('biceps-femoral', surfMuscle(skin, ThP, [bf], { thick: 0.016, maxRho: 0.13 }));
  const st = [[-0.003, 0.07], [-0.042, 0.08], [-0.052, 0.2], [-0.042, 0.33], [-0.02, 0.365], [-0.002, 0.25]];
  add('semitendinoso', surfMuscle(skin, ThP, [st], { thick: 0.014, maxRho: 0.13 }));
  add('semimembranoso', surfMuscle(skin, ThP, [[[-0.047, 0.15], [-0.088, 0.17], [-0.098, 0.3], [-0.072, 0.4], [-0.044, 0.385], [-0.05, 0.25]]], { thick: 0.012, exclude: [st], maxRho: 0.13 }));
  const ta = [[0.006, 0.05], [0.035, 0.04], [0.046, 0.15], [0.032, 0.3], [0.014, 0.37], [0.004, 0.3]];
  add('tibial-anterior', surfMuscle(skin, Lg, [ta], { thick: 0.013, maxRho: 0.08 }));
  add('peroneo-largo', surfMuscle(skin, Lg, [[[0.052, 0.03], [0.078, 0.02], [0.088, 0.15], [0.074, 0.3], [0.058, 0.3], [0.05, 0.15]]], { thick: 0.01, maxRho: 0.08 }));
  const gas = [[[-0.004, 0.02], [-0.05, 0.03], [-0.06, 0.15], [-0.035, 0.25], [-0.006, 0.24]], [[0.004, 0.02], [0.048, 0.03], [0.055, 0.13], [0.035, 0.21], [0.006, 0.215]]];
  add('gastrocnemio', surfMuscle(skin, LgP, gas, { thick: 0.022, ramp: 0.03, maxRho: 0.08 }));
  add('soleo', surfMuscle(skin, LgP, [[[-0.075, 0.12], [0.07, 0.12], [0.065, 0.3], [0.02, 0.34], [-0.02, 0.34], [-0.07, 0.3]]], { thick: 0.012, exclude: gas, maxRho: 0.08 }));
  add('tendon-calcaneo', surfMuscle(skin, LgP, [[[-0.011, 0.27], [0.011, 0.27], [0.009, 0.415], [-0.009, 0.415]]], { thick: 0.006, thin: 0.004, ramp: 0.004, maxRho: 0.08 }), H, { color: TENDON });

  // ---------------- Profundos ----------------
  const psoas = sunion(0.012,
    chain([[0.026, 1.13, -0.035], [0.04, 1.04, -0.022], [0.052, 0.97, -0.012], [0.072, 0.915, 0.035], [0.1, 0.875, 0.02], [0.124, 0.858, -0.008]], [0.008, 0.016, 0.02, 0.016, 0.012, 0.007], 0.01),
    fan([0.075, 0.93, 0.02], [[0.105, 0.965, 0.055], [0.125, 0.995, 0.03], [0.13, 1.008, -0.005], [0.11, 1.003, -0.04], [0.075, 0.985, -0.06]], 0.005, 0.01),
  );
  add('iliopsoas', psoas, 0.003);
  add('cuadrado-lumbar', sunion(0.01, ellipsoid([0.05, 1.075, -0.06], [0.022, 0.06, 0.009], basisEuler(0, 0, -0.1))), 0.0028);

  // Intercostales (pared torácica)
  const thx = thoraxInterior(-0.007);
  const icRegion = (x, y, z) => Math.max(1.125 + 0.55 * z - y, y - 1.44, 0.016 - Math.abs(x) - (z < 0.04 ? 1 : 0));
  const ic = (x, y, z) => { const r = icRegion(x, y, z); if (r > 0.005) return r; return Math.max(Math.abs(thx(x, y, z)) - 0.0016, r); };
  ic.b = [-0.16, 1.03, -0.12, 0.16, 1.46, 0.12];
  R.sdf('intercostales', SYS, ic, 0.003, { color: '#9c3a34' });

  // Suelo pélvico (elevador del ano)
  const bowl = ellipsoid([0, 0.905, -0.012], [0.05, 0.05, 0.062]);
  const pf = (x, y, z) => Math.max(Math.abs(bowl(x, y, z)) - 0.0022, y - 0.888, Math.hypot(x, z + 0.04) < 0.008 ? 0.008 - Math.hypot(x, z + 0.04) : -1);
  pf.b = [-0.06, 0.84, -0.08, 0.06, 0.9, 0.06];
  R.sdf('suelo-pelvico', SYS, pf, 0.0022, { color: '#a5463f' });

  void union; void inter; void shell; void sub; void capsule; void sphere; void LEG; void basisFromY; void smax; void cross3; void ArmP;
}
