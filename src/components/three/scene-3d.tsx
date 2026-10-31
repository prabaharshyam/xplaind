"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

/**
 * MO-5: a WebGL picture for page headers: glossy pastel nodes joined like a neural network,
 * drifting and turning with the pointer and the scroll. Decorative only (aria-hidden).
 * Three.js loads only when the scene is on screen, the loop pauses off screen and in hidden
 * tabs, reduced motion gets one still frame, and without WebGL the fallback stays.
 */
export function Scene3D({
  colors,
  seed,
  density = "hero",
  /** Include a position (relative or absolute): the canvas and fallback fill this box. */
  className = "relative",
  fallback,
}: {
  colors: readonly string[];
  seed: string;
  density?: "hero" | "panel";
  className?: string;
  fallback?: ReactNode;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);
  const key = `${colors.join(",")}|${seed}|${density}`;

  useEffect(() => {
    const el = host.current;
    if (!el || !webglAvailable() || saveData()) return;
    let dispose: (() => void) | null = null;
    let cancelled = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || dispose) return;
        void mount(el, key.split("|")[0].split(","), key.split("|")[1], density).then((d) => {
          if (cancelled) d();
          else {
            dispose = d;
            setLive(true);
          }
        });
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
      dispose?.();
    };
  }, [key, density]);

  return (
    <div className={className} aria-hidden="true">
      {fallback && <div className={`absolute inset-0 transition-transform duration-700 ${live ? "scale-95 invisible" : ""}`}>{fallback}</div>}
      <div ref={host} className="absolute inset-0" />
    </div>
  );
}

function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}

function saveData(): boolean {
  return Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
}

/** A small seeded random generator, so each page's scene is stable between visits. */
function rng(seedText: string) {
  let h = 2166136261;
  for (const ch of seedText) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

async function mount(el: HTMLElement, colors: string[], seed: string, density: "hero" | "panel"): Promise<() => void> {
  const THREE = await import("three");
  const rand = rng(seed);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const small = el.clientWidth < 420;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 10);

  scene.add(new THREE.HemisphereLight(0xffffff, new THREE.Color(colors[1] ?? colors[0]).lerp(new THREE.Color(0xffffff), 0.4), 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(4, 6, 8);
  scene.add(key);
  const rim = new THREE.DirectionalLight(new THREE.Color(colors[2] ?? colors[0]), 1.2);
  rim.position.set(-6, -3, 2);
  scene.add(rim);

  const group = new THREE.Group();
  scene.add(group);
  const geometries: { dispose(): void }[] = [];
  const materials: { dispose(): void }[] = [];
  const material = (hex: string, extra: Record<string, unknown> = {}) => {
    const m = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(hex), roughness: 0.32, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.2, ...extra });
    materials.push(m);
    return m;
  };

  // The network: nodes on a squashed sphere, each joined to its two nearest neighbours.
  const count = density === "hero" ? (small ? 12 : 18) : small ? 7 : 10;
  const sphere = new THREE.SphereGeometry(1, 32, 16);
  geometries.push(sphere);
  const nodes: { mesh: InstanceType<typeof THREE.Mesh>; base: InstanceType<typeof THREE.Vector3>; phase: number; speed: number }[] = [];
  for (let i = 0; i < count; i++) {
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(2 * rand() - 1);
    const r = 2.2 + rand() * 1.6;
    const base = new THREE.Vector3(r * Math.sin(phi) * Math.cos(theta) * 1.45, r * Math.cos(phi) * 0.85, r * Math.sin(phi) * Math.sin(theta) * 0.9);
    const mesh = new THREE.Mesh(sphere, material(colors[i % colors.length]));
    mesh.scale.setScalar(0.16 + rand() * 0.34);
    mesh.position.copy(base);
    group.add(mesh);
    nodes.push({ mesh, base, phase: rand() * Math.PI * 2, speed: 0.4 + rand() * 0.6 });
  }
  const pairs: [number, number][] = [];
  nodes.forEach((n, i) => {
    nodes
      .map((m, j) => ({ j, d: n.base.distanceTo(m.base) }))
      .filter((x) => x.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2)
      .forEach(({ j }) => {
        if (!pairs.some(([a, b]) => (a === i && b === j) || (a === j && b === i))) pairs.push([i, j]);
      });
  });
  const linePositions = new Float32Array(pairs.length * 6);
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
  geometries.push(lineGeometry);
  const lineMaterial = new THREE.LineBasicMaterial({ color: new THREE.Color(colors[0]).lerp(new THREE.Color(0x4c1d95), 0.35), transparent: true, opacity: 0.55 });
  materials.push(lineMaterial);
  group.add(new THREE.LineSegments(lineGeometry, lineMaterial));

  // Two larger signature shapes: a faceted gem and a ring, the "ideas" the network connects.
  const gemGeometry = new THREE.IcosahedronGeometry(1.05, 0);
  const ringGeometry = new THREE.TorusGeometry(0.85, 0.28, 24, 64);
  geometries.push(gemGeometry, ringGeometry);
  const gem = new THREE.Mesh(gemGeometry, material(colors[0], { flatShading: true, roughness: 0.18 }));
  gem.position.set(density === "hero" ? 1.6 : 1.2, 0.5, 0.6);
  const ring = new THREE.Mesh(ringGeometry, material(colors[1] ?? colors[0]));
  ring.position.set(-1.9, -0.9, 0.2);
  ring.rotation.set(0.9, 0.4, 0);
  group.add(gem, ring);

  const resize = () => {
    const w = Math.max(1, el.clientWidth);
    const h = Math.max(1, el.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w / h < 1 ? 13 : 10;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(el);

  const pointer = { x: 0, y: 0 };
  const onPointer = (e: PointerEvent) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener("pointermove", onPointer, { passive: true });

  const update = (t: number) => {
    nodes.forEach((n) => {
      n.mesh.position.set(n.base.x, n.base.y + Math.sin(t * n.speed + n.phase) * 0.18, n.base.z + Math.cos(t * n.speed * 0.8 + n.phase) * 0.12);
    });
    pairs.forEach(([a, b], k) => {
      const pa = nodes[a].mesh.position;
      const pb = nodes[b].mesh.position;
      linePositions.set([pa.x, pa.y, pa.z, pb.x, pb.y, pb.z], k * 6);
    });
    lineGeometry.attributes.position.needsUpdate = true;
    const scroll = Math.min(window.scrollY, 1500) / 1500;
    group.rotation.y = t * 0.08 + pointer.x * 0.25;
    group.rotation.x = pointer.y * 0.15 + scroll * 0.6;
    group.position.y = scroll * 1.2;
    gem.rotation.set(t * 0.3, t * 0.45, 0);
    ring.rotation.z = t * 0.25;
    renderer.render(scene, camera);
  };

  let frame = 0;
  let running = false;
  const start = performance.now();
  const loop = () => {
    update((performance.now() - start) / 1000);
    frame = requestAnimationFrame(loop);
  };
  const play = () => {
    if (running || reduced || document.hidden) return;
    running = true;
    frame = requestAnimationFrame(loop);
  };
  const pause = () => {
    running = false;
    cancelAnimationFrame(frame);
  };
  update(0);
  const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? play() : pause()));
  io.observe(el);
  const onVisibility = () => (document.hidden ? pause() : play());
  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    pause();
    io.disconnect();
    ro.disconnect();
    window.removeEventListener("pointermove", onPointer);
    document.removeEventListener("visibilitychange", onVisibility);
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    renderer.dispose();
    renderer.domElement.remove();
  };
}
