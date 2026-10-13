// Atlas Anatómico 3D — aplicación principal.
import * as THREE from 'three';
import { OrbitControls } from '../vendor/three/addons/OrbitControls.js';
import { RoomEnvironment } from '../vendor/three/addons/RoomEnvironment.js';
import { computeBoundsTree, acceleratedRaycast } from '../vendor/three-mesh-bvh/three-mesh-bvh.module.js';
import { collect, planUnits } from './gen/build.js';
import { STRUCTURES, SYSTEMS, SYSTEM_BY_ID } from './data/index.js';
import { FEMALE_SCALE } from './gen/warp.js';

THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

const $ = (s) => document.querySelector(s);
const el = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k !== null && k !== undefined && k !== false) e.append(k.nodeType ? k : document.createTextNode(k));
  return e;
};
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// ------------------------------------------------------------------ Estado
const DEFAULT_VISIBLE = { piel: true, esqueletico: true, muscular: false, nervioso: true, cardiovascular: true, respiratorio: true, digestivo: true, urinario: true, reproductor: true, endocrino: true, linfatico: true };
const DEFAULT_OPACITY = { piel: 0.22 };
const state = {
  sex: 'M',
  models: {},
  sysVisible: { ...DEFAULT_VISIBLE },
  sysOpacity: Object.fromEntries(SYSTEMS.map(s => [s.id, DEFAULT_OPACITY[s.id] ?? 1])),
  hidden: new Set(),
  selection: null, // { id, keys: Set }
  isolate: false,
  xray: false,
  hovered: null,
  quiz: null,
};
const model = () => state.models[state.sex];

// ------------------------------------------------------------------ Escena
const canvas = $('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(1.6, 3.2, 2.6); scene.add(key);
const rim = new THREE.DirectionalLight(0xcfe0ff, 0.7); rim.position.set(-2, 2, -2.5); scene.add(rim);
scene.add(new THREE.HemisphereLight(0xffffff, 0x2a2f38, 0.35));

// Sombra suave en el suelo
{
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(0.55, 48), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = 0.001; floor.renderOrder = -1;
  scene.add(floor);
}

const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 50);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.09;
controls.minDistance = 0.12;
controls.maxDistance = 9;
controls.screenSpacePanning = true;

let needsRender = true;
const requestRender = () => { needsRender = true; };
controls.addEventListener('change', requestRender);

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  requestRender();
}
window.addEventListener('resize', resize);
resize();

// Animación de cámara
let tween = null;
function flyTo(pos, target, ms = 650) {
  tween = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos, t1: target, start: performance.now(), ms };
  requestRender();
}
const height = () => (state.sex === 'F' ? 1.75 * FEMALE_SCALE : 1.75);
function fitDistance(radius) {
  const vfov = THREE.MathUtils.degToRad(camera.fov) / 2;
  const hfov = Math.atan(Math.tan(vfov) * camera.aspect);
  return radius / Math.sin(Math.min(vfov, hfov)) * 1.04;
}
const VIEWS = { front: [0, 0, 1], back: [0, 0, -1], left: [1, 0, 0], right: [-1, 0, 0], top: [0, 1, 0.0001] };
function setView(name, instant = false) {
  const H = height();
  const target = new THREE.Vector3(0, H * 0.47, 0);
  let dist = fitDistance(H * 0.56);
  const d = VIEWS[name];
  const pos = new THREE.Vector3(d[0], d[1], d[2]).normalize().multiplyScalar(name === 'top' ? dist * 0.55 : dist).add(target);
  if (name === 'top') target.y = H * 0.75;
  if (instant) { camera.position.copy(pos); controls.target.copy(target); controls.update(); requestRender(); }
  else flyTo(pos, target);
}
function focusKeys(keys, auto = false) {
  const box = new THREE.Box3();
  for (const m of meshesOf(keys)) { m.geometry.computeBoundingBox(); box.union(m.geometry.boundingBox); }
  if (box.isEmpty()) return;
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const r = Math.max(sphere.radius, 0.045);
  let dir = camera.position.clone().sub(controls.target).normalize();
  if (auto) {
    // Mirar la estructura desde el lado del cuerpo en el que se encuentra
    const c = sphere.center;
    const out = new THREE.Vector3(c.x * 1.4, 0, c.z + 0.01);
    if (out.length() > 0.035) dir = out.normalize().add(new THREE.Vector3(0, 0.22, 0)).normalize();
  }
  const dist = fitDistance(r) * 1.35;
  flyTo(sphere.center.clone().add(dir.multiplyScalar(dist)), sphere.center.clone());
}

