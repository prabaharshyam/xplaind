"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

/**
 * MO-5: "the living mind". Thousands of glowing particles keep reassembling: a cloud of ideas
 * becomes a double helix, then a folded brain, then an endless knot, and back. They swirl and
 * twinkle, part around the pointer, and scrolling speeds the change. Decorative (aria-hidden).
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
  glow = false,
}: {
  colors: readonly string[];
  seed: string;
  density?: "hero" | "panel";
  className?: string;
  fallback?: ReactNode;
  /** Use the glowing style, for scenes on a dark or strongly coloured background. */
  glow?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);
  const key = `${colors.join(",")}|${seed}|${density}|${glow}`;

  useEffect(() => {
    const el = host.current;
    if (!el || !webglAvailable() || saveData()) return;
    let dispose: (() => void) | null = null;
    let cancelled = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || dispose) return;
        void mount(el, key.split("|")[0].split(","), key.split("|")[1], density, key.endsWith("|true")).then((d) => {
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

/** The four forms the particles move between, each centred and about 6 units across. */
function shapes(n: number, rand: () => number): Float32Array[] {
  const out = [0, 1, 2, 3].map(() => new Float32Array(n * 3));
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const k = i * 3;
    // 1. A cloud of ideas: a Fibonacci sphere with a soft, thick shell.
    const y = 1 - (i / (n - 1)) * 2;
    const ring = Math.sqrt(1 - y * y);
    const th = golden * i;
    const r1 = 2.4 + (rand() - 0.5) * 0.5;
    out[0].set([Math.cos(th) * ring * r1, y * r1, Math.sin(th) * ring * r1], k);

    // 2. A double helix with rungs: the structure that learning builds.
    const t = (i / n) * Math.PI * 6;
    const h = (i / n) * 6 - 3;
    if (i % 9 === 0) {
      const f = rand();
      const a = t;
      out[1].set([Math.cos(a) * 1.1 * (2 * f - 1), h, Math.sin(a) * 1.1 * (2 * f - 1)], k);
    } else {
      const strand = i % 2 ? Math.PI : 0;
      const jitter = 0.12;
      out[1].set([Math.cos(t + strand) * 1.1 + (rand() - 0.5) * jitter, h + (rand() - 0.5) * jitter, Math.sin(t + strand) * 1.1 + (rand() - 0.5) * jitter], k);
    }

    // 3. A brain: two folded hemispheres.
    const u = rand() * Math.PI * 2;
    const v = Math.acos(2 * rand() - 1);
    const folds = 1 + 0.09 * Math.sin(9 * u) * Math.sin(7 * v) + 0.05 * Math.sin(17 * v);
    const side = i % 2 ? 1 : -1;
    const sx = Math.sin(v) * Math.cos(u) * 1.25 * folds;
    out[2].set([side * (Math.abs(sx) + 0.12), Math.cos(v) * 1.45 * folds * 0.85, Math.sin(v) * Math.sin(u) * 1.8 * folds], k);

    // 4. An endless (3, 2) torus knot, the tube filled with light.
    const s = (i / n) * Math.PI * 2;
    const p = 2;
    const q = 3;
    const rr = Math.cos(q * s) + 2;
    const cx = rr * Math.cos(p * s) * 0.95;
    const cy = -Math.sin(q * s) * 0.95;
    const cz = rr * Math.sin(p * s) * 0.95;
    const tube = 0.32 * Math.sqrt(rand());
    const ang = rand() * Math.PI * 2;
    out[3].set([cx + Math.cos(ang) * tube, cy + Math.sin(ang) * tube, cz + Math.cos(ang + 1.3) * tube], k);
  }
  return out;
}

const VERTEX = /* glsl */ `
  attribute vec3 aShape0;
  attribute vec3 aShape1;
  attribute vec3 aShape2;
  attribute vec3 aShape3;
  attribute vec4 aRand;
  uniform float uTime;
  uniform float uMorph;
  uniform float uSize;
  uniform vec3 uPointer;
  uniform float uPixel;
  uniform float uDark;
  varying float vMix;
  varying float vTwinkle;
  varying float vDepth;

  // Weight of shape k when the morph value sits at m on a loop of four.
  float w(float m, float k) {
    float d = abs(mod(m - k + 2.0, 4.0) - 2.0);
    return smoothstep(1.0, 0.0, d);
  }

  void main() {
    // Each particle leaves a little earlier or later, so the change ripples through the cloud.
    float m = uMorph + (aRand.x - 0.5) * 0.35;
    float w0 = w(m, 0.0), w1 = w(m, 1.0), w2 = w(m, 2.0), w3 = w(m, 3.0);
    vec3 p = (aShape0 * w0 + aShape1 * w1 + aShape2 * w2 + aShape3 * w3) / max(w0 + w1 + w2 + w3, 0.0001);

    // In mid-change the particles swirl outward like smoke, then settle into the next form.
    float between = 1.0 - max(max(w0, w1), max(w2, w3));
    float a = uTime * (0.4 + aRand.y * 0.6) + aRand.z * 6.2831;
    p += vec3(sin(a), cos(a * 1.3), sin(a * 0.7)) * (0.05 + between * 0.9 * aRand.w);

    vec4 world = modelMatrix * vec4(p, 1.0);
    // Particles part around the pointer.
    vec3 away = world.xyz - uPointer;
    float dist = length(away.xy);
    world.xy += normalize(away.xy + 0.0001) * smoothstep(1.6, 0.0, dist) * 0.9;

    vec4 mv = viewMatrix * world;
    gl_Position = projectionMatrix * mv;
    vTwinkle = 0.55 + 0.45 * sin(uTime * (1.5 + aRand.y * 3.0) + aRand.x * 40.0);
    // A few particles are bright stars; the rest are fine dust. Nearer particles are larger.
    float star = step(0.965, aRand.w) * mix(0.9, 2.2, uDark);
    gl_PointSize = uSize * uPixel * (0.55 + aRand.w * 0.7 + star) * (0.8 + vTwinkle * 0.4) / -mv.z;
    vMix = aRand.y;
    vDepth = clamp((p.z + 3.0) / 6.0, 0.0, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform float uDark;
  varying float vMix;
  varying float vTwinkle;
  varying float vDepth;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float core = smoothstep(0.5, 0.0, d);
    float glow = pow(core, 2.6);
    float hot = smoothstep(0.12, 0.0, d);
    vec3 col = vMix < 0.5 ? mix(uColorA, uColorB, vMix * 2.0) : mix(uColorB, uColorC, (vMix - 0.5) * 2.0);
    // Light page: richer, deeper colour so the form reads. Dark page: glowing, with a white-hot centre.
    vec3 deep = mix(col, vec3(0.30, 0.18, 0.62), 0.38);
    col = mix(deep, col + hot * 0.8, uDark);
    float depth = 0.45 + vDepth * 0.55;
    float crisp = smoothstep(0.5, 0.32, d);
    float alpha = (uDark > 0.5 ? glow * 1.1 : crisp * 0.8) * vTwinkle * depth;
    if (alpha < 0.02) discard;
    gl_FragColor = vec4(col, alpha);
  }
`;

async function mount(el: HTMLElement, colors: string[], seed: string, density: "hero" | "panel", glow: boolean): Promise<() => void> {
  const THREE = await import("three");
  const rand = rng(seed);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dark = glow || window.matchMedia("(prefers-color-scheme: dark)").matches;
  const small = el.clientWidth < 420 || window.innerWidth < 640;
  const count = density === "hero" ? (small ? 4500 : 11000) : small ? 2500 : 6000;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "high-performance" });
  const pixel = Math.min(window.devicePixelRatio, 1.75);
  renderer.setPixelRatio(pixel);
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  const forms = shapes(count, rand);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(forms[0].slice(), 3));
  forms.forEach((f, i) => geometry.setAttribute(`aShape${i}`, new THREE.BufferAttribute(f, 3)));
  const randoms = new Float32Array(count * 4);
  for (let i = 0; i < randoms.length; i++) randoms[i] = rand();
  geometry.setAttribute("aRand", new THREE.BufferAttribute(randoms, 4));

  const colour = (i: number) => new THREE.Color(colors[i % colors.length]);
  const uniforms = {
    uTime: { value: 0 },
    uMorph: { value: 0 },
    uSize: { value: (density === "hero" ? 44 : 36) * (dark ? 1 : 0.62) },
    uPixel: { value: pixel },
    uPointer: { value: new THREE.Vector3(99, 99, 0) },
    uColorA: { value: colour(0) },
    uColorB: { value: colour(1) },
    uColorC: { value: colour(2) },
    uDark: { value: dark ? 1 : 0 },
  };
  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: dark ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  scene.add(points);

  const resize = () => {
    const w = Math.max(1, el.clientWidth);
    const h = Math.max(1, el.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Fit the camera so the tallest form (about 7 units with its swirl) and the widest
    // (about 6.5) always fit the box, whatever its shape.
    const view = 2 * Math.tan((camera.fov * Math.PI) / 360);
    camera.position.z = Math.max(7.4 / view, 6.8 / (view * camera.aspect));
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(el);

  // The pointer, projected onto the plane the cloud sits in.
  const ndc = new THREE.Vector2();
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hit = new THREE.Vector3();
  const onPointer = (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (ray.ray.intersectPlane(plane, hit)) uniforms.uPointer.value.copy(hit);
  };
  const onLeave = () => uniforms.uPointer.value.set(99, 99, 0);
  window.addEventListener("pointermove", onPointer, { passive: true });
  document.addEventListener("pointerleave", onLeave);

  // Each form holds for a moment, then flows into the next; scrolling adds to the flow.
  let morph = rand() * 4;
  let lastScroll = window.scrollY;
  const update = (t: number, dt: number) => {
    const scrolled = Math.abs(window.scrollY - lastScroll);
    lastScroll = window.scrollY;
    const phase = (t % 6) / 6; // six seconds per form
    const speed = phase < 0.55 ? 0.02 : 0.5; // hold, then flow
    morph = (morph + dt * speed + Math.min(scrolled, 200) * 0.003) % 4;
    uniforms.uMorph.value = morph;
    uniforms.uTime.value = t;
    points.rotation.y = t * 0.12;
    points.rotation.x = Math.sin(t * 0.17) * 0.18;
    renderer.render(scene, camera);
  };

  let frame = 0;
  let running = false;
  const start = performance.now();
  let previous = start;
  const loop = (now: number) => {
    update((now - start) / 1000, Math.min(0.05, (now - previous) / 1000));
    previous = now;
    frame = requestAnimationFrame(loop);
  };
  const play = () => {
    if (running || reduced || document.hidden) return;
    running = true;
    previous = performance.now();
    frame = requestAnimationFrame(loop);
  };
  const pause = () => {
    running = false;
    cancelAnimationFrame(frame);
  };
  // Reduced motion: one still frame, settled on the brain.
  morph = reduced ? 2 : morph;
  update(0, 0);
  const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? play() : pause()));
  io.observe(el);
  const onVisibility = () => (document.hidden ? pause() : play());
  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    pause();
    io.disconnect();
    ro.disconnect();
    window.removeEventListener("pointermove", onPointer);
    document.removeEventListener("pointerleave", onLeave);
    document.removeEventListener("visibilitychange", onVisibility);
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}
