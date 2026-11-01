import {
  AmbientLight,
  Color,
  DirectionalLight,
  Fog,
  Group,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PointLight,
  Scene,
  WebGLRenderer,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/**
 * The landing hero: a calendar laid out as a field of tiles, seen in perspective. Tiles rise as a slow swell
 * moves through them and light up one by one, like appointments arriving on a real day.
 * Kept in its own module so three.js loads only after the page has painted.
 */
const PETROL = 0x062a30;
const TILE = 0x0e4a52;
const MINT = 0x5be38f;
const AMBER = 0xffb454;

const dummy = new Object3D();

export function mountHeroScene(host: HTMLElement, { animate, onReady }: { animate: boolean; onReady: () => void }) {
  const narrow = host.clientWidth < 700;
  const cols = narrow ? 15 : 29;
  const rows = narrow ? 23 : 21;
  const count = cols * rows;
  const step = 1.14;

  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, narrow ? 1.5 : 1.75));
  renderer.setSize(host.clientWidth, host.clientHeight);
  host.appendChild(renderer.domElement);
  renderer.domElement.style.display = "block";

  const scene = new Scene();
  scene.fog = new Fog(PETROL, narrow ? 22 : 20, narrow ? 42 : 38);

  const camera = new PerspectiveCamera(30, host.clientWidth / host.clientHeight, 0.1, 60);
  const distance = narrow ? 27 : 23;
  camera.position.set(0, 0, distance);

  scene.add(new AmbientLight(0x9fd8d4, 0.75));
  const key = new DirectionalLight(0xffffff, 1.9);
  key.position.set(-4, 7, 6);
  scene.add(key);
  const glow = new PointLight(MINT, 34, 11, 1.7);
  glow.position.set(2, 0, 3);
  scene.add(glow);

  const field = new Group();
  field.rotation.set(-1.02, 0, 0.5);
  field.position.set(narrow ? 0 : 5, narrow ? 7 : 1.4, 0);
  scene.add(field);

  const geometry = new RoundedBoxGeometry(1, 1, 0.34, 4, 0.13);
  const tiles = new InstancedMesh(geometry, new MeshStandardMaterial({ color: TILE, roughness: 0.42, metalness: 0.35 }), count);
  const booked = new InstancedMesh(
    geometry,
    new MeshStandardMaterial({ color: 0xffffff, emissive: 0x2a3a30, emissiveIntensity: 1, roughness: 0.38 }),
    count
  );
  field.add(tiles, booked);

  // A few tiles are "pending" (amber), most are confirmed (mint).
  const mint = new Color(MINT);
  const amber = new Color(AMBER);
  for (let i = 0; i < count; i++) booked.setColorAt(i, i % 7 === 0 ? amber : mint);
  if (booked.instanceColor) booked.instanceColor.needsUpdate = true;

  const lit = new Float32Array(count);
  const target = new Float32Array(count);
  // The seed is fixed: the opening frame is the same composition for every visitor.
  for (let i = 0; i < count; i++) target[i] = (i * 7919) % 11 === 0 ? 1 : 0;
  lit.set(target);

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const onPointer = (e: PointerEvent) => {
    pointer.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    pointer.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  };
  if (animate && !narrow) window.addEventListener("pointermove", onPointer, { passive: true });

  const draw = (time: number) => {
    const t = time / 1000;
    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;
    const px = pointer.x * 8;
    const py = -pointer.y * 6;

    for (let row = 0, i = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++, i++) {
        const x = (col - (cols - 1) / 2) * step;
        const y = (row - (rows - 1) / 2) * step;
        const swell = Math.sin(Math.hypot(x + 3, y - 2) * 0.62 - t * 0.7) * 0.2;
        const dp = (x - px) ** 2 + (y - py) ** 2;
        const lift = Math.exp(-dp / 7) * 0.5;

        lit[i] += (target[i] - lit[i]) * 0.07;
        const z = swell + lift + lit[i] * 0.42;

        // A lit tile grows out of the dark one, then replaces it outright so the two never fight for the same pixels.
        dummy.position.set(x, y, z);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        tiles.setMatrixAt(i, lit[i] > 0.9 ? ZERO : dummy.matrix);

        const size = lit[i] < 0.02 ? 0 : 0.5 + lit[i] * 0.5;
        dummy.position.z = z + 0.06;
        dummy.scale.set(size, size, 1);
        dummy.updateMatrix();
        booked.setMatrixAt(i, size === 0 ? ZERO : dummy.matrix);
      }
    }
    tiles.instanceMatrix.needsUpdate = true;
    booked.instanceMatrix.needsUpdate = true;

    const scroll = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1);
    field.rotation.x = -1.02 + scroll * 0.3 + pointer.y * 0.03;
    field.rotation.z = 0.5 + pointer.x * 0.04;
    camera.position.z = distance + scroll * 5;
    glow.position.set(px * 0.6 + 2, py * 0.3, 3);

    renderer.render(scene, camera);
  };

  // A new appointment arrives every so often; an old one clears so the day never fills completely.
  let lastBooking = 0;
  const book = (time: number) => {
    if (time - lastBooking < 900) return;
    lastBooking = time;
    const on = Math.floor(Math.random() * count);
    const off = Math.floor(Math.random() * count);
    target[on] = 1;
    if (on !== off) target[off] = 0;
  };

  let frame = 0;
  let visible = true;
  const loop = (time: number) => {
    frame = requestAnimationFrame(loop);
    if (!visible) return;
    book(time);
    draw(time);
  };

  // The first frame is drawn at once: a background tab gets no animation frames and would stay blank.
  draw(0);
  onReady();
  if (animate) frame = requestAnimationFrame(loop);

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
  });
  observer.observe(host);

  const onResize = () => {
    camera.aspect = host.clientWidth / Math.max(host.clientHeight, 1);
    camera.updateProjectionMatrix();
    renderer.setSize(host.clientWidth, host.clientHeight);
    if (!animate) draw(0);
  };
  window.addEventListener("resize", onResize, { passive: true });

  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    window.removeEventListener("resize", onResize);
    window.removeEventListener("pointermove", onPointer);
    geometry.dispose();
    (tiles.material as MeshStandardMaterial).dispose();
    (booked.material as MeshStandardMaterial).dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}

const ZERO = new Matrix4().makeScale(0, 0, 0);
