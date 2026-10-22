import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, LegalSection, LegalCallout } from "@/components/LegalLayout";
import { APP_NAME, SUPPORT_EMAIL, SUPPORT_WHATSAPP } from "@/lib/config";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: `Terms of Service — ${APP_NAME}` },
      {
        name: "description",
        content: `Official Terms of Service and Merchant Agreement for ${APP_NAME}. Understand user eligibility, platform rules, menu responsibilities, food safety disclaimers, billing terms, and limitation of liability.`,
      },
      { property: "og:title", content: `Terms of Service — ${APP_NAME}` },
      {
        property: "og:description",
        content: `Official Terms and Conditions governing the use of ${APP_NAME} digital menus, QR codes, and merchandise.`,
      },
    ],
  }),
  component: TermsOfServicePage,
});

const TOC_ITEMS = [
  { id: "acceptance", title: "Acceptance & Eligibility" },
  { id: "platform-nature", title: "Nature of the Platform (Technology Intermediary)" },
  { id: "account-security", title: "Account Registration & Security" },
  { id: "merchant-obligations", title: "Restaurant Partner Obligations & Food Safety" },
  { id: "dietary-allergens", title: "Dietary Indicators & Allergen Disclaimers" },
  { id: "whatsapp-ordering", title: "WhatsApp Ordering & Customer Transactions" },
  { id: "ip-rights", title: "Intellectual Property & Content Ownership" },
  { id: "acceptable-use", title: "Acceptable Use & Prohibited Conduct" },
  { id: "billing-subscriptions", title: "Subscription Plans, Invoices & Payments" },
  { id: "merchandise-terms", title: "Physical Merchandise & Print Shop" },
  { id: "sla-availability", title: "Service Availability & Maintenance" },
  { id: "disclaimers", title: "Disclaimer of Warranties" },
  { id: "liability-cap", title: "Limitation of Liability" },
  { id: "indemnification", title: "Indemnification" },
  { id: "termination", title: "Suspension & Account Termination" },
  { id: "governing-law", title: "Governing Law & Dispute Resolution" },
  { id: "contact-legal", title: "Contact Information" },
];

