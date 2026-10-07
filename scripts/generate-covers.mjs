#!/usr/bin/env node
/**
 * Generates original, lightweight SVG cover art (the hero image) and in-article
 * images for every article that doesn't already have them. Art is deterministic
 * per file name and themed by category.
 *
 * In-article images are generated for `images` entries pointing at
 * /images/articles/<slug>-<n>.svg.
 *
 *   npm run covers           # only missing covers
 *   npm run covers -- --force  # regenerate all
 *
 * Prefer real photography or commissioned illustrations for flagship articles:
 * drop a .jpg/.webp in public/images/covers and point `coverImage` at it.
 */
import { readdir, readFile, writeFile, access, mkdir } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const ARTICLES = "content/articles";
const OUT = "public/images/covers";
const INLINE_OUT = "public/images/articles";
const force = process.argv.includes("--force");
const W = 1600;
const H = 900;

const palettes = {
  technology: ["#0EA5E9", "#6366F1", "#0F172A", "#38BDF8"],
  ai: ["#6366F1", "#8B5CF6", "#1E1B4B", "#C4B5FD"],
  lifestyle: ["#F43F5E", "#FB923C", "#4C0519", "#FDBA74"],
  productivity: ["#10B981", "#14B8A6", "#052E2B", "#6EE7B7"],
  travel: ["#F59E0B", "#F43F5E", "#431407", "#FCD34D"],
  "personal-development": ["#8B5CF6", "#D946EF", "#2E1065", "#F0ABFC"],
};