// ------------------------------------------------------------------ Generación (pool de workers)
const nWorkers = Math.max(2, Math.min(6, (navigator.hardwareConcurrency || 4) - 1));
const workers = Array.from({ length: nWorkers }, () => new Worker(new URL('./worker.js', import.meta.url), { type: 'module' }));
let jobId = 0;

function loadModel(sex) {
  if (state.models[sex]) return state.models[sex].promise;
  const units = planUnits(collect(sex));
  const group = new THREE.Group();
  group.visible = sex === state.sex;
  scene.add(group);
  const m = { sex, group, meshes: [], byKey: new Map(), byId: new Map(), ready: false };
  state.models[sex] = m;
  const queue = units.map((u, i) => ({ i, cost: u.cost })).sort((a, b) => b.cost - a.cost).map(x => x.i);
  const total = units.length;
  let done = 0, busy = 0;
  const job = ++jobId;
  showLoading(true, sex);
  m.promise = new Promise((resolve, reject) => {
    const next = (w) => {
      if (queue.length) { busy++; w.postMessage({ type: 'build', sex, unit: queue.shift(), job }); }
      else if (busy === 0) { m.ready = true; resolve(m); }
    };
    for (const w of workers) {
      w.onmessage = (e) => {
        const msg = e.data;
        if (msg.job !== job) return;
        if (msg.type === 'error') { console.error(msg.message); reject(new Error(msg.message)); return; }
        if (msg.type === 'parts') {
          for (const p of msg.parts) addPart(m, p);
          busy--; done++;
          setProgress(done / total, msg.parts[0] && msg.parts[0].id);
          applyState();
          next(w);
        }
      };
      next(w);
    }
  });
  return m.promise;
}

function addPart(m, p) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(p.pos, 3));
  const nAttr = new THREE.BufferAttribute(p.nor, 3);
  nAttr.onUpload(function () { this.array = null; });
  g.setAttribute('normal', nAttr);
  g.setIndex(new THREE.BufferAttribute(p.idx, 1));
  g.computeBoundingSphere();
  const skin = p.sys === 'piel';
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(p.color || '#cccccc'), roughness: skin ? 0.72 : 0.55, metalness: 0, envMapIntensity: skin ? 0.5 : 0.75,
  });
  const mesh = new THREE.Mesh(g, mat);
  mesh.userData = { key: p.key, id: p.id, sys: p.sys, side: p.side, label: p.label, base: mat.color.clone() };
  if (skin) mesh.renderOrder = 10;
  m.group.add(mesh);
  m.meshes.push(mesh);
  m.byKey.set(p.key, mesh);
  if (!m.byId.has(p.id)) m.byId.set(p.id, []);
  m.byId.get(p.id).push(mesh);
}

function showLoading(on, sex) {
  const L = $('#loading');
  if (on) {
    L.classList.remove('hidden', 'fade');
    $('#loading-title').textContent = `Generando modelo ${sex === 'F' ? 'femenino' : 'masculino'}…`;
    setProgress(0);
  } else {
    L.classList.add('fade');
    setTimeout(() => L.classList.add('hidden'), 320);
  }
}
function setProgress(f, id) {
  $('#loading-bar').style.width = `${Math.round(f * 100)}%`;
  const s = id && STRUCTURES[id];
  $('#loading-detail').textContent = `${Math.round(f * 100)} %${s ? ' · ' + s.n : ''}`;
}

