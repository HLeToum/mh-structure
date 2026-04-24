/**
 * MH Structure — Villa 3D Scene
 * Rendu photo-réaliste Three.js r163
 * 3 ambiances × 4 angles de caméra | Pool · Jardin · Villa
 */

import * as THREE from 'three';
import { GLTFLoader }        from 'three/addons/loaders/GLTFLoader.js';
import { Sky }               from 'three/addons/objects/Sky.js';
import { RoomEnvironment }   from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer }    from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }        from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass }   from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass }        from 'three/addons/postprocessing/OutputPass.js';
import { MeshoptDecoder }    from 'three/addons/libs/meshopt_decoder.module.js';

// ── Constantes ─────────────────────────────────────────────────────────────

const VILLA_SCALE = 14;

const CAM_ANGLES = [
  { pos: [0,    5,   38], target: [0, 5, 0],  label: 'Façade principale' },
  { pos: [24,  28,   26], target: [0, 4, 0],  label: 'Vue aérienne'      },
  { pos: [-30,  4,   10], target: [0, 5, 0],  label: 'Jardin & piscine'  },
  { pos: [26,   8,  -24], target: [0, 5, 0],  label: 'Vue d\'angle'      },
];

const AMBIANCES = {
  day: {
    sky:     { turbidity: 1.2, rayleigh: 0.6, mieCoeff: 0.004, mieG: 0.82, elevation: 52, azimuth: 185 },
    sun:     { color: 0xfff6d6, intensity: 5.5, castShadow: true },
    ambient: { sky: 0x87ceeb, ground: 0x4a8040, intensity: 1.0 },
    fog:     { color: 0xc8e8ff, near: 60, far: 240 },
    bg:      0xb0d4f1,
    bloom:   { threshold: 0.88, strength: 0.3, radius: 0.5 },
  },
  sunset: {
    sky:     { turbidity: 9, rayleigh: 3.2, mieCoeff: 0.028, mieG: 0.92, elevation: 4, azimuth: 265 },
    sun:     { color: 0xff5500, intensity: 3.5, castShadow: true },
    ambient: { sky: 0xff7733, ground: 0x331100, intensity: 0.9 },
    fog:     { color: 0xff8844, near: 40, far: 180 },
    bg:      0xff6622,
    bloom:   { threshold: 0.55, strength: 1.4, radius: 1.0 },
  },
  night: {
    sky:     null,
    moon:    { color: 0x8ab6d9, intensity: 1.8, castShadow: false },
    ambient: { sky: 0x0a1830, ground: 0x020508, intensity: 0.55 },
    fog:     { color: 0x030810, near: 30, far: 120 },
    bg:      0x04060e,
    bloom:   { threshold: 0.42, strength: 0.9, radius: 1.2 },
    stars:   true,
  },
};

const IS_MOBILE = window.innerWidth < 768 ||
  /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

// ── State ──────────────────────────────────────────────────────────────────

let renderer, scene, camera, composer, bloomPass;
let sunLight, moonLight, hemiLight;
let skyObj, starsObj;
let pmremGenerator, envMapDay, envMapSunset, envMapNight;
let camTarget = new THREE.Vector3();
let currentAmb    = 'day';
let currentCamIdx = 0;
let camTween, ambTimer;
let _gsap;

// ── Boot ───────────────────────────────────────────────────────────────────

function boot() {
  _gsap = window.gsap;
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  // WebGL check
  try {
    const ctx = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!ctx) return;
  } catch (_) { return; }

  canvas.style.opacity = '0';
  canvas.style.transition = 'opacity 1.4s ease';

  buildRenderer(canvas);
  buildScene();
  buildLights();
  buildGround();
  buildPool();
  buildTrees();
  buildSky();
  buildEnvMaps();   // ← PMREM env maps for PBR textures
  buildPostProcessing();

  loadVilla().then(() => {
    applyAmbiance('day', true);
    startCycling();
    renderLoop();
    // Fade in once ready
    requestAnimationFrame(() => { canvas.style.opacity = '1'; });
  });

  handleResize();
  window.addEventListener('resize', handleResize);
  wireControls();

  // Theme hook for main.js compatibility (no-op, villa has its own lighting)
  window.mhSceneSetTheme = () => {};
}

