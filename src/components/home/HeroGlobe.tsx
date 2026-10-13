"use client";

import { useEffect, useRef } from "react";

/**
 * A 3D dotted globe on a 2D canvas (no WebGL library). Pins sit at real city
 * coordinates, arcs travel between them, and a satellite circles on a tilted
 * orbit. The globe turns slowly, leans toward the pointer, pauses when
 * off-screen or in a background tab, and renders a single still frame for
 * visitors who prefer reduced motion.
 */

type Vec3 = [number, number, number];
type Rgb = [number, number, number];

const DOTS = 900;

/** [name, latitude, longitude] */
const CITIES: [string, number, number][] = [
  ["Lahore", 31.55, 74.34],
  ["Karachi", 24.86, 67.0],
  ["Islamabad", 33.68, 73.05],
  ["Dubai", 25.2, 55.27],
  ["London", 51.51, -0.13],
  ["Berlin", 52.52, 13.4],
  ["New York", 40.71, -74.0],
  ["Toronto", 43.65, -79.38],
  ["Singapore", 1.35, 103.82],
  ["Sydney", -33.87, 151.21],
  ["Riyadh", 24.71, 46.68],
];

/** Index pairs into CITIES: the home cities connect out to the world. */
const ROUTES: [number, number][] = [
  [0, 4], [1, 3], [2, 5], [0, 6], [1, 8], [2, 10], [0, 7], [1, 9], [3, 4], [5, 6],
];

function fromLatLon(lat: number, lon: number): Vec3 {
  const la = (lat * Math.PI) / 180;
  const lo = (lon * Math.PI) / 180;
  return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)];
}

function fibonacciSphere(n: number): Vec3[] {
  const points: Vec3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    points.push([Math.cos(golden * i) * r, y, Math.sin(golden * i) * r]);
  }
  return points;
}

/** Rotate around Y (spin), then X (tilt). */
function rotate([x, y, z]: Vec3, ry: number, rx: number): Vec3 {
  const cy = Math.cos(ry), sy = Math.sin(ry);
  const x1 = x * cy + z * sy;
  const z1 = -x * sy + z * cy;
  const cx = Math.cos(rx), sx = Math.sin(rx);
  return [x1, y * cx - z1 * sx, y * sx + z1 * cx];
}

/** Great-circle point between two unit vectors, lifted off the surface mid-way. */
function arcPoint(a: Vec3, b: Vec3, t: number): Vec3 {
  const d = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const omega = Math.acos(d);
  const so = Math.sin(omega) || 1;
  const k1 = Math.sin((1 - t) * omega) / so;
  const k2 = Math.sin(t * omega) / so;
  const lift = 1 + 0.12 * omega * Math.sin(Math.PI * t);
  return [(a[0] * k1 + b[0] * k2) * lift, (a[1] * k1 + b[1] * k2) * lift, (a[2] * k1 + b[2] * k2) * lift];
}

