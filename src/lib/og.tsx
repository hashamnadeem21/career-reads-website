import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };

/** Branded Open Graph card shared by the site and article routes. */
export function renderOgImage({ title, eyebrow, footer }: { title: string; eyebrow: string; footer: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(135deg, #0F172A 0%, #172554 55%, #1D4ED8 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* The Career Reads mark: briefcase (jobs) with an open, bookmarked book (articles). */}
          <svg width="72" height="72" viewBox="0 0 64 64">
            <defs>
              <linearGradient id="og-mark" x1="6" y1="4" x2="58" y2="62" gradientUnits="userSpaceOnUse">
                <stop stopColor="#2563EB" />
                <stop offset="1" stopColor="#0EA5E9" />
              </linearGradient>
            </defs>
            <rect width="64" height="64" rx="16" fill="url(#og-mark)" />
            <path d="M24.5 21.5v-2.6a3.4 3.4 0 0 1 3.4-3.4h8.2a3.4 3.4 0 0 1 3.4 3.4v2.6" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" />
            <rect x="10" y="21" width="44" height="30" rx="7" fill="#fff" />
            <path d="M32 45.2c-4.3-2.6-9-3.5-14.2-2.9V29.2c5.2-.6 9.9.3 14.2 2.9z" fill="#2563EB" />
            <path d="M32 45.2c4.3-2.6 9-3.5 14.2-2.9V29.2c-5.2-.6-9.9.3-14.2 2.9z" fill="#0EA5E9" />
            <path d="M30.4 32.3v9.6l1.6-1.2 1.6 1.2v-9.6z" fill="#F59E0B" />
          </svg>
          <div style={{ fontSize: 40, fontWeight: 800, display: "flex", gap: 12 }}>
            Career<span style={{ color: "#7DD3FC" }}>Reads</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 26, letterSpacing: 4, textTransform: "uppercase", color: "#93C5FD", display: "flex" }}>
            {eyebrow}
          </div>
          <div style={{ fontSize: title.length > 70 ? 54 : 64, fontWeight: 700, lineHeight: 1.1, display: "flex" }}>
            {title}
          </div>
        </div>
        <div style={{ fontSize: 24, color: "#CBD5E1", display: "flex" }}>{footer}</div>
      </div>
    ),
    ogSize,
  );
}
