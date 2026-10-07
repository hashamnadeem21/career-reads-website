import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Providers } from "@/components/layout/Providers";
import { JsonLd } from "@/components/seo/JsonLd";
import { getAdsConfig } from "@/lib/ads";
import { serverEnv } from "@/lib/env";
import { organizationJsonLd, websiteJsonLd } from "@/lib/jsonld";
import { siteConfig } from "@/lib/site";
import { ensureSiteData } from "@/lib/site-data";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  await ensureSiteData();
  const env = serverEnv();
  const ads = getAdsConfig();

  return {
    metadataBase: new URL(siteConfig.url),
    title: { default: `${siteConfig.name} — ${siteConfig.tagline}`, template: `%s | ${siteConfig.name}` },
    description: siteConfig.description,
    applicationName: siteConfig.name,
    authors: [{ name: `${siteConfig.name} Editorial Team`, url: "/about" }],
    // Canonical URLs are set per page (see buildMetadata) — never inherited from here.
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      locale: siteConfig.locale,
    },
    twitter: { card: "summary_large_image" },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    },
    verification: {
      ...(env.GOOGLE_SITE_VERIFICATION && { google: env.GOOGLE_SITE_VERIFICATION }),
      ...(env.BING_SITE_VERIFICATION && { other: { "msvalidate.01": env.BING_SITE_VERIFICATION } }),
    },
    // Lets AdSense verify site ownership during review, even while ads are disabled.
    ...(ads.clientId && { other: { "google-adsense-account": ads.clientId } }),
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1222" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await ensureSiteData();
  const ads = getAdsConfig();

  return (
    <html lang={siteConfig.language} suppressHydrationWarning className={inter.variable}>
      <head>
        <link rel="alternate" type="application/rss+xml" title={`${siteConfig.name} RSS feed`} href="/rss.xml" />
        {/* Without JavaScript, scroll-reveal elements must never stay hidden. */}
        <noscript>
          <style>{`[style*="opacity:0"],[style*="opacity: 0"]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        {ads.enabled && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ads.clientId}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only z-[100] rounded-full bg-brand px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-3"
        >
          Skip to content
        </a>
        <Providers>
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
        </Providers>
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
