// Sistemas corporales: nombre, color de interfaz y descripción general.
export const SYSTEMS = [
  {
    id: 'piel', n: 'Tegumentario', short: 'Piel', color: '#d9a58a',
    d: 'Formado por la piel y sus anexos (pelo, uñas y glándulas sudoríparas y sebáceas). Es la barrera entre el organismo y el exterior: protege frente a agresiones físicas, químicas y microbianas, participa en la termorregulación, la percepción sensitiva y la síntesis de vitamina D.',
  },
  {
    id: 'esqueletico', n: 'Esquelético', short: 'Huesos', color: '#e8dfc8',
    d: 'El esqueleto adulto tiene normalmente 206 huesos (alrededor de 270 al nacer, que se fusionan durante el crecimiento), además de cartílagos, ligamentos y articulaciones. Da soporte y forma al cuerpo, protege órganos vitales, sirve de palanca para el movimiento, almacena calcio y fósforo y aloja la médula ósea roja, donde se forman las células sanguíneas.',
  },
  {
    id: 'muscular', n: 'Muscular', short: 'Músculos', color: '#b4443d',
    d: 'El cuerpo humano tiene más de 600 músculos esqueléticos, que constituyen aproximadamente un 30–40 % del peso corporal. Existen tres tipos de tejido muscular: esquelético (estriado y voluntario), cardíaco (estriado e involuntario) y liso (involuntario, en vísceras y vasos). Los músculos esqueléticos producen el movimiento, mantienen la postura y generan calor. En este modelo se representan los músculos superficiales principales y algunos profundos relevantes.',
  },
  {
    id: 'nervioso', n: 'Nervioso', short: 'Nervios', color: '#e9c84a',
    d: 'Se divide en sistema nervioso central (encéfalo y médula espinal) y periférico (12 pares de nervios craneales, 31 pares de nervios espinales y sus ganglios). El encéfalo adulto pesa unos 1,3–1,4 kg, contiene alrededor de 86 000 millones de neuronas y consume cerca del 20 % del oxígeno corporal en reposo. Recibe información sensitiva, la integra y controla la actividad motora, visceral y las funciones superiores.',
  },
  {
    id: 'cardiovascular', n: 'Cardiovascular', short: 'Corazón y vasos', color: '#c4302b',
    d: 'Formado por el corazón y los vasos sanguíneos (arterias, capilares y venas). El corazón bombea unos 5 litros de sangre por minuto en reposo y late unas 100 000 veces al día. La circulación sistémica (ventrículo izquierdo → aorta → tejidos → venas cavas) distribuye oxígeno y nutrientes; la pulmonar (ventrículo derecho → pulmones → aurícula izquierda) oxigena la sangre. Por convención, las arterias se muestran en rojo y las venas en azul (las arterias pulmonares, que llevan sangre desoxigenada, también en azul).',
  },
  {
    id: 'respiratorio', n: 'Respiratorio', short: 'Respiración', color: '#e7a1a6',
    d: 'Comprende las vías respiratorias (nariz, faringe, laringe, tráquea y bronquios) y los pulmones, donde se produce el intercambio gaseoso en cientos de millones de alvéolos. En reposo un adulto respira unas 12–20 veces por minuto movilizando alrededor de 0,5 L de aire por respiración. El diafragma es el principal músculo inspiratorio.',
  },
  {
    id: 'digestivo', n: 'Digestivo', short: 'Digestión', color: '#d98d78',
    d: 'Incluye el tubo digestivo (boca, faringe, esófago, estómago, intestino delgado y grueso, recto y ano) y las glándulas anexas (glándulas salivales, hígado, vesícula biliar y páncreas). Se encarga de la ingestión, la digestión mecánica y química de los alimentos, la absorción de nutrientes y agua, y la eliminación de los residuos.',
  },
  {
    id: 'urinario', n: 'Urinario', short: 'Riñón y vías', color: '#d6ae63',
    d: 'Formado por los riñones, los uréteres, la vejiga y la uretra. Los riñones filtran la sangre (unos 180 L de filtrado al día, de los que solo 1–2 L se eliminan como orina), regulan el agua, los electrolitos, el equilibrio ácido-base y la presión arterial, y producen hormonas como la eritropoyetina.',
  },
  {
    id: 'reproductor', n: 'Reproductor', short: 'Reproductor', color: '#c97b86',
    d: 'Encargado de la reproducción. En el hombre lo forman los testículos, las vías espermáticas (epidídimo, conducto deferente, conducto eyaculador), las glándulas anexas (vesículas seminales, próstata, glándulas bulbouretrales) y el pene. En la mujer, los ovarios, las trompas uterinas, el útero, la vagina, la vulva y las glándulas mamarias. Las gónadas también son glándulas endocrinas productoras de hormonas sexuales. Cambia entre el modelo masculino y femenino para estudiar cada uno.',
  },
  {
    id: 'endocrino', n: 'Endocrino', short: 'Glándulas', color: '#8e6ac4',
    d: 'Conjunto de glándulas sin conductos que vierten hormonas a la sangre para regular el metabolismo, el crecimiento, la reproducción, el equilibrio hidroelectrolítico y la respuesta al estrés. Incluye hipófisis, glándula pineal, tiroides, paratiroides y suprarrenales, además de tejido endocrino en el páncreas (islotes de Langerhans), las gónadas, el hipotálamo, los riñones y el tubo digestivo.',
  },
  {
    id: 'linfatico', n: 'Linfático', short: 'Linfático', color: '#5aa874',
    d: 'Red de vasos linfáticos, ganglios y órganos linfoides (médula ósea, timo, bazo, amígdalas y tejido linfoide asociado a mucosas). Devuelve a la sangre el exceso de líquido intersticial (unos 2–4 L/día), transporta las grasas absorbidas en el intestino y es la base del sistema inmunitario adaptativo.',
  },
];
export const SYSTEM_BY_ID = Object.fromEntries(SYSTEMS.map(s => [s.id, s]));