function rng(seedText) {
  let h = 2166136261;
  for (const c of seedText) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r = (rand, min, max) => min + rand() * (max - min);
const f = (n) => Math.round(n * 10) / 10;

function motif(category, rand, [a, b, , light]) {
  const parts = [];
  switch (category) {
    case "technology": {
      for (let i = 0; i < 9; i++) {
        const y = f(r(rand, 160, 760));
        const x1 = f(r(rand, 120, 700));
        const x2 = f(x1 + r(rand, 260, 700));
        const bend = f(y + r(rand, -120, 120));
        parts.push(
          `<path d="M${x1} ${y}H${f((x1 + x2) / 2)}L${f((x1 + x2) / 2 + 60)} ${bend}H${x2}" stroke="${light}" stroke-opacity=".55" stroke-width="3" fill="none"/>`,
          `<circle cx="${x2}" cy="${bend}" r="9" fill="${light}"/>`,
          `<circle cx="${x1}" cy="${y}" r="6" fill="#fff" fill-opacity=".8"/>`,
        );
      }
      parts.push(`<rect x="980" y="250" width="380" height="380" rx="48" fill="#fff" fill-opacity=".1" stroke="${light}" stroke-opacity=".6" stroke-width="3"/>`);
      parts.push(`<rect x="1080" y="350" width="180" height="180" rx="28" fill="url(#accent)"/>`);
      break;
    }
    case "ai": {
      const nodes = Array.from({ length: 16 }, () => [f(r(rand, 180, 1420)), f(r(rand, 140, 760))]);
      nodes.forEach(([x, y], i) => {
        const [x2, y2] = nodes[(i * 5 + 3) % nodes.length];
        const [x3, y3] = nodes[(i * 7 + 1) % nodes.length];
        parts.push(`<path d="M${x} ${y}L${x2} ${y2}M${x} ${y}L${x3} ${y3}" stroke="${light}" stroke-opacity=".35" stroke-width="2"/>`);
      });
      nodes.forEach(([x, y], i) =>
        parts.push(`<circle cx="${x}" cy="${y}" r="${i % 4 === 0 ? 22 : 10}" fill="${i % 4 === 0 ? "url(#accent)" : "#fff"}" fill-opacity="${i % 4 === 0 ? 1 : 0.85}"/>`),
      );
      break;
    }
    case "lifestyle": {
      parts.push(`<circle cx="${f(r(rand, 900, 1200))}" cy="380" r="170" fill="url(#accent)"/>`);
      for (let i = 0; i < 4; i++) {
        const y = 560 + i * 85;
        parts.push(`<path d="M0 ${y}C${f(r(rand, 200, 500))} ${y - 120} ${f(r(rand, 700, 1000))} ${y + 60} ${W} ${y - 40}V${H}H0Z" fill="${i % 2 ? a : b}" fill-opacity="${0.35 + i * 0.15}"/>`);
      }
      break;
    }
    case "productivity": {
      const cols = 7;
      for (let c = 0; c < cols; c++) {
        const blocks = 2 + Math.floor(rand() * 3);
        let y = 170;
        for (let k = 0; k < blocks; k++) {
          const h = f(r(rand, 70, 170));
          parts.push(`<rect x="${170 + c * 185}" y="${y}" width="160" height="${h}" rx="18" fill="${k % 2 ? light : "#fff"}" fill-opacity="${k % 2 ? 0.75 : 0.18}"/>`);
          y += h + 18;
        }
      }
      parts.push(`<circle cx="1330" cy="700" r="70" fill="url(#accent)"/><path d="M1298 702l22 22 44-48" stroke="#fff" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`);
      break;
    }
    case "travel": {
      parts.push(`<circle cx="1250" cy="230" r="90" fill="${light}" fill-opacity=".9"/>`);
      for (let i = 0; i < 3; i++) {
        const base = 620 + i * 90;
        let d = `M0 ${base}`;
        for (let x = 0; x <= W; x += 200) d += `L${x} ${f(base - r(rand, 60, 320 - i * 70))}`;
        parts.push(`<path d="${d}L${W} ${base}V${H}H0Z" fill="${i === 2 ? "#0F172A" : i ? b : a}" fill-opacity="${0.45 + i * 0.25}"/>`);
      }
      parts.push(`<path d="M260 900C420 760 520 820 700 700S1000 640 1120 560" stroke="#fff" stroke-width="6" stroke-dasharray="18 18" fill="none" stroke-opacity=".8"/>`);
      break;
    }
    default: {
      for (let i = 0; i < 6; i++) {
        parts.push(`<rect x="${220 + i * 190}" y="${700 - i * 95}" width="190" height="${f(95 + i * 95)}" rx="10" fill="${i === 5 ? "url(#accent)" : "#fff"}" fill-opacity="${i === 5 ? 1 : 0.12 + i * 0.08}"/>`);
      }
      parts.push(`<circle cx="1280" cy="190" r="34" fill="${light}"/>`);
    }
  }
  return parts.join("\n  ");
}

function coverSvg(seed, category, alt, variant = 0) {
  const rand = rng(seed);
  const base = palettes[category] ?? palettes.ai;
  // In-article variants swap the two accent colours so they don't look like copies of the cover.
  const pal = variant % 2 ? [base[1], base[0], base[2], base[3]] : base;
  const [a, b, dark] = pal;
  const blobs = Array.from({ length: 3 }, (_, i) =>
    `<circle cx="${f(r(rand, 0, W))}" cy="${f(r(rand, 0, H))}" r="${f(r(rand, 280, 520))}" fill="url(#glow${i % 2})"/>`,
  ).join("\n  ");
  const angle = Math.floor(r(rand, 20, 70));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${alt.replace(/"/g, "&quot;")}">
  <defs>
    <linearGradient id="bg" gradientTransform="rotate(${angle})">
      <stop offset="0" stop-color="${dark}"/>
      <stop offset="1" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${a}"/>
      <stop offset="1" stop-color="${b}"/>
    </linearGradient>
    <radialGradient id="glow0"><stop offset="0" stop-color="${a}" stop-opacity=".75"/><stop offset="1" stop-color="${a}" stop-opacity="0"/></radialGradient>
    <radialGradient id="glow1"><stop offset="0" stop-color="${b}" stop-opacity=".65"/><stop offset="1" stop-color="${b}" stop-opacity="0"/></radialGradient>
    <pattern id="dots" width="32" height="32" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.6" fill="#fff" fill-opacity=".09"/></pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${blobs}
  <rect width="${W}" height="${H}" fill="url(#dots)"/>
  ${motif(category, rand, pal)}
</svg>
`;
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

await mkdir(OUT, { recursive: true });
await mkdir(INLINE_OUT, { recursive: true });
const files = (await readdir(ARTICLES)).filter((f) => /\.mdx?$/.test(f));
let written = 0;
for (const file of files) {
  const slug = file.replace(/\.mdx?$/, "");
  const { data } = matter(await readFile(path.join(ARTICLES, file), "utf8"));
  const target = path.join(OUT, `${slug}.svg`);
  if (data.coverImage?.endsWith(`/images/covers/${slug}.svg`) && (force || !(await exists(target)))) {
    await writeFile(target, coverSvg(slug, data.category, data.coverAlt ?? data.title));
    written++;
    console.log(`✓ ${target}`);
  }

  for (const image of data.images ?? []) {
    const match = new RegExp(`^/images/articles/(${slug}-(\\d+))\\.svg$`).exec(image.src ?? "");
    if (!match) continue;
    const file = path.join(INLINE_OUT, `${match[1]}.svg`);
    if (!force && (await exists(file))) continue;
    await writeFile(file, coverSvg(match[1], data.category, image.alt, Number(match[2])));
    written++;
    console.log(`✓ ${file}`);
  }
}
console.log(`${written} image(s) generated.`);
