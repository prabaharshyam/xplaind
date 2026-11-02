"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

/**
 * MO-5: "the thinking orb". A liquid, iridescent orb in the brand pastels breathes and ripples
 * like a thought taking shape, its colours sliding across the surface like light on a soap
 * bubble, while a ring of fine light orbits it like ideas in motion. It leans and swells toward
 * the pointer, and scrolling stirs it. Decorative (aria-hidden). Three.js loads only when the
 * scene is on screen, the loop pauses off screen and in hidden tabs, reduced motion gets one
 * still frame, and without WebGL the fallback stays.
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

// Ashima Arts 3D simplex noise (MIT), the standard compact GLSL version.
const NOISE = /* glsl */ `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }
`;

const ORB_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uAmp;
  uniform float uFreq;
  uniform vec3 uPointer;
  uniform float uPull;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  varying float vRipple;
  ${NOISE}

  // How far the surface moves out along its normal at point p: a slow, large breath plus
  // finer ripples, and a swell toward the pointer.
  float displace(vec3 p) {
    float t = uTime;
    float big = snoise(p * uFreq + vec3(t * 0.16, t * 0.12, -t * 0.1));
    float fine = snoise(p * uFreq * 2.1 - vec3(t * 0.22)) * 0.18;
    vec3 w = (modelMatrix * vec4(p, 1.0)).xyz;
    float near = smoothstep(2.4, 0.0, length(w.xy - uPointer.xy)) * uPull;
    return (big * 0.3 + fine * 0.06) * uAmp + near * 0.22;
  }

  void main() {
    vec3 n = normalize(normal);
    vec3 helper = abs(n.y) < 0.95 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 tA = normalize(cross(n, helper));
    vec3 tB = cross(n, tA);
    float e = 0.012;
    float d = displace(position);
    vec3 p0 = position + n * d;
    vec3 pA = position + tA * e;
    vec3 pB = position + tB * e;
    pA += normalize(pA) * displace(pA);
    pB += normalize(pB) * displace(pB);
    vec3 bent = normalize(cross(pA - p0, pB - p0));
    if (dot(bent, n) < 0.0) bent = -bent;
    vRipple = d;
    vec4 world = modelMatrix * vec4(p0, 1.0);
    vPosW = world.xyz;
    vNormalW = normalize(mat3(modelMatrix) * bent);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const ORB_FRAGMENT = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform float uTime;
  uniform float uDark;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  varying float vRipple;

  // Three brand colours around a loop, so the gradient never has a hard edge.
  vec3 brand(float t) {
    t = fract(t) * 3.0;
    if (t < 1.0) return mix(uColorA, uColorB, smoothstep(0.0, 1.0, t));
    if (t < 2.0) return mix(uColorB, uColorC, smoothstep(0.0, 1.0, t - 1.0));
    return mix(uColorC, uColorA, smoothstep(0.0, 1.0, t - 2.0));
  }

  void main() {
    vec3 n = normalize(vNormalW);
    vec3 v = normalize(cameraPosition - vPosW);
    float facing = max(dot(n, v), 0.0);
    float fresnel = pow(1.0 - facing, 2.2);

    // Thin-film colour: depends on viewing angle, surface height and a slow drift, like a soap bubble.
    float film = fresnel * 0.9 + vRipple * 0.9 + dot(n, vec3(0.35, 0.6, 0.25)) * 0.35 + uTime * 0.025;
    vec3 base = brand(film);
    vec3 sheen = 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + film * 1.4));
    vec3 col = mix(base, base * 0.75 + sheen * 0.35, 0.35);

    // A soft key light and a cool fill, plus two sharp highlights that make it read as glass.
    vec3 key = normalize(vec3(-0.6, 0.9, 0.7));
    vec3 fill = normalize(vec3(0.8, -0.3, 0.6));
    float diffuse = 0.62 + 0.38 * max(dot(n, key), 0.0) + 0.18 * max(dot(n, fill), 0.0);
    col *= diffuse;
    float spec = pow(max(dot(n, normalize(key + v)), 0.0), 90.0);
    float spec2 = pow(max(dot(n, normalize(fill + v)), 0.0), 40.0) * 0.35;
    col += vec3(1.0) * (spec * 0.9 + spec2);

    // The rim: pale and luminous on a light page, a bright halo on a dark one.
    vec3 rim = mix(vec3(1.0), brand(film + 0.33) * 1.6, uDark);
    col = mix(col, rim, fresnel * mix(0.55, 0.85, uDark));
    col = mix(col, col * 1.15 + 0.05, uDark);

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const RING_VERTEX = /* glsl */ `
  attribute vec4 aOrbit;   // radius, start angle, speed, height
  attribute float aSeed;
  uniform float uTime;
  uniform float uSize;
  uniform float uPixel;
  uniform float uStir;
  varying float vSeed;
  varying float vTwinkle;
  void main() {
    float a = aOrbit.y + uTime * aOrbit.z * (1.0 + uStir * 2.5);
    float r = aOrbit.x + sin(uTime * 0.6 + aSeed * 20.0) * 0.05;
    vec3 p = vec3(cos(a) * r, aOrbit.w + sin(a * 2.0 + aSeed * 6.0) * 0.06, sin(a) * r);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    vTwinkle = 0.55 + 0.45 * sin(uTime * (1.2 + aSeed * 2.5) + aSeed * 40.0);
    float star = step(0.97, aSeed) * 2.0;
    gl_PointSize = uSize * uPixel * (0.5 + aSeed * 0.6 + star) / -mv.z;
    vSeed = aSeed;
  }
`;

