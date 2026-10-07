import type { Metadata } from "next";
import Link from "next/link";
import { StaticPage } from "@/components/ui/StaticPage";
import { POLICY_DATES } from "@/lib/policies";
import { buildMetadata } from "@/lib/seo";

const description =
  "How Career Reads uses advertising, how ads are labeled, and how we keep advertising separate from editorial content.";

export const metadata: Metadata = buildMetadata({
  title: "Advertising disclosure",
  description,
  path: "/advertising-disclosure",
});

export default function AdvertisingDisclosurePage() {
  return (
    <StaticPage
      eyebrow="Transparency"
      title="Advertising disclosure"
      description={description}
      path="/advertising-disclosure"
      lastUpdated={POLICY_DATES.advertising}
    >
      <p>
        Career Reads is free to read. To support the site, we may display advertising. This page explains how that works.
      </p>

      <h2>Display advertising</h2>
      <p>
        We may show ads served by Google AdSense. These ads are selected automatically by Google, not by our editors,
        and do not represent endorsements. Every ad on the site is labeled “Advertisement” and placed in a separate,
        clearly bordered area away from article text and navigation.
      </p>

      <h2>Editorial independence</h2>
      <p>
        Advertisers do not influence which topics we cover or what we say about them. We don&apos;t accept payment for
        positive coverage, and we don&apos;t write content to fit ad placements.
      </p>

      <h2>Sponsored content and affiliate links</h2>
      <p>
        We do not currently publish sponsored articles or use affiliate links. If that changes, sponsored articles
        will be labeled “Sponsored” at the top, affiliate links will be disclosed in the article, and this page will be
        updated.
      </p>

      <h2>Cookies and personalization</h2>
      <p>
        Advertising partners may use cookies to show more relevant ads. Our <Link href="/privacy-policy">privacy policy</Link>{" "}
        explains this and how to opt out of personalized advertising.
      </p>

      <h2>Questions</h2>
      <p>
        For advertising enquiries or questions about this disclosure, please <Link href="/contact">contact us</Link>.
      </p>
    </StaticPage>
  );
}
