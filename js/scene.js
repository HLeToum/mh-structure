/**
 * MH-Structure — Three.js Scene v3
 * Béton brut en rotation 360° · Armatures révélées au survol de la souris (effet radio)
 */
(function () {

  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  // ── Renderer ──────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x0F1929, 1);

  // ── Scene & Camera ────────────────────────────────────
  const scene  = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0F1929, 0.016);

  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 2, 24);
  camera.lookAt(0, 0, 0);

  // ── Éclairage ─────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0xCCDDFF, 0.32));

  const sun = new THREE.DirectionalLight(0x99BBDD, 1.1);
  sun.position.set(8, 14, 6);
  scene.add(sun);

  const rim = new THREE.DirectionalLight(0x223355, 0.55);
  rim.position.set(-6, 2, -8);
  scene.add(rim);

  // ── Paramètres bâtiment ───────────────────────────────
  const W = 7.0, D = 4.5, fH = 2.2, nF = 5;
  const cW = 0.45, cD = 0.45;
  const bH = 0.50, bW = 0.35;
  const sH = 0.18;
  const totalH = nF * fH;

  const colPositions = [
    [-W/2, -D/2], [0, -D/2], [W/2, -D/2],
    [-W/2,  D/2], [0,  D/2], [W/2,  D/2],
  ];

  // ── Matériau béton brut ───────────────────────────────
  const concreteMat = new THREE.MeshLambertMaterial({
    color: 0x5A6475,   // gris béton brut
    transparent: true,
    opacity: 0.90,
    depthWrite: true,
  });

  // ── Shaders armatures — effet radio X ─────────────────
  const vsRebar = /* glsl */`
    varying float vNDCx;
    void main() {
      vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      vNDCx = clip.x / clip.w;   // position écran NDC (-1 → +1)
      gl_Position = clip;
    }
  `;

  const fsRebar = /* glsl */`
    uniform float uMouseX;    // position souris NDC
    uniform float uReveal;    // 0→1 : intensité révélation
    uniform vec3  uColor;
    uniform float uBand;      // demi-largeur de la bande de révélation
    varying float vNDCx;
    void main() {
      float d    = abs(vNDCx - uMouseX);
      float band = 1.0 - smoothstep(0.0, uBand, d);
      // Liseré lumineux au bord du scan
      float glow = (1.0 - smoothstep(0.0, uBand * 0.25, d)) * 0.35;
      float alpha = (band + glow) * uReveal;
      if (alpha < 0.015) discard;
      gl_FragColor = vec4(uColor + vec3(glow), alpha);
    }
  `;

  function makeRebarMat(hexColor, band) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uMouseX: { value: 0.0 },
        uReveal: { value: 0.0 },
        uColor:  { value: new THREE.Color(hexColor) },
        uBand:   { value: band },
      },
      vertexShader:   vsRebar,
      fragmentShader: fsRebar,
      transparent: true,
      depthWrite:  false,
      depthTest:   false,   // toujours visible à travers le béton
    });
  }

  const matRebar   = makeRebarMat(0xC9A84C, 0.40);   // barres longit. — or
  const matStirrup = makeRebarMat(0xA07A30, 0.32);   // cadres / étriers
  const matMesh    = makeRebarMat(0x8A6520, 0.28);   // treillis dalle

  // ── Groupes ───────────────────────────────────────────
  const building = new THREE.Group();

  function addConcrete(cx, cy, cz, w, h, d) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), concreteMat);
    m.position.set(cx, cy, cz);
    building.add(m);
  }

  // Collecteurs de segments pour les armatures
  const rb = [], st = [], ms = [];
  function rseg(arr, x1,y1,z1, x2,y2,z2) { arr.push(x1,y1,z1, x2,y2,z2); }

  function buildLS(arr, mat) {
    if (!arr.length) return null;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(arr), 3));
    const ls = new THREE.LineSegments(geo, mat);
    ls.renderOrder = 2;   // rendu après le béton
    return ls;
  }

  // ── Poteaux ───────────────────────────────────────────
  const bOff = 0.14;   // offset armature / axe

  colPositions.forEach(([cx, cz]) => {
    // Volume béton (toute hauteur)
    addConcrete(cx, totalH / 2, cz, cW, totalH, cD);

    // 4 barres longitudinales
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx, sz]) => {
      const bx = cx + sx * bOff, bz = cz + sz * bOff;
      rseg(rb, bx, 0, bz, bx, totalH, bz);
    });

    // Cadres carrés (étriers)
    const s = bOff + 0.03;
    for (let y = 0.14; y < totalH; y += 0.28) {
      rseg(st, cx-s,y,cz-s, cx+s,y,cz-s);
      rseg(st, cx+s,y,cz-s, cx+s,y,cz+s);
      rseg(st, cx+s,y,cz+s, cx-s,y,cz+s);
      rseg(st, cx-s,y,cz+s, cx-s,y,cz-s);
    }
  });

  // ── Poutres & dalles par niveau ───────────────────────
  for (let f = 1; f <= nF; f++) {
    const flY = f * fH;
    const bCY = flY - bH / 2;

    // Poutres longitudinales (parallèles X)
    [-D/2, D/2].forEach(pz => {
      const pLen = W - cW;
      addConcrete(0, bCY, pz, pLen, bH, bW);

      const x1 = -pLen/2, x2 = pLen/2;
      const yT = bCY + bH/2 - 0.07, yB = bCY - bH/2 + 0.07;
      rseg(rb, x1,yT,pz-0.06, x2,yT,pz-0.06);
      rseg(rb, x1,yT,pz+0.06, x2,yT,pz+0.06);
      rseg(rb, x1,yB,pz,      x2,yB,pz);

      const ew = bW/2 - 0.05, eh = bH/2 - 0.05;
      for (let ex = x1+0.16; ex < x2; ex += 0.32) {
        rseg(st, ex,bCY-eh,pz-ew, ex,bCY+eh,pz-ew);
        rseg(st, ex,bCY+eh,pz-ew, ex,bCY+eh,pz+ew);
        rseg(st, ex,bCY+eh,pz+ew, ex,bCY-eh,pz+ew);
        rseg(st, ex,bCY-eh,pz+ew, ex,bCY-eh,pz-ew);
      }
    });

    // Poutres transversales (parallèles Z)
    [-W/2, W/2].forEach(px => {
      const pLen = D - cD;
      addConcrete(px, bCY, 0, bW, bH, pLen);

      const z1 = -pLen/2, z2 = pLen/2;
      const yT = bCY + bH/2 - 0.07, yB = bCY - bH/2 + 0.07;
      rseg(rb, px,yT,z1, px,yT,z2);
      rseg(rb, px,yB,z1, px,yB,z2);

      const ew = bW/2 - 0.05, eh = bH/2 - 0.05;
      for (let ez = z1+0.16; ez < z2; ez += 0.32) {
        rseg(st, px-ew,bCY-eh,ez, px-ew,bCY+eh,ez);
        rseg(st, px-ew,bCY+eh,ez, px+ew,bCY+eh,ez);
        rseg(st, px+ew,bCY+eh,ez, px+ew,bCY-eh,ez);
        rseg(st, px+ew,bCY-eh,ez, px-ew,bCY-eh,ez);
      }
    });

    // Dalle
    addConcrete(0, flY - sH/2, 0, W, sH, D);

    // Nappe de treillis (inférieure)
    const my = flY - sH + 0.06;
    for (let mz = -D/2+0.4; mz < D/2; mz += 0.40) rseg(ms, -W/2,my,mz, W/2,my,mz);
    for (let mx = -W/2+0.4; mx < W/2; mx += 0.40) rseg(ms, mx,my,-D/2, mx,my,D/2);
  }

  // ── Assemblage ────────────────────────────────────────
  [
    buildLS(rb, matRebar),
    buildLS(st, matStirrup),
    buildLS(ms, matMesh),
  ].forEach(ls => { if (ls) building.add(ls); });

  building.position.y = -totalH / 2;
  scene.add(building);

  // ── Grille au sol ─────────────────────────────────────
  const grid = new THREE.GridHelper(60, 32, 0x1A3060, 0x0F1E3A);
  grid.position.y = -totalH / 2 - 0.12;
  grid.material.transparent = true;
  grid.material.opacity = 0.16;
  scene.add(grid);

  // ── Particules flottantes ─────────────────────────────
  const ptPos = new Float32Array(180 * 3);
  for (let i = 0; i < 180; i++) {
    ptPos[i*3]   = (Math.random() - 0.5) * 44;
    ptPos[i*3+1] = (Math.random() - 0.5) * 28;
    ptPos[i*3+2] = (Math.random() - 0.5) * 28;
  }
  const ptGeo = new THREE.BufferGeometry();
  ptGeo.setAttribute('position', new THREE.BufferAttribute(ptPos, 3));
  const ptMat = new THREE.PointsMaterial({ color: 0x2A5A9A, size: 0.055, transparent: true, opacity: 0.25 });
  scene.add(new THREE.Points(ptGeo, ptMat));

  // ── Suivi souris / touch ──────────────────────────────
  let mX = 0, mY = 0, tX = 0, tY = 0;
  let smoothMX = 0, revealAmt = 0, lastMove = 0;

  function onMove(clientX, clientY) {
    mX = (clientX / window.innerWidth  - 0.5) * 2;
    mY = (clientY / window.innerHeight - 0.5) * 2;
    lastMove = Date.now();
  }
  document.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
  document.addEventListener('touchmove', e => {
    onMove(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  let scrollY = 0;
  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ── Boucle d'animation ────────────────────────────────
  const clock = new THREE.Clock();

  (function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Rotation 360° continue
    building.rotation.y = t * 0.065;

    // Parallaxe caméra (souris)
    tX += (mX - tX) * 0.025;
    tY += (mY - tY) * 0.025;
    camera.position.x = tX * 2.5;
    camera.position.y = 2 + tY * 1.5 - scrollY * 0.003;
    camera.lookAt(0, 0, 0);

    // Position souris en NDC (lissée) → uniforme du shader
    smoothMX += (mX * 0.78 - smoothMX) * 0.08;

    // Fondu révélation : actif au mouvement, s'estompe après 2,5 s d'inactivité
    const idle = (Date.now() - lastMove) / 1000;
    const target = idle < 0.08 ? 1.0 : Math.max(0, 1.0 - Math.max(0, idle - 0.08) / 2.5);
    revealAmt += (target - revealAmt) * 0.045;

    // Mise à jour uniforms de tous les matériaux armatures
    [matRebar, matStirrup, matMesh].forEach(m => {
      m.uniforms.uMouseX.value = smoothMX;
      m.uniforms.uReveal.value = revealAmt;
    });

    // Légère pulsation du béton
    concreteMat.opacity = 0.86 + Math.sin(t * 0.28) * 0.05;

    renderer.render(scene, camera);
  })();

})();
