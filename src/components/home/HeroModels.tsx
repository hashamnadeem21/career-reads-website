"use client";

import { useEffect, useRef } from "react";

/**
 * A small flat-shaded 3D scene on a 2D canvas (no WebGL library): a laptop, a
 * briefcase, a stack of books, a graduation cap and a gem float around a
 * dotted orbit. Faces are lit with one directional light and drawn back to
 * front. The scene sways with the pointer, pauses when off-screen or in a
 * background tab, and renders a single still frame for reduced-motion users.
 */

type Vec3 = [number, number, number];
type Rgb = [number, number, number];
type ColorKey = "brand" | "brand2" | "violet" | "amber" | "ink" | "paper";

interface Part {
  verts: Vec3[];
  faces: number[][];
  color: ColorKey;
}

interface Model {
  parts: Part[];
  position: Vec3;
  scale: number;
  rotation: Vec3;
  /** Radians per second around the model's own Y axis. */
  spin: number;
  bob: number;
}

// ── Geometry helpers ─────────────────────────────────────────────────────────

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const normalize = (a: Vec3): Vec3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const centroid = (points: Vec3[]): Vec3 => {
  const s = points.reduce(add, [0, 0, 0]);
  return [s[0] / points.length, s[1] / points.length, s[2] / points.length];
};

/** Rotate around X, then Y, then Z. */
function rotate([x, y, z]: Vec3, [rx, ry, rz]: Vec3): Vec3 {
  let c = Math.cos(rx), s = Math.sin(rx);
  [y, z] = [y * c - z * s, y * s + z * c];
  c = Math.cos(ry); s = Math.sin(ry);
  [x, z] = [x * c + z * s, -x * s + z * c];
  c = Math.cos(rz); s = Math.sin(rz);
  [x, y] = [x * c - y * s, x * s + y * c];
  return [x, y, z];
}

/** Every part is convex, so faces are wound outward by checking against the part's centre. */
function orientFaces(verts: Vec3[], faces: number[][]): number[][] {
  const center = centroid(verts);
  return faces.map((face) => {
    const [a, b, c] = face.map((i) => verts[i]);
    const normal = cross(sub(b, a), sub(c, a));
    const outward = sub(centroid(face.map((i) => verts[i])), center);
    return dot(normal, outward) < 0 ? [...face].reverse() : face;
  });
}

function part(verts: Vec3[], faces: number[][], color: ColorKey, rotation: Vec3 = [0, 0, 0], offset: Vec3 = [0, 0, 0]): Part {
  const placed = verts.map((v) => add(rotate(v, rotation), offset));
  return { verts: placed, faces: orientFaces(placed, faces), color };
}

function box(w: number, h: number, d: number, color: ColorKey, offset?: Vec3, rotation?: Vec3): Part {
  const [x, y, z] = [w / 2, h / 2, d / 2];
  const verts: Vec3[] = [
    [-x, -y, -z], [x, -y, -z], [x, y, -z], [-x, y, -z],
    [-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z],
  ];
  const faces = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [3, 2, 6, 7], [1, 2, 6, 5], [0, 3, 7, 4]];
  return part(verts, faces, color, rotation, offset);
}

function prism(sides: number, r: number, h: number, color: ColorKey, offset?: Vec3): Part {
  const verts: Vec3[] = [];
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2;
    verts.push([Math.cos(a) * r, -h / 2, Math.sin(a) * r], [Math.cos(a) * r, h / 2, Math.sin(a) * r]);
  }
  const faces: number[][] = [];
  for (let i = 0; i < sides; i++) {
    const j = (i + 1) % sides;
    faces.push([i * 2, j * 2, j * 2 + 1, i * 2 + 1]);
  }
  faces.push(Array.from({ length: sides }, (_, i) => i * 2), Array.from({ length: sides }, (_, i) => i * 2 + 1));
  return part(verts, faces, color, undefined, offset);
}

function icosahedron(r: number, color: ColorKey): Part {
  const t = (1 + Math.sqrt(5)) / 2;
  const raw: Vec3[] = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
  ];
  const verts = raw.map((v) => normalize(v).map((c) => c * r) as Vec3);
  const faces = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];
  return part(verts, faces, color);
}

// ── The models ───────────────────────────────────────────────────────────────

const laptop = (): Part[] => {
  const tilt: Vec3 = [-0.28, 0, 0];
  return [
    box(1.7, 0.08, 1.15, "ink"),
    box(1.2, 0.02, 0.45, "paper", [0, 0.05, 0.12]),
    box(1.7, 1.08, 0.06, "ink", add(rotate([0, 0.54, 0], tilt), [0, 0.04, -0.56]), tilt),
    box(1.52, 0.92, 0.02, "brand2", add(rotate([0, 0.54, 0.04], tilt), [0, 0.04, -0.56]), tilt),
    // A few "lines of code" on the screen.
    ...[0.84, 0.68, 0.52, 0.36].map((y, i) =>
      box([0.9, 0.6, 1.05, 0.5][i], 0.06, 0.01, i % 2 ? "amber" : "paper", add(rotate([[-0.22, -0.37, -0.15, -0.42][i], y, 0.055], tilt), [0, 0.04, -0.56]), tilt),
    ),
  ];
};

