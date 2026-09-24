import * as THREE from 'three';

const root = document.documentElement;
const stage = document.querySelector('.paper-stage');
const toggle = document.querySelector('.motion-toggle');
const loading = document.querySelector('.scene-loading');
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const pointerFine = matchMedia('(hover: hover) and (pointer: fine)');
let paused = false;
let active = false;
let disposed = false;
let inView = true;
let frame = 0;
let elapsed = 0;
let lastTime = 0;
let renderer, scene, camera, sculpture, observer, resizeObserver;
const target = new THREE.Vector2();
const smoothed = new THREE.Vector2();
const sheets = [];
const disposables = [];

function finishLoading(available) {
  stage.dataset.state = available ? 'ready' : 'fallback';
  root.classList.remove('scene-pending');
  loading.hidden = true;
  toggle.hidden = !available;
}

function pageTexture(index) {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 880;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = index === 3 ? '#1647df' : '#ffffff';
  ctx.fillRect(0, 0, 640, 880);
  const ink = index === 3 ? '#ffffff' : '#151922';
  ctx.strokeStyle = index === 3 ? '#7597ff' : '#d8dee9';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, 638, 878);
  ctx.fillStyle = ink;
  ctx.font = 'bold 28px Arial';
  ctx.fillText('research.', 50, 72);
  ctx.font = '16px Arial';
  ctx.fillText('SEPTEMBER 2026', 50, 810);
  ctx.fillText(String(index + 1).padStart(2, '0'), 550, 72);
  ctx.fillStyle = index === 3 ? '#ffffff' : '#1647df';
  ctx.font = 'italic 290px Georgia';
  ctx.fillText('09', 55, 440);
  ctx.fillStyle = ink;
  ctx.font = '32px Georgia';
  ctx.fillText('Papers worth reading.', 50, 535);
  ctx.fillStyle = index === 3 ? '#83a0f4' : '#d6dce8';
  [490, 450, 490, 340].forEach((width, n) => ctx.fillRect(50, 592 + n * 28, width, 5));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
  disposables.push(texture);
  return texture;
}

function render(time) {
  frame = 0;
  if (disposed) return;
  const delta = Math.min((time - (lastTime || time)) / 1000, 0.045);
  lastTime = time;
  if (active) elapsed += delta;
  smoothed.lerp(target, 1 - Math.exp(-delta * 5));
  sculpture.rotation.set(-0.14 + smoothed.y * 0.15, -0.43 + smoothed.x * 0.24, -0.12);
  sculpture.position.y = Math.sin(elapsed * 0.65) * 0.07;
  sheets.forEach((sheet, index) => {
    const center = index - 3;
    const breathing = (Math.sin(elapsed * 0.45) + 1) / 2;
    sheet.position.set(center * (0.09 + breathing * 0.03), center * 0.095, center * (0.19 + breathing * 0.035));
    sheet.rotation.z = center * (0.04 + Math.sin(elapsed * 0.4) * 0.016);
    sheet.rotation.y = center * 0.035;
  });
  renderer.render(scene, camera);
  if (active) frame = requestAnimationFrame(render);
}

function sync() {
  if (!renderer || disposed) return;
  active = !paused && !preference.matches && !document.hidden && inView;
  root.classList.toggle('motion-paused', paused || preference.matches);
  toggle.textContent = paused ? 'Resume motion' : 'Pause motion';
  toggle.setAttribute('aria-pressed', String(paused));
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
  lastTime = 0;
  if (active) frame = requestAnimationFrame(render);
}

function dispose() {
  disposed = true;
  cancelAnimationFrame(frame);
  observer?.disconnect();
  resizeObserver?.disconnect();
  disposables.forEach(item => item.dispose());
  renderer?.dispose();
}

function init() {
  if (preference.matches || !stage) {
    finishLoading(false);
    return;
  }
  root.classList.add('scene-pending');
  loading.hidden = false;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 720 ? 1.25 : 1.75));
    renderer.setClearColor(0xffffff, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    stage.prepend(renderer.domElement);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
    camera.position.set(0, 0.1, 8.7);
    camera.lookAt(0, 0, 0);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8d9ec0, 2.8));
    const key = new THREE.DirectionalLight(0xffffff, 3.1);
    key.position.set(-3, 6, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x4874ff, 1.2);
    rim.position.set(4, 1, -2);
    scene.add(rim);
    sculpture = new THREE.Group();
    scene.add(sculpture);
    const geometry = new THREE.BoxGeometry(2.15, 2.96, 0.018);
    disposables.push(geometry);
    for (let i = 0; i < 7; i++) {
      const side = new THREE.MeshStandardMaterial({ color: i === 3 ? 0x1647df : 0xe5eaf5, roughness: 0.7 });
      const front = new THREE.MeshBasicMaterial({ map: pageTexture(i), toneMapped: false });
      const back = new THREE.MeshStandardMaterial({ color: i === 3 ? 0x1647df : 0xfafcff, roughness: 0.8 });
      disposables.push(side, front, back);
      const sheet = new THREE.Mesh(geometry, [side, side, side, side, front, back]);
      sculpture.add(sheet);
      sheets.push(sheet);
    }
    const resize = () => {
      const { width, height } = stage.getBoundingClientRect();
      if (!width || !height || disposed) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      if (!active) render(performance.now());
    };
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);
    stage.addEventListener('pointermove', event => {
      if (!pointerFine.matches || paused || preference.matches) return;
      const rect = stage.getBoundingClientRect();
      target.set((event.clientX - rect.left) / rect.width * 2 - 1, (event.clientY - rect.top) / rect.height * 2 - 1);
    });
    stage.addEventListener('pointerleave', () => target.set(0, 0));
    renderer.domElement.addEventListener('webglcontextlost', event => {
      event.preventDefault();
      dispose();
      finishLoading(false);
    });
    observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); }, { rootMargin: '50px' });
    observer.observe(stage);
    resize();
    render(performance.now());
    finishLoading(true);
    sync();
  } catch {
    dispose();
    finishLoading(false);
  }
}

toggle?.addEventListener('click', () => { paused = !paused; sync(); });
document.addEventListener('visibilitychange', sync);
preference.addEventListener('change', () => {
  if (preference.matches) {
    paused = true;
    document.querySelectorAll('.pick').forEach(card => card.style.removeProperty('transform'));
  }
  sync();
});
window.addEventListener('pagehide', dispose, { once: true });
window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });

document.querySelectorAll('.pick').forEach(card => {
  card.addEventListener('pointermove', event => {
    if (!pointerFine.matches || preference.matches || paused) return;
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(1200px) rotateX(${-y * 2.4}deg) rotateY(${x * 2.4}deg) translateZ(0)`;
  });
  card.addEventListener('pointerleave', () => card.style.removeProperty('transform'));
});

if ('IntersectionObserver' in window && !preference.matches) {
  const reveal = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('revealed');
      reveal.unobserve(entry.target);
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.pick, .paper').forEach(item => reveal.observe(item));
}
requestAnimationFrame(init);