// ------------------------------------------------------------------ Visibilidad y resaltado
const SEL = new THREE.Color('#ffb21f');
const HOV = new THREE.Color('#4a86c8');
const BLACK = new THREE.Color(0, 0, 0);
function meshesOf(keys) {
  const m = model();
  if (!m) return [];
  return [...keys].map(k => m.byKey.get(k)).filter(Boolean);
}
function applyState() {
  const m = model();
  if (!m) return;
  const sel = state.selection ? state.selection.keys : null;
  const focus = state.quiz && state.quiz.keys ? state.quiz.keys : (state.isolate && sel ? sel : null);
  for (const mesh of m.meshes) {
    const u = mesh.userData;
    const isSel = !state.quiz && sel && sel.has(u.key);
    let vis = state.sysVisible[u.sys] && !state.hidden.has(u.key);
    let op = state.sysOpacity[u.sys];
    u.ghost = false;
    if (focus) {
      if (focus.has(u.key)) { vis = true; op = 1; }
      else { op = Math.min(op, u.sys === 'piel' ? 0.04 : 0.07); u.ghost = true; }
    } else if (state.xray && !isSel) {
      op = Math.min(op, u.sys === 'piel' ? 0.08 : 0.16);
    }
    if (isSel) { vis = true; op = Math.max(op, 0.85); }
    mesh.visible = vis && op > 0.005;
    const mat = mesh.material;
    const transp = op < 0.999;
    if (mat.transparent !== transp) { mat.transparent = transp; mat.needsUpdate = true; }
    mat.opacity = op;
    mat.depthWrite = !transp;
    const hov = state.hovered === mesh && !u.ghost;
    if (isSel) mat.color.copy(u.base).lerp(SEL, 0.55); else mat.color.copy(u.base);
    mat.emissive.copy(isSel ? SEL : hov ? HOV : BLACK);
    mat.emissiveIntensity = isSel ? 0.28 : 0.4;
  }
  $('#hidden-count').textContent = state.hidden.size;
  requestRender();
}

// ------------------------------------------------------------------ Selección por rayo
const raycaster = new THREE.Raycaster();
raycaster.firstHitOnly = false;
const ndc = new THREE.Vector2();
const tmpSphere = new THREE.Sphere();
function pick(clientX, clientY) {
  const m = model();
  if (!m) return null;
  const r = canvas.getBoundingClientRect();
  ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const cands = [];
  for (const mesh of m.meshes) {
    if (!mesh.visible || mesh.userData.ghost || mesh.material.opacity < 0.05) continue;
    tmpSphere.copy(mesh.geometry.boundingSphere);
    if (!raycaster.ray.intersectsSphere(tmpSphere)) continue;
    if (!mesh.geometry.boundsTree) mesh.geometry.computeBoundsTree();
    cands.push(mesh);
  }
  const hits = raycaster.intersectObjects(cands, false);
  if (!hits.length) return null;
  const solid = hits.find(h => h.object.material.opacity >= 0.5);
  return (solid || hits[0]).object;
}

let down = null;
canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
canvas.addEventListener('pointerup', (e) => {
  if (!down) return;
  const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
  down = null;
  if (moved > 6 || e.button !== 0) return;
  if (state.quiz) return;
  const hit = pick(e.clientX, e.clientY);
  if (hit) select(hit.userData.id, hit.userData.key);
  else clearSelection();
});
canvas.addEventListener('dblclick', (e) => {
  const hit = pick(e.clientX, e.clientY);
  if (hit && !state.quiz) { select(hit.userData.id, hit.userData.key); focusKeys(state.selection.keys); }
});

