// Orquesta la generación de todas las piezas para un sexo dado.
import { Registry } from './registry.js';
import { mirrorGeom, setTubeConstraint } from './geom.js';
import { warpGeom } from './warp.js';
import { buildSkeleton } from './skeleton.js';
import { buildSkin, skinSDF } from './skin.js';
import { buildMuscles } from './muscles.js';
import { buildNervous } from './nervous.js';
import { buildCardio } from './cardio.js';
import { buildRespiratory } from './respiratory.js';
import { buildDigestive } from './digestive.js';
import { buildUrinaryReproductive } from './urogenital.js';
import { buildGlands } from './glands.js';

export const BUILDERS = {
  esqueletico: buildSkeleton,
  piel: buildSkin,
  muscular: buildMuscles,
  nervioso: buildNervous,
  cardiovascular: buildCardio,
  respiratorio: buildRespiratory,
  digestivo: buildDigestive,
  urogenital: buildUrinaryReproductive,
  glandulas: buildGlands,
};

// Mantiene los ejes de vasos y nervios al menos 2,5 mm por debajo de la piel.
let SKIN_CLAMP = null;
function skinClamp() {
  if (SKIN_CLAMP) return SKIN_CLAMP;
  const sk = skinSDF('M', { noGenitals: true });
  const e = 0.0008;
  SKIN_CLAMP = (p, r) => {
    const limit = -(r + 0.0025);
    let [x, y, z] = p;
    for (let it = 0; it < 3; it++) {
      const d = sk(x, y, z);
      if (d <= limit) break;
      const gx = sk(x + e, y, z) - sk(x - e, y, z), gy = sk(x, y + e, z) - sk(x, y - e, z), gz = sk(x, y, z + e) - sk(x, y, z - e);
      const gl = Math.hypot(gx, gy, gz) || 1;
      const m = d - limit;
      x -= gx / gl * m; y -= gy / gl * m; z -= gz / gl * m;
    }
    return [x, y, z];
  };
  return SKIN_CLAMP;
}

export function collect(sex, only) {
  setTubeConstraint(skinClamp());
  const R = new Registry(sex);
  for (const [k, fn] of Object.entries(BUILDERS)) if (!only || only.includes(k)) fn(R);
  return R.items;
}

// Agrupa los elementos en unidades indivisibles (pieza + su simétrica, o grupo dividido).
export function planUnits(items) {
  const map = new Map();
  for (const it of items) {
    let u = map.get(it.unit);
    if (!u) { u = { id: it.unit, items: [], cost: 0, order: map.size, sys: it.sys }; map.set(it.unit, u); }
    u.items.push(it);
    u.cost += it.est || 0;
  }
  return [...map.values()];
}

const PRIORITY = ['piel', 'esqueletico', 'muscular', 'cardiovascular', 'respiratorio', 'digestivo', 'nervioso', 'urinario', 'reproductor', 'endocrino', 'linfatico'];

// Reparto equilibrado (mayor coste primero al trabajador menos cargado); determinista.
export function assign(units, n) {
  const bins = Array.from({ length: n }, () => ({ load: 0, units: [] }));
  const sorted = units.slice().sort((a, b) => b.cost - a.cost || a.order - b.order);
  for (const u of sorted) {
    let best = bins[0];
    for (const b of bins) if (b.load < best.load) best = b;
    best.units.push(u);
    best.load += u.cost + 2000;
  }
  for (const b of bins) b.units.sort((a, c) => (PRIORITY.indexOf(a.sys) - PRIORITY.indexOf(c.sys)) || a.order - c.order);
  return bins.map(b => b.units);
}

function makePart(sex, it, raw) {
  let g;
  if (it.mirrorOf) g = mirrorGeom(raw.get(it.mirrorOf));
  else {
    g = it.make();
    raw.set(it.key, g);
  }
  let gg = g;
  if (sex === 'F') {
    gg = { pos: g.pos.slice(), nor: g.nor.slice(), idx: it.mirrorOf ? g.idx : g.idx.slice() };
    warpGeom(gg);
  }
  return { key: it.key, id: it.id, sys: it.sys, side: it.side, label: it.label, color: it.color, pos: gg.pos, nor: gg.nor, idx: gg.idx };
}

// Genera las unidades indicadas. onUnit(parts) se llama al terminar cada unidad.
export function buildUnits(sex, units, onUnit) {
  for (const u of units) {
    const raw = new Map();
    const parts = u.items.map(it => makePart(sex, it, raw));
    onUnit(parts, u);
  }
}

// Generación completa en un solo hilo (pruebas).
export function build(sex, { only, onPart } = {}) {
  const units = planUnits(collect(sex, only));
  const out = [];
  buildUnits(sex, units, parts => { for (const p of parts) { out.push(p); if (onPart) onPart(p); } });
  return out;
}
