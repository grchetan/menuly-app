import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, LegalSection, LegalCallout } from "@/components/LegalLayout";
import { APP_NAME, SUPPORT_EMAIL, SUPPORT_WHATSAPP } from "@/lib/config";
import { Truck, CheckCircle2, ShieldCheck, Clock } from "lucide-react";

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: `Shipping & Delivery Policy — ${APP_NAME}` },
      {
        name: "description",
        content: `Official Shipping and Delivery Policy for ${APP_NAME}. Learn about manufacturing timelines, domestic courier partners, dispatch tracking, and delivery timelines for custom QR table stands and restaurant merchandise.`,
      },
      { property: "og:title", content: `Shipping & Delivery Policy — ${APP_NAME}` },
      {
        property: "og:description",
        content: `Read the official shipping timelines and logistics guidelines for ${APP_NAME} custom physical QR merchandise.`,
      },
    ],
  }),
  component: ShippingPolicyPage,
});

const TOC_ITEMS = [
  { id: "delivery-types", title: "Types of Deliverables (Digital vs Physical)" },
  { id: "production-time", title: "Manufacturing & Print Lead Times" },
  { id: "shipping-timelines", title: "Domestic Delivery Timelines (Pan-India)" },
  { id: "courier-partners", title: "Trusted Logistics Partners" },
  { id: "shipping-charges", title: "Shipping Charges & Free Delivery Thresholds" },
  { id: "order-tracking", title: "Live Tracking & Dispatch Updates" },
  { id: "delivery-failures", title: "Incorrect Addresses & Re-delivery" },
  { id: "transit-damage", title: "Transit Damage & Lost Packages" },
  { id: "international-orders", title: "International Shipping" },
  { id: "shipping-contact", title: "Logistics Support Contact" },
];

