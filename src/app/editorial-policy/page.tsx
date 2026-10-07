import type { Metadata } from "next";
import Link from "next/link";
import { StaticPage } from "@/components/ui/StaticPage";
import { POLICY_DATES } from "@/lib/policies";
import { buildMetadata } from "@/lib/seo";

const description =
  "How Career Reads chooses topics, researches and fact-checks articles, uses AI tools responsibly, and keeps content up to date.";

export const metadata: Metadata = buildMetadata({ title: "Editorial policy", description, path: "/editorial-policy" });

export default function EditorialPolicyPage() {
  return (
    <StaticPage
      eyebrow="Standards"
      title="Editorial policy"
      description={description}
      path="/editorial-policy"
      lastUpdated={POLICY_DATES.editorial}
    >
      <p>
        Our goal is simple: publish genuinely useful articles that are accurate, clear, and honest about their limits.
        This policy describes how we work toward that goal.
      </p>

      <h2>Choosing topics</h2>
      <p>
        We write about questions readers actually have — from reader emails, common search questions, and our own
        experience. We favor evergreen, practical guides over thin news rewrites, and we don&apos;t publish pages that
        exist only to target keywords.
      </p>

      <h2>Research and sourcing</h2>
      <ul>
        <li>We rely on primary sources — official documentation, original research, and government publications — wherever possible.</li>
        <li>We link to sources when they help readers verify a claim or learn more.</li>
        <li>We don&apos;t invent statistics, quotes, reviews, testimonials, or credentials.</li>
        <li>When evidence is limited or mixed, we say so.</li>
      </ul>

      <h2>Editing and review</h2>
      <p>
        Every article is edited before publication for accuracy, clarity, and fairness. Articles giving guidance on
        health, money, or safety include a reminder to consult a qualified professional.
      </p>

      <h2>Use of AI tools</h2>
      <p>
        Our writers may use AI tools for tasks such as brainstorming, outlining, or checking clarity. A human editor
        is responsible for every published article, verifies facts independently, and makes all editorial decisions.
        We do not publish unreviewed AI-generated content.
      </p>

      <h2>Keeping content current</h2>
      <p>
        We review articles periodically and when we learn that something has changed. Significant updates are shown
        with an “Updated” date at the top of the article.
      </p>

      <h2>Independence</h2>
      <p>
        Advertisers and partners have no say in what we write. Sponsored content, if we ever publish it, will be
        clearly labeled. See our <Link href="/advertising-disclosure">advertising disclosure</Link>.
      </p>

      <h2>Mistakes</h2>
      <p>
        We correct errors promptly and transparently. Read our <Link href="/corrections-policy">corrections policy</Link>.
      </p>
    </StaticPage>
  );
}