// Hover con etiqueta
const tooltip = $('#tooltip');
let hoverEvt = null;
canvas.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' && !down) hoverEvt = e; });
canvas.addEventListener('pointerleave', () => { hoverEvt = null; setHover(null); });
function setHover(mesh, e) {
  if (state.hovered !== mesh) { state.hovered = mesh; applyState(); }
  if (mesh && e) {
    tooltip.textContent = state.quiz ? '?' : displayName(mesh.userData);
    tooltip.style.left = e.clientX + 'px';
    tooltip.style.top = e.clientY + 'px';
    tooltip.classList.remove('hidden');
  } else tooltip.classList.add('hidden');
}

// ------------------------------------------------------------------ Nombres
const SIDE = { m: ['izquierdo', 'derecho'], f: ['izquierda', 'derecha'], mp: ['izquierdos', 'derechos'], fp: ['izquierdas', 'derechas'] };
function displayName(u) {
  const d = STRUCTURES[u.id] || { n: u.id, g: 'm' };
  const base = u.label || d.n;
  if (!u.side) return base;
  const w = SIDE[d.g || 'm'][u.side === 'L' ? 0 : 1];
  if (base.includes('·') || base.includes('(')) return `${base} · lado ${SIDE.m[u.side === 'L' ? 0 : 1]}`;
  return `${base} ${w}`;
}

// ------------------------------------------------------------------ Selección y ficha
function select(id, key = null, opts = {}) {
  const m = model();
  if (!m || !m.byId.has(id)) return;
  const keys = new Set(key ? [key] : m.byId.get(id).map(x => x.userData.key));
  state.selection = { id, key, keys };
  if (key && state.hidden.has(key)) state.hidden.delete(key);
  renderInfo();
  markIndex();
  applyState();
  if (opts.focus) focusKeys(keys, true);
}
function clearSelection() {
  if (!state.selection) return;
  state.selection = null;
  state.isolate = false;
  renderInfo();
  markIndex();
  applyState();
}

const ICON = {
  focus: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4"/></svg>',
  iso: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" stroke-dasharray="2 3"/><circle cx="12" cy="12" r="3.5"/></svg>',
  hide: '<svg viewBox="0 0 24 24"><path d="M3 3l18 18M10.6 5.6A9.8 9.8 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3 3.7M6.4 6.9A16.6 16.6 0 0 0 2.5 12S6 18.5 12 18.5c1.7 0 3.1-.5 4.4-1.2"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
  both: '<svg viewBox="0 0 24 24"><path d="M12 3v18M8 7l-4 5 4 5M16 7l4 5-4 5"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
};

