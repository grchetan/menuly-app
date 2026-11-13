import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  ShoppingCart,
  Package,
  Truck,
  CheckCircle2,
  Star,
  ShieldCheck,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Clock,
  Sparkles,
  MapPin,
  Phone,
  User,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  Lock,
  Eye,
  AlertCircle,
  ShoppingBag,
  ExternalLink,
  RefreshCw,
  Search,
  MessageSquare,
  QrCode,
  Tag,
  Award,
  Zap,
  Info,
  Heart,
  Share2,
  Copy,
  CreditCard,
  Building2,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { SitePage } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import stand from "@/assets/shop-stand.png";
import poster from "@/assets/shop-poster.png";
import sticker from "@/assets/shop-sticker.png";
import type {
  ShopProduct,
  ShopOrder,
  ShopReview,
  ShopCartItem,
  ShopOrderStatus,
  ShopPaymentMode,
  ShopPaymentSession,
} from "@/lib/shop-types";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Restaurant Merch & QR Print Shop | Menuly" },
      {
        name: "description",
        content:
          "Professional acrylic table stands, wall posters, and vinyl QR stickers custom printed with your restaurant branding and live digital menu QR code. Cash on Delivery and Kotak UPI available.",
      },
      { property: "og:title", content: "Menuly Merch & QR Print Shop" },
      {
        property: "og:description",
        content:
          "High quality printed QR merchandise for restaurants & cafes. Cash on delivery & Kotak UPI with flat ₹80 delivery fee across India.",
      },
    ],
  }),
  component: ShopPublic,
});

// Flat ₹80 Courier Delivery Fee Pan-India
export const FLAT_DELIVERY_FEE = 80;

// Official Kotak Mahindra Bank Merchant Details
export const KOTAK_UPI_ID = "9179878521@kotakbank";
export const KOTAK_ACCOUNT_NAME = "Menuly India";