function hexToRgb(hex: string): Rgb {
  const h = hex.trim().replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return Number.isNaN(n) ? [37, 99, 235] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function HeroGlobe({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dots = fibonacciSphere(DOTS);
    const cities = CITIES.map(([, lat, lon]) => fromLatLon(lat, lon));
    let width = 0, height = 0;

    // Colours follow the site's CSS variables, so dark mode just works.
    let brand: Rgb = [37, 99, 235];
    let brand2: Rgb = [14, 165, 233];
    let ink: Rgb = [15, 23, 42];
    const readColors = () => {
      const css = getComputedStyle(document.documentElement);
      brand = hexToRgb(css.getPropertyValue("--brand") || "#2563eb");
      brand2 = hexToRgb(css.getPropertyValue("--brand-2") || "#0ea5e9");
      ink = hexToRgb(css.getPropertyValue("--foreground") || "#0f172a");
    };
    readColors();
    const rgba = ([r, g, b]: Rgb, a: number) => `rgba(${r},${g},${b},${a})`;

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

    // Pointer parallax, eased.
    let tiltX = 0, tiltY = 0, targetX = 0, targetY = 0;
    const onPointer = (e: PointerEvent) => {
      targetY = (e.clientX / window.innerWidth - 0.5) * 0.5;
      targetX = (e.clientY / window.innerHeight - 0.5) * 0.3;
    };
    if (!reduceMotion) window.addEventListener("pointermove", onPointer, { passive: true });

    // Start with South Asia facing the viewer.
    const startSpin = -(70 * Math.PI) / 180;

    function draw(now: number) {
      if (!ctx) return;
      const t = now / 1000;
      ctx.clearRect(0, 0, width, height);
      tiltX += (targetX - tiltX) * 0.05;
      tiltY += (targetY - tiltY) * 0.05;

      const R = Math.min(width, height) * 0.36;
      const cx = width / 2;
      const cy = height / 2;
      const focal = 4;
      const spin = startSpin + t * 0.12 + tiltY;
      const tilt = 0.32 + tiltX;
      const project = (p: Vec3): [number, number, number] => {
        const s = focal / (focal - p[2]);
        return [cx + p[0] * R * s, cy - p[1] * R * s, s];
      };

      // Atmosphere glow and the globe's body.
      const glow = ctx.createRadialGradient(cx, cy, R * 0.85, cx, cy, R * 1.35);
      glow.addColorStop(0, rgba(brand2, 0.22));
      glow.addColorStop(1, rgba(brand2, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.35, 0, Math.PI * 2);
      ctx.fill();

      const body = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R * 1.02);
      body.addColorStop(0, rgba(brand2, 0.16));
      body.addColorStop(1, rgba(brand, 0.04));
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.02, 0, Math.PI * 2);
      ctx.fill();

      // Latitude and longitude lines, front halves only.
      ctx.lineWidth = 1;
      const ring = (point: (a: number) => Vec3) => {
        ctx.beginPath();
        let pen = false;
        for (let i = 0; i <= 96; i++) {
          const p = rotate(point((i / 96) * Math.PI * 2), spin, tilt);
          const [x, y] = project(p);
          if (p[2] > 0) {
            if (pen) ctx.lineTo(x, y);
            else ctx.moveTo(x, y);
            pen = true;
          } else pen = false;
        }
        ctx.stroke();
      };
      ctx.strokeStyle = rgba(brand, 0.12);
      for (const lat of [-60, -30, 0, 30, 60]) {
        const la = (lat * Math.PI) / 180;
        ring((a) => [Math.cos(la) * Math.sin(a), Math.sin(la), Math.cos(la) * Math.cos(a)]);
      }
      for (let m = 0; m < 6; m++) {
        const lo = (m / 6) * Math.PI;
        ring((a) => [Math.cos(a) * Math.sin(lo), Math.sin(a), Math.cos(a) * Math.cos(lo)]);
      }

      // Surface dots, brighter and bigger toward the viewer.
      for (const d of dots) {
        const p = rotate(d, spin, tilt);
        const [x, y, s] = project(p);
        if (p[2] < -0.1) {
          ctx.fillStyle = rgba(ink, 0.05);
          ctx.fillRect(x - 0.6, y - 0.6, 1.2, 1.2);
          continue;
        }
        const depth = (p[2] + 1) / 2;
        ctx.fillStyle = rgba(depth > 0.75 ? brand2 : brand, 0.18 + depth * 0.55);
        ctx.beginPath();
        ctx.arc(x, y, (0.7 + depth * 1.1) * s, 0, Math.PI * 2);
        ctx.fill();
      }

      // Arcs: each route draws in, holds, then fades, staggered.
      ROUTES.forEach(([from, to], i) => {
        const cycle = 5.5;
        const local = reduceMotion ? 0.75 : ((t + i * 0.9) % cycle) / cycle;
        const head = Math.min(1, local / 0.45);
        const fade = local > 0.75 ? 1 - (local - 0.75) / 0.25 : 1;
        const steps = 40;
        let prev: [number, number, number, number] | null = null;
        for (let k = 0; k <= steps * head; k++) {
          const p = rotate(arcPoint(cities[from], cities[to], k / steps), spin, tilt);
          const [x, y] = project(p);
          if (prev && p[2] > -0.15 && prev[2] > -0.15) {
            ctx.strokeStyle = rgba(k / steps > head - 0.08 ? brand2 : brand, 0.75 * fade);
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(prev[0], prev[1]);
            ctx.lineTo(x, y);
            ctx.stroke();
          }
          prev = [x, y, 0, p[2]];
        }
        if (prev && head < 1 && prev[3] > 0) {
          ctx.fillStyle = rgba(brand2, 0.95);
          ctx.beginPath();
          ctx.arc(prev[0], prev[1], 2.6, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // City pins with a pulsing halo.
      cities.forEach((c, i) => {
        const p = rotate(c, spin, tilt);
        if (p[2] < 0.05) return;
        const [x, y, s] = project(p);
        const pulse = reduceMotion ? 0.5 : (t * 0.8 + i * 0.37) % 1;
        ctx.strokeStyle = rgba(brand2, 0.6 * (1 - pulse));
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(x, y, (3 + pulse * 10) * s, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = i < 3 ? "#f59e0b" : rgba(brand, 1);
        ctx.beginPath();
        ctx.arc(x, y, 3.2 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.beginPath();
        ctx.arc(x, y, 1.2 * s, 0, Math.PI * 2);
        ctx.fill();
      });

      // Tilted orbit with a satellite; the far half is drawn faint.
      const orbitR = 1.32;
      const orbitTilt = 1.15;
      ctx.lineWidth = 1;
      for (let i = 0; i < 120; i++) {
        const a = (i / 120) * Math.PI * 2;
        const p = rotate(rotate([Math.cos(a) * orbitR, 0, Math.sin(a) * orbitR], 0, orbitTilt), 0.5 + tiltY, tilt - 0.9);
        const [x, y] = project(p);
        ctx.fillStyle = rgba(brand, p[2] > 0 ? 0.45 : 0.12);
        ctx.fillRect(x - 0.8, y - 0.8, 1.6, 1.6);
      }
      const sa = t * 0.5;
      const sat = rotate(rotate([Math.cos(sa) * orbitR, 0, Math.sin(sa) * orbitR], 0, orbitTilt), 0.5 + tiltY, tilt - 0.9);
      const [sx, sy, ss] = project(sat);
      ctx.fillStyle = rgba(brand2, sat[2] > 0 ? 1 : 0.3);
      ctx.beginPath();
      ctx.arc(sx, sy, 4 * ss, 0, Math.PI * 2);
      ctx.fill();
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

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (reduceMotion) draw(0);
    });
    resizeObserver.observe(canvas);
    const themeObserver = new MutationObserver(() => {
      readColors();
      if (reduceMotion) draw(0);
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

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
