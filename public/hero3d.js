import * as THREE from './vendor/three.module.min.js';

/* Living key art: depth-parallax photo with breathing, chrome sheen, thread glow and floating dust. */
const host = document.getElementById('heroBg');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer = null;
try { renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' }); } catch (e) { renderer = null; }

if (renderer && host) {
  const canvas = renderer.domElement;
  canvas.className = 'hero-gl';
  host.appendChild(canvas);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, matchMedia('(pointer: coarse)').matches ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
  const loader = new THREE.TextureLoader();
  const uniforms = {
    uImg: { value: null }, uDepth: { value: null }, uFx: { value: null },
    uTime: { value: 0 }, uMouse: { value: new THREE.Vector2() }, uView: { value: new THREE.Vector2(1, 1) },
    uImgAspect: { value: 1672 / 941 }, uIntro: { value: reduce ? 1 : 0 }, uScroll: { value: 0 }, uStrength: { value: reduce ? 0.0 : 1.0 }
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true,
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uImg, uDepth, uFx;
      uniform float uTime, uImgAspect, uIntro, uScroll, uStrength;
      uniform vec2 uMouse, uView;
      vec2 cover(vec2 uv){
        float va = uView.x / uView.y;
        vec2 s = va > uImgAspect ? vec2(1.0, uImgAspect / va) : vec2(va / uImgAspect, 1.0);
        vec2 c = vec2(0.52, 0.42);
        return (uv - c) * s + c;
      }
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main(){
        float zoom = mix(1.32, 1.0, uIntro) - uScroll * 0.08;
        vec2 uv = cover((vUv - 0.5) / zoom + 0.5);
        vec2 sway = vec2(sin(uTime * 0.35), cos(uTime * 0.27)) * 0.55;
        vec2 off = (uMouse + sway * 0.6) * uStrength;
        float d = texture2D(uDepth, uv).r;
        // iterative parallax for cleaner edges
        vec2 p = uv;
        for (int i = 0; i < 4; i++) { d = texture2D(uDepth, p).r; p = uv + off * (d - 0.45) * vec2(0.022, 0.016) * (1.0 + uScroll * 1.5); }
        vec3 fx = texture2D(uFx, p).rgb;
        // breathing: the figure gently rises and falls
        float body = fx.b;
        p.y += sin(uTime * 1.15) * 0.0016 * body * uStrength;
        vec3 col = texture2D(uImg, p).rgb;
        // chrome sheen sweeping across the lettering
        float band = smoothstep(0.08, 0.0, abs(fract(p.x * 0.55 - p.y * 0.35 - uTime * 0.08) - 0.5) - 0.0);
        col += vec3(1.0, 0.97, 0.92) * fx.r * band * 0.55 * uStrength;
        // copper thread pulses
        float pulse = 0.5 + 0.5 * sin(uTime * 2.2 - p.x * 9.0);
        col += vec3(1.0, 0.62, 0.28) * fx.g * pulse * 0.32 * uStrength;
        // depth haze: background dims slightly, figure pops
        float dd = texture2D(uDepth, p).r;
        col *= mix(0.97, 1.03, smoothstep(0.1, 0.7, dd));
        // intro + scroll fade
        col *= mix(0.08, 1.0, uIntro) * (1.0 - uScroll * 0.35);
        gl_FragColor = vec4(col, 1.0);
      }`
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  scene.add(quad);

  let ready = 0;
  const done = () => { if (++ready === 3) { host.classList.add('gl-on'); } };
  loader.load('assets/hero.webp', t => { t.colorSpace = THREE.NoColorSpace; t.minFilter = THREE.LinearFilter; /* pass original colours straight through */ uniforms.uImg.value = t; done(); });
  loader.load('assets/hero-depth.png', t => { uniforms.uDepth.value = t; done(); });
  loader.load('assets/hero-fx.png', t => { uniforms.uFx.value = t; done(); });

  function resize() {
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false);
    uniforms.uView.value.set(w, h);
  }
  addEventListener('resize', resize); addEventListener('e1:view', resize); resize();

  const target = new THREE.Vector2();
  host.closest('.hero-media').addEventListener('pointermove', e => {
    const r = e.currentTarget.getBoundingClientRect();
    target.set(((e.clientX - r.left) / r.width - 0.5) * 2, -((e.clientY - r.top) / r.height - 0.5) * 2);
  });
  // phones: tilt follows the device if available, otherwise the auto sway runs
  addEventListener('deviceorientation', e => { if (e.gamma == null) return; target.set(Math.max(-1, Math.min(1, e.gamma / 25)), Math.max(-1, Math.min(1, (e.beta - 45) / 25))); });

  window.E1_hero3d = {
    intro() { if (window.gsap && !reduce) window.gsap.to(uniforms.uIntro, { value: 1, duration: 2.6, ease: 'expo.out' }); else uniforms.uIntro.value = 1; }
  };

  if (window.E1_introPlayed) window.E1_hero3d.intro();
  setTimeout(() => { if (uniforms.uIntro.value < 0.5) window.E1_hero3d.intro(); }, 4500); // never stay dark
  let visible = true;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(host);
  const clock = new THREE.Clock();
  (function tick() {
    requestAnimationFrame(tick);
    if (!visible || !ready || document.hidden) return;
    if (host.clientWidth !== uniforms.uView.value.x) resize();
    uniforms.uTime.value = clock.getElapsedTime();
    uniforms.uMouse.value.lerp(target, 0.05);
    const hh = host.clientHeight || 1;
    uniforms.uScroll.value = Math.min(1, Math.max(0, window.scrollY / hh));
    renderer.render(scene, camera);
  })();
}
