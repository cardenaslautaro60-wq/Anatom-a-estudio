// Web Worker: genera unidades de malla bajo demanda (cola dinámica gestionada por el hilo principal).
import { collect, planUnits, buildUnits } from './gen/build.js';

const cache = {};
self.onmessage = (e) => {
  const { type, sex, unit, job } = e.data;
  try {
    if (type !== 'build') return;
    const units = (cache[sex] ||= planUnits(collect(sex)));
    buildUnits(sex, [units[unit]], (parts) => {
      const transfer = [];
      for (const p of parts) transfer.push(p.pos.buffer, p.nor.buffer, p.idx.buffer);
      self.postMessage({ type: 'parts', job, unit, parts }, transfer);
    });
  } catch (err) {
    self.postMessage({ type: 'error', job, unit, message: String((err && err.stack) || err) });
  }
};
