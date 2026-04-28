/**
 * MH Structure — Three.js Scene v5
 * Immeuble de grande hauteur fini (16 niveaux)
 * Façade rideau vitrée · Noyau béton · Armatures révélées à la souris
 */
(function () {

  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  try {
    const t = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!t) { canvas.style.display = 'none'; return; }
  } catch (e) { canvas.style.display = 'none'; return; }

  // ── Renderer ──────────────────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0xEFF3FA, 1);
  renderer.shadowMap.enabled = false;

  // ── Scène ─────────────────────────────────────────────────────────────────
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xEFF3FA, 0.009);

  // ── Thème (appelé par main.js) ────────────────────────────────────────────
  const T = {
    light: { bg: 0xEFF3FA, fog: 0xEFF3FA, fogD: 0.009,
             concrete: 0xBCC6D2, glass: 0x9BBFD8, spandrel: 0xA8B4C0,
             core: 0xC4CDD8, ground: 0xD8DFE8, grid: 0x8A9EB4, gridFade: 0.14,
             ambient: 0xF0F6FF, sun: 0xFFFFFF, rim: 0xC8D8F0,
             ptColor: 0x6A8CB8, ptOpacity: 0.18 },
    dark:  { bg: 0x0F1929, fog: 0x0F1929, fogD: 0.012,
             concrete: 0x4A5668, glass: 0x1A3452, spandrel: 0x3A4558,
             core: 0x3C4A5C, ground: 0x0D1420, grid: 0x1A3060, gridFade: 0.10,
             ambient: 0xCCDDFF, sun: 0x99BBDD, rim: 0x223355,
             ptColor: 0x2A5A9A, ptOpacity: 0.22 },
  };
  let theme = T.light;

  window.mhSceneSetTheme = function (name) {
    theme = T[name] || T.light;
    renderer.setClearColor(theme.bg, 1);
    scene.fog.color.setHex(theme.fog);
    scene.fog.density = theme.fogD;
    concreteMat.color.setHex(theme.concrete);
    fndMat.color.setHex(theme.concrete);
    coreMat.color.setHex(theme.core);
    spandrelMat.color.setHex(theme.spandrel);
    glassMat.color.setHex(theme.glass);
    groundMat.color.setHex(theme.ground);
    grid.material.color.setHex(theme.grid);
    grid.material.opacity = theme.gridFade;
    ambLight.color.setHex(theme.ambient);
    sun.color.setHex(theme.sun);
    rimLight.color.setHex(theme.rim);
    ptMat.color.setHex(theme.ptColor);
    ptMat.opacity = theme.ptOpacity;
  };

  // Applique le thème actif
  const initTheme = document.documentElement.getAttribute('data-theme') || 'light';
  // (les matériaux sont créés d'abord — l'appel final est en bas)

  // ── Caméra ────────────────────────────────────────────────────────────────
  const camera = new THREE.PerspectiveCamera(44, window.innerWidth / window.innerHeight, 0.1, 400);
  camera.position.set(0, 14, 44);
  camera.lookAt(0, 18, 0);

  // ── Éclairage ─────────────────────────────────────────────────────────────
  const ambLight = new THREE.AmbientLight(0xF0F6FF, 0.45);
  scene.add(ambLight);

  const sun = new THREE.DirectionalLight(0xFFFFFF, 1.2);
  sun.position.set(10, 24, 12);
  scene.add(sun);

  const rimLight = new THREE.DirectionalLight(0xC8D8F0, 0.5);
  rimLight.position.set(-8, 4, -12);
  scene.add(rimLight);

  // ── Dimensions du bâtiment ────────────────────────────────────────────────
  const W   = 10;    // largeur (X)
  const D   = 6.5;   // profondeur (Z)
  const nF  = 16;    // étages
  const fH  = 3.2;   // hauteur par niveau (m)
  const cW  = 0.55, cD = 0.55;   // section poteau
  const bH  = 0.65, bW = 0.38;   // poutre hauteur / largeur
  const sH  = 0.22;              // épaisseur dalle
  const totalH = nF * fH;        // 51.2 m
  const bOff   = 0.16;           // offset armature

  // Positions colonnes : 4 par rangée (3 travées)
  const cx = [-W/2, -W/6, W/6, W/2];
  const cz = [-D/2, D/2];
  const colPositions = [];
  cx.forEach(x => cz.forEach(z => colPositions.push([x, z])));

  // ── Matériaux ─────────────────────────────────────────────────────────────
  const concreteMat = new THREE.MeshLambertMaterial({
    color: 0xBCC6D2, transparent: true, opacity: 0.94, depthWrite: true,
  });
  const fndMat = new THREE.MeshLambertMaterial({
    color: 0xBCC6D2, transparent: true, opacity: 0.96,
  });
  const coreMat = new THREE.MeshLambertMaterial({
    color: 0xC4CDD8, transparent: true, opacity: 0.96,
  });
  const spandrelMat = new THREE.MeshLambertMaterial({
    color: 0xA8B4C0, transparent: true, opacity: 0.98, depthWrite: true,
  });
  // Vitrage : semi-transparent, bleu-gris
  const glassMat = new THREE.MeshPhongMaterial({
    color: 0x9BBFD8,
    transparent: true,
    opacity: 0.38,
    shininess: 90,
    specular: new THREE.Color(0x88AACC),
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const groundMat = new THREE.MeshLambertMaterial({
    color: 0xD8DFE8, transparent: true, opacity: 0.80,
  });

  // ── Shader armatures (effet rayon X) ─────────────────────────────────────
  const vsReveal = /* glsl */`
    varying float vNDCx;
    void main() {
      vec4 clip = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      vNDCx = clip.x / clip.w;
      gl_Position = clip;
    }`;
  const fsReveal = /* glsl */`
    uniform float uMouseX;
    uniform float uReveal;
    uniform vec3  uColor;
    uniform float uBand;
    varying float vNDCx;
    void main() {
      float d    = abs(vNDCx - uMouseX);
      float band = 1.0 - smoothstep(0.0, uBand, d);
      float glow = (1.0 - smoothstep(0.0, uBand*0.25, d)) * 0.40;
      float alpha = (band + glow) * uReveal;
      if (alpha < 0.012) discard;
      gl_FragColor = vec4(uColor + vec3(glow), alpha);
    }`;

  function revealMat(hex, band) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uMouseX: { value: 0 },
        uReveal: { value: 0 },
        uColor:  { value: new THREE.Color(hex) },
        uBand:   { value: band },
      },
      vertexShader: vsReveal, fragmentShader: fsReveal,
      transparent: true, depthWrite: false, depthTest: false,
    });
  }

  const matRebar   = revealMat(0xC9A84C, 0.38);  // barres longit. (or)
  const matStirrup = revealMat(0xAA8830, 0.30);  // étriers
  const matMesh    = revealMat(0x8A6820, 0.26);  // treillis dalle

  // ── Groupe bâtiment ───────────────────────────────────────────────────────
  const building = new THREE.Group();

  function box(cx, cy, cz, w, h, d, mat) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat || concreteMat);
    m.position.set(cx, cy, cz);
    building.add(m);
    return m;
  }

  const rb = [], st = [], ms = [];
  const seg = (a, x1,y1,z1,x2,y2,z2) => a.push(x1,y1,z1,x2,y2,z2);

  function lineSegs(arr, mat, order) {
    if (!arr.length) return;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(arr), 3));
    const ls = new THREE.LineSegments(g, mat);
    ls.renderOrder = order || 2;
    building.add(ls);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // STRUCTURE : poteaux + poutres + dalles + armatures
  // ──────────────────────────────────────────────────────────────────────────

  // Poteaux (toute hauteur)
  colPositions.forEach(([px, pz]) => {
    box(px, totalH/2, pz, cW, totalH, cD);
    // 4 barres longitudinales
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz]) => {
      const bx = px + sx*bOff, bz = pz + sz*bOff;
      seg(rb, bx, 0, bz, bx, totalH, bz);
    });
    // Étriers tous les 25 cm
    const s = bOff + 0.04;
    for (let y = 0.16; y < totalH; y += 0.25) {
      seg(st, px-s,y,pz-s, px+s,y,pz-s);
      seg(st, px+s,y,pz-s, px+s,y,pz+s);
      seg(st, px+s,y,pz+s, px-s,y,pz+s);
      seg(st, px-s,y,pz+s, px-s,y,pz-s);
    }
  });

  // Poutres longitudinales + dalles par niveau
  for (let f = 1; f <= nF; f++) {
    const flY = f * fH;
    const bCY = flY - bH/2;

    // Poutres long. (parallèles X) — une par travée
    const spans = [[-W/2, -W/6], [-W/6, W/6], [W/6, W/2]];
    [-D/2, D/2].forEach(pz => {
      spans.forEach(([x1, x2]) => {
        const pLen = x2 - x1 - cW;
        const pCx  = (x1 + x2) / 2;
        box(pCx, bCY, pz, pLen, bH, bW);
        const ew = bW/2-0.05, eh = bH/2-0.05;
        seg(rb, x1+cW/2, bCY+eh-0.04, pz-0.06, x2-cW/2, bCY+eh-0.04, pz-0.06);
        seg(rb, x1+cW/2, bCY-eh+0.04, pz,      x2-cW/2, bCY-eh+0.04, pz);
        for (let ex = x1+cW/2+0.15; ex < x2-cW/2; ex += 0.28) {
          seg(st, ex,bCY-eh,pz-ew, ex,bCY+eh,pz-ew);
          seg(st, ex,bCY+eh,pz-ew, ex,bCY+eh,pz+ew);
          seg(st, ex,bCY+eh,pz+ew, ex,bCY-eh,pz+ew);
          seg(st, ex,bCY-eh,pz+ew, ex,bCY-eh,pz-ew);
        }
      });
    });

    // Poutres transversales (parallèles Z) sur chaque file X
    cx.forEach(px => {
      const pLen = D - cD;
      box(px, bCY, 0, bW, bH, pLen);
      seg(rb, px, bCY+bH/2-0.05, -pLen/2, px, bCY+bH/2-0.05, pLen/2);
      const ew = bW/2-0.05, eh = bH/2-0.05;
      for (let ez = -pLen/2+0.15; ez < pLen/2; ez += 0.28) {
        seg(st, px-ew,bCY-eh,ez, px-ew,bCY+eh,ez);
        seg(st, px-ew,bCY+eh,ez, px+ew,bCY+eh,ez);
        seg(st, px+ew,bCY+eh,ez, px+ew,bCY-eh,ez);
        seg(st, px+ew,bCY-eh,ez, px-ew,bCY-eh,ez);
      }
    });

    // Dalle béton
    box(0, flY - sH/2, 0, W, sH, D);
    // Treillis nappe basse
    const my = flY - sH + 0.07;
    for (let mz = -D/2+0.35; mz < D/2; mz += 0.35)
      seg(ms, -W/2, my, mz, W/2, my, mz);
    for (let mx = -W/2+0.35; mx < W/2; mx += 0.35)
      seg(ms, mx, my, -D/2, mx, my, D/2);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // NOYAU BÉTON CENTRAL (escaliers + ascenseurs)
  // ──────────────────────────────────────────────────────────────────────────
  const coreW = 3.2, coreD = 2.2;
  box(0, totalH/2, 0, coreW, totalH, coreD, coreMat);
  // Ouvertures symboliques dans le noyau (porte ascenseurs)
  for (let f = 0; f < nF; f++) {
    const fy = f * fH + fH/2;
    // Deux petites ouvertures face avant
    [-0.7, 0.7].forEach(ox => {
      const hole = new THREE.Mesh(
        new THREE.BoxGeometry(0.85, 2.2, 0.12),
        new THREE.MeshLambertMaterial({ color: 0x0F1929, transparent: true, opacity: 0.85 })
      );
      hole.position.set(ox, fy - 0.2, -coreD/2 - 0.02);
      building.add(hole);
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // FAÇADE RIDEAU VITRÉE
  // ──────────────────────────────────────────────────────────────────────────
  const spH       = 0.80;   // hauteur spandrel (bande opaque entre niveaux)
  const visionH   = fH - spH - sH * 0.5;  // hauteur vitrage visible
  const glassFace = [];     // stocke pour mise à jour opacité

  // Panels sur faces longitudinales (avant z=-D/2, arrière z=+D/2)
  [-D/2, D/2].forEach(fz => {
    const spans = [[-W/2, -W/6], [-W/6, W/6], [W/6, W/2]];
    for (let f = 0; f < nF; f++) {
      const flY    = f * fH;
      const vCY    = flY + sH + visionH/2;
      const sCY    = flY + sH/2 + 0.02;
      spans.forEach(([x1, x2]) => {
        const pW = (x2 - x1) - cW - 0.04;
        // Vision panel (verre)
        const g = box((x1+x2)/2, vCY, fz, pW, visionH, 0.06, glassMat);
        glassFace.push(g);
        // Spandrel band (béton habillé)
        box((x1+x2)/2, sCY, fz, pW, spH - 0.06, 0.09, spandrelMat);
      });
    }
  });

  // Panels sur faces transversales (x = ±W/2)
  [-W/2, W/2].forEach(fx => {
    for (let f = 0; f < nF; f++) {
      const flY = f * fH;
      const vCY = flY + sH + visionH/2;
      const sCY = flY + sH/2 + 0.02;
      const pD  = D - cD - 0.04;
      const g = box(fx, vCY, 0, 0.06, visionH, pD, glassMat);
      glassFace.push(g);
      box(fx, sCY, 0, 0.09, spH - 0.06, pD, spandrelMat);
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ACROTÈRE / COURONNEMENT
  // ──────────────────────────────────────────────────────────────────────────
  const parapetH = 1.2;
  // Acrotère avant / arrière (parallèles X)
  box(0, totalH + parapetH/2, -D/2 - 0.11, W + 0.4, parapetH, 0.22, coreMat);
  box(0, totalH + parapetH/2,  D/2 + 0.11, W + 0.4, parapetH, 0.22, coreMat);
  // Acrotère lateral (parallèles Z)
  box(-W/2 - 0.11, totalH + parapetH/2, 0, 0.22, parapetH, D + 0.4, coreMat);
  box( W/2 + 0.11, totalH + parapetH/2, 0, 0.22, parapetH, D + 0.4, coreMat);
  // Toit : machinerie / local technique
  box(-W/4, totalH + parapetH + 1.5, 0, W/2, 3.0, D * 0.7, coreMat);
  box( W/4, totalH + parapetH + 0.6, 0, W/3, 1.2, D * 0.5, spandrelMat);

  // ──────────────────────────────────────────────────────────────────────────
  // LIGNES D'ARMATURES
  // ──────────────────────────────────────────────────────────────────────────
  lineSegs(rb, matRebar,   2);
  lineSegs(st, matStirrup, 2);
  lineSegs(ms, matMesh,    2);

  // ── Positionnement final du bâtiment ──────────────────────────────────────
  building.position.y = -totalH * 0.08;
  building.position.x = 4.5;   // décalé à droite pour libérer la zone texte hero
  scene.add(building);

  // ── Sol + grille ──────────────────────────────────────────────────────────
  const groundGeo = new THREE.PlaneGeometry(80, 80);
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.position.set(building.position.x, building.position.y - 0.05, 0);
  scene.add(groundMesh);

  const grid = new THREE.GridHelper(100, 40, 0x8A9EB4, 0x8A9EB4);
  grid.position.set(building.position.x, building.position.y - 0.04, 0);
  grid.material.transparent = true;
  grid.material.opacity = 0.14;
  scene.add(grid);

  // ── Particules flottantes ─────────────────────────────────────────────────
  const ptPos = new Float32Array(280 * 3);
  for (let i = 0; i < 280; i++) {
    ptPos[i*3]   = (Math.random()-0.5)*60;
    ptPos[i*3+1] = (Math.random()-0.5)*50;
    ptPos[i*3+2] = (Math.random()-0.5)*40;
  }
  const ptGeo = new THREE.BufferGeometry();
  ptGeo.setAttribute('position', new THREE.BufferAttribute(ptPos, 3));
  const ptMat = new THREE.PointsMaterial({ color: 0x6A8CB8, size: 0.06, transparent: true, opacity: 0.18 });
  scene.add(new THREE.Points(ptGeo, ptMat));

  // ── Applique le thème initial ─────────────────────────────────────────────
  window.mhSceneSetTheme(initTheme);

  // ── Suivi souris ──────────────────────────────────────────────────────────
  let mX = 0, mY = 0, tX = 0, tY = 0;
  let smoothMX = 0, revealAmt = 0, lastMove = 0;

  function onMove(cx, cy) {
    mX = (cx / window.innerWidth  - 0.5) * 2;
    mY = (cy / window.innerHeight - 0.5) * 2;
    lastMove = Date.now();
  }
  document.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
  document.addEventListener('touchmove', e => onMove(e.touches[0].clientX, e.touches[0].clientY), { passive: true });

  let scrollY = 0;
  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ── Boucle animation ──────────────────────────────────────────────────────
  const clock = new THREE.Clock();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.addEventListener('visibilitychange', () => {
    document.hidden ? clock.stop() : clock.start();
  });

  (function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Rotation lente — bâtiment qui tourne doucement
    building.rotation.y = reducedMotion ? 0.2 : t * 0.028;

    // Parallaxe caméra
    tX += (mX - tX) * 0.022;
    tY += (mY - tY) * 0.022;
    camera.position.x = tX * 3;
    camera.position.y = 14 + tY * 2 - scrollY * 0.002;
    camera.lookAt(building.position.x * 0.35, 18 + tY * 0.5, 0);

    // Lissage X souris
    smoothMX += (mX * 0.75 - smoothMX) * 0.07;

    // Fondu révélation armatures
    const idle   = (Date.now() - lastMove) / 1000;
    const target = idle < 0.08 ? 1.0 : Math.max(0, 1 - Math.max(0, idle - 0.08) / 2.8);
    revealAmt += (target - revealAmt) * 0.05;

    // Update uniforms armatures
    [matRebar, matStirrup, matMesh].forEach(m => {
      m.uniforms.uMouseX.value = smoothMX;
      m.uniforms.uReveal.value = revealAmt;
    });

    // Béton : légère pulsation
    const pulse = 0.88 + Math.sin(t * 0.24) * 0.04;
    concreteMat.opacity = pulse;

    // Vitrage : s'efface au survol pour révéler la structure
    const glassTargetOp = 0.38 - revealAmt * 0.28;
    glassMat.opacity = glassTargetOp;

    renderer.render(scene, camera);
  })();

})();
