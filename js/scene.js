/**
 * MH Structure — Three.js Scene v6
 * Tour 10 niveaux · Fondations visibles · Animation orbitale + ondes
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

  const scene  = new THREE.Scene();
  scene.fog    = new THREE.FogExp2(0xEFF3FA, 0.008);

  // ── Thème ─────────────────────────────────────────────────────────────────
  const T = {
    light: { bg: 0xEFF3FA, fog: 0xEFF3FA, fogD: 0.008,
             concrete: 0xB8C4D0, glass: 0x90BAD5, spandrel: 0xA2B0BF,
             core: 0xC0C9D4, ground: 0xCDD5DF, soil: 0x9AA4AE,
             grid: 0x8A9EB4, gridO: 0.13,
             orbit: 0xC9A84C, pulse: 0xC9A84C,
             ambC: 0xE8F0FF, sunC: 0xFFFFFF, rimC: 0xB8CCEE },
    dark:  { bg: 0x0A1220, fog: 0x0A1220, fogD: 0.009,
             concrete: 0x445060, glass: 0x142A42, spandrel: 0x344050,
             core: 0x384454, ground: 0x0C1420, soil: 0x1A2430,
             grid: 0x1A3060, gridO: 0.10,
             orbit: 0xC9A84C, pulse: 0x4A88CC,
             ambC: 0xCCDDFF, sunC: 0x99BBDD, rimC: 0x223355 },
  };
  let th = T.light;

  // Matériaux déclarés avant la fn setTheme
  const concreteMat = new THREE.MeshLambertMaterial({ color: 0xB8C4D0, transparent: true, opacity: 0.92 });
  const fndMat      = new THREE.MeshLambertMaterial({ color: 0xB8C4D0, transparent: true, opacity: 0.95 });
  const coreMat     = new THREE.MeshLambertMaterial({ color: 0xC0C9D4, transparent: true, opacity: 0.95 });
  const spandrelMat = new THREE.MeshLambertMaterial({ color: 0xA2B0BF, transparent: true, opacity: 0.98 });
  const glassMat    = new THREE.MeshPhongMaterial({
    color: 0x90BAD5, transparent: true, opacity: 0.35,
    shininess: 80, specular: new THREE.Color(0x6699BB),
    side: THREE.DoubleSide, depthWrite: false,
  });
  const groundMat   = new THREE.MeshLambertMaterial({ color: 0xCDD5DF, transparent: true, opacity: 0.55, depthWrite: true });
  const soilMat     = new THREE.MeshLambertMaterial({ color: 0x9AA4AE, transparent: true, opacity: 0.80 });
  const gridHelper  = { material: { color: { setHex: () => {} }, opacity: 0 } }; // placeholder

  window.mhSceneSetTheme = function (name) {
    th = T[name] || T.light;
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
    if (realGrid) { realGrid.material.color.setHex(th.grid); realGrid.material.opacity = th.gridO; }
    orbitMat.color.setHex(th.orbit);
    pulseMats.forEach(m => m.color.setHex(th.pulse));
    ptMat.color.setHex(th.orbit);
  };

  const initTheme = document.documentElement.getAttribute('data-theme') || 'light';

  // ── Caméra ────────────────────────────────────────────────────────────────
  const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 300);
  camera.position.set(0, 10, 34);
  camera.lookAt(0, 10, 0);

  // ── Lumières ─────────────────────────────────────────────────────────────
  const ambLight = new THREE.AmbientLight(0xE8F0FF, 0.50);
  scene.add(ambLight);
  const sun = new THREE.DirectionalLight(0xFFFFFF, 1.1);
  sun.position.set(8, 20, 10);
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xB8CCEE, 0.45);
  rim.position.set(-6, 4, -10);
  scene.add(rim);

  // ── Dimensions bâtiment ───────────────────────────────────────────────────
  const W   = 8.0,  D   = 5.5;   // plan (m)
  const nF  = 10,   fH  = 3.0;   // niveaux / hauteur
  const cW  = 0.50, cD  = 0.50;  // section poteau
  const bH  = 0.60, bW  = 0.36;  // poutre
  const sH  = 0.20;               // dalle
  const totalH = nF * fH;         // 30 m
  const bOff   = 0.15;

  // Semelles & longrines
  const sndW = 1.4, sndD = 1.4, sndH = 0.55;
  const lgH  = 0.38, lgW  = 0.36;

  // Positions colonnes (4 par file, 3 travées)
  const colX  = [-W/2, -W/6, W/6, W/2];
  const colZ  = [-D/2, D/2];
  const colPos = [];
  colX.forEach(x => colZ.forEach(z => colPos.push([x, z])));

  // ── Shader rayon X (armatures) ────────────────────────────────────────────
  const vsR = `varying float vNDCx;
    void main(){
      vec4 c=projectionMatrix*modelViewMatrix*vec4(position,1.);
      vNDCx=c.x/c.w; gl_Position=c; }`;
  const fsR = `uniform float uMX,uRev,uBand; uniform vec3 uCol;
    varying float vNDCx;
    void main(){
      float d=abs(vNDCx-uMX);
      float b=1.-smoothstep(0.,uBand,d);
      float g=(1.-smoothstep(0.,uBand*.22,d))*.45;
      float a=(b+g)*uRev; if(a<.01)discard;
      gl_FragColor=vec4(uCol+vec3(g),a); }`;
  function rMat(hex, band) {
    return new THREE.ShaderMaterial({
      uniforms:{ uMX:{value:0}, uRev:{value:0}, uBand:{value:band}, uCol:{value:new THREE.Color(hex)} },
      vertexShader:vsR, fragmentShader:fsR,
      transparent:true, depthWrite:false, depthTest:false,
    });
  }
  const matRb = rMat(0xC9A84C, 0.36);
  const matSt = rMat(0xAA8830, 0.28);
  const matMs = rMat(0x8A6820, 0.24);

  // ── Groupe ───────────────────────────────────────────────────────────────
  const building = new THREE.Group();
  const rb=[], st=[], ms=[];
  const s=(a,x1,y1,z1,x2,y2,z2)=>a.push(x1,y1,z1,x2,y2,z2);

  function addBox(cx,cy,cz,w,h,d,mat) {
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat||concreteMat);
    m.position.set(cx,cy,cz); building.add(m); return m;
  }
  function addLines(arr,mat,order) {
    if(!arr.length) return;
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(arr),3));
    const l=new THREE.LineSegments(g,mat); l.renderOrder=order||2;
    building.add(l);
  }

  // ── FONDATIONS ───────────────────────────────────────────────────────────
  colPos.forEach(([px,pz])=>{
    addBox(px, -sndH/2, pz, sndW, sndH, sndD, fndMat);
    // Ferraillage semelle
    const fy=-sndH+0.09;
    for(let rx=px-sndW/2+0.20;rx<=px+sndW/2-0.15;rx+=0.25) s(ms,rx,fy,pz-sndD/2+0.10,rx,fy,pz+sndD/2-0.10);
    for(let rz=pz-sndD/2+0.20;rz<=pz+sndD/2-0.15;rz+=0.25) s(ms,px-sndW/2+0.10,fy,rz,px+sndW/2-0.10,fy,rz);
    // Attentes poteau→semelle
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>{
      const bx=px+sx*bOff,bz=pz+sz*bOff;
      s(rb,bx,-sndH,bz,bx,0.6,bz);
    });
    // Cadre semelle
    const ks=sndW/2-0.12;
    s(st,px-ks,-sndH+.09,pz-ks, px+ks,-sndH+.09,pz-ks);
    s(st,px+ks,-sndH+.09,pz-ks, px+ks,-sndH+.09,pz+ks);
    s(st,px+ks,-sndH+.09,pz+ks, px-ks,-sndH+.09,pz+ks);
    s(st,px-ks,-sndH+.09,pz+ks, px-ks,-sndH+.09,pz-ks);
  });

  // Longrines X (files -D/2 et D/2)
  const lgYc=-(sndH-lgH)/2;
  [-D/2,D/2].forEach(pz=>{
    const lLen=W-sndW; addBox(0,lgYc,pz,lLen,lgH,lgW,fndMat);
    const yT=lgYc+lgH/2-.07,yB=lgYc-lgH/2+.06;
    s(rb,-lLen/2,yT,pz-.05,lLen/2,yT,pz-.05);
    s(rb,-lLen/2,yT,pz+.05,lLen/2,yT,pz+.05);
    s(rb,-lLen/2,yB,pz,    lLen/2,yB,pz);
    const ew=lgW/2-.04,eh=lgH/2-.04;
    for(let ex=-lLen/2+.18;ex<lLen/2;ex+=.30){
      s(st,ex,lgYc-eh,pz-ew,ex,lgYc+eh,pz-ew);
      s(st,ex,lgYc+eh,pz-ew,ex,lgYc+eh,pz+ew);
      s(st,ex,lgYc+eh,pz+ew,ex,lgYc-eh,pz+ew);
      s(st,ex,lgYc-eh,pz+ew,ex,lgYc-eh,pz-ew);
    }
  });
  // Longrines Z (files ±W/2 et ±W/6, W/6)
  colX.forEach(px=>{
    const lLen=D-sndD; addBox(px,lgYc,0,lgW,lgH,lLen,fndMat);
    const yT=lgYc+lgH/2-.07,yB=lgYc-lgH/2+.06;
    s(rb,px-.05,yT,-lLen/2,px-.05,yT,lLen/2);
    s(rb,px+.05,yT,-lLen/2,px+.05,yT,lLen/2);
    s(rb,px,yB,-lLen/2,px,yB,lLen/2);
    const ew=lgW/2-.04,eh=lgH/2-.04;
    for(let ez=-lLen/2+.18;ez<lLen/2;ez+=.30){
      s(st,px-ew,lgYc-eh,ez,px-ew,lgYc+eh,ez);
      s(st,px-ew,lgYc+eh,ez,px+ew,lgYc+eh,ez);
      s(st,px+ew,lgYc+eh,ez,px+ew,lgYc-eh,ez);
      s(st,px+ew,lgYc-eh,ez,px-ew,lgYc-eh,ez);
    }
  });

  // ── POTEAUX ───────────────────────────────────────────────────────────────
  colPos.forEach(([px,pz])=>{
    addBox(px,totalH/2,pz,cW,totalH,cD);
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>{
      const bx=px+sx*bOff,bz=pz+sz*bOff;
      s(rb,bx,0,bz,bx,totalH,bz);
    });
    const ss=bOff+.04;
    for(let y=.15;y<totalH;y+=.26){
      s(st,px-ss,y,pz-ss,px+ss,y,pz-ss);
      s(st,px+ss,y,pz-ss,px+ss,y,pz+ss);
      s(st,px+ss,y,pz+ss,px-ss,y,pz+ss);
      s(st,px-ss,y,pz+ss,px-ss,y,pz-ss);
    }
  });

  // ── NOYAU CENTRAL ────────────────────────────────────────────────────────
  addBox(0,totalH/2,0,2.8,totalH,2.0,coreMat);

  // ── POUTRES + DALLES + VITRAGE ────────────────────────────────────────────
  const spans=[[-W/2,-W/6],[-W/6,W/6],[W/6,W/2]];
  const spH=0.75, vH=fH-spH-sH*.5;

  for(let f=1;f<=nF;f++){
    const flY=f*fH, bCY=flY-bH/2;

    // Poutres longit.
    [-D/2,D/2].forEach(pz=>{
      spans.forEach(([x1,x2])=>{
        const pLen=x2-x1-cW, pCx=(x1+x2)/2;
        addBox(pCx,bCY,pz,pLen,bH,bW);
        const ew=bW/2-.04,eh=bH/2-.05;
        s(rb,x1+cW/2,bCY+eh-.03,pz-.06,x2-cW/2,bCY+eh-.03,pz-.06);
        s(rb,x1+cW/2,bCY-eh+.04,pz,   x2-cW/2,bCY-eh+.04,pz);
        for(let ex=x1+cW/2+.14;ex<x2-cW/2;ex+=.26){
          s(st,ex,bCY-eh,pz-ew,ex,bCY+eh,pz-ew);
          s(st,ex,bCY+eh,pz-ew,ex,bCY+eh,pz+ew);
          s(st,ex,bCY+eh,pz+ew,ex,bCY-eh,pz+ew);
          s(st,ex,bCY-eh,pz+ew,ex,bCY-eh,pz-ew);
        }
      });
    });

    // Poutres transv.
    colX.forEach(px=>{
      const pLen=D-cD;
      addBox(px,bCY,0,bW,bH,pLen);
      s(rb,px,bCY+bH/2-.05,-pLen/2,px,bCY+bH/2-.05,pLen/2);
      const ew=bW/2-.04,eh=bH/2-.05;
      for(let ez=-pLen/2+.14;ez<pLen/2;ez+=.26){
        s(st,px-ew,bCY-eh,ez,px-ew,bCY+eh,ez);
        s(st,px-ew,bCY+eh,ez,px+ew,bCY+eh,ez);
        s(st,px+ew,bCY+eh,ez,px+ew,bCY-eh,ez);
        s(st,px+ew,bCY-eh,ez,px-ew,bCY-eh,ez);
      }
    });

    // Dalle
    addBox(0,flY-sH/2,0,W,sH,D);
    const my=flY-sH+.06;
    for(let mz=-D/2+.32;mz<D/2;mz+=.32) s(ms,-W/2,my,mz,W/2,my,mz);
    for(let mx=-W/2+.32;mx<W/2;mx+=.32) s(ms,mx,my,-D/2,mx,my,D/2);

    // Façade vitrée : panels + spandrels
    [-D/2,D/2].forEach(fz=>{
      spans.forEach(([x1,x2])=>{
        const pw=(x2-x1)-cW-.06,cx=(x1+x2)/2;
        addBox(cx, f*fH-sH-vH/2,    fz, pw, vH,   .06, glassMat);
        addBox(cx, (f-1)*fH+spH/2,  fz, pw, spH-.06, .08, spandrelMat);
      });
    });
    colX.forEach(fx=>{
      const pd=D-cD-.06;
      addBox(fx, f*fH-sH-vH/2,   0, .06, vH,      pd, glassMat);
      addBox(fx, (f-1)*fH+spH/2, 0, .08, spH-.06, pd, spandrelMat);
    });
  }

  // Acrotère
  const pH=1.0;
  addBox(0,  totalH+pH/2,-D/2-.10, W+.3,pH,.20,coreMat);
  addBox(0,  totalH+pH/2, D/2+.10, W+.3,pH,.20,coreMat);
  addBox(-W/2-.10,totalH+pH/2,0,.20,pH,D+.3,coreMat);
  addBox( W/2+.10,totalH+pH/2,0,.20,pH,D+.3,coreMat);
  addBox(-W/4,totalH+pH+1.4,0,W/2,2.8,D*.65,coreMat); // local tech

  // Armatures
  addLines(rb,matRb,2);
  addLines(st,matSt,2);
  addLines(ms,matMs,2);

  building.position.set(4, -totalH*.06, 0);
  scene.add(building);

  // ── SOL TRANSPARENT + TERRE ──────────────────────────────────────────────
  // Terre (visible sous le sol pour révéler fondations)
  const soilMesh = new THREE.Mesh(new THREE.BoxGeometry(60,2.2,60), soilMat);
  soilMesh.position.set(building.position.x, building.position.y-1.1-.02, 0);
  scene.add(soilMesh);

  // Sol vitré (semi-transparent)
  const groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(80,80), groundMat);
  groundMesh.rotation.x = -Math.PI/2;
  groundMesh.position.set(building.position.x, building.position.y+.01, 0);
  scene.add(groundMesh);

  // Grille technique
  const realGrid = new THREE.GridHelper(80,40,0x8A9EB4,0x8A9EB4);
  realGrid.position.set(building.position.x, building.position.y+.02, 0);
  realGrid.material.transparent=true; realGrid.material.opacity=0.13;
  scene.add(realGrid);

  // ─────────────────────────────────────────────────────────────────────────
  // ANIMATION ORBITALE — hélice de points dorés tournant autour de la tour
  // ─────────────────────────────────────────────────────────────────────────
  const ORBIT_N  = 90;
  const orbitPos = new Float32Array(ORBIT_N*3);
  const orbitGeo = new THREE.BufferGeometry();
  orbitGeo.setAttribute('position', new THREE.BufferAttribute(orbitPos, 3));
  const orbitMat = new THREE.PointsMaterial({
    color:0xC9A84C, size:0.10, transparent:true, opacity:0.70,
    sizeAttenuation:true,
  });
  const orbitPts = new THREE.Points(orbitGeo, orbitMat);
  scene.add(orbitPts);

  // ─────────────────────────────────────────────────────────────────────────
  // ONDES DE PULSE — anneaux qui montent depuis les fondations
  // ─────────────────────────────────────────────────────────────────────────
  const PULSE_N  = 4;
  const pulseMats = Array.from({length:PULSE_N}, ()=>
    new THREE.MeshBasicMaterial({
      color:0xC9A84C, transparent:true, opacity:0, side:THREE.DoubleSide,
    })
  );
  const pulseRings = pulseMats.map(mat=>{
    const geo = new THREE.RingGeometry(.5,1.2,48);
    const mesh = new THREE.Mesh(geo,mat);
    mesh.rotation.x = -Math.PI/2;
    mesh.position.set(building.position.x, building.position.y-sndH*.4, 0);
    scene.add(mesh);
    return mesh;
  });

  // ─────────────────────────────────────────────────────────────────────────
  // LIGNES DE CONNEXION (trait technique entre poteaux angulaires)
  // ─────────────────────────────────────────────────────────────────────────
  const connVerts = [];
  // Lignes diagonales structurelles (X-bracing symbolique)
  for(let f=0;f<nF;f++){
    const y0=f*fH+building.position.y, y1=y0+fH;
    const bx=building.position.x;
    // 2 diagonales par face avant
    connVerts.push(-W/2+bx,y0,-D/2, W/6+bx,y1,-D/2);
    connVerts.push( W/6+bx,y0,-D/2,-W/2+bx,y1,-D/2);
  }
  const connGeo = new THREE.BufferGeometry();
  connGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(connVerts),3));
  const connMat = new THREE.LineBasicMaterial({
    color:0x6A9EC8, transparent:true, opacity:0.12,
  });
  scene.add(new THREE.LineSegments(connGeo, connMat));

  // ── Particules ambiantes ──────────────────────────────────────────────────
  const ptP = new Float32Array(240*3);
  for(let i=0;i<240;i++){
    ptP[i*3]  =(Math.random()-.5)*60;
    ptP[i*3+1]=(Math.random()-.5)*50;
    ptP[i*3+2]=(Math.random()-.5)*40;
  }
  const ptGeo=new THREE.BufferGeometry();
  ptGeo.setAttribute('position',new THREE.BufferAttribute(ptP,3));
  const ptMat=new THREE.PointsMaterial({color:0xC9A84C,size:.055,transparent:true,opacity:.18});
  scene.add(new THREE.Points(ptGeo,ptMat));

  // Applique thème initial maintenant que tout est créé
  window.mhSceneSetTheme(initTheme);

  // ── Souris ────────────────────────────────────────────────────────────────
  let mX=0,mY=0,tX=0,tY=0,smoothMX=0,revealAmt=0,lastMove=0;
  function onMove(cx,cy){
    mX=(cx/window.innerWidth-.5)*2;
    mY=(cy/window.innerHeight-.5)*2;
    lastMove=Date.now();
  }
  document.addEventListener('mousemove',e=>onMove(e.clientX,e.clientY));
  document.addEventListener('touchmove',e=>onMove(e.touches[0].clientX,e.touches[0].clientY),{passive:true});
  let scrollY=0;
  window.addEventListener('scroll',()=>scrollY=window.scrollY,{passive:true});
  window.addEventListener('resize',()=>{
    camera.aspect=window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight);
  });

  // ── Boucle ────────────────────────────────────────────────────────────────
  const clock=new THREE.Clock();
  const rM=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  document.addEventListener('visibilitychange',()=>document.hidden?clock.stop():clock.start());

  (function animate(){
    requestAnimationFrame(animate);
    const t=clock.getElapsedTime();
    const bx=building.position.x, by=building.position.y;

    // Rotation bâtiment
    building.rotation.y = rM ? .18 : t*.022;

    // Parallaxe caméra
    tX+=(mX-tX)*.020; tY+=(mY-tY)*.020;
    camera.position.x = tX*2.8;
    camera.position.y = 10 + tY*2 - scrollY*.002;
    camera.lookAt(bx*.32, 10+tY*.4, 0);

    // Souris → reveal
    smoothMX+=(mX*.72-smoothMX)*.06;
    const idle=(Date.now()-lastMove)/1000;
    // Scan auto quand idle > 3s : balayage lent
    let target;
    if(idle>3){
      smoothMX = Math.sin(t*.28)*.55;
      target   = .30 + Math.sin(t*.45+1)*.22;
    } else {
      target = idle<.08 ? 1.0 : Math.max(0, 1-Math.max(0,idle-.08)/2.8);
    }
    revealAmt+=(target-revealAmt)*.05;

    [matRb,matSt,matMs].forEach(m=>{
      m.uniforms.uMX.value=smoothMX;
      m.uniforms.uRev.value=revealAmt;
    });
    concreteMat.opacity=.88+Math.sin(t*.22)*.04;
    glassMat.opacity=.35-revealAmt*.26;

    // ── Hélice orbitale ───────────────────────────────────────────────────
    const orbitR = 9.5 + Math.sin(t*.18)*1.2;
    for(let i=0;i<ORBIT_N;i++){
      const frac  = i/ORBIT_N;
      const angle = frac*Math.PI*4 + t*.38;         // 2 tours d'hélice
      const hy    = frac*totalH + by - 1;
      orbitPos[i*3]   = Math.cos(angle)*orbitR + bx;
      orbitPos[i*3+1] = hy;
      orbitPos[i*3+2] = Math.sin(angle)*orbitR;
    }
    orbitGeo.attributes.position.needsUpdate=true;

    // ── Ondes de pulse (fondations → sommet) ─────────────────────────────
    const PULSE_DUR=3.2, PULSE_MAX=13;
    pulseRings.forEach((ring,i)=>{
      const phase=((t*.30+i*(1/PULSE_N))%1);
      const r=PULSE_MAX*phase;
      ring.scale.set(r,r,1);
      ring.material.opacity=(1-phase)*.45;
      // Monte légèrement avec la phase
      ring.position.y = by-sndH*.4 + phase*totalH*.12;
    });

    renderer.render(scene,camera);
  })();

})();
