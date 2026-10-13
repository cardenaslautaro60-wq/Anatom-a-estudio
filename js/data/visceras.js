// Descripciones de los sistemas tegumentario, respiratorio, digestivo, urinario, reproductor, endocrino y linfático.
const LUNG_R = 'El pulmón derecho es más ancho y corto que el izquierdo (la cúpula diafragmática derecha está más alta por el hígado) y tiene tres lóbulos separados por las cisuras oblicua y horizontal.';
const LUNG_L = 'El pulmón izquierdo es más estrecho y largo que el derecho y tiene dos lóbulos separados por la cisura oblicua; en su borde anterior presenta la escotadura cardíaca.';
const LUNG = 'Cada pulmón está envuelto por la pleura (visceral y parietal). En los alvéolos, el oxígeno pasa a la sangre y el CO₂ al aire: entre ambos pulmones hay cientos de millones de alvéolos con una superficie de intercambio de unos 70 m².';

export default {
  piel: {
    n: 'Piel', la: 'Cutis', g: 'f', reg: 'Todo el cuerpo',
    d: 'El órgano más extenso del cuerpo: en un adulto mide alrededor de 1,5–2 m². Tiene dos capas: la epidermis (epitelio escamoso estratificado queratinizado, con queratinocitos, melanocitos, células de Langerhans y de Merkel) y la dermis (tejido conectivo con colágeno y elastina, vasos, nervios, folículos pilosos y glándulas sudoríparas y sebáceas). Bajo ella está la hipodermis o tejido subcutáneo, rico en grasa.',
    f: ['Barrera física, química e inmunitaria', 'Termorregulación mediante el sudor y el flujo sanguíneo cutáneo', 'Sensibilidad: tacto, presión, vibración, dolor y temperatura', 'Síntesis de vitamina D con la radiación ultravioleta B', 'Evita la pérdida de agua'],
    k: ['Su grosor varía de unos 0,5 mm en los párpados a varios milímetros en la planta del pie y la espalda', 'La epidermis se renueva aproximadamente cada 4–6 semanas', 'Usa el control de opacidad para ver a través de la piel'],
    c: 'La extensión de las quemaduras se estima con la "regla de los nueve". El melanoma es el cáncer de piel más agresivo; la regla ABCDE ayuda a reconocer lunares sospechosos.',
  },

  // ---------------- Respiratorio ----------------
  laringe: {
    n: 'Laringe', la: 'Larynx', g: 'f', reg: 'Cuello (C3–C6)',
    d: 'Órgano tubular formado por cartílagos, ligamentos y músculos, que comunica la faringe con la tráquea. Sus cartílagos principales son el tiroides (el mayor, que forma la "nuez"), el cricoides (único anillo completo de la vía aérea), la epiglotis y los aritenoides. En su interior están los pliegues vocales, que delimitan la glotis.',
    f: ['Fonación: los pliegues vocales vibran al paso del aire', 'Protección de la vía aérea durante la deglución (cierre de la glotis y descenso de la epiglotis)', 'Reflejo de la tos'],
    t: [['Inervación', 'Nervios laríngeo superior y laríngeo recurrente (ramas del vago)']],
    sx: { M: 'En el hombre las láminas del cartílago tiroides forman un ángulo de unos 90°, lo que produce la prominencia laríngea ("nuez de Adán") y pliegues vocales más largos (voz más grave).', F: 'En la mujer las láminas del cartílago tiroides forman un ángulo de unos 120°, por lo que la prominencia laríngea es menos visible y los pliegues vocales son más cortos.' },
    c: 'En una obstrucción de la vía aérea superior se puede realizar una cricotiroidotomía de urgencia a través de la membrana cricotiroidea.',
  },
  traquea: {
    n: 'Tráquea', la: 'Trachea', g: 'f', reg: 'Cuello y mediastino',
    d: 'Tubo de unos 10–12 cm de largo y 2 cm de diámetro que va desde el cartílago cricoides (C6) hasta su bifurcación (carina), a la altura del ángulo esternal (T4–T5). Está reforzada por 16–20 cartílagos en forma de C, abiertos por detrás, donde se apoya el esófago.',
    f: ['Conduce el aire a los bronquios', 'Su mucosa ciliada y el moco atrapan partículas y las desplazan hacia la faringe (aparato mucociliar)'],
    c: 'La traqueotomía se practica para asegurar la vía aérea en ventilación prolongada; la intubación endotraqueal, durante la anestesia.',
  },
  'bronquios-principales': {
    n: 'Bronquios principales', la: 'Bronchi principales', g: 'mp', reg: 'Mediastino',
    d: 'La tráquea se divide en la carina en dos bronquios principales. El derecho es más corto, ancho y vertical; el izquierdo es más largo y horizontal y pasa por debajo del arco aórtico. Cada uno entra en el pulmón por el hilio y se divide en bronquios lobares: tres en el derecho y dos en el izquierdo.',
    c: 'Por la disposición del bronquio derecho, los cuerpos extraños aspirados suelen alojarse en el pulmón derecho.',
  },
  'arbol-bronquial': {
    n: 'Árbol bronquial', la: 'Arbor bronchialis', g: 'm', reg: 'Pulmones',
    d: 'Sistema de vías aéreas que se ramifica unas 23 veces: bronquios lobares, segmentarios (unos 10 segmentos broncopulmonares por pulmón), bronquiolos sin cartílago, bronquiolos terminales y, finalmente, bronquiolos respiratorios, conductos y sacos alveolares. El modelo muestra las primeras generaciones.',
    f: ['Conduce y distribuye el aire hasta los alvéolos'],
    c: 'En el asma, el músculo liso bronquiolar se contrae y la mucosa se inflama, estrechando la vía aérea.',
  },
  'pulmon-derecho-superior': {
    n: 'Pulmón derecho · lóbulo superior', la: 'Lobus superior pulmonis dextri', g: 'm', reg: 'Tórax',
    d: `Lóbulo situado por encima de la cisura horizontal y de la parte alta de la cisura oblicua. Su vértice (ápex) sobresale por encima de la clavícula. Tiene los segmentos apical, posterior y anterior. ${LUNG_R} ${LUNG}`,
    c: 'La tuberculosis de reactivación y el tumor de Pancoast afectan preferentemente al vértice pulmonar.',
  },
  'pulmon-derecho-medio': {
    n: 'Pulmón derecho · lóbulo medio', la: 'Lobus medius pulmonis dextri', g: 'm', reg: 'Tórax',
    d: `Lóbulo exclusivo del pulmón derecho, en su parte anterior, entre la cisura horizontal (a la altura del 4.º cartílago costal) y la oblicua. Tiene los segmentos medial y lateral. ${LUNG_R}`,
    c: 'Se ausculta en la cara anterior del tórax. Una neumonía del lóbulo medio borra el contorno derecho del corazón en la radiografía.',
  },
  'pulmon-derecho-inferior': {
    n: 'Pulmón derecho · lóbulo inferior', la: 'Lobus inferior pulmonis dextri', g: 'm', reg: 'Tórax',
    d: `El lóbulo más grande del pulmón derecho, situado por debajo y por detrás de la cisura oblicua, apoyado sobre el diafragma. Tiene un segmento superior y cuatro basales. ${LUNG_R}`,
    c: 'Ocupa la mayor parte de la cara posterior del tórax, por lo que se ausculta por la espalda. Es un lugar frecuente de neumonía por aspiración.',
  },
  'pulmon-izquierdo-superior': {
    n: 'Pulmón izquierdo · lóbulo superior', la: 'Lobus superior pulmonis sinistri', g: 'm', reg: 'Tórax',
    d: `Lóbulo situado por encima y por delante de la cisura oblicua. Incluye la língula, una prolongación anteroinferior equivalente al lóbulo medio derecho, junto a la escotadura cardíaca. ${LUNG_L} ${LUNG}`,
  },
  'pulmon-izquierdo-inferior': {
    n: 'Pulmón izquierdo · lóbulo inferior', la: 'Lobus inferior pulmonis sinistri', g: 'm', reg: 'Tórax',
    d: `Lóbulo situado por debajo y por detrás de la cisura oblicua, sobre el diafragma. Tiene un segmento superior y segmentos basales. ${LUNG_L}`,
  },
  diafragma: {
    n: 'Diafragma', la: 'Diaphragma', g: 'm', reg: 'Límite entre tórax y abdomen',
    d: 'Músculo esquelético en forma de doble cúpula que separa la cavidad torácica de la abdominal. Tiene una porción muscular periférica (esternal, costal y lumbar, con los pilares derecho e izquierdo) y un centro tendinoso. La cúpula derecha está algo más alta por la presencia del hígado.',
    t: [['Orificios', 'Hiato de la vena cava (T8), hiato esofágico (T10, con los nervios vagos) e hiato aórtico (T12, con el conducto torácico y la vena ácigos)'], ['Inervación', 'Nervios frénicos (C3–C5)']],
    f: ['Principal músculo de la inspiración: al contraerse desciende y aumenta el volumen del tórax', 'Ayuda en la tos, el vómito, la defecación y el parto (prensa abdominal)'],
    c: 'En la hernia de hiato, parte del estómago asciende al tórax a través del hiato esofágico. El hipo se debe a contracciones espasmódicas del diafragma.',
  },

  // ---------------- Digestivo ----------------
  lengua: {
    n: 'Lengua', la: 'Lingua', g: 'f', reg: 'Cavidad oral',
    d: 'Órgano muscular móvil de la boca. Sus músculos intrínsecos cambian su forma y los extrínsecos (geniogloso, hiogloso, estilogloso y palatogloso) su posición. El surco terminal separa los dos tercios anteriores, con papilas gustativas (filiformes, fungiformes, foliadas y circunvaladas), del tercio posterior, donde está la amígdala lingual.',
    t: [['Motor', 'Nervio hipogloso (XII), salvo el palatogloso (vago)'], ['Gusto', '2/3 anteriores: nervio facial (cuerda del tímpano); 1/3 posterior: glosofaríngeo (IX)'], ['Sensibilidad general', '2/3 anteriores: nervio lingual (V3); 1/3 posterior: glosofaríngeo']],
    f: ['Gusto', 'Masticación y formación del bolo alimenticio', 'Deglución', 'Articulación del habla'],
    c: 'En la lesión de un nervio hipogloso, la lengua se desvía hacia el lado lesionado al sacarla.',
  },
  'glandula-parotida': {
    n: 'Glándula parótida', la: 'Glandula parotidea', g: 'f', reg: 'Cara (delante de la oreja)',
    d: 'La mayor de las glándulas salivales. Está situada delante de la oreja, sobre el masetero y detrás de la rama mandibular. Su conducto (de Stenon) cruza el masetero y se abre en la mejilla frente al segundo molar superior. La atraviesan el nervio facial, la vena retromandibular y la arteria carótida externa.',
    f: ['Produce saliva serosa rica en amilasa'],
    t: [['Inervación secretora', 'Parasimpática del glosofaríngeo (IX) a través del ganglio ótico']],
    c: 'La parotiditis (paperas) es una infección vírica de esta glándula. Los tumores parotídeos obligan a proteger el nervio facial durante su cirugía.',
  },
  'glandula-submandibular': {
    n: 'Glándula submandibular', la: 'Glandula submandibularis', g: 'f', reg: 'Cuello (bajo la mandíbula)',
    d: 'Glándula salival situada bajo el cuerpo de la mandíbula. Su conducto (de Wharton) se abre en el suelo de la boca, a cada lado del frenillo lingual.',
    f: ['Produce saliva mixta (serosa y mucosa) y la mayor parte de la saliva en reposo'],
    t: [['Inervación secretora', 'Parasimpática del facial (VII) a través de la cuerda del tímpano y el ganglio submandibular']],
    k: ['Las glándulas salivales producen en conjunto alrededor de 1–1,5 L de saliva al día'],
    c: 'Es la glándula donde se forman con más frecuencia cálculos salivales.',
  },
  'glandula-sublingual': {
    n: 'Glándula sublingual', la: 'Glandula sublingualis', g: 'f', reg: 'Suelo de la boca',
    d: 'La más pequeña de las glándulas salivales mayores. Se sitúa en el suelo de la boca, bajo la lengua, y vierte su secreción por numerosos conductos pequeños.',
    f: ['Produce saliva predominantemente mucosa'],
    c: 'La ránula es un quiste por retención de saliva en el suelo de la boca.',
  },
  faringe: {
    n: 'Faringe', la: 'Pharynx', g: 'f', reg: 'Cuello',
    d: 'Tubo fibromuscular de unos 12–15 cm que va desde la base del cráneo hasta la altura de C6, donde continúa con el esófago. Se divide en nasofaringe (con la amígdala faríngea y el orificio de la trompa auditiva), orofaringe (con las amígdalas palatinas) y laringofaringe. Sus paredes tienen tres músculos constrictores.',
    f: ['Encrucijada de las vías respiratoria y digestiva', 'Deglución: impulsa el bolo hacia el esófago mediante un reflejo'],
    t: [['Inervación', 'Plexo faríngeo (glosofaríngeo y vago)']],
  },
  esofago: {
    n: 'Esófago', la: 'Oesophagus', g: 'm', reg: 'Cuello, tórax y abdomen',
    d: 'Tubo muscular de unos 25 cm que une la faringe (C6) con el estómago. Desciende por detrás de la tráquea y del corazón (en contacto con la aurícula izquierda) y atraviesa el diafragma por el hiato esofágico a nivel de T10. Su tercio superior tiene músculo estriado y el inferior músculo liso.',
    f: ['Transporta el alimento al estómago mediante ondas peristálticas', 'El esfínter esofágico inferior impide el reflujo del contenido gástrico'],
    k: ['Presenta tres estrechamientos: en su inicio, donde lo cruzan el arco aórtico y el bronquio izquierdo, y en el hiato diafragmático'],
    c: 'La enfermedad por reflujo gastroesofágico puede producir esófago de Barrett. Las varices esofágicas aparecen en la hipertensión portal.',
  },
  estomago: {
    n: 'Estómago', la: 'Gaster', g: 'm', reg: 'Abdomen (epigastrio e hipocondrio izquierdo)',
    d: 'Dilatación del tubo digestivo en forma de J. Sus partes son el cardias, el fondo, el cuerpo, el antro y el píloro, con su esfínter. Tiene una curvatura menor y otra mayor. Su mucosa forma pliegues y contiene glándulas con células parietales (ácido clorhídrico y factor intrínseco), principales (pepsinógeno) y G (gastrina).',
    f: ['Almacena el alimento y lo mezcla con el jugo gástrico formando el quimo', 'Inicia la digestión de las proteínas', 'El ácido destruye la mayoría de los microorganismos ingeridos', 'Produce factor intrínseco, imprescindible para absorber la vitamina B12'],
    k: ['Capacidad habitual de 1–1,5 L, que puede aumentar considerablemente al distenderse', 'El pH del jugo gástrico es muy ácido (aproximadamente 1,5–3,5)'],
    c: 'La úlcera péptica se asocia sobre todo a la infección por Helicobacter pylori y al consumo de antiinflamatorios.',
  },
  duodeno: {
    n: 'Duodeno', la: 'Duodenum', g: 'm', reg: 'Abdomen',
    d: 'Primera porción del intestino delgado, de unos 25 cm, en forma de C alrededor de la cabeza del páncreas. Tiene cuatro porciones (superior, descendente, horizontal y ascendente) y termina en el ángulo duodenoyeyunal. En la segunda porción, la papila duodenal mayor recibe el colédoco y el conducto pancreático.',
    f: ['Recibe la bilis y el jugo pancreático', 'Neutraliza el quimo ácido con bicarbonato', 'Absorbe hierro y calcio'],
    c: 'La úlcera duodenal es más frecuente que la gástrica.',
  },
  yeyuno: {
    n: 'Yeyuno', la: 'Jejunum', g: 'm', reg: 'Abdomen (parte superior izquierda)',
    d: 'Constituye aproximadamente los dos quintos proximales del intestino delgado móvil. Comparado con el íleon tiene mayor calibre, pared más gruesa, pliegues circulares altos y numerosos, y un color más rojizo por su mayor vascularización.',
    f: ['Principal lugar de digestión y absorción de nutrientes (glúcidos, proteínas y grasas)'],
    k: ['El intestino delgado mide en total varios metros (unos 3–5 m en vida y más en el cadáver); sus pliegues, vellosidades y microvellosidades multiplican la superficie de absorción'],
  },
  ileon: {
    n: 'Íleon', la: 'Ileum', g: 'm', reg: 'Abdomen (parte inferior derecha y pelvis)',
    d: 'Constituye los tres quintos distales del intestino delgado móvil y termina en la válvula ileocecal. Tiene menor calibre y pared más delgada que el yeyuno, más arcadas vasculares y abundantes placas de Peyer (tejido linfoide).',
    f: ['Absorbe la vitamina B12 (unida al factor intrínseco) y las sales biliares en su porción terminal', 'Defensa inmunitaria intestinal (placas de Peyer)'],
    k: ['El divertículo de Meckel, presente en alrededor del 2 % de las personas, se encuentra en el íleon'],
    c: 'La enfermedad de Crohn afecta con frecuencia al íleon terminal.',
  },
  ciego: {
    n: 'Ciego', la: 'Caecum', g: 'm', reg: 'Fosa ilíaca derecha',
    d: 'Primera porción del intestino grueso: un saco cerrado por abajo situado por debajo de la desembocadura del íleon (válvula ileocecal). De él sale el apéndice.',
    f: ['Recibe el contenido del intestino delgado e inicia la absorción de agua y electrolitos'],
  },
  apendice: {
    n: 'Apéndice vermiforme', la: 'Appendix vermiformis', g: 'm', reg: 'Fosa ilíaca derecha',
    d: 'Divertículo tubular estrecho de unos 6–10 cm que nace de la cara posteromedial del ciego, donde convergen las tenias del colon. Su posición es variable (la más frecuente es por detrás del ciego). Es rico en tejido linfoide.',
    k: ['El punto de McBurney, en la unión del tercio lateral y medio de la línea entre la espina ilíaca anterosuperior y el ombligo, señala aproximadamente su base'],
    c: 'La apendicitis aguda suele comenzar con dolor alrededor del ombligo que se desplaza a la fosa ilíaca derecha.',
  },
  'colon-ascendente': {
    n: 'Colon ascendente', la: 'Colon ascendens', g: 'm', reg: 'Flanco derecho',
    d: 'Porción del intestino grueso de unos 15 cm que asciende desde el ciego hasta la flexura cólica derecha (hepática), bajo el hígado. Está fijado a la pared posterior (retroperitoneal).',
    f: ['Absorbe agua y electrolitos'],
    k: ['El intestino grueso mide en total unos 1,5 m y presenta tenias (tres bandas de músculo longitudinal), haustras y apéndices omentales'],
  },
  'colon-transverso': {
    n: 'Colon transverso', la: 'Colon transversum', g: 'm', reg: 'Abdomen',
    d: 'El segmento más largo (unos 45 cm) y móvil del colon. Cruza el abdomen entre la flexura hepática y la flexura esplénica, más alta, suspendido por el mesocolon transverso; el omento mayor cuelga de él.',
    f: ['Absorbe agua y forma las heces'],
    k: ['Sus dos tercios proximales los irriga la arteria mesentérica superior y el tercio distal la inferior'],
  },
  'colon-descendente': {
    n: 'Colon descendente', la: 'Colon descendens', g: 'm', reg: 'Flanco izquierdo',
    d: 'Porción de unos 25 cm que desciende desde la flexura esplénica hasta la fosa ilíaca izquierda. Es retroperitoneal.',
    f: ['Almacena y transporta las heces'],
  },
  'colon-sigmoide': {
    n: 'Colon sigmoide', la: 'Colon sigmoideum', g: 'm', reg: 'Fosa ilíaca izquierda y pelvis',
    d: 'Segmento en forma de S de unos 40 cm, móvil gracias a su mesocolon, que va desde el borde de la pelvis hasta la tercera vértebra sacra, donde continúa con el recto.',
    f: ['Almacena las heces antes de la defecación'],
    c: 'Es el lugar más frecuente de diverticulosis y diverticulitis, y un sitio habitual de cáncer colorrectal. Puede torsionarse (vólvulo de sigma).',
  },
  recto: {
    n: 'Recto', la: 'Rectum', g: 'm', reg: 'Pelvis',
    d: 'Porción final del intestino grueso, de unos 12–15 cm, que sigue la curvatura del sacro desde S3 hasta el conducto anal. Su parte inferior dilatada es la ampolla rectal. Carece de tenias y haustras.',
    f: ['Almacena las heces; su distensión desencadena el deseo y el reflejo de defecación'],
    c: 'El tacto rectal permite palpar el recto y, en el hombre, la próstata.',
  },
  'canal-anal': {
    n: 'Conducto anal', la: 'Canalis analis', g: 'm', reg: 'Periné',
    d: 'Porción terminal del tubo digestivo, de unos 3–4 cm, que termina en el ano. Lo rodean el esfínter anal interno (músculo liso, involuntario) y el externo (estriado, voluntario). La línea pectínea separa una parte superior con sensibilidad visceral de otra inferior muy sensible al dolor.',
    f: ['Continencia y evacuación de las heces'],
    c: 'Las hemorroides internas (por encima de la línea pectínea) son indoloras; las externas y las fisuras anales son dolorosas.',
  },
  higado: {
    n: 'Hígado', la: 'Hepar', g: 'm', reg: 'Hipocondrio derecho y epigastrio',
    d: 'El órgano interno más grande y la mayor glándula del cuerpo (alrededor de 1,4–1,5 kg). Se sitúa bajo el diafragma, protegido por las costillas. Anatómicamente tiene lóbulos derecho, izquierdo, cuadrado y caudado; funcionalmente se divide en 8 segmentos según su irrigación. Recibe sangre de la vena porta y de la arteria hepática y drena a la vena cava inferior por las venas hepáticas.',
    f: ['Metabolismo de glúcidos (almacena glucógeno), lípidos y proteínas', 'Síntesis de albúmina y factores de la coagulación', 'Produce la bilis', 'Detoxifica sustancias y metaboliza fármacos', 'Almacena vitaminas (A, D, B12) y hierro'],
    k: ['Tiene una gran capacidad de regeneración, lo que permite el trasplante parcial de donante vivo'],
    c: 'La cirrosis es la fibrosis difusa del hígado por daño crónico (alcohol, hepatitis víricas, hígado graso).',
  },
  'vesicula-biliar': {
    n: 'Vesícula biliar', la: 'Vesica biliaris', g: 'f', reg: 'Bajo el hígado (hipocondrio derecho)',
    d: 'Saco en forma de pera de unos 7–10 cm alojado en la cara inferior del hígado. Tiene fondo, cuerpo y cuello, y una capacidad de unos 30–50 mL.',
    f: ['Almacena y concentra la bilis', 'Se contrae tras las comidas grasas por acción de la colecistocinina y vierte la bilis al duodeno'],
    c: 'Los cálculos biliares (colelitiasis) son muy frecuentes y pueden causar cólico biliar y colecistitis; el tratamiento suele ser la colecistectomía laparoscópica.',
  },
  'vias-biliares': {
    n: 'Vías biliares extrahepáticas', la: 'Ductus biliares', g: 'fp', reg: 'Abdomen superior',
    d: 'Los conductos hepáticos derecho e izquierdo forman el conducto hepático común, que se une al conducto cístico de la vesícula para formar el colédoco. Este pasa por detrás de la cabeza del páncreas y desemboca, junto al conducto pancreático, en la ampolla hepatopancreática de la segunda porción del duodeno, regulada por el esfínter de Oddi.',
    f: ['Conducen la bilis desde el hígado y la vesícula hasta el duodeno'],
    c: 'Un cálculo en el colédoco puede causar ictericia obstructiva, colangitis o pancreatitis.',
  },
  pancreas: {
    n: 'Páncreas', la: 'Pancreas', g: 'm', reg: 'Abdomen superior (retroperitoneo)',
    d: 'Glándula alargada de unos 12–15 cm situada detrás del estómago. Su cabeza está rodeada por el duodeno y su cola llega al hilio del bazo; entre ambas están el cuello y el cuerpo. Es una glándula mixta: su porción exocrina (la mayor parte) produce jugo pancreático y su porción endocrina son los islotes de Langerhans.',
    f: ['Exocrina: enzimas digestivas (tripsina, lipasa, amilasa) y bicarbonato, vertidos al duodeno por el conducto pancreático', 'Endocrina: insulina (células β), glucagón (células α), somatostatina (células δ) y polipéptido pancreático'],
    k: ['Los islotes de Langerhans suponen solo alrededor del 1–2 % de la masa del páncreas'],
    c: 'La pancreatitis aguda se asocia sobre todo a cálculos biliares y alcohol. La diabetes tipo 1 se debe a la destrucción autoinmune de las células β.',
  },

  // ---------------- Urinario ----------------
  rinon: {
    n: 'Riñón', la: 'Ren', g: 'm', reg: 'Retroperitoneo (T12–L3)',
    d: 'Órgano par con forma de alubia, de unos 10–12 cm de largo y 120–170 g, situado en la pared abdominal posterior. El derecho está algo más bajo por el hígado. En su hilio entran la arteria renal y salen la vena renal y la pelvis renal. Tiene una corteza externa y una médula con pirámides; su unidad funcional es la nefrona (alrededor de un millón por riñón).',
    f: ['Filtra la sangre y elimina desechos (urea, creatinina)', 'Regula el agua, los electrolitos y el equilibrio ácido-base', 'Regula la presión arterial (sistema renina-angiotensina-aldosterona)', 'Produce eritropoyetina y activa la vitamina D'],
    k: ['Los riñones filtran unos 180 L de plasma al día y producen alrededor de 1–2 L de orina'],
    c: 'Los cálculos renales producen cólico nefrítico. La insuficiencia renal avanzada se trata con diálisis o trasplante.',
  },
  ureter: {
    n: 'Uréter', la: 'Ureter', g: 'm', reg: 'Retroperitoneo y pelvis',
    d: 'Tubo muscular de unos 25–30 cm que lleva la orina desde la pelvis renal hasta la vejiga. Desciende sobre el músculo psoas, cruza los vasos ilíacos y entra oblicuamente en la pared de la vejiga, lo que impide el reflujo.',
    f: ['Transporta la orina mediante ondas peristálticas'],
    k: ['Tiene tres estrechamientos donde suelen detenerse los cálculos: unión pieloureteral, cruce de los vasos ilíacos y unión ureterovesical'],
    c: 'En la mujer pasa por debajo de la arteria uterina, por lo que puede lesionarse en la histerectomía.',
  },
  vejiga: {
    n: 'Vejiga urinaria', la: 'Vesica urinaria', g: 'f', reg: 'Pelvis (detrás del pubis)',
    d: 'Órgano muscular hueco situado detrás de la sínfisis del pubis. Su pared está formada por el músculo detrusor. En su base, el trígono vesical está delimitado por los orificios de los dos uréteres y de la uretra.',
    f: ['Almacena la orina y la expulsa en la micción, controlada por un reflejo parasimpático (S2–S4) y por el esfínter uretral externo, voluntario'],
    k: ['Capacidad funcional habitual de unos 400–600 mL; el deseo de orinar suele aparecer con unos 150–300 mL'],
    sx: { M: 'En el hombre se apoya por detrás en el recto y las vesículas seminales, y por debajo en la próstata.', F: 'En la mujer se sitúa delante del útero y de la vagina.' },
    c: 'La cistitis es más frecuente en mujeres por su uretra corta. El tabaco es el principal factor de riesgo del cáncer de vejiga.',
  },
  uretra: {
    n: 'Uretra', la: 'Urethra', g: 'f', reg: 'Pelvis y periné',
    d: 'Conducto que lleva la orina desde la vejiga al exterior.',
    sx: {
      M: 'La uretra masculina mide unos 18–20 cm y es vía común para la orina y el semen. Tiene tres porciones: prostática (recibe los conductos eyaculadores), membranosa (atraviesa el esfínter externo, la más estrecha) y esponjosa (recorre el pene hasta el meato).',
      F: 'La uretra femenina mide unos 4 cm y se abre en el vestíbulo de la vulva, entre el clítoris y el orificio vaginal. Su corta longitud explica la mayor frecuencia de infecciones urinarias en las mujeres.',
    },
    c: 'El sondaje vesical se realiza a través de la uretra.',
  },

  // ---------------- Reproductor masculino ----------------
  testiculo: {
    n: 'Testículo', la: 'Testis', g: 'm', reg: 'Escroto',
    d: 'Gónada masculina ovoide de unos 4–5 cm, alojada en el escroto, cuya temperatura es 2–3 °C inferior a la corporal, condición necesaria para producir espermatozoides. Está envuelto por la túnica albugínea y dividido en lobulillos con túbulos seminíferos.',
    f: ['Espermatogénesis en los túbulos seminíferos, con el apoyo de las células de Sertoli', 'Producción de testosterona por las células de Leydig'],
    k: ['Desciende desde la pared abdominal posterior al escroto durante el desarrollo fetal; por eso su arteria nace de la aorta y su linfa drena a ganglios lumbares', 'El izquierdo suele estar algo más bajo'],
    c: 'La torsión testicular es una urgencia quirúrgica. El cáncer de testículo es el tumor sólido más frecuente en hombres jóvenes.',
  },
  epididimo: {
    n: 'Epidídimo', la: 'Epididymis', g: 'm', reg: 'Escroto',
    d: 'Conducto muy enrollado (de varios metros si se desplegara) adosado a la cara posterior del testículo, con cabeza, cuerpo y cola. Se continúa con el conducto deferente.',
    f: ['Almacena los espermatozoides, que en él maduran y adquieren capacidad de movimiento'],
    c: 'La epididimitis produce dolor e inflamación escrotal, a menudo por infección.',
  },
  'conducto-deferente': {
    n: 'Conducto deferente', la: 'Ductus deferens', g: 'm', reg: 'Escroto, conducto inguinal y pelvis',
    d: 'Tubo muscular de unos 45 cm que nace en la cola del epidídimo, asciende en el cordón espermático, atraviesa el conducto inguinal, cruza por encima del uréter y forma una ampolla detrás de la vejiga. Se une al conducto de la vesícula seminal para formar el conducto eyaculador, que atraviesa la próstata.',
    f: ['Transporta los espermatozoides durante la eyaculación mediante contracciones peristálticas'],
    c: 'La vasectomía (sección del conducto deferente) es un método anticonceptivo permanente.',
  },
  'vesicula-seminal': {
    n: 'Vesícula seminal', la: 'Glandula vesiculosa', g: 'f', reg: 'Pelvis (detrás de la vejiga)',
    d: 'Glándula tubular enrollada de unos 5 cm situada detrás de la vejiga, por encima de la próstata.',
    f: ['Produce la mayor parte del volumen del semen: un líquido alcalino rico en fructosa (energía para los espermatozoides) y prostaglandinas'],
  },
  prostata: {
    n: 'Próstata', la: 'Prostata', g: 'f', reg: 'Pelvis (bajo la vejiga)',
    d: 'Glándula fibromuscular del tamaño de una nuez (unos 20 g) situada bajo la vejiga, rodeando la uretra prostática y delante del recto. Se divide en zonas periférica (la mayor, origen de la mayoría de los cánceres), central y de transición (donde se produce la hiperplasia benigna).',
    f: ['Produce alrededor de un 20–30 % del semen, con antígeno prostático específico (PSA), que licúa el semen, zinc y ácido cítrico'],
    c: 'La hiperplasia benigna de próstata causa síntomas urinarios en hombres mayores. El cáncer de próstata es uno de los más frecuentes en el hombre; se palpa por tacto rectal y se vigila con el PSA.',
  },
  pene: {
    n: 'Pene', la: 'Penis', g: 'm', reg: 'Periné y región púbica',
    d: 'Órgano copulador masculino y vía de salida de la orina y el semen. Tiene raíz, cuerpo y glande. Su tejido eréctil está formado por dos cuerpos cavernosos y un cuerpo esponjoso, que contiene la uretra y forma el glande.',
    f: ['Erección: dilatación de las arterias (mediada por el parasimpático y el óxido nítrico) que llena los espacios cavernosos', 'Eyaculación', 'Micción'],
    t: [['Inervación sensitiva', 'Nervio dorsal del pene (rama del pudendo)']],
    c: 'La disfunción eréctil puede ser un signo precoz de enfermedad vascular.',
  },

  // ---------------- Reproductor femenino ----------------
  ovario: {
    n: 'Ovario', la: 'Ovarium', g: 'm', reg: 'Pelvis (pared lateral)',
    d: 'Gónada femenina, de forma ovoide (unos 3 × 1,5 × 1 cm), situada a cada lado del útero. Está unido al útero por el ligamento propio del ovario y a la pared pélvica por el ligamento suspensorio, que contiene los vasos ováricos. Su corteza contiene los folículos.',
    f: ['Ovogénesis y ovulación, aproximadamente una vez cada ciclo menstrual', 'Produce estrógenos, progesterona (cuerpo lúteo) e inhibina'],
    k: ['Al nacer hay alrededor de 1–2 millones de ovocitos; en la pubertad quedan unos 400 000 y solo unos 400–500 llegan a ovular a lo largo de la vida', 'La menopausia ocurre de media hacia los 50–51 años'],
    c: 'El síndrome de ovario poliquístico es un trastorno endocrino frecuente. El cáncer de ovario suele diagnosticarse tarde por sus síntomas inespecíficos.',
  },
  'trompa-uterina': {
    n: 'Trompa uterina (de Falopio)', la: 'Tuba uterina', g: 'f', reg: 'Pelvis',
    d: 'Conducto de unos 10–12 cm que va desde el ángulo del útero hasta el ovario. Tiene cuatro porciones: intramural, istmo, ampolla (la más larga y ancha) e infundíbulo, rodeado de fimbrias que captan el ovocito.',
    f: ['Capta el ovocito tras la ovulación', 'Lugar habitual de la fecundación (ampolla)', 'Transporta el ovocito o el embrión al útero mediante cilios y peristaltismo'],
    c: 'La gran mayoría de los embarazos ectópicos se implantan en la trompa. La ligadura tubárica es un método anticonceptivo permanente.',
  },
  utero: {
    n: 'Útero', la: 'Uterus', g: 'm', reg: 'Pelvis (entre vejiga y recto)',
    d: 'Órgano muscular hueco con forma de pera invertida (unos 7,5 × 5 × 2,5 cm fuera del embarazo), situado entre la vejiga y el recto, normalmente inclinado hacia delante (anteversión y anteflexión). Tiene fondo, cuerpo, istmo y cuello (cérvix), que se proyecta en la vagina. Su pared tiene tres capas: perimetrio, miometrio (músculo liso) y endometrio.',
    f: ['Implantación del embrión y desarrollo del feto', 'Menstruación: descamación cíclica de la capa funcional del endometrio', 'Parto: contracciones del miometrio'],
    k: ['Durante el embarazo aumenta enormemente de tamaño y peso'],
    c: 'Los miomas son tumores benignos muy frecuentes. El cáncer de cuello uterino se relaciona con el virus del papiloma humano y se previene con vacunación y cribado (citología, prueba de VPH).',
  },
  vagina: {
    n: 'Vagina', la: 'Vagina', g: 'f', reg: 'Pelvis y periné',
    d: 'Conducto fibromuscular elástico de unos 7–9 cm que va desde el cuello uterino hasta el vestíbulo de la vulva, entre la vejiga y la uretra por delante y el recto por detrás. Alrededor del cérvix forma los fondos de saco (fórnix), de los que el posterior es el más profundo.',
    f: ['Canal del parto', 'Salida del flujo menstrual', 'Órgano de la cópula'],
    k: ['Su pH es ácido (aproximadamente 3,8–4,5) gracias a los lactobacilos, lo que protege frente a infecciones'],
    c: 'Las vaginitis más frecuentes son la vaginosis bacteriana y la candidiasis.',
  },
  vulva: {
    n: 'Vulva', la: 'Vulva (pudendum femininum)', g: 'f', reg: 'Periné',
    d: 'Conjunto de los genitales externos femeninos: monte del pubis, labios mayores, labios menores, clítoris, vestíbulo (donde se abren la uretra y la vagina) y glándulas vestibulares mayores (de Bartolino). El modelo la representa de forma esquemática.',
    f: ['Protege los orificios uretral y vaginal', 'El clítoris, órgano eréctil muy inervado, es homólogo del pene', 'Las glándulas de Bartolino lubrican el vestíbulo'],
    t: [['Inervación', 'Principalmente el nervio pudendo']],
    c: 'La obstrucción del conducto de una glándula de Bartolino produce quistes o abscesos.',
  },
  'glandula-mamaria': {
    n: 'Glándula mamaria', la: 'Glandula mammaria', g: 'f', reg: 'Tórax anterior',
    d: 'Glándula sudorípara modificada situada en el tejido subcutáneo de la mama, sobre el pectoral mayor, entre las costillas 2.ª y 6.ª, con una prolongación hacia la axila. Tiene 15–20 lóbulos, cada uno con un conducto galactóforo que se abre en el pezón, y está sostenida por los ligamentos suspensorios (de Cooper).',
    f: ['Producción de leche (estimulada por la prolactina) y su eyección (oxitocina) durante la lactancia'],
    k: ['La mayor parte de su linfa (alrededor del 75 %) drena a los ganglios axilares'],
    c: 'El cáncer de mama es el cáncer más frecuente en mujeres. La retracción de la piel ("piel de naranja") puede deberse a la invasión de los ligamentos de Cooper.',
  },

  // ---------------- Endocrino ----------------
  hipofisis: {
    n: 'Hipófisis', la: 'Hypophysis (glandula pituitaria)', g: 'f', reg: 'Base del cráneo (silla turca)',
    d: 'Pequeña glándula de alrededor de 1 cm y 0,5 g alojada en la silla turca del esfenoides, bajo el quiasma óptico, y unida al hipotálamo por el tallo hipofisario. Tiene un lóbulo anterior (adenohipófisis) y otro posterior (neurohipófisis).',
    f: ['Adenohipófisis: hormona del crecimiento (GH), prolactina, TSH, ACTH, FSH y LH, reguladas por el hipotálamo', 'Neurohipófisis: libera la hormona antidiurética (vasopresina) y la oxitocina, producidas en el hipotálamo'],
    k: ['Se la llama "glándula maestra" porque controla otras glándulas endocrinas'],
    c: 'Los adenomas hipofisarios pueden producir exceso hormonal (acromegalia, enfermedad de Cushing, prolactinoma) o comprimir el quiasma óptico.',
  },
  'glandula-pineal': {
    n: 'Glándula pineal (epífisis)', la: 'Glandula pinealis', g: 'f', reg: 'Encéfalo (epitálamo)',
    d: 'Pequeña glándula en forma de piña, de unos 5–8 mm, situada en la línea media del encéfalo, por encima de los colículos superiores.',
    f: ['Secreta melatonina durante la oscuridad, regulando los ritmos circadianos y el ciclo sueño-vigilia'],
    k: ['Con la edad suele calcificarse, lo que la hace visible en algunas pruebas de imagen'],
  },
  tiroides: {
    n: 'Glándula tiroides', la: 'Glandula thyroidea', g: 'f', reg: 'Cuello anterior',
    d: 'Glándula en forma de mariposa de unos 15–25 g, con dos lóbulos laterales unidos por un istmo situado sobre los anillos traqueales 2.º–4.º. Asciende al tragar porque está unida a la laringe. Está formada por folículos llenos de coloide.',
    f: ['Produce las hormonas tiroideas T4 (tiroxina) y T3 (triyodotironina), que requieren yodo y regulan el metabolismo, el crecimiento y el desarrollo del sistema nervioso', 'Sus células parafoliculares (C) producen calcitonina, que reduce el calcio en sangre'],
    k: ['Su función está regulada por la TSH de la hipófisis'],
    c: 'El hipotiroidismo y el hipertiroidismo (por ejemplo, enfermedad de Graves) son trastornos frecuentes. En la tiroidectomía hay que proteger los nervios laríngeos recurrentes y las paratiroides.',
  },
  paratiroides: {
    n: 'Glándulas paratiroides', la: 'Glandulae parathyroideae', g: 'fp', reg: 'Cuello (cara posterior del tiroides)',
    d: 'Normalmente son cuatro pequeñas glándulas, de unos 5–6 mm, situadas en la cara posterior de los lóbulos tiroideos (dos superiores y dos inferiores). Su posición, sobre todo la de las inferiores, es variable.',
    f: ['Secretan parathormona (PTH), que aumenta el calcio en sangre: libera calcio del hueso, reduce su pérdida por el riñón y activa la vitamina D'],
    c: 'Su extirpación accidental en una tiroidectomía causa hipocalcemia (calambres, tetania). El hiperparatiroidismo produce cálculos renales y pérdida ósea.',
  },
  'glandula-suprarrenal': {
    n: 'Glándula suprarrenal', la: 'Glandula suprarenalis', g: 'f', reg: 'Retroperitoneo (sobre el riñón)',
    d: 'Glándula situada sobre el polo superior de cada riñón; la derecha tiene forma piramidal y la izquierda semilunar. Tiene una corteza externa con tres zonas (glomerular, fascicular y reticular) y una médula interna formada por células cromafines, que son neuronas simpáticas modificadas.',
    f: ['Corteza: aldosterona (equilibrio de sodio y potasio), cortisol (metabolismo, estrés, inflamación) y andrógenos', 'Médula: adrenalina y noradrenalina (respuesta de "lucha o huida")'],
    k: ['Regla mnemotécnica de la corteza, de fuera a dentro: "sal" (aldosterona), "azúcar" (cortisol) y "sexo" (andrógenos)'],
    c: 'El exceso de cortisol causa síndrome de Cushing y su déficit, enfermedad de Addison. El feocromocitoma es un tumor de la médula que produce crisis hipertensivas.',
  },

  // ---------------- Linfático ----------------
  timo: {
    n: 'Timo', la: 'Thymus', g: 'm', reg: 'Mediastino superior anterior',
    d: 'Órgano linfoide primario situado detrás del esternón. Es relativamente grande en la infancia y tras la pubertad involuciona progresivamente, sustituido por tejido adiposo.',
    f: ['Maduración y selección de los linfocitos T: aprenden a reconocer lo ajeno y a tolerar lo propio', 'Produce hormonas como la timosina'],
    c: 'Los tumores del timo (timomas) se asocian a menudo con la miastenia gravis.',
  },
  bazo: {
    n: 'Bazo', la: 'Splen (lien)', g: 'm', reg: 'Hipocondrio izquierdo (costillas 9.ª–11.ª)',
    d: 'El mayor órgano linfoide, de unos 12 cm y 150 g, situado bajo el diafragma, protegido por las costillas 9.ª a 11.ª. Está formado por pulpa blanca (tejido linfoide) y pulpa roja (sinusoides llenos de sangre).',
    f: ['Filtra la sangre y elimina los glóbulos rojos envejecidos o dañados', 'Respuesta inmunitaria frente a microorganismos de la sangre', 'Reserva de plaquetas y monocitos'],
    c: 'Es el órgano abdominal que más se lesiona en los traumatismos y puede sangrar abundantemente. Tras extirparlo aumenta el riesgo de infecciones graves por bacterias encapsuladas, por lo que se indica vacunación.',
  },
  'amigdala-palatina': {
    n: 'Amígdala palatina', la: 'Tonsilla palatina', g: 'f', reg: 'Orofaringe',
    d: 'Acúmulo de tejido linfoide situado a cada lado de la orofaringe, entre los arcos palatogloso y palatofaríngeo. Junto con las amígdalas faríngea (adenoides), tubáricas y lingual forma el anillo linfático de Waldeyer.',
    f: ['Primera línea de defensa frente a microorganismos que entran por la boca y la nariz'],
    c: 'La amigdalitis es muy frecuente en la infancia; las recurrencias pueden requerir amigdalectomía.',
  },
  'ganglios-cervicales': {
    n: 'Ganglios linfáticos cervicales', la: 'Nodi lymphoidei cervicales', g: 'mp', reg: 'Cuello',
    d: 'Ganglios superficiales y profundos del cuello; los profundos forman una cadena a lo largo de la vena yugular interna. Toda la linfa de la cabeza y el cuello pasa finalmente por ellos.',
    f: ['Filtran la linfa de la cabeza y el cuello y activan la respuesta inmunitaria'],
    c: 'Aumentan de tamaño en infecciones (faringitis, mononucleosis) y en tumores. Un ganglio supraclavicular izquierdo aumentado (de Virchow) puede indicar un cáncer abdominal.',
  },
  'ganglios-axilares': {
    n: 'Ganglios linfáticos axilares', la: 'Nodi lymphoidei axillares', g: 'mp', reg: 'Axila',
    d: 'Grupo de unos 20–30 ganglios organizados en grupos humeral, pectoral, subescapular, central y apical.',
    f: ['Filtran la linfa del miembro superior, de la pared del tórax y la mayor parte de la mama'],
    c: 'En el cáncer de mama se estudia el ganglio centinela. Su extirpación puede producir linfedema del brazo.',
  },
  'ganglios-inguinales': {
    n: 'Ganglios linfáticos inguinales', la: 'Nodi lymphoidei inguinales', g: 'mp', reg: 'Ingle',
    d: 'Ganglios superficiales, situados bajo la piel de la ingle a lo largo del ligamento inguinal y de la vena safena mayor, y profundos, junto a la vena femoral.',
    f: ['Filtran la linfa del miembro inferior, la pared abdominal bajo el ombligo, los glúteos, el periné y los genitales externos'],
    k: ['Los testículos no drenan a estos ganglios sino a los lumbares (paraaórticos), por su origen abdominal'],
    c: 'Aumentan de tamaño en infecciones del pie o de la pierna y en algunas infecciones de transmisión sexual.',
  },
  'ganglios-mesentericos': {
    n: 'Ganglios linfáticos mesentéricos', la: 'Nodi lymphoidei mesenterici', g: 'mp', reg: 'Abdomen (mesenterio)',
    d: 'Numerosos ganglios (de cien a doscientos) situados en el mesenterio, a lo largo de los vasos del intestino delgado.',
    f: ['Filtran la linfa intestinal (quilo), rica en grasas absorbidas', 'Forman parte de la defensa inmunitaria del intestino'],
    c: 'La linfadenitis mesentérica puede simular una apendicitis en niños.',
  },
  'ganglios-paraaorticos': {
    n: 'Ganglios linfáticos lumbares (paraaórticos)', la: 'Nodi lymphoidei lumbales', g: 'mp', reg: 'Retroperitoneo',
    d: 'Ganglios dispuestos a lo largo de la aorta abdominal y la vena cava inferior. Sus troncos linfáticos desembocan en la cisterna del quilo.',
    f: ['Reciben la linfa de los miembros inferiores y la pelvis (a través de los ganglios ilíacos), de los riñones, las suprarrenales y las gónadas'],
    c: 'Son la primera estación de diseminación del cáncer de testículo y de ovario.',
  },
  'conducto-toracico': {
    n: 'Conducto torácico', la: 'Ductus thoracicus', g: 'm', reg: 'Abdomen, tórax y cuello',
    d: 'El mayor vaso linfático del cuerpo, de unos 38–45 cm. Nace en la cisterna del quilo, atraviesa el diafragma por el hiato aórtico, asciende por el mediastino posterior entre la aorta y la vena ácigos, se desvía a la izquierda y desemboca en el ángulo venoso yugulosubclavio izquierdo.',
    f: ['Devuelve a la sangre la linfa de la mayor parte del cuerpo: todo excepto el miembro superior derecho y la mitad derecha de la cabeza, el cuello y el tórax, que drenan por el conducto linfático derecho', 'Transporta las grasas absorbidas en el intestino'],
    c: 'Su lesión en cirugía torácica puede causar quilotórax (acumulación de linfa en la pleura).',
  },
  'cisterna-quilo': {
    n: 'Cisterna del quilo', la: 'Cisterna chyli', g: 'f', reg: 'Abdomen (L1–L2)',
    d: 'Dilatación sacular en el origen del conducto torácico, situada a la altura de L1–L2, a la derecha de la aorta y detrás del pilar derecho del diafragma. Su forma y tamaño son variables.',
    f: ['Recibe los troncos linfáticos lumbares (miembros inferiores y pelvis) e intestinal (quilo rico en grasas)'],
  },
};