// 100% Offline Locally Generated Vector SVG UPI QR Code
function LocalUpiQrCode({ upiUri }: { upiUri: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    if (typeof window === "undefined" || !containerRef.current) return;

    setLoading(true);
    import("qr-code-styling")
      .then(({ default: QRCodeStyling }) => {
        if (!alive || !containerRef.current) return;
        containerRef.current.innerHTML = "";

        const qr = new QRCodeStyling({
          width: 176,
          height: 176,
          type: "svg",
          data: upiUri,
          margin: 4,
          qrOptions: {
            typeNumber: 0,
            mode: "Byte",
            errorCorrectionLevel: "M",
          },
          dotsOptions: {
            color: "#0a0a0a",
            type: "square",
          },
          backgroundOptions: {
            color: "#ffffff",
          },
          cornersSquareOptions: {
            color: "#0a0a0a",
            type: "square",
          },
          cornersDotOptions: {
            color: "#0a0a0a",
            type: "square",
          },
        });

        qr.append(containerRef.current);
        setLoading(false);
      })
      .catch(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [upiUri]);

  return (
    <div className="relative mx-auto w-44 h-44 sm:w-48 sm:h-48 border border-neutral-300 p-1.5 bg-white flex flex-col items-center justify-center shadow-xs">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
          <RefreshCw className="size-5 animate-spin text-neutral-400" />
          <span className="text-[10px] text-neutral-400 mt-1">Generating QR...</span>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full" />
    </div>
  );
}

// Reusable Order Card with Prepaid/Postpaid & 4-Step Tracker
function ShopOrderCard({
  order,
  products,
  onPayUpi,
  onReview,
  onCheckStatus,
}: {
  order: ShopOrder;
  products: ShopProduct[];
  onPayUpi: (order: ShopOrder) => void;
  onReview: (productId: string, orderId: string) => void;
  onCheckStatus?: (order: ShopOrder) => void;
}) {
  const stepIndex =
    order.status === "DELIVERED"
      ? 3
      : order.status === "SHIPPED"
      ? 2
      : order.status === "PROCESSING"
      ? 1
      : 0;

  return (
    <div className="border border-neutral-300 p-4 space-y-3 bg-white text-xs text-neutral-800 shadow-xs">
      {/* Header: Order #, Date, Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-2.5">
        <div>
          <span className="font-mono text-sm font-bold text-neutral-900 block">
            #{order.orderNumber}
          </span>
          <span className="text-[10px] text-neutral-500">
            Placed on{" "}
            {new Date(order.createdAt).toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "px-2.5 py-1 text-[10px] font-bold uppercase rounded-none border",
              order.status === "DELIVERED"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : order.status === "SHIPPED"
                ? "bg-purple-50 text-purple-800 border-purple-200"
                : order.status === "PROCESSING"
                ? "bg-blue-50 text-blue-800 border-blue-200"
                : order.status === "CANCELLED"
                ? "bg-red-50 text-red-800 border-red-200"
                : "bg-neutral-100 text-neutral-800 border-neutral-300"
            )}
          >
            {order.status === "PROCESSING"
              ? "Printing & Customizing"
              : order.status === "SHIPPED"
              ? "In Transit (Shipped)"
              : order.status}
          </span>
        </div>
      </div>

      {/* Payment Details Box (Clear distinction: Prepaid vs COD Postpaid) */}
      {order.paymentMode === "UPI" ? (
        order.paymentStatus === "PAID" ? (
          <div className="flex items-start gap-2.5 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900">
            <CheckCircle2 className="size-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block">PREPAID ORDER — PAID VIA KOTAK UPI (₹{order.grandTotal})</span>
              <p className="text-[10px] text-emerald-700 mt-0.5">
                Payment verified &amp; settled directly into Kotak Bank account.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 bg-amber-50 border border-amber-200 text-amber-900">
            <div className="flex items-start gap-2">
              <Clock className="size-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">PREPAID ORDER — PAYMENT PENDING (₹{order.grandTotal})</span>
                <p className="text-[10px] text-amber-700 mt-0.5">
                  Order saved. Scan Kotak QR or check bank confirmation to complete.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onPayUpi(order)}
                className="bg-neutral-900 hover:bg-black text-white px-3 py-1.5 text-xs font-bold uppercase rounded-none cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CreditCard className="size-3.5" /> Open QR &amp; Pay
              </button>
              {onCheckStatus && (
                <button
                  type="button"
                  onClick={() => onCheckStatus(order)}
                  className="border border-neutral-300 hover:bg-neutral-100 text-neutral-800 px-2.5 py-1.5 text-xs font-bold uppercase rounded-none cursor-pointer flex items-center justify-center gap-1"
                  title="Check Payment Status with Bank"
                >
                  <RefreshCw className="size-3 text-neutral-600" /> Check
                </button>
              )}
            </div>
          </div>
        )
      ) : (
        <div className="flex items-start gap-2.5 p-2.5 bg-neutral-100 border border-neutral-200 text-neutral-800">
          <Truck className="size-4 text-neutral-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">CASH ON DELIVERY (POSTPAID)</span>
            <p className="text-[10px] text-neutral-600 mt-0.5">
              Please pay <strong>₹{order.grandTotal}</strong> in cash to the delivery partner upon arrival at your doorstep.
            </p>
          </div>
        </div>
      )}

      {/* 4-Step Delivery Progress Line */}
      <div className="py-2 border-y border-neutral-100">
        <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
          {["Placed", "Custom Printing", "Shipped", "Delivered"].map((st, idx) => {
            const isDone = idx <= stepIndex;
            const isCurrent = idx === stepIndex;
            return (
              <div key={st} className="flex flex-col items-center">
                <div
                  className={cn(
                    "size-5 rounded-full flex items-center justify-center text-[10px] font-bold mb-1",
                    isDone
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-200 text-neutral-500",
                    isCurrent && "ring-2 ring-neutral-900 ring-offset-1"
                  )}
                >
                  {idx + 1}
                </div>
                <span className={cn("font-medium", isDone ? "text-neutral-900 font-bold" : "text-neutral-400")}>
                  {st}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Courier & Tracking (if shipped) */}
      {(order.courierPartner || order.trackingNumber) && (
        <div className="flex items-center justify-between p-2 bg-neutral-50 border border-neutral-200 text-xs">
          <span>
            <strong>Courier Partner:</strong> {order.courierPartner || "Express Courier"}
          </span>
          {order.trackingNumber && (
            <div className="flex items-center gap-1">
              <span className="text-neutral-500">Tracking:</span>
              <span className="font-mono font-bold bg-white px-2 py-0.5 border text-neutral-900 select-all">
                {order.trackingNumber}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Delivery Address */}
      <div className="text-[11px] text-neutral-600 space-y-0.5">
        <p>
          <strong>Delivery To:</strong> {order.shippingAddress.fullName} ({order.shippingAddress.phone})
        </p>
        <p>
          {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
          {order.shippingAddress.landmark ? ` (Landmark: ${order.shippingAddress.landmark})` : ""}
        </p>
      </div>

      {/* Ordered Items List */}
      <div className="border-t border-neutral-100 pt-2 space-y-1.5">
        <p className="text-[11px] font-bold uppercase text-neutral-500">Items Ordered ({order.items.length})</p>
        {order.items.map((it) => (
          <div key={it.productId} className="flex items-center justify-between py-1 border-b border-neutral-100 last:border-0">
            <span className="font-medium truncate max-w-[220px]">
              {it.productName} × {it.quantity}
            </span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-neutral-900">₹{it.price * it.quantity}</span>
              {order.status === "DELIVERED" ? (
                <button
                  type="button"
                  onClick={() => onReview(it.productId, order.id)}
                  className="bg-[#c5221f] text-white px-2.5 py-0.5 text-[10px] font-bold uppercase hover:bg-[#a91b18] cursor-pointer"
                >
                  ★ Review
                </button>
              ) : null}
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between pt-1 text-xs font-bold text-neutral-900">
          <span>Grand Total (incl. ₹80 Delivery):</span>
          <span>₹{order.grandTotal}</span>
        </div>
      </div>
    </div>
  );
}

const INITIAL_FALLBACK_PRODUCTS: (ShopProduct & { sku: string })[] = [
  {
    id: "stand-acrylic",
    sku: "MNL-STAND-01",
    name: "Acrylic Table Stand (A6 Double-Sided)",
    description:
      "Clear premium optical-grade cast acrylic stand holding your QR menu at dining table height. Wipes clean, stands sturdy under high-speed ceiling fans, looks ultra elegant on every dining table.",
    price: 499,
    originalPrice: 799,
    badge: "MOST POPULAR",
    image: "/assets/shop-stand.png",
    inStock: true,
    rating: 0,
    reviewsCount: 0,
    features: [
      "3mm Optical-Grade Cast Acrylic Sheet",
      "UV & Water Resistant Laser Printed Insert",
      "Heavyweight Anti-Tumble T-Shape Base",
      "Sanitizer & Alcohol Spray Proof Finish",
      "Pre-tested for Instant Camera & QR App Scanning",
    ],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "poster-a3",
    sku: "MNL-POSTER-02",
    name: "Wall Poster (A3 Matte Velvet)",
    description:
      "Matte-finish A3 poster printed with your high-res vector QR code, restaurant logo, and tagline. Perfect for restaurant entrances, billing counters, and takeaway pickup lines.",
    price: 349,
    originalPrice: 499,
    badge: "HIGH VISIBILITY",
    image: "/assets/shop-poster.png",
    inStock: true,
    rating: 0,
    reviewsCount: 0,
    features: [
      "300 GSM Heavy-Duty Non-Tearable Cardstock",
      "Anti-Glare Spotlight-Resistant Satin Lamination",
      "Custom Restaurant Brand Logo & Tagline Header",
      "Pre-Applied 3M High-Bond Foam Mounting Tape",
      "Long-Range Scanning up to 8-10 Feet Distance",
    ],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "stickers-pack",
    sku: "MNL-STICK-03",
    name: "QR Vinyl Sticker Pack (12 Pcs)",
    description:
      "Weather-proof vinyl stickers for dining tables, glass partitions, cash counters, and takeout food packaging. High-tack adhesive that peels off cleanly without gummy residue.",
    price: 249,
    originalPrice: 399,
    badge: "PACK OF 12",
    image: "/assets/shop-sticker.png",
    inStock: true,
    rating: 0,
    reviewsCount: 0,
    features: [
      "150-Micron Polymeric Waterproof Vinyl",
      "Gloss Protective UV-Shield Lamination",
      "12 Individual Precision Die-Cut Scannable Stickers",
      "Safe for Daily Sanitizer, Hot Curries & Beverage Spills",
      "Clean Removal with Zero Sticky Surface Residue",
    ],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "tent-wooden",
    sku: "MNL-TENT-04",
    name: "Folded Wooden Table Tent (Artisan A-Frame)",
    description:
      "Double-sided premium wooden tent card featuring your restaurant branding on one side and a scannable digital QR menu on the other. Rustic cafe & fine-dine aesthetic.",
    price: 399,
    originalPrice: 599,
    badge: "ECO-FRIENDLY",
    image: "/assets/shop-stand.png",
    inStock: true,
    rating: 0,
    reviewsCount: 0,
    features: [
      "Moisture-Sealed Sustainable Hardwood Core",
      "Dual-Sided A-Frame Self-Standing Design",
      "Rustic Natural Woodgrain Fine-Dine Aesthetics",
      "Compact Space-Saving Dining Table Footprint",
      "Stable Weighted Core Unaffected by High Ceiling Fans",
    ],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

// Rich Product Guides for the Full Page View
const PRODUCT_RICH_GUIDES: Record<
  string,
  {
    sku: string;
    tagline: string;
    whatsInside: string[];
    specs: { label: string; value: string }[];
    howToUse: { step: number; title: string; desc: string }[];
  }
> = {
  "stand-acrylic": {
    sku: "MNL-STAND-01",
    tagline: "Crystal-Clear Cast Acrylic Table Display with Custom Laser-Printed Vector QR Insert",
    whatsInside: [
      "1x High-grade 3mm optical cast acrylic self-standing display",
      "1x Custom dual-sided UV laser printed restaurant QR insert",
      "1x Anti-scratch protective transit peel film",
      "1x Restaurant setup & instant scan instruction card",
    ],
    specs: [
      { label: "Material", value: "3mm Optical-Grade Cast Acrylic" },
      { label: "Dimensions", value: "A6 Size (105mm × 148mm)" },
      { label: "Base Design", value: "T-Shape Anti-Tumble Heavyweight Foot" },
      { label: "Print Finish", value: "UV-Cured Direct Micro-Pigment Ink" },
      { label: "Waterproof", value: "100% Sanitizer & Spray Proof" },
      { label: "Compatibility", value: "iOS Camera, Android Camera, Google Lens, Paytm, PhonePe" },
    ],
    howToUse: [
      {
        step: 1,
        title: "Unpack Pre-Assembled Stand",
        desc: "Each stand arrives carefully packaged with your high-res vector QR menu insert already inserted inside.",
      },
      {
        step: 2,
        title: "Place at Center of Dining Tables",
        desc: "Place one acrylic stand on each table or billing desk at comfortable eye-level height.",
      },
      {
        step: 3,
        title: "Guests Scan & Order",
        desc: "Diners open their phone camera, scan the code, and browse dishes with zero app download.",
      },
      {
        step: 4,
        title: "Wipe Clean Daily",
        desc: "Wipe down with damp cloth or sanitizer spray between guests — ink will never smear or fade.",
      },
    ],
  },
  "poster-a3": {
    sku: "MNL-POSTER-02",
    tagline: "High-Visibility Matte Entrance & Counter QR Poster with Restaurant Branding",
    whatsInside: [
      "1x Heavyweight 300 GSM velvet matte A3 poster",
      "4x Pre-applied 3M high-bond double-sided foam mounting tape pads",
      "1x High-durability waterproof postal delivery tube",
    ],
    specs: [
      { label: "Cardstock", value: "300 GSM Heavyweight Velvet Matte Cardstock" },
      { label: "Dimensions", value: "A3 Size (297mm × 420mm)" },
      { label: "Lamination", value: "Anti-Glare Spotlight Resistant Satin Coating" },
      { label: "Mounting Tape", value: "Dual-Sided 3M High-Bonding Foam Tape Included" },
      { label: "Scan Range", value: "Long-Range Scanning up to 8–10 Feet Away" },
      { label: "Usage", value: "Indoor / Covered Entrance, Counter & Waiting Areas" },
    ],
    howToUse: [
      {
        step: 1,
        title: "Select High-Footfall Area",
        desc: "Ideal for restaurant entryways, pillar walls, pickup counters, or waiting line areas.",
      },
      {
        step: 2,
        title: "Peel Protective Tape",
        desc: "Peel off the protective film from the pre-applied 3M foam tape on the reverse side.",
      },
      {
        step: 3,
        title: "Press Firmly at Eye-Level",
        desc: "Mount approximately 5 feet from the floor for comfortable scanning while diners stand.",
      },
      {
        step: 4,
        title: "Clear Walk-In Queues",
        desc: "Walk-in customers scan from a distance to decide their orders before reaching the cashier.",
      },
    ],
  },
  "stickers-pack": {
    sku: "MNL-STICK-03",
    tagline: "12-Pack Heavy Duty Weather-Proof Vinyl Die-Cut QR Stickers",
    whatsInside: [
      "12x Individual die-cut scannable QR vinyl stickers",
      "1x Table numbering guide sheet",
      "1x Surface preparation alcohol wipe",
    ],
    specs: [
      { label: "Vinyl Grade", value: "150-Micron Polymeric Waterproof Vinyl" },
      { label: "Pack Quantity", value: "12 Individual Die-Cut Stickers" },
      { label: "Adhesive Type", value: "High-Tack Permanent Acrylic Adhesive" },
      { label: "Residue Free", value: "Removes Cleanly with Heat, No Gummy Residue" },
      { label: "Durability", value: "Waterproof, Oil-Proof, Heat-Proof for 3+ Years" },
      { label: "Surfaces", value: "Wood, Glass, Stainless Steel, Marble & Packaging" },
    ],
    howToUse: [
      {
        step: 1,
        title: "Clean Table Surface",
        desc: "Wipe table corner or window glass with dry cloth to remove loose dust or oil.",
      },
      {
        step: 2,
        title: "Peel Vinyl Sticker",
        desc: "Peel the die-cut sticker smoothly from its silicone release backing.",
      },
      {
        step: 3,
        title: "Apply Smoothly",
        desc: "Press firmly from one edge to the other to ensure zero air bubbles underneath.",
      },
      {
        step: 4,
        title: "Withstands Daily Spills",
        desc: "Safe for hot curries, iced drinks, dishwashing liquid, and disinfectant wipes.",
      },
    ],
  },
  "tent-wooden": {
    sku: "MNL-TENT-04",
    tagline: "Eco-Friendly Rustic Engineered Wooden Table Tent with Dual-Sided Engraved QR",
    whatsInside: [
      "1x Moisture-sealed engineered hardwood A-frame tent card",
      "1x Dual-sided scannable QR and branding panel",
      "1x Protective linen shipping pouch",
    ],
    specs: [
      { label: "Core Material", value: "Sustainable Hardwood Engineered Core" },
      { label: "Style", value: "Self-Standing Dual-Sided A-Frame Tent" },
      { label: "Finish", value: "Natural Wood Grain with Matte Protective Seal" },
      { label: "Best Suited For", value: "Artisan Cafes, Fine Dining, Bakeries & Craft Bistros" },
      { label: "Fan Resistance", value: "Solid Weight Keeps Tent Steady Under High Ceiling Fans" },
      { label: "Footprint", value: "Ultra Compact Space-Saving Table Base" },
    ],
    howToUse: [
      {
        step: 1,
        title: "Place on Cafe Tables",
        desc: "Complements wooden and marble table setups with a natural, organic look.",
      },
      {
        step: 2,
        title: "Dual-Sided Scanning",
        desc: "Diners sitting on opposite sides can scan simultaneously without picking up the card.",
      },
      {
        step: 3,
        title: "Branded Social & WiFi",
        desc: "Features your logo, live QR menu, and optional restaurant Instagram handle.",
      },
      {
        step: 4,
        title: "Long Lasting Construction",
        desc: "Moisture-sealed engineered wood prevents warping from table drink spills.",
      },
    ],
  },
};

function resolveProductImage(imgUrl?: string): string {
  if (!imgUrl) return stand;
  if (imgUrl.includes("shop-stand")) return stand;
  if (imgUrl.includes("shop-poster")) return poster;
  if (imgUrl.includes("shop-sticker")) return sticker;
  return imgUrl;
}

interface AuthUser {
  id: string;
  email: string;
  fullName?: string | null;
  phone?: string | null;
  role?: string;
  phoneVerified?: boolean;
}

function getInitialProductFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const p = new URLSearchParams(window.location.search).get("product");
  return p ? p.trim() : null;
}

function getInitialProducts(): ShopProduct[] {
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem("menuly_shop_products_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
  }
  return INITIAL_FALLBACK_PRODUCTS;
}

function ShopPublic() {
  // Products state (hydrated instantly from local cache to prevent stock count flicker)
  const [products, setProducts] = useState<ShopProduct[]>(getInitialProducts);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Selected product for the Full Page view
  const [selectedProductId, setSelectedProductId] = useState<string | null>(getInitialProductFromUrl);

  // Sync with browser back/forward buttons
  useEffect(() => {
    const onPop = () => {
      setSelectedProductId(getInitialProductFromUrl());
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Cart state persisted in localStorage
  const [cart, setCart] = useState<ShopCartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("menuly_shop_cart");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [floatingCartDismissed, setFloatingCartDismissed] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("menuly_shop_cart", JSON.stringify(cart));
    } catch {}
    if (cart.length > 0) {
      setFloatingCartDismissed(false);
    }
  }, [cart]);

  // Wishlist state persisted in localStorage
  const [wishlist, setWishlist] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("menuly_shop_wishlist");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [wishlistOpen, setWishlistOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("menuly_shop_wishlist", JSON.stringify(wishlist));
    } catch {}
  }, [wishlist]);

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      if (exists) {
        toast.info("Removed from Wishlist");
        return prev.filter((id) => id !== productId);
      } else {
        toast.success("Saved to Wishlist!");
        return [...prev, productId];
      }
    });
  };

  // Auth state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Active product page tabs: 'description' | 'delivery' | 'reviews'
  const [productTab, setProductTab] = useState<"description" | "delivery" | "reviews">("description");

  // Quantity selector on detail page
  const [detailQuantity, setDetailQuantity] = useState<number>(1);

  // Pincode checker state
  const [pincodeInput, setPincodeInput] = useState<string>("");
  const [pincodeResult, setPincodeResult] = useState<{
    checked: boolean;
    valid: boolean;
    message: string;
  } | null>(null);

  // Dialog states
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [trackModalOpen, setTrackModalOpen] = useState(false);

  // Reviews state (real reviews only)
  const [productReviews, setProductReviews] = useState<ShopReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewEligibility, setReviewEligibility] = useState<{
    canReview: boolean;
    orderId?: string;
    reason?: string;
  } | null>(null);

  // Review modal
  const [reviewModalProduct, setReviewModalProduct] = useState<ShopProduct | null>(null);
  const [reviewModalOrderId, setReviewModalOrderId] = useState<string | undefined>(undefined);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Auth form inputs
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authFullName, setAuthFullName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Checkout Form (COD & Kotak UPI)
  const [shippingName, setShippingName] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingStreet, setShippingStreet] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingPincode, setShippingPincode] = useState("");
  const [shippingLandmark, setShippingLandmark] = useState("");
  const [shippingNotes, setShippingNotes] = useState("");
  const [paymentMode, setPaymentMode] = useState<ShopPaymentMode>("UPI");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [orderSubmitting, setOrderSubmitting] = useState(false);

  // WhatsApp OTP Phone Verification state
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Kotak Dynamic UPI Payment Gateway Modal State
  const [upiModalOpen, setUpiModalOpen] = useState(false);
  const [activePaymentSession, setActivePaymentSession] = useState<ShopPaymentSession | null>(null);
  const [pendingUpiOrder, setPendingUpiOrder] = useState<ShopOrder | null>(null);
  const [qrSecondsLeft, setQrSecondsLeft] = useState<number>(300);
  const [checkingPaymentStatus, setCheckingPaymentStatus] = useState<boolean>(false);
  const [checkStatusFeedback, setCheckStatusFeedback] = useState<string | null>(null);

  // Order Placement Result
  const [placedOrder, setPlacedOrder] = useState<ShopOrder | null>(null);

  // Tracking query & state
  const [trackQuery, setTrackQuery] = useState("");
  const [trackedOrder, setTrackedOrder] = useState<ShopOrder | null>(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [userOrders, setUserOrders] = useState<ShopOrder[]>([]);

  // 1. Fetch products from backend
  const fetchProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);
      const res = await fetch("/api/shop/products");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("menuly_shop_products_cache", JSON.stringify(data.products));
            } catch {}
          }
        }
      }
    } catch {
      // Keep fallbacks
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // 2. Auth Check
  const checkCurrentUser = useCallback(async () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("menuly_token");
    if (!token) {
      setCurrentUser(null);
      setAuthChecked(true);
      return;
    }

    try {
      const parts = token.split(".");
      if (parts.length === 3 && parts[1]) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload && (payload.userId || payload.id || payload.email)) {
          const u: AuthUser = {
            id: payload.userId || payload.id,
            email: payload.email,
            fullName: payload.fullName || payload.name || null,
            phone: payload.phone || null,
            role: payload.role,
          };
          setCurrentUser(u);
          if (u.fullName) setShippingName(u.fullName);
          if (u.phone) {
            setShippingPhone(u.phone);
            setPhoneVerified(true);
          }
        }
      }
    } catch {}

    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        const u = json.data?.user || json.user;
        if (u) {
          const freshUser: AuthUser = {
            id: u.id || u.userId,
            email: u.email,
            fullName: u.fullName || u.name || null,
            phone: u.phone || null,
            role: u.role,
            phoneVerified: Boolean(u.phoneVerified),
          };
          setCurrentUser(freshUser);
          if (freshUser.fullName) setShippingName(freshUser.fullName);
          if (freshUser.phone) {
            setShippingPhone(freshUser.phone);
            if (freshUser.phoneVerified) {
              setPhoneVerified(true);
            }
          }
        }
      }
    } catch {} finally {
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    checkCurrentUser();
  }, [checkCurrentUser]);

  // 3. User past orders
  const fetchUserOrders = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("menuly_token") : null;
    if (!token) return;
    try {
      const res = await fetch("/api/shop/orders/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          setUserOrders(data.orders);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchUserOrders();
    }
  }, [currentUser, fetchUserOrders]);

  // 4. Active product lookup
  const activeProduct = useMemo(() => {
    if (!selectedProductId) return null;
    return products.find((p) => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  // 5. Load real reviews & check review eligibility
  const loadProductReviews = useCallback(async (prodId: string) => {
    setLoadingReviews(true);
    try {
      const res = await fetch(`/api/shop/reviews?productId=${encodeURIComponent(prodId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.reviews)) {
          setProductReviews(data.reviews);
        }
      }
    } catch {
      setProductReviews([]);
    } finally {
      setLoadingReviews(false);
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("menuly_token") : null;
    if (token) {
      try {
        const elRes = await fetch(`/api/shop/reviews/can-review?productId=${encodeURIComponent(prodId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (elRes.ok) {
          const elData = await elRes.json();
          setReviewEligibility(elData);
        }
      } catch {
        setReviewEligibility(null);
      }
    } else {
      setReviewEligibility(null);
    }
  }, []);

  useEffect(() => {
    if (activeProduct) {
      loadProductReviews(activeProduct.id);
      setDetailQuantity(1);
      setPincodeResult(null);
      setPincodeInput("");
      setProductTab("description");
    }
  }, [activeProduct, loadProductReviews]);

  // Real review star percentages calculated dynamically (zero fake data)
  const reviewBreakdown = useMemo(() => {
    const total = productReviews.length;
    if (total === 0) {
      return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, total: 0, average: 0 };
    }
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    for (const r of productReviews) {
      const star = Math.min(5, Math.max(1, Math.round(r.rating || 5))) as 1 | 2 | 3 | 4 | 5;
      counts[star]++;
      sum += star;
    }
    return {
      5: Math.round((counts[5] / total) * 100),
      4: Math.round((counts[4] / total) * 100),
      3: Math.round((counts[3] / total) * 100),
      2: Math.round((counts[2] / total) * 100),
      1: Math.round((counts[1] / total) * 100),
      total,
      average: Number((sum / total).toFixed(1)),
    };
  }, [productReviews]);

  // Cart totals
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  const cartTotalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const cartGrandTotal = cartSubtotal > 0 ? cartSubtotal + FLAT_DELIVERY_FEE : 0;

  // Cart operations
  const addToCart = (product: ShopProduct, qty: number = 1) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.product.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        const existing = next[idx]!;
        next[idx] = { ...existing, quantity: existing.quantity + qty };
        return next;
      }
      return [...prev, { product, quantity: qty }];
    });
    setFloatingCartDismissed(false);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    toast.info("Item removed from cart");
  };

  const clearCart = () => {
    setCart([]);
    toast.info("Shopping cart cleared");
  };

  // Select product for full page view
  const handleSelectProduct = (product: ShopProduct) => {
    setSelectedProductId(product.id);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("product", product.id);
      window.history.pushState({}, "", url.toString());
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBackToAllProducts = () => {
    setSelectedProductId(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("product");
      window.history.pushState({}, "", url.toString());
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Buy Now direct flow
  const handleBuyNow = (product: ShopProduct, qty: number = 1) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.product.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        const existing = next[idx]!;
        next[idx] = { ...existing, quantity: existing.quantity + qty };
        return next;
      }
      return [...prev, { product, quantity: qty }];
    });
    handleProceedToCheckout();
  };

  // Checkout flow
  const handleProceedToCheckout = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("menuly_token") : null;
    if (!token && !currentUser) {
      setAuthModalOpen(true);
      return;
    }
    setCartOpen(false);
    setWishlistOpen(false);
    setCheckoutOpen(true);
  };

  // WhatsApp OTP Send & Verify handlers
  const handleSendPhoneOtp = async () => {
    const clean = shippingPhone.replace(/\D/g, "");
    if (!clean || clean.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }
    setSendingOtp(true);
    try {
      const token = localStorage.getItem("menuly_token");
      const res = await fetch("/api/auth/send-phone-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          email: currentUser?.email || "customer@menuly.app",
          phone: clean,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to send WhatsApp OTP");
      }
      setOtpSent(true);
      toast.success("WhatsApp verification OTP sent to +91 " + clean);
      if (data.data?.devOtp) {
        toast.info(`Demo WhatsApp OTP: ${data.data.devOtp}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send WhatsApp OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!otpCode.trim() || otpCode.trim().length < 6) {
      toast.error("Please enter the 6-digit WhatsApp OTP.");
      return;
    }
    setVerifyingOtp(true);
    try {
      const token = localStorage.getItem("menuly_token");
      const res = await fetch("/api/auth/verify-phone-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          email: currentUser?.email || "customer@menuly.app",
          phone: shippingPhone.replace(/\D/g, ""),
          otp: otpCode.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Invalid OTP");
      }
      setPhoneVerified(true);
      setOtpSent(false);
      toast.success("Mobile number verified via WhatsApp!");
    } catch (err: any) {
      toast.error(err.message || "Invalid WhatsApp OTP");
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Pincode validation
  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    const pin = pincodeInput.trim();
    if (!/^\d{6}$/.test(pin)) {
      setPincodeResult({
        checked: true,
        valid: false,
        message: "Please enter a valid 6-digit Indian PIN code.",
      });
      return;
    }
    setPincodeResult({
      checked: true,
      valid: true,
      message: `Express Courier Delivery available to ${pin} in 3–5 business days. Cash on Delivery & Kotak UPI available.`,
    });
  };

  // Reset timer whenever activePaymentSession changes or modal opens
  useEffect(() => {
    if (upiModalOpen && activePaymentSession) {
      setQrSecondsLeft(300);
      setCheckStatusFeedback(null);
    }
  }, [upiModalOpen, activePaymentSession?.id]);

  // 5-minute active countdown timer
  useEffect(() => {
    if (!upiModalOpen || !activePaymentSession || activePaymentSession.status === "PAID") return;
    const timer = setInterval(() => {
      setQrSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [upiModalOpen, activePaymentSession]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Real-time Kotak UPI Payment Session status polling
  useEffect(() => {
    if (!upiModalOpen || !activePaymentSession || activePaymentSession.status === "PAID") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/shop/payments/status?sessionId=${activePaymentSession.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.status === "PAID") {
            setActivePaymentSession(data.session);
            setUpiModalOpen(false);
            if (pendingUpiOrder) {
              setPlacedOrder({
                ...pendingUpiOrder,
                paymentStatus: "PAID",
                upiUtr: data.session?.utr,
              });
            }
            toast.success("Payment Received & Verified in Kotak Bank! Order Confirmed.");
            fetchUserOrders();
          }
        }
      } catch {}
    }, 2000);

    return () => clearInterval(interval);
  }, [upiModalOpen, activePaymentSession, pendingUpiOrder, fetchUserOrders]);

  // Background polling for pending orders even when QR modal is closed
  useEffect(() => {
    if (!currentUser) return;
    const hasPendingUpi = userOrders.some(
      (o) => o.paymentMode === "UPI" && o.paymentStatus !== "PAID" && o.status !== "CANCELLED"
    );
    if (!hasPendingUpi) return;

    const bgTimer = setInterval(async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("menuly_token") : null;
      if (!token) return;
      try {
        const res = await fetch("/api/shop/orders/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.orders)) {
            const newlyPaid = data.orders.find(
              (newO: ShopOrder) =>
                newO.paymentMode === "UPI" &&
                newO.paymentStatus === "PAID" &&
                userOrders.some((oldO) => oldO.id === newO.id && oldO.paymentStatus !== "PAID")
            );
            if (newlyPaid) {
              toast.success(`Payment Verified! Order #${newlyPaid.orderNumber} confirmed.`);
            }
            setUserOrders(data.orders);
          }
        }
      } catch {}
    }, 4000);

    return () => clearInterval(bgTimer);
  }, [currentUser, userOrders]);

  // Manual Check Payment Status button handler
  const [manualUtrInput, setManualUtrInput] = useState("");
  const [verifyingUtr, setVerifyingUtr] = useState(false);

  const handleVerifyManualUtr = async () => {
    if (!activePaymentSession) return;
    const cleanUtr = manualUtrInput.trim().replace(/\D/g, "");
    if (cleanUtr.length !== 12) {
      toast.error("Please enter a valid 12-digit UPI UTR / Reference number.");
      return;
    }
    setVerifyingUtr(true);
    try {
      const res = await fetch("/api/shop/payments/submit-utr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activePaymentSession.id,
          utr: cleanUtr,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.session) {
        setActivePaymentSession(data.session);
        setUpiModalOpen(false);
        setManualUtrInput("");
        if (pendingUpiOrder) {
          setPlacedOrder({
            ...pendingUpiOrder,
            paymentStatus: "PAID",
            upiUtr: cleanUtr,
            status: "PROCESSING",
          });
        }
        toast.success("Payment Received & Verified! Order Confirmed.");
        fetchUserOrders();
      } else {
        toast.error(data.error || "Failed to verify UTR. Please check the 12 digits from your receipt.");
      }
    } catch {
      toast.error("Network error submitting UTR. Please try again.");
    } finally {
      setVerifyingUtr(false);
    }
  };

  const handleManualCheckPayment = async () => {
    if (!activePaymentSession) return;
    setCheckingPaymentStatus(true);
    setCheckStatusFeedback(null);
    try {
      const res = await fetch(`/api/shop/payments/status?sessionId=${activePaymentSession.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.status === "PAID") {
          setActivePaymentSession(data.session);
          setUpiModalOpen(false);
          setManualUtrInput("");
          if (pendingUpiOrder) {
            setPlacedOrder({
              ...pendingUpiOrder,
              paymentStatus: "PAID",
              upiUtr: data.session?.utr,
              status: "PROCESSING",
            });
          }
          toast.success("Payment Received & Verified in Kotak Bank! Order Confirmed.");
          fetchUserOrders();
          return;
        }
      }
      setCheckStatusFeedback(
        "Bank auto-credit pending. If your account was debited, enter your 12-digit UPI Reference / UTR below for instant 1-second confirmation."
      );
    } catch {
      setCheckStatusFeedback("Network error checking payment status. Please try again.");
    } finally {
      setCheckingPaymentStatus(false);
    }
  };

  // Regenerate UPI QR code when 5-minute timer expires
  const handleRegenerateUpiQr = async () => {
    if (!activePaymentSession) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("menuly_token") : null;
    try {
      const res = await fetch("/api/shop/payments/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          amount: activePaymentSession.amount,
          customerName: activePaymentSession.customerName,
          customerPhone: activePaymentSession.customerPhone,
          orderNumber: activePaymentSession.orderNumber,
          orderId: activePaymentSession.orderId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.session) {
        setActivePaymentSession(data.session);
        setQrSecondsLeft(300);
        setCheckStatusFeedback(null);
        toast.success("Fresh QR code generated (valid for 5 minutes).");
      }
    } catch {
      toast.error("Failed to generate fresh QR code. Please try again.");
    }
  };

  // Check individual past order payment status from Track Orders
  const handleCheckOrderPayment = async (ord: ShopOrder) => {
    if (!ord.paymentSessionId) {
      toast.info("No active payment session linked. Click 'Open QR & Pay' to generate one.");
      return;
    }
    try {
      const res = await fetch(`/api/shop/payments/status?sessionId=${ord.paymentSessionId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.status === "PAID") {
          toast.success(`Order #${ord.orderNumber} payment confirmed & verified!`);
          fetchUserOrders();
          return;
        }
      }
      toast.info("Payment not confirmed yet. It typically takes 10–20 seconds for bank settlement.");
    } catch {
      toast.error("Network error checking payment status.");
    }
  };

  // Place Order / Start Payment Flow
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }
    if (!shippingName.trim() || !shippingPhone.trim()) {
      toast.error("Please provide your full name and phone number.");
      return;
    }
    if (!shippingStreet.trim() || !shippingCity.trim() || !shippingState.trim() || !shippingPincode.trim()) {
      toast.error("Complete delivery address with PIN code is required.");
      return;
    }

    // Enforce WhatsApp Phone Verification
    if (!phoneVerified) {
      toast.error("Please verify your mobile number via WhatsApp OTP before confirming order.");
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("menuly_token") : null;
    if (!token) {
      toast.error("Please log in to confirm your order.");
      setAuthModalOpen(true);
      return;
    }

    setOrderSubmitting(true);
    try {
      // 1. If Kotak UPI, first create dynamic payment session
      let paymentSessionId: string | undefined = undefined;
      let createdSession: ShopPaymentSession | null = null;

      if (paymentMode === "UPI") {
        const sessRes = await fetch("/api/shop/payments/create-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: cartGrandTotal,
            customerName: shippingName.trim(),
            customerPhone: shippingPhone.trim(),
          }),
        });
        const sessData = await sessRes.json();
        if (sessRes.ok && sessData.success && sessData.session) {
          createdSession = sessData.session;
          setActivePaymentSession(sessData.session);
          paymentSessionId = sessData.session.id;
        } else {
          throw new Error(sessData.error || "Failed to initialize Kotak UPI payment session");
        }
      }

      // 2. Create the Order
      const res = await fetch("/api/shop/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerName: shippingName.trim(),
          customerPhone: shippingPhone.trim(),
          shippingAddress: {
            fullName: shippingName.trim(),
            phone: shippingPhone.trim(),
            street: shippingStreet.trim(),
            city: shippingCity.trim(),
            state: shippingState.trim(),
            pincode: shippingPincode.trim(),
            landmark: shippingLandmark.trim() || undefined,
          },
          items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
          paymentMode,
          paymentSessionId,
          notes: shippingNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.order) {
        throw new Error(data.error || "Failed to place order.");
      }

      setCart([]);
      setCheckoutOpen(false);

      if (paymentMode === "UPI" && (createdSession || paymentSessionId)) {
        setPendingUpiOrder(data.order);
        setUpiModalOpen(true);
        toast.info("Scan Kotak QR code or use your UPI app to complete payment.");
      } else {
        setPlacedOrder(data.order);
        toast.success(`Order ${data.order.orderNumber} placed! Cash on Delivery confirmed.`);
      }

      fetchUserOrders();
    } catch (err: any) {
      toast.error(err.message || "Failed to place order. Please try again.");
    } finally {
      setOrderSubmitting(false);
    }
  };

  // Pay existing pending UPI order from Track Orders modal
  const handlePayOrderUpi = async (ord: ShopOrder) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("menuly_token") : null;
    if (!token) return;
    try {
      let session: ShopPaymentSession | null = null;
      if (ord.paymentSessionId) {
        const sRes = await fetch(`/api/shop/payments/status?sessionId=${ord.paymentSessionId}`);
        const sData = await sRes.json();
        if (sRes.ok && sData.success && sData.session) {
          session = sData.session;
        }
      }
      if (!session) {
        const createRes = await fetch("/api/shop/payments/create-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: ord.grandTotal,
            customerName: ord.customerName,
            customerPhone: ord.customerPhone,
            orderNumber: ord.orderNumber,
            orderId: ord.id,
          }),
        });
        const cData = await createRes.json();
        if (createRes.ok && cData.success && cData.session) {
          session = cData.session;
        }
      }
      if (session) {
        setActivePaymentSession(session);
        setPendingUpiOrder(ord);
        setTrackModalOpen(false);
        setUpiModalOpen(true);
      } else {
        toast.error("Failed to start Kotak UPI session. Please retry.");
      }
    } catch {
      toast.error("Network error starting UPI payment.");
    }
  };

  // Submit Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      toast.error("Please enter your review feedback.");
      return;
    }
    const token = typeof window !== "undefined" ? localStorage.getItem("menuly_token") : null;
    if (!token) {
      toast.error("Please log in to submit a review.");
      setAuthModalOpen(true);
      return;
    }
    const targetProd = reviewModalProduct || activeProduct;
    if (!targetProd) return;

    setSubmittingReview(true);
    try {
      const res = await fetch("/api/shop/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: targetProd.id,
          orderId: reviewModalOrderId,
          rating: reviewRating,
          title: reviewTitle.trim() || undefined,
          comment: reviewComment.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit review.");
      }

      toast.success("Thank you! Your verified review has been published.");
      setReviewModalProduct(null);
      setReviewModalOrderId(undefined);
      setReviewComment("");
      setReviewTitle("");
      setReviewRating(5);
      fetchProducts();
      if (activeProduct) {
        loadProductReviews(activeProduct.id);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Auth handler (Login)
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword.trim()) {
      toast.error("Please provide your email and password.");
      return;
    }
    setAuthSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authEmail.trim(),
          password: authPassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Authentication failed. Invalid email or password.");
      }

      const token = data.data?.token || data.token;
      if (token && typeof window !== "undefined") {
        localStorage.setItem("menuly_token", token);
        await checkCurrentUser();
        setAuthModalOpen(false);
        toast.success("Signed in successfully!");
        if (cart.length > 0) {
          setCheckoutOpen(true);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed.");
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Track order by query
  const handleTrackOrder = async (orderNum?: string) => {
    const num = (orderNum || trackQuery).trim();
    if (!num) {
      toast.error("Please enter an Order Number to track.");
      return;
    }
    setTrackLoading(true);
    try {
      const res = await fetch(`/api/shop/orders/track?orderNumber=${encodeURIComponent(num)}`);
      const data = await res.json();
      if (!res.ok || !data.success || !data.order) {
        throw new Error(data.error || "Order not found. Please check your order number.");
      }
      setTrackedOrder(data.order);
    } catch (err: any) {
      toast.error(err.message || "Could not find order.");
      setTrackedOrder(null);
    } finally {
      setTrackLoading(false);
    }
  };

  // Copy Kotak UPI ID
  const handleCopyUpi = () => {
    navigator.clipboard.writeText(KOTAK_UPI_ID);
    setCopiedUpi(true);
    toast.success("Kotak UPI ID copied to clipboard!");
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  return (
    <SitePage>
      {/* ===================================================================== */}
      {/* TOP NAVIGATION / HEADER (Spacious, Crisp, Zero Blobs, Zero Curves)     */}
      {/* ===================================================================== */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Breadcrumb path */}
            <nav className="flex items-center gap-2 text-xs text-neutral-500">
              <Link to="/" className="hover:text-neutral-900 transition-colors">
                Home
              </Link>
              <span>/</span>
              <button
                type="button"
                onClick={handleBackToAllProducts}
                className="hover:text-neutral-900 transition-colors font-medium text-neutral-800 cursor-pointer"
              >
                Merchandise
              </button>
              {activeProduct && (
                <>
                  <span>/</span>
                  <span className="text-neutral-900 font-semibold truncate max-w-[200px] sm:max-w-xs">
                    {activeProduct.name}
                  </span>
                </>
              )}
            </nav>

            {/* Quick Actions (Wishlist, Track & Cart) */}
            <div className="flex items-center gap-3">
              {/* Wishlist Button */}
              <button
                type="button"
                onClick={() => setWishlistOpen(true)}
                className="inline-flex items-center gap-1.5 border border-neutral-300 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                <Heart
                  className={`size-4 ${
                    wishlist.length > 0 ? "fill-red-500 text-red-500" : "text-neutral-600"
                  }`}
                />
                <span>Wishlist</span>
                {wishlist.length > 0 && (
                  <span className="ml-1 bg-red-100 text-red-700 px-1.5 py-0.2 text-[10px] font-bold">
                    {wishlist.length}
                  </span>
                )}
              </button>

              {/* Track Orders Button */}
              <button
                type="button"
                onClick={() => {
                  setTrackModalOpen(true);
                  if (currentUser) fetchUserOrders();
                }}
                className="inline-flex items-center gap-2 border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                <Truck className="size-4 text-neutral-700" />
                <span>Track Orders</span>
                {userOrders.length > 0 && (
                  <span className="ml-1 bg-neutral-900 text-white px-1.5 py-0.2 text-[10px] font-bold">
                    {userOrders.length}
                  </span>
                )}
              </button>

              {/* Shopping Cart Button */}
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="inline-flex items-center gap-2 bg-neutral-900 text-white px-4 py-2 text-xs font-semibold hover:bg-black transition-colors cursor-pointer"
              >
                <ShoppingCart className="size-4" />
                <span>Cart</span>
                {cartTotalItems > 0 && (
                  <span className="ml-1 bg-white text-neutral-900 px-1.5 py-0.2 text-[11px] font-bold">
                    {cartTotalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* VIEW A: FULL-SCREEN PRODUCT DETAIL PAGE (Sample Images 4 & 5 Design)   */}
      {/* ===================================================================== */}
      {activeProduct ? (
        <main className="bg-white text-neutral-900 py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
            {/* Back button */}
            <div>
              <button
                type="button"
                onClick={handleBackToAllProducts}
                className="inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-black font-medium transition-colors cursor-pointer"
              >
                <ChevronLeft className="size-4" />
                <span>Back to All Products</span>
              </button>
            </div>

            {/* 2-Column Product Layout (Image 4 Sample Design) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              {/* Left Column: Big Product Image & Thumbnails */}
              <div className="lg:col-span-6 space-y-4">
                <div className="aspect-square w-full border border-neutral-200 bg-white flex items-center justify-center p-8 relative">
                  <img
                    src={resolveProductImage(activeProduct.image)}
                    alt={activeProduct.name}
                    className="max-h-full max-w-full object-contain"
                  />
                  {activeProduct.badge && (
                    <span className="absolute top-4 left-4 border border-neutral-300 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-neutral-800">
                      {activeProduct.badge}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleWishlist(activeProduct.id)}
                    className="absolute top-4 right-4 p-2 border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors"
                    title="Toggle Wishlist"
                  >
                    <Heart
                      className={`size-4 ${
                        wishlist.includes(activeProduct.id)
                          ? "fill-red-500 text-red-500"
                          : "text-neutral-400"
                      }`}
                    />
                  </button>
                </div>

                {/* Trust Highlights under image */}
                <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-neutral-600">
                  <div className="border border-neutral-200 p-3 flex items-center gap-2.5">
                    <ShieldCheck className="size-4 text-emerald-700 shrink-0" />
                    <div>
                      <p className="font-semibold text-neutral-900">100% Scan Guarantee</p>
                      <p className="text-[11px] text-neutral-500">Free replacement reprint</p>
                    </div>
                  </div>
                  <div className="border border-neutral-200 p-3 flex items-center gap-2.5">
                    <Truck className="size-4 text-neutral-700 shrink-0" />
                    <div>
                      <p className="font-semibold text-neutral-900">Express Delivery</p>
                      <p className="text-[11px] text-neutral-500">Flat ₹80 across India</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Title, SKU, Price, Qty, Pincode, Buy Buttons */}
              <div className="lg:col-span-6 space-y-6">
                <div>
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight leading-snug">
                    {activeProduct.name}
                  </h1>
                  <p className="text-xs text-neutral-500 font-mono tracking-wider mt-1.5 uppercase">
                    SKU: {PRODUCT_RICH_GUIDES[activeProduct.id]?.sku || "MNL-MERCH-01"}
                  </p>
                </div>

                {/* Rating line (Real reviews only) */}
                <div className="flex items-center gap-3 text-xs">
                  {reviewBreakdown.total > 0 ? (
                    <div className="flex items-center gap-1.5">
                      <div className="flex text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`size-3.5 ${
                              i < Math.round(reviewBreakdown.average)
                                ? "fill-amber-500 text-amber-500"
                                : "text-neutral-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-bold text-neutral-900">{reviewBreakdown.average}</span>
                      <span className="text-neutral-500">({reviewBreakdown.total} customer reviews)</span>
                    </div>
                  ) : (
                    <span className="text-neutral-500 italic">No reviews yet • Verified buyers only</span>
                  )}
                  <span className="text-neutral-300">|</span>
                  <span
                    className={`font-semibold ${
                      activeProduct.inStock ? "text-emerald-700" : "text-red-600"
                    }`}
                  >
                    {activeProduct.inStock
                      ? typeof activeProduct.stock === "number"
                        ? activeProduct.stock <= 10
                          ? `● Only ${activeProduct.stock} left!`
                          : `● In Stock (${activeProduct.stock} available)`
                        : "● In Stock"
                      : "● Out of Stock"}
                  </span>
                </div>

                {/* Short description */}
                <p className="text-sm text-neutral-700 leading-relaxed">
                  {PRODUCT_RICH_GUIDES[activeProduct.id]?.tagline || activeProduct.description}
                </p>

                {/* Price Display */}
                <div className="border-t border-b border-neutral-200 py-4 flex items-baseline gap-4">
                  <span className="text-3xl font-bold text-neutral-900">
                    ₹{activeProduct.price}
                  </span>
                  {activeProduct.originalPrice && activeProduct.originalPrice > activeProduct.price && (
                    <>
                      <span className="text-sm text-neutral-400 line-through">
                        ₹{activeProduct.originalPrice}
                      </span>
                      <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5">
                        {Math.round(
                          ((activeProduct.originalPrice - activeProduct.price) / activeProduct.originalPrice) * 100
                        )}
                        % OFF
                      </span>
                    </>
                  )}
                </div>

                {/* Quantity Selector & Wishlist */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-neutral-700 uppercase tracking-wider block">
                    Quantity
                  </span>
                  <div className="flex items-center gap-4">
                    <div className="inline-flex items-center border border-neutral-300 bg-white">
                      <button
                        type="button"
                        onClick={() => setDetailQuantity((q) => Math.max(1, q - 1))}
                        className="px-3 py-2 text-neutral-600 hover:bg-neutral-100 transition-colors"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-12 text-center text-sm font-bold text-neutral-900">
                        {detailQuantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDetailQuantity((q) => q + 1)}
                        className="px-3 py-2 text-neutral-600 hover:bg-neutral-100 transition-colors"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleWishlist(activeProduct.id)}
                      className="border border-neutral-300 p-2 text-neutral-600 hover:text-black hover:border-black transition-colors"
                      title="Wishlist"
                    >
                      <Heart
                        className={`size-4 ${
                          wishlist.includes(activeProduct.id)
                            ? "fill-red-500 text-red-500"
                            : "text-neutral-600"
                        }`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== "undefined") {
                          navigator.clipboard.writeText(window.location.href);
                          toast.success("Product link copied!");
                        }
                      }}
                      className="border border-neutral-300 p-2 text-neutral-600 hover:text-black hover:border-black transition-colors"
                      title="Share Product"
                    >
                      <Share2 className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Delivery Pincode Checker (Matching Image 4) */}
                <div className="border border-neutral-200 p-4 space-y-3 bg-neutral-50/50">
                  <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800">
                    <MapPin className="size-4 text-red-600" />
                    <span>Check Delivery Pin Code</span>
                  </div>

                  <form onSubmit={handleCheckPincode} className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={pincodeInput}
                      onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ""))}
                      placeholder="Enter your 6-digit zipcode"
                      className="flex-1 border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-black"
                    />
                    <button
                      type="submit"
                      className="border border-neutral-800 bg-neutral-900 text-white px-5 py-2 text-xs font-semibold uppercase hover:bg-black transition-colors cursor-pointer"
                    >
                      Check
                    </button>
                  </form>

                  {pincodeResult && (
                    <p
                      className={`text-xs ${
                        pincodeResult.valid ? "text-emerald-700" : "text-red-600"
                      }`}
                    >
                      {pincodeResult.message}
                    </p>
                  )}
                </div>

                {/* Primary Action Buttons (Matching Image 4 Sample Design) */}
                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    disabled={!activeProduct.inStock}
                    onClick={() => handleBuyNow(activeProduct, detailQuantity)}
                    className="w-full bg-[#c5221f] text-white py-3.5 px-8 text-sm font-bold uppercase tracking-wider hover:bg-[#a91b18] transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Buy Now (₹{activeProduct.price * detailQuantity + FLAT_DELIVERY_FEE})
                  </button>

                  <button
                    type="button"
                    disabled={!activeProduct.inStock}
                    onClick={() => addToCart(activeProduct, detailQuantity)}
                    className="w-full border border-neutral-800 bg-white text-neutral-900 py-3 px-8 text-sm font-bold uppercase tracking-wider hover:bg-neutral-100 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>

            {/* ================================================================= */}
            {/* BOTTOM TABS SECTION: Description | Delivery | Reviews (Image 5)  */}
            {/* ================================================================= */}
            <section className="pt-12 border-t border-neutral-200">
              {/* Tab navigation headers with active red underline */}
              <div className="flex border-b border-neutral-200 gap-8 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setProductTab("description")}
                  className={`pb-3 border-b-2 transition-colors cursor-pointer ${
                    productTab === "description"
                      ? "border-[#c5221f] text-neutral-900"
                      : "border-transparent text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  Description
                </button>
                <button
                  type="button"
                  onClick={() => setProductTab("delivery")}
                  className={`pb-3 border-b-2 transition-colors cursor-pointer ${
                    productTab === "delivery"
                      ? "border-[#c5221f] text-neutral-900"
                      : "border-transparent text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  Delivery Information
                </button>
                <button
                  type="button"
                  onClick={() => setProductTab("reviews")}
                  className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                    productTab === "reviews"
                      ? "border-[#c5221f] text-neutral-900"
                      : "border-transparent text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  <span>Customer Reviews</span>
                  {reviewBreakdown.total > 0 && (
                    <span className="text-xs bg-neutral-100 px-2 py-0.5 text-neutral-700">
                      {reviewBreakdown.total}
                    </span>
                  )}
                </button>
              </div>

              {/* Tab 1: Description Content (Matching Image 5) */}
              {productTab === "description" && (
                <div className="py-8 space-y-8 max-w-4xl text-neutral-700 text-sm leading-relaxed">
                  <p>{activeProduct.description}</p>

                  {/* What's Inside & Key Specs */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-neutral-900 text-base">What's Inside</h3>
                    <ul className="space-y-2 list-disc pl-5">
                      {(
                        (activeProduct.whatsInside && activeProduct.whatsInside.length > 0
                          ? activeProduct.whatsInside
                          : PRODUCT_RICH_GUIDES[activeProduct.id]?.whatsInside) || [
                          "1x Custom printed high-resolution merchandise unit",
                          "1x Restaurant setup & instant QR scan instruction card",
                        ]
                      ).map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Technical Specifications */}
                  <div className="space-y-4 pt-4 border-t border-neutral-200">
                    <h3 className="font-bold text-neutral-900 text-base">Technical Specifications</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(
                        (activeProduct.specifications && Object.keys(activeProduct.specifications).length > 0
                          ? Object.entries(activeProduct.specifications).map(([label, value]) => ({ label, value }))
                          : PRODUCT_RICH_GUIDES[activeProduct.id]?.specs) || []
                      ).map((s, idx) => (
                        <div key={idx} className="border border-neutral-200 p-3">
                          <p className="text-xs uppercase text-neutral-400 font-semibold">{s.label}</p>
                          <p className="font-medium text-neutral-900 mt-1">{s.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* How to Use in Your Restaurant */}
                  <div className="space-y-4 pt-4 border-t border-neutral-200">
                    <h3 className="font-bold text-neutral-900 text-base">
                      How to Use in Your Restaurant
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(
                        (activeProduct.howToUse && activeProduct.howToUse.length > 0
                          ? activeProduct.howToUse
                          : PRODUCT_RICH_GUIDES[activeProduct.id]?.howToUse) || [
                          { step: 1, title: "Unpack", desc: "Arrives pre-assembled with your custom QR code." },
                          { step: 2, title: "Place on Tables", desc: "Position at center of dining table." },
                          { step: 3, title: "Guests Scan", desc: "Guests scan with phone camera to order." },
                          { step: 4, title: "Daily Wipe", desc: "100% sanitizer & alcohol wipe safe." },
                        ]
                      ).map((item) => (
                        <div key={item.step} className="border border-neutral-200 p-4 space-y-1">
                          <span className="text-xs font-bold text-neutral-400">Step 0{item.step}</span>
                          <h4 className="font-semibold text-neutral-900">{item.title}</h4>
                          <p className="text-xs text-neutral-600 leading-relaxed">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Delivery Information */}
              {productTab === "delivery" && (
                <div className="py-8 space-y-6 max-w-4xl text-neutral-700 text-sm leading-relaxed">
                  <div className="border border-neutral-200 p-5 space-y-3">
                    <h3 className="font-bold text-neutral-900 text-base flex items-center gap-2">
                      <Truck className="size-4 text-neutral-800" /> Pan-India Express Delivery: Flat ₹80
                    </h3>
                    <p>
                      {activeProduct.deliveryInfo ||
                        "All physical merchandise is custom printed with your restaurant branding and dispatched via verified courier partners (BlueDart, Delhivery, DTDC) within 24 to 48 hours of order confirmation."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border border-neutral-200 p-4 space-y-2">
                      <h4 className="font-semibold text-neutral-900">Direct Kotak UPI Payment (Instant)</h4>
                      <p className="text-xs text-neutral-600">
                        Scan dynamic QR code via Google Pay, PhonePe, Paytm, or BHIM. Zero payment gateway fees, instant confirmation.
                      </p>
                    </div>

                    <div className="border border-neutral-200 p-4 space-y-2">
                      <h4 className="font-semibold text-neutral-900">Cash on Delivery (COD)</h4>
                      <p className="text-xs text-neutral-600">
                        Pay cash or UPI upon delivery at your restaurant doorstep when the courier executive arrives.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Customer Reviews (Real Reviews Only - No Hardcoded Demos) */}
              {productTab === "reviews" && (
                <div className="py-8 space-y-8 max-w-4xl">
                  {/* Reviews Header & Eligibility */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-6">
                    <div>
                      <h3 className="text-base font-bold text-neutral-900">
                        Verified Customer Reviews
                      </h3>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Only verified customers who have received this product (Delivered) can submit a review.
                      </p>
                    </div>

                    {/* Write Review Button - only shown if eligible */}
                    {reviewEligibility?.canReview ? (
                      <button
                        type="button"
                        onClick={() => {
                          setReviewModalProduct(activeProduct);
                          setReviewModalOrderId(reviewEligibility.orderId);
                        }}
                        className="bg-neutral-900 text-white px-5 py-2 text-xs font-semibold uppercase hover:bg-black transition-colors cursor-pointer"
                      >
                        Write a Verified Review
                      </button>
                    ) : (
                      <span className="text-xs text-neutral-500 border border-neutral-200 bg-neutral-50 px-3 py-1.5">
                        {reviewEligibility?.reason || "🔒 Only verified buyers can submit a review"}
                      </span>
                    )}
                  </div>

                  {/* Real Ratings Breakdown */}
                  {reviewBreakdown.total > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start border-b border-neutral-200 pb-8">
                      {/* Left score box */}
                      <div className="md:col-span-4 border border-neutral-200 p-5 space-y-2 text-center">
                        <div className="text-4xl font-bold text-neutral-900">
                          {reviewBreakdown.average}
                        </div>
                        <div className="flex justify-center text-amber-500">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`size-4 ${
                                i < Math.round(reviewBreakdown.average)
                                  ? "fill-amber-500 text-amber-500"
                                  : "text-neutral-300"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-neutral-500">
                          Based on {reviewBreakdown.total} verified review{reviewBreakdown.total > 1 ? "s" : ""}
                        </p>
                      </div>

                      {/* Right dynamic percentage bars */}
                      <div className="md:col-span-8 space-y-2">
                        {([5, 4, 3, 2, 1] as const).map((star) => (
                          <div key={star} className="flex items-center gap-3 text-xs">
                            <span className="w-12 text-neutral-600 font-medium">{star} star</span>
                            <div className="flex-1 h-2 bg-neutral-100 border border-neutral-200">
                              <div
                                className="h-full bg-amber-500"
                                style={{ width: `${reviewBreakdown[star]}%` }}
                              />
                            </div>
                            <span className="w-10 text-right text-neutral-500">
                              {reviewBreakdown[star]}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="border border-neutral-200 p-8 text-center text-xs text-neutral-500">
                      No customer reviews yet. Reviews are only posted after verified delivery.
                    </div>
                  )}

                  {/* Reviews List */}
                  {loadingReviews ? (
                    <div className="py-8 text-center text-xs text-neutral-500">
                      <RefreshCw className="size-4 animate-spin mx-auto mb-2 text-neutral-700" />
                      Loading reviews...
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {productReviews.map((rev) => (
                        <div key={rev.id} className="border border-neutral-200 p-5 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="flex text-amber-500">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`size-3.5 ${
                                      i < rev.rating
                                        ? "fill-amber-500 text-amber-500"
                                        : "text-neutral-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              {rev.title && (
                                <span className="text-xs font-bold text-neutral-900">{rev.title}</span>
                              )}
                            </div>

                            {rev.verifiedPurchase && (
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5">
                                Verified Purchase
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-neutral-700 leading-relaxed">{rev.comment}</p>

                          <div className="flex items-center gap-2 text-[11px] text-neutral-400 pt-1">
                            <span className="font-semibold text-neutral-700">{rev.userName}</span>
                            <span>•</span>
                            <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        </main>
      ) : (
        /* ===================================================================== */
        /* VIEW B: CLEAN 4-CARD CATALOG GRID (Sample Image 3 Design)             */
        /* ===================================================================== */
        <main className="bg-white text-neutral-900 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
            {/* Catalog Headline */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-6">
              <div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
                  Similar Products &amp; Merch
                </h1>
                <p className="text-xs text-neutral-500 mt-1">
                  Custom printed table stands, posters &amp; stickers with your restaurant QR code.
                </p>
              </div>

              <div className="text-xs text-neutral-600 border border-neutral-200 px-4 py-2 bg-neutral-50">
                <span>Pan-India Courier: <strong>₹80</strong></span>
                <span className="mx-2">•</span>
                <span className="text-emerald-700 font-semibold">Kotak Direct UPI &amp; COD Available</span>
              </div>
            </div>

            {/* Clean 4-Card Grid (Matching Image 3 Sample) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((p) => {
                const inCart = cart.find((i) => i.product.id === p.id);
                const isWishlisted = wishlist.includes(p.id);

                return (
                  <article
                    key={p.id}
                    className="border border-neutral-200 bg-white flex flex-col justify-between group transition-colors hover:border-neutral-400"
                  >
                    {/* Product Image Area */}
                    <div
                      onClick={() => handleSelectProduct(p)}
                      className="aspect-square w-full bg-white flex items-center justify-center p-6 border-b border-neutral-100 relative cursor-pointer"
                    >
                      <img
                        src={resolveProductImage(p.image)}
                        alt={p.name}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                      {p.badge && (
                        <span className="absolute top-3 left-3 border border-neutral-200 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-700">
                          {p.badge}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(p.id);
                        }}
                        className="absolute top-3 right-3 p-1.5 bg-white/90 border border-neutral-200 hover:border-black transition-colors"
                        title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                      >
                        <Heart
                          className={`size-3.5 ${
                            isWishlisted ? "fill-red-500 text-red-500" : "text-neutral-400"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Content area */}
                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div
                        onClick={() => handleSelectProduct(p)}
                        className="cursor-pointer space-y-1"
                      >
                        <h2 className="text-sm font-medium text-neutral-800 line-clamp-2 hover:text-black">
                          {p.name}
                        </h2>
                        <div className="flex items-center justify-between text-[11px] pt-0.5">
                          <span
                            className={cn(
                              "font-medium",
                              p.inStock ? "text-emerald-700" : "text-red-600"
                            )}
                          >
                            {p.inStock
                              ? typeof p.stock === "number"
                                ? p.stock <= 10
                                  ? `Only ${p.stock} left!`
                                  : `In Stock (${p.stock} available)`
                                : "In Stock"
                              : "Out of Stock"}
                          </span>
                          {p.reviewsCount && p.reviewsCount > 0 ? (
                            <span className="flex items-center gap-1 text-amber-600 font-semibold">
                              <Star className="size-3 fill-amber-500 text-amber-500" />
                              {p.rating} ({p.reviewsCount})
                            </span>
                          ) : null}
                        </div>
                        <div className="flex items-baseline gap-2 pt-1">
                          <span className="text-base font-bold text-neutral-900">
                            ₹{p.price}
                          </span>
                          {p.originalPrice && p.originalPrice > p.price && (
                            <span className="text-xs text-neutral-400 line-through">
                              ₹{p.originalPrice}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Clean Actions */}
                      <div className="pt-2 border-t border-neutral-100 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSelectProduct(p)}
                          className="flex-1 border border-neutral-300 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                        >
                          View Details
                        </button>

                        {inCart ? (
                          <div className="flex items-center border border-neutral-300">
                            <button
                              type="button"
                              onClick={() => updateQuantity(p.id, inCart.quantity - 1)}
                              className="px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100 cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-2 text-xs font-bold text-neutral-900">
                              {inCart.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(p.id, inCart.quantity + 1)}
                              className="px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100 cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addToCart(p)}
                            className="bg-neutral-900 text-white px-3 py-1.5 text-xs font-semibold hover:bg-black transition-colors cursor-pointer"
                          >
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </main>
      )}

      {/* ===================================================================== */}
      {/* FLOATING CART BAR (Dismissible, Sharp, Crisp)                         */}
      {/* ===================================================================== */}
      {cart.length > 0 && !floatingCartDismissed && !cartOpen && !checkoutOpen && (
        <aside
          aria-label="Active shopping cart"
          className="fixed bottom-6 right-6 z-40 bg-neutral-900 text-white border border-neutral-800 p-4 shadow-xl flex items-center gap-4 max-w-sm"
        >
          <div className="flex items-center gap-3">
            <ShoppingCart className="size-5 text-neutral-300" />
            <div>
              <p className="text-xs font-semibold">
                {cartTotalItems} item{cartTotalItems > 1 ? "s" : ""} • ₹{cartSubtotal}
              </p>
              <p className="text-[10px] text-neutral-400">
                + ₹{FLAT_DELIVERY_FEE} Courier Pan-India
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="bg-white text-neutral-900 px-3 py-1.5 text-xs font-bold hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            Checkout
          </button>

          <button
            type="button"
            onClick={() => setFloatingCartDismissed(true)}
            className="text-neutral-400 hover:text-white p-1 cursor-pointer"
            title="Dismiss"
          >
            <X className="size-4" />
          </button>
        </aside>
      )}

      {/* ===================================================================== */}
      {/* 1. SHOPPING CART DIALOG (Clean Header Clearance, Zero Overlap)        */}
      {/* ===================================================================== */}
      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-6 bg-white border border-neutral-300 text-neutral-900 rounded-none shadow-none">
          <DialogHeader className="pr-12 text-left border-b border-neutral-200 pb-4">
            <DialogTitle className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <ShoppingCart className="size-5" />
              <span>Shopping Cart ({cartTotalItems} items)</span>
            </DialogTitle>
          </DialogHeader>

          {cart.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-sm font-semibold text-neutral-800">Your cart is empty</p>
              <p className="text-xs text-neutral-500">Explore printed QR stands &amp; merchandise above.</p>
            </div>
          ) : (
            <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between gap-3 border border-neutral-200 p-3"
                >
                  <img
                    src={resolveProductImage(item.product.image)}
                    alt={item.product.name}
                    className="size-12 object-contain border border-neutral-100 p-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-neutral-900 truncate">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-neutral-500">
                      ₹{item.product.price} × {item.quantity} = ₹{item.product.price * item.quantity}
                    </p>
                  </div>

                  <div className="flex items-center border border-neutral-300">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="px-2 py-1 text-xs hover:bg-neutral-100 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-2 text-xs font-bold">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="px-2 py-1 text-xs hover:bg-neutral-100 cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-neutral-400 hover:text-red-600 p-1 cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}

              {/* Price summary */}
              <div className="border-t border-neutral-200 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span>₹{cartSubtotal}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Courier Delivery (Pan-India)</span>
                  <span>₹{FLAT_DELIVERY_FEE}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-neutral-900 border-t border-neutral-200 pt-2">
                  <span>Grand Total</span>
                  <span>₹{cartGrandTotal}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-neutral-200 pt-4 flex gap-2">
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="border border-neutral-300 px-4 py-2 text-xs font-semibold hover:bg-neutral-50 cursor-pointer"
              >
                Clear Cart
              </button>
            )}
            <button
              type="button"
              disabled={cart.length === 0}
              onClick={handleProceedToCheckout}
              className="flex-1 bg-neutral-900 text-white py-2 px-4 text-xs font-bold uppercase tracking-wider hover:bg-black disabled:opacity-50 cursor-pointer"
            >
              Proceed to Checkout
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===================================================================== */}
      {/* 2. WISHLIST DIALOG (Saved Items Manager)                              */}
      {/* ===================================================================== */}
      <Dialog open={wishlistOpen} onOpenChange={setWishlistOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-6 bg-white border border-neutral-300 text-neutral-900 rounded-none shadow-none">
          <DialogHeader className="pr-12 text-left border-b border-neutral-200 pb-4">
            <DialogTitle className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <Heart className="size-5 text-red-500 fill-red-500" />
              <span>Your Wishlist ({wishlist.length} items)</span>
            </DialogTitle>
          </DialogHeader>

          {wishlist.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-sm font-semibold text-neutral-800">Your wishlist is empty</p>
              <p className="text-xs text-neutral-500">
                Click the heart icon on any product card to save it for later.
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
              {wishlist.map((id) => {
                const prod = products.find((p) => p.id === id);
                if (!prod) return null;

                return (
                  <div
                    key={prod.id}
                    className="flex items-center justify-between gap-3 border border-neutral-200 p-3"
                  >
                    <img
                      src={resolveProductImage(prod.image)}
                      alt={prod.name}
                      className="size-12 object-contain border border-neutral-100 p-1"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-neutral-900 truncate">{prod.name}</p>
                      <p className="text-xs font-bold text-neutral-800">₹{prod.price}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          addToCart(prod);
                          toggleWishlist(prod.id);
                        }}
                        className="bg-neutral-900 text-white px-2.5 py-1 text-xs font-semibold hover:bg-black cursor-pointer"
                      >
                        Move to Cart
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleWishlist(prod.id)}
                        className="text-neutral-400 hover:text-red-600 p-1 cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <DialogFooter className="border-t border-neutral-200 pt-4 flex gap-2">
            {wishlist.length > 0 && (
              <button
                type="button"
                onClick={() => setWishlist([])}
                className="border border-neutral-300 px-4 py-2 text-xs font-semibold hover:bg-neutral-50 cursor-pointer"
              >
                Clear Wishlist
              </button>
            )}
            <button
              type="button"
              onClick={() => setWishlistOpen(false)}
              className="flex-1 bg-neutral-900 text-white py-2 px-4 text-xs font-bold uppercase hover:bg-black cursor-pointer"
            >
              Continue Shopping
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===================================================================== */}
      {/* 3. CHECKOUT DIALOG: Address + WhatsApp OTP Phone Verification         */}
      {/* ===================================================================== */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-lg p-6 bg-white border border-neutral-300 text-neutral-900 rounded-none shadow-none max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pr-12 text-left border-b border-neutral-200 pb-4">
            <DialogTitle className="text-lg font-bold text-neutral-900">
              Delivery Address &amp; Verification
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handlePlaceOrder} className="space-y-4 py-2">
            {/* Customer Details & WhatsApp Phone Verification */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Full Name *</Label>
                <Input
                  required
                  value={shippingName}
                  onChange={(e) => setShippingName(e.target.value)}
                  placeholder="e.g. Rohit Sharma"
                  className="rounded-none border-neutral-300 text-xs"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Mobile Number *</Label>
                  {phoneVerified && (
                    <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="size-3" /> WhatsApp Verified
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Input
                    required
                    type="tel"
                    maxLength={10}
                    value={shippingPhone}
                    onChange={(e) => {
                      setShippingPhone(e.target.value.replace(/\D/g, ""));
                      if (phoneVerified) setPhoneVerified(false);
                    }}
                    placeholder="10-digit mobile"
                    className="rounded-none border-neutral-300 text-xs flex-1"
                  />
                  {!phoneVerified && (
                    <button
                      type="button"
                      disabled={sendingOtp || shippingPhone.length < 10}
                      onClick={handleSendPhoneOtp}
                      className="border border-neutral-800 bg-neutral-900 text-white px-3 py-1.5 text-[11px] font-bold uppercase hover:bg-black disabled:opacity-50 whitespace-nowrap cursor-pointer"
                    >
                      {sendingOtp ? "Sending..." : "Verify via OTP"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* OTP Verification Prompt (if OTP sent & not yet verified) */}
            {!phoneVerified && otpSent && (
              <div className="border border-amber-300 bg-amber-50 p-3 space-y-2 text-xs">
                <p className="font-semibold text-neutral-900 flex items-center gap-1.5">
                  <Smartphone className="size-4 text-emerald-700" />
                  Enter 6-digit WhatsApp OTP sent to +91 {shippingPhone}
                </p>
                <div className="flex gap-2">
                  <Input
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="6-digit OTP"
                    className="rounded-none border-neutral-300 text-xs bg-white flex-1"
                  />
                  <button
                    type="button"
                    disabled={verifyingOtp || otpCode.length < 6}
                    onClick={handleVerifyPhoneOtp}
                    className="bg-emerald-800 text-white px-4 py-1.5 text-xs font-bold hover:bg-emerald-900 disabled:opacity-50 cursor-pointer"
                  >
                    {verifyingOtp ? "Verifying..." : "Confirm OTP"}
                  </button>
                </div>
              </div>
            )}

            {/* Street Address */}
            <div className="space-y-1 text-xs">
              <Label className="text-xs font-semibold">Street Address / Restaurant Location *</Label>
              <Input
                required
                value={shippingStreet}
                onChange={(e) => setShippingStreet(e.target.value)}
                placeholder="Shop No., Street, Building, Area"
                className="rounded-none border-neutral-300 text-xs"
              />
            </div>

            {/* City, State, Pincode */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">City *</Label>
                <Input
                  required
                  value={shippingCity}
                  onChange={(e) => setShippingCity(e.target.value)}
                  placeholder="Jaipur"
                  className="rounded-none border-neutral-300 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">State *</Label>
                <Input
                  required
                  value={shippingState}
                  onChange={(e) => setShippingState(e.target.value)}
                  placeholder="Rajasthan"
                  className="rounded-none border-neutral-300 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">PIN Code *</Label>
                <Input
                  required
                  maxLength={6}
                  value={shippingPincode}
                  onChange={(e) => setShippingPincode(e.target.value.replace(/\D/g, ""))}
                  placeholder="302001"
                  className="rounded-none border-neutral-300 text-xs"
                />
              </div>
            </div>

            {/* Landmark */}
            <div className="space-y-1 text-xs">
              <Label className="text-xs font-semibold">Landmark (Optional)</Label>
              <Input
                value={shippingLandmark}
                onChange={(e) => setShippingLandmark(e.target.value)}
                placeholder="Near Main Market / Opposite Bank"
                className="rounded-none border-neutral-300 text-xs"
              />
            </div>

            {/* Payment Mode Selector: Kotak Direct UPI vs Cash on Delivery */}
            <div className="border-t border-neutral-200 pt-4 space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider block">
                Select Payment Method
              </Label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMode("UPI")}
                  className={`border p-3 text-left transition-colors cursor-pointer ${
                    paymentMode === "UPI"
                      ? "border-neutral-900 bg-neutral-900 text-white font-semibold"
                      : "border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50"
                  }`}
                >
                  <p className="text-xs font-bold">Kotak Direct UPI</p>
                  <p className="text-[10px] opacity-80 mt-0.5">Pay via GPay / PhonePe / Paytm</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode("COD")}
                  className={`border p-3 text-left transition-colors cursor-pointer ${
                    paymentMode === "COD"
                      ? "border-neutral-900 bg-neutral-900 text-white font-semibold"
                      : "border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50"
                  }`}
                >
                  <p className="text-xs font-bold">Cash on Delivery</p>
                  <p className="text-[10px] opacity-80 mt-0.5">Pay at doorstep</p>
                </button>
              </div>

              {paymentMode === "UPI" && (
                <div className="border border-neutral-300 bg-neutral-50 p-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-900 flex items-center gap-1.5">
                      <Building2 className="size-4" /> Kotak Mahindra Bank UPI
                    </span>
                    <span className="font-mono text-neutral-800">{KOTAK_UPI_ID}</span>
                  </div>
                  <p className="text-[11px] text-neutral-600">
                    A dynamic QR code with exact amount (₹{cartGrandTotal}) will be generated for you to scan or pay via any UPI app.
                  </p>
                </div>
              )}
            </div>

            {/* Price breakdown */}
            <div className="border-t border-neutral-200 pt-3 space-y-1 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Items ({cartTotalItems})</span>
                <span>₹{cartSubtotal}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Courier Delivery</span>
                <span>₹{FLAT_DELIVERY_FEE}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-neutral-900 pt-1">
                <span>Total Payable</span>
                <span>₹{cartGrandTotal}</span>
              </div>
            </div>

            <DialogFooter className="border-t border-neutral-200 pt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setCheckoutOpen(false)}
                className="border border-neutral-300 px-4 py-2 text-xs font-semibold hover:bg-neutral-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={orderSubmitting || (!phoneVerified && shippingPhone.length >= 10)}
                className="flex-1 bg-[#c5221f] text-white py-2.5 px-6 text-xs font-bold uppercase tracking-wider hover:bg-[#a91b18] disabled:opacity-50 cursor-pointer"
              >
                {orderSubmitting
                  ? "Processing..."
                  : !phoneVerified
                  ? "Verify Mobile to Continue"
                  : paymentMode === "UPI"
                  ? `Proceed to Kotak UPI (₹${cartGrandTotal})`
                  : `Confirm Order with COD (₹${cartGrandTotal})`}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===================================================================== */}
      {/* 4. DYNAMIC KOTAK UPI PAYMENT MODAL (Auto-Detector & Instant Check)    */}
      {/* ===================================================================== */}
      <Dialog
        open={upiModalOpen}
        onOpenChange={(open) => {
          setUpiModalOpen(open);
          if (open) {
            setQrSecondsLeft(300);
            setCheckStatusFeedback(null);
            setManualUtrInput("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-5 bg-white border border-neutral-300 text-neutral-900 rounded-none shadow-none">
          <DialogHeader className="pr-10 text-left border-b border-neutral-200 pb-3">
            <DialogTitle className="text-base sm:text-lg font-bold text-neutral-900 flex items-center gap-2">
              <Building2 className="size-5 text-neutral-800" />
              <span>Kotak Bank UPI Payment</span>
            </DialogTitle>
          </DialogHeader>

          {activePaymentSession && (
            <div className="space-y-3.5 py-1 text-center">
              {/* Amount badge & 5-minute Countdown Timer */}
              <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
                <div className="text-left">
                  <p className="text-[10px] uppercase text-neutral-500 font-semibold tracking-wider">Amount to Pay</p>
                  <p className="text-2xl font-extrabold text-neutral-900 leading-none mt-0.5">
                    ₹{activePaymentSession.amount}
                  </p>
                </div>
                <div>
                  {qrSecondsLeft > 0 ? (
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold font-mono">
                      <Clock className="size-3 text-amber-700 animate-pulse" />
                      <span>Expires in {formatTimer(qrSecondsLeft)}</span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                      Expired
                    </span>
                  )}
                </div>
              </div>

              {/* QR Code Display or Expired State */}
              {qrSecondsLeft > 0 ? (
                <div className="space-y-1.5">
                  <LocalUpiQrCode upiUri={activePaymentSession.upiUri} />
                  <p className="text-[11px] text-neutral-600 font-medium">
                    Scan with Google Pay, PhonePe, Paytm, CRED or any UPI app
                  </p>
                </div>
              ) : (
                <div className="w-44 h-44 sm:w-48 sm:h-48 mx-auto border border-dashed border-red-300 bg-red-50/60 flex flex-col items-center justify-center p-3 text-center space-y-2">
                  <Clock className="size-6 text-red-500" />
                  <p className="text-xs font-bold uppercase tracking-wider text-red-900">QR Expired</p>
                  <p className="text-[10px] text-neutral-600 leading-tight">
                    Dynamic QR codes expire after 5 minutes for security.
                  </p>
                  <button
                    type="button"
                    onClick={handleRegenerateUpiQr}
                    className="bg-neutral-900 hover:bg-black text-white px-2.5 py-1 text-xs font-bold uppercase cursor-pointer transition-colors"
                  >
                    Generate Fresh QR
                  </button>
                </div>
              )}

              {/* Account details & 1-click copy */}
              <div className="border border-neutral-200 p-2.5 bg-neutral-50 text-xs space-y-1 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Payee:</span>
                  <span className="font-semibold text-neutral-900">{KOTAK_ACCOUNT_NAME}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Official UPI ID:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-neutral-900">{KOTAK_UPI_ID}</span>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="text-neutral-500 hover:text-black p-0.5 cursor-pointer"
                      title="Copy UPI ID"
                    >
                      <Copy className="size-3" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Order Reference:</span>
                  <span className="font-mono text-[11px] text-neutral-800 font-semibold">
                    {activePaymentSession.orderNumber || activePaymentSession.id}
                  </span>
                </div>
              </div>

              {/* 1-Click Mobile Intent Button */}
              {qrSecondsLeft > 0 && (
                <div>
                  <a
                    href={activePaymentSession.upiUri}
                    className="block w-full bg-neutral-900 text-white py-2 text-xs font-bold uppercase hover:bg-black transition-colors"
                  >
                    Pay via UPI App (GPay / PhonePe / Paytm)
                  </a>
                </div>
              )}

              {/* Dedicated "Check Payment Status / I Have Paid" Button */}
              <div className="space-y-1.5">
                <button
                  type="button"
                  disabled={checkingPaymentStatus}
                  onClick={handleManualCheckPayment}
                  className="w-full border border-neutral-800 bg-white hover:bg-neutral-100 text-neutral-900 py-2 px-3 text-xs font-bold uppercase flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={cn("size-3.5", checkingPaymentStatus && "animate-spin")} />
                  {checkingPaymentStatus ? "Verifying with Kotak Bank..." : "Check Payment Status / I Have Paid"}
                </button>
                {checkStatusFeedback && (
                  <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 p-2 text-left">
                    {checkStatusFeedback}
                  </p>
                )}
              </div>

              {/* Instant 12-Digit UTR Fallback Input */}
              <div className="border border-neutral-300 bg-neutral-50 p-2.5 text-left space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900">
                    Paid? Enter 12-Digit UTR for Instant Confirmation:
                  </span>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 uppercase tracking-wide">
                    Instant
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={12}
                    placeholder="Enter 12-digit UPI UTR"
                    value={manualUtrInput}
                    onChange={(e) => setManualUtrInput(e.target.value.replace(/\D/g, ""))}
                    className="flex-1 border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-mono text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-black rounded-none"
                  />
                  <button
                    type="button"
                    disabled={verifyingUtr || manualUtrInput.trim().length !== 12}
                    onClick={handleVerifyManualUtr}
                    className="bg-neutral-900 hover:bg-black disabled:opacity-40 text-white px-3 py-1.5 text-xs font-bold uppercase transition-colors rounded-none cursor-pointer shrink-0"
                  >
                    {verifyingUtr ? "Verifying..." : "Verify UTR"}
                  </button>
                </div>
                <p className="text-[10px] text-neutral-500 leading-tight">
                  Found on your UPI app transaction receipt (Google Pay, PhonePe, Paytm, CRED) under <strong>UPI Ref No.</strong> or <strong>UTR</strong>.
                </p>
              </div>

              {/* Live Status Detector */}
              <div className="bg-emerald-50/70 border border-emerald-200/70 p-2.5 text-left space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <RefreshCw className="size-3 animate-spin text-emerald-700 shrink-0" />
                  <span>Auto-detecting Kotak Bank credit confirmation...</span>
                </div>
                <p className="text-[10px] text-emerald-800 leading-tight">
                  This screen updates automatically as soon as bank credit or UTR verification is confirmed.
                </p>
              </div>

              {/* Close / Pay Later Option */}
              <div className="pt-1 text-center border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => {
                    setUpiModalOpen(false);
                    if (pendingUpiOrder) {
                      toast.info(`Order #${pendingUpiOrder.orderNumber} saved as Pending Payment. You can open and pay anytime from Track Orders.`);
                    }
                  }}
                  className="text-xs text-neutral-500 hover:text-neutral-900 underline cursor-pointer"
                >
                  Close / Pay Later from Track Orders
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===================================================================== */}
      {/* 5. ORDER CONFIRMATION MODAL                                           */}
      {/* ===================================================================== */}
      <Dialog open={Boolean(placedOrder)} onOpenChange={() => setPlacedOrder(null)}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 bg-white border border-neutral-300 text-neutral-900 rounded-none shadow-none">
          <DialogHeader className="pr-12 text-left border-b border-neutral-200 pb-4">
            <DialogTitle className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <CheckCircle2 className="size-5 text-emerald-600" />
              <span>Order Confirmed!</span>
            </DialogTitle>
          </DialogHeader>

          {placedOrder && (
            <div className="space-y-4 py-3 text-xs text-neutral-700">
              <div className="border border-neutral-200 p-4 space-y-2 bg-neutral-50/50">
                <p className="text-neutral-500">Order Number</p>
                <p className="font-mono text-base font-bold text-neutral-900">
                  #{placedOrder.orderNumber}
                </p>
                <p className="text-[11px] text-neutral-500">
                  Save this order number to track your package status.
                </p>
              </div>

              <div className="space-y-1.5">
                <p>
                  <strong>Total Amount:</strong> ₹{placedOrder.grandTotal}
                </p>
                <p>
                  <strong>Payment Mode:</strong>{" "}
                  {placedOrder.paymentMode === "UPI" ? (
                    <span className="text-emerald-700 font-bold">
                      Prepaid (Kotak Direct UPI) • Verified ✓
                    </span>
                  ) : (
                    <span className="text-neutral-800 font-bold">Cash on Delivery (Postpaid)</span>
                  )}
                </p>
                <p>
                  <strong>Delivery To:</strong> {placedOrder.shippingAddress.fullName},{" "}
                  {placedOrder.shippingAddress.street}, {placedOrder.shippingAddress.city},{" "}
                  {placedOrder.shippingAddress.state} - {placedOrder.shippingAddress.pincode}
                </p>
              </div>

              <p className="text-[11px] text-neutral-500 pt-2 border-t border-neutral-200">
                Your merchandise order is being custom printed. Once delivered, you can submit your verified product review from the Track Orders tab.
              </p>
            </div>
          )}

          <DialogFooter className="border-t border-neutral-200 pt-4">
            <button
              type="button"
              onClick={() => setPlacedOrder(null)}
              className="w-full bg-neutral-900 text-white py-2 text-xs font-bold uppercase hover:bg-black cursor-pointer"
            >
              Done
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===================================================================== */}
      {/* 6. TRACK ORDER / MY ORDERS DIALOG (Rate & Review DELIVERED Orders)    */}
      {/* ===================================================================== */}
      <Dialog open={trackModalOpen} onOpenChange={setTrackModalOpen}>
        <DialogContent className="sm:max-w-lg p-6 bg-white border border-neutral-300 text-neutral-900 rounded-none shadow-none max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pr-12 text-left border-b border-neutral-200 pb-4">
            <DialogTitle className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <Truck className="size-5" />
              <span>Track Orders &amp; Reviews</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-3">
            {/* Search by Order Number */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Enter Order Number</Label>
              <div className="flex gap-2">
                <Input
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  placeholder="e.g. MNL-SHOP-1234"
                  className="rounded-none border-neutral-300 text-xs"
                />
                <button
                  type="button"
                  onClick={() => handleTrackOrder()}
                  disabled={trackLoading}
                  className="bg-neutral-900 text-white px-4 py-2 text-xs font-semibold hover:bg-black disabled:opacity-50 cursor-pointer"
                >
                  {trackLoading ? "Searching..." : "Track"}
                </button>
              </div>
            </div>

            {/* Tracked Order Result */}
            {trackedOrder && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-neutral-900">Tracked Order Details</h4>
                <ShopOrderCard
                  order={trackedOrder}
                  products={products}
                  onPayUpi={handlePayOrderUpi}
                  onCheckStatus={handleCheckOrderPayment}
                  onReview={(prodId, ordId) => {
                    const prod = products.find((p) => p.id === prodId) || {
                      id: prodId,
                      name: "Product",
                      description: "",
                      price: 0,
                      image: "/assets/shop-stand.png",
                      inStock: true,
                      createdAt: "",
                      updatedAt: "",
                    };
                    setReviewModalProduct(prod);
                    setReviewModalOrderId(ordId);
                  }}
                />
              </div>
            )}

            {/* My Past Orders List */}
            {userOrders.length > 0 && (
              <div className="space-y-3 border-t border-neutral-200 pt-4">
                <h4 className="text-xs font-bold uppercase text-neutral-900">Your Past Orders ({userOrders.length})</h4>
                <div className="space-y-3">
                  {userOrders.map((ord) => (
                    <ShopOrderCard
                      key={ord.id}
                      order={ord}
                      products={products}
                      onPayUpi={handlePayOrderUpi}
                      onCheckStatus={handleCheckOrderPayment}
                      onReview={(prodId, ordId) => {
                        const prod = products.find((p) => p.id === prodId) || {
                          id: prodId,
                          name: "Product",
                          description: "",
                          price: 0,
                          image: "/assets/shop-stand.png",
                          inStock: true,
                          createdAt: "",
                          updatedAt: "",
                        };
                        setReviewModalProduct(prod);
                        setReviewModalOrderId(ordId);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ===================================================================== */}
      {/* 7. WRITE A REVIEW MODAL (Strictly for Delivered Orders)              */}
      {/* ===================================================================== */}
      <Dialog
        open={Boolean(reviewModalProduct)}
        onOpenChange={(open) => {
          if (!open) {
            setReviewModalProduct(null);
            setReviewModalOrderId(undefined);
          }
        }}
      >
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-6 bg-white border border-neutral-300 text-neutral-900 rounded-none shadow-none">
          <DialogHeader className="pr-12 text-left border-b border-neutral-200 pb-4">
            <DialogTitle className="text-lg font-bold text-neutral-900">
              Leave a Customer Review
            </DialogTitle>
          </DialogHeader>

          {reviewModalProduct && (
            <form onSubmit={handleSubmitReview} className="space-y-4 py-2">
              <div className="flex items-center gap-3 border border-neutral-200 p-3">
                <img
                  src={resolveProductImage(reviewModalProduct.image)}
                  alt={reviewModalProduct.name}
                  className="size-10 object-contain"
                />
                <div>
                  <p className="text-xs font-bold text-neutral-900">{reviewModalProduct.name}</p>
                  <p className="text-[10px] text-emerald-700 font-semibold">Verified Delivered Purchase</p>
                </div>
              </div>

              {/* Star Rating Selector (1 to 5) */}
              <div className="space-y-1 text-xs">
                <Label className="text-xs font-semibold">Your Rating *</Label>
                <div className="flex gap-2 text-amber-500 py-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setReviewRating(s)}
                      className="p-1 focus:outline-none cursor-pointer"
                    >
                      <Star
                        className={`size-6 ${
                          s <= reviewRating
                            ? "fill-amber-500 text-amber-500"
                            : "text-neutral-300"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-bold text-neutral-700 self-center">
                    {reviewRating} of 5 Stars
                  </span>
                </div>
              </div>

              {/* Review Title */}
              <div className="space-y-1 text-xs">
                <Label className="text-xs font-semibold">Review Title (Optional)</Label>
                <Input
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="e.g. Excellent acrylic quality and fast delivery"
                  className="rounded-none border-neutral-300 text-xs"
                />
              </div>

              {/* Review Comment */}
              <div className="space-y-1 text-xs">
                <Label className="text-xs font-semibold">Your Feedback *</Label>
                <Textarea
                  required
                  rows={4}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Tell other restaurant owners how this merchandise looks and works in your venue..."
                  className="rounded-none border-neutral-300 text-xs"
                />
              </div>

              <DialogFooter className="border-t border-neutral-200 pt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setReviewModalProduct(null);
                    setReviewModalOrderId(undefined);
                  }}
                  className="border border-neutral-300 px-4 py-2 text-xs font-semibold hover:bg-neutral-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="flex-1 bg-neutral-900 text-white py-2 px-4 text-xs font-bold uppercase hover:bg-black disabled:opacity-50 cursor-pointer"
                >
                  {submittingReview ? "Publishing..." : "Submit Review"}
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ===================================================================== */}
      {/* 8. AUTHENTICATION MODAL (Sign In or Register with OTP)                 */}
      {/* ===================================================================== */}
      <Dialog open={authModalOpen} onOpenChange={setAuthModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-6 bg-white border border-neutral-300 text-neutral-900 rounded-2xl shadow-xl">
          <DialogHeader className="pr-12 text-left border-b border-neutral-200 pb-4">
            <DialogTitle className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <Sparkles className="size-4 text-emerald-600" />
              Sign In to Complete Order
            </DialogTitle>
            <p className="text-xs text-neutral-500 mt-1">
              Sign in with your Menuly account to manage orders and track package delivery.
            </p>
          </DialogHeader>

          <form onSubmit={handleAuthSubmit} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Registered Email Address *</Label>
              <Input
                required
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="name@example.com"
                className="rounded-xl border-neutral-300 text-xs"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Password *</Label>
                <Link
                  to="/auth"
                  search={{ redirect: "/shop" }}
                  className="text-[11px] text-emerald-700 hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                required
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-xl border-neutral-300 text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={authSubmitting}
              className="w-full bg-neutral-900 text-white py-2.5 rounded-xl text-xs font-bold uppercase hover:bg-black disabled:opacity-50 cursor-pointer transition-colors"
            >
              {authSubmitting ? "Signing in..." : "Sign In & Checkout"}
            </button>
          </form>

          {/* New User / Register Box */}
          <div className="border-t border-neutral-200 pt-4 space-y-3">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-2">
              <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-emerald-600 shrink-0" />
                <span>New to Menuly? Create Account with OTP</span>
              </p>
              <p className="text-[11px] text-neutral-600 leading-relaxed">
                All customer and restaurant accounts require verified WhatsApp &amp; Email OTP to prevent fraud and track shipments.
              </p>
              <Button
                asChild
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-xl shadow-xs"
              >
                <Link to="/auth" search={{ mode: "signup", redirect: "/shop" }}>
                  Register with Secure OTP <ArrowRight className="size-3.5 ml-1" />
                </Link>
              </Button>
            </div>

            <div className="text-center pt-1">
              <Link
                to="/auth"
                search={{ redirect: "/shop" }}
                className="text-[11px] text-neutral-500 hover:text-neutral-900 hover:underline"
              >
                Prefer full-screen authentication portal? Open Auth Page →
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SitePage>
  );
}
