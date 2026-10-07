"use client";

import { useEffect, useRef } from "react";

/**
 * Lightweight 3D scene drawn on a 2D canvas (no WebGL library):
 *   1. a rotating globe made of dots with meridian rings,
 *   2. wireframe cubes orbiting the globe on a tilted path,
 *   3. glowing arcs that travel between points on the globe ("connections").
 * Follows the pointer slightly, pauses when off-screen or in a background tab,
 * and renders a single still frame for visitors who prefer reduced motion.
 */

type Vec3 = [number, number, number];

const DOTS = 520;
const ARCS = 5;
const CUBES = 3;

function fibonacciSphere(n: number): Vec3[] {
  const points: Vec3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    points.push([Math.cos(theta) * r, y, Math.sin(theta) * r]);
  }
  return points;
}

function rotate([x, y, z]: Vec3, rx: number, ry: number): Vec3 {
  // Y axis, then X axis.
  const cy = Math.cos(ry), sy = Math.sin(ry);
  const x1 = x * cy + z * sy;
  const z1 = -x * sy + z * cy;
  const cx = Math.cos(rx), sx = Math.sin(rx);
  return [x1, y * cx - z1 * sx, y * sx + z1 * cx];
}

/** Spherical interpolation between two unit vectors, lifted off the surface mid-way. */
function arcPoint(a: Vec3, b: Vec3, t: number): Vec3 {
  const dot = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const omega = Math.acos(dot);
  const so = Math.sin(omega) || 1;
  const k1 = Math.sin((1 - t) * omega) / so;
  const k2 = Math.sin(t * omega) / so;
  const lift = 1 + 0.28 * Math.sin(Math.PI * t);
  return [(a[0] * k1 + b[0] * k2) * lift, (a[1] * k1 + b[1] * k2) * lift, (a[2] * k1 + b[2] * k2) * lift];
}

