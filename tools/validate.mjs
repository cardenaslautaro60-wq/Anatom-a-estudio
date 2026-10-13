// Comprueba la coherencia entre la geometría generada y las fichas anatómicas.
// Uso: node tools/validate.mjs
import { collect } from '../js/gen/build.js';
import { STRUCTURES, SYSTEMS } from '../js/data/index.js';
import fs from 'fs';

let errors = 0;
const err = (m) => { errors++; console.error('✗', m); };
const sysIds = new Set(SYSTEMS.map(s => s.id));
const bySys = {};
for (const sex of ['M', 'F']) {
  for (const it of collect(sex)) {
    (bySys[it.id] ||= new Set()).add(it.sys);
    if (!sysIds.has(it.sys)) err(`sistema desconocido «${it.sys}» en ${it.key}`);
  }
}
for (const [id, s] of Object.entries(bySys)) {
  if (s.size > 1) err(`el id «${id}» se usa en varios sistemas: ${[...s].join(', ')}`);
  const d = STRUCTURES[id];
  if (!d) { err(`falta la ficha de «${id}»`); continue; }
  for (const f of ['n', 'd', 'g']) if (!d[f]) err(`ficha «${id}» sin campo ${f}`);
  if (!['m', 'f', 'mp', 'fp'].includes(d.g)) err(`ficha «${id}» con género inválido`);
}
for (const id of Object.keys(STRUCTURES)) if (!bySys[id]) err(`ficha sin geometría: «${id}»`);
// claves duplicadas entre archivos de datos (se sobrescribirían al combinarlos)
const seen = {};
for (const f of fs.readdirSync(new URL('../js/data/', import.meta.url))) {
  const src = fs.readFileSync(new URL('../js/data/' + f, import.meta.url), 'utf8');
  for (const m of src.matchAll(/^ {2}'?([a-z0-9-]+)'?: \{/gm)) {
    if (seen[m[1]]) err(`ficha «${m[1]}» duplicada en ${seen[m[1]]} y ${f}`);
    seen[m[1]] = f;
  }
}
console.log(errors ? `${errors} problema(s)` : `OK: ${Object.keys(bySys).length} estructuras con ficha`);
process.exit(errors ? 1 : 0);
