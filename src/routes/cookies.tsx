import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, LegalSection, LegalCallout } from "@/components/LegalLayout";
import { APP_NAME, SUPPORT_EMAIL } from "@/lib/config";
import { Cookie, Shield, CheckCircle2, Lock } from "lucide-react";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: `Cookie Policy — ${APP_NAME}` },
      {
        name: "description",
        content: `Official Cookie & Local Storage Policy for ${APP_NAME}. Learn how we use strictly essential cookies and browser storage for authentication, security, and lightning-fast digital menus without ad trackers.`,
      },
      { property: "og:title", content: `Cookie Policy — ${APP_NAME}` },
      {
        property: "og:description",
        content: `Read the official Cookie and Local Storage Policy for ${APP_NAME}. Zero cross-site advertising cookies.`,
      },
    ],
  }),
  component: CookiePolicyPage,
});

const TOC_ITEMS = [
  { id: "what-are-cookies", title: "What Are Cookies & Local Storage?" },
  { id: "cookies-we-use", title: "Categories of Cookies We Use" },
  { id: "zero-ad-trackers", title: "Zero Cross-Site Advertising Trackers" },
  { id: "diner-privacy", title: "Cookie Privacy for Dining Patrons" },
  { id: "how-to-manage", title: "How to Manage or Clear Cookies" },
  { id: "contact-cookies", title: "Questions About Cookies" },
];

function CookiePolicyPage() {
  return (
    <LegalLayout
      title="Cookie & Storage Policy"
      description={`This Cookie Policy explains how ${APP_NAME} uses cookies and browser storage technologies to deliver secure login sessions, protect platform integrity, and ensure smooth menu browsing.`}
      lastUpdated="October 22, 2026"
      readingTime="4 min read"
      toc={TOC_ITEMS}
    >
      {/* Intro Summary Callout */}
      <LegalCallout title="Our Privacy-First Cookie Stance" variant="success">
        <p>
          {APP_NAME} believes that hospitality software should be clean and respectful. We use <strong>strictly essential cookies and local storage</strong> required for authentication and dashboard performance. We do <strong>not</strong> inject third-party advertising cookies, data broker trackers, or surveillance pixels.
        </p>
      </LegalCallout>

      {/* Section 1 */}
      <LegalSection id="what-are-cookies" number="1" title="What Are Cookies & Local Storage?">
        <p>
          Cookies are small text files placed on your computer or mobile device by websites that you visit. Browser storage (such as <code>localStorage</code> and <code>sessionStorage</code>) enables modern web applications to store lightweight configuration data locally on your device rather than sending repetitive requests to our servers.
        </p>
        <p>
          These technologies allow {APP_NAME} to remember your authenticated session, keep your dish edits safe while you type, and render digital menus with instantaneous speed.
        </p>
      </LegalSection>

      {/* Section 2 */}
      <LegalSection id="cookies-we-use" number="2" title="Categories of Cookies We Use">
        <p>We classify our browser storage mechanisms into the following specific categories:</p>

        <div className="space-y-4 pt-2">
          {/* Essential */}
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5 space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Lock className="size-4" /> 1. Strictly Necessary & Security Tokens (Always Active)
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              These cookies and storage items are fundamental to the operation and security of the website. Without them, you cannot log into your restaurant owner portal or access administrative controls.
            </p>
            <div className="rounded-xl border border-border/60 bg-background/60 p-3 text-[11px] font-mono space-y-1">
              <p><code>menuly_token</code>: Secure session token verifying your authentication status.</p>
              <p><code>menuly_user</code>: Caches basic owner details to reduce server load.</p>
            </div>
          </div>

          {/* Functional */}
          <div className="rounded-2xl border border-border/80 bg-background/50 p-4 sm:p-5 space-y-2">
            <div className="flex items-center gap-2 text-foreground font-bold text-xs uppercase tracking-wider">
              <Shield className="size-4 text-accent" /> 2. Functional & Interface State Storage
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Used to remember UI preferences across your sessions, such as whether you have collapsed the sidebar preview, your active menu category tab, or light/dark interface modes.
            </p>
          </div>

          {/* Aggregated Analytics */}
          <div className="rounded-2xl border border-border/80 bg-background/50 p-4 sm:p-5 space-y-2">
            <div className="flex items-center gap-2 text-foreground font-bold text-xs uppercase tracking-wider">
              <Cookie className="size-4 text-primary" /> 3. Anonymous Telemetry
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We collect aggregate scan counters (e.g., Table 4 scanned 18 times on Friday evening) to provide restaurant owners with useful footfall analytics. These counters are not tied to personal individual diner identities.
            </p>
          </div>
        </div>
      </LegalSection>

      {/* Section 3 */}
      <LegalSection id="zero-ad-trackers" number="3" title="Zero Cross-Site Advertising Trackers">
        <p>
          Many online platforms install third-party tracking scripts from advertising networks that track you across the web to serve personalized ads.
        </p>
        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-xs font-bold text-foreground">Our Promise to Restaurateurs and Diners:</p>
          <ul className="list-disc pl-5 mt-1.5 space-y-1 text-xs text-muted-foreground">
            <li>We do not partner with third-party behavioral ad networks.</li>
            <li>We do not sell cookie data to marketing conglomerates or data brokers.</li>
            <li>We do not embed third-party social media tracking pixels that harvest customer browsing histories.</li>
          </ul>
        </div>
      </LegalSection>

      {/* Section 4 */}
      <LegalSection id="diner-privacy" number="4" title="Cookie Privacy for Dining Patrons">
        <p>
          When a diner scans a {APP_NAME} QR code at a dining table, their smartphone opens our progressive web menu.
          We do <strong>not</strong> write persistent tracking cookies to diner phones. Once the diner closes their browser tab, their session cleanly ends without leaving residual tracking scripts behind.
        </p>
      </LegalSection>

      {/* Section 5 */}
      <LegalSection id="how-to-manage" number="5" title="How to Manage or Clear Cookies">
        <p>
          You have full control over cookies and can disable or delete them at any time through your web browser preferences. Please note that disabling strictly necessary cookies will prevent you from logging into your {APP_NAME} merchant portal.
        </p>
        <ul className="list-disc pl-5 space-y-1 text-xs">
          <li><strong>Google Chrome:</strong> Settings &gt; Privacy and Security &gt; Third-party cookies</li>
          <li><strong>Apple Safari:</strong> Preferences &gt; Privacy &gt; Manage Website Data</li>
          <li><strong>Mozilla Firefox:</strong> Settings &gt; Privacy & Security &gt; Cookies and Site Data</li>
          <li><strong>Microsoft Edge:</strong> Settings &gt; Cookies and site permissions</li>
        </ul>
      </LegalSection>

      {/* Section 6 */}
      <LegalSection id="contact-cookies" number="6" title="Questions About Cookies">
        <p>
          If you have any questions about our use of cookies or local storage, please reach out to our privacy compliance team at{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline font-bold">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
