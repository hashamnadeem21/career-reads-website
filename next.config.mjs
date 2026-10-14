// Plain JavaScript (not next.config.ts) on purpose: hosts with an old glibc can't load Next's
// native compiler, and the WebAssembly fallback can't compile a TypeScript config.

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  // Blocks <base> hijacking, forms posting to other sites, old plugins and being framed by other
  // sites. Scripts aren't restricted here, so ads and analytics keep working.
  {
    key: "Content-Security-Policy",
    value: "base-uri 'self'; form-action 'self'; object-src 'none'; frame-ancestors 'self'",
  },
];

/** @type {import("next").NextConfig} */
const nextConfig = {
  // Lets test builds use their own folder (e.g. the admin e2e suite) without touching .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    // Job applications carry a CV (the form allows 4 MB; Vercel refuses function requests over 4.5 MB).
    serverActions: { bodySizeLimit: "4.5mb" },
  },
  // MDX files are read from disk at build/revalidation time, make sure they
  // are traced into the serverless bundle on Vercel.
  outputFileTracingIncludes: {
    "/**": ["./content/**/*"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Add your CDN / CMS image hosts here when you move away from local images.
    // Images uploaded in the admin panel are stored on the API server (older ones on Vercel Blob).
    remotePatterns: [
      { protocol: "https", hostname: "api.careersreads.com", pathname: "/uploads/**" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
  async redirects() {
    // Avoid duplicate URLs: page 1 of any paginated listing lives at the base URL.
    return [
      // One canonical host: careersreads.com → www (the API only refreshes the www cache after edits).
      {
        source: "/:path*",
        has: [{ type: "host", value: "careersreads.com" }],
        destination: "https://www.careersreads.com/:path*",
        permanent: true,
      },
      { source: "/blog/page/1", destination: "/blog", permanent: true },
      { source: "/category/:category/page/1", destination: "/category/:category", permanent: true },
      { source: "/feed", destination: "/rss.xml", permanent: true },
      { source: "/feed.xml", destination: "/rss.xml", permanent: true },
    ];
  },
};

export default nextConfig;
