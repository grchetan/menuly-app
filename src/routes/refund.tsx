import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, LegalSection, LegalCallout } from "@/components/LegalLayout";
import { APP_NAME, SUPPORT_EMAIL, SUPPORT_WHATSAPP, whatsappLink } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Mail, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title: `Cancellation & Refund Policy — ${APP_NAME}` },
      {
        name: "description",
        content: `Official Cancellation, Return and Refund Policy for ${APP_NAME}. Clear terms for digital SaaS subscriptions, 7-day money-back guarantee, and custom physical QR table stand print orders.`,
      },
      { property: "og:title", content: `Cancellation & Refund Policy — ${APP_NAME}` },
      {
        property: "og:description",
        content: `Read the official cancellation, return, and refund terms for ${APP_NAME} software plans and physical QR shop merchandise.`,
      },
    ],
  }),
  component: RefundPolicyPage,
});

const TOC_ITEMS = [
  { id: "overview", title: "Overview & Scope" },
  { id: "subscription-cancellation", title: "SaaS Subscription Cancellation" },
  { id: "money-back-guarantee", title: "7-Day Money-Back Guarantee" },
  { id: "custom-print-shop", title: "Physical Print Shop & Hardware Goods" },
  { id: "damaged-goods", title: "Damaged, Defective or Misprinted Items" },
  { id: "refund-mode", title: "Refund Mode & Settlement Timelines" },
  { id: "how-to-claim", title: "How to Initiate a Cancellation or Refund" },
  { id: "contact-support", title: "Customer Support Desk" },
];

