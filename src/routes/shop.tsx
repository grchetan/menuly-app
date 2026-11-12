import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useCallback } from "react";
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

// Kotak Mahindra Bank UPI Details for direct transfers
export const KOTAK_UPI_ID = "menuly@kotak";
export const KOTAK_ACCOUNT_NAME = "Menuly Smart Systems (Kotak Mahindra Bank)";

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
}

function getInitialProductFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const p = new URLSearchParams(window.location.search).get("product");
  return p ? p.trim() : null;
}

function ShopPublic() {
  // Products state
  const [products, setProducts] = useState<ShopProduct[]>(INITIAL_FALLBACK_PRODUCTS);
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
  const [paymentMode, setPaymentMode] = useState<ShopPaymentMode>("COD");
  const [upiUtr, setUpiUtr] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [orderSubmitting, setOrderSubmitting] = useState(false);

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
          if (u.phone) setShippingPhone(u.phone);
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
          };
          setCurrentUser(freshUser);
          if (freshUser.fullName) setShippingName(freshUser.fullName);
          if (freshUser.phone) setShippingPhone(freshUser.phone);
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

    // Check review eligibility if user is logged in
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
    toast.success(`Added ${qty > 1 ? `${qty}x ` : ""}${product.name} to cart.`);
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
    setCheckoutOpen(true);
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

  // Place Order
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
    if (paymentMode === "UPI" && !upiUtr.trim()) {
      toast.error("Please enter your 12-digit UPI UTR / Transaction Reference number after making payment.");
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
          upiUtr: paymentMode === "UPI" ? upiUtr.trim() : undefined,
          notes: shippingNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.order) {
        throw new Error(data.error || "Failed to place order.");
      }

      setPlacedOrder(data.order);
      setCart([]);
      setCheckoutOpen(false);
      toast.success(
        paymentMode === "UPI"
          ? `Order ${data.order.orderNumber} placed! Kotak UPI reference saved.`
          : `Order ${data.order.orderNumber} placed! Cash on Delivery confirmed.`
      );
      fetchUserOrders();
    } catch (err: any) {
      toast.error(err.message || "Failed to place order. Please try again.");
    } finally {
      setOrderSubmitting(false);
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

  // Auth handler (Login / Signup)
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword.trim()) {
      toast.error("Please provide your email and password.");
      return;
    }
    setAuthSubmitting(true);
    try {
      const endpoint = authMode === "signup" ? "/api/auth/register" : "/api/auth/login";
      const body =
        authMode === "signup"
          ? {
              email: authEmail.trim(),
              password: authPassword.trim(),
              fullName: authFullName.trim() || "Customer",
              phone: authPhone.trim() || undefined,
            }
          : {
              email: authEmail.trim(),
              password: authPassword.trim(),
            };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Authentication failed.");
      }

      const token = data.data?.token || data.token;
      if (token && typeof window !== "undefined") {
        localStorage.setItem("menuly_token", token);
        await checkCurrentUser();
        setAuthModalOpen(false);
        toast.success(authMode === "signup" ? "Account created successfully!" : "Signed in successfully!");
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
                className="hover:text-neutral-900 transition-colors font-medium text-neutral-800"
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

            {/* Quick Actions (Track & Cart) */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setTrackModalOpen(true);
                  if (currentUser) fetchUserOrders();
                }}
                className="inline-flex items-center gap-2 border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 transition-colors"
              >
                <Truck className="size-4 text-neutral-700" />
                <span>Track Orders</span>
                {userOrders.length > 0 && (
                  <span className="ml-1 bg-neutral-900 text-white px-1.5 py-0.2 text-[10px] font-bold">
                    {userOrders.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="inline-flex items-center gap-2 bg-neutral-900 text-white px-4 py-2 text-xs font-semibold hover:bg-black transition-colors"
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
      {/* VIEW A: FULL-SCREEN PRODUCT DETAIL PAGE (Matching Sample Image 4 & 5) */}
      {/* ===================================================================== */}
      {activeProduct ? (
        <main className="bg-white text-neutral-900 py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
            {/* Back button */}
            <div>
              <button
                type="button"
                onClick={handleBackToAllProducts}
                className="inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-black font-medium transition-colors"
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
                    {activeProduct.inStock ? "● In Stock" : "● Out of Stock"}
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
                      onClick={() => toast.info("Added to your wishlist")}
                      className="border border-neutral-300 p-2 text-neutral-600 hover:text-black hover:border-black transition-colors"
                      title="Wishlist"
                    >
                      <Heart className="size-4" />
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
                      className="border border-neutral-800 bg-neutral-900 text-white px-5 py-2 text-xs font-semibold uppercase hover:bg-black transition-colors"
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
                    Buy Now
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
                  className={`pb-3 border-b-2 transition-colors ${
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
                  className={`pb-3 border-b-2 transition-colors ${
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
                  className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
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
                        PRODUCT_RICH_GUIDES[activeProduct.id]?.whatsInside || [
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
                      {(PRODUCT_RICH_GUIDES[activeProduct.id]?.specs || []).map((s, idx) => (
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
                        PRODUCT_RICH_GUIDES[activeProduct.id]?.howToUse || [
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
                      All physical merchandise is custom printed with your restaurant branding and dispatched
                      via verified courier partners (BlueDart, Delhivery, DTDC) within 24 to 48 hours of order confirmation.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border border-neutral-200 p-4 space-y-2">
                      <h4 className="font-semibold text-neutral-900">Cash on Delivery (COD)</h4>
                      <p className="text-xs text-neutral-600">
                        Pay cash or UPI upon delivery at your doorstep when the courier executive arrives.
                      </p>
                    </div>

                    <div className="border border-neutral-200 p-4 space-y-2">
                      <h4 className="font-semibold text-neutral-900">Direct Kotak UPI Transfer</h4>
                      <p className="text-xs text-neutral-600">
                        Pay instantly via any UPI app (GPay, PhonePe, Paytm, BHIM) to our Kotak Mahindra Bank account and provide your 12-digit UTR.
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
                        className="bg-neutral-900 text-white px-5 py-2 text-xs font-semibold uppercase hover:bg-black transition-colors"
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
        /* VIEW B: CLEAN 4-CARD CATALOG GRID (Matching Sample Image 3)           */
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
                <span className="text-emerald-700 font-semibold">COD &amp; Kotak UPI Available</span>
              </div>
            </div>

            {/* Clean 4-Card Grid (Matching Image 3 Sample) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((p) => {
                const inCart = cart.find((i) => i.product.id === p.id);
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
                          toast.info("Added to wishlist");
                        }}
                        className="absolute top-3 right-3 text-neutral-400 hover:text-black transition-colors"
                        title="Wishlist"
                      >
                        <Heart className="size-4" />
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
                          className="flex-1 border border-neutral-300 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors"
                        >
                          View Details
                        </button>

                        {inCart ? (
                          <div className="flex items-center border border-neutral-300">
                            <button
                              type="button"
                              onClick={() => updateQuantity(p.id, inCart.quantity - 1)}
                              className="px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100"
                            >
                              -
                            </button>
                            <span className="px-2 text-xs font-bold text-neutral-900">
                              {inCart.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(p.id, inCart.quantity + 1)}
                              className="px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addToCart(p)}
                            className="bg-neutral-900 text-white px-3 py-1.5 text-xs font-semibold hover:bg-black transition-colors"
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
            className="bg-white text-neutral-900 px-3 py-1.5 text-xs font-bold hover:bg-neutral-100 transition-colors"
          >
            Checkout
          </button>

          <button
            type="button"
            onClick={() => setFloatingCartDismissed(true)}
            className="text-neutral-400 hover:text-white p-1"
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
        <DialogContent className="sm:max-w-md p-6 bg-white border border-neutral-300 text-neutral-900 rounded-none shadow-none">
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
                      className="px-2 py-1 text-xs hover:bg-neutral-100"
                    >
                      -
                    </button>
                    <span className="px-2 text-xs font-bold">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="px-2 py-1 text-xs hover:bg-neutral-100"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-neutral-400 hover:text-red-600 p-1"
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
                className="border border-neutral-300 px-4 py-2 text-xs font-semibold hover:bg-neutral-50"
              >
                Clear Cart
              </button>
            )}
            <button
              type="button"
              disabled={cart.length === 0}
              onClick={handleProceedToCheckout}
              className="flex-1 bg-neutral-900 text-white py-2 px-4 text-xs font-bold uppercase tracking-wider hover:bg-black disabled:opacity-50"
            >
              Proceed to Checkout
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===================================================================== */}
      {/* 2. CHECKOUT DIALOG: COD + KOTAK MAHINDRA BANK UPI (Custom Payment)   */}
      {/* ===================================================================== */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-lg p-6 bg-white border border-neutral-300 text-neutral-900 rounded-none shadow-none max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pr-12 text-left border-b border-neutral-200 pb-4">
            <DialogTitle className="text-lg font-bold text-neutral-900">
              Delivery Address &amp; Payment
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handlePlaceOrder} className="space-y-4 py-2">
            {/* Customer Details */}
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
                <Label className="text-xs font-semibold">Phone Number *</Label>
                <Input
                  required
                  type="tel"
                  value={shippingPhone}
                  onChange={(e) => setShippingPhone(e.target.value)}
                  placeholder="10-digit mobile"
                  className="rounded-none border-neutral-300 text-xs"
                />
              </div>
            </div>

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

            {/* Payment Mode Selector: COD vs Direct Kotak Bank UPI */}
            <div className="border-t border-neutral-200 pt-4 space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider block">
                Select Payment Method
              </Label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMode("COD")}
                  className={`border p-3 text-left transition-colors ${
                    paymentMode === "COD"
                      ? "border-neutral-900 bg-neutral-900 text-white font-semibold"
                      : "border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50"
                  }`}
                >
                  <p className="text-xs font-bold">Cash on Delivery</p>
                  <p className="text-[10px] opacity-80 mt-0.5">Pay upon delivery</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode("UPI")}
                  className={`border p-3 text-left transition-colors ${
                    paymentMode === "UPI"
                      ? "border-neutral-900 bg-neutral-900 text-white font-semibold"
                      : "border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50"
                  }`}
                >
                  <p className="text-xs font-bold">Kotak Direct UPI</p>
                  <p className="text-[10px] opacity-80 mt-0.5">Pay via GPay / PhonePe</p>
                </button>
              </div>

              {/* Kotak Bank UPI Transfer Details */}
              {paymentMode === "UPI" && (
                <div className="border border-neutral-300 bg-neutral-50 p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                    <span className="font-bold text-neutral-900 flex items-center gap-1.5">
                      <Building2 className="size-4" /> Kotak Mahindra Bank UPI
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-700 hover:text-black border border-neutral-300 bg-white px-2 py-0.5"
                    >
                      <Copy className="size-3" />
                      <span>{copiedUpi ? "Copied" : "Copy UPI ID"}</span>
                    </button>
                  </div>

                  <div className="space-y-1 text-[11px] text-neutral-600">
                    <p>
                      <strong>UPI ID:</strong> <span className="font-mono text-neutral-900">{KOTAK_UPI_ID}</span>
                    </p>
                    <p>
                      <strong>Account Name:</strong> {KOTAK_ACCOUNT_NAME}
                    </p>
                    <p>
                      <strong>Payable Amount:</strong> ₹{cartGrandTotal}
                    </p>
                  </div>

                  <div className="space-y-1 pt-1">
                    <Label className="text-xs font-bold">Enter 12-Digit UPI Transaction ID (UTR) *</Label>
                    <Input
                      required
                      value={upiUtr}
                      onChange={(e) => setUpiUtr(e.target.value.trim())}
                      placeholder="e.g. 439281920192"
                      className="rounded-none border-neutral-300 text-xs bg-white"
                    />
                    <p className="text-[10px] text-neutral-500">
                      Submit the UTR number generated in your Google Pay, PhonePe, Paytm, or BHIM app after sending payment.
                    </p>
                  </div>
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
                className="border border-neutral-300 px-4 py-2 text-xs font-semibold hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={orderSubmitting}
                className="flex-1 bg-[#c5221f] text-white py-2.5 px-6 text-xs font-bold uppercase tracking-wider hover:bg-[#a91b18] disabled:opacity-50"
              >
                {orderSubmitting ? "Placing Order..." : `Confirm Order (₹${cartGrandTotal})`}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===================================================================== */}
      {/* 3. ORDER CONFIRMATION MODAL                                           */}
      {/* ===================================================================== */}
      <Dialog open={Boolean(placedOrder)} onOpenChange={() => setPlacedOrder(null)}>
        <DialogContent className="sm:max-w-md p-6 bg-white border border-neutral-300 text-neutral-900 rounded-none shadow-none">
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
                  {placedOrder.orderNumber}
                </p>
                <p className="text-[11px] text-neutral-500">
                  Save this order number to track your package status.
                </p>
              </div>

              <div className="space-y-1">
                <p>
                  <strong>Total Amount:</strong> ₹{placedOrder.grandTotal}
                </p>
                <p>
                  <strong>Payment Mode:</strong> {placedOrder.paymentMode === "UPI" ? "Kotak Direct UPI" : "Cash on Delivery"}
                </p>
                <p>
                  <strong>Delivery To:</strong> {placedOrder.shippingAddress.street}, {placedOrder.shippingAddress.city},{" "}
                  {placedOrder.shippingAddress.state} - {placedOrder.shippingAddress.pincode}
                </p>
              </div>

              <p className="text-[11px] text-neutral-500 pt-2 border-t border-neutral-200">
                Your order is being custom printed. Once delivered, you can submit your verified product review from the Track Orders tab.
              </p>
            </div>
          )}

          <DialogFooter className="border-t border-neutral-200 pt-4">
            <button
              type="button"
              onClick={() => setPlacedOrder(null)}
              className="w-full bg-neutral-900 text-white py-2 text-xs font-bold uppercase hover:bg-black"
            >
              Done
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===================================================================== */}
      {/* 4. TRACK ORDER / MY ORDERS DIALOG (Rate & Review DELIVERED Orders)    */}
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
                  className="bg-neutral-900 text-white px-4 py-2 text-xs font-semibold hover:bg-black disabled:opacity-50"
                >
                  {trackLoading ? "Searching..." : "Track"}
                </button>
              </div>
            </div>

            {/* Tracked Order Result */}
            {trackedOrder && (
              <div className="border border-neutral-300 p-4 space-y-3 bg-neutral-50/50">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-neutral-900">
                    {trackedOrder.orderNumber}
                  </span>
                  <span className="text-[11px] font-bold uppercase bg-neutral-900 text-white px-2 py-0.5">
                    {trackedOrder.status}
                  </span>
                </div>

                <div className="text-xs space-y-1 text-neutral-600">
                  <p>
                    <strong>Courier:</strong> {trackedOrder.courierPartner || "Standard Express"}
                  </p>
                  {trackedOrder.trackingNumber && (
                    <p>
                      <strong>Tracking ID:</strong> {trackedOrder.trackingNumber}
                    </p>
                  )}
                  <p>
                    <strong>Grand Total:</strong> ₹{trackedOrder.grandTotal} ({trackedOrder.paymentMode})
                  </p>
                </div>

                {/* Items and Rate Button if DELIVERED */}
                <div className="border-t border-neutral-200 pt-3 space-y-2">
                  <p className="text-xs font-semibold text-neutral-800">Items Ordered:</p>
                  {trackedOrder.items.map((it) => (
                    <div
                      key={it.productId}
                      className="flex items-center justify-between text-xs border border-neutral-200 p-2 bg-white"
                    >
                      <span>
                        {it.productName} × {it.quantity}
                      </span>
                      {trackedOrder.status === "DELIVERED" ? (
                        <button
                          type="button"
                          onClick={() => {
                            const prod = products.find((p) => p.id === it.productId) || {
                              id: it.productId,
                              name: it.productName,
                              description: "",
                              price: it.price,
                              image: it.image,
                              inStock: true,
                              createdAt: "",
                              updatedAt: "",
                            };
                            setReviewModalProduct(prod);
                            setReviewModalOrderId(trackedOrder.id);
                          }}
                          className="bg-[#c5221f] text-white px-3 py-1 text-[11px] font-bold hover:bg-[#a91b18]"
                        >
                          ★ Rate &amp; Review
                        </button>
                      ) : (
                        <span className="text-[11px] text-neutral-400">Review on delivery</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* My Past Orders List */}
            {userOrders.length > 0 && (
              <div className="space-y-3 border-t border-neutral-200 pt-4">
                <h4 className="text-xs font-bold uppercase text-neutral-900">Your Past Orders</h4>
                <div className="space-y-3">
                  {userOrders.map((ord) => (
                    <div key={ord.id} className="border border-neutral-200 p-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold">{ord.orderNumber}</span>
                        <span className="bg-neutral-100 text-neutral-800 font-bold px-2 py-0.5 text-[10px]">
                          {ord.status}
                        </span>
                      </div>

                      <div className="text-neutral-500 text-[11px]">
                        Placed on {new Date(ord.createdAt).toLocaleDateString()} • ₹{ord.grandTotal} ({ord.paymentMode})
                      </div>

                      {/* Items with review buttons */}
                      <div className="space-y-1 pt-1">
                        {ord.items.map((it) => (
                          <div
                            key={it.productId}
                            className="flex items-center justify-between border-t border-neutral-100 pt-1"
                          >
                            <span className="truncate max-w-[200px]">
                              {it.productName} ({it.quantity})
                            </span>
                            {ord.status === "DELIVERED" ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const prod = products.find((p) => p.id === it.productId) || {
                                    id: it.productId,
                                    name: it.productName,
                                    description: "",
                                    price: it.price,
                                    image: it.image,
                                    inStock: true,
                                    createdAt: "",
                                    updatedAt: "",
                                  };
                                  setReviewModalProduct(prod);
                                  setReviewModalOrderId(ord.id);
                                }}
                                className="text-[#c5221f] hover:underline font-bold text-[11px]"
                              >
                                ★ Review Item
                              </button>
                            ) : (
                              <span className="text-[10px] text-neutral-400">Delivering soon</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ===================================================================== */}
      {/* 5. WRITE A REVIEW MODAL (Strictly for Delivered Orders)              */}
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
        <DialogContent className="sm:max-w-md p-6 bg-white border border-neutral-300 text-neutral-900 rounded-none shadow-none">
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
                      className="p-1 focus:outline-none"
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
                  className="border border-neutral-300 px-4 py-2 text-xs font-semibold hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="flex-1 bg-neutral-900 text-white py-2 px-4 text-xs font-bold uppercase hover:bg-black disabled:opacity-50"
                >
                  {submittingReview ? "Publishing..." : "Submit Review"}
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ===================================================================== */}
      {/* 6. AUTHENTICATION MODAL (Login / Signup for Shop Order)               */}
      {/* ===================================================================== */}
      <Dialog open={authModalOpen} onOpenChange={setAuthModalOpen}>
        <DialogContent className="sm:max-w-md p-6 bg-white border border-neutral-300 text-neutral-900 rounded-none shadow-none">
          <DialogHeader className="pr-12 text-left border-b border-neutral-200 pb-4">
            <DialogTitle className="text-lg font-bold text-neutral-900">
              {authMode === "signup" ? "Create Account to Place Order" : "Sign In to Complete Order"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAuthSubmit} className="space-y-3 py-2 text-xs">
            {authMode === "signup" && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Restaurant / Customer Name *</Label>
                  <Input
                    required
                    value={authFullName}
                    onChange={(e) => setAuthFullName(e.target.value)}
                    placeholder="e.g. Royal Cafe"
                    className="rounded-none border-neutral-300 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Phone Number</Label>
                  <Input
                    type="tel"
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    placeholder="10-digit mobile"
                    className="rounded-none border-neutral-300 text-xs"
                  />
                </div>
              </>
            )}

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Email Address *</Label>
              <Input
                required
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="name@example.com"
                className="rounded-none border-neutral-300 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Password *</Label>
              <Input
                required
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-none border-neutral-300 text-xs"
              />
            </div>

            <DialogFooter className="border-t border-neutral-200 pt-4 flex-col gap-2">
              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full bg-neutral-900 text-white py-2.5 text-xs font-bold uppercase hover:bg-black disabled:opacity-50"
              >
                {authSubmitting
                  ? "Please wait..."
                  : authMode === "signup"
                  ? "Create Account & Continue"
                  : "Sign In & Checkout"}
              </button>

              <p className="text-center text-[11px] text-neutral-500 pt-1">
                {authMode === "signup" ? "Already have an account?" : "Don't have an account yet?"}{" "}
                <button
                  type="button"
                  onClick={() => setAuthMode((m) => (m === "signup" ? "login" : "signup"))}
                  className="font-bold text-neutral-900 hover:underline"
                >
                  {authMode === "signup" ? "Sign In" : "Register Now"}
                </button>
              </p>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SitePage>
  );
}
