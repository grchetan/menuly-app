import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, LegalSection, LegalCallout } from "@/components/LegalLayout";
import { APP_NAME, SUPPORT_EMAIL, SUPPORT_WHATSAPP } from "@/lib/config";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: `Privacy Policy — ${APP_NAME}` },
      {
        name: "description",
        content: `Official Privacy Policy of ${APP_NAME}. Learn how we collect, protect, process, and respect restaurant owner and customer data in compliance with the Digital Personal Data Protection Act (DPDP Act, 2023) and IT Act.`,
      },
      { property: "og:title", content: `Privacy Policy — ${APP_NAME}` },
      {
        property: "og:description",
        content: `Read the official Privacy Policy for ${APP_NAME} digital menus and QR services.`,
      },
    ],
  }),
  component: PrivacyPolicyPage,
});

const TOC_ITEMS = [
  { id: "introduction", title: "Introduction & Scope" },
  { id: "data-collection", title: "Categories of Information We Collect" },
  { id: "legal-basis", title: "Legal Grounds for Processing" },
  { id: "data-usage", title: "How We Use Collected Information" },
  { id: "cookies-storage", title: "Cookies & Local Storage Policy" },
  { id: "data-sharing", title: "Data Sharing & Third-Party Processors" },
  { id: "data-retention", title: "Data Retention & Erasure" },
  { id: "security-measures", title: "Security Measures & Encryption" },
  { id: "your-rights", title: "Your Statutory Rights (DPDP Act & GDPR)" },
  { id: "children-privacy", title: "Minors & Children's Privacy" },
  { id: "cross-border", title: "Cross-Border Data Transfers" },
  { id: "policy-updates", title: "Modifications to This Policy" },
  { id: "grievance-officer", title: "Grievance Officer & Legal Contact" },
];

function PrivacyPolicyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      description={`At ${APP_NAME}, we are committed to safeguarding your privacy and ensuring maximum transparency regarding how restaurant owner data and dining customer interactions are processed across our QR digital menu infrastructure.`}
      lastUpdated="October 22, 2026"
      readingTime="8 min read"
      toc={TOC_ITEMS}
    >
      {/* Intro Summary Callout */}
      <LegalCallout title="Key Privacy Principles at Menuly" variant="info">
        <p>
          We do not sell, rent, or trade your personal data or restaurant customer information to advertisers or data brokers.
          Dining customers scanning Menuly QR codes are <strong>never required to create an account, download an app, or provide personal identity data</strong> merely to view a digital menu.
        </p>
      </LegalCallout>

      {/* Section 1 */}
      <LegalSection id="introduction" number="1" title="Introduction & Scope">
        <p>
          Welcome to {APP_NAME} ("<strong>Company</strong>", "<strong>we</strong>", "<strong>our</strong>", or "<strong>us</strong>").
          This Privacy Policy explains how {APP_NAME} collects, utilizes, discloses, stores, and protects information when you access or use our website (
          <a href="https://menuly.app" className="text-primary hover:underline font-medium">
            menuly.app
          </a>
          ), our cloud-based restaurant administrative console, our digital menu viewers, and our QR table stand ordering solutions (collectively, the "<strong>Services</strong>").
        </p>
        <p>
          This policy applies to both:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Restaurant Partners ("Merchants" or "Owners"):</strong> Food establishments, cafe managers, hoteliers, and cloud kitchen operators who register an account to build and host menus.
          </li>
          <li>
            <strong>Dining Customers ("Diners" or "Visitors"):</strong> End-users who scan a {APP_NAME} QR code or open a public menu link on their mobile devices.
          </li>
        </ul>
        <p>
          By creating an account, accessing our platform, or scanning our QR codes, you acknowledge that you have read, understood, and agree to the data handling practices described in this Privacy Policy.
        </p>
      </LegalSection>

      {/* Section 2 */}
      <LegalSection id="data-collection" number="2" title="Categories of Information We Collect">
        <p>
          We collect only the minimum information necessary to provide an ultra-fast, reliable, and secure contactless dining platform.
        </p>

        <h3 className="font-bold text-foreground text-sm pt-2">A. Information Provided by Restaurant Partners</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Account Credentials:</strong> Full name, registered email address, encrypted authentication password, and contact phone number.
          </li>
          <li>
            <strong>Restaurant Profile Information:</strong> Business name, unique restaurant slug (e.g., <code>/menu/royal-spice</code>), physical street address, operational business hours, currency, and WhatsApp ordering phone number.
          </li>
          <li>
            <strong>Menu Data & Media Assets:</strong> Dish titles, descriptions, pricing, dietary indicators (Veg, Non-Veg, Egg, Vegan, Gluten-Free), dish imagery, and restaurant logo graphics.
          </li>
          <li>
            <strong>Billing & Transaction Records:</strong> Subscription plan tier, invoice records, and shipping addresses for physical QR table stands, NFC pucks, and posters ordered via our Print Shop. We do not store raw credit/debit card numbers; all payments are processed through PCI-DSS Level 1 certified payment gateways.
          </li>
        </ul>

        <h3 className="font-bold text-foreground text-sm pt-2">B. Information Collected from Diners & QR Visitors</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Contactless Scan Telemetry:</strong> An anonymous timestamp of when a QR code or menu link was accessed, the requested table number (if applicable), and aggregated scan counts to help restaurant managers track footfall.
          </li>
          <li>
            <strong>Device & Technical Telemetry:</strong> Browser type, operating system version, screen resolution, preferred language, and approximate network location (derived from IP address). We do not record precise GPS coordinates.
          </li>
          <li>
            <strong>Zero Forced Signups:</strong> Unlike traditional ordering apps, {APP_NAME} does <strong>not</strong> mandate customer name, phone number, or app download for viewing menus.
          </li>
        </ul>

        <h3 className="font-bold text-foreground text-sm pt-2">C. Direct WhatsApp Ordering Data</h3>
        <p>
          When a customer builds a cart on {APP_NAME} and clicks "Order via WhatsApp", our platform generates a formatted text message and redirects the user directly to the restaurant's WhatsApp phone number using Meta's official <code>wa.me</code> protocol.
          {APP_NAME} acts solely as a client-side message formatter; we do not read, intercept, or store private conversation transcripts between diners and restaurant staff.
        </p>
      </LegalSection>

      {/* Section 3 */}
      <LegalSection id="legal-basis" number="3" title="Legal Grounds for Processing">
        <p>
          We process personal data in strict compliance with the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong> of India, the <strong>Information Technology Act, 2000</strong>, and international principles such as the General Data Protection Regulation (GDPR) on the following lawful bases:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Contractual Necessity:</strong> To fulfill our contractual obligations to restaurant partners, including menu hosting, QR code rendering, authentication, and dispatch of shop merchandise.
          </li>
          <li>
            <strong>Legitimate Business Interests:</strong> To detect malicious scanning activity, prevent fraud, optimize server performance, and ensure 99.9% menu availability during peak dining hours.
          </li>
          <li>
            <strong>Consent:</strong> Where explicit consent has been provided, such as opting into product update bulletins or uploading proprietary brand logos.
          </li>
          <li>
            <strong>Statutory Compliance:</strong> To adhere to applicable tax reporting, accounting laws, and lawful law enforcement requests.
          </li>
        </ul>
      </LegalSection>

      {/* Section 4 */}
      <LegalSection id="data-usage" number="4" title="How We Use Collected Information">
        <p>We use the collected information for the following specific purposes:</p>
        <div className="grid gap-3 sm:grid-cols-2 pt-1">
          <div className="rounded-xl border border-border/80 bg-background/50 p-3.5 space-y-1">
            <p className="font-bold text-xs text-foreground">1. Core Menu Services</p>
            <p className="text-xs text-muted-foreground">Rendering dynamic live menus, auto-generating vector QR codes, and synchronizing real-time dish availability.</p>
          </div>
          <div className="rounded-xl border border-border/80 bg-background/50 p-3.5 space-y-1">
            <p className="font-bold text-xs text-foreground">2. Account Security & OTPs</p>
            <p className="text-xs text-muted-foreground">Authenticating restaurant owners via email OTP verification, password resets, and session tokens.</p>
          </div>
          <div className="rounded-xl border border-border/80 bg-background/50 p-3.5 space-y-1">
            <p className="font-bold text-xs text-foreground">3. Analytics & Reporting</p>
            <p className="text-xs text-muted-foreground">Providing restaurant owners with anonymous insights regarding popular dishes, peak scan hours, and table activity.</p>
          </div>
          <div className="rounded-xl border border-border/80 bg-background/50 p-3.5 space-y-1">
            <p className="font-bold text-xs text-foreground">4. Customer Support</p>
            <p className="text-xs text-muted-foreground">Diagnosing menu rendering anomalies, assisting with QR stand printing, and answering operational inquiries.</p>
          </div>
        </div>
      </LegalSection>

      {/* Section 5 */}
      <LegalSection id="cookies-storage" number="5" title="Cookies & Local Storage Policy">
        <p>
          {APP_NAME} utilizes browser <code>localStorage</code> and lightweight, strictly essential cookies to maintain system security and session persistence:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <code>menuly_token</code>: Secure authentication token stored in an encrypted cookie / localStorage to preserve your login session.
          </li>
          <li>
            <code>menuly_user</code>: Minimal profile caching to eliminate redundant database queries and ensure lightning-fast dashboard navigation.
          </li>
          <li>
            <strong>Zero Invasive Tracking:</strong> We do not deploy third-party advertising cookies, cross-site trackers, or surveillance pixels that follow users across the internet.
          </li>
        </ul>
        <p>
          For more details, please review our comprehensive{" "}
          <a href="/cookies" className="text-primary hover:underline font-semibold">
            Cookie Policy
          </a>
          .
        </p>
      </LegalSection>

      {/* Section 6 */}
      <LegalSection id="data-sharing" number="6" title="Data Sharing & Third-Party Processors">
        <p>
          We do <strong>not</strong> sell, rent, or lease your personal data. We disclose information only to vetted third-party service providers bound by strict confidentiality and data protection agreements:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Cloud Infrastructure:</strong> High-performance server hosting and database persistence with automated encrypted backups.
          </li>
          <li>
            <strong>Transactional Email & OTP Delivery:</strong> Trusted SMTP relays and email delivery networks for one-time passcodes and password recovery.
          </li>
          <li>
            <strong>Payment Gateways:</strong> Regulated payment aggregators (e.g., Razorpay, Stripe) for handling subscription invoices and merchandise checkout.
          </li>
          <li>
            <strong>Logistics & Printing Partners:</strong> Third-party print shops and courier services (e.g., Blue Dart, Delhivery) strictly to fabricate and deliver physical QR acrylic stands and stickers.
          </li>
          <li>
            <strong>Legal Requirements:</strong> Where required by valid subpoenas, court orders, or statutory legal obligations under Indian law.
          </li>
        </ul>
      </LegalSection>

      {/* Section 7 */}
      <LegalSection id="data-retention" number="7" title="Data Retention & Erasure">
        <p>
          We retain restaurant partner data for as long as your account remains active and in good standing. If you choose to close your account:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Your public digital menu (<code>/menu/[slug]</code>) is immediately unpublished and unindexed.</li>
          <li>Uploaded food photographs and brand logos are queued for permanent deletion from our storage buckets.</li>
          <li>Account credentials and profile records are expunged within thirty (30) days, except where retention is mandated by financial, tax, or corporate recordkeeping laws.</li>
        </ul>
      </LegalSection>

      {/* Section 8 */}
      <LegalSection id="security-measures" number="8" title="Security Measures & Encryption">
        <p>
          We employ state-of-the-art administrative, technical, and physical safeguards to prevent unauthorized access, alteration, disclosure, or destruction of data:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Transport Layer Security:</strong> All client-to-server traffic is encrypted using 256-bit TLS 1.3 cryptographic protocols.
          </li>
          <li>
            <strong>Password Hashing:</strong> Passwords are cryptographically salted and hashed using industry-standard irreversible algorithms before database insertion.
          </li>
          <li>
            <strong>Ephemeral OTPs:</strong> Single-use authentication codes expire automatically after ten (10) minutes and cannot be reused.
          </li>
          <li>
            <strong>Restricted Access:</strong> Production database access is tightly restricted via role-based access controls and monitored by continuous audit logs.
          </li>
        </ul>
      </LegalSection>

      {/* Section 9 */}
      <LegalSection id="your-rights" number="9" title="Your Statutory Rights (DPDP Act & GDPR)">
        <p>
          Under the Digital Personal Data Protection Act, 2023, and global data privacy standards, you hold the following rights:
        </p>
        <div className="grid gap-3 sm:grid-cols-2 pt-1">
          <div className="rounded-xl border border-border/80 bg-background/50 p-3.5">
            <p className="font-bold text-xs text-foreground">Right to Access</p>
            <p className="text-xs text-muted-foreground mt-0.5">Request a summary of personal data held about you and details of processing activities.</p>
          </div>
          <div className="rounded-xl border border-border/80 bg-background/50 p-3.5">
            <p className="font-bold text-xs text-foreground">Right to Correction</p>
            <p className="text-xs text-muted-foreground mt-0.5">Update or rectify inaccurate or incomplete profile and business information.</p>
          </div>
          <div className="rounded-xl border border-border/80 bg-background/50 p-3.5">
            <p className="font-bold text-xs text-foreground">Right to Erasure</p>
            <p className="text-xs text-muted-foreground mt-0.5">Request total deletion of your personal account data when no longer legally required.</p>
          </div>
          <div className="rounded-xl border border-border/80 bg-background/50 p-3.5">
            <p className="font-bold text-xs text-foreground">Right of Grievance Redressal</p>
            <p className="text-xs text-muted-foreground mt-0.5">Submit complaints regarding data handling to our designated Grievance Officer.</p>
          </div>
        </div>
        <p className="pt-2">
          To exercise any of these rights, please email us directly at{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline font-bold">
            {SUPPORT_EMAIL}
          </a>
          . We acknowledge all statutory data requests within 48 hours.
        </p>
      </LegalSection>

      {/* Section 10 */}
      <LegalSection id="children-privacy" number="10" title="Minors & Children's Privacy">
        <p>
          The Services are designed and intended exclusively for legal business operators, restaurateurs, and adult dining patrons. We do not knowingly solicit or collect personal information from individuals under the age of eighteen (18). If we become aware that a child has provided us with personal information without parental verification, we will promptly delete such records from our servers.
        </p>
      </LegalSection>

      {/* Section 11 */}
      <LegalSection id="cross-border" number="11" title="Cross-Border Data Transfers">
        <p>
          Our cloud servers and delivery nodes are distributed across reputable, secure Tier-4 data centers. While primary processing conforms with Indian statutory provisions, your data may be processed on servers located internationally where our cloud hosting providers maintain infrastructure. All international transfers are safeguarded by standard contractual clauses and rigorous enterprise encryption.
        </p>
      </LegalSection>

      {/* Section 12 */}
      <LegalSection id="policy-updates" number="12" title="Modifications to This Policy">
        <p>
          We may revise this Privacy Policy periodically to reflect technological advances, platform upgrades, or regulatory mandates. When modifications occur, we will update the "Last Updated" timestamp at the top of this document. We encourage restaurant partners to review this page regularly. Continued use of {APP_NAME} following notification of changes constitutes acceptance of the revised terms.
        </p>
      </LegalSection>

      {/* Section 13 */}
      <LegalSection id="grievance-officer" number="13" title="Grievance Officer & Legal Contact">
        <p>
          In accordance with the <strong>Information Technology Act, 2000</strong>, the <strong>Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</strong>, and the <strong>Digital Personal Data Protection Act, 2023</strong>, the name and contact details of our designated Grievance Officer are set forth below:
        </p>

        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-2 mt-3">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Designated Grievance & Compliance Officer</p>
          <p className="font-display text-base font-bold text-foreground">Legal & Privacy Redressal Desk</p>
          <p className="text-xs text-muted-foreground">Entity: Menuly Digital Technologies</p>
          <p className="text-xs text-muted-foreground">
            Email:{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline font-bold">
              {SUPPORT_EMAIL}
            </a>
          </p>
          <p className="text-xs text-muted-foreground">
            WhatsApp Desk:{" "}
            <a href={`https://wa.me/${SUPPORT_WHATSAPP}`} className="text-primary hover:underline font-semibold">
              +{SUPPORT_WHATSAPP}
            </a>
          </p>
          <p className="text-xs text-muted-foreground">Office Hours: Monday through Saturday, 10:00 AM to 7:00 PM IST</p>
          <p className="text-xs text-muted-foreground">Response Timetable: Acknowledgment within 24 hours; resolution within 15 working days.</p>
        </div>
      </LegalSection>
    </LegalLayout>
  );
}