const briefcase = (): Part[] => [
  box(1.5, 1.0, 0.46, "brand"),
  box(1.52, 0.12, 0.48, "brand2", [0, 0.12, 0]),
  box(0.08, 0.26, 0.12, "ink", [-0.26, 0.62, 0]),
  box(0.08, 0.26, 0.12, "ink", [0.26, 0.62, 0]),
  box(0.6, 0.08, 0.12, "ink", [0, 0.75, 0]),
  box(0.16, 0.12, 0.04, "amber", [0, 0.12, 0.26]),
];

const books = (): Part[] => [
  box(1.3, 0.24, 0.9, "violet", [0, 0, 0], [0, 0.08, 0]),
  box(1.22, 0.24, 0.84, "amber", [0.04, 0.25, 0.02], [0, -0.18, 0]),
  box(1.12, 0.22, 0.8, "brand", [-0.03, 0.49, 0], [0, 0.3, 0]),
  box(1.0, 0.03, 0.72, "paper", [-0.03, 0.615, 0], [0, 0.3, 0]),
];

const gradCap = (): Part[] => [
  prism(10, 0.42, 0.32, "ink", [0, -0.2, 0]),
  box(1.3, 0.06, 1.3, "ink", [0, 0, 0], [0, Math.PI / 4, 0]),
  box(0.04, 0.4, 0.04, "amber", [0.58, -0.2, 0]),
  box(0.1, 0.1, 0.1, "amber", [0.58, -0.42, 0]),
];

const MODELS: Model[] = [
  { parts: laptop(), position: [-0.2, -0.15, 0.4], scale: 1.05, rotation: [0.3, -0.5, 0], spin: 0.12, bob: 0 },
  { parts: briefcase(), position: [1.55, 0.95, -0.6], scale: 0.7, rotation: [0.2, 0.6, 0.1], spin: -0.18, bob: 1.4 },
  { parts: books(), position: [-1.6, 1.05, -0.4], scale: 0.7, rotation: [0.35, 0.4, -0.08], spin: 0.15, bob: 2.6 },
  { parts: gradCap(), position: [1.35, -1.25, 0.2], scale: 0.72, rotation: [0.45, 0.2, 0.15], spin: 0.22, bob: 3.8 },
  { parts: [icosahedron(0.5, "brand2")], position: [-1.45, -1.2, 0.6], scale: 0.75, rotation: [0.3, 0, 0.2], spin: 0.4, bob: 5 },
];

const LIGHT = normalize([-0.45, 0.85, 0.6]);
const ORBIT_DOTS = 90;
const STARS: Vec3[] = Array.from({ length: 60 }, (_, i) => {
  // Deterministic scatter so server and client agree and every visit looks the same.
  const a = i * 2.399963;
  const r = 2.4 + ((i * 37) % 11) / 10;
  return [Math.cos(a) * r, (((i * 53) % 21) - 10) / 4.5, Math.sin(a) * r * 0.6];
});

