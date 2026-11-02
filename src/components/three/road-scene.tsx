"use client";

import { useEffect, useRef, useState } from "react";

/**
 * MO-6: the home page journey. A luminous road winds from the viewer to a glowing horizon, with
 * four milestone gates along it. As the learner scrolls the page, the camera flies along the road
 * and passes each gate as the matching section arrives. Decorative (aria-hidden).
 *
 * One responsibility: the flight. Three.js loads only in the browser, the loop pauses in hidden
 * tabs, pixel ratio is capped, reduced motion gets one still frame, and without WebGL the CSS sky
 * behind the canvas stays as the poster.
 */
export function RoadScene() {
  const host = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el || !webgl() || saveData()) return;
    let dispose: (() => void) | null = null;
    let cancelled = false;
    void mount(el).then((d) => {
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
  }, []);

  return (
    <div aria-hidden="true" className="journey-sky pointer-events-none fixed inset-0 -z-10">
      <div ref={host} className={`absolute inset-0 transition-opacity duration-1000 ${live ? "opacity-100" : "opacity-0"}`} />
      {/* A soft veil on the reading side keeps text crisp over the scene. */}
      <div className="journey-veil absolute inset-0" />
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

/** Where the milestone gates sit along the road (0 = start, 1 = horizon). */
export const GATES = [0.24, 0.47, 0.7, 0.9] as const;

const ROAD_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying float vDist;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDist = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const ROAD_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform vec3 uA;
  uniform vec3 uB;
  uniform vec3 uC;
  uniform float uDark;
  uniform float uFar;
  varying vec2 vUv;
  varying float vDist;

  vec3 brand(float t) {
    t = fract(t) * 3.0;
    if (t < 1.0) return mix(uA, uB, smoothstep(0.0, 1.0, t));
    if (t < 2.0) return mix(uB, uC, smoothstep(0.0, 1.0, t - 1.0));
    return mix(uC, uA, smoothstep(0.0, 1.0, t - 2.0));
  }

  void main() {
    float across = abs(vUv.x - 0.5) * 2.0;           // 0 centre, 1 edge
    vec3 tint = brand(vUv.y * 2.2 + uTime * 0.02);
    // The surface: a soft glassy band, brighter towards the edges.
    float edge = smoothstep(0.82, 1.0, across);
    float body = 0.35 + 0.25 * (1.0 - across);
    // Light flowing along the road towards the horizon.
    float flow = smoothstep(0.0, 0.15, fract(vUv.y * 60.0 - uTime * 0.6)) * smoothstep(0.55, 0.4, fract(vUv.y * 60.0 - uTime * 0.6));
    float lane = smoothstep(0.06, 0.0, abs(vUv.x - 0.5)) * flow;
    // Fine grid lines across the road, like a track.
    float rungs = smoothstep(0.03, 0.0, abs(fract(vUv.y * 140.0) - 0.5) - 0.46) * 0.25;
    vec3 col = tint * (body + rungs) + mix(tint, vec3(1.0), 0.6) * (edge * 1.4 + lane * 1.2);
    float fade = 1.0 - smoothstep(uFar * 0.35, uFar, vDist);
    float alpha = (0.55 + edge * 0.45 + lane * 0.5) * fade;
    col = mix(mix(col, col * 0.85 + vec3(0.06, 0.03, 0.12), 0.35), col * 1.25, uDark);
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }
`;

const GLOW_VERTEX = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform float uSize;
  uniform float uPixel;
  varying float vSeed;
  varying float vFade;
  uniform float uFar;
  void main() {
    vec3 p = position;
    p.y += sin(uTime * 0.6 + aSeed * 30.0) * 0.12;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uPixel * (0.6 + aSeed * 0.8) / -mv.z;
    vSeed = aSeed;
    vFade = 1.0 - smoothstep(uFar * 0.4, uFar, -mv.z);
  }
`;

const GLOW_FRAGMENT = /* glsl */ `
  uniform vec3 uA;
  uniform vec3 uB;
  uniform vec3 uC;
  uniform float uDark;
  uniform float uTime;
  varying float vSeed;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float g = pow(smoothstep(0.5, 0.0, d), 2.0);
    vec3 col = vSeed < 0.5 ? mix(uA, uB, vSeed * 2.0) : mix(uB, uC, (vSeed - 0.5) * 2.0);
    col = mix(mix(col, vec3(0.36, 0.22, 0.7), 0.4), col + 0.3, uDark);
    float tw = 0.6 + 0.4 * sin(uTime * (1.0 + vSeed * 2.0) + vSeed * 50.0);
    float a = g * tw * vFade * mix(0.85, 1.0, uDark);
    if (a < 0.02) discard;
    gl_FragColor = vec4(col, a);
    #include <colorspace_fragment>
  }
`;

const GATE_FRAGMENT = /* glsl */ `
  uniform vec3 uA;
  uniform vec3 uB;
  uniform float uTime;
  uniform float uNear;
  uniform float uDark;
  varying vec2 vUv;
  void main() {
    vec3 col = mix(uA, uB, 0.5 + 0.5 * sin(vUv.x * 12.566 + uTime * 1.2));
    float pulse = 0.75 + 0.25 * sin(uTime * 2.0);
    col = mix(col * 0.9, col + 0.35, uDark) * (0.9 + uNear * 0.6) * pulse;
    gl_FragColor = vec4(col, 0.9);
    #include <colorspace_fragment>
  }
`;

async function mount(el: HTMLElement): Promise<() => void> {
  const THREE = await import("three");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const small = window.innerWidth < 640;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
  const pixel = Math.min(window.devicePixelRatio, small ? 1.5 : 1.75);
  renderer.setPixelRatio(pixel);
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const FAR = 70;
  const camera = new THREE.PerspectiveCamera(58, 1, 0.1, FAR + 10);

  // The road: a long curve that winds and gently rises and falls into the distance.
  const points: InstanceType<typeof THREE.Vector3>[] = [];
  for (let i = 0; i <= 24; i++) {
    const z = -i * 12;
    points.push(new THREE.Vector3(Math.sin(i * 0.55) * 7 + Math.sin(i * 0.21) * 4, Math.sin(i * 0.37) * 1.6, z));
  }
  const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5);

  const segments = small ? 600 : 1200;
  const width = 2.6;
  const pos = new Float32Array((segments + 1) * 2 * 3);
  const uvs = new Float32Array((segments + 1) * 2 * 2);
  const index: number[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  const side = new THREE.Vector3();
  const frames: { p: InstanceType<typeof THREE.Vector3>; s: InstanceType<typeof THREE.Vector3> }[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    side.crossVectors(tangent, up).normalize();
    frames.push({ p: p.clone(), s: side.clone() });
    const l = p.clone().addScaledVector(side, -width / 2);
    const r = p.clone().addScaledVector(side, width / 2);
    pos.set([l.x, l.y, l.z, r.x, r.y, r.z], i * 6);
    uvs.set([0, t, 1, t], i * 4);
    if (i < segments) {
      const a = i * 2;
      index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const roadGeometry = new THREE.BufferGeometry();
  roadGeometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  roadGeometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  roadGeometry.setIndex(index);

  const colors = {
    uA: { value: new THREE.Color("#a78bfa") },
    uB: { value: new THREE.Color("#f472b6") },
    uC: { value: new THREE.Color("#2dd4bf") },
  };
  const shared = { uTime: { value: 0 }, uDark: { value: darkQuery.matches ? 1 : 0 }, uFar: { value: FAR } };
  const roadMaterial = new THREE.ShaderMaterial({
    vertexShader: ROAD_VERTEX,
    fragmentShader: ROAD_FRAGMENT,
    uniforms: { ...shared, ...colors },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  scene.add(new THREE.Mesh(roadGeometry, roadMaterial));

  // Lights along both edges, and a field of drifting motes around the road.
  const lampsPerSide = small ? 160 : 300;
  const motes = small ? 900 : 2200;
  const glowPos = new Float32Array((lampsPerSide * 2 + motes) * 3);
  const glowSeed = new Float32Array(lampsPerSide * 2 + motes);
  let k = 0;
  for (let i = 0; i < lampsPerSide; i++) {
    const f = frames[Math.floor((i / lampsPerSide) * segments)];
    for (const dir of [-1, 1]) {
      const q = f.p.clone().addScaledVector(f.s, dir * (width / 2 + 0.25));
      q.y += 0.25;
      glowPos.set([q.x, q.y, q.z], k * 3);
      glowSeed[k++] = 0.2 + Math.random() * 0.3;
    }
  }
  for (let i = 0; i < motes; i++) {
    const f = frames[Math.floor(Math.random() * segments)];
    const spread = 4 + Math.random() * 18;
    const q = f.p.clone().addScaledVector(f.s, (Math.random() - 0.5) * spread * 2);
    q.y += -1 + Math.random() * 9;
    glowPos.set([q.x, q.y, q.z], k * 3);
    glowSeed[k++] = Math.random();
  }
  const glowGeometry = new THREE.BufferGeometry();
  glowGeometry.setAttribute("position", new THREE.BufferAttribute(glowPos, 3));
  glowGeometry.setAttribute("aSeed", new THREE.BufferAttribute(glowSeed, 1));
  const glowMaterial = new THREE.ShaderMaterial({
    vertexShader: GLOW_VERTEX,
    fragmentShader: GLOW_FRAGMENT,
    uniforms: { ...shared, ...colors, uSize: { value: small ? 70 : 90 }, uPixel: { value: pixel } },
    transparent: true,
    depthWrite: false,
    blending: darkQuery.matches ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  const glow = new THREE.Points(glowGeometry, glowMaterial);
  glow.frustumCulled = false;
  scene.add(glow);

  // Milestone gates: rings standing across the road.
  const gateGeometry = new THREE.TorusGeometry(2.4, 0.07, 16, 160);
  const gates = GATES.map((t, i) => {
    const material = new THREE.ShaderMaterial({
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: GATE_FRAGMENT,
      uniforms: {
        uTime: shared.uTime,
        uDark: shared.uDark,
        uNear: { value: 0 },
        uA: { value: new THREE.Color(["#8b5cf6", "#ec4899", "#14b8a6", "#f59e0b"][i]) },
        uB: { value: new THREE.Color(["#f0abfc", "#a5b4fc", "#a7f3d0", "#fbcfe8"][i]) },
      },
      transparent: true,
    });
    const ring = new THREE.Mesh(gateGeometry, material);
    const p = curve.getPointAt(t);
    ring.position.copy(p).add(new THREE.Vector3(0, 1.6, 0));
    ring.lookAt(p.clone().add(curve.getTangentAt(t)).add(new THREE.Vector3(0, 1.6, 0)));
    scene.add(ring);
    return { ring, material, t };
  });

  const resize = () => {
    const w = Math.max(1, el.clientWidth);
    const h = Math.max(1, el.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < 640 ? 70 : 58;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener("resize", resize);
  // Re-measure whenever the layer's box changes, not only when the window does. After an in-site
  // navigation the page container is briefly transformed, which stretches this fixed layer to the
  // whole page for a moment; measuring only once left the road zoomed in until a refresh.
  const ro = new ResizeObserver(resize);
  ro.observe(el);

  // Scroll sets where we are on the road; the camera eases towards it so the flight feels smooth.
  const progress = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    return Math.min(1, Math.max(0, window.scrollY / max));
  };
  let at = reduced ? 0.02 : progress() * 0.9 + 0.02;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const onPointer = (e: PointerEvent) => {
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener("pointermove", onPointer, { passive: true });
  const onScheme = () => {
    shared.uDark.value = darkQuery.matches ? 1 : 0;
    glowMaterial.blending = darkQuery.matches ? THREE.AdditiveBlending : THREE.NormalBlending;
    glowMaterial.needsUpdate = true;
  };
  darkQuery.addEventListener("change", onScheme);

  const eye = new THREE.Vector3();
  const look = new THREE.Vector3();
  const update = (time: number, dt: number) => {
    const target = Math.min(0.94, progress() * 0.92 + 0.02);
    at += (target - at) * Math.min(1, dt * 3.2);
    pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 2);
    pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 2);
    const p = curve.getPointAt(at);
    const ahead = curve.getPointAt(Math.min(1, at + 0.035));
    eye.copy(p).add(new THREE.Vector3(pointer.x * 0.6, 1.5 - pointer.y * 0.3 + Math.sin(time * 0.8) * 0.05, 0));
    look.copy(ahead).add(new THREE.Vector3(pointer.x * 1.2, 1.1, 0));
    camera.position.copy(eye);
    camera.lookAt(look);
    shared.uTime.value = time;
    for (const g of gates) {
      const near = 1 - Math.min(1, Math.abs(g.t - at) / 0.08);
      g.material.uniforms.uNear.value = near;
      g.ring.rotation.z = time * 0.15;
    }
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
  update(0, 0);
  play();
  const onVisibility = () => (document.hidden ? pause() : play());
  document.addEventListener("visibilitychange", onVisibility);
  const onLost = (e: Event) => {
    e.preventDefault();
    pause();
  };
  renderer.domElement.addEventListener("webglcontextlost", onLost);

  return () => {
    pause();
    window.removeEventListener("resize", resize);
    ro.disconnect();
    window.removeEventListener("pointermove", onPointer);
    darkQuery.removeEventListener("change", onScheme);
    document.removeEventListener("visibilitychange", onVisibility);
    renderer.domElement.removeEventListener("webglcontextlost", onLost);
    roadGeometry.dispose();
    roadMaterial.dispose();
    glowGeometry.dispose();
    glowMaterial.dispose();
    gateGeometry.dispose();
    for (const g of gates) g.material.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}
