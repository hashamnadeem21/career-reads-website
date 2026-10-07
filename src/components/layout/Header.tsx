import { Search } from "lucide-react";
import Link from "next/link";
import { categoryList } from "@/lib/categories";
import { ensureSiteData } from "@/lib/site-data";
import { siteConfig } from "@/lib/site";
import { Logo } from "./Logo";
import { MobileNav } from "./MobileNav";
import { NavLinks } from "./NavLinks";
import { ThemeToggle } from "./ThemeToggle";

export async function Header() {
  await ensureSiteData();
  const categoryLinks = categoryList.map((c) => ({ href: `/category/${c.slug}`, label: c.name }));

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Main" className="hidden lg:block">
          <NavLinks items={siteConfig.nav} />
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/search"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-background px-3 text-sm text-muted transition-colors hover:border-brand hover:text-foreground sm:pr-4"
            aria-label="Search articles"
          >
            <Search className="h-[18px] w-[18px]" aria-hidden />
            <span className="hidden sm:inline">Search</span>
          </Link>
          <ThemeToggle />
          <MobileNav items={siteConfig.nav} categories={categoryLinks} />
        </div>
      </div>
    </header>
  );
}
