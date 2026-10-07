import type { Metadata } from "next";
import Link from "next/link";
import { StaticPage } from "@/components/ui/StaticPage";
import { POLICY_DATES } from "@/lib/policies";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

const description = "The terms that apply when you read, share, or interact with content on Career Reads.";

export const metadata: Metadata = buildMetadata({ title: "Terms of service", description, path: "/terms" });

export default function TermsPage() {
  return (
    <StaticPage eyebrow="Legal" title="Terms of service" description={description} path="/terms" lastUpdated={POLICY_DATES.terms}>
      <p>By using {siteConfig.name}, you agree to these terms. If you do not agree, please do not use the site.</p>

      <h2>Informational content only</h2>
      <p>
        Our articles are for general information. They are not professional legal, medical, financial, or other
        advice. Always consult a qualified professional about your specific situation. While we work hard to keep
        content accurate and current, we cannot guarantee that every detail is complete or up to date.
      </p>

      <h2>Intellectual property</h2>
      <p>
        Unless otherwise noted, the text, graphics, logo, and design of {siteConfig.name} are owned by us. You may
        share links and short quotations with attribution and a link back to the original article. Please don&apos;t
        republish full articles without written permission.
      </p>

      <h2>Acceptable use</h2>
      <ul>
        <li>Don&apos;t attempt to disrupt, overload, or gain unauthorized access to the site.</li>
        <li>Don&apos;t use forms to send spam, malicious links, or abusive content.</li>
        <li>Don&apos;t scrape the site in a way that harms its performance.</li>
      </ul>

      <h2>Third-party links and advertising</h2>
      <p>
        We may link to other websites and display third-party advertising. We are not responsible for the content or
        practices of third-party sites. See our <Link href="/advertising-disclosure">advertising disclosure</Link>.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the extent permitted by law, {siteConfig.name} is provided “as is” without warranties, and we are not liable
        for losses arising from your use of the site or reliance on its content.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms from time to time. Continued use of the site after changes means you accept the
        updated terms. Questions? <Link href="/contact">Contact us</Link>.
      </p>
    </StaticPage>
  );
}
