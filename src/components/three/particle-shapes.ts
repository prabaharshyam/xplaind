/**
 * MO-8: particle sculptures for page headers. Each shape is a list of weighted parts; a part is a
 * function that returns one random point on it. Pure maths (no DOM, no three.js), so every shape
 * is unit tested. The finished cloud is centred and scaled to fit a sphere of radius 1.
 */
import type { IconName, ThemeId } from "@/lib/themes";

export type Vec = [number, number, number];
type Rand = () => number;
type Part = (r: Rand) => Vec;
type Weighted = [number, Part];

export type ShapeName =
  | "globe"
  | "brain"
  | "layers"
  | "openBook"
  | "bookshelf"
  | "paperStack"
  | "quill"
  | "compass"
  | "atom"
  | "microphone"
  | "speech"
  | "trophy"
  | "screenPlay"
  | "gradCap"
  | "medal"
  | "cardFan"
  | "bulb"
  | "barChart"
  | "rocket"
  | "database"
  | "magnifier"
  | "robot"
  | "shield"
  | "gears"
  | "cog"
  | "target"
  | "tree"
  | "serverRack"
  | "mapRoute"
  | "sparkle"
  | "briefcase"
  | "resume"
  | "calendar";

/** A page's shape: a 3D sculpture, or one of the site's line icons given depth. */
export type ParticleShape = ShapeName | `icon:${IconName}`;

/** The shape for each topic, used by lessons, topic pages and role roadmaps. */
export const THEME_SHAPE: Record<ThemeId, ParticleShape> = {
  "ai-basics": "sparkle",
  "using-ai": "icon:chat",
  code: "icon:code",
  data: "database",
  llm: "brain",
  retrieval: "magnifier",
  agents: "robot",
  evals: "icon:check",
  ops: "rocket",
  security: "shield",
  governance: "icon:scale",
  ml: "layers",
  automation: "gears",
  product: "target",
  client: "icon:people",
  career: "trophy",
  dsa: "tree",
  "software-engineering": "layers",
  "system-design": "serverRack",
  rust: "cog",
  "ai-tools": "icon:bolt",
};