function RefundPolicyPage() {
  return (
    <LegalLayout
      title="Cancellation & Refund Policy"
      description={`We take immense pride in delivering top-tier digital menu software and luxury QR dining hardware. This policy outlines clear, transparent rules regarding cancellations, returns, and refunds.`}
      lastUpdated="October 22, 2026"
      readingTime="6 min read"
      toc={TOC_ITEMS}
    >
      {/* Intro Summary Callout */}
      <LegalCallout title="Quick Policy Summary" variant="success">
        <p>
          <strong>Digital Subscriptions:</strong> You can cancel your paid plan anytime. First-time subscribers enjoy a no-questions-asked <strong>7-Day Money-Back Guarantee</strong>.
          <br />
          <strong>Physical Print Merchandise:</strong> Because table stands and posters are custom-printed with your restaurant's unique QR code and logo, custom orders cannot be cancelled once printing commences. If items arrive damaged or misprinted, we provide <strong>100% free immediate reprints or full refunds</strong>.
        </p>
      </LegalCallout>

      {/* Section 1 */}
      <LegalSection id="overview" number="1" title="Overview & Scope">
        <p>
          This Cancellation & Refund Policy applies to all commercial transactions completed on {APP_NAME} (
          <a href="https://menuly.app" className="text-primary hover:underline font-medium">
            menuly.app
          </a>
          ), including recurring digital SaaS software plans (Pro, Business, Enterprise) and physical merchandise purchases (Acrylic Table Stands, Matte Wall Posters, Wooden Table Tents, Vinyl Sticker Packs) fulfilled via our Print Shop.
        </p>
      </LegalSection>

      {/* Section 2 */}
      <LegalSection id="subscription-cancellation" number="2" title="SaaS Subscription Cancellation">
        <p>
          You maintain complete freedom to cancel your recurring subscription at any time:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Self-Service Cancellation:</strong> You can submit a cancellation request anytime via your profile console or by emailing{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline font-bold">
              {SUPPORT_EMAIL}
            </a>
            .
          </li>
          <li>
            <strong>Access Through Paid Period:</strong> When you cancel a recurring plan, your premium features (custom QR styles, unlimited categories, high-resolution vector exports) remain active until the final day of your current paid billing period.
          </li>
          <li>
            <strong>No Surprise Re-billing:</strong> Once a cancellation request is acknowledged, no further automatic renewal charges will be debited from your payment method.
          </li>
          <li>
            <strong>Menu Preservation:</strong> Cancelling a paid plan does not delete your menu data. Your account is simply transitioned to our free tier, ensuring your diners never experience broken links.
          </li>
        </ul>
      </LegalSection>

      {/* Section 3 */}
      <LegalSection id="money-back-guarantee" number="3" title="7-Day Money-Back Guarantee">
        <p>
          We want you to be completely satisfied with {APP_NAME}. For all <strong>first-time paid subscribers</strong>, we offer an unconditional <strong>7-Day Money-Back Guarantee</strong>:
        </p>
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2 mt-2">
          <p className="text-xs font-bold text-foreground">Terms of the 7-Day Guarantee:</p>
          <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
            <li>The refund request must be lodged within seven (7) calendar days of the initial subscription charge.</li>
            <li>Applies exclusively to your initial subscription purchase (not subsequent monthly or annual renewals).</li>
            <li>Upon processing, the full subscription amount charged will be returned to your original payment method.</li>
          </ul>
        </div>
      </LegalSection>

      {/* Section 4 */}
      <LegalSection id="custom-print-shop" number="4" title="Physical Print Shop & Hardware Goods">
        <p>
          Products listed in the {APP_NAME} Print Shop (such as acrylic QR stands, table cards, and vinyl sticker packs) are <strong>bespoke, customized merchandise</strong> fabricated specifically for your restaurant, complete with your unique QR code, table numbers, and brand logo:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Pre-Production Cancellation:</strong> You may cancel a physical order free of charge within two (2) hours of placement by contacting our WhatsApp desk.
          </li>
          <li>
            <strong>Post-Production Policy:</strong> Once our automated printing engines have generated the custom acrylic or vinyl print runs, orders cannot be cancelled or returned for buyer's remorse, closure of restaurant, or change of aesthetic preference.
          </li>
        </ul>
      </LegalSection>

      {/* Section 5 */}
      <LegalSection id="damaged-goods" number="5" title="Damaged, Defective or Misprinted Items">
        <p>
          We hold our printing and fabrication partners to the highest craftsmanship standards. If your physical merchandise arrives in any of the following conditions:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Broken, cracked, or scratched acrylic table stands caused during transit.</li>
          <li>QR code printing defect that prevents camera barcode scanners from reading the link.</li>
          <li>Typographical or color distortion not matching your uploaded brand assets.</li>
          <li>Missing items or incorrect table number sequence.</li>
        </ul>

        <div className="mt-3 p-4 rounded-xl border border-border bg-card">
          <p className="text-xs font-bold text-foreground">Our 100% Replacement Guarantee:</p>
          <p className="text-xs text-muted-foreground mt-1">
            Simply notify us within <strong>seven (7) calendar days</strong> of parcel delivery with a photograph or video showing the defect. We will immediately dispatch a <strong>priority replacement batch at zero additional cost</strong>, or process a 100% refund if you prefer.
          </p>
        </div>
      </LegalSection>

      {/* Section 6 */}
      <LegalSection id="refund-mode" number="6" title="Refund Mode & Settlement Timelines">
        <p>
          All approved refunds are settled electronically back to the original source account utilized during checkout:
        </p>
        <div className="grid gap-3 sm:grid-cols-3 pt-1">
          <div className="rounded-xl border border-border/80 bg-background/50 p-3.5 text-center space-y-1">
            <p className="font-bold text-xs text-foreground">UPI Payments</p>
            <p className="text-xs text-muted-foreground">Credited within <strong>24 to 48 hours</strong> directly to your linked bank account or VPA.</p>
          </div>
          <div className="rounded-xl border border-border/80 bg-background/50 p-3.5 text-center space-y-1">
            <p className="font-bold text-xs text-foreground">Credit / Debit Cards</p>
            <p className="text-xs text-muted-foreground">Processed in <strong>5 to 7 business days</strong> depending on your card-issuing bank's cycle.</p>
          </div>
          <div className="rounded-xl border border-border/80 bg-background/50 p-3.5 text-center space-y-1">
            <p className="font-bold text-xs text-foreground">Netbanking / Wallets</p>
            <p className="text-xs text-muted-foreground">Reflected within <strong>3 to 5 business days</strong> through our payment gateway partner.</p>
          </div>
        </div>
      </LegalSection>

      {/* Section 7 */}
      <LegalSection id="how-to-claim" number="7" title="How to Initiate a Cancellation or Refund">
        <p>
          To request a cancellation, return, or refund, follow these simple steps:
        </p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            Send an email to{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline font-bold">
              {SUPPORT_EMAIL}
            </a>{" "}
            with the subject line: <code>[Refund Request] - [Your Restaurant Name / Order ID]</code>.
          </li>
          <li>
            Specify your registered account email, date of transaction, and reason for the refund request.
          </li>
          <li>
            For damaged physical merchandise, attach 2–3 clear photographs highlighting the parcel packaging and defective item.
          </li>
        </ol>
        <p className="pt-1">
          Our finance desk evaluates all refund claims within <strong>24 business hours</strong> and issues an electronic confirmation along with the bank reference ARN number.
        </p>
      </LegalSection>

      {/* Section 8 */}
      <LegalSection id="contact-support" number="8" title="Customer Support Desk">
        <p>For urgent questions regarding billing, order status, or payment queries, reach us directly:</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild variant="outline" className="gap-2 font-bold text-xs rounded-xl">
            <a href={`mailto:${SUPPORT_EMAIL}`}>
              <Mail className="size-4 text-primary" /> {SUPPORT_EMAIL}
            </a>
          </Button>
          <Button asChild variant="whatsapp" className="gap-2 font-bold text-xs rounded-xl">
            <a href={whatsappLink(SUPPORT_WHATSAPP, "Hi Menuly team, I have a billing/refund query.")} target="_blank" rel="noreferrer">
              <MessageCircle className="size-4" /> WhatsApp Billing Desk (+{SUPPORT_WHATSAPP})
            </a>
          </Button>
        </div>
      </LegalSection>
    </LegalLayout>
  );
}
