# Atlas Anatómico 3D

Modelo 3D interactivo de la anatomía humana **masculina y femenina** pensado para estudiar. Cada estructura se puede seleccionar y tiene una ficha con su descripción, término latino (Terminologia Anatomica), funciones, datos clave y relevancia clínica, todo en español.

## Qué incluye

- **11 sistemas** y **232 estructuras** diferentes (más de 470 piezas contando lados y vértebras):
  - Tegumentario (piel).
  - Esquelético: huesos del cráneo por separado, mandíbula, dientes, hioides, las 24 vértebras presacras una a una, discos, sacro, cóccix, 12 pares de costillas, cartílagos costales, esternón, cinturas y todos los huesos de los miembros, incluidos carpo, metacarpo, tarso, metatarso y falanges.
  - Muscular: principales músculos superficiales y algunos profundos (iliopsoas, erector de la columna, intercostales, suelo pélvico…).
  - Nervioso: lóbulos cerebrales, cerebelo, tronco del encéfalo, médula, cola de caballo, nervios espinales, plexo braquial, nervios periféricos y craneales principales, ojos.
  - Cardiovascular: las cuatro cámaras del corazón, coronarias, aorta y sus ramas, circulación pulmonar y las principales venas.
  - Respiratorio: laringe, tráquea, bronquios, árbol bronquial, lóbulos pulmonares y diafragma.
  - Digestivo, urinario, reproductor (masculino o femenino), endocrino y linfático.
- **Menú minimalista**: mostrar u ocultar sistemas, ajustar su opacidad o verlos de forma aislada.
- **Índice con buscador** (ignora tildes) para encontrar cualquier estructura.
- **Ficha de estudio** de cada estructura, con notas específicas según el sexo cuando hay diferencias anatómicas.
- **Herramientas**: vistas predefinidas, rayos X, aislar u ocultar estructuras, **plano de corte** (sagital, coronal y transversal) y **modo estudio** (autoevaluación: se resalta una estructura y hay que identificarla).
- Funciona en ordenador, tableta y móvil.

## Cómo abrirlo

Es una web estática sin dependencias externas (Three.js y three-mesh-bvh están incluidos en `vendor/`). Por usar módulos ES y Web Workers, debe servirse por HTTP; no funciona abriendo `index.html` con doble clic.

```bash
# Desde la carpeta del proyecto, con Python 3
python3 -m http.server 8000
# o con Node.js
npx serve .
```

Después abre <http://localhost:8000> en un navegador moderno (Chrome, Edge, Firefox o Safari recientes).

También se puede publicar tal cual en GitHub Pages (Settings → Pages → rama y carpeta raíz).

## Controles

| Acción | Ratón | Táctil |
| --- | --- | --- |
| Girar | Arrastrar | Arrastrar con un dedo |
| Acercar | Rueda | Pellizcar |
| Desplazar | Clic derecho | Dos dedos |
| Seleccionar | Clic | Tocar |
| Centrar estructura | Doble clic | — |

Atajos: `Esc` deseleccionar · `F` centrar · `I` aislar · `H` ocultar · `X` rayos X · `1`–`5` vistas.

«Izquierdo» y «derecho» se refieren siempre al lado del propio cuerpo: en la vista anterior, el lado izquierdo del modelo aparece a la derecha de la pantalla.

## Cómo está hecho

El modelo no se descarga: se **genera en el navegador** al abrir la página, repartiendo el trabajo entre varios Web Workers.

- Cada estructura se describe con campos de distancia con signo (SDF) a partir de puntos de referencia anatómicos de un adulto de 1,75 m en posición anatómica (`js/gen/anat.js`). Las superficies se extraen con *Surface Nets* dispersos por bloques (`js/gen/mesher.js`).
- Vasos, nervios, costillas e intestinos son tubos de radio variable a lo largo de curvas Catmull-Rom (`js/gen/geom.js`).
- Los músculos superficiales se definen como regiones dibujadas sobre mapas cilíndricos «desenrollados» de cada segmento corporal, con grosor bajo la piel (`js/gen/muscles.js`).
- El modelo femenino (1,63 m) se obtiene deformando la plantilla con proporciones medias (hombros y tórax más estrechos, pelvis más ancha) y añadiendo sus estructuras propias (`js/gen/warp.js`).
- Las descripciones están en `js/data/` y son independientes de la geometría: es fácil corregirlas o ampliarlas.

```
index.html          Interfaz
css/style.css       Estilos
js/app.js           Escena, interacción y menú
js/worker.js        Generación en segundo plano
js/gen/             Geometría procedural por sistema
js/data/            Fichas anatómicas (español)
vendor/             Three.js r170 y three-mesh-bvh (licencia MIT)
```

## Aviso

El modelo es una representación esquemática generada por ordenador, con proporciones de un adulto medio; la forma exacta de cada estructura está simplificada. Las descripciones siguen la nomenclatura anatómica internacional y valores de referencia habituales, pero es un recurso de estudio: no sustituye a los atlas y textos de referencia ni al consejo médico.

## Licencias de terceros

Three.js y three-mesh-bvh se distribuyen bajo licencia MIT (ver `vendor/*/LICENSE`).
