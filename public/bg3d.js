import * as THREE from './vendor/three.module.min.js';

/* Site background: near-black with slow copper and steel nebula, faint star dust. */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer = null;
try { renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'low-power' }); } catch (e) { renderer = null; }
if (renderer) {
  const c = renderer.domElement;
  c.id = 'bgCanvas';
  document.body.prepend(c);
  const scale = 0.32;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5) * scale);
  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const u = { uT: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) }, uScroll: { value: 0 }, uMouse: { value: new THREE.Vector2() } };
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: u,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `
      precision highp float; varying vec2 vUv;
      uniform float uT, uScroll; uniform vec2 uRes, uMouse;
      float h(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 45758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
      float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 3; i++){ v += a * n(p); p = p * 2.03 + 17.1; a *= 0.5; } return v; }
      void main(){
        vec2 uv = vUv; float ar = uRes.x / uRes.y;
        vec2 p = vec2(uv.x * ar, uv.y) * 1.6 + vec2(0.0, uScroll * 0.00035) + uMouse * 0.04;
        float t = uT * 0.025;
        vec2 q = vec2(fbm(p + t), fbm(p - t + 4.7));
        float f = fbm(p + q * 1.6 + vec2(t * 0.6, -t));
        float f2 = fbm(p * 0.7 - q + vec2(-t, t * 0.4) + 9.0);
        vec3 col = vec3(0.012, 0.012, 0.016);
        col += vec3(0.85, 0.52, 0.26) * pow(f, 3.2) * 0.22;      // copper nebula
        col += vec3(0.30, 0.36, 0.50) * pow(f2, 3.0) * 0.16;     // steel haze
        col += vec3(0.45, 0.22, 0.32) * pow(f * f2, 2.2) * 0.07; // faint plum where they meet
        // stars: sparse, twinkling, drift with scroll
        vec2 sp = (uv * uRes) / 2.2 + vec2(0.0, uScroll * 0.08);
        vec2 cell = floor(sp); vec2 fr = fract(sp) - 0.5;
        float r = h(cell);
        float star = step(0.9975, r) * smoothstep(0.5, 0.0, length(fr) * (1.4 + 2.0 * h(cell + 3.1)));
        star *= 0.45 + 0.55 * sin(uT * (1.0 + r * 3.0) + r * 40.0);
        col += vec3(1.0, 0.93, 0.85) * star * 0.75;
        // vignette
        float v = smoothstep(1.25, 0.2, length((uv - 0.5) * vec2(ar * 0.9, 1.0)));
        col *= mix(0.55, 1.0, v);
        gl_FragColor = vec4(col, 1.0);
      }`
  })));
  const resize = () => { renderer.setSize(innerWidth, innerHeight, false); u.uRes.value.set(innerWidth, innerHeight); };
  addEventListener('resize', resize); resize();
  const m = new THREE.Vector2();
  addEventListener('pointermove', e => m.set(e.clientX / innerWidth - 0.5, 0.5 - e.clientY / innerHeight));
  const clock = new THREE.Clock(); let last = 0, frozen = !!window.E1_lowPower;
  addEventListener('e1:lowpower', () => { frozen = true; });
  (function tick(now) {
    requestAnimationFrame(tick);
    if (document.hidden || now - last < 42) return; // ~24fps is plenty for a slow nebula
    if (frozen && last) return; // slow device: keep the last frame as a still background
    const home = document.getElementById('view-home');
    if (home && home.classList.contains('active') && scrollY < innerHeight * 0.55 && last) return; // hero image covers it
    last = now;
    u.uT.value = reduce ? 10 : clock.getElapsedTime();
    u.uScroll.value = scrollY;
    u.uMouse.value.lerp(m, 0.04);
    renderer.render(scene, cam);
  })(0);
  document.documentElement.classList.add('has-bg3d');
}