const CUBE_VERTS: Vec3[] = [
  [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
  [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
];
const CUBE_EDGES = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
const CUBE_FACES = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [2, 3, 7, 6], [1, 2, 6, 5], [0, 3, 7, 4]];

interface Arc {
  from: Vec3;
  to: Vec3;
  start: number;
  duration: number;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.trim().replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return Number.isNaN(n) ? [37, 99, 235] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function HeroScene({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dots = fibonacciSphere(DOTS);
    let width = 0, height = 0, dpr = 1;

    // Theme colours come from the site's CSS variables, so dark mode just works.
    let brand: [number, number, number] = [37, 99, 235];
    let brand2: [number, number, number] = [14, 165, 233];
    let ink: [number, number, number] = [15, 23, 42];
    const readColors = () => {
      const css = getComputedStyle(document.documentElement);
      brand = hexToRgb(css.getPropertyValue("--brand") || "#2563eb");
      brand2 = hexToRgb(css.getPropertyValue("--brand-2") || "#0ea5e9");
      ink = hexToRgb(css.getPropertyValue("--foreground") || "#0f172a");
    };
    readColors();
    const themeObserver = new MutationObserver(readColors);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const rgba = ([r, g, b]: [number, number, number], a: number) => `rgba(${r},${g},${b},${a})`;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (reduceMotion) draw(4000);
    });
    resizeObserver.observe(canvas);

    // Pointer parallax.
    let tiltX = 0, tiltY = 0, targetX = 0, targetY = 0;
    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetY = ((e.clientX - rect.left) / rect.width - 0.5) * 0.6;
      targetX = ((e.clientY - rect.top) / rect.height - 0.5) * 0.4;
    };
    if (!reduceMotion) window.addEventListener("pointermove", onPointer, { passive: true });

    const randomDot = () => dots[Math.floor(Math.random() * dots.length)];
    const newArc = (now: number): Arc => {
      const from = randomDot();
      let to = randomDot();
      // Prefer medium-length arcs: not neighbours, not antipodes.
      for (let i = 0; i < 8; i++) {
        const d = from[0] * to[0] + from[1] * to[1] + from[2] * to[2];
        if (d < 0.6 && d > -0.5) break;
        to = randomDot();
      }
      return { from, to, start: now + Math.random() * 1200, duration: 1600 + Math.random() * 1200 };
    };
    const arcs: Arc[] = Array.from({ length: ARCS }, (_, i) => ({ ...newArc(0), start: -i * 500 }));

    function draw(now: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      tiltX += (targetX - tiltX) * 0.05;
      tiltY += (targetY - tiltY) * 0.05;

      const size = Math.min(width, height);
      const R = size * 0.26;
      const cx = width / 2;
      const cy = height / 2;
      const focal = R * 6;
      const rx = 0.42 + tiltX;
      const ry = now * 0.00018 + tiltY;

      const project = (p: Vec3, scale = R): [number, number, number, number] => {
        const z = p[2] * scale;
        const k = focal / (focal + z);
        return [cx + p[0] * scale * k, cy + p[1] * scale * k, z, k];
      };

      // Soft glow behind the globe.
      const glow = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.9);
      glow.addColorStop(0, rgba(brand, 0.22));
      glow.addColorStop(0.55, rgba(brand2, 0.08));
      glow.addColorStop(1, rgba(brand2, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      // --- 2. Orbiting cubes (computed first so the far ones draw behind the globe).
      const orbitTilt = 1.15;
      const orbitR = 1.55;
      const cubes = Array.from({ length: CUBES }, (_, i) => {
        const angle = now * 0.00035 + (i * Math.PI * 2) / CUBES;
        const center = rotate([Math.cos(angle) * orbitR, 0, Math.sin(angle) * orbitR], orbitTilt + tiltX * 0.5, 0.5 + tiltY);
        const spin = now * 0.0012 + i;
        const s = 0.13 + i * 0.025;
        const verts = CUBE_VERTS.map((v) => {
          const r = rotate([v[0] * s, v[1] * s, v[2] * s], spin, spin * 0.7);
          return project([center[0] + r[0], center[1] + r[1], center[2] + r[2]]);
        });
        return { z: center[2], verts, color: i % 2 ? brand2 : brand };
      });

      const drawOrbit = (front: boolean) => {
        ctx.beginPath();
        for (let i = 0; i <= 96; i++) {
          const a = (i / 96) * Math.PI * 2;
          const p = rotate([Math.cos(a) * orbitR, 0, Math.sin(a) * orbitR], orbitTilt + tiltX * 0.5, 0.5 + tiltY);
          const [x, y, z] = project(p);
          if ((z < 0) !== front) {
            ctx.moveTo(x, y);
            continue;
          }
          ctx.lineTo(x, y);
        }
        ctx.setLineDash([4, 6]);
        ctx.strokeStyle = rgba(brand, front ? 0.35 : 0.15);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
      };

      const drawCube = (cube: (typeof cubes)[number]) => {
        const depth = cube.z < 0 ? 1 : 0.45;
        for (const face of CUBE_FACES) {
          ctx.beginPath();
          face.forEach((vi, j) => (j ? ctx.lineTo(cube.verts[vi][0], cube.verts[vi][1]) : ctx.moveTo(cube.verts[vi][0], cube.verts[vi][1])));
          ctx.closePath();
          ctx.fillStyle = rgba(cube.color, 0.06 * depth);
          ctx.fill();
        }
        ctx.beginPath();
        for (const [a, b] of CUBE_EDGES) {
          ctx.moveTo(cube.verts[a][0], cube.verts[a][1]);
          ctx.lineTo(cube.verts[b][0], cube.verts[b][1]);
        }
        ctx.strokeStyle = rgba(cube.color, 0.85 * depth);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      };

      drawOrbit(false);
      cubes.filter((c) => c.z >= 0).forEach(drawCube);

      // --- 1. Globe: meridian rings + dots, faded with depth.
      for (let m = 0; m < 4; m++) {
        const offset = (m / 4) * Math.PI;
        ctx.beginPath();
        for (let i = 0; i <= 72; i++) {
          const a = (i / 72) * Math.PI * 2;
          const p = rotate(rotate([Math.cos(a), Math.sin(a), 0], 0, offset), rx, ry);
          const [x, y] = project(p);
          if (i) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
        }
        ctx.strokeStyle = rgba(brand, 0.1);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.beginPath();
      for (let i = 0; i <= 72; i++) {
        const a = (i / 72) * Math.PI * 2;
        const [x, y] = project(rotate([Math.cos(a), 0, Math.sin(a)], rx, ry));
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.strokeStyle = rgba(brand2, 0.22);
      ctx.stroke();

      for (const d of dots) {
        const [x, y, z, k] = project(rotate(d, rx, ry));
        const front = 1 - (z / R + 1) / 2; // 1 = nearest, 0 = farthest
        ctx.beginPath();
        ctx.arc(x, y, (0.6 + front * 1.5) * k, 0, Math.PI * 2);
        ctx.fillStyle = front > 0.5 ? rgba(brand, 0.25 + front * 0.65) : rgba(ink, 0.08 + front * 0.2);
        ctx.fill();
      }

      // --- 3. Travelling arcs.
      for (let i = 0; i < arcs.length; i++) {
        const arc = arcs[i];
        const t = (now - arc.start) / arc.duration;
        if (t < 0) continue;
        if (t > 1.6) {
          arcs[i] = newArc(now);
          continue;
        }
        const head = Math.min(t, 1);
        const tail = Math.max(0, t - 0.6);
        const fade = t > 1 ? 1 - (t - 1) / 0.6 : 1;
        const steps = 28;
        let prev: [number, number, number, number] | null = null;
        for (let s = 0; s <= steps; s++) {
          const u = tail + ((head - tail) * s) / steps;
          const pt = project(rotate(arcPoint(arc.from, arc.to, u), rx, ry));
          if (prev) {
            const behind = (prev[2] + pt[2]) / 2 > R * 0.15;
            ctx.beginPath();
            ctx.moveTo(prev[0], prev[1]);
            ctx.lineTo(pt[0], pt[1]);
            ctx.strokeStyle = rgba(s % 2 ? brand2 : brand, (behind ? 0.18 : 0.85) * fade * (s / steps));
            ctx.lineWidth = 2;
            ctx.stroke();
          }
          prev = pt;
        }
        // Glowing head + landing pulse.
        if (prev && t <= 1) {
          ctx.beginPath();
          ctx.arc(prev[0], prev[1], 3.2, 0, Math.PI * 2);
          ctx.fillStyle = rgba(brand2, 0.95);
          ctx.shadowColor = rgba(brand2, 0.9);
          ctx.shadowBlur = 12;
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (t > 1) {
          const [x, y, z] = project(rotate(arc.to, rx, ry));
          if (z < R * 0.15) {
            ctx.beginPath();
            ctx.arc(x, y, 3 + (t - 1) * 30, 0, Math.PI * 2);
            ctx.strokeStyle = rgba(brand2, fade * 0.8);
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }
      }

      cubes.filter((c) => c.z < 0).forEach(drawCube);
      drawOrbit(true);
    }

    if (reduceMotion) {
      draw(4000);
      return () => {
        resizeObserver.disconnect();
        themeObserver.disconnect();
      };
    }

    let frame = 0;
    let visible = true;
    const loop = (now: number) => {
      draw(now);
      frame = requestAnimationFrame(loop);
    };
    const startStop = () => {
      cancelAnimationFrame(frame);
      if (visible && !document.hidden) frame = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      startStop();
    });
    io.observe(canvas);
    document.addEventListener("visibilitychange", startStop);

    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      resizeObserver.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", startStop);
      window.removeEventListener("pointermove", onPointer);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className={className} />;
}