/** A seeded random number generator (mulberry32), so a shape is the same on every visit. */
export function seeded(seed: number): Rand {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------- building blocks --

const TAU = Math.PI * 2;
const jit = (r: Rand, s: number) => (r() - 0.5) * s;

const move =
  (p: Part, d: Vec): Part =>
  (r) => {
    const [x, y, z] = p(r);
    return [x + d[0], y + d[1], z + d[2]];
  };

const rotate =
  (p: Part, rx: number, ry: number, rz: number): Part =>
  (r) => {
    let [x, y, z] = p(r);
    [y, z] = [y * Math.cos(rx) - z * Math.sin(rx), y * Math.sin(rx) + z * Math.cos(rx)];
    [x, z] = [x * Math.cos(ry) + z * Math.sin(ry), -x * Math.sin(ry) + z * Math.cos(ry)];
    [x, y] = [x * Math.cos(rz) - y * Math.sin(rz), x * Math.sin(rz) + y * Math.cos(rz)];
    return [x, y, z];
  };

/** The surface of a sphere. */
const sphere =
  (radius: number, c: Vec = [0, 0, 0]): Part =>
  (r) => {
    const u = r() * 2 - 1;
    const a = r() * TAU;
    const s = Math.sqrt(1 - u * u);
    return [c[0] + radius * s * Math.cos(a), c[1] + radius * u, c[2] + radius * s * Math.sin(a)];
  };

/** A circle (ring) in the XY plane, with a little thickness. */
const ring =
  (radius: number, thick = 0.03, from = 0, to = TAU): Part =>
  (r) => {
    const a = from + r() * (to - from);
    const rr = radius + jit(r, thick);
    return [rr * Math.cos(a), rr * Math.sin(a), jit(r, thick)];
  };

/** A filled disc in the XY plane. */
const disc =
  (radius: number, inner = 0): Part =>
  (r) => {
    const rr = Math.sqrt(inner * inner + r() * (radius * radius - inner * inner));
    const a = r() * TAU;
    return [rr * Math.cos(a), rr * Math.sin(a), jit(r, 0.02)];
  };

/** A straight segment from a to b. */
const seg =
  (a: Vec, b: Vec, thick = 0.02): Part =>
  (r) => {
    const t = r();
    return [a[0] + (b[0] - a[0]) * t + jit(r, thick), a[1] + (b[1] - a[1]) * t + jit(r, thick), a[2] + (b[2] - a[2]) * t + jit(r, thick)];
  };

/** The surface of a box centred on c. */
const box =
  (size: Vec, c: Vec = [0, 0, 0], edgesOnly = false): Part =>
  (r) => {
    const [w, h, d] = size;
    const p: Vec = [jit(r, w), jit(r, h), jit(r, d)];
    if (edgesOnly) {
      // Push two coordinates to the edges: the box's wireframe.
      const keep = Math.floor(r() * 3);
      for (let i = 0; i < 3; i++) if (i !== keep) p[i] = (r() < 0.5 ? -0.5 : 0.5) * size[i];
    } else {
      const face = Math.floor(r() * 3);
      p[face] = (r() < 0.5 ? -0.5 : 0.5) * size[face];
    }
    return [p[0] + c[0], p[1] + c[1], p[2] + c[2]];
  };

/** A flat rectangle in the XY plane (filled or outline). */
const rect =
  (w: number, h: number, outline = false): Part =>
  (r) => {
    if (!outline) return [jit(r, w), jit(r, h), jit(r, 0.015)];
    const t = r() * 2 * (w + h);
    if (t < w) return [t - w / 2, h / 2, 0];
    if (t < 2 * w) return [t - w * 1.5, -h / 2, 0];
    if (t < 2 * w + h) return [-w / 2, t - 2 * w - h / 2, 0];
    return [w / 2, t - 2 * w - h * 1.5, 0];
  };

/** A surface of revolution around the Y axis from a profile of [radius, y] points. */
const lathe =
  (profile: [number, number][]): Part =>
  (r) => {
    const i = Math.floor(r() * (profile.length - 1));
    const t = r();
    const rad = profile[i][0] + (profile[i + 1][0] - profile[i][0]) * t;
    const y = profile[i][1] + (profile[i + 1][1] - profile[i][1]) * t;
    const a = r() * TAU;
    return [rad * Math.cos(a), y, rad * Math.sin(a)];
  };

/** A quadratic Bezier curve. */
const curve =
  (a: Vec, b: Vec, c: Vec, thick = 0.025): Part =>
  (r) => {
    const t = r();
    const u = 1 - t;
    return [0, 1, 2].map((k) => u * u * a[k] + 2 * u * t * b[k] + t * t * c[k] + jit(r, thick)) as Vec;
  };

/** A gear outline with teeth, in the XY plane. */
const gear =
  (radius: number, teeth: number, depth = 0.12): Part =>
  (r) => {
    const a = r() * TAU;
    const tooth = Math.cos(a * teeth) > 0.2 ? depth : 0;
    const rr = (r() < 0.75 ? radius + tooth : radius * (0.35 + r() * 0.1)) + jit(r, 0.02);
    return [rr * Math.cos(a), rr * Math.sin(a), jit(r, 0.12)];
  };

// ---------------------------------------------------------------- the sculptures --

function linesOnPage(w: number, h: number, rows: number): Part {
  return (r) => {
    const row = Math.floor(r() * rows);
    const len = row % 3 === 2 ? 0.6 : 0.9;
    return [(r() - 0.5) * w * len, h / 2 - ((row + 0.5) / rows) * h, 0];
  };
}

const SCULPTURES: Record<ShapeName, Weighted[]> = {
  globe: [
    // Lines of latitude and longitude, plus arcs linking learners around the world.
    ...[-0.6, -0.3, 0, 0.3, 0.6].map((y): Weighted => [1, rotate(move(ring(Math.sqrt(1 - y * y)), [0, 0, 0]), Math.PI / 2, 0, 0) as Part]).map(
      ([w, p], i): Weighted => [w, move(p, [0, [-0.6, -0.3, 0, 0.3, 0.6][i], 0])],
    ),
    ...[0, 1, 2, 3, 4, 5].map((k): Weighted => [1, rotate(ring(1), 0, (k * Math.PI) / 6, 0)]),
    [1.5, rotate(ring(1.35, 0.02, 0.2, 2.4), 0.5, 0.3, 0.2)],
    [1.5, rotate(ring(1.3, 0.02, 3, 5.2), -0.4, 0.8, -0.3)],
  ],
  brain: (() => {
    // A constellation of ideas: nodes on a rounded, two-lobed cloud, each linked to its neighbours.
    const r0 = seeded(42);
    const nodes: Vec[] = Array.from({ length: 26 }, () => {
      const [x, y, z] = sphere(1)(r0);
      const k = 0.55 + r0() * 0.45;
      return [x * 1.25 * k + (x > 0 ? 0.1 : -0.1), y * 0.85 * k, z * 0.9 * k] as Vec;
    });
    const links: [Vec, Vec][] = [];
    nodes.forEach((a, i) =>
      nodes
        .map((b, j) => [j, Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])] as const)
        .filter(([j]) => j > i)
        .sort((p, q) => p[1] - q[1])
        .slice(0, 2)
        .forEach(([j]) => links.push([a, nodes[j]])),
    );
    return [
      [3, (r) => sphere(0.045, nodes[Math.floor(r() * nodes.length)])(r)],
      [4, (r) => {
        const [a, b] = links[Math.floor(r() * links.length)];
        return seg(a, b, 0.004)(r);
      }],
    ] as Weighted[];
  })(),
  layers: [
    // A neural network: four layers of nodes and the links between neighbouring layers.
    [4, (r) => {
      const sizes = [3, 5, 5, 2];
      const l = Math.floor(r() * 4);
      const n = Math.floor(r() * sizes[l]);
      const c: Vec = [-1.2 + l * 0.8, (n - (sizes[l] - 1) / 2) * 0.45, 0];
      return sphere(0.1, c)(r);
    }],
    [3, (r) => {
      const sizes = [3, 5, 5, 2];
      const l = Math.floor(r() * 3);
      const a = Math.floor(r() * sizes[l]);
      const b = Math.floor(r() * sizes[l + 1]);
      return seg([-1.2 + l * 0.8, (a - (sizes[l] - 1) / 2) * 0.45, 0], [-0.4 + l * 0.8, (b - (sizes[l + 1] - 1) / 2) * 0.45, 0], 0.01)(r);
    }],
  ],
  openBook: [
    // Two curved pages, lines of text, the spine and the fanned page edges.
    [3, (r) => {
      const side = r() < 0.5 ? -1 : 1;
      const u = r();
      const v = r() - 0.5;
      return [side * u * 1.1, Math.sin(u * Math.PI) * 0.18 + u * 0.05, v * 1.3];
    }],
    [2, (r) => {
      const side = r() < 0.5 ? -1 : 1;
      const row = Math.floor(r() * 9);
      const u = 0.12 + r() * 0.8;
      return [side * u * 1.1, Math.sin(u * Math.PI) * 0.18 + u * 0.05 + 0.02, -0.5 + row * 0.12];
    }],
    [1, seg([0, -0.02, -0.65], [0, -0.02, 0.65], 0.02)],
    [1, (r) => {
      const side = r() < 0.5 ? -1 : 1;
      const k = r();
      return [side * 1.1, -k * 0.12, (r() - 0.5) * 1.3];
    }],
  ],
  bookshelf: [
    // Two shelves of books standing side by side, some leaning.
    [5, (r) => {
      const shelf = r() < 0.5 ? 0 : 1;
      const i = Math.floor(r() * 9);
      const h = 0.55 + ((i * 37) % 5) * 0.06;
      const lean = i === 7 ? 0.25 : 0;
      const p = box([0.16, h, 0.45], [0, h / 2, 0], true)(r);
      return rotate(() => p, 0, 0, -lean)(r).map((v, k) => v + [-0.85 + i * 0.21 + lean * 0.3, shelf ? 0.05 : -0.85, 0][k]) as Vec;
    }],
    [2, (r) => box([2.1, 0.05, 0.5], [0, r() < 0.5 ? 0.05 : -0.85, 0])(r)],
  ],
  paperStack: [
    // Research papers fanned out, each with a title and lines of text.
    [6, (r) => {
      const k = Math.floor(r() * 5);
      const p = r() < 0.3 ? rect(1, 1.35, true)(r) : linesOnPage(0.8, 1.15, 14)(r);
      return rotate(() => p, 0.2, -0.5 + k * 0.08, -0.25 + k * 0.12)(r).map((v, i) => v + [k * 0.12 - 0.25, k * 0.05, -k * 0.15][i]) as Vec;
    }],
  ],
  quill: [
    // A feather quill: the shaft and the vanes, writing a line.
    [2, curve([-0.9, -1, 0], [0, -0.1, 0.1], [0.9, 1, 0], 0.015)],
    [5, (r) => {
      const t = 0.25 + r() * 0.75;
      const u = 1 - t;
      const spine: Vec = [u * u * -0.9 + 2 * u * t * 0 + t * t * 0.9, u * u * -1 + 2 * u * t * -0.1 + t * t * 1, 0];
      const width = Math.sin(((t - 0.25) / 0.75) * Math.PI) * 0.35;
      const side = r() < 0.5 ? -1 : 1;
      const k = r();
      return [spine[0] - side * width * k * 0.7, spine[1] + side * width * k * 0.7 - k * 0.12, jit(r, 0.05)];
    }],
    [1.5, (r) => [-1.2 + r() * 1.1, -1.1 + Math.sin(r() * 18) * 0.03, 0]],
  ],
  compass: [
    // A compass: the bezel, the tick marks, a four-point rose and the needle.
    [3, ring(1, 0.04)],
    [1.5, ring(0.88, 0.02)],
    [1.5, (r) => {
      const k = Math.floor(r() * 24);
      const a = (k / 24) * TAU;
      const t = 0.78 + r() * (k % 6 === 0 ? 0.1 : 0.05);
      return [Math.cos(a) * t, Math.sin(a) * t, 0];
    }],
    [3, (r) => {
      const k = Math.floor(r() * 4);
      const a = (k * TAU) / 4 + Math.PI / 2;
      const len = k % 2 === 0 ? 0.7 : 0.45;
      const t = r();
      const w = (1 - t) * 0.12 * (r() - 0.5) * 2;
      return [Math.cos(a) * len * t - Math.sin(a) * w, Math.sin(a) * len * t + Math.cos(a) * w, 0.05];
    }],
    [1, sphere(0.06)],
  ],
  atom: [
    // A nucleus with three electron orbits: subjects circling one core.
    [2, sphere(0.22)],
    [3, rotate(ring(1, 0.025), 1.25, 0, 0)],
    [3, rotate(ring(1, 0.025), 1.25, 0, Math.PI / 3)],
    [3, rotate(ring(1, 0.025), 1.25, 0, (2 * Math.PI) / 3)],
    [1, (r) => sphere(0.07, rotate(() => [1, 0, 0], 1.25, 0, (Math.floor(r() * 3) * Math.PI) / 3)(r))(r)],
  ],
  microphone: [
    // A studio microphone: grille head, body, holder and stand, with sound waves.
    [4, sphere(0.42, [0, 0.55, 0])],
    [1.5, lathe([[0.3, 0.45], [0.26, -0.05], [0.18, -0.2]])],
    [1.5, rotate(ring(0.55, 0.02, Math.PI * 1.05, Math.PI * 1.95), 0, 0, 0)],
    [1, seg([0, -0.55, 0], [0, -1, 0])],
    [1, rotate(disc(0.4), Math.PI / 2, 0, 0) as Part],
    [2, (r) => {
      const k = 1 + Math.floor(r() * 3);
      const side = r() < 0.5 ? -1 : 1;
      const a = (r() - 0.5) * 1.1;
      const rad = 0.55 + k * 0.22;
      return [side * Math.cos(a) * rad, 0.55 + Math.sin(a) * rad, 0];
    }],
  ],
  speech: [
    // Two speech bubbles in conversation, one with typing dots.
    [3, (r) => {
      const p = rotate(ring(1, 0.03), 0, 0, 0)(r);
      return [p[0] * 0.75 - 0.35, p[1] * 0.48 + 0.35, 0.1];
    }],
    [1, seg([-0.75, -0.05, 0.1], [-0.95, -0.35, 0.1])],
    [3, (r) => {
      const p = ring(1, 0.03)(r);
      return [p[0] * 0.65 + 0.45, p[1] * 0.42 - 0.45, -0.25];
    }],
    [1, seg([0.85, -0.82, -0.25], [1.05, -1.05, -0.25])],
    [1.5, (r) => sphere(0.07, [-0.6 + Math.floor(r() * 3) * 0.25, 0.35, 0.1])(r)],
  ],
  trophy: [
    // A cup on a stem and base, with two handles.
    [5, lathe([[0.05, 0.2], [0.55, 0.35], [0.7, 0.75], [0.72, 1]])],
    [1.5, lathe([[0.08, 0.2], [0.06, -0.35]])],
    [2, lathe([[0.45, -0.55], [0.4, -0.35], [0.1, -0.35]])],
    [1.5, move(rotate(ring(0.3, 0.03, -Math.PI / 2, Math.PI / 2), 0, 0, 0), [0.68, 0.6, 0])],
    [1.5, move(rotate(ring(0.3, 0.03, Math.PI / 2, Math.PI * 1.5), 0, 0, 0), [-0.68, 0.6, 0])],
    [1, sphere(0.06, [0, 1.2, 0])],
  ],
  screenPlay: [
    // A screen with a play button, and a ribbon of film frames looping round it.
    [3, rect(1.8, 1.1, true)],
    [3, (r) => {
      const t = r();
      const s = r();
      const a: Vec = [-0.22, 0.28, 0.05];
      const b: Vec = [-0.22, -0.28, 0.05];
      const c: Vec = [0.3, 0, 0.05];
      const u = 1 - Math.sqrt(t);
      const v = Math.sqrt(t) * (1 - s);
      const w = Math.sqrt(t) * s;
      return [a[0] * u + b[0] * v + c[0] * w, a[1] * u + b[1] * v + c[1] * w, 0.05];
    }],
    [2, (r) => {
      const a = r() * TAU;
      const edge = r() < 0.5 ? -0.1 : 0.1;
      return [Math.cos(a) * 1.25, edge + (Math.floor((a / TAU) * 40) % 2 ? 0 : jit(r, 0.05)), Math.sin(a) * 0.5];
    }],
  ],
  gradCap: [
    // A mortarboard: the board, the cap underneath and the tassel.
    [4, rotate(rect(1.6, 1.6), Math.PI / 2, Math.PI / 4, 0)],
    [2, lathe([[0.55, 0], [0.5, -0.45], [0.48, -0.5]])],
    [1, curve([0, 0.08, 0], [0.55, 0.15, 0.2], [0.75, -0.2, 0.35], 0.015)],
    [1, (r) => sphere(0.08 * r(), [0.75, -0.45, 0.35])(r)],
  ],
  medal: [
    // A medal with a star, hanging from a ribbon.
    [3, move(disc(0.6, 0.48), [0, -0.35, 0])],
    [3, (r) => {
      const a = r() * TAU;
      const k = Math.cos(a * 5) * 0.5 + 0.5;
      const rr = (0.18 + k * 0.22) * Math.sqrt(r());
      return [Math.cos(a + Math.PI / 2) * rr, -0.35 + Math.sin(a + Math.PI / 2) * rr, 0.03];
    }],
    [2, (r) => {
      const side = r() < 0.5 ? -1 : 1;
      const t = r();
      const w = (r() - 0.5) * 0.3;
      return [side * (0.1 + t * 0.35) + w, 0.25 + t * 0.85, jit(r, 0.02)];
    }],
  ],
  cardFan: [
    // Practice cards: a neat stack of flash cards, the front one asking a question.
    [5, (r) => {
      const k = Math.floor(r() * 3);
      const p = rect(1.15, 1.5, true)(r);
      return [p[0] + k * 0.16, p[1] + k * 0.16, -k * 0.22];
    }],
    [5, (r) => {
      // A large question mark on the front card: the hook, the stem and the dot.
      const t = r();
      if (t < 0.62) {
        const a = Math.PI * 1.05 - (t / 0.62) * Math.PI * 1.55;
        return [Math.cos(a) * 0.27 + jit(r, 0.035), 0.3 + Math.sin(a) * 0.27 + jit(r, 0.035), 0.05];
      }
      if (t < 0.85) {
        const u = (t - 0.62) / 0.23;
        return [jit(r, 0.05), 0.03 - u * 0.25, 0.05];
      }
      return sphere(0.065, [0, -0.43, 0.05])(r);
    }],
  ],
  bulb: [
    // A light bulb: the glass, the screw base and a glowing filament.
    [5, (r) => {
      const p = sphere(0.65, [0, 0.35, 0])(r);
      return p[1] < 0 ? [p[0] * (0.55 + p[1] * 0.3), p[1], p[2] * (0.55 + p[1] * 0.3)] : p;
    }],
    [2, lathe([[0.3, -0.35], [0.3, -0.75], [0.15, -0.85]])],
    [2, (r) => {
      const t = r();
      return [Math.sin(t * TAU * 2) * 0.18, 0.1 + t * 0.4, Math.cos(t * TAU * 2) * 0.05];
    }],
    [1, (r) => {
      const a = r() * TAU;
      const rr = 0.95 + r() * 0.3;
      return Math.floor((a / TAU) * 8) % 2 ? [Math.cos(a) * rr, 0.35 + Math.sin(a) * rr, 0] : [0, 0.35, 0];
    }],
  ],
  barChart: [
    // Rising bars on an axis, with a trend line climbing over them.
    [6, (r) => {
      const k = Math.floor(r() * 5);
      const h = 0.35 + k * 0.32;
      return box([0.28, h, 0.28], [-0.8 + k * 0.4, -0.9 + h / 2, 0], true)(r);
    }],
    [1, seg([-1.05, -0.9, 0], [1.05, -0.9, 0])],
    [2, (r) => {
      const t = r();
      return [-0.8 + t * 1.6, -0.35 + t * 1.25 + Math.sin(t * 9) * 0.05, 0.25];
    }],
  ],
  rocket: [
    // A rocket with fins and a window, and exhaust trailing behind.
    [5, lathe([[0, 1.05], [0.18, 0.8], [0.28, 0.4], [0.3, -0.2], [0.25, -0.45]])],
    [1, move(rotate(ring(0.1), 0, Math.PI / 2, 0), [0.28, 0.35, 0])],
    [2, (r) => {
      const k = Math.floor(r() * 3);
      const t = r();
      const s = r();
      const p: Vec = [0.3 + t * 0.3, -0.2 - t * 0.35 - s * 0.15, 0];
      return rotate(() => p, 0, (k * TAU) / 3, 0)(r);
    }],
    [2, (r) => {
      const t = Math.pow(r(), 0.7);
      const a = r() * TAU;
      const rr = 0.2 * (1 - t) + jit(r, 0.12) * t;
      return [Math.cos(a) * rr, -0.5 - t * 0.6, Math.sin(a) * rr];
    }],
  ],
  database: [
    // Three stacked disks of a database.
    ...[0.55, 0, -0.55].flatMap((y): Weighted[] => [
      [2, move(rotate(ring(0.8, 0.03), Math.PI / 2, 0, 0), [0, y + 0.2, 0])],
      [2, move(rotate(ring(0.8, 0.03), Math.PI / 2, 0, 0), [0, y - 0.2, 0])],
      [1.5, (r) => lathe([[0.8, y + 0.2], [0.8, y - 0.2]])(r)],
    ]),
  ],
  magnifier: [
    // A magnifying glass over a page of text.
    [4, move(ring(0.55, 0.06), [-0.2, 0.25, 0.2])],
    [1.5, move(disc(0.5), [-0.2, 0.25, 0.2])],
    [2, seg([0.2, -0.15, 0.2], [0.75, -0.75, 0.2], 0.08)],
    [2, move(linesOnPage(1.4, 1.6, 12), [0, 0, -0.35])],
  ],
  robot: [
    // A robot head: the head, eyes, mouth grille, ears and antenna.
    [5, box([1.3, 0.95, 0.9], [0, -0.1, 0], true)],
    [2, (r) => sphere(0.13, [r() < 0.5 ? -0.3 : 0.3, 0.05, 0.46])(r)],
    [1, (r) => [-0.3 + r() * 0.6, -0.35 + (Math.floor(r() * 3) - 1) * 0.04, 0.46]],
    [1, (r) => lathe([[0.12, -0.2], [0.12, 0.1]])(r).map((v, i) => (i === 0 ? v * 0.3 + (r() < 0.5 ? -0.72 : 0.72) : v)) as Vec],
    [1, seg([0, 0.38, 0], [0, 0.75, 0])],
    [1, sphere(0.1, [0, 0.82, 0])],
  ],
  shield: [
    // A shield with a tick on its face.
    [5, (r) => {
      const t = r();
      const side = r() < 0.5 ? -1 : 1;
      const y = 0.8 - t * 1.75;
      const w = t < 0.45 ? 0.75 : 0.75 * Math.cos(((t - 0.45) / 0.55) * (Math.PI / 2));
      const fill = r() < 0.45;
      const x = fill ? w * (r() * 2 - 1) : side * w;
      return [x, y, -0.25 * (1 - (x / 0.75) ** 2) + (fill ? 0 : 0.02)];
    }],
    [2, (r) => (r() < 0.4 ? seg([-0.3, 0, 0.12], [-0.05, -0.25, 0.12], 0.04)(r) : seg([-0.05, -0.25, 0.12], [0.38, 0.25, 0.12], 0.04)(r))],
  ],
  gears: [
    // Two meshing gears.
    [4, move(gear(0.6, 10), [-0.35, 0.2, 0])],
    [3, move(rotate(gear(0.42, 7), 0, 0, 0.25), [0.6, -0.42, 0.1])],
  ],
  cog: [[5, gear(0.85, 12, 0.15)], [1, ring(0.3, 0.05)]],
  target: [
    // A target's rings and an arrow in the bullseye.
    [2, ring(1, 0.04)],
    [2, ring(0.68, 0.04)],
    [1.5, ring(0.36, 0.04)],
    [1, disc(0.12)],
    [2, seg([0, 0, 0], [0.7, 0.55, 0.9], 0.02)],
    [1, (r) => {
      const t = r();
      return [0.62 + jit(r, 0.2) * t, 0.48 + jit(r, 0.2) * t, 0.8 + t * 0.2];
    }],
  ],
  tree: [
    // A binary tree: nodes on four levels and the links between them.
    [4, (r) => {
      const level = Math.floor(r() * 4);
      const i = Math.floor(r() * 2 ** level);
      const x = ((i + 0.5) / 2 ** level - 0.5) * 2.2;
      return sphere(0.09, [x, 0.9 - level * 0.6, 0])(r);
    }],
    [3, (r) => {
      const level = Math.floor(r() * 3);
      const i = Math.floor(r() * 2 ** level);
      const x = ((i + 0.5) / 2 ** level - 0.5) * 2.2;
      const child = i * 2 + (r() < 0.5 ? 0 : 1);
      const cx = ((child + 0.5) / 2 ** (level + 1) - 0.5) * 2.2;
      return seg([x, 0.9 - level * 0.6, 0], [cx, 0.3 - level * 0.6, 0], 0.01)(r);
    }],
  ],
  serverRack: [
    // A rack of servers, with blinking lights on each.
    [5, (r) => box([1.3, 0.35, 0.8], [0, 0.6 - Math.floor(r() * 4) * 0.42, 0], true)(r)],
    [2, (r) => sphere(0.03, [-0.5 + Math.floor(r() * 3) * 0.08, 0.6 - Math.floor(r() * 4) * 0.42, 0.41])(r)],
    [1, (r) => [0.1 + r() * 0.45, 0.6 - Math.floor(r() * 4) * 0.42, 0.41]],
  ],
  mapRoute: [
    // A folded map with a winding route to a pin.
    [4, (r) => {
      const k = Math.floor(r() * 4);
      const p = rect(0.5, 1.3, r() < 0.5)(r);
      return [p[0] - 0.75 + k * 0.5, p[1], k % 2 ? 0.12 + p[0] * 0.4 : -p[0] * 0.4];
    }],
    [3, (r) => {
      const t = r();
      return [-0.9 + t * 1.6, Math.sin(t * 7) * 0.35 - 0.1 + t * 0.2, 0.2];
    }],
    [2, (r) => sphere(0.12, [0.7, 0.55, 0.3])(r)],
    [1, seg([0.7, 0.43, 0.3], [0.7, 0.2, 0.3], 0.02)],
  ],
  calendar: [
    // A wall calendar: the page, the binding rings and a grid of days with this week lit up.
    [3, rect(1.8, 1.6, true)],
    [1, seg([-0.9, 0.5, 0], [0.9, 0.5, 0], 0.02)],
    [2, (r) => move(ring(0.08, 0.025), [-0.55 + Math.floor(r() * 4) * 0.37, 0.82, 0.03])(r)],
    [4, (r) => {
      const col = Math.floor(r() * 7);
      const row = Math.floor(r() * 4);
      const c: Vec = [-0.72 + col * 0.24, 0.3 - row * 0.3, 0.02];
      return row === 1 ? sphere(0.06, c)(r) : [c[0] + jit(r, 0.1), c[1] + jit(r, 0.1), c[2]];
    }],
  ],
  resume: [
    // A one-page resume: the page, a photo, the name, lines of experience and a tick of approval.
    [4, rect(1.3, 1.75, true)],
    [2, move(ring(0.17, 0.03), [-0.38, 0.6, 0.02])],
    [1, seg([-0.12, 0.66, 0.02], [0.45, 0.66, 0.02], 0.03)],
    [1, seg([-0.12, 0.54, 0.02], [0.3, 0.54, 0.02], 0.02)],
    [4, move(linesOnPage(1.0, 1.0, 9), [0, -0.25, 0.02])],
    [2, (r) => (r() < 0.4 ? seg([0.35, -0.75, 0.2], [0.5, -0.9, 0.2], 0.04)(r) : seg([0.5, -0.9, 0.2], [0.8, -0.55, 0.2], 0.04)(r))],
  ],
  briefcase: [
    // A work briefcase: the case, its handle, the clasp and the seam across the middle.
    [6, box([1.9, 1.25, 0.55], [0, -0.15, 0], true)],
    [2, move(ring(0.32, 0.04, 0, Math.PI), [0, 0.5, 0])],
    [1, seg([-0.95, 0.05, 0.28], [0.95, 0.05, 0.28], 0.02)],
    [1, box([0.3, 0.2, 0.05], [0, 0.05, 0.3])],
  ],
  sparkle: [
    // A four-point star with smaller sparks around it.
    [5, (r) => {
      const a = r() * TAU;
      const k = Math.pow(Math.abs(Math.cos(a * 2)), 6);
      const rr = (0.2 + k * 0.85) * Math.sqrt(r());
      return [Math.cos(a) * rr, Math.sin(a) * rr, jit(r, 0.08)];
    }],
    [2, (r) => {
      const c: Vec = [[0.75, 0.7, 0.2], [-0.8, -0.65, -0.2], [0.85, -0.6, 0.1]][Math.floor(r() * 3)] as Vec;
      const a = r() * TAU;
      const k = Math.pow(Math.abs(Math.cos(a * 2)), 6);
      const rr = (0.05 + k * 0.25) * Math.sqrt(r());
      return [c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr, c[2]];
    }],
  ],
};

