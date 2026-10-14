import type { Metadata } from "next";
import Link from "next/link";
import { CopyLinkButton } from "@/components/article/CopyLinkButton";
import { StaticPage } from "@/components/ui/StaticPage";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl, siteConfig } from "@/lib/site";

const description = `Follow ${siteConfig.name} in your favourite feed reader and get every new guide as soon as it is published.`;

export const metadata: Metadata = buildMetadata({ title: "Subscribe via RSS", description, path: "/subscribe" });

export default function SubscribePage() {
  const feedUrl = absoluteUrl("/rss.xml");
  const encoded = encodeURIComponent(feedUrl);
  const readers = [
    { name: "Feedly", href: `https://feedly.com/i/subscription/feed/${encoded}` },
    { name: "Inoreader", href: `https://www.inoreader.com/?add_feed=${encoded}` },
    { name: "NewsBlur", href: `https://www.newsblur.com/?url=${encoded}` },
  ];

  return (
    <StaticPage eyebrow="Follow along" title="Subscribe via RSS" description={description} path="/subscribe">
      <h2>Your feed address</h2>
      <p>Copy this address and paste it into any RSS reader:</p>
      <div className="not-prose flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3">
        <code className="min-w-0 flex-1 truncate text-sm">{feedUrl}</code>
        <CopyLinkButton url={feedUrl} className="shrink-0 rounded-md p-1.5 text-muted transition-colors hover:text-link" />
      </div>

      <h2>Add it in one click</h2>
      <ul>
        {readers.map((r) => (
          <li key={r.name}>
            <a href={r.href} target="_blank" rel="noopener noreferrer">
              Subscribe with {r.name}
            </a>
          </li>
        ))}
      </ul>

      <h2>What is RSS?</h2>
      <p>
        RSS is a free, open way to follow websites. A feed reader checks {siteConfig.name} for you and shows new articles
        alongside your other sources — no account with us, no email, no algorithm. Unsubscribe any time by removing the
        feed from your reader.
      </p>
      <p>
        Prefer email? Use the newsletter sign-up on our <Link href="/">home page</Link>. Developers can read the{" "}
        <a href="/rss.xml">raw XML feed</a> directly.
      </p>
    </StaticPage>
  );
}
