import type { Metadata } from "next";
import Link from "next/link";
import { StaticPage } from "@/components/ui/StaticPage";
import { POLICY_DATES } from "@/lib/policies";
import { buildMetadata } from "@/lib/seo";

const description = "How to report an error on Career Reads and how we review, correct, and disclose mistakes in our articles.";

export const metadata: Metadata = buildMetadata({ title: "Corrections policy", description, path: "/corrections-policy" });

export default function CorrectionsPolicyPage() {
  return (
    <StaticPage
      eyebrow="Standards"
      title="Corrections policy"
      description={description}
      path="/corrections-policy"
      lastUpdated={POLICY_DATES.corrections}
    >
      <p>We work hard to get things right, but mistakes happen. When they do, we fix them openly.</p>

      <h2>How to report an error</h2>
      <p>
        Use our <Link href="/contact">contact form</Link> and choose “Report an error / correction”. Please include the
        article link, the statement you believe is wrong, and — if possible — a source that supports the correction.
      </p>

      <h2>What happens next</h2>
      <ol>
        <li>An editor reviews the report, usually within a few working days.</li>
        <li>If we confirm an error, we correct the article promptly.</li>
        <li>We reply to let you know the outcome.</li>
      </ol>

      <h2>How corrections are shown</h2>
      <ul>
        <li>
          <strong>Factual errors</strong> that could affect a reader&apos;s understanding are corrected, and a note at the
          end of the article explains what changed and when.
        </li>
        <li>
          <strong>Minor fixes</strong> — typos, broken links, formatting — are corrected without a note.
        </li>
        <li>
          <strong>Substantial updates</strong> are reflected in the “Updated” date shown at the top of the article.
        </li>
      </ul>

      <p>
        This policy works alongside our <Link href="/editorial-policy">editorial policy</Link>.
      </p>
    </StaticPage>
  );
}