export const SHAPE_NAMES = Object.keys(SCULPTURES) as ShapeName[];

/** Shapes that lie flat are tipped toward the viewer (x, y, z radians). */
const VIEW: Partial<Record<ShapeName, Vec>> = {
  openBook: [0.95, 0, 0],
  gradCap: [0.5, 0, 0],
};

/** Sample `count` points from a sculpture, centred and scaled to fit radius 1. */
export function sculpture(name: ShapeName, count: number, seed = 7): Float32Array {
  const parts = SCULPTURES[name];
  const total = parts.reduce((s, [w]) => s + w, 0);
  const r = seeded(seed);
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    let pick = r() * total;
    let part = parts[parts.length - 1][1];
    for (const [w, p] of parts) {
      if ((pick -= w) <= 0) {
        part = p;
        break;
      }
    }
    out.set(part(r), i * 3);
  }
  const view = VIEW[name];
  if (view) {
    for (let i = 0; i < count; i++) {
      const p: Vec = [out[i * 3], out[i * 3 + 1], out[i * 3 + 2]];
      out.set(rotate(() => p, ...view)(r), i * 3);
    }
  }
  return normalise(out);
}

/** Give flat 2D points (an icon's pixels, in -1..1) some depth: a thick slab of particles. */
export function extrude(points2d: Float32Array, count: number, seed = 7): Float32Array {
  const r = seeded(seed);
  const n = points2d.length / 2;
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const k = Math.floor(r() * n);
    out.set([points2d[k * 2] + jit(r, 0.02), points2d[k * 2 + 1] + jit(r, 0.02), jit(r, 0.28)], i * 3);
  }
  return normalise(out);
}

