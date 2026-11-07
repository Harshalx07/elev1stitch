import * as THREE from './vendor/three.module.min.js';

const canvas = document.getElementById('ringCanvas');
const sec = document.getElementById('work');
const WORK = window.E1_WORK || [];
let renderer = null;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (e) { renderer = null; }

if (!renderer || !WORK.length) {
  document.documentElement.classList.add('no-webgl');
} else {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, matchMedia('(pointer: coarse)').matches ? 1.25 : 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  addEventListener('e1:lowpower', () => { renderer.setPixelRatio(1); resize(); });
  if (window.E1_lowPower) renderer.setPixelRatio(1);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x050506, 9.5, 17.5);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  const CAMZ = 13.2;
  camera.position.set(0, 0.4, CAMZ);

  const ring = new THREE.Group();
  scene.add(ring);
  const R = 4.6, PW = 2.25, PH = 3.0, n = WORK.length, step = Math.PI * 2 / n;

  function bentPlane(w, h, seg) {
    const g = new THREE.PlaneGeometry(w, h, seg, 1);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const a = p.getX(i) / R;
      p.setX(i, Math.sin(a) * R);
      p.setZ(i, Math.cos(a) * R);
    }
    p.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }
  const geo = bentPlane(PW, PH, 40);
  const frameGeo = bentPlane(PW + 0.08, PH + 0.08, 40);

  const gc = document.createElement('canvas'); gc.width = 4; gc.height = 256;
  const gx = gc.getContext('2d');
  const gr = gx.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#000'); gr.addColorStop(0.5, '#000'); gr.addColorStop(1, '#5a5a5a');
  gx.fillStyle = gr; gx.fillRect(0, 0, 4, 256);
  const alphaTex = new THREE.CanvasTexture(gc);

  const loader = new THREE.TextureLoader();
  const items = [];
  const fronts = [];
  WORK.forEach((w, i) => {
    const holder = new THREE.Group();
    holder.rotation.y = i * step;
    const mat = new THREE.MeshBasicMaterial({ color: 0x222226, side: THREE.FrontSide });
    const front = new THREE.Mesh(geo, mat);
    front.userData.index = i;
    const back = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x0c0c0f, side: THREE.BackSide }));
    const frame = new THREE.Mesh(frameGeo, new THREE.MeshBasicMaterial({ color: 0xe3a35c, transparent: true, opacity: 0.0, side: THREE.FrontSide }));
    frame.position.z = -0.01;
    const reflMat = new THREE.MeshBasicMaterial({ color: 0x777777, transparent: true, alphaMap: alphaTex, depthWrite: false, side: THREE.FrontSide });
    const refl = new THREE.Mesh(geo, reflMat);
    refl.scale.y = -1;
    refl.position.y = -PH - 0.14;
    const item = new THREE.Group();
    item.add(frame, front, back, refl);
    holder.add(item);
    ring.add(holder);
    loader.load(`assets/real/${w.id}-tex.webp`, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      mat.map = t; mat.color.set(0xbdbdbd); mat.needsUpdate = true;
      reflMat.map = t; reflMat.needsUpdate = true;
    });
    items.push({ item, front, frame, mat, hover: 0 });
    fronts.push(front);
  });

  // floating thread dust
  const COUNT = 520;
  const pos = new Float32Array(COUNT * 3), spd = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 18;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 12;
    spd[i] = 0.002 + Math.random() * 0.006;
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dot = document.createElement('canvas'); dot.width = dot.height = 32;
  const dx = dot.getContext('2d');
  const rg = dx.createRadialGradient(16, 16, 0, 16, 16, 16);
  rg.addColorStop(0, 'rgba(255,220,170,1)'); rg.addColorStop(0.4, 'rgba(227,163,92,.6)'); rg.addColorStop(1, 'rgba(227,163,92,0)');
  dx.fillStyle = rg; dx.fillRect(0, 0, 32, 32);
  const pts = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.07, map: new THREE.CanvasTexture(dot), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(pts);

  // interaction
  let cur = 0, drag = 0, vel = 0, dragging = false, lastX = 0, moved = 0, mx = 0, my = 0, hovered = -1, active = -1;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; moved = 0; vel = 0; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointerup', (e) => {
    dragging = false;
    if (moved < 6 && hovered >= 0 && window.E1_openLB) window.E1_openLB(hovered);
  });
  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mx = (e.clientX - r.left) / r.width - 0.5;
    my = (e.clientY - r.top) / r.height - 0.5;
    ndc.set(mx * 2, -my * 2);
    if (dragging) { const d = e.clientX - lastX; drag += d * 0.006; vel = d * 0.006; moved += Math.abs(d); lastX = e.clientX; }
  });
  canvas.addEventListener('pointerleave', () => { hovered = -1; window.E1_cursor && window.E1_cursor(''); });

  let visible = false;
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0 }).observe(sec);

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const ar = w / h; camera.position.z = ar >= 1 ? CAMZ : CAMZ / Math.min(1, ar * 1.75);
    scene.fog.near = camera.position.z - 3.2;
    scene.fog.far = camera.position.z + 6.5;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  window.addEventListener('e1:view', resize);
  resize();

  let introDone = false;
  function intro() {
    if (introDone || !window.gsap) return;
    introDone = true;
    items.forEach((it, i) => {
      window.gsap.from(it.item.position, { y: -7, duration: 1.8, ease: 'expo.out', delay: 0.1 + i * 0.07 });
      window.gsap.from(it.item.rotation, { z: (i % 2 ? 1 : -1) * 0.6, duration: 1.8, ease: 'expo.out', delay: 0.1 + i * 0.07 });
    });
  }

  const clock = new THREE.Clock();
  function tick() {
    requestAnimationFrame(tick);
    const home = document.getElementById('view-home');
    if (!visible || !home.classList.contains('active')) return;
    if (!introDone) intro();
    resize.lastW !== canvas.clientWidth && (resize(), resize.lastW = canvas.clientWidth);
    const t = clock.getElapsedTime();
    if (!dragging) { drag += vel; vel *= 0.94; }
    const p = window.__ringP || 0;
    const target = -p * step * (n - 1) - drag;
    cur += (target - cur) * 0.075;
    ring.rotation.y = cur + Math.sin(t * 0.3) * 0.02;
    ring.rotation.x = 0.05 + my * 0.06;
    camera.position.x += (mx * 0.9 - camera.position.x) * 0.05;
    camera.position.y += (0.4 - my * 0.5 - camera.position.y) * 0.05;
    camera.lookAt(0, 0.15, 0);

    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(fronts, false)[0];
    const h = hit ? hit.object.userData.index : -1;
    if (h !== hovered) { hovered = h; window.E1_cursor && window.E1_cursor(h >= 0 ? 'View' : 'Drag'); }
    items.forEach((it, i) => {
      it.hover += ((i === hovered ? 1 : 0) - it.hover) * 0.12;
      const s = 1 + it.hover * 0.06;
      it.front.scale.set(s, s, 1);
      it.frame.scale.set(s, s, 1);
      it.frame.material.opacity = it.hover * 0.9;
      it.mat.color.setScalar(0.74 + it.hover * 0.26);
    });
    const a = ((Math.round(-cur / step) % n) + n) % n;
    if (a !== active) { active = a; window.E1_ringActive && window.E1_ringActive(a); }
    const pa = pg.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {
      pa[i * 3 + 1] += spd[i];
      pa[i * 3] += Math.sin(t + i) * 0.0015;
      if (pa[i * 3 + 1] > 5) pa[i * 3 + 1] = -5;
    }
    pg.attributes.position.needsUpdate = true;
    pts.rotation.y = cur * 0.3;
    renderer.render(scene, camera);
  }
  tick();
}