function renderInfo() {
  const box = $('#info'), empty = $('#info-empty'), panel = $('#panel-info');
  if (state.quiz) return;
  if (!state.selection) {
    box.classList.add('hidden'); empty.classList.remove('hidden'); panel.classList.add('empty');
    return;
  }
  panel.classList.remove('empty');
  const { id, key } = state.selection;
  const m = model();
  const d = STRUCTURES[id];
  const mesh = key ? m.byKey.get(key) : m.byId.get(id)[0];
  const u = key ? mesh.userData : { id, sys: mesh.userData.sys };
  const sys = SYSTEM_BY_ID[mesh.userData.sys];
  const bilateral = m.byId.get(id).some(x => x.userData.side);
  const html = [];
  html.push(`<div class="info-head"><h2>${esc(displayName(u))}</h2><button class="close-x" data-act="close" aria-label="Cerrar">${ICON.close}</button></div>`);
  if (d.la) html.push(`<div class="latin">${esc(d.la)}</div>`);
  html.push(`<div class="chips"><span class="chip"><i style="background:${sys.color}"></i>Sistema ${esc(sys.n.toLowerCase())}</span>${d.reg ? `<span class="chip">${esc(d.reg)}</span>` : ''}</div>`);
  html.push(`<div class="info-actions">
    <button class="act" data-act="focus">${ICON.focus}Centrar</button>
    <button class="act ${state.isolate ? 'on' : ''}" data-act="isolate">${ICON.iso}Aislar</button>
    <button class="act" data-act="hide">${ICON.hide}Ocultar</button>
    ${bilateral && key ? `<button class="act" data-act="both">${ICON.both}Ambos lados</button>` : ''}
  </div>`);
  html.push(`<p class="desc">${esc(d.d)}</p>`);
  if (d.sx && d.sx[state.sex]) html.push(`<div class="sx">${esc(d.sx[state.sex])}</div>`);
  if (d.t && d.t.length) html.push(`<table>${d.t.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</table>`);
  if (d.f && d.f.length) html.push(`<h3>Funciones</h3><ul>${d.f.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`);
  if (d.k && d.k.length) html.push(`<h3>Datos clave</h3><ul>${d.k.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`);
  if (d.c) html.push(`<div class="clinic"><b>Relevancia clínica.</b> ${esc(d.c)}</div>`);
  box.innerHTML = html.join('');
  box.scrollTop = 0;
  box.classList.remove('hidden'); empty.classList.add('hidden');
}
$('#info').addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]');
  if (!b || !state.selection) return;
  const act = b.dataset.act;
  if (act === 'close') clearSelection();
  else if (act === 'focus') focusKeys(state.selection.keys);
  else if (act === 'isolate') { state.isolate = !state.isolate; renderInfo(); applyState(); }
  else if (act === 'hide') { for (const k of state.selection.keys) state.hidden.add(k); state.selection = null; state.isolate = false; renderInfo(); markIndex(); applyState(); }
  else if (act === 'both') select(state.selection.id, null);
});

// ------------------------------------------------------------------ Panel de sistemas
function idsBySystem() {
  const m = model();
  const out = {};
  if (!m) return out;
  for (const [id, list] of m.byId) {
    const s = list[0].userData.sys;
    (out[s] ||= []).push(id);
  }
  return out;
}
function renderSystems() {
  const ul = $('#systems-list');
  ul.innerHTML = '';
  const counts = idsBySystem();
  for (const s of SYSTEMS) {
    const on = state.sysVisible[s.id];
    const li = el('li', { class: `sys${on ? '' : ' off'}`, 'data-sys': s.id },
      el('div', { class: 'sys-row' },
        el('button', { class: 'sys-toggle', 'aria-pressed': String(on), title: on ? 'Ocultar sistema' : 'Mostrar sistema', onclick: () => toggleSystem(s.id) },
          el('span', { class: 'sys-dot', style: `background:${s.color}` }),
          el('span', { class: 'sys-name' }, s.n),
          el('span', { class: 'sys-count' }, String((counts[s.id] || []).length || '')),
        ),
        el('button', { class: 'sys-more', 'aria-label': `Opciones de ${s.n}`, title: 'Opacidad e información', onclick: () => li.classList.toggle('open'), html: '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>' }),
      ),
      el('div', { class: 'sys-extra' },
        el('input', { type: 'range', min: '0.05', max: '1', step: '0.05', value: String(state.sysOpacity[s.id]), 'aria-label': `Opacidad de ${s.n}`, oninput: (e) => { state.sysOpacity[s.id] = Number(e.target.value); if (!state.sysVisible[s.id]) { state.sysVisible[s.id] = true; li.classList.remove('off'); } applyState(); } }),
        el('button', { class: 'solo', title: 'Mostrar solo este sistema', onclick: () => soloSystem(s.id) }, 'Solo'),
      ),
      el('div', { class: 'sys-desc' }, s.d),
    );
    ul.append(li);
  }
}
function toggleSystem(id) {
  state.sysVisible[id] = !state.sysVisible[id];
  const li = document.querySelector(`.sys[data-sys="${id}"]`);
  li.classList.toggle('off', !state.sysVisible[id]);
  li.querySelector('.sys-toggle').setAttribute('aria-pressed', String(state.sysVisible[id]));
  applyState();
}
function soloSystem(id) {
  for (const s of SYSTEMS) state.sysVisible[s.id] = s.id === id;
  if (state.sysOpacity[id] < 0.5) state.sysOpacity[id] = 1;
  renderSystems();
  applyState();
}
$('#btn-all-on').addEventListener('click', () => { for (const s of SYSTEMS) state.sysVisible[s.id] = true; renderSystems(); applyState(); });
$('#btn-all-off').addEventListener('click', () => { for (const s of SYSTEMS) state.sysVisible[s.id] = false; renderSystems(); applyState(); });