// ── Renderer ───────────────────────────────────────────────────────────────

function buildRenderer(canvas) {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !IS_MOBILE,
    powerPreference: 'high-performance',
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(IS_MOBILE ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = !IS_MOBILE;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
}

// ── Scene & Camera ─────────────────────────────────────────────────────────

function buildScene() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );
  const c0 = CAM_ANGLES[0];
  camera.position.set(...c0.pos);
  camTarget.set(...c0.target);
  camera.lookAt(camTarget);
}

// ── Lights ─────────────────────────────────────────────────────────────────

function buildLights() {
  hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x4a8040, 1.0);
  scene.add(hemiLight);

  sunLight = new THREE.DirectionalLight(0xfff6d6, 5.5);
  sunLight.castShadow = !IS_MOBILE;
  sunLight.shadow.mapSize.set(IS_MOBILE ? 512 : 2048, IS_MOBILE ? 512 : 2048);
  sunLight.shadow.camera.near   = 1;
  sunLight.shadow.camera.far    = 200;
  sunLight.shadow.camera.left   = -40;
  sunLight.shadow.camera.right  = 40;
  sunLight.shadow.camera.top    = 40;
  sunLight.shadow.camera.bottom = -40;
  sunLight.shadow.bias = -0.001;
  scene.add(sunLight);

  moonLight = new THREE.DirectionalLight(0x8ab6d9, 1.8);
  moonLight.visible = false;
  scene.add(moonLight);
}

// ── Ground ─────────────────────────────────────────────────────────────────

function buildGround() {
  // Grass lawn
  const grassGeo = new THREE.PlaneGeometry(200, 200);
  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x3d7a2a,
    roughness: 0.92,
    metalness: 0.0,
  });
  const grass = new THREE.Mesh(grassGeo, grassMat);
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;
  scene.add(grass);

  // Paved area around villa / pool
  const paveGeo = new THREE.PlaneGeometry(36, 40);
  const paveMat = new THREE.MeshStandardMaterial({
    color: 0xd0c8bc,
    roughness: 0.85,
    metalness: 0.0,
  });
  const pave = new THREE.Mesh(paveGeo, paveMat);
  pave.rotation.x = -Math.PI / 2;
  pave.position.y  = 0.01;
  pave.receiveShadow = true;
  scene.add(pave);
}

// ── Pool ───────────────────────────────────────────────────────────────────

function buildPool() {
  // Pool surround (stone/concrete deck)
  const deckGeo = new THREE.BoxGeometry(11, 0.3, 16);
  const deckMat = new THREE.MeshStandardMaterial({
    color: 0xc8c0b0,
    roughness: 0.8,
  });
  const deck = new THREE.Mesh(deckGeo, deckMat);
  deck.position.set(16, 0.15, -6);
  deck.castShadow = false;
  deck.receiveShadow = true;
  scene.add(deck);

  // Water surface
  const waterGeo = new THREE.PlaneGeometry(8.4, 13.4);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x1a6fa8,
    roughness: 0.05,
    metalness: 0.6,
    transparent: true,
    opacity: 0.88,
    envMapIntensity: 1.2,
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(16, 0.31, -6);
  scene.add(water);

  // Pool walls (inner box)
  const wallGeo = new THREE.BoxGeometry(8.4, 1.2, 13.4);
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x5bb8e8,
    roughness: 0.3,
    metalness: 0.1,
    side: THREE.BackSide,
  });
  const walls = new THREE.Mesh(wallGeo, wallMat);
  walls.position.set(16, -0.3, -6);
  scene.add(walls);

  // Underwater point light (pool glow)
  const poolLight = new THREE.PointLight(0x40b0ff, 3, 20, 2);
  poolLight.position.set(16, -0.5, -6);
  scene.add(poolLight);
}

// ── Trees & Vegetation ─────────────────────────────────────────────────────

