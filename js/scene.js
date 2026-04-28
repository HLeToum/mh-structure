/**
 * MH Structure — Three.js Scene v7
 * Immeuble R+6 · Fondations visibles · Armatures révélées à la souris
 */
(function () {

  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  try {
    if (!canvas.getContext('webgl') && !canvas.getContext('experimental-webgl'))
      { canvas.style.display = 'none'; return; }
  } catch (e) { canvas.style.display = 'none'; return; }

  // ── Renderer ──────────────────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0xEFF3FA, 1);

  const scene = new THREE.Scene();
  scene.fog   = new THREE.FogExp2(0xEFF3FA, 0.010);

  // ── Thème ─────────────────────────────────────────────────────────────────
  const T = {
    light: { bg: 0xEFF3FA, fog: 0xEFF3FA, fogD: 0.010,
             concrete: 0xB8C4D0, glass: 0x8EB8D4, spandrel: 0xA2B0BF,
             core: 0xBEC8D2, ground: 0xCDD5DF, soil: 0x9AA4AE,
             grid: 0x8A9EB4, gridO: 0.13,
             ambC: 0xE8F0FF, sunC: 0xFFFFFF, rimC: 0xB8CCEE },
    dark:  { bg: 0x0A1220, fog: 0x0A1220, fogD: 0.011,
             concrete: 0x445060, glass: 0x122840, spandrel: 0x344050,
             core: 0x384454, ground: 0x0C1420, soil: 0x1A2430,
             grid: 0x1A3060, gridO: 0.09,
             ambC: 0xCCDDFF, sunC: 0x99BBDD, rimC: 0x223355 },
  };

  const concreteMat = new THREE.MeshLambertMaterial({ color: 0xB8C4D0, transparent: true, opacity: 0.92 });
  const fndMat      = new THREE.MeshLambertMaterial({ color: 0xB8C4D0, transparent: true, opacity: 0.96 });
  const coreMat     = new THREE.MeshLambertMaterial({ color: 0xBEC8D2, transparent: true, opacity: 0.96 });
  const spandrelMat = new THREE.MeshLambertMaterial({ color: 0xA2B0BF, transparent: true, opacity: 0.98 });
  const glassMat    = new THREE.MeshPhongMaterial({
    color: 0x8EB8D4, transparent: true, opacity: 0.34,
    shininess: 80, specular: new THREE.Color(0x6699BB),
    side: THREE.DoubleSide, depthWrite: false,
  });
  const groundMat   = new THREE.MeshLambertMaterial({ color: 0xCDD5DF, transparent: true, opacity: 0.52 });
  const soilMat     = new THREE.MeshLambertMaterial({ color: 0x9AA4AE, transparent: true, opacity: 0.82 });
  let   realGrid;

  window.mhSceneSetTheme = function (name) {
    const th = T[name] || T.light;
    renderer.setClearColor(th.bg);
    scene.fog.color.setHex(th.fog);
    scene.fog.density = th.fogD;
    concreteMat.color.setHex(th.concrete);
    fndMat.color.setHex(th.concrete);
    coreMat.color.setHex(th.core);
    spandrelMat.color.setHex(th.spandrel);
    glassMat.color.setHex(th.glass);
    groundMat.color.setHex(th.ground);
    soilMat.color.setHex(th.soil);
    ambLight.color.setHex(th.ambC);
    sun.color.setHex(th.sunC);
    rim.color.setHex(th.rimC);
    if (realGrid) {
      realGrid.material.color.setHex(th.grid);
      realGrid.material.opacity = th.gridO;
    }
  };

  const initTheme = document.documentElement.getAttribute('data-theme') || 'light';

  // ── Caméra ────────────────────────────────────────────────────────────────
  const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 300);
  camera.position.set(0, 6, 30);
  camera.lookAt(0, 7, 0);

  // ── Lumières ─────────────────────────────────────────────────────────────
  const ambLight = new THREE.AmbientLight(0xE8F0FF, 0.50);
  scene.add(ambLight);
  const sun = new THREE.DirectionalLight(0xFFFFFF, 1.1);
  sun.position.set(8, 18, 10);
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xB8CCEE, 0.45);
  rim.position.set(-6, 3, -10);
  scene.add(rim);

  // ── Dimensions ────────────────────────────────────────────────────────────
  const W  = 8.0, D  = 5.5;
  const nF = 6,   fH = 3.0;
  const cW = 0.50, cD = 0.50;
  const bH = 0.58, bW = 0.36;
  const sH = 0.20;
  const totalH = nF * fH;          // 18 m
  const bOff   = 0.15;

  const sndW = 1.4, sndD = 1.4, sndH = 0.55;
  const lgH  = 0.38, lgW  = 0.36;

  const colX   = [-W/2, -W/6, W/6, W/2];
  const colZ   = [-D/2, D/2];
  const colPos = [];
  colX.forEach(x => colZ.forEach(z => colPos.push([x, z])));

  // ── Shader rayon X ────────────────────────────────────────────────────────
  const vsR = `varying float vNDCx;
    void main(){
      vec4 c=projectionMatrix*modelViewMatrix*vec4(position,1.);
      vNDCx=c.x/c.w; gl_Position=c; }`;
  const fsR = `uniform float uMX,uRev,uBand; uniform vec3 uCol;
    varying float vNDCx;
    void main(){
      float d=abs(vNDCx-uMX);
      float b=1.-smoothstep(0.,uBand,d);
      float g=(1.-smoothstep(0.,uBand*.22,d))*.44;
      float a=(b+g)*uRev; if(a<.01)discard;
      gl_FragColor=vec4(uCol+vec3(g),a); }`;
  function rMat(hex, band) {
    return new THREE.ShaderMaterial({
      uniforms: { uMX:{value:0}, uRev:{value:0}, uBand:{value:band}, uCol:{value:new THREE.Color(hex)} },
      vertexShader: vsR, fragmentShader: fsR,
      transparent: true, depthWrite: false, depthTest: false,
    });
  }
  const matRb = rMat(0xC9A84C, 0.36);
  const matSt = rMat(0xAA8830, 0.28);
  const matMs = rMat(0x8A6820, 0.24);

  // ── Groupe bâtiment ───────────────────────────────────────────────────────
  const building = new THREE.Group();
  const rb = [], st = [], ms = [];
  const seg = (a,x1,y1,z1,x2,y2,z2) => a.push(x1,y1,z1,x2,y2,z2);

  function addBox(cx, cy, cz, w, h, d, mat) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat || concreteMat);
    m.position.set(cx, cy, cz);
    building.add(m);
    return m;
  }
  function addLines(arr, mat, order) {
    if (!arr.length) return;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(arr), 3));
    const l = new THREE.LineSegments(g, mat);
    l.renderOrder = order || 2;
    building.add(l);
  }

  // ── FONDATIONS ────────────────────────────────────────────────────────────
  colPos.forEach(([px, pz]) => {
    addBox(px, -sndH/2, pz, sndW, sndH, sndD, fndMat);
    const fy = -sndH + 0.09;
    for (let rx = px-sndW/2+0.20; rx <= px+sndW/2-0.15; rx += 0.25)
      seg(ms, rx, fy, pz-sndD/2+0.10, rx, fy, pz+sndD/2-0.10);
    for (let rz = pz-sndD/2+0.20; rz <= pz+sndD/2-0.15; rz += 0.25)
      seg(ms, px-sndW/2+0.10, fy, rz, px+sndW/2-0.10, fy, rz);
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz]) => {
      seg(rb, px+sx*bOff, -sndH, pz+sz*bOff, px+sx*bOff, 0.5, pz+sz*bOff);
    });
    const ks = sndW/2 - 0.12;
    seg(st, px-ks,-sndH+.09,pz-ks, px+ks,-sndH+.09,pz-ks);
    seg(st, px+ks,-sndH+.09,pz-ks, px+ks,-sndH+.09,pz+ks);
    seg(st, px+ks,-sndH+.09,pz+ks, px-ks,-sndH+.09,pz+ks);
    seg(st, px-ks,-sndH+.09,pz+ks, px-ks,-sndH+.09,pz-ks);
  });

  // Longrines X
  const lgYc = -(sndH - lgH) / 2;
  [-D/2, D/2].forEach(pz => {
    const lLen = W - sndW;
    addBox(0, lgYc, pz, lLen, lgH, lgW, fndMat);
    const yT = lgYc+lgH/2-.07, yB = lgYc-lgH/2+.06;
    seg(rb, -lLen/2,yT,pz-.05, lLen/2,yT,pz-.05);
    seg(rb, -lLen/2,yT,pz+.05, lLen/2,yT,pz+.05);
    seg(rb, -lLen/2,yB,pz,     lLen/2,yB,pz);
    const ew = lgW/2-.04, eh = lgH/2-.04;
    for (let ex = -lLen/2+.18; ex < lLen/2; ex += .30) {
      seg(st, ex,lgYc-eh,pz-ew, ex,lgYc+eh,pz-ew);
      seg(st, ex,lgYc+eh,pz-ew, ex,lgYc+eh,pz+ew);
      seg(st, ex,lgYc+eh,pz+ew, ex,lgYc-eh,pz+ew);
      seg(st, ex,lgYc-eh,pz+ew, ex,lgYc-eh,pz-ew);
    }
  });

  // Longrines Z
  colX.forEach(px => {
    const lLen = D - sndD;
    addBox(px, lgYc, 0, lgW, lgH, lLen, fndMat);
    const yT = lgYc+lgH/2-.07, yB = lgYc-lgH/2+.06;
    seg(rb, px-.05,yT,-lLen/2, px-.05,yT,lLen/2);
    seg(rb, px+.05,yT,-lLen/2, px+.05,yT,lLen/2);
    seg(rb, px,yB,-lLen/2, px,yB,lLen/2);
    const ew = lgW/2-.04, eh = lgH/2-.04;
    for (let ez = -lLen/2+.18; ez < lLen/2; ez += .30) {
      seg(st, px-ew,lgYc-eh,ez, px-ew,lgYc+eh,ez);
      seg(st, px-ew,lgYc+eh,ez, px+ew,lgYc+eh,ez);
      seg(st, px+ew,lgYc+eh,ez, px+ew,lgYc-eh,ez);
      seg(st, px+ew,lgYc-eh,ez, px-ew,lgYc-eh,ez);
    }
  });

  // ── POTEAUX ───────────────────────────────────────────────────────────────
  colPos.forEach(([px, pz]) => {
    addBox(px, totalH/2, pz, cW, totalH, cD);
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz]) => {
      seg(rb, px+sx*bOff, 0, pz+sz*bOff, px+sx*bOff, totalH, pz+sz*bOff);
    });
    const ss = bOff + .04;
    for (let y = .15; y < totalH; y += .26) {
      seg(st, px-ss,y,pz-ss, px+ss,y,pz-ss);
      seg(st, px+ss,y,pz-ss, px+ss,y,pz+ss);
      seg(st, px+ss,y,pz+ss, px-ss,y,pz+ss);
      seg(st, px-ss,y,pz+ss, px-ss,y,pz-ss);
    }
  });

  // ── NOYAU ─────────────────────────────────────────────────────────────────
  addBox(0, totalH/2, 0, 2.8, totalH, 2.0, coreMat);

  // ── POUTRES + DALLES + FAÇADE ─────────────────────────────────────────────
  const spans = [[-W/2,-W/6], [-W/6,W/6], [W/6,W/2]];
  const spH = 0.72, vH = fH - spH - sH * 0.5;

  for (let f = 1; f <= nF; f++) {
    const flY = f * fH, bCY = flY - bH/2;

    [-D/2, D/2].forEach(pz => {
      spans.forEach(([x1,x2]) => {
        const pLen = x2-x1-cW, pCx = (x1+x2)/2;
        addBox(pCx, bCY, pz, pLen, bH, bW);
        const ew = bW/2-.04, eh = bH/2-.05;
        seg(rb, x1+cW/2,bCY+eh-.03,pz-.06, x2-cW/2,bCY+eh-.03,pz-.06);
        seg(rb, x1+cW/2,bCY-eh+.04,pz,     x2-cW/2,bCY-eh+.04,pz);
        for (let ex = x1+cW/2+.14; ex < x2-cW/2; ex += .26) {
          seg(st, ex,bCY-eh,pz-ew, ex,bCY+eh,pz-ew);
          seg(st, ex,bCY+eh,pz-ew, ex,bCY+eh,pz+ew);
          seg(st, ex,bCY+eh,pz+ew, ex,bCY-eh,pz+ew);
          seg(st, ex,bCY-eh,pz+ew, ex,bCY-eh,pz-ew);
        }
      });
    });

    colX.forEach(px => {
      const pLen = D - cD;
      addBox(px, bCY, 0, bW, bH, pLen);
      seg(rb, px,bCY+bH/2-.05,-pLen/2, px,bCY+bH/2-.05,pLen/2);
      const ew = bW/2-.04, eh = bH/2-.05;
      for (let ez = -pLen/2+.14; ez < pLen/2; ez += .26) {
        seg(st, px-ew,bCY-eh,ez, px-ew,bCY+eh,ez);
        seg(st, px-ew,bCY+eh,ez, px+ew,bCY+eh,ez);
        seg(st, px+ew,bCY+eh,ez, px+ew,bCY-eh,ez);
        seg(st, px+ew,bCY-eh,ez, px-ew,bCY-eh,ez);
      }
    });

    addBox(0, flY-sH/2, 0, W, sH, D);
    const my = flY - sH + .06;
    for (let mz = -D/2+.32; mz < D/2; mz += .32)  seg(ms, -W/2,my,mz, W/2,my,mz);
    for (let mx = -W/2+.32; mx < W/2; mx += .32)   seg(ms, mx,my,-D/2, mx,my,D/2);

    // Vitrage + spandrel
    [-D/2, D/2].forEach(fz => {
      spans.forEach(([x1,x2]) => {
        const pw = (x2-x1)-cW-.06, cx2 = (x1+x2)/2;
        addBox(cx2, f*fH-sH-vH/2,    fz, pw, vH,      .06, glassMat);
        addBox(cx2, (f-1)*fH+spH/2,  fz, pw, spH-.06, .08, spandrelMat);
      });
    });
    colX.forEach(fx => {
      const pd = D - cD - .06;
      addBox(fx, f*fH-sH-vH/2,   0, .06, vH,      pd, glassMat);
      addBox(fx, (f-1)*fH+spH/2, 0, .08, spH-.06, pd, spandrelMat);
    });
  }

  // Acrotère
  const pH = 0.9;
  addBox(0,  totalH+pH/2, -D/2-.10, W+.3, pH, .20, coreMat);
  addBox(0,  totalH+pH/2,  D/2+.10, W+.3, pH, .20, coreMat);
  addBox(-W/2-.10, totalH+pH/2, 0, .20, pH, D+.3, coreMat);
  addBox( W/2+.10, totalH+pH/2, 0, .20, pH, D+.3, coreMat);
  addBox(-W/4, totalH+pH+1.2, 0, W/2, 2.4, D*.6, coreMat);

  addLines(rb, matRb, 2);
  addLines(st, matSt, 2);
  addLines(ms, matMs, 2);

  building.position.set(3.5, -totalH * 0.10, 0);
  scene.add(building);

  // ── Sol + terre ───────────────────────────────────────────────────────────
  const bx = building.position.x, by = building.position.y;

  const soilMesh = new THREE.Mesh(new THREE.BoxGeometry(60, 2.0, 60), soilMat);
  soilMesh.position.set(bx, by - 1.0, 0);
  scene.add(soilMesh);

  const groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), groundMat);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.position.set(bx, by + .01, 0);
  scene.add(groundMesh);

  realGrid = new THREE.GridHelper(80, 40, 0x8A9EB4, 0x8A9EB4);
  realGrid.position.set(bx, by + .02, 0);
  realGrid.material.transparent = true;
  realGrid.material.opacity = 0.13;
  scene.add(realGrid);

  // Applique thème initial
  window.mhSceneSetTheme(initTheme);

  // ── Souris ────────────────────────────────────────────────────────────────
  let mX = 0, mY = 0, tX = 0, tY = 0, smoothMX = 0, revealAmt = 0, lastMove = 0;
  const onMove = (cx, cy) => {
    mX = (cx / window.innerWidth  - 0.5) * 2;
    mY = (cy / window.innerHeight - 0.5) * 2;
    lastMove = Date.now();
  };
  document.addEventListener('mousemove',  e => onMove(e.clientX, e.clientY));
  document.addEventListener('touchmove',  e => onMove(e.touches[0].clientX, e.touches[0].clientY), { passive: true });

  let scrollY = 0;
  window.addEventListener('scroll',  () => scrollY = window.scrollY,  { passive: true });
  window.addEventListener('resize',  () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ── Rendu ─────────────────────────────────────────────────────────────────
  const clock = new THREE.Clock();
  const rM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.addEventListener('visibilitychange', () => document.hidden ? clock.stop() : clock.start());

  (function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Rotation lente
    building.rotation.y = rM ? 0.18 : t * 0.022;

    // Parallaxe caméra
    tX += (mX - tX) * 0.020;
    tY += (mY - tY) * 0.020;
    camera.position.x = tX * 2.5;
    camera.position.y = 6 + tY * 1.8 - scrollY * 0.002;
    camera.lookAt(bx * 0.30, 7 + tY * 0.4, 0);

    // Reveal armatures à la souris
    smoothMX += (mX * 0.72 - smoothMX) * 0.07;
    const idle   = (Date.now() - lastMove) / 1000;
    const target = idle < 0.08 ? 1.0 : Math.max(0, 1 - Math.max(0, idle - 0.08) / 2.8);
    revealAmt += (target - revealAmt) * 0.05;

    [matRb, matSt, matMs].forEach(m => {
      m.uniforms.uMX.value  = smoothMX;
      m.uniforms.uRev.value = revealAmt;
    });

    concreteMat.opacity = 0.88 + Math.sin(t * 0.22) * 0.04;
    glassMat.opacity    = 0.34 - revealAmt * 0.26;

    renderer.render(scene, camera);
  })();

})();
