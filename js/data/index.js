// Índice de todas las descripciones anatómicas.
import esqueletico from './esqueletico.js';
import muscular from './muscular.js';
import nervioso from './nervioso.js';
import cardiovascular from './cardiovascular.js';
import visceras from './visceras.js';

export const STRUCTURES = { ...esqueletico, ...muscular, ...nervioso, ...cardiovascular, ...visceras };
export { SYSTEMS, SYSTEM_BY_ID } from './systems.js';