function ShippingPolicyPage() {
  return (
    <LegalLayout
      title="Shipping & Delivery Policy"
      description={`Everything you need to know regarding dispatch timelines, domestic courier delivery, parcel tracking, and packaging standards for ${APP_NAME} physical restaurant products.`}
      lastUpdated="October 22, 2026"
      readingTime="5 min read"
      toc={TOC_ITEMS}
    >
      {/* Intro Summary Callout */}
      <LegalCallout title="Instant Digital vs Custom Physical Fulfillment" variant="info">
        <p>
          <strong>Digital Products:</strong> All digital menus, vector QR codes, table stand templates, and analytics are activated <strong>instantly</strong> upon account creation or upgrade.
          <br />
          <strong>Physical Print Merchandise:</strong> High-durability acrylic table stands, matte posters, and sticker packs are custom fabricated and delivered across India within <strong>2 to 5 business days</strong>.
        </p>
      </LegalCallout>

      {/* Section 1 */}
      <LegalSection id="delivery-types" number="1" title="Types of Deliverables (Digital vs Physical)">
        <p>
          At {APP_NAME}, we offer both virtual SaaS utilities and physical dining room hardware:
        </p>
        <div className="grid gap-4 sm:grid-cols-2 pt-2">
          <div className="rounded-2xl border border-border/80 bg-background/50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Clock className="size-4" /> Instant Digital Delivery
            </div>
            <p className="text-xs text-muted-foreground">
              Includes your hosted digital menu URL, high-resolution vector QR code downloads (PNG, SVG, PDF), real-time dish management, and QR studio customizations. These are delivered electronically in real time with zero transit delay.
            </p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-background/50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-accent font-bold text-xs uppercase tracking-wider">
              <Truck className="size-4" /> Custom Physical Merchandise
            </div>
            <p className="text-xs text-muted-foreground">
              Includes laser-cut clear acrylic table stands, A3/A4 matte wall posters, vinyl waterproof table stickers, and wooden table tents ordered from our Print Shop. These require precision print proofing and courier transit.
            </p>
          </div>
        </div>
      </LegalSection>

      {/* Section 2 */}
      <LegalSection id="production-time" number="2" title="Manufacturing & Print Lead Times">
        <p>
          Because every physical piece is customized with your unique restaurant brand logo, exact table numbering sequence, and color-matched QR code, items are manufactured upon order confirmation:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Digital Proofing & Print Queue:</strong> 12 to 24 hours. Our automated print pipeline verifies QR readability and vector alignment.
          </li>
          <li>
            <strong>Laser Cutting & UV Printing:</strong> 24 hours. Acrylic stands undergo high-durability UV curing to resist restaurant water spills and frequent cleaning wipes.
          </li>
          <li>
            <strong>Total Dispatch Window:</strong> All physical orders are packaged and handed to courier logistics partners within <strong>1 to 2 business days</strong> of payment verification.
          </li>
        </ul>
      </LegalSection>

      {/* Section 3 */}
      <LegalSection id="shipping-timelines" number="3" title="Domestic Delivery Timelines (Pan-India)">
        <p>
          We ship across all pin codes in India through expedited surface and air courier networks:
        </p>
        <div className="grid gap-3 sm:grid-cols-3 pt-1">
          <div className="rounded-xl border border-border/80 bg-background/50 p-4 text-center space-y-1">
            <p className="font-bold text-xs text-foreground">Tier-1 Metro Cities</p>
            <p className="text-primary font-extrabold text-base">2 – 3 Days</p>
            <p className="text-[11px] text-muted-foreground">Delhi NCR, Bengaluru, Mumbai, Pune, Hyderabad, Chennai, Kolkata</p>
          </div>
          <div className="rounded-xl border border-border/80 bg-background/50 p-4 text-center space-y-1">
            <p className="font-bold text-xs text-foreground">Tier-2 & Tier-3 Cities</p>
            <p className="text-primary font-extrabold text-base">3 – 5 Days</p>
            <p className="text-[11px] text-muted-foreground">State capitals, major industrial hubs, and district headquarters</p>
          </div>
          <div className="rounded-xl border border-border/80 bg-background/50 p-4 text-center space-y-1">
            <p className="font-bold text-xs text-foreground">Remote & North-East</p>
            <p className="text-primary font-extrabold text-base">5 – 7 Days</p>
            <p className="text-[11px] text-muted-foreground">Rural districts, Jammu & Kashmir, and North-Eastern states</p>
          </div>
        </div>
      </LegalSection>

      {/* Section 4 */}
      <LegalSection id="courier-partners" number="4" title="Trusted Logistics Partners">
        <p>
          To ensure damage-free transit and guaranteed delivery, we partner exclusively with verified domestic logistics operators:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Blue Dart Express</strong> (Priority Air Cargo)</li>
          <li><strong>Delhivery Surface & Express</strong></li>
          <li><strong>DTDC Courier & Cargo</strong></li>
          <li><strong>India Post Speed Post</strong> (for remote rural pin codes)</li>
        </ul>
      </LegalSection>

      {/* Section 5 */}
      <LegalSection id="shipping-charges" number="5" title="Shipping Charges & Free Delivery Thresholds">
        <p>
          We believe in straightforward, transparent pricing without hidden checkout surcharges:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Standard Shipping:</strong> A flat shipping fee of ₹79 is applied to orders below ₹999.
          </li>
          <li>
            <strong>Free Shipping:</strong> All print shop merchandise orders with a cart value of <strong>₹999 or above</strong> qualify for 100% Free Pan-India Delivery.
          </li>
          <li>
            <strong>Bulk / Multi-Location Orders:</strong> Restaurant franchises ordering for multiple outlets can request consolidated freight shipping with custom logistics handling.
          </li>
        </ul>
      </LegalSection>

      {/* Section 6 */}
      <LegalSection id="order-tracking" number="6" title="Live Tracking & Dispatch Updates">
        <p>
          As soon as your shipment is picked up from our fabrication hub, you will receive:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>An automated dispatch notification via <strong>WhatsApp</strong> and <strong>Email</strong>.</li>
          <li>Your unique Air Waybill (AWB) tracking number with a direct one-click live tracking link.</li>
          <li>Real-time SMS updates on the morning of scheduled delivery.</li>
        </ul>
      </LegalSection>

      {/* Section 7 */}
      <LegalSection id="delivery-failures" number="7" title="Incorrect Addresses & Re-delivery">
        <p>
          Our courier partners make up to <strong>three (3) delivery attempts</strong> before returning a parcel to our central warehouse. To avoid delays:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Ensure your restaurant address includes landmark references, floor numbers, and an accurate 6-digit PIN code.</li>
          <li>Keep your registered restaurant phone or manager WhatsApp reachable for delivery executive calls.</li>
          <li>If an order is returned due to incorrect address information provided by the customer, a nominal re-shipping fee may apply.</li>
        </ul>
      </LegalSection>

      {/* Section 8 */}
      <LegalSection id="transit-damage" number="8" title="Transit Damage & Lost Packages">
        <p>
          All {APP_NAME} acrylic stands and table cards are packed in multi-layer shockproof bubble wraps and corrugated heavy-gauge boxes. In the unlikely event that your parcel sustains transit damage:
        </p>
        <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-1 mt-2">
          <p className="text-xs font-bold text-foreground">Zero-Risk Transit Guarantee:</p>
          <p className="text-xs text-muted-foreground">
            Contact us within <strong>seven (7) days</strong> of receipt with a photo of the cracked stand or parcel. We will immediately dispatch a priority replacement batch via express courier at zero extra charge to you.
          </p>
        </div>
      </LegalSection>

      {/* Section 9 */}
      <LegalSection id="international-orders" number="9" title="International Shipping">
        <p>
          Currently, our physical Print Shop caters primarily to food and beverage venues located within the Republic of India. Restaurant partners situated in UAE, Southeast Asia, or Europe who desire custom physical stands may contact our enterprise team for bespoke DHL / FedEx international shipping quotations.
        </p>
      </LegalSection>

      {/* Section 10 */}
      <LegalSection id="shipping-contact" number="10" title="Logistics Support Contact">
        <p>Have an urgent delivery enquiry or need to update your restaurant address before dispatch?</p>
        <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 space-y-1.5 mt-2">
          <p className="font-bold text-xs text-foreground">{APP_NAME} Logistics Desk</p>
          <p className="text-xs text-muted-foreground">
            Email:{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline font-bold">
              {SUPPORT_EMAIL}
            </a>
          </p>
          <p className="text-xs text-muted-foreground">
            WhatsApp Logistics Line:{" "}
            <a href={`https://wa.me/${SUPPORT_WHATSAPP}`} className="text-primary hover:underline font-semibold">
              +{SUPPORT_WHATSAPP}
            </a>
          </p>
          <p className="text-xs text-muted-foreground">Hours: Monday to Saturday, 10:00 AM – 7:00 PM IST</p>
        </div>
      </LegalSection>
    </LegalLayout>
  );
}
