// Deformación de la plantilla masculina a proporciones femeninas medias (estatura 1,63 m):
// hombros y tórax más estrechos, cintura más fina, pelvis y caderas más anchas.
// Se aplica a todas las mallas para que órganos, huesos y piel mantengan sus relaciones.

const S = 1.63 / 1.75;
// Factores laterales (x) y anteroposteriores (z) según la altura en la plantilla
const FX = [
  [0.00, 0.99], [0.45, 0.99], [0.60, 1.04], [0.78, 1.07], [0.90, 1.09], [0.98, 1.07], [1.05, 0.98],
  [1.12, 0.93], [1.22, 0.94], [1.34, 0.94], [1.42, 0.92], [1.48, 0.95], [1.80, 0.96],
];
const FZ = [
  [0.00, 0.98], [0.70, 1.0], [0.90, 1.03], [1.05, 0.97], [1.15, 0.95], [1.35, 0.96], [1.50, 0.96], [1.80, 0.97],
];
function interp(T, y) {
  if (y <= T[0][0]) return [T[0][1], 0];
  for (let i = 0; i < T.length - 1; i++) {
    const [y0, a] = T[i], [y1, b] = T[i + 1];
    if (y <= y1) {
      const t = (y - y0) / (y1 - y0);
      const s = t * t * (3 - 2 * t);
      const ds = 6 * t * (1 - t) / (y1 - y0);
      return [a + (b - a) * s, (b - a) * ds];
    }
  }
  return [T[T.length - 1][1], 0];
}

export function warpPoint(x, y, z) {
  const [fx] = interp(FX, y), [fz] = interp(FZ, y);
  return [S * x * fx, S * y, S * z * fz];
}

export function warpGeom(g) {
  const { pos, nor } = g;
  for (let i = 0; i < pos.length; i += 3) {
    const x = pos[i], y = pos[i + 1], z = pos[i + 2];
    const [fx, dfx] = interp(FX, y), [fz, dfz] = interp(FZ, y);
    // Jacobiano J (sin el factor S, que no altera la dirección normal)
    // [fx, x dfx, 0; 0, 1, 0; 0, z dfz, fz]  ->  normal' = J^{-T} n
    const nx = nor[i], ny = nor[i + 1], nz = nor[i + 2];
    const ax = nx / fx, az = nz / fz;
    const ay = ny - (x * dfx) * ax - (z * dfz) * az;
    const l = Math.hypot(ax, ay, az) || 1;
    nor[i] = ax / l; nor[i + 1] = ay / l; nor[i + 2] = az / l;
    pos[i] = S * x * fx; pos[i + 1] = S * y; pos[i + 2] = S * z * fz;
  }
  return g;
}
export const FEMALE_SCALE = S;
