/**
 * MH-Structure — Three.js Scene v4
 * Bâtiment gros oeuvre fini · Semelles isolées + longrines
 * Armatures + coffrage révélés au survol (effet rayon X)
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
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0F1929, 0.014);

  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 3, 26);
  camera.lookAt(0, 0, 0);

  // ── Éclairage ─────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0xCCDDFF, 0.30));
  const sun = new THREE.DirectionalLight(0x99BBDD, 1.1);
  sun.position.set(8, 14, 6);
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0x223355, 0.55);
  rim.position.set(-6, 2, -8);
  scene.add(rim);

  // ── Paramètres bâtiment ───────────────────────────────
  const W = 7.0, D = 4.5, fH = 2.2, nF = 5;
  const cW = 0.45, cD = 0.45;          // section poteau
  const bH = 0.50, bW = 0.35;          // hauteur / largeur poutre
  const sH = 0.18;                      // épaisseur dalle
  const totalH = nF * fH;              // hauteur totale structure = 11.0
  const bOff = 0.14;                    // offset armature / axe poteau

  // Fondations
  const sndW = 1.6, sndD = 1.6, sndH = 0.55;   // semelle isolée (plan + hauteur)
  const lgH  = 0.35, lgW  = 0.40;               // longrine (H × largeur)

  // Murs de remplissage
  const wallT = 0.13;

  const colPositions = [
    [-W/2, -D/2], [0, -D/2], [W/2, -D/2],
    [-W/2,  D/2], [0,  D/2], [W/2,  D/2],
  ];

  // ── Matériaux béton ───────────────────────────────────
  const concreteMat = new THREE.MeshLambertMaterial({
    color: 0x5A6475, transparent: true, opacity: 0.90, depthWrite: true,
  });
  const fndMat = new THREE.MeshLambertMaterial({
    color: 0x4E5C6E, transparent: true, opacity: 0.95, depthWrite: true,
  });
  // Murs de remplissage : assez opaques (gros oeuvre terminé)
  const wallMat = new THREE.MeshLambertMaterial({
    color: 0x4A5568, transparent: true, opacity: 0.82, depthWrite: true,
  });

  // ── Shader armatures / coffrage — effet rayon X ──────
  const vsReveal = /* glsl */`
    varying float vNDCx;
    void main() {
      vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      vNDCx = clip.x / clip.w;
      gl_Position = clip;
    }
  `;
  const fsReveal = /* glsl */`
    uniform float uMouseX;
    uniform float uReveal;
    uniform vec3  uColor;
    uniform float uBand;
    varying float vNDCx;
    void main() {
      float d    = abs(vNDCx - uMouseX);
      float band = 1.0 - smoothstep(0.0, uBand, d);
      float glow = (1.0 - smoothstep(0.0, uBand * 0.25, d)) * 0.35;
      float alpha = (band + glow) * uReveal;
      if (alpha < 0.015) discard;
      gl_FragColor = vec4(uColor + vec3(glow), alpha);
    }
  `;

  function makeRevealMat(hexColor, band) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uMouseX: { value: 0.0 },
        uReveal: { value: 0.0 },
        uColor:  { value: new THREE.Color(hexColor) },
        uBand:   { value: band },
      },
      vertexShader:   vsReveal,
      fragmentShader: fsReveal,
      transparent: true,
      depthWrite:  false,
      depthTest:   false,
    });
  }

  // Armatures (or, cadres, treillis) — existants
  const matRebar   = makeRevealMat(0xC9A84C, 0.40);   // barres longit. — or
  const matStirrup = makeRevealMat(0xA07A30, 0.32);   // étriers
  const matMesh    = makeRevealMat(0x8A6520, 0.28);   // treillis dalle
  // Coffrage — planches, lambourdes (bois chaud)
  const matCoffrage = makeRevealMat(0xA07840, 0.50);

  // ── Groupes & helpers ─────────────────────────────────
  const building = new THREE.Group();

  function addBox(cx, cy, cz, w, h, d, mat) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat || concreteMat);
    m.position.set(cx, cy, cz);
    building.add(m);
  }

  // Tableaux de segments de lignes
  const rb = [], st = [], ms = [], cf = [];
  function rseg(arr, x1, y1, z1, x2, y2, z2) { arr.push(x1,y1,z1, x2,y2,z2); }

  function buildLS(arr, mat, order) {
    if (!arr.length) return null;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(arr), 3));
    const ls = new THREE.LineSegments(geo, mat);
    ls.renderOrder = order || 2;
    return ls;
  }

  // ── FONDATIONS ────────────────────────────────────────
  colPositions.forEach(([cx, cz]) => {
    // Semelle isolée (below ground, local y < 0)
    addBox(cx, -sndH / 2, cz, sndW, sndH, sndD, fndMat);

    // Grille de ferraillage en fond de semelle
    const fy = -sndH + 0.09;
    for (let rx = cx - sndW/2 + 0.22; rx <= cx + sndW/2 - 0.15; rx += 0.28)
      rseg(ms, rx, fy, cz-sndD/2+0.10, rx, fy, cz+sndD/2-0.10);
    for (let rz = cz - sndD/2 + 0.22; rz <= cz + sndD/2 - 0.15; rz += 0.28)
      rseg(ms, cx-sndW/2+0.10, fy, rz, cx+sndW/2-0.10, fy, rz);

    // Attentes / barres de démarrage (semelle → poteau)
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx, sz]) => {
      const bx = cx + sx * bOff, bz = cz + sz * bOff;
      rseg(rb, bx, -sndH, bz, bx, 0.50, bz);
    });
    // Cadre de reprise de semelle
    const ks = sndW/2 - 0.12;
    rseg(st, cx-ks, -sndH+0.09, cz-ks, cx+ks, -sndH+0.09, cz-ks);
    rseg(st, cx+ks, -sndH+0.09, cz-ks, cx+ks, -sndH+0.09, cz+ks);
    rseg(st, cx+ks, -sndH+0.09, cz+ks, cx-ks, -sndH+0.09, cz+ks);
    rseg(st, cx-ks, -sndH+0.09, cz+ks, cx-ks, -sndH+0.09, cz-ks);
  });

  // Longrines — parallèles X (le long des deux files Z)
  const lgYc = -(sndH - lgH) / 2;  // top flush avec dessus semelle
  [-D/2, D/2].forEach(pz => {
    const lLen = W - sndW;
    addBox(0, lgYc, pz, lLen, lgH, lgW, fndMat);
    const yT = lgYc + lgH/2 - 0.08, yB = lgYc - lgH/2 + 0.07;
    rseg(rb, -lLen/2, yT, pz-0.06, lLen/2, yT, pz-0.06);
    rseg(rb, -lLen/2, yT, pz+0.06, lLen/2, yT, pz+0.06);
    rseg(rb, -lLen/2, yB, pz,      lLen/2, yB, pz);
    const ew = lgW/2-0.05, eh = lgH/2-0.05;
    for (let ex = -lLen/2+0.20; ex < lLen/2; ex += 0.35) {
      rseg(st, ex,lgYc-eh,pz-ew, ex,lgYc+eh,pz-ew);
      rseg(st, ex,lgYc+eh,pz-ew, ex,lgYc+eh,pz+ew);
      rseg(st, ex,lgYc+eh,pz+ew, ex,lgYc-eh,pz+ew);
      rseg(st, ex,lgYc-eh,pz+ew, ex,lgYc-eh,pz-ew);
    }
  });

  // Longrines — parallèles Z (le long des deux files X)
  [-W/2, W/2].forEach(px => {
    const lLen = D - sndD;
    addBox(px, lgYc, 0, lgW, lgH, lLen, fndMat);
    const yT = lgYc + lgH/2 - 0.08, yB = lgYc - lgH/2 + 0.07;
    rseg(rb, px-0.06, yT, -lLen/2, px-0.06, yT, lLen/2);
    rseg(rb, px+0.06, yT, -lLen/2, px+0.06, yT, lLen/2);
    rseg(rb, px,      yB, -lLen/2, px,      yB, lLen/2);
    const ew = lgW/2-0.05, eh = lgH/2-0.05;
    for (let ez = -lLen/2+0.20; ez < lLen/2; ez += 0.35) {
      rseg(st, px-ew,lgYc-eh,ez, px-ew,lgYc+eh,ez);
      rseg(st, px-ew,lgYc+eh,ez, px+ew,lgYc+eh,ez);
      rseg(st, px+ew,lgYc+eh,ez, px+ew,lgYc-eh,ez);
      rseg(st, px+ew,lgYc-eh,ez, px-ew,lgYc-eh,ez);
    }
  });

  // ── POTEAUX (toute hauteur) ───────────────────────────
  colPositions.forEach(([cx, cz]) => {
    addBox(cx, totalH / 2, cz, cW, totalH, cD);
    // 4 barres longitudinales
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx, sz]) => {
      const bx = cx + sx * bOff, bz = cz + sz * bOff;
      rseg(rb, bx, 0, bz, bx, totalH, bz);
    });
    // Étriers
    const s = bOff + 0.03;
    for (let y = 0.14; y < totalH; y += 0.28) {
      rseg(st, cx-s,y,cz-s, cx+s,y,cz-s);
      rseg(st, cx+s,y,cz-s, cx+s,y,cz+s);
      rseg(st, cx+s,y,cz+s, cx-s,y,cz+s);
      rseg(st, cx-s,y,cz+s, cx-s,y,cz-s);
    }
  });

  // ── POUTRES & DALLES par niveau ───────────────────────
  for (let f = 1; f <= nF; f++) {
    const flY  = f * fH;
    const bCY  = flY - bH / 2;

    // Poutres longitudinales (parallèles X)
    [-D/2, D/2].forEach(pz => {
      const pLen = W - cW;
      addBox(0, bCY, pz, pLen, bH, bW);
      const x1 = -pLen/2, x2 = pLen/2;
      const yT = bCY + bH/2 - 0.07, yB = bCY - bH/2 + 0.07;
      rseg(rb, x1,yT,pz-0.06, x2,yT,pz-0.06);
      rseg(rb, x1,yT,pz+0.06, x2,yT,pz+0.06);
      rseg(rb, x1,yB,pz,      x2,yB,pz);
      const ew = bW/2-0.05, eh = bH/2-0.05;
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
      addBox(px, bCY, 0, bW, bH, pLen);
      const z1 = -pLen/2, z2 = pLen/2;
      const yT = bCY + bH/2 - 0.07, yB = bCY - bH/2 + 0.07;
      rseg(rb, px,yT,z1, px,yT,z2);
      rseg(rb, px,yB,z1, px,yB,z2);
      const ew = bW/2-0.05, eh = bH/2-0.05;
      for (let ez = z1+0.16; ez < z2; ez += 0.32) {
        rseg(st, px-ew,bCY-eh,ez, px-ew,bCY+eh,ez);
        rseg(st, px-ew,bCY+eh,ez, px+ew,bCY+eh,ez);
        rseg(st, px+ew,bCY+eh,ez, px+ew,bCY-eh,ez);
        rseg(st, px+ew,bCY-eh,ez, px-ew,bCY-eh,ez);
      }
    });

    // Dalle
    addBox(0, flY - sH/2, 0, W, sH, D);
    // Nappe de treillis (inférieure)
    const my = flY - sH + 0.06;
    for (let mz = -D/2+0.40; mz < D/2; mz += 0.40)
      rseg(ms, -W/2, my, mz, W/2, my, mz);
    for (let mx = -W/2+0.40; mx < W/2; mx += 0.40)
      rseg(ms, mx, my, -D/2, mx, my, D/2);
  }

  // ── MURS DE REMPLISSAGE + COFFRAGE ───────────────────
  for (let f = 1; f <= nF; f++) {
    const wY0  = (f - 1) * fH;           // bas du panneau (dessus dalle précédente ou sol)
    const wY1  = f * fH - bH;            // haut du panneau (sous-poutre)
    const wH   = wY1 - wY0;
    if (wH < 0.10) continue;
    const wYc  = wY0 + wH / 2;

    // ─ Façades longitudinales (z = ±D/2) ─ 2 travées
    [-D/2, D/2].forEach(fz => {
      const sgn = fz < 0 ? -1 : 1;
      const outerZ = fz + sgn * wallT / 2;

      for (let s = 0; s < 2; s++) {
        const spanCx = (s === 0) ? -W / 4 : W / 4;
        const spanW  = W / 2 - cW;
        addBox(spanCx, wYc, fz, spanW, wH, wallT, wallMat);

        // Coffrage : planches horizontales + contour
        const pg = 0.22;
        for (let py = wY0 + pg * 0.5; py < wY1; py += pg)
          rseg(cf, spanCx-spanW/2, py, outerZ, spanCx+spanW/2, py, outerZ);
        // Contour du panneau
        rseg(cf, spanCx-spanW/2, wY0, outerZ, spanCx+spanW/2, wY0, outerZ);
        rseg(cf, spanCx-spanW/2, wY1, outerZ, spanCx+spanW/2, wY1, outerZ);
        rseg(cf, spanCx-spanW/2, wY0, outerZ, spanCx-spanW/2, wY1, outerZ);
        rseg(cf, spanCx+spanW/2, wY0, outerZ, spanCx+spanW/2, wY1, outerZ);
      }
    });

    // ─ Façades transversales (x = ±W/2) ─ 1 travée
    [-W/2, W/2].forEach(fx => {
      const sgn = fx < 0 ? -1 : 1;
      const outerX = fx + sgn * wallT / 2;
      const spanD  = D - cD;
      addBox(fx, wYc, 0, wallT, wH, spanD, wallMat);

      const pg = 0.22;
      for (let py = wY0 + pg * 0.5; py < wY1; py += pg)
        rseg(cf, outerX, py, -spanD/2, outerX, py, spanD/2);
      rseg(cf, outerX, wY0, -spanD/2, outerX, wY0,  spanD/2);
      rseg(cf, outerX, wY1, -spanD/2, outerX, wY1,  spanD/2);
      rseg(cf, outerX, wY0, -spanD/2, outerX, wY1, -spanD/2);
      rseg(cf, outerX, wY0,  spanD/2, outerX, wY1,  spanD/2);
    });
  }

  // ── Assemblage des lignes ─────────────────────────────
  [
    buildLS(rb, matRebar,    2),
    buildLS(st, matStirrup,  2),
    buildLS(ms, matMesh,     2),
    buildLS(cf, matCoffrage, 3),   // coffrage au-dessus
  ].forEach(ls => { if (ls) building.add(ls); });

  // Le bâtiment est centré verticalement ; on le remonte
  // légèrement pour que les semelles soient visibles
  building.position.y = -totalH / 2 + sndH * 0.4;
  building.position.x = 3.8;   // décalage droite — laisse la zone texte libre
  scene.add(building);

  // ── Plan de sol (terre) ───────────────────────────────
  const groundGeo = new THREE.PlaneGeometry(36, 36);
  const groundMat = new THREE.MeshLambertMaterial({
    color: 0x0D1626, transparent: true, opacity: 0.70, depthWrite: true,
  });
  const groundPlane = new THREE.Mesh(groundGeo, groundMat);
  groundPlane.rotation.x = -Math.PI / 2;
  groundPlane.position.set(building.position.x, building.position.y - 0.04, 0);
  scene.add(groundPlane);

  // ── Grille légère ─────────────────────────────────────
  const grid = new THREE.GridHelper(60, 32, 0x1A3060, 0x0F1E3A);
  grid.position.set(building.position.x, building.position.y - 0.14, 0);
  grid.material.transparent = true;
  grid.material.opacity = 0.10;
  scene.add(grid);

  // ── Particules flottantes ─────────────────────────────
  const ptPos = new Float32Array(200 * 3);
  for (let i = 0; i < 200; i++) {
    ptPos[i*3]   = (Math.random() - 0.5) * 48;
    ptPos[i*3+1] = (Math.random() - 0.5) * 32;
    ptPos[i*3+2] = (Math.random() - 0.5) * 32;
  }
  const ptGeo = new THREE.BufferGeometry();
  ptGeo.setAttribute('position', new THREE.BufferAttribute(ptPos, 3));
  const ptMat = new THREE.PointsMaterial({ color: 0x2A5A9A, size: 0.055, transparent: true, opacity: 0.22 });
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
    building.rotation.y = t * 0.060;

    // Parallaxe caméra (souris)
    tX += (mX - tX) * 0.025;
    tY += (mY - tY) * 0.025;
    camera.position.x = tX * 2.5;
    camera.position.y = 3 + tY * 1.5 - scrollY * 0.003;
    camera.lookAt(0, 0, 0);

    // Position souris en NDC (lissée)
    smoothMX += (mX * 0.78 - smoothMX) * 0.08;

    // Fondu révélation : actif au mouvement, s'estompe après 2,5 s
    const idle   = (Date.now() - lastMove) / 1000;
    const target = idle < 0.08 ? 1.0 : Math.max(0, 1.0 - Math.max(0, idle - 0.08) / 2.5);
    revealAmt += (target - revealAmt) * 0.045;

    // Mise à jour uniforms armatures + coffrage
    [matRebar, matStirrup, matMesh, matCoffrage].forEach(m => {
      m.uniforms.uMouseX.value = smoothMX;
      m.uniforms.uReveal.value = revealAmt;
    });

    // Pulsation légère du béton
    const pulse = 0.86 + Math.sin(t * 0.28) * 0.05;
    concreteMat.opacity = pulse;
    // Murs légèrement plus transparents au survol (effet "voir à travers")
    wallMat.opacity = 0.82 - revealAmt * 0.38;

    renderer.render(scene, camera);
  })();

})();