function normalise(p: Float32Array): Float32Array {
  const n = p.length / 3;
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < n; i++)
    for (let k = 0; k < 3; k++) {
      min[k] = Math.min(min[k], p[i * 3 + k]);
      max[k] = Math.max(max[k], p[i * 3 + k]);
    }
  const c = [0, 1, 2].map((k) => (min[k] + max[k]) / 2);
  let radius = 1e-6;
  for (let i = 0; i < n; i++) {
    const x = p[i * 3] - c[0];
    const y = p[i * 3 + 1] - c[1];
    const z = p[i * 3 + 2] - c[2];
    radius = Math.max(radius, Math.hypot(x, y, z));
  }
  for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) p[i * 3 + k] = (p[i * 3 + k] - c[k]) / radius;
  return p;
}

/** Where particles wait before the intro: a slowly turning spiral galaxy around the shape. */
export function galaxy(count: number, seed = 11): Float32Array {
  const r = seeded(seed);
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const rad = 1.4 + Math.pow(r(), 0.6) * 2.2;
    const arm = Math.floor(r() * 3) * (TAU / 3);
    const a = arm + rad * 1.4 + jit(r, 0.6);
    out.set([Math.cos(a) * rad, jit(r, 0.35), Math.sin(a) * rad], i * 3);
  }
  return out;
}
