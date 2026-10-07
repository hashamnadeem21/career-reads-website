import { Rss } from "lucide-react";
import Link from "next/link";
import { categoryList } from "@/lib/categories";
import { ensureSiteData } from "@/lib/site-data";
import { siteConfig } from "@/lib/site";
import { Logo } from "./Logo";

function FooterColumn({ title, links }: { title: string; links: readonly { href: string; label: string }[] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm text-muted transition-colors hover:text-link">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function Footer() {
  await ensureSiteData();
  const year = new Date().getFullYear();
  const categoryLinks = categoryList.map((c) => ({ href: `/category/${c.slug}`, label: c.name }));

  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <div className="container-page grid gap-12 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-muted">{siteConfig.description}</p>
          <Link
            href="/rss.xml"
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-link hover:underline"
          >
            <Rss className="h-4 w-4" aria-hidden /> Subscribe via RSS
          </Link>
        </div>
        <FooterColumn title="Jobs" links={siteConfig.footer.jobs} />
        <FooterColumn title="Read" links={categoryLinks} />
                <FooterColumn title="Career Reads" links={siteConfig.footer.company} />
        <FooterColumn title="Legal" links={siteConfig.footer.legal} />
      </div>
      <div className="border-t border-border">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteConfig.name}. All rights reserved.
          </p>
          <p>Never pay to apply for a job. Advertising is always labeled.</p>
        </div>
      </div>
    </footer>
  );
}