function makeTree(x, z, h = 1, variety = 0) {
  const g = new THREE.Group();

  // Trunk
  const trunkH   = 2.0 * h;
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3820, roughness: 0.9 });
  const trunk    = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18 * h, 0.28 * h, trunkH, 7),
    trunkMat,
  );
  trunk.position.y = trunkH / 2;
  trunk.castShadow = true;
  g.add(trunk);

  // Canopy (2-3 overlapping spheres)
  const leafColors = [0x2d6b1c, 0x3a8022, 0x256018];
  const leafMat    = new THREE.MeshStandardMaterial({
    color: leafColors[variety % 3],
    roughness: 0.95,
  });
  const layers = variety === 1 ? 2 : 3;
  for (let i = 0; i < layers; i++) {
    const r    = (1.6 - i * 0.25) * h;
    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(r, 9, 7),
      leafMat,
    );
    leaf.position.y = trunkH + i * 1.1 * h - 0.4;
    leaf.position.x = (Math.random() - 0.5) * 0.6 * h;
    leaf.position.z = (Math.random() - 0.5) * 0.6 * h;
    leaf.castShadow = true;
    g.add(leaf);
  }

  g.position.set(x, 0, z);
  return g;
}

function buildTrees() {
  const placements = [
    // Left hedge line
    [-20, -18, 1.2, 0], [-20, -10, 1.0, 2], [-20, -2, 1.1, 1],
    [-20,   6, 1.3, 0], [-20,  14, 0.9, 2],
    // Right side
    [ 26, -20, 1.1, 1], [ 26, -10, 1.3, 0], [ 26,  4, 1.0, 2],
    // Back row
    [-10, -22, 1.4, 0], [  0, -24, 1.2, 1], [ 10, -22, 1.1, 2],
    [ 18, -22, 1.3, 0],
    // Front accent trees
    [-12,  20, 0.8, 2], [ 12,  20, 0.8, 1],
  ];
  placements.forEach(([x, z, h, v]) => {
    if (IS_MOBILE && Math.random() > 0.5) return; // fewer trees on mobile
    scene.add(makeTree(x, z, h, v));
  });

  // Bushes
  const bushMat = new THREE.MeshStandardMaterial({ color: 0x2a5c14, roughness: 0.95 });
  const bushPositions = [
    [-8, 16], [8, 16], [-6, -14], [6, -14],
    [20, 2], [20, -14], [12, -20], [-4, -20],
  ];
  bushPositions.forEach(([x, z]) => {
    const r    = 0.5 + Math.random() * 0.4;
    const bush = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), bushMat);
    bush.scale.y = 0.65;
    bush.position.set(x, r * 0.65, z);
    bush.castShadow = true;
    scene.add(bush);
  });
}

// ── Sky ────────────────────────────────────────────────────────────────────

function buildSky() {
  skyObj = new Sky();
  skyObj.scale.setScalar(900);
  scene.add(skyObj);
}

// ── PMREM Environment Maps ─────────────────────────────────────────────────
// Génère 3 env maps (une par ambiance) depuis le ciel + RoomEnvironment.
// C'est ce qui donne les réflexions, la profondeur des matériaux PBR du GLB.

function buildEnvMaps() {
  pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileCubemapShader();

  // Env de base (RoomEnvironment neutre) — utilisée en fallback
  const roomEnv = new RoomEnvironment(renderer);

  // Day env : lumière chaude/blanche + ciel bleu
  {
    const s = new THREE.Scene();
    s.background = new THREE.Color(0x87ceeb);
    const hemi = new THREE.HemisphereLight(0x87ceeb, 0x3d7a2a, 4);
    const dir  = new THREE.DirectionalLight(0xfff6d6, 6);
    dir.position.set(1, 2, 1);
    s.add(hemi, dir);
    envMapDay = pmremGenerator.fromScene(s).texture;
    s.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  }

  // Sunset env : lumières chaudes orangées
  {
    const s = new THREE.Scene();
    s.background = new THREE.Color(0xff6622);
    const hemi = new THREE.HemisphereLight(0xff7733, 0x331100, 3);
    const dir  = new THREE.DirectionalLight(0xff5500, 5);
    dir.position.set(-1, 0.3, 1);
    s.add(hemi, dir);
    envMapSunset = pmremGenerator.fromScene(s).texture;
    s.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  }

  // Night env : lune froide bleue
  {
    const s = new THREE.Scene();
    s.background = new THREE.Color(0x040810);
    const hemi = new THREE.HemisphereLight(0x0a1830, 0x020508, 1.5);
    const moon = new THREE.DirectionalLight(0x8ab6d9, 2.5);
    moon.position.set(-1, 2, -0.5);
    s.add(hemi, moon);
    envMapNight = pmremGenerator.fromScene(s).texture;
    s.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  }

  // Par défaut jour
  scene.environment = envMapDay;
  roomEnv.dispose();
}

