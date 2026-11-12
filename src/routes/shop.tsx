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
} from "@/lib/shop-types";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Restaurant Merch & QR Print Shop | Menuly" },
      {
        name: "description",
        content:
          "Professional acrylic table stands, wall posters, and vinyl QR stickers custom printed with your restaurant branding and live digital menu QR code. Cash on Delivery available.",
      },
      { property: "og:title", content: "Menuly Merch & QR Print Shop" },
      {
        property: "og:description",
        content:
          "High quality printed QR merchandise for restaurants & cafes. Cash on delivery with flat ₹80 delivery fee across India.",
      },
    ],
  }),
  component: ShopPublic,
});

// Flat ₹80 COD / Express Courier Delivery Fee as required
export const FLAT_DELIVERY_FEE = 80;

const INITIAL_FALLBACK_PRODUCTS: ShopProduct[] = [
  {
    id: "stand-acrylic",
    name: "Acrylic Table Stand",
    description:
      "Clear premium acrylic stand holding your QR card at table height. Wipes clean, stands sturdy, looks elegant on any dining table.",
    price: 499,
    originalPrice: 799,
    badge: "MOST POPULAR",
    image: "/assets/shop-stand.png",
    inStock: true,
    rating: 4.9,
    reviewsCount: 38,
    features: [
      "High-grade crystal clear 3mm acrylic",
      "UV & water resistant laser printed insert",
      "T-shape stable table-top base",
      "Easy wipe-clean daily sanitization",
    ],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "poster-a3",
    name: "Wall Poster (A3 Matte)",
    description:
      "Matte-finish A3 poster printed with your QR code, logo and short tagline. Perfect for entryways, counter, or pickup counters.",
    price: 349,
    originalPrice: 499,
    badge: "HIGH VISIBILITY",
    image: "/assets/shop-poster.png",
    inStock: true,
    rating: 4.8,
    reviewsCount: 24,
    features: [
      "300 GSM heavy-duty non-tearable matte paper",
      "Vibrant anti-glare fade-proof ink",
      "Custom brand logo & restaurant name",
      "Dual-sided mounting foam tape included",
    ],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "stickers-pack",
    name: "QR Sticker Pack (12 pcs)",
    description:
      "Weather-proof vinyl stickers for tables, glass windows, cash registers, and takeout packaging.",
    price: 249,
    originalPrice: 399,
    badge: "PACK OF 12",
    image: "/assets/shop-sticker.png",
    inStock: true,
    rating: 5.0,
    reviewsCount: 52,
    features: [
      "100% waterproof vinyl with gloss lamination",
      "Strong scratch-proof adhesive (leaves no residue)",
      "12 individual die-cut stickers per pack",
      "Pre-tested camera scan precision",
    ],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "tent-wooden",
    name: "Folded Wooden Table Tent",
    description:
      "Double-sided premium tent card featuring your restaurant branding on one side and a scannable QR code on the other.",
    price: 399,
    originalPrice: 599,
    badge: "ECO-FRIENDLY",
    image: "/assets/shop-stand.png",
    inStock: true,
    rating: 4.9,
    reviewsCount: 19,
    features: [
      "Sustainable engineered wood core",
      "Dual-sided scannable finish",
      "Rustic cafe & fine-dine aesthetic",
      "Compact space-saving footprint",
    ],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

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

function ShopPublic() {
  // Products state
  const [products, setProducts] = useState<ShopProduct[]>(INITIAL_FALLBACK_PRODUCTS);
  const [loadingProducts, setLoadingProducts] = useState(false);

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

  useEffect(() => {
    try {
      localStorage.setItem("menuly_shop_cart", JSON.stringify(cart));
    } catch {}
  }, [cart]);

  // Auth state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Dialog states
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [trackModalOpen, setTrackModalOpen] = useState(false);
  const [detailsModalProduct, setDetailsModalProduct] = useState<ShopProduct | null>(null);
  const [productReviews, setProductReviews] = useState<ShopReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewModalOrder, setReviewModalOrder] = useState<ShopOrder | null>(null);
  const [reviewModalProduct, setReviewModalProduct] = useState<ShopProduct | null>(null);

  // Auth form inputs
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authFullName, setAuthFullName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Shipping Address Form
  const [shippingName, setShippingName] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingStreet, setShippingStreet] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingPincode, setShippingPincode] = useState("");
  const [shippingLandmark, setShippingLandmark] = useState("");
  const [shippingNotes, setShippingNotes] = useState("");
  const [orderSubmitting, setOrderSubmitting] = useState(false);

  // Order Placement Result
  const [placedOrder, setPlacedOrder] = useState<ShopOrder | null>(null);

  // Tracking query & state
  const [trackQuery, setTrackQuery] = useState("");
  const [trackedOrder, setTrackedOrder] = useState<ShopOrder | null>(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [userOrders, setUserOrders] = useState<ShopOrder[]>([]);
  const [loadingUserOrders, setLoadingUserOrders] = useState(false);

  // Review Form state
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // 1. Load products from backend
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

  // 2. Check current authenticated user
  const checkCurrentUser = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("menuly_token") : null;
    if (!token) {
      setCurrentUser(null);
      setAuthChecked(true);
      return;
    }
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setCurrentUser(data.user);
          setShippingName(data.user.fullName || "");
          setShippingPhone(data.user.phone || "");
        } else {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    checkCurrentUser();
  }, [checkCurrentUser]);

  // 3. Load user's orders if logged in
  const fetchUserOrders = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("menuly_token") : null;
    if (!token) return;
    try {
      setLoadingUserOrders(true);
      const res = await fetch("/api/shop/orders/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          setUserOrders(data.orders);
        }
      }
    } catch {
    } finally {
      setLoadingUserOrders(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchUserOrders();
    }
  }, [currentUser, fetchUserOrders]);

  // Cart operations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  const cartTotalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const cartGrandTotal = useMemo(() => {
    return cartSubtotal > 0 ? cartSubtotal + FLAT_DELIVERY_FEE : 0;
  }, [cartSubtotal]);

  const addToCart = (product: ShopProduct) => {
    if (!product.inStock) {
      toast.error(`"${product.name}" is currently out of stock.`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        toast.success(`Increased quantity for ${product.name}`);
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      toast.success(`Added ${product.name} to cart`);
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as ShopCartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    toast.info("Item removed from cart");
  };

  // Open Checkout (enforces login requirement)
  const handleProceedToCheckout = () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty. Please add items first.");
      return;
    }
    const token = typeof window !== "undefined" ? localStorage.getItem("menuly_token") : null;
    if (!token || !currentUser) {
      toast.info("Please login or create an account to proceed with checkout.");
      setCartOpen(false);
      setAuthModalOpen(true);
      return;
    }
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  // Handle in-modal login / registration
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword.trim()) {
      toast.error("Please enter email and password.");
      return;
    }
    setAuthSubmitting(true);
    try {
      if (authMode === "login") {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: authEmail.trim(), password: authPassword }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Login failed");
        }
        localStorage.setItem("menuly_token", data.token);
        document.cookie = `menuly_token=${encodeURIComponent(data.token)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        toast.success("Welcome back! Login successful.");
        await checkCurrentUser();
        setAuthModalOpen(false);
        setCheckoutOpen(true);
      } else {
        // Register flow
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: authEmail.trim(),
            password: authPassword,
            fullName: authFullName.trim() || undefined,
            phone: authPhone.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Registration failed");
        }
        if (data.token) {
          localStorage.setItem("menuly_token", data.token);
          document.cookie = `menuly_token=${encodeURIComponent(data.token)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
          toast.success("Account created successfully!");
          await checkCurrentUser();
          setAuthModalOpen(false);
          setCheckoutOpen(true);
        } else {
          // In dev/demo, auto-login if token wasn't returned
          toast.success("Account registered. Please log in.");
          setAuthMode("login");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication error. Please check your credentials.");
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Submit Shop Order
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingName.trim() || !shippingPhone.trim()) {
      toast.error("Please enter your name and contact phone number.");
      return;
    }
    if (!shippingStreet.trim() || !shippingCity.trim() || !shippingState.trim() || !shippingPincode.trim()) {
      toast.error("Please enter complete delivery address with PIN code.");
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("menuly_token") : null;
    if (!token) {
      toast.error("Authentication required. Please login first.");
      setCheckoutOpen(false);
      setAuthModalOpen(true);
      return;
    }

    setOrderSubmitting(true);
    try {
      const payload = {
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
        items: cart.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
        paymentMode: "COD",
        notes: shippingNotes.trim() || undefined,
      };

      const res = await fetch("/api/shop/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to place merchandise order.");
      }

      toast.success("Order Placed Successfully! Cash on Delivery Confirmed.");
      setPlacedOrder(data.order);
      setCart([]);
      setCheckoutOpen(false);
      fetchUserOrders();
    } catch (err: any) {
      toast.error(err.message || "Failed to place order.");
    } finally {
      setOrderSubmitting(false);
    }
  };

  // Track order by order number or ID
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

  // Open product details modal & fetch reviews
  const handleOpenProductDetails = async (product: ShopProduct) => {
    setDetailsModalProduct(product);
    setLoadingReviews(true);
    try {
      const res = await fetch(`/api/shop/reviews?productId=${encodeURIComponent(product.id)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.reviews)) {
          setProductReviews(data.reviews);
        }
      }
    } catch {
    } finally {
      setLoadingReviews(false);
    }
  };

  // Submit review
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
    const productId = reviewModalProduct?.id || detailsModalProduct?.id;
    if (!productId) return;

    setSubmittingReview(true);
    try {
      const res = await fetch("/api/shop/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId,
          orderId: reviewModalOrder?.id || undefined,
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
      setReviewModalOrder(null);
      setReviewModalProduct(null);
      setReviewComment("");
      setReviewTitle("");
      setReviewRating(5);
      fetchProducts();
      if (detailsModalProduct) {
        handleOpenProductDetails(detailsModalProduct);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <SitePage>
      {/* Top Banner & Fast Track Header */}
      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-card to-background px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Top navigation actions: Cart & Track Orders */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              <ShoppingBag className="size-3.5" />
              Menuly Physical Merchandise & Print Shop
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTrackModalOpen(true);
                  if (currentUser) fetchUserOrders();
                }}
                className="gap-1.5 text-xs rounded-xl shadow-soft"
              >
                <Truck className="size-3.5 text-primary" /> Track Order
                {userOrders.length > 0 && (
                  <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.2 text-[10px] font-bold text-primary">
                    {userOrders.length}
                  </span>
                )}
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={() => setCartOpen(true)}
                className="relative gap-1.5 rounded-xl shadow-soft font-bold"
              >
                <ShoppingCart className="size-4" />
                Cart
                {cartTotalItems > 0 && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-accent text-[11px] font-extrabold text-accent-foreground shadow-sm">
                    {cartTotalItems}
                  </span>
                )}
              </Button>
            </div>
          </div>

          <div className="text-center max-w-3xl mx-auto">
            <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl text-foreground">
              Official QR Stands, Stickers &amp; Merchandise
            </h1>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base leading-relaxed">
              Custom laser-printed with your restaurant name and live QR menu.
              Durable, waterproof, grease-proof &amp; 100% camera-scan guaranteed.
            </p>

            {/* Flat ₹80 COD Highlight Pill */}
            <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold text-foreground shadow-sm">
              <Truck className="size-4 text-primary" />
              <span>Flat Pan-India Delivery: <strong className="text-primary font-bold">₹80</strong></span>
              <span className="text-muted-foreground/60">&bull;</span>
              <span className="inline-flex items-center gap-1 text-veg font-bold">
                <Check className="size-3.5" /> Cash on Delivery (COD) Available
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Product Cards Grid */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Featured Restaurant Merchandise
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Select products to add to your cart. All orders dispatched via express courier with COD option.
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-muted/80 px-3 py-1 text-xs font-semibold text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" /> Custom Printed
          </span>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => {
            const inCart = cart.find((i) => i.product.id === p.id);
            const discountPercent =
              p.originalPrice && p.originalPrice > p.price
                ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
                : 0;

            return (
              <article
                key={p.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <div>
                  {/* Product Image & Badges */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                    <img
                      src={resolveProductImage(p.image)}
                      alt={p.name}
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {p.badge && (
                      <span className="absolute left-3 top-3 rounded-full bg-card/95 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-foreground shadow-sm backdrop-blur">
                        {p.badge}
                      </span>
                    )}

                    {discountPercent > 0 && (
                      <span className="absolute right-3 top-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-black text-primary-foreground shadow-sm">
                        {discountPercent}% OFF
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-5">
                    {/* Rating */}
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                        <Star className="size-3.5 fill-amber-500 text-amber-500" />
                        <span>{p.rating || 5.0}</span>
                        <span className="text-muted-foreground font-normal">
                          ({p.reviewsCount || 0})
                        </span>
                      </div>
                      <span
                        className={`text-[11px] font-bold ${
                          p.inStock ? "text-veg" : "text-destructive"
                        }`}
                      >
                        {p.inStock ? "● In Stock" : "● Out of Stock"}
                      </span>
                    </div>

                    <h3 className="font-display text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                      {p.name}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>

                    {/* Features pill preview */}
                    {p.features && p.features.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {p.features.slice(0, 2).map((feat, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                          >
                            <Check className="size-2.5 text-primary" /> {feat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing & Add to Cart Footer */}
                <div className="border-t border-border/60 p-4 sm:p-5 pt-3 bg-muted/20">
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="font-display text-2xl font-extrabold text-foreground">
                      ₹{p.price}
                    </span>
                    {p.originalPrice && p.originalPrice > p.price && (
                      <span className="text-xs text-muted-foreground line-through font-medium">
                        ₹{p.originalPrice}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      incl. custom printing
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenProductDetails(p)}
                      className="px-2.5 text-xs rounded-xl"
                      title="View details and customer reviews"
                    >
                      <Eye className="size-3.5" />
                    </Button>

                    {inCart ? (
                      <div className="flex flex-1 items-center justify-between rounded-xl border border-primary/40 bg-primary/5 px-2 py-1">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(p.id, -1)}
                          className="flex size-7 items-center justify-center rounded-lg bg-background text-foreground shadow-xs hover:bg-muted"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="font-bold text-xs text-foreground px-2">
                          {inCart.quantity} in cart
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(p.id, 1)}
                          className="flex size-7 items-center justify-center rounded-lg bg-background text-foreground shadow-xs hover:bg-muted"
                          aria-label="Increase quantity"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        disabled={!p.inStock}
                        onClick={() => addToCart(p)}
                        className="flex-1 gap-1.5 rounded-xl font-bold text-xs shadow-soft"
                      >
                        <ShoppingCart className="size-3.5" /> Add to Cart
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Floating Bottom Cart Bar (Mobile & Desktop) */}
      {cartTotalItems > 0 && !cartOpen && !checkoutOpen && (
        <aside
          aria-label="Shopping Cart Bar"
          className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-xl rounded-2xl border border-primary/30 bg-card/95 p-3.5 shadow-2xl backdrop-blur-md transition-all sm:bottom-6"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black shadow-sm">
                <ShoppingCart className="size-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">
                  {cartTotalItems} {cartTotalItems === 1 ? "item" : "items"} &bull; Subtotal:{" "}
                  <span className="text-primary font-black">₹{cartSubtotal}</span>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  + ₹{FLAT_DELIVERY_FEE} COD / Delivery &bull; Total:{" "}
                  <strong>₹{cartGrandTotal}</strong>
                </p>
              </div>
            </div>

            <Button
              onClick={() => setCartOpen(true)}
              size="sm"
              className="gap-1.5 rounded-xl font-bold shadow-soft"
            >
              View Cart &amp; Checkout <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </aside>
      )}

      {/* How Ordering & Quality Works Section */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-soft md:p-8">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Package className="size-5" />
            </span>
            <h2 className="font-display text-xl font-bold text-foreground">
              How Ordering Works
            </h2>
          </div>

          <ol className="mt-6 flex flex-col gap-5">
            <li className="flex items-start gap-4">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                1
              </span>
              <div>
                <h3 className="text-sm font-bold text-foreground">Pick Your Merchandise</h3>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                  Choose acrylic table stands, wall posters, or weather-proof sticker packs.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-4">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                2
              </span>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Login &amp; Cash on Delivery Checkout
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                  Provide your restaurant delivery address. Pay via Cash on Delivery with flat ₹80 courier charge upon doorstep arrival.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-4">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                3
              </span>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Custom Printed &amp; Pre-Verified
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                  We generate high-resolution vector QR inserts linked to your active digital menu. Unpack and place them on your tables immediately!
                </p>
              </div>
            </li>
          </ol>
        </div>

        <div className="flex flex-col justify-between gap-6 rounded-2xl border border-border/80 bg-card/60 p-6 shadow-soft md:p-8">
          <div>
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Truck className="size-6" />
            </div>
            <h2 className="mt-4 font-display text-xl font-bold text-foreground">
              Pan-India Express Delivery
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              All QR merchandise is manufactured with UV-cured waterproof inks that withstand hot spills, oil grease, and repeated sanitizer wipes without fading.
            </p>
          </div>

          <div className="rounded-xl border border-border/70 bg-background/80 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <ShieldCheck className="size-4 text-veg" />
              100% Scan Guarantee &bull; Free Replacement
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Every stand and sticker is machine-tested with multiple smartphone cameras before packaging. If any code fails to scan, we reprint and replace it free.
            </p>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 1. CART DRAWER / DIALOG                                              */}
      {/* ===================================================================== */}
      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-xl font-bold font-display">
              <span className="flex items-center gap-2">
                <ShoppingCart className="size-5 text-primary" /> Shopping Cart
              </span>
              <span className="text-xs text-muted-foreground font-normal">
                {cartTotalItems} {cartTotalItems === 1 ? "item" : "items"}
              </span>
            </DialogTitle>
          </DialogHeader>

          {cart.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
                <ShoppingCart className="size-6" />
              </div>
              <p className="text-base font-bold text-foreground">Your cart is empty</p>
              <p className="text-xs text-muted-foreground mt-1">
                Explore our printed QR table stands and merchandise above.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 my-2">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3 shadow-xs"
                >
                  <img
                    src={resolveProductImage(item.product.image)}
                    alt={item.product.name}
                    className="size-14 rounded-xl object-cover bg-muted shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">
                      {item.product.name}
                    </p>
                    <p className="text-xs font-extrabold text-primary mt-0.5">
                      ₹{item.product.price}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center rounded-lg border border-border bg-muted/40">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.product.id, -1)}
                          className="flex size-6 items-center justify-center hover:bg-muted rounded-l-md"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-foreground">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.product.id, 1)}
                          className="flex size-6 items-center justify-center hover:bg-muted rounded-r-md"
                          aria-label="Increase quantity"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground">
                      ₹{item.product.price * item.quantity}
                    </p>
                  </div>
                </div>
              ))}

              {/* Price Breakdown */}
              <div className="mt-4 rounded-2xl border border-border/80 bg-muted/30 p-4 space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Items Subtotal</span>
                  <span className="font-bold text-foreground">₹{cartSubtotal}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Truck className="size-3.5 text-primary" /> Delivery &amp; Handling (Pan-India)
                  </span>
                  <span className="font-bold text-primary">₹{FLAT_DELIVERY_FEE}</span>
                </div>
                <div className="flex justify-between text-muted-foreground text-[11px]">
                  <span>Payment Mode</span>
                  <span className="font-semibold text-veg">Cash on Delivery (COD)</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between text-sm font-extrabold text-foreground">
                  <span>Grand Total</span>
                  <span className="text-primary font-black text-base">₹{cartGrandTotal}</span>
                </div>
              </div>
            </div>
          )}

          {cart.length > 0 && (
            <DialogFooter className="mt-4">
              <Button
                onClick={handleProceedToCheckout}
                className="w-full gap-2 rounded-xl py-5 text-sm font-bold shadow-soft"
              >
                Proceed to Checkout (₹{cartGrandTotal}) <ArrowRight className="size-4" />
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* ===================================================================== */}
      {/* 2. AUTH MODAL (LOGIN / REGISTER BEFORE CHECKOUT)                      */}
      {/* ===================================================================== */}
      <Dialog open={authModalOpen} onOpenChange={setAuthModalOpen}>
        <DialogContent className="sm:max-w-md p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-center font-display text-2xl font-bold">
              {authMode === "login" ? "Login to Place Order" : "Create Account to Place Order"}
            </DialogTitle>
          </DialogHeader>

          <p className="text-xs text-muted-foreground text-center -mt-2">
            An account is required so you can track your printed merchandise delivery and submit reviews. Your cart items are saved!
          </p>

          <div className="flex rounded-xl bg-muted p-1 mt-2">
            <button
              type="button"
              onClick={() => setAuthMode("login")}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                authMode === "login"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("signup")}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                authMode === "signup"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground"
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="mt-4 space-y-3">
            {authMode === "signup" && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">Full Name / Restaurant Name</Label>
                  <Input
                    value={authFullName}
                    onChange={(e) => setAuthFullName(e.target.value)}
                    placeholder="e.g. Chef Sanjeev or Cafe Delight"
                    className="rounded-xl text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Phone Number (For Delivery SMS)</Label>
                  <Input
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="rounded-xl text-xs"
                    required
                  />
                </div>
              </>
            )}

            <div className="space-y-1">
              <Label className="text-xs">Email Address</Label>
              <Input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="you@restaurant.com"
                className="rounded-xl text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Password</Label>
              <Input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-xl text-xs"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={authSubmitting}
              className="w-full rounded-xl py-5 font-bold text-xs mt-2 shadow-soft"
            >
              {authSubmitting ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin mr-1" /> Authenticating...
                </>
              ) : authMode === "login" ? (
                "Sign In & Continue Checkout"
              ) : (
                "Create Account & Continue Checkout"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===================================================================== */}
      {/* 3. CHECKOUT FORM (DELIVERY ADDRESS & COD CONFIRMATION)                 */}
      {/* ===================================================================== */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold flex items-center gap-2">
              <MapPin className="size-5 text-primary" /> Delivery Address &amp; COD Checkout
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handlePlaceOrder} className="mt-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Customer / Contact Name *</Label>
                <Input
                  value={shippingName}
                  onChange={(e) => setShippingName(e.target.value)}
                  placeholder="e.g. Vikram Singh"
                  required
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Mobile Number (Courier SMS &amp; Call) *</Label>
                <Input
                  value={shippingPhone}
                  onChange={(e) => setShippingPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  required
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Street / Restaurant Address *</Label>
              <Input
                value={shippingStreet}
                onChange={(e) => setShippingStreet(e.target.value)}
                placeholder="Shop #, Building name, Street, Area"
                required
                className="rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">City *</Label>
                <Input
                  value={shippingCity}
                  onChange={(e) => setShippingCity(e.target.value)}
                  placeholder="e.g. Jaipur"
                  required
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">State *</Label>
                <Input
                  value={shippingState}
                  onChange={(e) => setShippingState(e.target.value)}
                  placeholder="e.g. Rajasthan"
                  required
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">PIN Code *</Label>
                <Input
                  value={shippingPincode}
                  onChange={(e) => setShippingPincode(e.target.value)}
                  placeholder="302001"
                  required
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Landmark / Restaurant Name (Optional)</Label>
              <Input
                value={shippingLandmark}
                onChange={(e) => setShippingLandmark(e.target.value)}
                placeholder="Near Clock Tower / Cafe Bloom"
                className="rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Printing Instructions / Tagline (Optional)</Label>
              <Textarea
                value={shippingNotes}
                onChange={(e) => setShippingNotes(e.target.value)}
                placeholder="Mention any custom tagline or specific table number requirements..."
                rows={2}
                className="rounded-xl text-xs"
              />
            </div>

            {/* COD Summary Box */}
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-veg" /> Payment Method:
                </span>
                <span className="rounded-md bg-veg/10 px-2 py-0.5 text-veg font-extrabold text-[11px]">
                  Cash on Delivery (COD)
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Pay in cash directly to the courier agent upon doorstep delivery.
              </p>

              <div className="border-t border-border/70 pt-2 flex items-center justify-between text-xs">
                <span>Items Subtotal: <strong>₹{cartSubtotal}</strong></span>
                <span>Delivery: <strong>₹{FLAT_DELIVERY_FEE}</strong></span>
                <span className="text-sm font-extrabold text-primary">
                  Total Payable: ₹{cartGrandTotal}
                </span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={orderSubmitting}
              className="w-full rounded-xl py-5 font-bold text-sm shadow-soft gap-2"
            >
              {orderSubmitting ? (
                <>
                  <RefreshCw className="size-4 animate-spin" /> Placing Order...
                </>
              ) : (
                <>
                  Confirm Order &bull; Pay ₹{cartGrandTotal} on Delivery <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===================================================================== */}
      {/* 4. ORDER PLACED SUCCESS DIALOG                                        */}
      {/* ===================================================================== */}
      <Dialog
        open={Boolean(placedOrder)}
        onOpenChange={(open) => !open && setPlacedOrder(null)}
      >
        <DialogContent className="sm:max-w-md p-6 text-center rounded-3xl">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-veg/10 text-veg mb-3">
            <CheckCircle2 className="size-10" />
          </div>

          <DialogTitle className="font-display text-2xl font-extrabold text-foreground">
            Order Confirmed!
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Your custom printed restaurant merchandise has been received by our fabrication hub.
          </p>

          {placedOrder && (
            <div className="mt-4 rounded-2xl border border-border/80 bg-muted/30 p-4 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Order Number:</span>
                <span className="font-extrabold font-mono text-primary text-sm">
                  {placedOrder.orderNumber}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Deliver To:</span>
                <span className="font-medium text-foreground text-right truncate max-w-[200px]">
                  {placedOrder.shippingAddress.fullName}, {placedOrder.shippingAddress.city}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount to Pay on Delivery:</span>
                <span className="font-black text-foreground text-sm">
                  ₹{placedOrder.grandTotal} (COD)
                </span>
              </div>

              <div className="flex justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/60">
                <span>Status:</span>
                <span className="font-bold text-amber-600">● {placedOrder.status}</span>
              </div>
            </div>
          )}

          <div className="mt-5 flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPlacedOrder(null)}
              className="flex-1 rounded-xl text-xs"
            >
              Continue Shopping
            </Button>
            <Button
              onClick={() => {
                if (placedOrder) {
                  setTrackedOrder(placedOrder);
                  setPlacedOrder(null);
                  setTrackModalOpen(true);
                }
              }}
              className="flex-1 rounded-xl text-xs font-bold gap-1"
            >
              <Truck className="size-3.5" /> Track Live Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===================================================================== */}
      {/* 5. ORDER TRACKING & MY ORDERS MODAL                                   */}
      {/* ===================================================================== */}
      <Dialog open={trackModalOpen} onOpenChange={setTrackModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold flex items-center gap-2">
              <Truck className="size-5 text-primary" /> Track Merchandise Order
            </DialogTitle>
          </DialogHeader>

          {/* Search by Order Number */}
          <div className="flex gap-2 mt-2">
            <div className="relative flex-1">
              <Search className="size-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                value={trackQuery}
                onChange={(e) => setTrackQuery(e.target.value)}
                placeholder="Enter Order Number e.g. MNL-SHOP-7821"
                className="pl-9 rounded-xl text-xs font-mono uppercase"
              />
            </div>
            <Button
              onClick={() => handleTrackOrder()}
              disabled={trackLoading}
              className="rounded-xl text-xs font-bold px-4"
            >
              {trackLoading ? <RefreshCw className="size-3.5 animate-spin" /> : "Track"}
            </Button>
          </div>

          {/* Active Tracked Order View */}
          {trackedOrder && (
            <div className="mt-4 rounded-2xl border border-primary/30 bg-card p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Order</span>
                  <p className="font-mono text-base font-extrabold text-primary">
                    {trackedOrder.orderNumber}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground">Total (COD)</span>
                  <p className="font-bold text-foreground text-sm">₹{trackedOrder.grandTotal}</p>
                </div>
              </div>

              {/* Progress Stepper */}
              <div className="space-y-3 py-2">
                {[
                  {
                    status: "PLACED",
                    title: "Order Placed & Confirmed",
                    desc: "Order received with custom restaurant specifications",
                  },
                  {
                    status: "PROCESSING",
                    title: "Custom Printing & QC Verification",
                    desc: "High-resolution vector printing and scan testing",
                  },
                  {
                    status: "SHIPPED",
                    title: "Dispatched / Shipped via Courier",
                    desc:
                      trackedOrder.courierPartner && trackedOrder.trackingNumber
                        ? `${trackedOrder.courierPartner} (Tracking: ${trackedOrder.trackingNumber})`
                        : "Handed over to express courier partner",
                  },
                  {
                    status: "DELIVERED",
                    title: "Delivered to Doorstep",
                    desc: trackedOrder.deliveredAt
                      ? `Delivered on ${new Date(trackedOrder.deliveredAt).toLocaleDateString()}`
                      : "Package handed to customer at restaurant",
                  },
                ].map((step, idx) => {
                  const statusOrder: ShopOrderStatus[] = [
                    "PLACED",
                    "PROCESSING",
                    "SHIPPED",
                    "DELIVERED",
                  ];
                  const currentIdx = statusOrder.indexOf(trackedOrder.status);
                  const stepIdx = statusOrder.indexOf(step.status as ShopOrderStatus);
                  const isDone = currentIdx >= stepIdx;
                  const isCurrent = currentIdx === stepIdx;

                  return (
                    <div key={step.status} className="flex items-start gap-3">
                      <div
                        className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          isDone
                            ? "bg-veg text-white shadow-xs"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isDone ? <Check className="size-3.5" /> : idx + 1}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`text-xs font-bold leading-tight ${
                            isCurrent
                              ? "text-primary"
                              : isDone
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {step.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-normal mt-0.5">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Review Option if Delivered */}
              {trackedOrder.status === "DELIVERED" && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Star className="size-4 text-amber-500 fill-amber-500" />
                    <div>
                      <p className="text-xs font-bold text-foreground">Delivered! Share your feedback</p>
                      <p className="text-[10px] text-muted-foreground">
                        Rate this merchandise 1 to 5 stars for other restaurateurs.
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setReviewModalOrder(trackedOrder);
                      const prod = products.find((p) => p.id === trackedOrder.items[0]?.productId);
                      if (prod) setReviewModalProduct(prod);
                      setTrackModalOpen(false);
                    }}
                    className="rounded-xl text-xs font-bold gap-1 shrink-0"
                  >
                    <Star className="size-3.5 fill-current" /> Write Review
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* User's Past Orders List */}
          {currentUser && userOrders.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border/70">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Your Past Merchandise Orders ({userOrders.length})
              </h3>
              <div className="space-y-2">
                {userOrders.map((o) => (
                  <div
                    key={o.id}
                    onClick={() => setTrackedOrder(o)}
                    className="flex items-center justify-between rounded-xl border border-border/70 bg-card p-3 hover:border-primary/50 cursor-pointer transition-all shadow-xs"
                  >
                    <div>
                      <span className="font-mono text-xs font-bold text-primary">
                        {o.orderNumber}
                      </span>
                      <p className="text-[11px] text-muted-foreground">
                        {o.items.length} {o.items.length === 1 ? "item" : "items"} &bull; ₹{o.grandTotal} (COD)
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          o.status === "DELIVERED"
                            ? "bg-veg/10 text-veg"
                            : o.status === "SHIPPED"
                            ? "bg-purple-500/10 text-purple-700"
                            : "bg-amber-500/10 text-amber-700"
                        }`}
                      >
                        {o.status}
                      </span>
                      <ChevronRight className="size-3.5 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===================================================================== */}
      {/* 6. PRODUCT DETAILS & REVIEWS MODAL                                    */}
      {/* ===================================================================== */}
      <Dialog
        open={Boolean(detailsModalProduct)}
        onOpenChange={(open) => !open && setDetailsModalProduct(null)}
      >
        <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto p-6 rounded-3xl">
          {detailsModalProduct && (
            <div>
              <div className="grid sm:grid-cols-2 gap-5 items-start">
                <div className="rounded-2xl overflow-hidden bg-muted aspect-[4/3]">
                  <img
                    src={resolveProductImage(detailsModalProduct.image)}
                    alt={detailsModalProduct.name}
                    className="size-full object-cover"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    {detailsModalProduct.badge && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase">
                        {detailsModalProduct.badge}
                      </span>
                    )}
                    <div className="flex items-center gap-1 text-amber-500 text-xs font-bold ml-auto">
                      <Star className="size-3.5 fill-amber-500 text-amber-500" />
                      <span>{detailsModalProduct.rating || 5.0}</span>
                      <span className="text-muted-foreground font-normal">
                        ({detailsModalProduct.reviewsCount || 0} reviews)
                      </span>
                    </div>
                  </div>

                  <h2 className="font-display text-xl font-bold text-foreground">
                    {detailsModalProduct.name}
                  </h2>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    {detailsModalProduct.description}
                  </p>

                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="font-display text-2xl font-black text-foreground">
                      ₹{detailsModalProduct.price}
                    </span>
                    {detailsModalProduct.originalPrice &&
                      detailsModalProduct.originalPrice > detailsModalProduct.price && (
                        <span className="text-xs text-muted-foreground line-through">
                          ₹{detailsModalProduct.originalPrice}
                        </span>
                      )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      + ₹{FLAT_DELIVERY_FEE} Flat COD Delivery
                    </span>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      onClick={() => {
                        addToCart(detailsModalProduct);
                        setDetailsModalProduct(null);
                        setCartOpen(true);
                      }}
                      className="flex-1 rounded-xl text-xs font-bold gap-1.5 shadow-soft"
                    >
                      <ShoppingCart className="size-4" /> Add &amp; Checkout
                    </Button>
                  </div>
                </div>
              </div>

              {/* Product Specifications & Features */}
              {detailsModalProduct.features && detailsModalProduct.features.length > 0 && (
                <div className="mt-6 rounded-2xl border border-border/70 bg-muted/20 p-4">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                    Product Features &amp; Material Quality
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {detailsModalProduct.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-muted-foreground">
                        <Check className="size-3.5 text-veg shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Customer Reviews Section */}
              <div className="mt-6 pt-5 border-t border-border/70">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <MessageSquare className="size-4 text-primary" /> Customer Reviews &amp; Ratings
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Average {detailsModalProduct.rating || 5.0} out of 5 stars from verified buyers
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setReviewModalProduct(detailsModalProduct);
                      setReviewModalOrder(null);
                    }}
                    className="text-xs rounded-xl gap-1"
                  >
                    <Star className="size-3.5 text-amber-500 fill-amber-500" /> Write Review
                  </Button>
                </div>

                {loadingReviews ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    <RefreshCw className="size-4 animate-spin mx-auto mb-1" /> Loading reviews...
                  </div>
                ) : productReviews.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    No reviews yet. Be the first restaurant to review this product!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {productReviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="rounded-xl border border-border/70 bg-card p-3 shadow-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="flex text-amber-500">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`size-3 ${
                                    i < rev.rating
                                      ? "fill-amber-500 text-amber-500"
                                      : "text-muted-foreground/30"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs font-bold text-foreground">
                              {rev.title || `${rev.rating} Stars`}
                            </span>
                          </div>
                          {rev.verifiedPurchase && (
                            <span className="rounded-full bg-veg/10 px-2 py-0.5 text-[10px] font-bold text-veg flex items-center gap-1">
                              <Check className="size-2.5" /> Verified Purchase
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {rev.comment}
                        </p>

                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/70">
                          <span>{rev.userName}</span>
                          <span>&bull;</span>
                          <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===================================================================== */}
      {/* 7. WRITE A REVIEW MODAL (1 TO 5 STARS)                                */}
      {/* ===================================================================== */}
      <Dialog
        open={Boolean(reviewModalProduct || reviewModalOrder)}
        onOpenChange={(open) => {
          if (!open) {
            setReviewModalProduct(null);
            setReviewModalOrder(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold">
              Leave a Customer Review
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitReview} className="mt-2 space-y-4">
            <div>
              <Label className="text-xs font-semibold">Overall Rating (1 to 5 Stars) *</Label>
              <div className="flex items-center gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                    aria-label={`${star} Stars`}
                  >
                    <Star
                      className={`size-6 ${
                        star <= reviewRating
                          ? "fill-amber-500 text-amber-500"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-foreground ml-2">
                  {reviewRating === 5
                    ? "Excellent (5/5)"
                    : reviewRating === 4
                    ? "Very Good (4/5)"
                    : reviewRating === 3
                    ? "Good (3/5)"
                    : reviewRating === 2
                    ? "Fair (2/5)"
                    : "Poor (1/5)"}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Review Title (Optional)</Label>
              <Input
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder="e.g. Excellent acrylic quality and crisp print"
                className="rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Your Experience &amp; Feedback *</Label>
              <Textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Tell other restaurant owners how this merchandise looks on your tables, durability, camera scanning, etc."
                rows={3}
                required
                className="rounded-xl text-xs"
              />
            </div>

            <Button
              type="submit"
              disabled={submittingReview}
              className="w-full rounded-xl py-5 font-bold text-xs shadow-soft gap-1.5"
            >
              {submittingReview ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin mr-1" /> Submitting...
                </>
              ) : (
                <>
                  <Star className="size-3.5 fill-current" /> Submit Verified Review
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </SitePage>
  );
}
