/**
 * MH-Structure — Three.js Background Scene
 * Animated structural wireframe building (BIM-style)
 */
(function () {

  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  // ── Renderer ──────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x070C14, 1);

  // ── Scene & Camera ────────────────────────────────────
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x070C14, 0.028);

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 120);
  camera.position.set(0, 2, 18);
  camera.lookAt(0, 0, 0);

  // ── Materials ─────────────────────────────────────────
  const matColumn = new THREE.LineBasicMaterial({ color: 0xC9A84C, transparent: true, opacity: 0.65 });
  const matBeam   = new THREE.LineBasicMaterial({ color: 0x1E4A8A, transparent: true, opacity: 0.55 });
  const matSlab   = new THREE.LineBasicMaterial({ color: 0x234E80, transparent: true, opacity: 0.40 });
  const matBrace  = new THREE.LineBasicMaterial({ color: 0xC9A84C, transparent: true, opacity: 0.15 });
  const matGrid   = new THREE.LineBasicMaterial({ color: 0x1A3A6A, transparent: true, opacity: 0.18 });

  // ── Building Structure ────────────────────────────────
  const building = new THREE.Group();

  const W  = 6;    // width
  const D  = 3.8;  // depth
  const fH = 1.7;  // floor height
  const nF = 6;    // number of floors

  // Column plan positions [x, z]
  const colGrid = [
    [-W/2, -D/2], [0, -D/2], [W/2, -D/2],
    [-W/2,  D/2], [0,  D/2], [W/2,  D/2],
  ];

  // Helper: create a line from p1 to p2
  function makeLine(p1, p2, mat) {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(...p1),
      new THREE.Vector3(...p2),
    ]);
    return new THREE.Line(geo, mat);
  }

  // Vertical columns
  colGrid.forEach(([x, z], i) => {
    const isCorner = (i === 0 || i === 2 || i === 3 || i === 5);
    const mat = isCorner ? matColumn : new THREE.LineBasicMaterial({ color: 0xC9A84C, transparent: true, opacity: 0.35 });
    building.add(makeLine([x, 0, z], [x, nF * fH, z], mat));
  });

  // Horizontal floor framing
  for (let f = 0; f <= nF; f++) {
    const y = f * fH;
    const isTop = f === nF;
    const mat  = isTop ? matColumn : matSlab;

    // Perimeter rectangle
    const corners = [
      [-W/2, y, -D/2], [W/2, y, -D/2],
      [W/2,  y,  D/2], [-W/2, y,  D/2],
      [-W/2, y, -D/2],
    ];
    const periGeo = new THREE.BufferGeometry().setFromPoints(
      corners.map(p => new THREE.Vector3(...p))
    );
    building.add(new THREE.Line(periGeo, mat));

    // Interior beam (longitudinal)
    building.add(makeLine([0, y, -D/2], [0, y, D/2], matBeam));

    // Interior beam (transverse)
    building.add(makeLine([-W/2, y, 0], [W/2, y, 0], matBeam));

    // Slab subdivision grid (every 2 floors to keep it clean)
    if (!isTop && f % 2 === 0) {
      for (let gx = -W/2 + W/4; gx < W/2; gx += W/4) {
        building.add(makeLine([gx, y, -D/2], [gx, y, D/2], matGrid));
      }
      for (let gz = -D/2 + D/3; gz < D/2; gz += D/3) {
        building.add(makeLine([-W/2, y, gz], [W/2, y, gz], matGrid));
      }
    }
  }

  // X-bracing on front & back faces (structural bracing)
  const braceData = [
    // Front face (z = -D/2)
    [[-W/2, 0,     -D/2], [0,    fH,    -D/2]],
    [[0,    0,     -D/2], [-W/2, fH,    -D/2]],
    [[0,    fH*2,  -D/2], [W/2,  fH*3,  -D/2]],
    [[W/2,  fH*2,  -D/2], [0,    fH*3,  -D/2]],
    // Back face (z = D/2)
    [[-W/2, fH*3,   D/2], [0,    fH*4,   D/2]],
    [[0,    fH*3,   D/2], [-W/2, fH*4,   D/2]],
  ];
  braceData.forEach(([p1, p2]) => building.add(makeLine(p1, p2, matBrace)));

  // Center the building vertically
  building.position.y = -(nF * fH) / 2;
  scene.add(building);

  // ── Ground grid ───────────────────────────────────────
  const groundGrid = new THREE.GridHelper(40, 24, 0x102040, 0x0D1B30);
  groundGrid.position.y = -(nF * fH) / 2 - 0.1;
  groundGrid.material.transparent = true;
  groundGrid.material.opacity = 0.25;
  scene.add(groundGrid);

  // ── Floating particles ────────────────────────────────
  const PTS = 280;
  const posArr = new Float32Array(PTS * 3);
  for (let i = 0; i < PTS; i++) {
    posArr[i*3]   = (Math.random() - 0.5) * 36;
    posArr[i*3+1] = (Math.random() - 0.5) * 22;
    posArr[i*3+2] = (Math.random() - 0.5) * 22;
  }
  const ptGeo = new THREE.BufferGeometry();
  ptGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
  const ptMat = new THREE.PointsMaterial({ color: 0x2A5A9A, size: 0.06, transparent: true, opacity: 0.5 });
  scene.add(new THREE.Points(ptGeo, ptMat));

  // Accent gold nodes at column tops/bottoms
  const nodePts = [];
  colGrid.forEach(([x, z]) => {
    for (let f = 0; f <= nF; f++) {
      nodePts.push(x, f * fH + building.position.y, z);
    }
  });
  const nodeGeo = new THREE.BufferGeometry();
  nodeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nodePts), 3));
  const nodeMat = new THREE.PointsMaterial({ color: 0xC9A84C, size: 0.12, transparent: true, opacity: 0.8 });
  scene.add(new THREE.Points(nodeGeo, nodeMat));

  // ── Mouse parallax ─────────────────────────────────────
  let mX = 0, mY = 0, tX = 0, tY = 0;
  document.addEventListener('mousemove', (e) => {
    mX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // ── Scroll tracking ────────────────────────────────────
  let scrollY = 0;
  window.addEventListener('scroll', () => { scrollY = window.scrollY; });

  // ── Resize ─────────────────────────────────────────────
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ── Animation loop ─────────────────────────────────────
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Slow auto-rotation
    building.rotation.y = t * 0.07;

    // Mouse parallax (smooth damp)
    tX += (mX - tX) * 0.025;
    tY += (mY - tY) * 0.025;

    camera.position.x = tX * 2.5;
    camera.position.y = 2 + tY * 1.5 - scrollY * 0.003;
    camera.lookAt(0, 0, 0);

    // Pulsing opacity on gold columns
    matColumn.opacity = 0.5 + Math.sin(t * 0.6) * 0.18;
    nodeMat.opacity   = 0.6 + Math.sin(t * 1.2) * 0.25;

    // Slow particle drift
    ptMat.opacity = 0.35 + Math.sin(t * 0.4) * 0.12;

    renderer.render(scene, camera);
  }

  animate();

})();