function setSkyPreset(preset) {
  const u = skyObj.material.uniforms;
  u['turbidity'].value      = preset.turbidity;
  u['rayleigh'].value       = preset.rayleigh;
  u['mieCoefficient'].value = preset.mieCoeff;
  u['mieDirectionalG'].value= preset.mieG;

  const phi   = THREE.MathUtils.degToRad(90 - preset.elevation);
  const theta = THREE.MathUtils.degToRad(preset.azimuth);
  const sun   = new THREE.Vector3();
  sun.setFromSphericalCoords(1, phi, theta);
  u['sunPosition'].value.copy(sun);
  return sun;
}

// ── Stars (night) ──────────────────────────────────────────────────────────

function buildStars() {
  if (starsObj) return;
  const count = IS_MOBILE ? 800 : 2200;
  const verts = [];
  for (let i = 0; i < count; i++) {
    const theta  = Math.random() * Math.PI * 2;
    const phi    = Math.acos(2 * Math.random() - 1);
    const radius = 400 + Math.random() * 200;
    verts.push(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi),
    );
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, sizeAttenuation: true });
  starsObj = new THREE.Points(geo, mat);
  scene.add(starsObj);
}

// ── Post-processing ────────────────────────────────────────────────────────

function buildPostProcessing() {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.3, 0.5, 0.88,
  );
  if (!IS_MOBILE) composer.addPass(bloomPass);

  composer.addPass(new OutputPass());
}

// ── Villa GLB ──────────────────────────────────────────────────────────────

async function loadVilla() {
  await MeshoptDecoder.ready;
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);

    // Loading bar
    const bar = document.getElementById('villa-load-bar');

    loader.load(
      'models/villa.glb',
      (gltf) => {
        const model = gltf.scene;

        // Scale and center
        const box    = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size   = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale  = (VILLA_SCALE * 2) / maxDim;

        model.scale.setScalar(scale);
        model.position.set(
          -center.x * scale,
          -box.min.y * scale,
          -center.z * scale,
        );

        // PBR quality + shadows + env map intensity sur chaque mesh
        model.traverse((child) => {
          if (!child.isMesh) return;
          child.castShadow    = !IS_MOBILE;
          child.receiveShadow = !IS_MOBILE;

          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((mat) => {
            if (!mat) return;
            // Boost env map reflections (PBR réaliste)
            mat.envMapIntensity = 1.4;
            // Activer le tone mapping correct
            mat.toneMapped = true;
            // Force refresh
            mat.needsUpdate = true;
          });
        });

        scene.add(model);

        // Hide loading indicator
        if (bar) bar.parentElement.style.display = 'none';
        resolve(model);
      },
      (xhr) => {
        if (bar && xhr.total > 0) {
          bar.style.width = `${(xhr.loaded / xhr.total * 100).toFixed(0)}%`;
        }
      },
      (err) => {
        console.error('[villa-scene] GLB load error:', err);
        if (bar) bar.parentElement.style.display = 'none';
        reject(err);
      },
    );
  });
}

// ── Ambiance ───────────────────────────────────────────────────────────────