// ------------------------------------------------------------------ Índice y búsqueda
function renderIndex() {
  const q = norm($('#search').value.trim());
  const list = $('#index-list');
  list.innerHTML = '';
  const groups = idsBySystem();
  let n = 0;
  for (const s of SYSTEMS) {
    const ids = (groups[s.id] || []).filter(id => {
      if (!q) return true;
      const d = STRUCTURES[id];
      return norm(d.n).includes(q) || norm(d.la || '').includes(q) || norm(d.reg || '').includes(q);
    }).sort((a, b) => STRUCTURES[a].n.localeCompare(STRUCTURES[b].n, 'es'));
    if (!ids.length) continue;
    n += ids.length;
    const g = el('div', { class: 'index-group' }, el('h4', {}, el('i', { style: `background:${s.color}` }), s.n));
    for (const id of ids) {
      const count = model().byId.get(id).length;
      g.append(el('button', { class: 'index-item', 'data-id': id, onclick: () => { exitQuiz(); select(id, null, { focus: true }); closeMobileMenu(); } },
        STRUCTURES[id].n, count > 1 ? el('small', {}, `×${count}`) : null));
    }
    list.append(g);
  }
  if (!n) list.append(el('div', { class: 'index-empty' }, 'Sin resultados'));
  markIndex();
}
function markIndex() {
  const id = state.selection && state.selection.id;
  for (const b of document.querySelectorAll('.index-item')) b.classList.toggle('active', b.dataset.id === id);
}
$('#search').addEventListener('input', renderIndex);
for (const t of document.querySelectorAll('.tabs button')) {
  t.addEventListener('click', () => {
    for (const x of document.querySelectorAll('.tabs button')) { x.classList.toggle('active', x === t); x.setAttribute('aria-selected', String(x === t)); }
    $('#tab-systems').classList.toggle('hidden', t.dataset.tab !== 'systems');
    $('#tab-index').classList.toggle('hidden', t.dataset.tab !== 'index');
    if (t.dataset.tab === 'index') $('#search').focus({ preventScroll: true });
  });
}

// ------------------------------------------------------------------ Barra de herramientas
for (const b of document.querySelectorAll('[data-view]')) b.addEventListener('click', () => setView(b.dataset.view));
$('#btn-xray').addEventListener('click', toggleXray);
function toggleXray() { state.xray = !state.xray; $('#btn-xray').classList.toggle('on', state.xray); applyState(); }
$('#btn-show-hidden').addEventListener('click', () => { state.hidden.clear(); applyState(); });
$('#btn-reset').addEventListener('click', () => {
  exitQuiz();
  state.sysVisible = { ...DEFAULT_VISIBLE };
  for (const s of SYSTEMS) state.sysOpacity[s.id] = DEFAULT_OPACITY[s.id] ?? 1;
  state.hidden.clear(); state.xray = false; state.isolate = false; state.selection = null;
  $('#btn-xray').classList.remove('on');
  renderSystems(); renderInfo(); markIndex(); applyState(); setView('front');
});
$('#btn-help').addEventListener('click', () => $('#help').showModal());
$('#btn-menu').addEventListener('click', () => $('#panel-left').classList.toggle('open'));
function closeMobileMenu() { $('#panel-left').classList.remove('open'); }