function hexToRgb(hex: string): Rgb {
  const h = hex.trim().replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return Number.isNaN(n) ? [37, 99, 235] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export function HeroModels({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0, height = 0;

    // Palette follows the site's CSS variables, so dark mode just works.
    let palette = {} as Record<ColorKey, Rgb>;
    let background: Rgb = [255, 255, 255];
    const readColors = () => {
      const css = getComputedStyle(document.documentElement);
      const v = (name: string, fallback: string) => hexToRgb(css.getPropertyValue(name) || fallback);
      background = v("--background", "#ffffff");
      const foreground = v("--foreground", "#0f172a");
      const dark = document.documentElement.classList.contains("dark");
      palette = {
        brand: v("--brand", "#2563eb"),
        brand2: v("--brand-2", "#0ea5e9"),
        violet: [139, 92, 246],
        amber: [245, 158, 11],
        ink: mix(foreground, background, dark ? 0.35 : 0.12),
        paper: dark ? [203, 213, 225] : [241, 245, 249],
      };
    };
    readColors();
    const themeObserver = new MutationObserver(() => {
      readColors();
      if (reduceMotion) draw(0);
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (reduceMotion) draw(0);
    });
    resizeObserver.observe(canvas);

    // Pointer parallax, eased.
    let tiltX = 0, tiltY = 0, targetX = 0, targetY = 0;
    const onPointer = (e: PointerEvent) => {
      targetY = (e.clientX / window.innerWidth - 0.5) * 0.5;
      targetX = (e.clientY / window.innerHeight - 0.5) * 0.25;
    };
    if (!reduceMotion) window.addEventListener("pointermove", onPointer, { passive: true });

    function draw(now: number) {
      if (!ctx) return;
      const t = now / 1000;
      ctx.clearRect(0, 0, width, height);
      tiltX += (targetX - tiltX) * 0.06;
      tiltY += (targetY - tiltY) * 0.06;

      const unit = Math.min(width, height) / 5.4;
      const cx = width / 2;
      const cy = height / 2;
      const focal = 9;
      const sceneRot: Vec3 = [0.12 + tiltX, Math.sin(t * 0.25) * 0.3 + tiltY, 0];
      const project = ([x, y, z]: Vec3): [number, number, number] => {
        const s = focal / (focal - z);
        return [cx + x * unit * s, cy - y * unit * s, s];
      };

      // Distant particles.
      for (const star of STARS) {
        const p = rotate(star, [sceneRot[0], sceneRot[1] + t * 0.05, 0]);
        const [x, y, s] = project(p);
        ctx.fillStyle = `rgba(${palette.brand.join(",")},${0.12 + 0.25 * (s - 0.75)})`;
        ctx.beginPath();
        ctx.arc(x, y, 1.4 * s, 0, Math.PI * 2);
        ctx.fill();
      }

      // Dotted orbit behind and in front of the models.
      const orbit: { x: number; y: number; z: number; s: number }[] = [];
      for (let i = 0; i < ORBIT_DOTS; i++) {
        const a = (i / ORBIT_DOTS) * Math.PI * 2 + t * 0.15;
        const p = rotate([Math.cos(a) * 2.35, 0, Math.sin(a) * 2.35], [sceneRot[0] + 0.32, sceneRot[1], -0.18]);
        const [x, y, s] = project(p);
        orbit.push({ x, y, z: p[2], s });
      }
      const drawOrbit = (front: boolean) => {
        for (const d of orbit) {
          if (d.z >= 0 !== front) continue;
          ctx.fillStyle = `rgba(${palette.brand2.join(",")},${front ? 0.55 : 0.2})`;
          ctx.beginPath();
          ctx.arc(d.x, d.y, 1.6 * d.s, 0, Math.PI * 2);
          ctx.fill();
        }
      };
      drawOrbit(false);

      // Collect every visible face, then paint back to front.
      const faces: { pts: [number, number][]; z: number; color: string }[] = [];
      for (const model of MODELS) {
        const ownRot: Vec3 = [model.rotation[0], model.rotation[1] + t * model.spin, model.rotation[2]];
        const lift = Math.sin(t * 1.1 + model.bob) * 0.08;
        for (const p of model.parts) {
          const world = p.verts.map((v) =>
            rotate(add(rotate(v.map((c) => c * model.scale) as Vec3, ownRot), add(model.position, [0, lift, 0])), sceneRot),
          );
          for (const face of p.faces) {
            const vs = face.map((i) => world[i]);
            const normal = normalize(cross(sub(vs[1], vs[0]), sub(vs[2], vs[0])));
            const center = centroid(vs);
            if (dot(normal, sub([0, 0, focal], center)) <= 0) continue; // back face
            const light = Math.max(0, dot(normal, LIGHT));
            const rim = Math.pow(1 - Math.abs(normal[2]), 3) * 0.15;
            const shade = mix(mix(palette[p.color], [0, 0, 0], 0.45 - light * 0.45), [255, 255, 255], rim + light * 0.12);
            faces.push({
              pts: vs.map((v) => {
                const [x, y] = project(v);
                return [x, y];
              }),
              z: center[2],
              color: `rgb(${shade.map(Math.round).join(",")})`,
            });
          }
        }
      }
      faces.sort((a, b) => a.z - b.z);
      ctx.lineJoin = "round";
      ctx.lineWidth = 0.75;
      for (const f of faces) {
        ctx.beginPath();
        f.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.closePath();
        ctx.fillStyle = f.color;
        ctx.strokeStyle = f.color; // hides hairline seams between faces
        ctx.fill();
        ctx.stroke();
      }

      drawOrbit(true);
    }

    let frame = 0;
    let running = false;
    const loop = (now: number) => {
      draw(now);
      frame = requestAnimationFrame(loop);
    };
    const start = () => {
      if (running || reduceMotion) return;
      running = true;
      frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    let visible = true;
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !document.hidden) start();
      else stop();
    });
    intersection.observe(canvas);
    const onVisibility = () => (document.hidden || !visible ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);

    if (reduceMotion) draw(0);
    else start();

    return () => {
      stop();
      intersection.disconnect();
      resizeObserver.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointer);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className={className} />;
}
