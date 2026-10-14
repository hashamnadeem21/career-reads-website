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
        <li id="job-applications">
          <strong>Job applications:</strong> when you apply for a job on {siteConfig.name}, we collect your name, email
          address, phone number, CV, and anything else you choose to send (your location, LinkedIn profile, a note,
          and answers to the employer&apos;s questions). We share them only with the employer that posted that job, so
          they can consider you for it, and email you a receipt. Your CV is stored privately and is never public.
        </li>
        <li id="candidate-accounts">
          <strong>Your account:</strong> applying on {siteConfig.name} needs a free account (reading and browsing
          never do). If you create one with your email, we keep your name, email address and password, stored only as
          a one-way hash we can&apos;t read. If you continue with Google, Google shares your name, email address and
          profile photo with us; we never see your Google password. We record when you signed up, signed in and
          applied, to keep accounts secure and to understand how the site is used, and we email you once to welcome
          you and confirm your address. Signing in keeps a cookie on your device that only lets the site know it&apos;s
          you; it isn&apos;t used for advertising. We add you to the newsletter only if you choose to subscribe.
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
        We keep your account until you delete it, which you can do at any time from your account page; deleting it
        also deletes your applications, CVs and newsletter subscription. Sign-in sessions end after 60 days.
        We keep newsletter subscriptions until you unsubscribe and contact messages for as long as needed to respond
        and keep a reasonable record of the conversation. Job applications, including CVs, are deleted 6 months
        after the job&apos;s closing date (or 6 months after you applied, if that is later). Analytics data is retained
        according to the retention settings configured in Google Analytics.
      </p>

      <h2>Your rights</h2>
      <p>
        Depending on where you live, you may have the right to access, correct, delete, or export your personal
        information, and to object to or restrict certain processing. To make a request, email{" "}
        <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>. If you ask us to delete your job
        applications, we delete every application you made on {siteConfig.name} and your CVs.
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
