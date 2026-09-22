import type { GlobeArc, GlobeMarker } from "./parseGlobeTable";

export type GlobeTheme = {
  globe: number;
  land: number;
  marker: number;
  markerHot: number;
  arc: number;
};

export type GlobeMode = "volume" | "flow";

type MountOptions = {
  host: HTMLElement;
  markers: GlobeMarker[];
  arcs: GlobeArc[];
  mode: GlobeMode;
  selectedId: string | null;
  autoRotate: boolean;
  reducedMotion: boolean;
  theme: GlobeTheme;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
};

type ThreeModule = typeof import("three");

const RADIUS = 2.18;

export async function mountGlobe({
  host,
  markers,
  arcs,
  mode,
  selectedId,
  autoRotate,
  reducedMotion,
  theme,
  onSelect,
  onHover,
}: MountOptions) {
  const THREE = await import("three");
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 2, 0.1, 80);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  host.appendChild(renderer.domElement);

  const globe = new THREE.Group();
  scene.add(globe);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xc8c4bb, 2.05));
  const key = new THREE.DirectionalLight(0xffffff, 0.42);
  key.position.set(-3.2, 4.2, 5);
  scene.add(key);

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(RADIUS * 0.992, 48, 48),
    new THREE.MeshLambertMaterial({ color: theme.globe }),
  );
  globe.add(sphere);

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(RADIUS * 1.035, 48, 48),
    new THREE.MeshBasicMaterial({
      color: theme.markerHot,
      transparent: true,
      opacity: 0.075,
      side: THREE.BackSide,
      depthWrite: false,
    }),
  );
  globe.add(atmosphere);

  const land = await createLand(THREE, theme.land);
  globe.add(land);

  const markerGroup = new THREE.Group();
  globe.add(markerGroup);
  const arcGroup = new THREE.Group();
  globe.add(arcGroup);
  const markerById = new Map<string, { mesh: InstanceType<typeof THREE.Mesh>; ring: InstanceType<typeof THREE.Mesh> }>();
  const arcParticles: Array<{
    dot: InstanceType<typeof THREE.Mesh>;
    curve: InstanceType<typeof THREE.QuadraticBezierCurve3>;
    offset: number;
    speed: number;
  }> = [];

  const orbit = { az: -0.42, el: 0.18, r: 7.15 };
  const pointer = { dragging: false, x: 0, y: 0, az: orbit.az, el: orbit.el };
  let currentMode = mode;
  let currentSelected = selectedId;
  let currentTheme = theme;
  let automaticRotation = autoRotate;
  let hoveredId: string | null = null;
  let focusTween: { fromAz: number; fromEl: number; toAz: number; toEl: number; startedAt: number } | null = null;
  let running = true;
  let visible = true;
  let frame = 0;
  const raycaster = new THREE.Raycaster();
  const pointerNdc = new THREE.Vector2();
  const pickable: InstanceType<typeof THREE.Object3D>[] = [];

  function latLngToVector(lat: number, lng: number, radius = RADIUS) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta),
    );
  }

  function rebuildMarkers() {
    markerById.clear();
    pickable.length = 0;
    while (markerGroup.children.length) {
      const child = markerGroup.children[0];
      markerGroup.remove(child);
      disposeObject(child);
    }
    const source = currentMode === "flow"
      ? uniqueEndpoints(arcs)
      : markers;
    const max = Math.max(...source.map((item) => Math.abs(item.value)), 1);
    for (const item of source.slice(0, 40)) {
      const position = latLngToVector(item.lat, item.lng, RADIUS * 1.012);
      const hot = item.id === currentSelected;
      const size = currentMode === "volume" ? 0.038 + (Math.abs(item.value) / max) * 0.09 : 0.046;
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(size, 14, 14),
        new THREE.MeshBasicMaterial({ color: hot ? currentTheme.markerHot : currentTheme.marker }),
      );
      mesh.position.copy(position);
      mesh.userData.id = item.id;
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(size * 1.7, size * 2.05, 32),
        new THREE.MeshBasicMaterial({
          color: currentTheme.markerHot,
          transparent: true,
          opacity: hot ? 0.9 : 0,
          side: THREE.DoubleSide,
        }),
      );
      ring.position.copy(position);
      ring.lookAt(position.clone().multiplyScalar(2));
      markerGroup.add(mesh, ring);
      markerById.set(item.id, { mesh, ring });
      pickable.push(mesh);
    }
  }

  function rebuildArcs() {
    arcParticles.length = 0;
    while (arcGroup.children.length) {
      const child = arcGroup.children[0];
      arcGroup.remove(child);
      disposeObject(child);
    }
    if (currentMode !== "flow") return;
    for (const arc of arcs.slice(0, 18)) {
      const start = latLngToVector(arc.from.lat, arc.from.lng);
      const end = latLngToVector(arc.to.lat, arc.to.lng);
      const mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(RADIUS + start.distanceTo(end) * 0.28);
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(64));
      const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({
        color: currentTheme.arc,
        transparent: true,
        opacity: 0.72,
      }));
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.027, 10, 10),
        new THREE.MeshBasicMaterial({ color: currentTheme.arc, transparent: true, opacity: 0.95 }),
      );
      dot.position.copy(start);
      arcGroup.add(line, dot);
      arcParticles.push({ dot, curve, offset: Math.random(), speed: 0.075 + Math.random() * 0.055 });
    }
  }

  function applySelection(id: string | null) {
    currentSelected = id;
    for (const [markerId, parts] of markerById) {
      const hot = markerId === id;
      (parts.mesh.material as InstanceType<typeof THREE.MeshBasicMaterial>).color.setHex(hot ? currentTheme.markerHot : currentTheme.marker);
      (parts.ring.material as InstanceType<typeof THREE.MeshBasicMaterial>).opacity = hot ? 0.9 : 0;
      parts.mesh.scale.setScalar(hot ? 1.18 : 1);
    }
    focusTarget(id);
  }

  function focusTarget(id: string | null) {
    if (!id) return;
    const target = [...markers, ...uniqueEndpoints(arcs)].find((item) => item.id === id);
    if (!target) return;
    const point = latLngToVector(target.lat, target.lng);
    const toAz = orbit.az + shortestAngle(orbit.az, Math.atan2(point.x, point.z));
    const toEl = clamp(Math.asin(point.y / RADIUS) * 0.65 + 0.08, -0.6, 0.72);
    if (reducedMotion) {
      orbit.az = toAz;
      orbit.el = toEl;
      return;
    }
    focusTween = { fromAz: orbit.az, fromEl: orbit.el, toAz, toEl, startedAt: performance.now() };
  }

  function resize() {
    const width = host.clientWidth || 1;
    const height = host.clientHeight || 1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function render() {
    const now = performance.now();
    if (focusTween && !pointer.dragging) {
      const progress = Math.min(1, (now - focusTween.startedAt) / 720);
      const eased = 1 - Math.pow(1 - progress, 3);
      orbit.az = focusTween.fromAz + (focusTween.toAz - focusTween.fromAz) * eased;
      orbit.el = focusTween.fromEl + (focusTween.toEl - focusTween.fromEl) * eased;
      if (progress >= 1) focusTween = null;
    } else if (!reducedMotion && automaticRotation && !pointer.dragging && visible) {
      orbit.az += 0.00115;
    }
    if (!reducedMotion) {
      const pulse = (Math.sin(now * 0.0045) + 1) / 2;
      const activeRing = currentSelected ? markerById.get(currentSelected)?.ring : undefined;
      if (activeRing) {
        activeRing.scale.setScalar(1 + pulse * 0.42);
        (activeRing.material as InstanceType<typeof THREE.MeshBasicMaterial>).opacity = 0.76 - pulse * 0.34;
      }
      for (const particle of arcParticles) {
        const progress = (particle.offset + now * 0.001 * particle.speed) % 1;
        particle.dot.position.copy(particle.curve.getPoint(progress));
      }
    }
    camera.position.set(
      orbit.r * Math.cos(orbit.el) * Math.sin(orbit.az),
      orbit.r * Math.sin(orbit.el),
      orbit.r * Math.cos(orbit.el) * Math.cos(orbit.az),
    );
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }

  const onPointerDown = (event: PointerEvent) => {
    focusTween = null;
    pointer.dragging = true;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.az = orbit.az;
    pointer.el = orbit.el;
    host.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent) => {
    if (pointer.dragging) {
      orbit.az = pointer.az + (event.clientX - pointer.x) * 0.005;
      orbit.el = clamp(pointer.el + (event.clientY - pointer.y) * 0.003, -0.9, 0.9);
      return;
    }
    const id = pickMarker(event);
    if (id === hoveredId) return;
    hoveredId = id;
    renderer.domElement.style.cursor = id ? "pointer" : "grab";
    onHover(id);
  };
  const onPointerUp = (event: PointerEvent) => {
    if (!pointer.dragging) return;
    const dx = Math.abs(event.clientX - pointer.x);
    const dy = Math.abs(event.clientY - pointer.y);
    pointer.dragging = false;
    if (dx > 6 || dy > 6) return;
    const id = pickMarker(event);
    if (id) onSelect(id);
  };
  const onPointerLeave = () => {
    if (hoveredId) {
      hoveredId = null;
      onHover(null);
    }
    renderer.domElement.style.cursor = pointer.dragging ? "grabbing" : "grab";
  };

  function pickMarker(event: PointerEvent) {
    const rect = renderer.domElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointerNdc, camera);
    const id = raycaster.intersectObjects(pickable, false)[0]?.object.userData.id;
    return typeof id === "string" ? id : null;
  }

  host.addEventListener("pointerdown", onPointerDown);
  host.addEventListener("pointermove", onPointerMove);
  host.addEventListener("pointerup", onPointerUp);
  host.addEventListener("pointerleave", onPointerLeave);
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  const visibility = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
  }, { threshold: 0.15 });
  visibility.observe(host);

  rebuildMarkers();
  rebuildArcs();
  applySelection(currentSelected);
  resize();
  if (markers[0] && currentMode === "volume") applySelection(currentSelected ?? markers[0].id);

  const tick = () => {
    if (!running) return;
    frame = window.requestAnimationFrame(tick);
    if (visible) render();
  };
  tick();

  return {
    setSelected(id: string | null) {
      applySelection(id);
    },
    setMode(next: GlobeMode) {
      currentMode = next;
      rebuildMarkers();
      rebuildArcs();
      applySelection(currentSelected);
    },
    setTheme(next: GlobeTheme) {
      currentTheme = next;
      (sphere.material as InstanceType<typeof THREE.MeshLambertMaterial>).color.setHex(next.globe);
      (atmosphere.material as InstanceType<typeof THREE.MeshBasicMaterial>).color.setHex(next.markerHot);
      (land.material as InstanceType<typeof THREE.PointsMaterial>).color.setHex(next.land);
      rebuildMarkers();
      rebuildArcs();
      applySelection(currentSelected);
    },
    setAutoRotate(next: boolean) {
      automaticRotation = next;
    },
    focus(id: string | null) {
      focusTarget(id);
    },
    dispose() {
      running = false;
      window.cancelAnimationFrame(frame);
      host.removeEventListener("pointerdown", onPointerDown);
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerup", onPointerUp);
      host.removeEventListener("pointerleave", onPointerLeave);
      observer.disconnect();
      visibility.disconnect();
      disposeObject(scene);
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

async function createLand(THREE: ThreeModule, color: number) {
  const positions: number[] = [];
  try {
    const response = await fetch("/tools/land-dots.json");
    if (response.ok) {
      const dots = await response.json() as number[];
      for (let index = 0; index < dots.length; index += 2) {
        const lat = dots[index];
        const lng = dots[index + 1];
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lng + 180) * (Math.PI / 180);
        positions.push(
          -RADIUS * Math.sin(phi) * Math.cos(theta),
          RADIUS * Math.cos(phi),
          RADIUS * Math.sin(phi) * Math.sin(theta),
        );
      }
    }
  } catch {
    // Fallback below.
  }
  if (positions.length < 32) {
    for (let index = 0; index < 2600; index += 1) {
      const y = 1 - (index / 2599) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta = index * 2.399963;
      positions.push(RADIUS * radius * Math.cos(theta), RADIUS * y, RADIUS * radius * Math.sin(theta));
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({
    color,
    size: 0.026,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
  }));
}

function uniqueEndpoints(arcs: GlobeArc[]): GlobeMarker[] {
  const map = new Map<string, GlobeMarker>();
  for (const arc of arcs) {
    map.set(arc.from.id, arc.from);
    map.set(arc.to.id, arc.to);
  }
  return [...map.values()];
}

function shortestAngle(from: number, to: number) {
  let delta = (to - from) % (Math.PI * 2);
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function disposeObject(object: { traverse?: (cb: (child: unknown) => void) => void } | { geometry?: { dispose: () => void }; material?: { dispose: () => void } | Array<{ dispose: () => void }> }) {
  const root = object as { traverse?: (cb: (child: unknown) => void) => void };
  if (typeof root.traverse === "function") {
    root.traverse((child) => disposeNode(child));
    return;
  }
  disposeNode(object);
}

function disposeNode(node: unknown) {
  const item = node as { geometry?: { dispose: () => void }; material?: { dispose: () => void } | Array<{ dispose: () => void }> };
  item.geometry?.dispose();
  if (Array.isArray(item.material)) item.material.forEach((material) => material.dispose());
  else item.material?.dispose();
}
