/**
 * MH-Structure — Three.js Background Scene
 * Béton Armé : colonnes, poutres, dalles avec armatures visibles
 */
(function () {

  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  // ── Renderer ──────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x06090F, 1);

  // ── Scene & Camera ────────────────────────────────────
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x06090F, 0.022);

  const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 150);
  camera.position.set(0, 1.5, 20);
  camera.lookAt(0, 0, 0);

  // ── Segment collectors ────────────────────────────────
  // Instead of individual Line objects → batch everything into LineSegments for performance
  const segs = {
    concrete: [],  // blue — béton outlines
    rebar:    [],  // gold — armatures longitudinales
    stirrup:  [],  // gold dim — cadres / étriers
    mesh:     [],  // blue dim — nappe de treillis dalle
  };

  function seg(arr, x1, y1, z1, x2, y2, z2) {
    arr.push(x1, y1, z1, x2, y2, z2);
  }

  function box(arr, cx, cy, cz, w, h, d) {
    const [x1, x2] = [cx - w/2, cx + w/2];
    const [y1, y2] = [cy - h/2, cy + h/2];
    const [z1, z2] = [cz - d/2, cz + d/2];
    // bottom ring
    seg(arr, x1,y1,z1, x2,y1,z1); seg(arr, x2,y1,z1, x2,y1,z2);
    seg(arr, x2,y1,z2, x1,y1,z2); seg(arr, x1,y1,z2, x1,y1,z1);
    // top ring
    seg(arr, x1,y2,z1, x2,y2,z1); seg(arr, x2,y2,z1, x2,y2,z2);
    seg(arr, x2,y2,z2, x1,y2,z2); seg(arr, x1,y2,z2, x1,y2,z1);
    // verticals
    seg(arr, x1,y1,z1, x1,y2,z1); seg(arr, x2,y1,z1, x2,y2,z1);
    seg(arr, x2,y1,z2, x2,y2,z2); seg(arr, x1,y1,z2, x1,y2,z2);
  }

  function makeLS(arr, color, opacity) {
    if (!arr.length) return null;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(arr), 3));
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
    return new THREE.LineSegments(geo, mat);
  }

  // ── Building parameters ───────────────────────────────
  const W  = 7.0;   // plan width
  const D  = 4.5;   // plan depth
  const fH = 2.2;   // floor height
  const nF = 5;     // number of floors

  const cW = 0.45, cD = 0.45;   // column cross-section (45×45 cm)
  const bH = 0.50, bW = 0.35;   // beam height/width (50×35 cm)
  const sH = 0.18;               // slab thickness

  // Column plan positions [x, z]
  const cols = [
    [-W/2, -D/2], [0, -D/2], [W/2, -D/2],
    [-W/2,  D/2], [0,  D/2], [W/2,  D/2],
  ];

  const building = new THREE.Group();

  // ── Columns ───────────────────────────────────────────
  const totalH = nF * fH;
  const barOff = 0.14;  // distance armature longitudinale / face

  cols.forEach(([cx, cz]) => {

    // Béton outline (full height)
    box(segs.concrete, cx, totalH/2, cz, cW, totalH, cD);

    // Armatures longitudinales (4 barres)
    const barPos = [
      [cx - barOff, cz - barOff],
      [cx + barOff, cz - barOff],
      [cx - barOff, cz + barOff],
      [cx + barOff, cz + barOff],
    ];
    barPos.forEach(([bx, bz]) => {
      seg(segs.rebar, bx, 0, bz, bx, totalH, bz);
    });

    // Cadres / étriers (carrés à intervalle régulier)
    const stirrupStep = 0.28;
    const s = barOff + 0.03;
    for (let y = stirrupStep / 2; y < totalH; y += stirrupStep) {
      seg(segs.stirrup, cx-s, y, cz-s, cx+s, y, cz-s);
      seg(segs.stirrup, cx+s, y, cz-s, cx+s, y, cz+s);
      seg(segs.stirrup, cx+s, y, cz+s, cx-s, y, cz+s);
      seg(segs.stirrup, cx-s, y, cz+s, cx-s, y, cz-s);
    }
  });

  // ── Poutres & dalles par niveau ───────────────────────
  for (let f = 1; f <= nF; f++) {
    const floorY = f * fH;
    const bCY    = floorY - bH / 2;  // centre Y de la poutre

    // — Poutres longitudinales (parallèles à X) front & back —
    [-D/2, D/2].forEach(pz => {
      const pLen = W - cW;

      // Béton outline
      box(segs.concrete, 0, bCY, pz, pLen, bH, bW);

      // Armatures longitudinales : 2 barres filantes hautes + 2 basses
      const pX1 = -pLen/2, pX2 = pLen/2;
      const yTop = bCY + bH/2 - 0.07;
      const yBot = bCY - bH/2 + 0.07;
      const zOff = 0.06;
      seg(segs.rebar, pX1, yTop,  pz - zOff, pX2, yTop,  pz - zOff);
      seg(segs.rebar, pX1, yTop,  pz + zOff, pX2, yTop,  pz + zOff);
      seg(segs.rebar, pX1, yBot,  pz,         pX2, yBot,  pz);

      // Étriers de poutre (section en U transversale)
      const eStep = 0.32;
      const ew = bW/2 - 0.05, eh = bH/2 - 0.05;
      for (let ex = pX1 + eStep/2; ex < pX2; ex += eStep) {
        seg(segs.stirrup, ex, bCY-eh, pz-ew, ex, bCY+eh, pz-ew);
        seg(segs.stirrup, ex, bCY+eh, pz-ew, ex, bCY+eh, pz+ew);
        seg(segs.stirrup, ex, bCY+eh, pz+ew, ex, bCY-eh, pz+ew);
        seg(segs.stirrup, ex, bCY-eh, pz+ew, ex, bCY-eh, pz-ew);
      }
    });

    // — Poutres transversales (parallèles à Z) gauche & droite —
    [-W/2, W/2].forEach(px => {
      const pLen = D - cD;

      box(segs.concrete, px, bCY, 0, bW, bH, pLen);

      const pZ1 = -pLen/2, pZ2 = pLen/2;
      const yTop = bCY + bH/2 - 0.07;
      const yBot = bCY - bH/2 + 0.07;
      seg(segs.rebar, px, yTop, pZ1, px, yTop, pZ2);
      seg(segs.rebar, px, yBot, pZ1, px, yBot, pZ2);

      const eStep = 0.32;
      const ew = bW/2 - 0.05, eh = bH/2 - 0.05;
      for (let ez = pZ1 + eStep/2; ez < pZ2; ez += eStep) {
        seg(segs.stirrup, px-ew, bCY-eh, ez, px-ew, bCY+eh, ez);
        seg(segs.stirrup, px-ew, bCY+eh, ez, px+ew, bCY+eh, ez);
        seg(segs.stirrup, px+ew, bCY+eh, ez, px+ew, bCY-eh, ez);
        seg(segs.stirrup, px+ew, bCY-eh, ez, px-ew, bCY-eh, ez);
      }
    });

    // — Dalle BA avec nappe de treillis —
    const dY = floorY - sH/2;
    box(segs.concrete, 0, dY, 0, W, sH, D);

    // Nappe inférieure (parallèle X)
    const meshStep = 0.40;
    const my = dY - sH/2 + 0.06;
    for (let mz = -D/2 + meshStep; mz < D/2; mz += meshStep) {
      seg(segs.mesh, -W/2, my, mz, W/2, my, mz);
    }
    // Nappe inférieure (parallèle Z)
    for (let mx = -W/2 + meshStep; mx < W/2; mx += meshStep) {
      seg(segs.mesh, mx, my, -D/2, mx, my, D/2);
    }
    // Nappe supérieure (aux appuis — sur les poutres)
    const my2 = dY + sH/2 - 0.06;
    const supW = 1.6; // zone d'armature supérieure aux appuis
    cols.forEach(([cx, cz]) => {
      seg(segs.mesh, cx - supW/2, my2, cz - supW/2, cx + supW/2, my2, cz - supW/2);
      seg(segs.mesh, cx + supW/2, my2, cz - supW/2, cx + supW/2, my2, cz + supW/2);
      seg(segs.mesh, cx + supW/2, my2, cz + supW/2, cx - supW/2, my2, cz + supW/2);
      seg(segs.mesh, cx - supW/2, my2, cz + supW/2, cx - supW/2, my2, cz - supW/2);
    });
  }

  // ── Assemble LineSegments ─────────────────────────────
  const lsConcrete = makeLS(segs.concrete, 0x1E5A9A, 0.45);
  const lsRebar    = makeLS(segs.rebar,    0xC9A84C, 0.85);
  const lsStirrup  = makeLS(segs.stirrup,  0xC9A84C, 0.32);
  const lsMesh     = makeLS(segs.mesh,     0x1A4070, 0.28);

  [lsConcrete, lsRebar, lsStirrup, lsMesh].forEach(ls => { if (ls) building.add(ls); });

  // Center building vertically
  building.position.y = -totalH / 2;
  scene.add(building);

  // ── Ground grid ───────────────────────────────────────
  const groundGrid = new THREE.GridHelper(50, 28, 0x102040, 0x0D1B30);
  groundGrid.position.y = -totalH / 2 - 0.15;
  groundGrid.material.transparent = true;
  groundGrid.material.opacity = 0.2;
  scene.add(groundGrid);

  // ── Nœuds dorés aux jonctions poteaux/poutres ─────────
  const nodeArr = [];
  cols.forEach(([cx, cz]) => {
    const bOff = barOff;
    [[cx-bOff,cz-bOff],[cx+bOff,cz-bOff],[cx-bOff,cz+bOff],[cx+bOff,cz+bOff]].forEach(([bx,bz]) => {
      for (let f = 0; f <= nF; f++) {
        nodeArr.push(bx, f * fH + building.position.y, bz);
      }
    });
  });
  const nodeGeo = new THREE.BufferGeometry();
  nodeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nodeArr), 3));
  const nodeMat = new THREE.PointsMaterial({ color: 0xC9A84C, size: 0.09, transparent: true, opacity: 0.9, sizeAttenuation: true });
  scene.add(new THREE.Points(nodeGeo, nodeMat));

  // ── Particules flottantes ─────────────────────────────
  const PTS = 260;
  const ptPos = new Float32Array(PTS * 3);
  for (let i = 0; i < PTS; i++) {
    ptPos[i*3]   = (Math.random() - 0.5) * 42;
    ptPos[i*3+1] = (Math.random() - 0.5) * 26;
    ptPos[i*3+2] = (Math.random() - 0.5) * 26;
  }
  const ptGeo = new THREE.BufferGeometry();
  ptGeo.setAttribute('position', new THREE.BufferAttribute(ptPos, 3));
  const ptMat = new THREE.PointsMaterial({ color: 0x2A5A9A, size: 0.06, transparent: true, opacity: 0.45 });
  scene.add(new THREE.Points(ptGeo, ptMat));

  // ── Mouse parallax ─────────────────────────────────────
  let mX = 0, mY = 0, tX = 0, tY = 0;
  document.addEventListener('mousemove', e => {
    mX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  let scrollY = 0;
  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

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

    // 360° rotation continue
    building.rotation.y = t * 0.065;

    // Mouse parallax (smooth damp)
    tX += (mX - tX) * 0.025;
    tY += (mY - tY) * 0.025;
    camera.position.x = tX * 2.5;
    camera.position.y = 1.5 + tY * 1.5 - scrollY * 0.003;
    camera.lookAt(0, 0, 0);

    // Pulsing animations
    if (lsConcrete) lsConcrete.material.opacity = 0.35 + Math.sin(t * 0.45) * 0.12;
    if (lsRebar)    lsRebar.material.opacity    = 0.72 + Math.sin(t * 0.80) * 0.18;
    if (lsStirrup)  lsStirrup.material.opacity  = 0.22 + Math.sin(t * 0.60) * 0.10;
    nodeMat.opacity = 0.70 + Math.sin(t * 1.20) * 0.22;
    ptMat.opacity   = 0.35 + Math.sin(t * 0.40) * 0.10;

    renderer.render(scene, camera);
  }

  animate();

})();