function TermsOfServicePage() {
  return (
    <LegalLayout
      title="Terms of Service"
      description={`These Terms of Service ("Agreement") govern your access to and use of ${APP_NAME}'s digital menu creation software, QR styling engine, and hospitality hardware products.`}
      lastUpdated="October 22, 2026"
      readingTime="10 min read"
      toc={TOC_ITEMS}
    >
      {/* Intro Summary Callout */}
      <LegalCallout title="Important Notice regarding Menuly's Role" variant="warning">
        <p>
          {APP_NAME} provides cloud-based software tools for food and beverage establishments to publish digital menus and print QR collateral.
          <strong> {APP_NAME} is not a restaurant, cloud kitchen, food preparer, delivery aggregator, or payment escrow agent.</strong> Food preparation, menu pricing accuracy, allergen disclosure, and customer order fulfillment are the sole and exclusive responsibility of the respective restaurant partner.
        </p>
      </LegalCallout>

      {/* Section 1 */}
      <LegalSection id="acceptance" number="1" title="Acceptance & Eligibility">
        <p>
          By creating an account, accessing our dashboard, deploying our QR codes, or purchasing print merchandise, you ("<strong>Merchant</strong>", "<strong>Restaurant Partner</strong>", "<strong>User</strong>", or "<strong>you</strong>") enter into a legally binding agreement with {APP_NAME} ("<strong>Company</strong>", "<strong>we</strong>", "<strong>us</strong>", or "<strong>our</strong>").
        </p>
        <p>
          To be eligible to use the Services:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>You must be at least eighteen (18) years of age or the age of majority in your jurisdiction.</li>
          <li>If registering on behalf of a corporate entity, restaurant chain, partnership, or sole proprietorship, you warrant that you have full legal authority to bind such commercial entity to these Terms.</li>
          <li>Your business must possess all required local, municipal, and national licenses (e.g., FSSAI registration in India, GST registration, trade licenses).</li>
        </ul>
        <p>
          If you do not unconditionally agree to all terms herein, you must immediately discontinue using our Services.
        </p>
      </LegalSection>

      {/* Section 2 */}
      <LegalSection id="platform-nature" number="2" title="Nature of the Platform (Technology Intermediary)">
        <p>
          {APP_NAME} operates purely as an <strong>intermediary software-as-a-service (SaaS) platform</strong> under Section 79 of the Indian Information Technology Act, 2000.
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>We provide tools allowing merchants to author digital menu items, configure prices, design branded QR codes, and generate printable marketing assets.</li>
          <li>We provide a contactless mobile viewing experience allowing diners to browse menu items on their personal smartphones.</li>
          <li>We do <strong>not</strong> produce, cook, inspect, handle, pack, or deliver food or beverages.</li>
          <li>We do <strong>not</strong> employ delivery executives, chefs, or waitstaff.</li>
        </ul>
      </LegalSection>

      {/* Section 3 */}
      <LegalSection id="account-security" number="3" title="Account Registration & Security">
        <p>
          When establishing a restaurant account on {APP_NAME}:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>You agree to provide true, accurate, current, and complete registration information.</li>
          <li>You are solely responsible for maintaining the confidentiality of your login credentials, password, and single-use verification OTPs delivered to your registered email or phone.</li>
          <li>You are fully responsible for all menu changes, price adjustments, dish deletions, or merchandise purchases executed under your account.</li>
          <li>You must immediately notify {APP_NAME} at <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline font-bold">{SUPPORT_EMAIL}</a> if you detect any unauthorized access or breach of security.</li>
        </ul>
      </LegalSection>

      {/* Section 4 */}
      <LegalSection id="merchant-obligations" number="4" title="Restaurant Partner Obligations & Food Safety">
        <p>
          As a registered Restaurant Partner, you represent, warrant, and covenant that:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Pricing & Tax Transparency:</strong> All dish prices, applicable taxes (such as GST or VAT), and mandatory service charges displayed on your digital menu are accurate, fair, and adhere to local consumer protection regulations.
          </li>
          <li>
            <strong>Real-Time Dish Availability:</strong> You will utilize the Menuly Dashboard to toggle sold-out dishes off promptly, avoiding diner frustration or misleading advertising.
          </li>
          <li>
            <strong>Statutory Food Compliance:</strong> All food preparation, handling, kitchen sanitation, and raw ingredients comply with applicable food safety standards, including the Food Safety and Standards Authority of India (FSSAI) guidelines.
          </li>
          <li>
            <strong>Liquor & Regulated Goods:</strong> If your digital menu lists alcoholic beverages, tobacco, or regulated items, you warrant that your establishment holds valid, active excise licenses and that you enforce legal drinking age restrictions on your premises.
          </li>
        </ul>
      </LegalSection>

      {/* Section 5 */}
      <LegalSection id="dietary-allergens" number="5" title="Dietary Indicators & Allergen Disclaimers">
        <p>
          {APP_NAME} provides badges for dietary classifications such as Vegetarian (Veg), Non-Vegetarian (Non-Veg), Contains Egg, Vegan, and Spicy indicators.
        </p>
        <LegalCallout title="Mandatory Food Allergy Disclaimer" variant="warning">
          <p>
            The assignment of dietary tags and ingredient descriptions is completed solely by the Restaurant Partner. <strong>{APP_NAME} does not verify, lab-test, or guarantee the ingredient composition, allergen absence (e.g., peanuts, tree nuts, shellfish, dairy, gluten, soy), or cross-contamination protocols of any establishment.</strong>
            Diners with severe allergies are advised to consult directly with restaurant floor managers before ordering.
          </p>
        </LegalCallout>
      </LegalSection>

      {/* Section 6 */}
      <LegalSection id="whatsapp-ordering" number="6" title="WhatsApp Ordering & Customer Transactions">
        <p>
          Where enabled, {APP_NAME} allows dining patrons to assemble a digital cart and transmit the order to the restaurant's designated WhatsApp number:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Direct Peer-to-Peer Communication:</strong> The transaction and subsequent dialogue take place strictly between the diner and the restaurant over WhatsApp.
          </li>
          <li>
            <strong>Payment Settlement:</strong> Any payments (whether cash on delivery, counter UPI, or payment links) are collected directly by the restaurant. {APP_NAME} does not act as an escrow agent, does not collect payment commissions on WhatsApp orders, and is not responsible for unpaid bills, table dispute walkouts, or rejected orders.
          </li>
          <li>
            <strong>Meta / WhatsApp Terms:</strong> Use of WhatsApp is governed by Meta's WhatsApp Terms of Service and Business Policies.
          </li>
        </ul>
      </LegalSection>

      {/* Section 7 */}
      <LegalSection id="ip-rights" number="7" title="Intellectual Property & Content Ownership">
        <h3 className="font-bold text-foreground text-sm pt-1">A. Restaurant Partner Content</h3>
        <p>
          You retain complete ownership of all trademarks, logos, dish photographs, descriptions, and brand assets that you upload to {APP_NAME} ("<strong>Merchant Content</strong>").
          By uploading Merchant Content, you grant {APP_NAME} a worldwide, non-exclusive, royalty-free license to host, display, resize, compress, and render such content on your digital menu, QR materials, and system previews for the purpose of operating the Services.
        </p>

        <h3 className="font-bold text-foreground text-sm pt-2">B. {APP_NAME} Platform Intellectual Property</h3>
        <p>
          {APP_NAME}, its logos, user interface designs, dynamic QR generation algorithms, visual layouts, vector template generators, software codebases, and documentation are the exclusive intellectual property of {APP_NAME} and its licensors.
          You may not reverse engineer, decompile, copy, frame, scrape, or resell the platform software without explicit prior written authorization.
        </p>
      </LegalSection>

      {/* Section 8 */}
      <LegalSection id="acceptable-use" number="8" title="Acceptable Use & Prohibited Conduct">
        <p>You agree not to use the Services to:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Upload obscene, defamatory, harassing, hateful, or pornographic text, images, or media.</li>
          <li>List counterfeit goods, unauthorized pharmaceuticals, prohibited narcotics, or illegal substances.</li>
          <li>Deploy QR codes linking to malicious URLs, phishing portals, spyware, or harmful executable scripts.</li>
          <li>Engage in automated scraping, denial of service (DoS) attacks, brute-force QR scanning, or rate-limit circumvention.</li>
          <li>Infringe upon any third party's trademark, copyright, privacy, or proprietary rights.</li>
        </ul>
        <p>
          Violation of these rules will result in immediate suspension or permanent termination of your restaurant menu without refund.
        </p>
      </LegalSection>

      {/* Section 9 */}
      <LegalSection id="billing-subscriptions" number="9" title="Subscription Plans, Invoices & Payments">
        <p>
          {APP_NAME} offers both free introductory tiers and paid subscription plans (Monthly, Annual, and Enterprise):
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Recurring Subscriptions:</strong> Paid plans renew automatically at the conclusion of each billing cycle unless cancelled prior to the renewal date via the dashboard or support request.
          </li>
          <li>
            <strong>Taxes:</strong> All fees are exclusive of applicable Goods and Services Tax (GST) or statutory sales taxes unless explicitly stated otherwise.
          </li>
          <li>
            <strong>Invoicing:</strong> Tax-compliant electronic invoices are generated and accessible within your account dashboard upon successful payment processing.
          </li>
          <li>
            <strong>Refunds:</strong> SaaS subscriptions are subject to our 7-Day First-Time Satisfaction Guarantee as detailed in our{" "}
            <a href="/refund" className="text-primary hover:underline font-bold">
              Cancellation & Refund Policy
            </a>
            .
          </li>
        </ul>
      </LegalSection>

      {/* Section 10 */}
      <LegalSection id="merchandise-terms" number="10" title="Physical Merchandise & Print Shop">
        <p>
          Orders for physical QR table stands, A3 matte wall posters, wooden tent cards, and vinyl sticker packs placed through the {APP_NAME} Print Shop are custom-manufactured with your restaurant's unique QR code and branding:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Custom Production:</strong> Because physical items are customized exclusively for your restaurant, print orders cannot be cancelled once manufacturing proofing has commenced.
          </li>
          <li>
            <strong>Delivery & Damage:</strong> In the rare event of transit damage or printing defects, we provide 100% free replacements within seven (7) days of delivery. Review our{" "}
            <a href="/shipping" className="text-primary hover:underline font-bold">
              Shipping & Delivery Policy
            </a>{" "}
            for complete courier terms.
          </li>
        </ul>
      </LegalSection>

      {/* Section 11 */}
      <LegalSection id="sla-availability" number="11" title="Service Availability & Maintenance">
        <p>
          We aim for 99.9% platform uptime to ensure your patrons can access menus without friction. However, we do not warrant that the Services will be 100% uninterrupted, error-free, or resilient against force majeure events, telecommunications outages, or cloud hosting provider downtime. Scheduled system maintenance is conducted during low-traffic hours with advance notice where feasible.
        </p>
      </LegalSection>

      {/* Section 12 */}
      <LegalSection id="disclaimers" number="12" title="Disclaimer of Warranties">
        <p className="uppercase text-xs font-semibold tracking-wide text-foreground">
          THE SERVICES ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, ACCURACY, AND NON-INFRINGEMENT.
        </p>
        <p>
          {APP_NAME} does not guarantee that the digital menu platform will increase your restaurant revenue, footfall, table turnaround speeds, or profitability.
        </p>
      </LegalSection>

      {/* Section 13 */}
      <LegalSection id="liability-cap" number="13" title="Limitation of Liability">
        <p className="uppercase text-xs font-semibold tracking-wide text-foreground">
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL {APP_NAME}, ITS DIRECTORS, EMPLOYEES, AFFILIATES, OR SUPPLIERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES (INCLUDING LOSS OF PROFITS, LOSS OF REPUTATION, LOSS OF DATA, FOOD SPOILAGE CLAIMS, OR CUSTOMER DISPUTES) ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE PLATFORM.
        </p>
        <p>
          In all circumstances, our maximum aggregate liability arising from or relating to this Agreement shall be limited to the total amount paid by you to {APP_NAME} in the twelve (12) months preceding the event giving rise to the claim, or INR ₹2,500, whichever is lower.
        </p>
      </LegalSection>

      {/* Section 14 */}
      <LegalSection id="indemnification" number="14" title="Indemnification">
        <p>
          You agree to defend, indemnify, and hold harmless {APP_NAME}, its officers, directors, contractors, and agents from and against any third-party claims, liabilities, damages, losses, and reasonable legal expenses arising from:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Your breach of any provision of these Terms.</li>
          <li>Any food safety claims, adulteration, food poisoning, or allergen reactions occurring at your restaurant premises.</li>
          <li>Your infringement of any third-party intellectual property rights through uploaded logos or images.</li>
          <li>Your violation of any applicable local, municipal, or food authority regulations.</li>
        </ul>
      </LegalSection>

      {/* Section 15 */}
      <LegalSection id="termination" number="15" title="Suspension & Account Termination">
        <p>
          You may terminate your account at any time by contacting our support desk. {APP_NAME} reserves the right to suspend or terminate your access immediately, without prior notice, if:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>You engage in fraudulent, abusive, or unlawful behavior.</li>
          <li>You fail to remediate non-payment of subscription dues after notice.</li>
          <li>We receive verified reports of copyright infringement or illegal menu listings.</li>
        </ul>
      </LegalSection>

      {/* Section 16 */}
      <LegalSection id="governing-law" number="16" title="Governing Law & Dispute Resolution">
        <p>
          These Terms and any dispute or claim arising out of them shall be governed by and construed in accordance with the laws of the <strong>Republic of India</strong>, without regard to conflict of law principles.
        </p>
        <p>
          Any legal action, suit, or proceeding arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts located in <strong>Bengaluru, Karnataka, India</strong>.
        </p>
      </LegalSection>

      {/* Section 17 */}
      <LegalSection id="contact-legal" number="17" title="Contact Information">
        <p>If you have any questions or require legal clarification regarding these Terms of Service, please contact us:</p>
        <div className="rounded-2xl border border-border/80 bg-muted/20 p-5 space-y-2 mt-2">
          <p className="font-bold text-foreground">{APP_NAME} Legal & Commercial Compliance</p>
          <p className="text-xs text-muted-foreground">Entity: Menuly Digital Technologies</p>
          <p className="text-xs text-muted-foreground">
            Email:{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline font-bold">
              {SUPPORT_EMAIL}
            </a>
          </p>
          <p className="text-xs text-muted-foreground">
            Official WhatsApp Desk:{" "}
            <a href={`https://wa.me/${SUPPORT_WHATSAPP}`} className="text-primary hover:underline font-semibold">
              +{SUPPORT_WHATSAPP}
            </a>
          </p>
          <p className="text-xs text-muted-foreground">Operating Hours: Monday – Saturday, 10:00 AM – 7:00 PM IST</p>
        </div>
      </LegalSection>
    </LegalLayout>
  );
}