// Cambio de sexo
for (const b of document.querySelectorAll('[data-sex]')) b.addEventListener('click', () => switchSex(b.dataset.sex));
async function switchSex(sex) {
  if (sex === state.sex) return;
  exitQuiz();
  for (const b of document.querySelectorAll('[data-sex]')) { b.classList.toggle('active', b.dataset.sex === sex); b.setAttribute('aria-checked', String(b.dataset.sex === sex)); }
  const prevSel = state.selection;
  if (model()) model().group.visible = false;
  state.sex = sex;
  state.hovered = null;
  const p = loadModel(sex);
  model().group.visible = true;
  state.selection = null;
  renderInfo();
  applyState();
  setView('front');
  await p;
  showLoading(false);
  renderSystems(); renderIndex();
  if (prevSel && model().byId.has(prevSel.id)) select(prevSel.id, prevSel.key && model().byKey.has(prevSel.key) ? prevSel.key : null);
  applyState();
}

// ------------------------------------------------------------------ Modo estudio (autoevaluación)
$('#btn-quiz').addEventListener('click', () => (state.quiz ? exitQuiz() : startQuiz()));
function startQuiz() {
  state.selection = null; state.isolate = false;
  state.quiz = { score: 0, total: 0, keys: null, answered: false };
  $('#btn-quiz').classList.add('on');
  nextQuestion();
}
function exitQuiz() {
  if (!state.quiz) return;
  state.quiz = null;
  $('#btn-quiz').classList.remove('on');
  renderInfo();
  applyState();
}
function nextQuestion() {
  const m = model();
  const q = state.quiz;
  const pool = [...m.byId.keys()].filter(id => {
    const s = m.byId.get(id)[0].userData.sys;
    return s !== 'piel' && state.sysVisible[s];
  });
  if (pool.length < 4) { renderQuizMessage('Activa al menos un sistema con varias estructuras para estudiar.'); return; }
  const id = pool[Math.floor(Math.random() * pool.length)];
  const meshes = m.byId.get(id);
  const mesh = meshes[Math.floor(Math.random() * meshes.length)];
  const sys = mesh.userData.sys;
  const same = pool.filter(x => x !== id && m.byId.get(x)[0].userData.sys === sys);
  const other = pool.filter(x => x !== id && !same.includes(x));
  const opts = new Set([id]);
  const take = (arr) => { while (opts.size < 4 && arr.length) { const i = Math.floor(Math.random() * arr.length); opts.add(arr.splice(i, 1)[0]); } };
  take(same.slice()); take(other.slice());
  q.id = id; q.keys = new Set([mesh.userData.key]); q.answered = false;
  q.options = [...opts].sort(() => Math.random() - 0.5);
  renderQuiz();
  applyState();
  focusKeys(q.keys, true);
}
function renderQuizMessage(msg) {
  $('#info-empty').classList.add('hidden');
  $('#panel-info').classList.remove('empty');
  const box = $('#info'); box.classList.remove('hidden');
  box.innerHTML = `<div class="info-head"><h2>Modo estudio</h2><button class="close-x" id="quiz-x" aria-label="Salir">${ICON.close}</button></div><p>${esc(msg)}</p>`;
  $('#quiz-x').onclick = exitQuiz;
}
function renderQuiz() {
  const q = state.quiz;
  $('#info-empty').classList.add('hidden');
  $('#panel-info').classList.remove('empty');
  const box = $('#info'); box.classList.remove('hidden');
  box.innerHTML = `<div class="info-head"><h2>Modo estudio</h2><button class="close-x" id="quiz-x" aria-label="Salir del modo estudio">${ICON.close}</button></div>
    <div class="quiz-score"><span>Aciertos <b>${q.score}</b></span><span>Preguntas <b>${q.total}</b></span>${q.total ? `<span><b>${Math.round(100 * q.score / q.total)} %</b></span>` : ''}</div>
    <div class="quiz-q">¿Qué estructura está resaltada?</div>
    <div class="quiz-opts">${q.options.map(o => `<button class="quiz-opt" data-id="${o}">${esc(STRUCTURES[o].n)}</button>`).join('')}</div>
    <div class="quiz-foot hidden" id="quiz-foot"><button class="btn-primary" id="quiz-next">Siguiente</button><button class="btn-ghost" id="quiz-see">Ver ficha</button></div>
    <p class="muted small">Puedes girar y acercar el modelo para identificarla. Se usan los sistemas visibles.</p>`;
  $('#quiz-x').onclick = exitQuiz;
  for (const b of box.querySelectorAll('.quiz-opt')) b.onclick = () => answer(b.dataset.id);
}
function answer(choice) {
  const q = state.quiz;
  if (!q || q.answered) return;
  q.answered = true; q.total++;
  if (choice === q.id) q.score++;
  for (const b of document.querySelectorAll('.quiz-opt')) {
    b.disabled = true;
    if (b.dataset.id === q.id) b.classList.add('right');
    else if (b.dataset.id === choice) b.classList.add('wrong');
  }
  const sc = document.querySelector('.quiz-score');
  sc.innerHTML = `<span>Aciertos <b>${q.score}</b></span><span>Preguntas <b>${q.total}</b></span><span><b>${Math.round(100 * q.score / q.total)} %</b></span>`;
  $('#quiz-foot').classList.remove('hidden');
  $('#quiz-next').onclick = nextQuestion;
  $('#quiz-see').onclick = () => { const id = q.id, k = [...q.keys][0]; exitQuiz(); select(id, k); };
  $('#quiz-next').focus();
}