function applyAmbiance(name, instant = false) {
  currentAmb = name;
  const amb = AMBIANCES[name];

  // Background & fog
  renderer.setClearColor(amb.bg, 1);
  scene.fog = new THREE.Fog(amb.fog.color, amb.fog.near, amb.fog.far);
  scene.background = new THREE.Color(amb.bg);

  // Env map pour réflexions PBR
  if (pmremGenerator) {
    scene.environment = name === 'night'  ? envMapNight
                      : name === 'sunset' ? envMapSunset
                      : envMapDay;
  }

  // Hemisphere (sky/ground fill)
  hemiLight.color.set(amb.ambient.sky);
  hemiLight.groundColor.set(amb.ambient.ground);
  hemiLight.intensity = amb.ambient.intensity;

  // Sky / stars toggle
  if (amb.sky) {
    skyObj.visible = true;
    if (starsObj) starsObj.visible = false;
    const sunDir = setSkyPreset(amb.sky);
    sunLight.position.copy(sunDir).multiplyScalar(80);
    sunLight.color.set(amb.sun.color);
    sunLight.intensity = amb.sun.intensity;
    sunLight.visible   = true;
    moonLight.visible  = false;
  } else {
    // Night
    skyObj.visible = false;
    buildStars();
    if (starsObj) starsObj.visible = true;
    moonLight.position.set(-60, 80, -40);
    moonLight.color.set(amb.moon.color);
    moonLight.intensity = amb.moon.intensity;
    moonLight.visible   = true;
    sunLight.visible    = false;
  }

  // Bloom
  if (bloomPass) {
    bloomPass.threshold = amb.bloom.threshold;
    bloomPass.strength  = amb.bloom.strength;
    bloomPass.radius    = amb.bloom.radius;
  }

  // Tone mapping exposure
  renderer.toneMappingExposure = name === 'night' ? 0.65 : name === 'sunset' ? 1.15 : 1.0;

  // UI update
  document.querySelectorAll('.ambiance-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.ambiance === name);
  });
}

// ── Camera Animation ───────────────────────────────────────────────────────

const _tmpPos    = new THREE.Vector3();
const _tmpTarget = new THREE.Vector3();

function moveCameraTo(idx, duration = 2.2) {
  if (!_gsap) return;
  const angle = CAM_ANGLES[idx];

  _tmpPos.set(...angle.pos);
  _tmpTarget.set(...angle.target);

  // Proxy object so GSAP can lerp camera.position
  const proxy = {
    px: camera.position.x,
    py: camera.position.y,
    pz: camera.position.z,
    tx: camTarget.x,
    ty: camTarget.y,
    tz: camTarget.z,
  };

  if (camTween) camTween.kill();

  camTween = _gsap.to(proxy, {
    px: _tmpPos.x,    py: _tmpPos.y,    pz: _tmpPos.z,
    tx: _tmpTarget.x, ty: _tmpTarget.y, tz: _tmpTarget.z,
    duration,
    ease: 'power2.inOut',
    onUpdate() {
      camera.position.set(proxy.px, proxy.py, proxy.pz);
      camTarget.set(proxy.tx, proxy.ty, proxy.tz);
      camera.lookAt(camTarget);
    },
  });

  // Update dots
  document.querySelectorAll('.cam-dot').forEach((d, i) => {
    d.classList.toggle('active', i === idx);
  });
}

function startCycling() {
  let angleIdx = 0;
  let ambIdx   = 0;
  const ambs   = ['day', 'sunset', 'night'];
  const HOLD   = 8000; // ms per angle
  const TRANS  = 2200; // ms transition

  function next() {
    angleIdx = (angleIdx + 1) % CAM_ANGLES.length;
    // After a full cycle, advance ambiance
    if (angleIdx === 0) {
      ambIdx = (ambIdx + 1) % ambs.length;
      applyAmbiance(ambs[ambIdx]);
    }
    moveCameraTo(angleIdx);
    ambTimer = setTimeout(next, HOLD + TRANS);
  }

  // Start immediately at angle 0
  moveCameraTo(0, 0.01);
  ambTimer = setTimeout(next, HOLD);
}

// ── Render Loop ────────────────────────────────────────────────────────────

function renderLoop() {
  requestAnimationFrame(renderLoop);
  composer.render();
}

// ── Resize ─────────────────────────────────────────────────────────────────

function handleResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
}

// ── Controls ───────────────────────────────────────────────────────────────

function wireControls() {
  // Ambiance buttons
  document.querySelectorAll('.ambiance-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      applyAmbiance(btn.dataset.ambiance);
    });
  });

  // Camera dots (manual jump)
  document.querySelectorAll('.cam-dot').forEach((dot, i) => {
    dot.addEventListener('click', () => {
      currentCamIdx = i;
      moveCameraTo(i);
    });
  });
}

// ── Entry point ────────────────────────────────────────────────────────────

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