const RING_FRAGMENT = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform float uDark;
  varying float vSeed;
  varying float vTwinkle;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float glow = pow(smoothstep(0.5, 0.0, d), 2.2);
    vec3 col = vSeed < 0.5 ? mix(uColorA, uColorB, vSeed * 2.0) : mix(uColorB, uColorC, (vSeed - 0.5) * 2.0);
    col = mix(mix(col, vec3(0.36, 0.22, 0.7), 0.55), col + 0.25, uDark);
    float alpha = glow * vTwinkle * mix(0.95, 1.0, uDark);
    if (alpha < 0.02) discard;
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }
`;

async function mount(el: HTMLElement, colors: string[], seed: string, density: "hero" | "panel", glow: boolean): Promise<() => void> {
  const THREE = await import("three");
  const rand = rng(seed);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dark = glow || window.matchMedia("(prefers-color-scheme: dark)").matches;
  const small = el.clientWidth < 420 || window.innerWidth < 640;
  const detail = density === "hero" ? (small ? 40 : 72) : small ? 28 : 48;
  const ringCount = density === "hero" ? (small ? 900 : 2200) : small ? 600 : 1300;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
  const pixel = Math.min(window.devicePixelRatio, 1.75);
  renderer.setPixelRatio(pixel);
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0, 0, 10);

  const colour = (i: number) => new THREE.Color(colors[i % colors.length]);
  const shared = {
    uTime: { value: 0 },
    uColorA: { value: colour(0) },
    uColorB: { value: colour(1) },
    uColorC: { value: colour(2) },
    uDark: { value: dark ? 1 : 0 },
  };

  // The orb: a finely divided sphere the vertex shader bends.
  const orbUniforms = {
    ...shared,
    uAmp: { value: 1 },
    uFreq: { value: 0.42 + rand() * 0.16 },
    uPointer: { value: new THREE.Vector3(99, 99, 0) },
    uPull: { value: 0 },
  };
  const orbGeometry = new THREE.IcosahedronGeometry(1.55, detail);
  const orbMaterial = new THREE.ShaderMaterial({ vertexShader: ORB_VERTEX, fragmentShader: ORB_FRAGMENT, uniforms: orbUniforms });
  const orb = new THREE.Mesh(orbGeometry, orbMaterial);
  orb.rotation.set(rand() * 6, rand() * 6, 0);

  // The ring of light around it, tilted like a planet's.
  const ringGeometry = new THREE.BufferGeometry();
  const orbit = new Float32Array(ringCount * 4);
  const seeds = new Float32Array(ringCount);
  for (let i = 0; i < ringCount; i++) {
    const band = rand();
    orbit.set([2.15 + band * band * 0.95, rand() * Math.PI * 2, (0.08 + rand() * 0.12) * (rand() < 0.12 ? -1 : 1), (rand() - 0.5) * 0.22 * (1 + band)], i * 4);
    seeds[i] = rand();
  }
  ringGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(ringCount * 3), 3));
  ringGeometry.setAttribute("aOrbit", new THREE.BufferAttribute(orbit, 4));
  ringGeometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  const ringUniforms = { ...shared, uSize: { value: (density === "hero" ? 34 : 28) * (dark ? 1.1 : 1.05) }, uPixel: { value: pixel }, uStir: { value: 0 } };
  const ringMaterial = new THREE.ShaderMaterial({
    vertexShader: RING_VERTEX,
    fragmentShader: RING_FRAGMENT,
    uniforms: ringUniforms,
    transparent: true,
    depthWrite: false,
    blending: dark ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  const ring = new THREE.Points(ringGeometry, ringMaterial);
  ring.frustumCulled = false;
  ring.rotation.set(1.18 + rand() * 0.2, 0, -0.32 + rand() * 0.2);

  const group = new THREE.Group();
  group.add(orb, ring);
  scene.add(group);

  const resize = () => {
    const w = Math.max(1, el.clientWidth);
    const h = Math.max(1, el.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Fit the ring (about 6.4 wide) and the swelling orb (about 4.4 tall) in the box, whatever its shape.
    const view = 2 * Math.tan((camera.fov * Math.PI) / 360);
    camera.position.z = Math.max(5.2 / view, 6.9 / (view * camera.aspect));
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(el);

  // The pointer, projected onto the plane through the orb's centre.
  const ndc = new THREE.Vector2();
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hit = new THREE.Vector3();
  const lean = new THREE.Vector2();
  let pointerIn = false;
  const onPointer = (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (ray.ray.intersectPlane(plane, hit)) orbUniforms.uPointer.value.copy(hit);
    pointerIn = Math.abs(ndc.x) < 1.4 && Math.abs(ndc.y) < 1.4;
  };
  const onLeave = () => (pointerIn = false);
  window.addEventListener("pointermove", onPointer, { passive: true });
  document.addEventListener("pointerleave", onLeave);

  let lastScroll = window.scrollY;
  let stir = 0;
  const update = (t: number, dt: number) => {
    const scrolled = Math.abs(window.scrollY - lastScroll);
    lastScroll = window.scrollY;
    // Scrolling stirs the orb and spins the ring, then both settle.
    stir = Math.min(1, stir * Math.exp(-dt * 2.2) + scrolled * 0.004);
    shared.uTime.value = t;
    orbUniforms.uAmp.value = 1 + stir * 0.9 + Math.sin(t * 0.5) * 0.12;
    orbUniforms.uPull.value += ((pointerIn ? 1 : 0) - orbUniforms.uPull.value) * Math.min(1, dt * 3);
    ringUniforms.uStir.value = stir;
    // The orb leans gently toward the pointer.
    lean.x += ((pointerIn ? ndc.x : 0) * 0.35 - lean.x) * Math.min(1, dt * 2.5);
    lean.y += ((pointerIn ? ndc.y : 0) * 0.25 - lean.y) * Math.min(1, dt * 2.5);
    group.rotation.y = lean.x;
    group.rotation.x = -lean.y;
    orb.rotation.y += dt * (0.12 + stir * 0.8);
    orb.rotation.x = Math.sin(t * 0.21) * 0.3;
    group.position.y = Math.sin(t * 0.7) * 0.08;
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
  // Reduced motion: one still frame.
  update(reduced ? 4 : 0, 0);
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
    orbGeometry.dispose();
    orbMaterial.dispose();
    ringGeometry.dispose();
    ringMaterial.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}