// ------------------------------------------------------------------ Teclado
window.addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (k === 'escape') { if (state.quiz) exitQuiz(); else if (state.isolate) { state.isolate = false; renderInfo(); applyState(); } else clearSelection(); }
  else if (k === 'f' && state.selection) focusKeys(state.selection.keys);
  else if (k === 'i' && state.selection) { state.isolate = !state.isolate; renderInfo(); applyState(); }
  else if (k === 'h' && state.selection) { for (const kk of state.selection.keys) state.hidden.add(kk); clearSelection(); applyState(); }
  else if (k === 'x') toggleXray();
  else if (['1', '2', '3', '4', '5'].includes(k)) setView(['front', 'back', 'left', 'right', 'top'][Number(k) - 1]);
});

// ------------------------------------------------------------------ Bucle de render
function frame(now) {
  requestAnimationFrame(frame);
  if (tween) {
    const t = Math.min(1, (now - tween.start) / tween.ms);
    const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    camera.position.lerpVectors(tween.p0, tween.p1, e);
    controls.target.lerpVectors(tween.t0, tween.t1, e);
    if (t >= 1) tween = null;
    needsRender = true;
  }
  if (controls.update()) needsRender = true;
  if (hoverEvt) {
    const e = hoverEvt; hoverEvt = null;
    setHover(pick(e.clientX, e.clientY), e);
  }
  if (needsRender) { needsRender = false; renderer.render(scene, camera); }
}
requestAnimationFrame(frame);

// ------------------------------------------------------------------ Inicio
renderSystems();
setView('front', true);
loadModel('M').then(() => {
  showLoading(false);
  renderSystems();
  renderIndex();
  applyState();
  window.__atlasReady = true;
}).catch((err) => {
  $('#loading-title').textContent = 'No se pudo generar el modelo';
  $('#loading-detail').textContent = String(err.message || err).slice(0, 200);
});
$('#panel-info').classList.add('empty');
// Acceso para depuración y pruebas automatizadas
window.__atlas = { state, select, setView, switchSex, toggleSystem, startQuiz, applyState };
