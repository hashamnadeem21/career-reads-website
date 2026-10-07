import type { Metadata } from "next";
import Link from "next/link";
import { StaticPage } from "@/components/ui/StaticPage";
import { POLICY_DATES } from "@/lib/policies";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import { ensureSiteData } from "@/lib/site-data";

const description =
  "How Career Reads collects, uses, and protects information, including cookies, analytics, advertising, and your choices.";

export const metadata: Metadata = buildMetadata({ title: "Privacy policy", description, path: "/privacy-policy" });

export default async function PrivacyPolicyPage() {
  await ensureSiteData();
  return (
    <StaticPage
      eyebrow="Legal"
      title="Privacy policy"
      description={description}
      path="/privacy-policy"
      lastUpdated={POLICY_DATES.privacy}
    >
      <p>
        This policy explains what information {siteConfig.name} (“we”, “us”) collects when you use{" "}
        {new URL(siteConfig.url).host}, why we collect it, and the choices you have.
      </p>

      <h2>Information you give us</h2>
      <ul>
        <li>
          <strong>Newsletter:</strong> if you subscribe, we collect your email address and process it through our
          email service provider to send the newsletter. You can unsubscribe at any time using the link in every
          email.
        </li>
        <li>
          <strong>Contact form:</strong> if you contact us, we collect your name, email address, and message, and use
          them only to respond. Messages are delivered to our inbox through an email delivery provider.
        </li>
      </ul>

      <h2>Information collected automatically</h2>
      <ul>
        <li>
          <strong>Server logs:</strong> our hosting provider processes technical data such as IP address, browser
          type, and requested pages to deliver the site and protect it from abuse.
        </li>
        <li>
          <strong>Preferences:</strong> your light/dark theme choice is stored in your browser&apos;s local storage. It
          never leaves your device.
        </li>
        <li>
          <strong>Analytics:</strong> where enabled, we use Google Analytics to understand which articles are useful
          and how visitors navigate the site. Google Analytics uses cookies and similar technologies. Learn more about{" "}
          <a href="https://policies.google.com/technologies/partner-sites">
            how Google uses information from sites that use its services
          </a>
          .
        </li>
      </ul>

      <h2>Advertising</h2>
      <p>
        Where enabled, we use Google AdSense to display ads. Third-party vendors, including Google, use cookies to
        serve ads based on your prior visits to this and other websites. Google&apos;s use of advertising cookies
        enables it and its partners to serve ads based on your visits to this site and/or other sites on the
        internet.
      </p>
      <p>
        You can opt out of personalized advertising by visiting{" "}
        <a href="https://adssettings.google.com">Google Ads Settings</a>, or opt out of some third-party vendors&apos;
        use of cookies for personalized advertising at <a href="https://www.aboutads.info/choices/">aboutads.info</a>.
      </p>

      <h2>Consent</h2>
      <p>
        Visitors in the European Economic Area, the United Kingdom, and Switzerland are asked for consent before
        cookies are used for analytics or personalized advertising. You can change your choice at any time using the
        privacy settings link provided by our consent tool.
      </p>

      <h2>How long we keep information</h2>
      <p>
        We keep newsletter subscriptions until you unsubscribe and contact messages for as long as needed to respond
        and keep a reasonable record of the conversation. Analytics data is retained according to the retention
        settings configured in Google Analytics.
      </p>

      <h2>Your rights</h2>
      <p>
        Depending on where you live, you may have the right to access, correct, delete, or export your personal
        information, and to object to or restrict certain processing. To make a request, email{" "}
        <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>.
      </p>

      <h2>Children</h2>
      <p>This site is not directed at children under 13, and we do not knowingly collect their personal information.</p>

      <h2>Changes to this policy</h2>
      <p>
        We will update this page when our practices change and revise the “last updated” date above. See also our{" "}
        <Link href="/terms">terms of service</Link> and <Link href="/advertising-disclosure">advertising disclosure</Link>
        .
      </p>
    </StaticPage>
  );
}
