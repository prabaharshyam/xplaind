"use client";

import { useEffect, useRef, useState } from "react";
import { ICON_SHAPES, Icon } from "@/components/art/icons";
import type { IconName } from "@/lib/themes";
import { type ParticleShape, extrude, galaxy, sculpture } from "./particle-shapes";
import { darkScheme } from "@/lib/browser/theme";

/**
 * MO-8: a page's particle sculpture. Thousands of points swirl in from a spiral galaxy and settle
 * into the shape that stands for the page (a microphone for the mock interview, a bookshelf for
 * books). They breathe and turn, a shimmer runs up through them, they part around the pointer, a
 * click bursts them and they re-form, and they drift apart as the header scrolls away.
 *
 * Decorative (aria-hidden). Three.js loads only in the browser, the loop runs only while on
 * screen in a visible tab, pixel ratio is capped, reduced motion gets the finished shape as one
 * still frame, and without WebGL the page's icon shows instead.
 */
export function ParticleScene({ shape, colors, icon, className = "" }: { shape: ParticleShape; colors: [string, string, string]; icon: IconName; className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);
  const key = colors.join();

  useEffect(() => {
    const el = host.current;
    if (!el || !webgl() || saveData()) return;
    let dispose: (() => void) | null = null;
    let cancelled = false;
    void mount(el, shape, key.split(",") as [string, string, string]).then((d) => {
      if (cancelled) d();
      else {
        dispose = d;
        setLive(true);
      }
    });
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [shape, key]);

  return (
    <div aria-hidden="true" className={`relative ${className}`}>
      {/* The poster: the page's icon, until the particles take over (or for good without WebGL). */}
      <span className={`absolute inset-0 grid place-items-center transition-opacity duration-700 ${live ? "opacity-0" : "opacity-100"}`} style={{ color: colors[0] }}>
        <Icon name={icon} size={72} strokeWidth={1.4} />
      </span>
      <div ref={host} className={`absolute inset-0 transition-opacity duration-700 ${live ? "opacity-100" : "opacity-0"}`} />
    </div>
  );
}

function webgl(): boolean {
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

/** An icon's strokes as flat points in -1..1: draw it on a canvas and keep the painted pixels. */
function iconPoints(name: IconName): Float32Array {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  if (!g) return new Float32Array([0, 0]);
  const s = ICON_SHAPES[name];
  g.scale(size / 24, size / 24);
  g.lineWidth = 2.2;
  g.lineCap = g.lineJoin = "round";
  g.strokeStyle = "#000";
  if (s.d) g.stroke(new Path2D(s.d));
  for (const [cx, cy, r] of s.circles ?? []) {
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.stroke();
  }
  for (const [x, y, w, h, rx] of s.rects ?? []) {
    g.beginPath();
    g.roundRect(x, y, w, h, rx);
    g.stroke();
  }
  const data = g.getImageData(0, 0, size, size).data;
  const pts: number[] = [];
  for (let y = 0; y < size; y += 2) for (let x = 0; x < size; x += 2) if (data[(y * size + x) * 4 + 3] > 128) pts.push((x / size) * 2 - 1, 1 - (y / size) * 2);
  return new Float32Array(pts.length ? pts : [0, 0]);
}

const VERTEX = /* glsl */ `
  attribute vec3 aStart;
  attribute float aSeed;
  uniform float uTime;
  uniform float uIntro;
  uniform float uScatter;
  uniform float uBurst;
  uniform float uPixel;
  uniform float uSize;
  uniform vec3 uMouse;
  uniform float uMouseOn;
  varying float vSeed;
  varying float vShine;
  varying float vAlpha;
  varying float vY;

  void main() {
    // The intro: each particle leaves the galaxy at its own moment and spirals into place.
    float k = clamp((uIntro - aSeed * 0.7) / 1.1, 0.0, 1.0);
    k = k * k * (3.0 - 2.0 * k);
    vec3 p = mix(aStart, position, k);
    float swirl = (1.0 - k) * (2.5 + aSeed * 2.0);
    p.xz = mat2(cos(swirl), -sin(swirl), sin(swirl), cos(swirl)) * p.xz;

    // Breathing: a slow pulse through the shape, and a little drift for every particle.
    p *= 1.0 + 0.025 * sin(uTime * 1.2 - length(position) * 3.0);
    p += 0.012 * vec3(sin(uTime * 1.3 + aSeed * 40.0), cos(uTime * 1.1 + aSeed * 31.0), sin(uTime * 0.9 + aSeed * 23.0));

    // A shimmer that sweeps up through the shape every few seconds.
    float band = fract(uTime * 0.11) * 3.2 - 1.6;
    vShine = smoothstep(0.22, 0.0, abs(position.y - band));

    // Scatter: outwards as the header scrolls away, and in a burst on a click.
    float s = uScatter + uBurst;
    vec3 dir = normalize(position + vec3(0.001, 0.002, 0.003));
    p += dir * s * (0.5 + aSeed * 1.8);
    p.y += s * (aSeed - 0.5) * 0.9;

    // The pointer pushes particles aside.
    vec2 away = p.xy - uMouse.xy;
    float d = length(away);
    p.xy += normalize(away + 1e-4) * uMouseOn * 0.32 * smoothstep(0.5, 0.0, d);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uPixel * (0.55 + aSeed * 0.9) * (1.0 + vShine * 0.9) / -mv.z;
    vSeed = aSeed;
    vY = position.y;
    vAlpha = (1.0 - clamp(s * 0.55, 0.0, 0.85)) * (0.35 + 0.65 * k);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uA;
  uniform vec3 uB;
  uniform vec3 uC;
  uniform float uDark;
  varying float vSeed;
  varying float vShine;
  varying float vAlpha;
  varying float vY;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    // A crisp, hard-edged dot (a soft edge reads as blur, above all on phone screens).
    float g = smoothstep(0.5, 0.4, d);
    vec3 col = mix(uA, uB, clamp(vY * 0.5 + 0.5, 0.0, 1.0));
    col = mix(col, uC, step(0.93, vSeed));
    col = mix(col, vec3(1.0), vShine * mix(0.35, 0.45, uDark));
    col = mix(col * 0.88, min(col * 1.2 + 0.08, vec3(1.0)), uDark);
    float a = g * vAlpha;
    if (a < 0.02) discard;
    gl_FragColor = vec4(col, a);
    #include <colorspace_fragment>
  }
`;

async function mount(el: HTMLElement, shape: ParticleShape, palette: [string, string, string]): Promise<() => void> {
  const THREE = await import("three");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const darkQuery = darkScheme();
  const small = window.innerWidth < 640;
  // Fewer particles on phones, so the dots stay distinct instead of merging into blobs.
  const count = small ? 3200 : 6500;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "high-performance" });
  // Draw at the screen's real resolution (phones are often 3x); the panel is small, so this is cheap.
  const pixel = Math.min(window.devicePixelRatio, small ? 3 : 2);
  renderer.setPixelRatio(pixel);
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
  camera.position.set(0, 0, 3.0);

  const target = shape.startsWith("icon:") ? extrude(iconPoints(shape.slice(5) as IconName), count) : sculpture(shape as Exclude<ParticleShape, `icon:${string}`>, count);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) seeds[i] = Math.random();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(target, 3));
  geometry.setAttribute("aStart", new THREE.BufferAttribute(galaxy(count), 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

  const uniforms = {
    uTime: { value: 0 },
    uIntro: { value: reduced ? 2 : 0 },
    uScatter: { value: 0 },
    uBurst: { value: 0 },
    uPixel: { value: pixel },
    uSize: { value: small ? 8.5 : 11 },
    uMouse: { value: new THREE.Vector3(9, 9, 0) },
    uMouseOn: { value: 0 },
    uDark: { value: darkQuery.matches ? 1 : 0 },
    uA: { value: new THREE.Color(palette[0]) },
    uB: { value: new THREE.Color(palette[1]) },
    uC: { value: new THREE.Color(palette[2]) },
  };
  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  scene.add(points);

  const resize = () => {
    const w = Math.max(1, el.clientWidth);
    const h = Math.max(1, el.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Keep the whole shape in view in narrow and wide panels alike.
    camera.position.z = w / h < 1.2 ? 3.7 : 3.0;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(el);

  // Pointer: tilt the sculpture toward it, and part the particles under it.
  const pointer = { x: 0, y: 0, tx: 0, ty: 0, inside: false };
  const ndc = new THREE.Vector2();
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hit = new THREE.Vector3();
  const onMove = (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    pointer.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
    pointer.inside = pointer.tx > -1 && pointer.tx < 1 && pointer.ty > -1 && pointer.ty < 1;
    pointer.tx = Math.max(-1.5, Math.min(1.5, pointer.tx));
    pointer.ty = Math.max(-1.5, Math.min(1.5, pointer.ty));
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  let burst = 0;
  const onDown = () => {
    burst = 1;
  };
  el.addEventListener("pointerdown", onDown);
  const onScheme = () => {
    uniforms.uDark.value = darkQuery.matches ? 1 : 0;
  };
  darkQuery.addEventListener("change", onScheme);

  const update = (time: number, dt: number) => {
    uniforms.uTime.value = time;
    // The intro runs on the clock, so a slow device still sees it finish on time.
    uniforms.uIntro.value = reduced ? 2 : Math.min(2, time * 0.8);
    pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 3);
    pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 3);
    points.rotation.y = (reduced ? 0.5 : Math.sin(time * 0.25) * 0.7) + pointer.x * 0.35;
    points.rotation.x = -0.1 + pointer.y * 0.25;
    // Where the pointer meets the sculpture, in the sculpture's own space.
    ndc.set(pointer.x, -pointer.y);
    ray.setFromCamera(ndc, camera);
    if (ray.ray.intersectPlane(plane, hit)) uniforms.uMouse.value.copy(points.worldToLocal(hit.clone()));
    uniforms.uMouseOn.value += ((pointer.inside ? 1 : 0) - uniforms.uMouseOn.value) * Math.min(1, dt * 4);
    // Drift apart as the panel leaves the top of the screen.
    const r = el.getBoundingClientRect();
    uniforms.uScatter.value = Math.max(0, Math.min(1.4, (-r.top / Math.max(1, r.height)) * 1.2));
    burst = Math.max(0, burst - dt * 0.9);
    uniforms.uBurst.value = Math.sin(burst * Math.PI) * 0.9;
    renderer.render(scene, camera);
  };

  let frame = 0;
  let running = false;
  let onScreen = true;
  const start = performance.now();
  let previous = start;
  const loop = (now: number) => {
    update((now - start) / 1000, Math.min(0.05, (now - previous) / 1000));
    previous = now;
    frame = requestAnimationFrame(loop);
  };
  const play = () => {
    if (running || reduced || document.hidden || !onScreen) return;
    running = true;
    previous = performance.now();
    frame = requestAnimationFrame(loop);
  };
  const pause = () => {
    running = false;
    cancelAnimationFrame(frame);
  };
  update(0, 0);
  play();
  const onVisibility = () => (document.hidden ? pause() : play());
  document.addEventListener("visibilitychange", onVisibility);
  const io = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen) play();
    else pause();
  });
  io.observe(el);
  const onLost = (e: Event) => {
    e.preventDefault();
    pause();
  };
  renderer.domElement.addEventListener("webglcontextlost", onLost);

  return () => {
    pause();
    io.disconnect();
    ro.disconnect();
    window.removeEventListener("pointermove", onMove);
    el.removeEventListener("pointerdown", onDown);
    darkQuery.removeEventListener("change", onScheme);
    document.removeEventListener("visibilitychange", onVisibility);
    renderer.domElement.removeEventListener("webglcontextlost", onLost);
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}
