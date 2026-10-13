// Registro de piezas anatómicas. Cada pieza se genera de forma diferida (thunk) para poder informar el progreso.
import { meshSDF } from './mesher.js';
import { mirrorX } from './sdf.js';

export class Registry {
  constructor(sex) {
    this.sex = sex;
    this.items = [];
    this.keys = new Set();
  }
  _key(id, side, n) {
    let k = id + (side ? '_' + side : '') + (n ? '_' + n : '');
    let i = 2;
    while (this.keys.has(k)) k = id + (side ? '_' + side : '') + '_' + (i++);
    this.keys.add(k);
    return k;
  }
  // Pieza definida por un SDF
  sdf(id, sys, f, h, o = {}) {
    const key = this._key(id, o.side, o.n);
    const b = f.b;
    const est = 2 * ((b[3] - b[0]) * (b[4] - b[1]) + (b[4] - b[1]) * (b[5] - b[2]) + (b[3] - b[0]) * (b[5] - b[2])) / (h * h);
    this.items.push({ key, id, sys, side: o.side || null, label: o.label || null, color: o.color, make: () => meshSDF(f, h, o), weight: o.weight || 1, est: o.est || est, unit: key });
    return key;
  }
  // Pieza definida por geometría directa (o función que la devuelve)
  geom(id, sys, g, o = {}) {
    const key = this._key(id, o.side, o.n);
    this.items.push({ key, id, sys, side: o.side || null, label: o.label || null, color: o.color, make: typeof g === 'function' ? g : () => g, weight: o.weight || 0.2, est: o.est || 3000, unit: key });
    return key;
  }
  // Pieza bilateral: f describe el lado izquierdo (x > 0); el derecho se obtiene por simetría.
  bi(id, sys, f, h, o = {}) {
    const kl = this.sdf(id, sys, f, h, { ...o, side: 'L' });
    const left = this.items[this.items.length - 1];
    const key = this._key(id, 'R', o.n);
    this.items.push({ key, id, sys, side: 'R', label: o.labelR || o.label || null, color: o.color, mirrorOf: kl, weight: 0.05, est: 0, unit: kl });
    void left;
    return [kl, key];
  }
  biGeom(id, sys, g, o = {}) {
    const kl = this.geom(id, sys, g, { ...o, side: 'L' });
    const key = this._key(id, 'R', o.n);
    this.items.push({ key, id, sys, side: 'R', label: o.labelR || o.label || null, color: o.color, mirrorOf: kl, weight: 0.02, est: 0, unit: kl });
    return [kl, key];
  }
  // Grupo: una sola malla dividida en varias piezas. defs: [{id, side, label, color}], make() -> [geom...]
  group(sys, defs, make, o = {}) {
    let cache = null;
    const get = () => (cache ||= make());
    let unit = null;
    defs.forEach((d, i) => {
      const key = this._key(d.id, d.side, d.n);
      unit ||= key;
      this.items.push({ key, id: d.id, sys: d.sys || sys, side: d.side || null, label: d.label || null, color: d.color || o.color, make: () => get()[i], weight: i === 0 ? (o.weight || 1) : 0.02, est: i === 0 ? (o.est || 400000 * (o.weight || 1)) : 0, unit });
    });
  }
  // Pieza bilateral asimétrica: se pasan ambos lados explícitamente
  pair(id, sys, fL, fR, h, o = {}) {
    this.sdf(id, sys, fL, h, { ...o, side: 'L' });
    this.sdf(id, sys, fR, h, { ...o, side: 'R' });
  }
}
export { mirrorX };
