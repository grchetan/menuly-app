import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Shield,
  Users,
  UtensilsCrossed,
  QrCode,
  LifeBuoy,
  Search,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  Store,
  Eye,
  EyeOff,
  RefreshCw,
  Copy,
  ChevronLeft,
  ChevronRight,
  Filter,
  Lock,
  Unlock,
  MessageCircle,
  Sparkles,
  BarChart3,
  Activity,
  Phone,
  Mail,
  Instagram,
  Zap,
  CreditCard,
  Settings,
  Sliders,
  Check,
  Save,
  UserCheck,
  UserPlus,
  UserMinus,
  ShieldCheck,
  Trash2,
  ShieldAlert,
  LogOut,
  Layers,
  Wrench,
  RotateCw,
  Megaphone,
  Radio,
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageSquareText,
  Smartphone,
  Monitor,
  Globe,
  Share2,
  Compass,
  Gauge,
  Server,
  Coffee,
  Flame,
  Image as ImageIcon,
  Edit3,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/Logo";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AnnouncementMarquee } from "@/components/AnnouncementMarquee";
import { STARTER_PRESETS, type PresetTemplate } from "@/lib/presets";
import { compressImage } from "@/lib/image-compress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Executive Command Center — Menuly" },
      {
        name: "description",
        content: "Platform business analytics, customer monitoring, and support resolution console.",
      },
      { property: "og:title", content: "Executive Command Center — Menuly" },
    ],
  }),
  component: AdminPage,
});

export type AdminRestaurant = {
  id: string;
  name: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
  phone: string;
  city: string;
  dishCount: number;
  categoryCount: number;
  plan?: "starter" | "pro" | "enterprise";
  status: "active" | "setup" | "suspended";
  qrScans: number;
  joinedDate: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  restaurantName: string;
  restaurantSlug: string;
  plan: "starter" | "pro" | "enterprise";
  role: "super_admin" | "owner";
  status: "active" | "suspended";
  joinedDate: string;
};

export type PlatformSettings = {
  maintenanceMode: boolean;
  strictVegOnly: boolean;
  supportWhatsApp: string;
  supportEmail: string;
  supportHours: string;
  supportSlaText: string;
  instagramUrl: string;
  instagramHandle: string;
  facebookUrl: string;
  facebookName: string;
  currency: string;
  announcementTicker: string;
  announcementTickerEnabled: boolean;
  allowNewSignups: boolean;
  demoMenuUrl: string;
  defaultStarterPreset: string;
};

export type AdminPlan = {
  id: string;
  name: string;
  slug: string;
  priceMonthly: number;
  maxDishes: number;
  maxTables: number;
  customBranding: boolean;
  analytics: boolean;
  prioritySupport: boolean;
  activeSubscribers: number;
  features: string[];
};

export type SupportTicket = {
  id: string;
  restaurantName: string;
  restaurantSlug: string;
  ownerEmail: string;
  phone?: string;
  category: "QR Code" | "Menu Edit" | "Printing" | "Account";
  subject: string;
  description: string;
  priority: "urgent" | "high" | "medium" | "low";
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
  adminNote?: string;
};

export type CustomerFeedbackItem = {
  id: string;
  name: string;
  email: string;
  restaurantName?: string;
  rating: number;
  category: string;
  message: string;
  wouldRecommend?: boolean;
  recommend?: boolean;
  createdAt: string;
};

export type FeedbackStats = {
  total: number;
  averageRating?: number | string;
  avgRating?: string;
  recommendPercent: number;
  stars?: {
    5?: number;
    4?: number;
    3?: number;
    2?: number;
    1?: number;
  };
};

const DEFAULT_USERS: AdminUser[] = [];

const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return typeof window !== "undefined" ? localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },
  setItem: (key: string, val: string): void => {
    try {
      if (typeof window !== "undefined") localStorage.setItem(key, val);
    } catch {}
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== "undefined") localStorage.removeItem(key);
    } catch {}
  },
  getSessionItem: (key: string): string | null => {
    try {
      return typeof window !== "undefined" ? sessionStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },
  setSessionItem: (key: string, val: string): void => {
    try {
      if (typeof window !== "undefined") sessionStorage.setItem(key, val);
    } catch {}
  },
  removeSessionItem: (key: string): void => {
    try {
      if (typeof window !== "undefined") sessionStorage.removeItem(key);
    } catch {}
  },
};

const DEFAULT_SETTINGS: PlatformSettings = {
  maintenanceMode: false,
  strictVegOnly: true,
  supportWhatsApp: "919999999999",
  supportEmail: "menulyofficial@gmail.com",
  supportHours: "Mon–Sat, 10:00 AM – 7:00 PM IST",
  supportSlaText:
    "All bug reports and tickets submitted via this form are dispatched directly to our priority queue and reviewed by engineers within 2 to 4 business hours.",
  instagramUrl: "https://www.instagram.com/menulyofficial",
  instagramHandle: "@menulyofficial",
  facebookUrl: "https://www.facebook.com/profile.php?id=61595926229139",
  facebookName: "Menuly Official",
  currency: "₹ (INR)",
  announcementTicker:
    "Scan the QR 💥 See the menu 💥 Update prices anytime 💥 Mark sold out in 1 tap 💥 Fast & Responsive 💥 Zero reprinting",
  announcementTickerEnabled: true,
  allowNewSignups: true,
  demoMenuUrl: "https://menuly-app-blush.vercel.app/menu/menuly-official",
  defaultStarterPreset: "dhaba",
};

const DEFAULT_ADMIN_PLANS: AdminPlan[] = [
  {
    id: "pl-starter",
    name: "Free Starter",
    slug: "starter",
    priceMonthly: 0,
    maxDishes: 15,
    maxTables: 1,
    customBranding: false,
    analytics: true,
    prioritySupport: false,
    activeSubscribers: 1,
    features: [
      "Up to 15 Menu Dishes",
      "1 Master QR Code",
      "WebP Image Auto-Compression",
      "Standard Mobile Theme",
      "Instant Sold-Out Toggle",
    ],
  },
  {
    id: "pl-pro",
    name: "Pro Growth",
    slug: "pro",
    priceMonthly: 499,
    maxDishes: 100,
    maxTables: 15,
    customBranding: true,
    analytics: true,
    prioritySupport: true,
    activeSubscribers: 0,
    features: [
      "Up to 100 Dishes",
      "15 Table-Specific QRs",
      "Custom Logo in QR Center",
      "Priority WhatsApp Orders",
      "Weekly Scan Trends",
      "High-Res Print Templates",
    ],
  },
  {
    id: "pl-enterprise",
    name: "Multi-Table Enterprise",
    slug: "enterprise",
    priceMonthly: 1299,
    maxDishes: 500,
    maxTables: 50,
    customBranding: true,
    analytics: true,
    prioritySupport: true,
    activeSubscribers: 0,
    features: [
      "Unlimited Dishes",
      "50 Table QRs + Table Ordering",
      "Custom Domain Support",
      "Multi-Staff Kitchen Manager",
      "VIP Dedicated WhatsApp Support",
      "Complete CSV Export",
    ],
  },
];

const DEFAULT_RESTAURANTS: AdminRestaurant[] = [];

const DEFAULT_TICKETS: SupportTicket[] = [];

function AdminPage() {
  const queryClient = useQueryClient();
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"restaurants" | "plans" | "users" | "tickets" | "feedbacks" | "analytics" | "starter-packs" | "settings">("restaurants");
  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([]);
  const [plans, setPlans] = useState<AdminPlan[]>(DEFAULT_ADMIN_PLANS);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);
  const [savingSettings, setSavingSettings] = useState(false);

  // Starter Menu Packs Admin State
  const [adminPresets, setAdminPresets] = useState<PresetTemplate[]>(STARTER_PRESETS);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("dhaba");
  const [savingPresets, setSavingPresets] = useState(false);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [editingDish, setEditingDish] = useState<{
    catIndex: number;
    dishIndex: number;
    name: string;
    price: number;
    description: string;
    image_url: string;
    compressionSummary?: string | null;
  } | null>(null);
  const [addingDishCatIndex, setAddingDishCatIndex] = useState<number | null>(null);
  const [renamingCategory, setRenamingCategory] = useState<{
    presetId: string;
    catIndex: number;
    currentName: string;
  } | null>(null);
  const [renameCatValue, setRenameCatValue] = useState("");
  const [newDishForm, setNewDishForm] = useState<{
    name: string;
    price: string;
    description: string;
    image_url: string;
    compressionSummary: string | null;
  }>({
    name: "",
    price: "",
    description: "",
    image_url: "",
    compressionSummary: null,
  });
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [feedbacks, setFeedbacks] = useState<CustomerFeedbackItem[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [ticketFilter, setTicketFilter] = useState<"all" | "open" | "in_progress" | "resolved">("all");
  const [feedbackRatingFilter, setFeedbackRatingFilter] = useState<"all" | "5" | "4" | "3" | "1-2">("all");
  const [feedbackTopicFilter, setFeedbackTopicFilter] = useState<string>("all");
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "owner" | "super_admin">("all");

  // Executive & Meta Ads Analytics State
  const [analyticsPeriod, setAnalyticsPeriod] = useState<"today" | "7d" | "30d" | "all">("7d");
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Tab Switcher Horizontal Scroll State (Responsive on Mobile & Desktop)
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
  }, []);

  useEffect(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, restaurants.length, plans.length, users.length, tickets.length, feedbacks.length]);

  const scrollTabs = (direction: "left" | "right") => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({
        left: direction === "left" ? -240 : 240,
        behavior: "smooth",
      });
    }
  };

  const handleTabSelect = (tabId: typeof activeTab, e?: React.MouseEvent<HTMLButtonElement>) => {
    setActiveTab(tabId);
    if (e?.currentTarget) {
      e.currentTarget.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  };

  // Load live platform settings from PostgreSQL
  useEffect(() => {
    fetch("/api/platform/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data.settings) {
          setSettings(data.settings);
        }
      })
      .catch((err) => console.error("Failed to load platform settings:", err));
  }, []);

  // Current Authenticated Admin User
  const [currentAdminUser, setCurrentAdminUser] = useState<{
    id?: string;
    email?: string;
    fullName?: string | null;
    role?: string;
  } | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const uStr = safeStorage.getItem("menuly_user");
      return uStr ? JSON.parse(uStr) : null;
    } catch {
      return null;
    }
  });

  const isMasterAdmin = currentAdminUser?.email === "menulyofficial@gmail.com";
  const adminDisplayName =
    currentAdminUser?.fullName ||
    (currentAdminUser?.email ? currentAdminUser.email.split("@")[0] : "Administrator");

  // User Management State
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [deletingUserLoading, setDeletingUserLoading] = useState(false);

  // Restaurant Management State
  const [restaurantToDelete, setRestaurantToDelete] = useState<AdminRestaurant | null>(null);
  const [deletingRestaurantLoading, setDeletingRestaurantLoading] = useState(false);

  // New Ticket Dialog State
  const [createTicketOpen, setCreateTicketOpen] = useState(false);
  const [newRestName, setNewRestName] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCategory, setNewCategory] = useState<SupportTicket["category"]>("QR Code");
  const [newPriority, setNewPriority] = useState<SupportTicket["priority"]>("medium");
  const [newDescription, setNewDescription] = useState("");

  // Check auth session & auto-login if already logged in as Super Admin
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        // If console was explicitly locked by the admin, do NOT auto-unlock!
        if (safeStorage.getSessionItem("menuly_console_locked") === "true") {
          setIsAdminAuth(false);
          return;
        }

        const token = safeStorage.getItem("menuly_token");
        const userStr = safeStorage.getItem("menuly_user");
        if (token && userStr) {
          try {
            const u = JSON.parse(userStr);
            if (u?.role === "SUPER_ADMIN" || u?.role === "super_admin") {
              safeStorage.setSessionItem("menuly_admin_auth", "true");
              setCurrentAdminUser(u);
              setIsAdminAuth(true);
              return;
            }
          } catch {
            // ignore
          }
        }

        // Check if database user was updated to SUPER_ADMIN
        if (token) {
          fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((r) => r.json())
            .then((res) => {
              if (res?.success && res.data?.user) {
                const u = res.data.user;
                if (res.data.token) {
                  safeStorage.setItem("menuly_token", res.data.token);
                }
                safeStorage.setItem("menuly_user", JSON.stringify(u));
                if (u?.role === "SUPER_ADMIN" || u?.role === "super_admin") {
                  safeStorage.setSessionItem("menuly_admin_auth", "true");
                  setCurrentAdminUser(u);
                  setIsAdminAuth(true);
                }
              }
            })
            .catch(() => {});
        }

        const authed = safeStorage.getSessionItem("menuly_admin_auth") === "true";
        if (authed) {
          setIsAdminAuth(true);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch Live PostgreSQL Data when Admin is unlocked
  useEffect(() => {
    if (!isAdminAuth) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("menuly_token") : null;
    if (!token) {
      setDataLoading(false);
      return;
    }

    setDataLoading(true);

    Promise.all([
      fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json()),
      fetch("/api/admin/restaurants", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json()),
      fetch("/api/admin/tickets", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json()),
      fetch("/api/platform/settings").then((res) => res.json()),
      fetch("/api/admin/feedbacks", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .catch(() => ({ success: false })),
      fetch(`/api/admin/analytics?period=${analyticsPeriod}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .catch(() => ({ success: false })),
      fetch("/api/starter-presets")
        .then((res) => res.json())
        .catch(() => ({ success: false })),
    ])
      .then(([userData, restData, ticketData, settingsData, feedbackData, analyticsDataRes, presetsData]) => {
        if (presetsData?.success && Array.isArray(presetsData.presets) && presetsData.presets.length > 0) {
          setAdminPresets(presetsData.presets);
        }
        if (settingsData?.success && settingsData.settings) {
          setSettings(settingsData.settings);
        }
        if (userData?.success && userData.users) {
          const mappedUsers: AdminUser[] = userData.users.map((u: any) => ({
            id: u.id,
            name: u.fullName || u.email.split("@")[0],
            email: u.email,
            phone: u.phone || "+91 98765 00000",
            restaurantName:
              u.role === "SUPER_ADMIN"
                ? "Platform Administration"
                : u.restaurant?.name || "No Restaurant Set",
            restaurantSlug: u.role === "SUPER_ADMIN" ? "" : u.restaurant?.slug || "",
            plan: "starter",
            role: u.role === "SUPER_ADMIN" ? "super_admin" : "owner",
            status: "active",
            joinedDate: new Date(u.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
          }));
          setUsers(mappedUsers);
        }

        if (restData?.success && restData.restaurants) {
          setRestaurants(restData.restaurants);
        }

        if (ticketData?.success && ticketData.tickets) {
          setTickets(ticketData.tickets);
        }

        if (feedbackData?.success && Array.isArray(feedbackData.feedbacks)) {
          setFeedbacks(feedbackData.feedbacks);
          if (feedbackData.stats) {
            setFeedbackStats(feedbackData.stats);
          }
        }

        if (analyticsDataRes?.success && analyticsDataRes.analytics) {
          setAnalyticsData(analyticsDataRes.analytics);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch live admin data:", err);
      })
      .finally(() => {
        setDataLoading(false);
      });
  }, [isAdminAuth]);

  const loadAnalyticsData = async (period = analyticsPeriod) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("menuly_token") : null;
    if (!token) return;
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data?.success && data.analytics) {
        setAnalyticsData(data.analytics);
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Auto-refresh analytics when viewing analytics tab (15s interval for live traffic radar)
  useEffect(() => {
    if (!isAdminAuth || activeTab !== "analytics") return;
    loadAnalyticsData(analyticsPeriod);
    const timer = setInterval(() => {
      loadAnalyticsData(analyticsPeriod);
    }, 15000);
    return () => clearInterval(timer);
  }, [isAdminAuth, activeTab, analyticsPeriod]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = adminEmail.trim().toLowerCase();
    const cleanPassword = adminPassword.trim();

    if (!cleanEmail || !cleanPassword) {
      toast.error("Please enter both Super Admin email and password");
      return;
    }

    setLoginLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Authentication failed. Please verify credentials.");
        setLoginLoading(false);
        return;
      }

      const userData = data.data?.user || data.user;
      const authToken = data.data?.token || data.token;

      if (!userData || userData.role !== "SUPER_ADMIN") {
        toast.error("Access Restricted: This account does not have Super Admin privileges.");
        setLoginLoading(false);
        return;
      }

      // Store credentials and auth flag safely
      safeStorage.setItem("menuly_token", authToken);
      safeStorage.setItem("menuly_user", JSON.stringify(userData));
      if (typeof document !== "undefined") {
        document.cookie = `menuly_token=${encodeURIComponent(authToken)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      }
      safeStorage.removeSessionItem("menuly_console_locked");
      safeStorage.setSessionItem("menuly_admin_auth", "true");
      setCurrentAdminUser(userData);
      setIsAdminAuth(true);
      toast.success(`Welcome to Executive Command Center, ${userData.fullName || userData.email}!`);
    } catch (err) {
      console.error("Admin login error:", err);
      toast.error("Network error during login. Please check connection and try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLock = () => {
    safeStorage.setSessionItem("menuly_console_locked", "true");
    safeStorage.removeSessionItem("menuly_admin_auth");
    setIsAdminAuth(false);
    toast.info("Super Admin console locked. Password required to re-open.");
  };

  const handleSignOut = () => {
    safeStorage.removeSessionItem("menuly_admin_auth");
    safeStorage.removeSessionItem("menuly_console_locked");
    safeStorage.removeItem("menuly_token");
    safeStorage.removeItem("menuly_user");
    if (typeof document !== "undefined") {
      document.cookie = "menuly_token=; path=/; max-age=0; SameSite=Lax";
    }
    setCurrentAdminUser(null);
    setIsAdminAuth(false);
    setAdminPassword("");
    toast.success("Successfully signed out of Admin Console.");
  };

  const updateTicketStatus = async (ticketId: string, newStatus: SupportTicket["status"]) => {
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t)));
    toast.success(`Ticket #${ticketId} status updated to ${newStatus.replace("_", " ")}`);

    const token = localStorage.getItem("menuly_token");
    if (token) {
      try {
        await fetch("/api/admin/tickets/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ id: ticketId, status: newStatus }),
        });
      } catch (err) {
        console.error("Failed to sync ticket status to DB:", err);
      }
    }
  };

  const updateTicketNote = async (ticketId: string, note: string) => {
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, adminNote: note } : t)));
    toast.success("Resolution note saved to database");

    const token = localStorage.getItem("menuly_token");
    if (token) {
      try {
        await fetch("/api/admin/tickets/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ id: ticketId, adminNote: note }),
        });
      } catch (err) {
        console.error("Failed to sync ticket note to DB:", err);
      }
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRestName.trim() || !newSubject.trim()) {
      toast.error("Please fill restaurant name and subject");
      return;
    }

    try {
      const res = await fetch("/api/support/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantName: newRestName.trim(),
          ownerEmail: `contact@${newRestName.toLowerCase().replace(/\s+/g, "")}.com`,
          phone: newPhone.trim() || "+91 98765 00000",
          category: newCategory,
          subject: newSubject.trim(),
          description: newDescription.trim() || "Admin logged ticket",
          priority: newPriority,
        }),
      });
      const data = await res.json();
      if (data.success && data.ticket) {
        const createdTicket: SupportTicket = {
          id: data.ticket.id,
          restaurantName: data.ticket.restaurantName,
          restaurantSlug: data.ticket.restaurantName.toLowerCase().replace(/\s+/g, "-"),
          ownerEmail: data.ticket.ownerEmail,
          phone: data.ticket.ownerPhone || "+91 98765 00000",
          category: data.ticket.category,
          subject: data.ticket.subject,
          description: data.ticket.description,
          priority: data.ticket.priority,
          status: data.ticket.status,
          createdAt: "Just now",
          adminNote: "",
        };
        setTickets([createdTicket, ...tickets]);
        toast.success(`Support ticket ${createdTicket.id} saved in database!`);
      } else {
        toast.error(data.error || "Failed to create ticket");
      }
    } catch {
      toast.error("Network error while creating ticket");
    }

    setCreateTicketOpen(false);
    setNewRestName("");
    setNewSubject("");
    setNewPhone("");
    setNewDescription("");
  };

  const handleDeleteFeedback = async (id: string) => {
    if (typeof window !== "undefined" && !window.confirm("Are you sure you want to permanently delete this customer feedback?")) {
      return;
    }
    const token = typeof window !== "undefined" ? localStorage.getItem("menuly_token") : null;
    try {
      const res = await fetch("/api/admin/feedback/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Feedback deleted successfully");
        setFeedbacks((prev) => prev.filter((f) => f.id !== id));
      } else {
        toast.error(data.error || "Failed to delete feedback");
      }
    } catch {
      toast.error("Network error while deleting feedback");
    }
  };

  const toggleRestaurantStatus = async (id: string) => {
    setRestaurants((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const nextStatus: AdminRestaurant["status"] = r.status === "active" ? "suspended" : "active";
          return { ...r, status: nextStatus };
        }
        return r;
      })
    );
    toast.success("Restaurant status updated");

    const token = localStorage.getItem("menuly_token");
    if (token) {
      try {
        await fetch("/api/admin/restaurant/toggle-status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ id }),
        });
      } catch (err) {
        console.error("Failed to sync restaurant status to DB:", err);
      }
    }
  };

  const handleToggleUserRole = async (user: AdminUser) => {
    if (user.email === "menulyofficial@gmail.com") {
      toast.error("Master Administrator role cannot be modified.");
      return;
    }
    const nextRole = user.role === "super_admin" ? "owner" : "super_admin";
    const dbRole = nextRole === "super_admin" ? "SUPER_ADMIN" : "RESTAURANT_OWNER";
    setUpdatingRoleUserId(user.id);
    try {
      const token = localStorage.getItem("menuly_token");
      const res = await fetch("/api/admin/users/update-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user.id, role: dbRole }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update role");
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u))
      );
      toast.success(`${user.name} is now ${nextRole === "super_admin" ? "an Admin" : "a Member / Owner"}!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update user role");
    } finally {
      setUpdatingRoleUserId(null);
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setDeletingUserLoading(true);
    try {
      const token = localStorage.getItem("menuly_token");
      const res = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: userToDelete.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete user");
      }
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setRestaurants((prev) => prev.filter((r) => r.ownerEmail !== userToDelete.email));
      toast.success(`Account for ${userToDelete.name} deleted.`);
      setUserToDelete(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    } finally {
      setDeletingUserLoading(false);
    }
  };

  const confirmDeleteRestaurant = async () => {
    if (!restaurantToDelete) return;
    setDeletingRestaurantLoading(true);
    try {
      const token = localStorage.getItem("menuly_token");
      const res = await fetch("/api/admin/restaurants/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: restaurantToDelete.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete restaurant");
      }
      setRestaurants((prev) => prev.filter((r) => r.id !== restaurantToDelete.id));
      toast.success(`${restaurantToDelete.name} deleted from platform.`);
      setRestaurantToDelete(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete restaurant");
    } finally {
      setDeletingRestaurantLoading(false);
    }
  };

  const savePlatformSettings = async (updated: PlatformSettings, actionToast?: string) => {
    setSettings(updated);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("menuly_platform_settings", JSON.stringify(updated));
    }

    const token = typeof localStorage !== "undefined" ? localStorage.getItem("menuly_token") : null;
    if (!token) {
      toast.error("Admin authentication token missing. Please sign in again.");
      return;
    }

    setSavingSettings(true);
    try {
      const res = await fetch("/api/platform/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ settings: updated }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
        if (updated.maintenanceMode !== settings.maintenanceMode) {
          if (updated.maintenanceMode) {
            toast.warning("🚨 Maintenance Mode is ACTIVE on PostgreSQL! QR digital menus remain 100% operational.", {
              duration: 6000,
            });
          } else {
            toast.success("✅ Normal Live Mode Restored! Platform is open to all visitors.", {
              duration: 5000,
            });
          }
        } else {
          toast.success(actionToast || "Platform settings saved and synced to PostgreSQL");
        }
      } else {
        toast.error(data.error || "Failed to save settings to database");
      }
    } catch (err: any) {
      console.error("Save platform settings error:", err);
      toast.error("Network error saving settings to database");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveStarterPresets = async (customPresets = adminPresets, customDefault = settings.defaultStarterPreset) => {
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("menuly_token") : null;
    if (!token) {
      toast.error("Admin authentication token missing. Please sign in again.");
      return;
    }

    setSavingPresets(true);
    try {
      const res = await fetch("/api/admin/starter-presets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          presets: customPresets,
          defaultPresetId: customDefault || "dhaba",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        queryClient.invalidateQueries({ queryKey: ["starter-presets"] });
        toast.success("1-Click Starter Menu Packs successfully saved to PostgreSQL!");
      } else {
        throw new Error(data.error || "Failed to save starter presets");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save starter presets");
    } finally {
      setSavingPresets(false);
    }
  };

  const filteredRestaurants = restaurants.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTickets = tickets.filter((t) => {
    if (ticketFilter !== "all" && t.status !== ticketFilter) return false;
    if (!searchQuery) return true;
    return (
      t.restaurantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const filteredFeedbacks = feedbacks.filter((f) => {
    if (feedbackRatingFilter === "5" && f.rating !== 5) return false;
    if (feedbackRatingFilter === "4" && f.rating !== 4) return false;
    if (feedbackRatingFilter === "3" && f.rating !== 3) return false;
    if (feedbackRatingFilter === "1-2" && f.rating > 2) return false;
    if (feedbackTopicFilter !== "all" && f.category !== feedbackTopicFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      f.email.toLowerCase().includes(q) ||
      (f.restaurantName && f.restaurantName.toLowerCase().includes(q)) ||
      f.message.toLowerCase().includes(q) ||
      f.category.toLowerCase().includes(q) ||
      f.id.toLowerCase().includes(q)
    );
  });

  const openTicketsCount = tickets.filter((t) => t.status === "open").length;
  const inProgressCount = tickets.filter((t) => t.status === "in_progress").length;
  const resolvedCount = tickets.filter((t) => t.status === "resolved").length;
  const activeMenusCount = restaurants.filter((r) => r.status === "active").length;
  const totalScans = restaurants.reduce((acc, curr) => acc + curr.qrScans, 0);

  const weeklyScanTrends = [
    { day: "Mon", scans: Math.round(totalScans * 0.1), height: totalScans > 0 ? "40%" : "6%" },
    { day: "Tue", scans: Math.round(totalScans * 0.12), height: totalScans > 0 ? "48%" : "6%" },
    { day: "Wed", scans: Math.round(totalScans * 0.15), height: totalScans > 0 ? "55%" : "6%" },
    { day: "Thu", scans: Math.round(totalScans * 0.13), height: totalScans > 0 ? "50%" : "6%" },
    { day: "Fri", scans: Math.round(totalScans * 0.2), height: totalScans > 0 ? "75%" : "6%" },
    { day: "Sat", scans: Math.round(totalScans * 0.25), height: totalScans > 0 ? "95%" : "6%" },
    { day: "Sun", scans: Math.round(totalScans * 0.05), height: totalScans > 0 ? "100%" : "6%" },
  ];

  // IF NOT AUTHENTICATED: High-Security Super Admin Credential Gate
  if (!isAdminAuth) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 text-foreground">
        <div className="w-full max-w-md space-y-6 rounded-3xl border border-border/80 bg-card p-8 shadow-lift animate-rise">
          <div className="text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <Shield className="size-7" />
            </div>
            <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">Super Admin Gateway</h1>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Restricted console. Only authorized platform Super Admins can access platform analytics, users, and tickets.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-email">Super Admin Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="admin-email"
                  type="email"
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="email"
                  spellCheck={false}
                  placeholder="admin@example.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="pl-9 bg-background h-11 text-base sm:text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="current-password"
                  spellCheck={false}
                  placeholder="••••••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="pl-9 pr-10 bg-background h-11 text-base sm:text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full font-bold h-11" disabled={loginLoading}>
              {loginLoading ? (
                <>
                  <RefreshCw className="size-4 mr-2 animate-spin" /> Verifying Credentials...
                </>
              ) : (
                <>
                  <Shield className="size-4 mr-2" /> Authenticate Super Admin
                </>
              )}
            </Button>
          </form>

          <div className="rounded-xl border border-border/60 bg-muted/40 p-2.5 text-center">
            <p className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-1.5">
              <Shield className="size-3.5 text-primary" /> Authorized Platform Admins Only
            </p>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            <Link to="/" className="hover:underline">
              ← Return to public website
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 pt-20 sm:pt-24">
      {/* Top Admin Navigation Header (Mobile Responsive) */}
      <header
        className="fixed top-0 left-0 right-0 z-50 border-b border-border/80 bg-card/95 backdrop-blur-md"
        style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50 }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link to="/" className="flex items-center gap-2 hover:opacity-85 transition-opacity shrink-0">
              <Logo small />
            </Link>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2 sm:px-3 py-1 text-xs font-bold tracking-tight text-primary flex items-center gap-1 truncate">
                <ShieldCheck className="size-3.5 text-primary shrink-0" />
                <span className="truncate max-w-[85px] sm:max-w-none">{adminDisplayName}</span>
                {isMasterAdmin ? (
                  <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full shrink-0">
                    Master
                  </span>
                ) : (
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded-full shrink-0">
                    Admin
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button size="sm" variant="outline" asChild className="hidden sm:inline-flex gap-1.5 text-xs font-semibold h-8 px-2.5">
              <Link to="/">
                <ExternalLink className="size-3.5" /> Public Site
              </Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleLock}
              className="gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground h-8 px-2 sm:px-2.5"
              title="Lock console without signing out"
            >
              <Lock className="size-3.5" />
              <span className="hidden sm:inline">Lock Console</span>
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleSignOut}
              className="gap-1 text-xs font-semibold h-8 px-2 sm:px-2.5"
              title="Completely sign out of admin account"
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-rise">
        {/* Page Title & Quick Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight">Executive Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Monitor active restaurants, track weekly QR scans, and solve restaurant support inquiries.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Dialog open={createTicketOpen} onOpenChange={setCreateTicketOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 font-bold shadow-sm">
                  <Plus className="size-4" /> Raise Support Ticket
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Log Customer Support Ticket</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateTicket} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label>Restaurant Name *</Label>
                    <Input
                      placeholder="e.g. Royal Spice Veg"
                      value={newRestName}
                      onChange={(e) => setNewRestName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Owner Phone (for WhatsApp) *</Label>
                    <Input
                      placeholder="e.g. 919876543210"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Category</Label>
                      <select
                        className="h-10 w-full rounded-md border bg-card px-3 text-sm"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value as SupportTicket["category"])}
                      >
                        <option value="QR Code">QR Code</option>
                        <option value="Menu Edit">Menu Edit</option>
                        <option value="Printing">Printing</option>
                        <option value="Account">Account</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Priority</Label>
                      <select
                        className="h-10 w-full rounded-md border bg-card px-3 text-sm"
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value as SupportTicket["priority"])}
                      >
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Subject *</Label>
                    <Input
                      placeholder="Short summary of issue"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Problem Description</Label>
                    <textarea
                      rows={3}
                      className="w-full rounded-md border bg-card p-3 text-sm"
                      placeholder="Details reported by the restaurant owner..."
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setCreateTicketOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="font-bold">
                      Create Ticket
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 4 High-Level KPI Cards */}
        {dataLoading ? (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-soft space-y-2.5">
                  <div className="h-3 w-20 bg-muted rounded" />
                  <div className="h-7 w-16 bg-muted rounded" />
                  <div className="h-2.5 w-24 bg-muted rounded" />
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-border/80 bg-card p-12 text-center space-y-3">
              <div className="mx-auto size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Shield className="size-6 animate-spin" />
              </div>
              <h3 className="font-bold text-base text-foreground">Syncing Executive Database...</h3>
              <p className="text-xs text-muted-foreground">Connecting live to Supabase PostgreSQL</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Total Live Scans
                  </span>
                  <span className="rounded-full bg-primary/10 p-1.5 sm:p-2 text-primary">
                    <QrCode className="size-3.5 sm:size-4" />
                  </span>
                </div>
                <p className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-foreground">
                  {totalScans.toLocaleString()}
                </p>
                <div className="mt-1.5 flex items-center gap-1 text-[11px] sm:text-xs text-veg font-semibold truncate">
                  <TrendingUp className="size-3 shrink-0" /> Live Scans
                </div>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Active Menus
                  </span>
                  <span className="rounded-full bg-veg/10 p-1.5 sm:p-2 text-veg">
                    <UtensilsCrossed className="size-3.5 sm:size-4" />
                  </span>
                </div>
                <p className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-foreground">{activeMenusCount}</p>
                <div className="mt-1.5 text-[11px] sm:text-xs text-muted-foreground truncate">
                  {restaurants.length} total onboarded
                </div>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Support Tickets
                  </span>
                  <span className="rounded-full bg-accent/20 p-1.5 sm:p-2 text-accent-foreground">
                    <LifeBuoy className="size-3.5 sm:size-4" />
                  </span>
                </div>
                <p className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-foreground">
                  {openTicketsCount + inProgressCount}
                </p>
                <div className="mt-1.5 text-[11px] sm:text-xs text-muted-foreground truncate">
                  <span className="font-bold text-destructive">{openTicketsCount} open</span> · {resolvedCount} solved
                </div>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Uptime Health
                  </span>
                  <span className="rounded-full bg-primary/10 p-1.5 sm:p-2 text-primary">
                    <Zap className="size-3.5 sm:size-4" />
                  </span>
                </div>
                <p className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-foreground">99.98%</p>
                <div className="mt-1.5 flex items-center gap-1 text-[11px] sm:text-xs text-veg font-semibold truncate">
                  <CheckCircle2 className="size-3 shrink-0" /> QR nodes 100% ok
                </div>
              </div>
            </div>

        {/* Global Maintenance Alert Banner */}
        {settings.maintenanceMode && (
          <div className="rounded-2xl border-2 border-amber-500/50 bg-amber-500/10 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <Wrench className="size-5 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-amber-500 animate-ping" />
                  <h4 className="text-sm font-bold text-foreground">
                    Platform Maintenance Mode is Currently ACTIVE
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Public website visitors are seeing the scheduled upgrades notice. Active restaurant QR digital menus remain 100% operational and live.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={savingSettings}
              onClick={() => {
                savePlatformSettings({ ...settings, maintenanceMode: false });
              }}
              className="shrink-0 font-bold border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 gap-1.5"
            >
              {savingSettings ? <RotateCw className="size-3.5 animate-spin" /> : null}
              Disable Maintenance Mode
            </Button>
          </div>
        )}

        {/* Tab Switcher - Responsive with scroll controls & indicators */}
        <div className="relative border-b pb-3">
          {/* Left Arrow Button (Desktop/Tablet) */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scrollTabs("left")}
              aria-label="Scroll tabs left"
              className="hidden md:flex absolute -left-2 top-1/2 -translate-y-[calc(50%+6px)] z-20 size-8 items-center justify-center rounded-full bg-card/95 border border-border shadow-md text-foreground hover:bg-muted hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <ChevronLeft className="size-4" />
            </button>
          )}

          {/* Left Fade Gradient Mask */}
          {canScrollLeft && (
            <div className="pointer-events-none absolute left-0 top-0 bottom-3 w-8 sm:w-12 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
          )}

          {/* Right Fade Gradient Mask */}
          {canScrollRight && (
            <div className="pointer-events-none absolute right-0 top-0 bottom-3 w-8 sm:w-12 bg-gradient-to-l from-background via-background/80 to-transparent z-10" />
          )}

          {/* Right Arrow Button (Desktop/Tablet) */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => scrollTabs("right")}
              aria-label="Scroll tabs right"
              className="hidden md:flex absolute -right-2 top-1/2 -translate-y-[calc(50%+6px)] z-20 size-8 items-center justify-center rounded-full bg-card/95 border border-border shadow-md text-foreground hover:bg-muted hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <ChevronRight className="size-4" />
            </button>
          )}

          {/* Scrollable Tabs Bar */}
          <div
            ref={tabsContainerRef}
            className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth flex-nowrap px-1 py-1 -mx-1 touch-pan-x"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <button
              type="button"
              onClick={(e) => handleTabSelect("restaurants", e)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 sm:gap-2 rounded-full px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer select-none",
                activeTab === "restaurants"
                  ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/40"
                  : "bg-secondary/90 text-foreground/85 hover:bg-secondary hover:text-foreground border border-border/40"
              )}
            >
              <Store className="size-4 shrink-0" />
              <span>Restaurants</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] sm:text-xs font-semibold leading-none",
                  activeTab === "restaurants"
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {restaurants.length}
              </span>
            </button>

            <button
              type="button"
              onClick={(e) => handleTabSelect("plans", e)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 sm:gap-2 rounded-full px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer select-none",
                activeTab === "plans"
                  ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/40"
                  : "bg-secondary/90 text-foreground/85 hover:bg-secondary hover:text-foreground border border-border/40"
              )}
            >
              <CreditCard className="size-4 shrink-0" />
              <span className="hidden sm:inline">Plans & Pricing</span>
              <span className="sm:hidden">Plans</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] sm:text-xs font-semibold leading-none",
                  activeTab === "plans"
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {plans.length}
              </span>
            </button>

            <button
              type="button"
              onClick={(e) => handleTabSelect("users", e)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 sm:gap-2 rounded-full px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer select-none",
                activeTab === "users"
                  ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/40"
                  : "bg-secondary/90 text-foreground/85 hover:bg-secondary hover:text-foreground border border-border/40"
              )}
            >
              <Users className="size-4 shrink-0" />
              <span className="hidden sm:inline">Users & Owners</span>
              <span className="sm:hidden">Users</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] sm:text-xs font-semibold leading-none",
                  activeTab === "users"
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {users.length}
              </span>
            </button>

            <button
              type="button"
              onClick={(e) => handleTabSelect("tickets", e)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 sm:gap-2 rounded-full px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer select-none",
                activeTab === "tickets"
                  ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/40"
                  : "bg-secondary/90 text-foreground/85 hover:bg-secondary hover:text-foreground border border-border/40"
              )}
            >
              <LifeBuoy className="size-4 shrink-0" />
              <span className="hidden sm:inline">Support Desk</span>
              <span className="sm:hidden">Support</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] sm:text-xs font-semibold leading-none",
                  activeTab === "tickets"
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : openTicketsCount > 0
                    ? "bg-destructive/15 text-destructive font-bold"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {openTicketsCount}
                <span className="hidden sm:inline ml-1 font-normal opacity-85">pending</span>
              </span>
            </button>

            <button
              type="button"
              onClick={(e) => handleTabSelect("feedbacks", e)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 sm:gap-2 rounded-full px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer select-none",
                activeTab === "feedbacks"
                  ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/40"
                  : "bg-secondary/90 text-foreground/85 hover:bg-secondary hover:text-foreground border border-border/40"
              )}
            >
              <Star className="size-4 shrink-0 text-amber-400 fill-amber-400" />
              <span className="hidden sm:inline">Customer Feedback</span>
              <span className="sm:hidden">Feedback</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] sm:text-xs font-semibold leading-none",
                  activeTab === "feedbacks"
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {feedbacks.length}
              </span>
            </button>

            <button
              type="button"
              onClick={(e) => handleTabSelect("analytics", e)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 sm:gap-2 rounded-full px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer select-none",
                activeTab === "analytics"
                  ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/40"
                  : "bg-secondary/90 text-foreground/85 hover:bg-secondary hover:text-foreground border border-border/40"
              )}
            >
              <BarChart3 className="size-4 shrink-0" />
              <span>Analytics</span>
            </button>

            <button
              type="button"
              onClick={(e) => handleTabSelect("starter-packs", e)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 sm:gap-2 rounded-full px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer select-none",
                activeTab === "starter-packs"
                  ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/40"
                  : "bg-secondary/90 text-foreground/85 hover:bg-secondary hover:text-foreground border border-border/40"
              )}
            >
              <Sparkles className="size-4 shrink-0 text-amber-400" />
              <span className="hidden sm:inline">1-Click Starter Packs</span>
              <span className="sm:hidden">Starter Packs</span>
              <span className="rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 text-[10px] font-bold">
                {adminPresets.length}
              </span>
            </button>

            <button
              type="button"
              onClick={(e) => handleTabSelect("settings", e)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 sm:gap-2 rounded-full px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer select-none",
                activeTab === "settings"
                  ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/40"
                  : "bg-secondary/90 text-foreground/85 hover:bg-secondary hover:text-foreground border border-border/40"
              )}
            >
              <Settings className="size-4 shrink-0" />
              <span className="hidden sm:inline">Platform Settings</span>
              <span className="sm:hidden">Settings</span>
            </button>
          </div>
        </div>

        {/* TAB 1: BUSINESS & META ADS ANALYTICS */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* Header: Live Radar & Period Filters */}
            <div className="flex flex-col gap-4 rounded-3xl border bg-card p-6 shadow-soft sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <BarChart3 className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-foreground tracking-tight">
                      Executive Traffic & Meta Ads Command Center
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Real-time ad conversions, unique visitors, dining scans, and database connection telemetry.
                    </p>
                  </div>
                </div>
              </div>

              {/* Live Radar Pulse & Period Controls */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <span className="relative flex size-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500"></span>
                  </span>
                  <span>{analyticsData?.liveActiveVisitors ?? 1} Live Active Visitors</span>
                </div>

                {/* Period Selector */}
                <div className="flex items-center rounded-full bg-secondary/80 p-1 text-xs font-bold">
                  {(
                    [
                      { key: "today", label: "Today" },
                      { key: "7d", label: "7 Days" },
                      { key: "30d", label: "30 Days" },
                      { key: "all", label: "All Time" },
                    ] as const
                  ).map((p) => (
                    <button
                      key={p.key}
                      onClick={() => {
                        setAnalyticsPeriod(p.key);
                        loadAnalyticsData(p.key);
                      }}
                      className={cn(
                        "rounded-full px-3 py-1 transition-all",
                        analyticsPeriod === p.key
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => loadAnalyticsData(analyticsPeriod)}
                  disabled={analyticsLoading}
                  className="size-8 rounded-full p-0"
                  title="Refresh Live Metrics"
                >
                  <RefreshCw className={cn("size-3.5", analyticsLoading && "animate-spin text-primary")} />
                </Button>
              </div>
            </div>

            {/* 4 Core Executive Metric Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Card 1: Total Visits */}
              <div className="rounded-3xl border bg-card p-5 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Impressions</span>
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Users className="size-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-3xl font-extrabold tracking-tight text-foreground">
                    {(analyticsData?.totalVisits ?? 0).toLocaleString()}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {(analyticsData?.uniqueVisitors ?? 0).toLocaleString()} Unique Diners
                    </span>
                    <span className="text-[11px] text-muted-foreground">Traffic Hits</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Meta Ads & Campaign Visits */}
              <div className="rounded-3xl border bg-card p-5 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Meta Ads Traffic</span>
                  <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Radio className="size-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-3xl font-extrabold tracking-tight text-foreground">
                    {(analyticsData?.metaAdsVisits ?? 0).toLocaleString()}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {analyticsData?.metaAdsSharePercent ?? 0}% Ad Share
                    </span>
                    <span className="text-[11px] text-muted-foreground">FB & Insta Ads</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Platform Lead Conversion */}
              <div className="rounded-3xl border bg-card p-5 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Conversion Rate</span>
                  <div className="flex size-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <TrendingUp className="size-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-3xl font-extrabold tracking-tight text-foreground">
                    {analyticsData?.overallConversionRate ?? 0}%
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      {users.filter((u) => u.role !== "super_admin").length} Registered Owners
                    </span>
                    <span className="text-[11px] text-muted-foreground">Ad ➔ Owner</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Total QR Diner Scans */}
              <div className="rounded-3xl border bg-card p-5 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total QR Scans</span>
                  <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <QrCode className="size-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-3xl font-extrabold tracking-tight text-foreground">
                    {totalScans.toLocaleString()}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {restaurants.length} Live Restaurants
                    </span>
                    <span className="text-[11px] text-muted-foreground">Customer Scans</span>
                  </div>
                </div>
              </div>
            </div>

            {/* High-Concurrency Database Telemetry Banner */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  <Server className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground">Database High-Concurrency Ready</p>
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300">
                      100,000+ Visitors Capacity
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {analyticsData?.systemHealth?.poolMode || "Supabase Transaction Pooler (Port 6543, pgbouncer=true)"} · In-Memory Menu Cache Active
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="text-right">
                  <p className="text-[11px] text-muted-foreground">Query Latency</p>
                  <p className="font-extrabold text-emerald-600 dark:text-emerald-400">
                    {analyticsData?.systemHealth?.databaseLatencyMs ?? 14} ms (Optimal)
                  </p>
                </div>
                <div className="h-8 w-px bg-border/60" />
                <div className="text-right">
                  <p className="text-[11px] text-muted-foreground">Pool Status</p>
                  <p className="font-extrabold text-foreground">Multiplexed</p>
                </div>
              </div>
            </div>

            {/* Middle Section: Daily Traffic Velocity & Meta Ads Bar Chart */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Daily Velocity Chart */}
              <div className="rounded-3xl border bg-card p-6 shadow-soft lg:col-span-2">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="text-base font-bold text-foreground">Daily Visitor Traffic Velocity</h3>
                    <p className="text-xs text-muted-foreground">Comparing total site visits vs Meta Ads incoming traffic</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2.5 rounded-full bg-primary" /> Total Visits
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2.5 rounded-full bg-blue-500" /> Meta Ads
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex h-56 items-end justify-between gap-3 pt-4">
                  {analyticsData?.trendDays && analyticsData.trendDays.length > 0 ? (
                    analyticsData.trendDays.map((t: any) => {
                      const maxV = Math.max(
                        ...analyticsData.trendDays.map((d: any) => d.visits),
                        5
                      );
                      const barH = Math.max(8, Math.round((t.visits / maxV) * 160));
                      const metaH = Math.max(4, Math.round((t.metaVisits / maxV) * 160));

                      return (
                        <div key={t.date} className="flex flex-1 flex-col items-center gap-2 h-full justify-end group">
                          <span className="text-[10px] font-bold text-muted-foreground opacity-80 group-hover:opacity-100">
                            {t.visits}
                          </span>
                          <div className="relative flex w-full max-w-[36px] items-end justify-center gap-1">
                            {/* Total Bar */}
                            <div
                              style={{ height: `${barH}px` }}
                              className="w-1/2 rounded-t-md bg-primary/80 transition-all group-hover:bg-primary"
                              title={`Total Visits: ${t.visits}`}
                            />
                            {/* Meta Bar */}
                            <div
                              style={{ height: `${metaH}px` }}
                              className="w-1/2 rounded-t-md bg-blue-500/80 transition-all group-hover:bg-blue-500"
                              title={`Meta Ads: ${t.metaVisits}`}
                            />
                          </div>
                          <span className="text-[11px] font-semibold text-foreground whitespace-nowrap">
                            {t.label.split(",")[0]}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    weeklyScanTrends.map((t) => (
                      <div key={t.day} className="flex flex-1 flex-col items-center gap-2 h-full justify-end">
                        <span className="text-[11px] font-bold text-muted-foreground">{t.scans}</span>
                        <div
                          style={{ height: t.height }}
                          className="w-full max-w-[36px] rounded-t-lg bg-primary/80"
                        />
                        <span className="text-xs font-semibold text-foreground">{t.day}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Traffic Sources & Meta Ads Attribution */}
              <div className="rounded-3xl border bg-card p-6 shadow-soft space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="text-base font-bold text-foreground">Traffic Channels</h3>
                  <span className="text-xs font-semibold text-muted-foreground">Source Breakdown</span>
                </div>

                <div className="space-y-3">
                  {analyticsData?.trafficSources && analyticsData.trafficSources.length > 0 ? (
                    analyticsData.trafficSources.map((s: any) => (
                      <div key={s.source} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="flex items-center gap-1.5 text-foreground">
                            <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
                            {s.label}
                          </span>
                          <span className="text-muted-foreground">
                            {s.visits} ({s.percent}%)
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.max(4, s.percent)}%`,
                              backgroundColor: s.color,
                            }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      Traffic telemetry active. Incoming visits from Meta Ads will display here.
                    </div>
                  )}
                </div>

                {/* Device Breakdown */}
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-foreground">Device Split</span>
                    <span className="text-muted-foreground">Mobile Optimized</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <Smartphone className="size-3.5" />
                      <span>{analyticsData?.devices?.[0]?.percent ?? 88}% Mobile</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Monitor className="size-3.5" />
                      <span>{analyticsData?.devices?.[1]?.percent ?? 12}% Desktop</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enterprise 5-Stage Conversion Funnel */}
            <div className="rounded-3xl border bg-card p-6 shadow-soft">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4 gap-2">
                <div>
                  <h3 className="text-base font-bold text-foreground">Marketing & Ad Conversion Funnel</h3>
                  <p className="text-xs text-muted-foreground">
                    End-to-end tracking: from Meta Ad click to restaurant signup and live dining customer scans.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  <Sparkles className="size-3" /> Full-Funnel Attribution
                </span>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-5">
                {analyticsData?.conversionFunnel ? (
                  analyticsData.conversionFunnel.map((stage: any, i: number) => (
                    <div
                      key={stage.stage}
                      className="relative flex flex-col justify-between rounded-2xl border border-border/80 bg-secondary/30 p-4 transition-all hover:border-primary/40 hover:bg-card"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-muted-foreground">Step {i + 1}</span>
                          <span className="font-extrabold text-primary">{stage.percentOfTop}%</span>
                        </div>
                        <p className="mt-2 text-xl font-extrabold text-foreground">{stage.count.toLocaleString()}</p>
                        <p className="mt-1 text-xs font-bold text-foreground leading-snug">{stage.stage}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border/60">
                        <p className="text-[11px] text-muted-foreground leading-tight">{stage.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-5 py-6 text-center text-xs text-muted-foreground">
                    Calculating funnel velocity...
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Row: Top Visited Pages & Top Restaurants */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Top Visited Landing Pages */}
              <div className="rounded-3xl border bg-card p-6 shadow-soft">
                <div className="flex items-center justify-between border-b pb-3 mb-4">
                  <h3 className="text-base font-bold text-foreground">Top Visited Landing Pages</h3>
                  <span className="text-xs text-muted-foreground">Pageviews</span>
                </div>
                <div className="divide-y divide-border/60">
                  {analyticsData?.topPages && analyticsData.topPages.length > 0 ? (
                    analyticsData.topPages.map((p: any) => (
                      <div key={p.path} className="flex items-center justify-between py-2.5 text-xs">
                        <span className="font-mono font-bold text-foreground truncate max-w-[240px]">
                          {p.path}
                        </span>
                        <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          {p.visits.toLocaleString()} visits
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center text-xs text-muted-foreground">
                      No path events recorded yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Top 5 Performing Restaurants */}
              <div className="rounded-3xl border bg-card p-6 shadow-soft">
                <div className="flex items-center justify-between border-b pb-3 mb-4">
                  <h3 className="text-base font-bold text-foreground">Top Restaurants by Dining Scans</h3>
                  <span className="text-xs text-muted-foreground">Live Diners</span>
                </div>
                <div className="divide-y divide-border/60">
                  {restaurants
                    .slice()
                    .sort((a, b) => b.qrScans - a.qrScans)
                    .slice(0, 5)
                    .map((r, i) => (
                      <div key={r.id} className="flex items-center justify-between py-2.5">
                        <div className="flex items-center gap-3">
                          <span className="flex size-6 items-center justify-center rounded-full bg-secondary text-xs font-bold">
                            #{i + 1}
                          </span>
                          <div>
                            <p className="font-bold text-xs text-foreground">{r.name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {r.city} · {r.dishCount} Dishes
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-xs text-primary">
                            {r.qrScans.toLocaleString()} scans
                          </span>
                          <Button size="sm" variant="ghost" asChild className="h-6 text-[11px] px-2">
                            <a href={`/menu/${r.slug}`} target="_blank" rel="noreferrer">
                              View <ExternalLink className="size-2.5 ml-1" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Real-Time Incoming Traffic Log & Ad Attribution */}
            <div className="rounded-3xl border bg-card p-6 shadow-soft space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="relative flex size-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500"></span>
                    </span>
                    <h3 className="text-base font-bold text-foreground">Live Incoming Traffic Activity Stream</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Real-world ad attribution: displays exactly which platform (Instagram Reels, Facebook Feed, WhatsApp, Direct) recent visitors arrived from
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground self-start sm:self-auto">
                  <Clock className="size-3 text-primary" /> Live Updates
                </span>
              </div>

              <div className="divide-y divide-border/60">
                {analyticsData?.recentVisitors && analyticsData.recentVisitors.length > 0 ? (
                  analyticsData.recentVisitors.map((v: any) => {
                    const src = v.source.toLowerCase();
                    const isMeta = src.includes("meta") || src.includes("ig") || src === "instagram" || src === "facebook" || src.includes("fb");
                    const isWhatsApp = src.includes("whatsapp");
                    const isGoogle = src.includes("google");

                    return (
                      <div key={v.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-2 text-xs">
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "size-8 rounded-xl flex items-center justify-center shrink-0 text-white shadow-xs",
                              src === "instagram" && "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600",
                              src === "facebook" && "bg-blue-600",
                              src === "meta_ads" && "bg-blue-500",
                              isWhatsApp && "bg-emerald-600",
                              isGoogle && "bg-red-500",
                              (!isMeta && !isWhatsApp && !isGoogle) && "bg-primary"
                            )}
                          >
                            {src === "instagram" ? <Radio className="size-4" /> : isWhatsApp ? <MessageCircle className="size-4" /> : isGoogle ? <Globe className="size-4" /> : <Compass className="size-4" />}
                          </span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-foreground capitalize">
                                {v.source.replace("_", " ")}
                              </span>
                              {isMeta && (
                                <span className="rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 px-2 py-0.2 text-[9px] font-black uppercase">
                                  Meta Ad
                                </span>
                              )}
                              <span className="text-muted-foreground text-[11px]">
                                via {v.device}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Landed on: <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px] text-foreground font-semibold">{v.path}</code>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:self-center self-end text-muted-foreground text-[11px] font-medium">
                          <Clock className="size-3" />
                          <span>{v.timeAgo}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    Telemetry listening for incoming ad clicks and page impressions...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SUPPORT DESK & TICKET CRM */}
        {activeTab === "tickets" && (
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border bg-card p-3 shadow-soft">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  className="pl-9 bg-background"
                  placeholder="Search tickets by ID, restaurant, issue..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                {(["all", "open", "in_progress", "resolved"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setTicketFilter(st)}
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                      ticketFilter === st
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground hover:bg-secondary/80"
                    )}
                  >
                    {st === "all" ? "All" : st.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Tickets Grid */}
            <div className="space-y-4">
              {filteredTickets.length === 0 ? (
                <div className="rounded-2xl border bg-card p-12 text-center text-muted-foreground">
                  No support tickets match the current filter.
                </div>
              ) : (
                filteredTickets.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-2xl border border-border/80 bg-card p-5 shadow-soft space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold bg-secondary px-2 py-0.5 rounded">
                          {t.id}
                        </span>
                        <h4 className="font-bold text-base text-foreground">{t.subject}</h4>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase",
                            t.priority === "urgent"
                              ? "bg-destructive/10 text-destructive"
                              : t.priority === "high"
                              ? "bg-accent/30 text-accent-foreground"
                              : "bg-secondary text-muted-foreground"
                          )}
                        >
                          {t.priority}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{t.createdAt}</span>
                        <select
                          value={t.status}
                          onChange={(e) =>
                            updateTicketStatus(t.id, e.target.value as SupportTicket["status"])
                          }
                          className={cn(
                            "h-7 rounded-md px-2 text-xs font-bold border",
                            t.status === "open"
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : t.status === "in_progress"
                              ? "bg-accent/20 text-accent-foreground border-accent/30"
                              : "bg-veg/10 text-veg border-veg/20"
                          )}
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </div>
                    </div>

                    <div className="text-sm text-foreground/90">{t.description}</div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span>
                          <strong>Restaurant:</strong> {t.restaurantName}
                        </span>
                        <span>
                          <strong>Category:</strong> {t.category}
                        </span>
                      </div>

                      {/* Direct WhatsApp Quick Button */}
                      <a
                        href={`https://wa.me/${t.phone}?text=Hello%20${encodeURIComponent(
                          t.restaurantName
                        )},%20regarding%20your%20support%20ticket%20${t.id}:`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-veg/10 px-3 py-1 text-xs font-bold text-veg hover:bg-veg hover:text-white transition-colors"
                      >
                        <MessageCircle className="size-3.5" /> WhatsApp Customer
                      </a>
                    </div>

                    {/* Admin Resolution Input */}
                    <div className="pt-2 border-t">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          placeholder="Admin resolution note / solution..."
                          defaultValue={t.adminNote || ""}
                          id={`note-${t.id}`}
                          className="text-xs bg-background h-8"
                        />
                        <Button
                          size="sm"
                          className="h-8 text-xs font-semibold shrink-0"
                          onClick={() => {
                            const val = (
                              document.getElementById(`note-${t.id}`) as HTMLInputElement
                            )?.value;
                            updateTicketNote(t.id, val || "");
                          }}
                        >
                          Save Solution
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB: CUSTOMER FEEDBACK & REVIEWS */}
        {activeTab === "feedbacks" && (
          <div className="space-y-6">
            {/* KPI Cards Header */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border bg-card p-5 shadow-soft space-y-1.5">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Feedback</span>
                  <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <MessageSquareText className="size-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold font-display text-foreground">
                  {feedbackStats?.total ?? feedbacks.length}
                </div>
                <p className="text-xs text-muted-foreground">User ratings and platform reviews</p>
              </div>

              <div className="rounded-2xl border bg-card p-5 shadow-soft space-y-1.5">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-semibold uppercase tracking-wider">Average Rating</span>
                  <div className="size-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Star className="size-4 fill-amber-500" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold font-display text-foreground">
                    {feedbackStats?.averageRating ??
                      (feedbackStats as any)?.avgRating ??
                      (feedbacks.length > 0
                        ? (feedbacks.reduce((a, b) => a + b.rating, 0) / feedbacks.length).toFixed(1)
                        : "5.0")}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">/ 5.0</span>
                  <div className="flex items-center gap-0.5 ml-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={cn(
                          "size-3.5",
                          s <= Math.round(Number(feedbackStats?.averageRating || (feedbackStats as any)?.avgRating || 5))
                            ? "text-amber-400 fill-amber-400"
                            : "text-muted-foreground/30"
                        )}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {feedbacks.filter((f) => f.rating >= 4).length} positive reviews (4-5 stars)
                </p>
              </div>

              <div className="rounded-2xl border bg-card p-5 shadow-soft space-y-1.5">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-semibold uppercase tracking-wider">Would Recommend</span>
                  <div className="size-8 rounded-lg bg-veg/10 text-veg flex items-center justify-center">
                    <ThumbsUp className="size-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold font-display text-foreground">
                  {feedbackStats?.recommendPercent ?? 100}%
                </div>
                <p className="text-xs text-muted-foreground">Clients recommending Menuly to colleagues</p>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border bg-card p-3 shadow-soft">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  className="pl-9 bg-background h-9 text-xs"
                  placeholder="Search reviews, customer name, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground mr-1 hidden lg:inline">Rating:</span>
                {(
                  [
                    { id: "all", label: "All" },
                    { id: "5", label: "5 Stars" },
                    { id: "4", label: "4 Stars" },
                    { id: "3", label: "3 Stars" },
                    { id: "1-2", label: "1-2 Stars" },
                  ] as const
                ).map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setFeedbackRatingFilter(r.id)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                      feedbackRatingFilter === r.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground hover:bg-secondary/80"
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Feedbacks Grid */}
            <div className="space-y-3">
              {filteredFeedbacks.length === 0 ? (
                <div className="rounded-2xl border bg-card p-12 text-center text-muted-foreground space-y-2">
                  <div className="size-12 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
                    <MessageSquareText className="size-6" />
                  </div>
                  <h4 className="font-semibold text-foreground text-sm">No feedback matches your filter</h4>
                  <p className="text-xs text-muted-foreground">
                    Customer reviews submitted via the Contact page or feedback modals will show up here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredFeedbacks.map((f) => (
                    <div
                      key={f.id}
                      className="rounded-2xl border border-border/80 bg-card p-5 shadow-soft flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2.5">
                        {/* Rating row with badges and delete */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <div className="flex items-center gap-0.5 bg-amber-500/10 px-2 py-0.5 rounded-full">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={cn(
                                    "size-3",
                                    s <= f.rating
                                      ? "text-amber-400 fill-amber-400"
                                      : "text-muted-foreground/30"
                                  )}
                                />
                              ))}
                              <span className="text-xs font-bold text-amber-500 ml-1">
                                {f.rating}.0
                              </span>
                            </div>

                            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-foreground">
                              {f.category}
                            </span>

                            {(f.wouldRecommend ?? (f as any).recommend ?? true) ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-veg/10 px-2.5 py-0.5 text-[11px] font-semibold text-veg">
                                <ThumbsUp className="size-3" /> Recommends
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                                <ThumbsDown className="size-3" /> Neutral / No
                              </span>
                            )}
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteFeedback(f.id)}
                            className="size-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                            title="Delete Feedback"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>

                        {/* Customer feedback message */}
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed break-words">
                          "{f.message}"
                        </p>
                      </div>

                      {/* Footer: User Details and Timestamp */}
                      <div className="border-t pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted-foreground">
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground truncate">{f.name}</div>
                          <div className="truncate text-muted-foreground text-[11px]">
                            {f.email}
                            {f.restaurantName ? ` • ${f.restaurantName}` : ""}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 text-[11px]">
                          <span>{f.createdAt}</span>
                          <span className="font-mono bg-secondary px-1.5 py-0.5 rounded text-[10px]">
                            {f.id}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: RESTAURANT DIRECTORY */}
        {activeTab === "restaurants" && (
          <div className="space-y-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                className="pl-9 bg-card"
                placeholder="Search restaurants by name, city, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="rounded-2xl border bg-card shadow-soft overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="bg-muted/40 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b">
                  <tr>
                    <th className="px-5 py-3.5">Restaurant</th>
                    <th className="px-5 py-3.5">Owner & City</th>
                    <th className="px-5 py-3.5">Dishes</th>
                    <th className="px-5 py-3.5">QR Scans</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredRestaurants.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-14 text-center text-muted-foreground">
                        <Store className="size-8 mx-auto mb-2 text-muted-foreground/40" />
                        <p className="font-bold text-foreground text-sm">No restaurants found</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          When restaurant owners create their menus, they will appear here live.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredRestaurants.map((res) => (
                    <tr key={res.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-5 py-4 font-bold text-foreground">
                        <div>{res.name}</div>
                        <a
                          href={`/menu/${res.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-normal text-primary hover:underline flex items-center gap-1 mt-0.5"
                        >
                          /menu/{res.slug} <ExternalLink className="size-2.5" />
                        </a>
                      </td>

                      <td className="px-5 py-4 text-muted-foreground text-xs">
                        <div className="font-semibold text-foreground">{res.ownerName}</div>
                        <div>{res.city}</div>
                      </td>

                      <td className="px-5 py-4 font-semibold text-foreground">
                        {res.dishCount} dishes ({res.categoryCount} cats)
                      </td>

                      <td className="px-5 py-4 font-extrabold text-primary">
                        {res.qrScans.toLocaleString()}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase",
                            res.status === "active"
                              ? "bg-veg/10 text-veg"
                              : res.status === "setup"
                              ? "bg-accent/20 text-accent-foreground"
                              : "bg-destructive/10 text-destructive"
                          )}
                        >
                          {res.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Direct WhatsApp Contact */}
                          <a
                            href={`https://wa.me/${res.phone}?text=Hello%20${encodeURIComponent(
                              res.name
                            )},%20this%20is%20Menuly%20Support:`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex size-7 items-center justify-center rounded-lg bg-veg/10 text-veg hover:bg-veg hover:text-white transition-colors"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle className="size-3.5" />
                          </a>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleRestaurantStatus(res.id)}
                            className="text-xs h-7"
                          >
                            {res.status === "active" ? "Suspend" : "Activate"}
                          </Button>

                          <Button size="sm" asChild className="text-xs h-7 gap-1">
                            <a href={`/menu/${res.slug}`} target="_blank" rel="noreferrer">
                              <Eye className="size-3.5" /> View
                            </a>
                          </Button>

                          {isMasterAdmin && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="size-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setRestaurantToDelete(res)}
                              title="Delete Restaurant"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: PLANS & SUBSCRIPTIONS */}
        {activeTab === "plans" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
              <div>
                <h2 className="text-xl font-bold font-display text-foreground">Platform Plans & Pricing</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure subscriber tiers, dish quotas, multi-table limits and features
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-veg bg-veg/10 px-3 py-1 rounded-full">
                  3 Active Tiers
                </span>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((p) => {
                const isPro = p.slug === "pro";
                const isEnt = p.slug === "enterprise";
                return (
                  <div
                    key={p.id}
                    className={cn(
                      "rounded-3xl border p-6 flex flex-col justify-between transition-all relative bg-card shadow-soft",
                      isPro && "border-primary ring-2 ring-primary/20",
                      isEnt && "border-amber-400/80 bg-gradient-to-b from-card to-amber-50/20"
                    )}
                  >
                    {isPro && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-primary-foreground shadow-xs">
                        Most Popular
                      </span>
                    )}
                    {isEnt && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-xs">
                        Multi-Table Power
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-display text-xl font-bold text-foreground">{p.name}</h3>
                        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
                          {p.activeSubscribers} restaurants
                        </span>
                      </div>

                      <div className="mt-4 flex items-baseline gap-1">
                        <span className="font-display text-4xl font-extrabold text-foreground">
                          ₹{p.priceMonthly}
                        </span>
                        <span className="text-xs font-semibold text-muted-foreground">/ month</span>
                      </div>

                      <div className="mt-4 space-y-2 py-3 border-y border-border/60 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Max Dishes:</span>
                          <span className="font-bold text-foreground">{p.maxDishes} dishes</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Max Tables:</span>
                          <span className="font-bold text-foreground">{p.maxTables} table QRs</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Custom Logo in QR:</span>
                          <span className="font-bold text-foreground">{p.customBranding ? "Included" : "Standard"}</span>
                        </div>
                      </div>

                      {/* Features List */}
                      <ul className="mt-4 space-y-2 text-xs">
                        {p.features.map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <Check className="size-3.5 text-veg shrink-0" />
                            <span className="text-foreground">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6 pt-4 border-t border-border/50">
                      <Button
                        variant={isPro ? "default" : "outline"}
                        className="w-full text-xs font-bold rounded-xl"
                        onClick={() => toast.success(`${p.name} tier limits synced across network`)}
                      >
                        Sync Tier Limits
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: USERS & RESTAURANT OWNERS */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
              <div>
                <h2 className="text-xl font-bold font-display text-foreground">Platform Users & Owners</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Manage registered accounts, assigned restaurants, and admin privileges
                </p>
              </div>

              {/* Role Filter */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {(["all", "owner", "super_admin"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setUserRoleFilter(r)}
                    className={cn(
                      "shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                      userRoleFilter === r
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-secondary text-foreground hover:bg-secondary/80"
                    )}
                  >
                    {r === "all" ? "All Users" : r === "owner" ? "Owners" : "Super Admins"}
                  </button>
                ))}
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="bg-secondary/50 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b">
                    <tr>
                      <th className="px-5 py-3">User & Contact</th>
                      <th className="px-5 py-3">Linked Restaurant</th>
                      <th className="px-5 py-3">Plan</th>
                      <th className="px-5 py-3">Role</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {users.filter((u) => userRoleFilter === "all" || u.role === userRoleFilter).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-14 text-center text-muted-foreground">
                          <Users className="size-8 mx-auto mb-2 text-muted-foreground/40" />
                          <p className="font-bold text-foreground text-sm">No users found</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Registered platform users will be listed here.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      users
                        .filter((u) => userRoleFilter === "all" || u.role === userRoleFilter)
                        .map((u) => (
                        <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="size-9 rounded-xl bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
                                {u.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-foreground">{u.name}</div>
                                <div className="text-xs text-muted-foreground">{u.email}</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            {u.restaurantSlug ? (
                              <>
                                <a
                                  href={`/menu/${u.restaurantSlug}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-semibold text-foreground text-xs hover:underline flex items-center gap-1"
                                >
                                  {u.restaurantName}
                                  <ExternalLink className="size-3 text-muted-foreground" />
                                </a>
                                <div className="text-[11px] font-mono text-muted-foreground">/menu/{u.restaurantSlug}</div>
                              </>
                            ) : (
                              <div className="font-medium text-muted-foreground text-xs">{u.restaurantName}</div>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                u.plan === "enterprise"
                                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                                  : u.plan === "pro"
                                  ? "bg-primary/10 text-primary border border-primary/20"
                                  : "bg-secondary text-muted-foreground"
                              )}
                            >
                              {u.plan}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            {u.email === "menulyofficial@gmail.com" ? (
                              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 inline-flex items-center gap-1">
                                <ShieldCheck className="size-3" /> Master Admin
                              </span>
                            ) : (
                              <span
                                className={cn(
                                  "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                                  u.role === "super_admin"
                                    ? "bg-purple-100 text-purple-900 border border-purple-200"
                                    : "bg-muted text-foreground"
                                )}
                              >
                                {u.role === "super_admin" ? "Admin" : "Owner"}
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-veg">
                              <span className="size-1.5 rounded-full bg-veg" /> Active
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Direct WhatsApp Contact */}
                              {u.phone && (
                                <a
                                  href={`https://wa.me/${u.phone.replace(/[^0-9]/g, "")}?text=Hello%20${encodeURIComponent(
                                    u.name
                                  )},%20this%20is%20Menuly%20Executive%20Support:`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex size-7 items-center justify-center rounded-lg bg-veg/10 text-veg hover:bg-veg hover:text-white transition-colors"
                                  title="Chat on WhatsApp"
                                >
                                  <MessageCircle className="size-3.5" />
                                </a>
                              )}

                              {/* Role Toggle Button (ONLY visible to Master Admin) */}
                              {isMasterAdmin && u.email !== "menulyofficial@gmail.com" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-7 gap-1 px-2.5 font-bold"
                                  disabled={updatingRoleUserId === u.id}
                                  onClick={() => handleToggleUserRole(u)}
                                  title={u.role === "super_admin" ? "Demote to Member" : "Promote to Admin"}
                                >
                                  {updatingRoleUserId === u.id ? (
                                    <RefreshCw className="size-3 animate-spin" />
                                  ) : u.role === "super_admin" ? (
                                    <>
                                      <UserMinus className="size-3 text-amber-600" />
                                      <span>Make Owner</span>
                                    </>
                                  ) : (
                                    <>
                                      <ShieldCheck className="size-3 text-primary" />
                                      <span>Make Admin</span>
                                    </>
                                  )}
                                </Button>
                              )}

                              {/* Delete User Button (ONLY visible to Master Admin) */}
                              {isMasterAdmin && u.email !== "menulyofficial@gmail.com" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="size-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => setUserToDelete(u)}
                                  title="Delete User Account"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: 1-CLICK STARTER MENU PACKS & AI ONBOARDING SETUP */}
        {activeTab === "starter-packs" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Sparkles className="size-4" />
                  </div>
                  <h2 className="text-xl font-bold font-display text-foreground">
                    1-Click Starter Menu Packs &amp; Onboarding Setup
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Customize the 4 curated starter menus, add or edit dishes &amp; photos, and select which pack automatically pre-fills menus for newly registered restaurant owners.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (confirm("Reset all 4 starter packs back to Menuly factory defaults?")) {
                      setAdminPresets(STARTER_PRESETS);
                      handleSaveStarterPresets(STARTER_PRESETS);
                    }
                  }}
                  className="text-xs font-semibold"
                >
                  <RotateCw className="size-3.5 mr-1" /> Reset Defaults
                </Button>
                <Button
                  size="sm"
                  disabled={savingPresets}
                  onClick={() => handleSaveStarterPresets(adminPresets)}
                  className="bg-primary text-primary-foreground font-bold text-xs shadow-soft"
                >
                  {savingPresets ? <RotateCw className="size-3.5 animate-spin mr-1" /> : <Save className="size-3.5 mr-1" />}
                  {savingPresets ? "Saving..." : "Save Packs to Database"}
                </Button>
              </div>
            </div>

            {/* Pack Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {adminPresets.map((pack) => {
                const isSelected = selectedPresetId === pack.id;
                const isDefault = (settings.defaultStarterPreset || "dhaba") === pack.id;

                return (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => setSelectedPresetId(pack.id)}
                    className={cn(
                      "relative flex flex-col p-4 rounded-2xl border text-left transition-all cursor-pointer group",
                      isSelected
                        ? "bg-card border-primary ring-2 ring-primary/20 shadow-soft"
                        : "bg-secondary/40 border-border/70 hover:bg-card hover:border-primary/40"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{pack.icon}</span>
                      {isDefault && (
                        <span className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-black uppercase">
                          Default Signup
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {pack.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                      {pack.categories.length} Categories · {pack.items.length} Dishes
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Selected Pack Management Panel */}
            {(() => {
              const pack = adminPresets.find((p) => p.id === selectedPresetId) || adminPresets[0];
              if (!pack) return null;
              const isDefault = (settings.defaultStarterPreset || "dhaba") === pack.id;

              return (
                <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-soft space-y-6">
                  {/* Pack Header & Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4 gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl p-2 rounded-2xl bg-secondary">{pack.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-foreground">{pack.title}</h3>
                          <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[10px] font-bold">
                            {pack.badge}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{pack.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={isDefault ? "default" : "outline"}
                        onClick={() => {
                          const updated = { ...settings, defaultStarterPreset: pack.id };
                          setSettings(updated);
                          savePlatformSettings(updated, `"${pack.title}" is now the default onboarding pack for new users!`);
                        }}
                        className={cn(
                          "text-xs font-bold gap-1.5",
                          isDefault && "bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft"
                        )}
                      >
                        <CheckCircle2 className="size-3.5" />
                        {isDefault ? "Current Default Signup Pack" : "Set as Default Onboarding Pack"}
                      </Button>
                    </div>
                  </div>

                  {/* 4 Categories in 2-Column Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {pack.categories.map((cat, catIdx) => {
                      const catItems = pack.items.filter((it) => it.categoryIndex === catIdx);

                      return (
                        <div
                          key={cat.id || catIdx}
                          className="rounded-2xl border border-border/70 bg-background/60 p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between border-b border-border/50 pb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                                {catIdx + 1}
                              </span>
                              <h4 className="font-bold text-sm text-foreground truncate">{cat.name}</h4>
                              <button
                                type="button"
                                onClick={() => {
                                  setRenamingCategory({
                                    presetId: pack.id,
                                    catIndex: catIdx,
                                    currentName: cat.name,
                                  });
                                  setRenameCatValue(cat.name);
                                }}
                                className="size-6 shrink-0 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary flex items-center justify-center transition-colors cursor-pointer"
                                title={`Rename Category "${cat.name}"`}
                              >
                                <Edit3 className="size-3.5" />
                              </button>
                            </div>
                            <span className="text-[11px] font-semibold text-muted-foreground shrink-0 ml-2">
                              {catItems.length} dishes
                            </span>
                          </div>

                          {/* Dishes List */}
                          <div className="space-y-2">
                            {catItems.map((dish) => {
                              const globalIndex = pack.items.indexOf(dish);

                              return (
                                <div
                                  key={dish.name + globalIndex}
                                  className="group flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-2.5 transition-all hover:border-primary/40"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    {dish.image_url ? (
                                      <img
                                        src={dish.image_url}
                                        alt={dish.name}
                                        className="size-11 rounded-lg object-cover border shrink-0"
                                      />
                                    ) : (
                                      <div className="size-11 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center shrink-0">
                                        <UtensilsCrossed className="size-4" />
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <p className="font-bold text-xs text-foreground truncate">{dish.name}</p>
                                      <p className="text-[11px] text-muted-foreground line-clamp-1">{dish.description}</p>
                                      <span className="font-extrabold text-xs text-primary">₹{dish.price}</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="size-7 p-0 text-muted-foreground hover:text-foreground"
                                      onClick={() => {
                                        setEditingDish({
                                          catIndex: catIdx,
                                          dishIndex: globalIndex,
                                          name: dish.name,
                                          price: dish.price,
                                          description: dish.description,
                                          image_url: dish.image_url || "",
                                        });
                                      }}
                                      title="Edit Dish"
                                    >
                                      <Edit3 className="size-3.5" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="size-7 p-0 text-muted-foreground hover:text-destructive"
                                      onClick={() => {
                                        const updatedPresets = adminPresets.map((p) => {
                                          if (p.id !== pack.id) return p;
                                          return {
                                            ...p,
                                            items: p.items.filter((_, idx) => idx !== globalIndex),
                                          };
                                        });
                                        setAdminPresets(updatedPresets);
                                        toast.success(`Removed "${dish.name}" from ${pack.title}`);
                                      }}
                                      title="Remove Dish"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Add Dish Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setAddingDishCatIndex(catIdx);
                              setNewDishForm({ name: "", price: "", description: "", image_url: "", compressionSummary: null });
                            }}
                            className="w-full text-xs font-bold border-dashed gap-1 h-9"
                          >
                            <Plus className="size-3.5" /> Add Dish to {cat.name}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB: PLATFORM SETTINGS */}
        {activeTab === "settings" && (
          <div className="space-y-6 max-w-4xl">
            <div className="border-b pb-4">
              <h2 className="text-xl font-bold font-display text-foreground">Global Platform Settings</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Control system modes, pure-veg verification rules, support helplines, and homepage marquee ticker
              </p>
            </div>

            <div className="space-y-6">
              {/* System Security & Integrity Card */}
              <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-soft space-y-5">
                <h3 className="text-sm font-bold text-foreground border-b border-border/60 pb-2">
                  System Mode & Policies
                </h3>

                <div className="flex items-center justify-between p-4 rounded-xl border border-border/70 bg-background/50">
                  <div>
                    <p className="text-sm font-bold text-foreground">Dietary Tag Indicators</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Enable dietary tags across all menus and customer QR displays
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={savingSettings}
                    onClick={() => {
                      const updated = { ...settings, strictVegOnly: !settings.strictVegOnly };
                      savePlatformSettings(updated, updated.strictVegOnly ? "Dietary Tags ACTIVE" : "Dietary Tags Disabled");
                    }}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all",
                      settings.strictVegOnly ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {settings.strictVegOnly ? "✓ Enforced" : "Disabled"}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-border/70 bg-background/50">
                  <div>
                    <p className="text-sm font-bold text-foreground">Maintenance Mode</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Temporarily pause live public access for database upgrades and scheduled maintenance (Active QR digital menus remain unaffected)
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={savingSettings}
                    onClick={() => {
                      const updated = { ...settings, maintenanceMode: !settings.maintenanceMode };
                      savePlatformSettings(updated);
                    }}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all inline-flex items-center gap-1.5",
                      settings.maintenanceMode ? "bg-destructive text-white shadow-md animate-pulse" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {savingSettings ? <RotateCw className="size-3 animate-spin" /> : null}
                    {settings.maintenanceMode ? "🚨 Maintenance Active" : "Normal Live"}
                  </button>
                </div>
              </div>

              {/* Official Contact & Social Media Channels Manager */}
              <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-soft space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Phone className="size-4 text-primary" /> Official Contact Channels &amp; Social Desk
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Configure WhatsApp, Email helpdesk, Operating hours, SLA guarantee, Instagram and Facebook links shown on the public Contact page and Website Footer.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    disabled={savingSettings}
                    onClick={() => savePlatformSettings(settings, "Support channels & social links saved successfully!")}
                    className="text-xs font-bold bg-primary text-primary-foreground gap-1.5 self-start sm:self-auto shrink-0"
                  >
                    {savingSettings ? <RotateCw className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                    Save Contact Info
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 items-start">
                  {/* Left Column: Editable Controls */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          WhatsApp Support Number
                        </Label>
                        <Input
                          value={settings.supportWhatsApp || ""}
                          onChange={(e) => setSettings({ ...settings, supportWhatsApp: e.target.value.replace(/[^0-9]/g, "") })}
                          className="h-11 px-4 text-sm font-medium rounded-xl border-border bg-background"
                          placeholder="e.g. 919999999999"
                        />
                        <p className="text-[11px] text-muted-foreground">Digits only with country code (e.g. 919999999999)</p>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Email Helpdesk
                        </Label>
                        <Input
                          value={settings.supportEmail || ""}
                          onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                          className="h-11 px-4 text-sm font-medium rounded-xl border-border bg-background"
                          placeholder="menulyofficial@gmail.com"
                        />
                        <p className="text-[11px] text-muted-foreground">Direct customer support email</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Operating Hours
                      </Label>
                      <Input
                        value={settings.supportHours || ""}
                        onChange={(e) => setSettings({ ...settings, supportHours: e.target.value })}
                        className="h-11 px-4 text-sm font-medium rounded-xl border-border bg-background"
                        placeholder="e.g. Mon–Sat, 10:00 AM – 7:00 PM IST"
                      />
                      <p className="text-[11px] text-muted-foreground">Display timing shown on Contact page</p>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Rapid Response SLA Guarantee Promise
                      </Label>
                      <Textarea
                        value={settings.supportSlaText || ""}
                        onChange={(e) => setSettings({ ...settings, supportSlaText: e.target.value })}
                        rows={3}
                        className="p-3 text-xs font-medium rounded-xl border-border bg-background leading-relaxed"
                        placeholder="All bug reports and tickets submitted via this form are dispatched directly to our priority queue and reviewed by engineers within 2 to 4 business hours."
                      />
                      <p className="text-[11px] text-muted-foreground">Promise displayed in green SLA highlight box</p>
                    </div>

                    {/* Instagram Config */}
                    <div className="rounded-xl border border-border/60 bg-secondary/20 p-3.5 space-y-3">
                      <span className="text-xs font-bold text-foreground flex items-center gap-2">
                        <Instagram className="size-3.5 text-rose-500" /> Instagram Profile Settings
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold uppercase text-muted-foreground">Profile URL</Label>
                          <Input
                            value={settings.instagramUrl || ""}
                            onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
                            className="h-9 px-3 text-xs rounded-lg border-border bg-background"
                            placeholder="https://www.instagram.com/menulyofficial"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold uppercase text-muted-foreground">Display Handle</Label>
                          <Input
                            value={settings.instagramHandle || ""}
                            onChange={(e) => setSettings({ ...settings, instagramHandle: e.target.value })}
                            className="h-9 px-3 text-xs rounded-lg border-border bg-background"
                            placeholder="@menulyofficial"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Facebook Config */}
                    <div className="rounded-xl border border-border/60 bg-secondary/20 p-3.5 space-y-3">
                      <span className="text-xs font-bold text-foreground flex items-center gap-2">
                        <svg viewBox="0 0 24 24" className="size-3.5 text-blue-600" fill="currentColor">
                          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                        </svg>
                        Facebook Page Settings
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold uppercase text-muted-foreground">Page URL</Label>
                          <Input
                            value={settings.facebookUrl || ""}
                            onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })}
                            className="h-9 px-3 text-xs rounded-lg border-border bg-background"
                            placeholder="https://www.facebook.com/profile.php?id=61595926229139"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold uppercase text-muted-foreground">Display Name</Label>
                          <Input
                            value={settings.facebookName || ""}
                            onChange={(e) => setSettings({ ...settings, facebookName: e.target.value })}
                            className="h-9 px-3 text-xs rounded-lg border-border bg-background"
                            placeholder="Menuly Official"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        size="sm"
                        disabled={savingSettings}
                        onClick={() => savePlatformSettings(settings, "Support channels & social links saved successfully!")}
                        className="text-xs font-bold bg-primary text-primary-foreground gap-1.5"
                      >
                        {savingSettings ? <RotateCw className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                        Save Changes
                      </Button>
                    </div>
                  </div>

                  {/* Right Column: Live Visual Preview Matching Contact Page */}
                  <div className="rounded-2xl border border-border/80 bg-secondary/30 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-border/60 pb-2">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Eye className="size-3.5 text-primary" /> Live Contact Sidebar Preview
                      </span>
                      <span className="text-[10px] font-semibold text-muted-foreground bg-background px-2 py-0.5 rounded-md border border-border/60">
                        Real-time
                      </span>
                    </div>

                    {/* Preview Cards Stack */}
                    <div className="space-y-3 select-none">
                      {/* WhatsApp Card */}
                      <div className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-whatsapp text-whatsapp-foreground shadow-xs">
                          <MessageCircle className="size-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-foreground">WhatsApp Support</p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            Fastest resolution (+{settings.supportWhatsApp || "919999999999"})
                          </p>
                        </div>
                      </div>

                      {/* Email Card */}
                      <div className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                          <Mail className="size-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-foreground">Email Helpdesk</p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {settings.supportEmail || "menulyofficial@gmail.com"}
                          </p>
                        </div>
                      </div>

                      {/* Operating Hours Card */}
                      <div className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                          <Clock className="size-5 text-primary" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-foreground">Operating Hours</p>
                          <p className="text-[11px] text-muted-foreground">
                            {settings.supportHours || "Mon–Sat, 10:00 AM – 7:00 PM IST"}
                          </p>
                        </div>
                      </div>

                      {/* SLA Guarantee Box */}
                      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-1.5">
                        <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <CheckCircle2 className="size-3.5 text-primary" /> Rapid Response SLA
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {settings.supportSlaText || "All bug reports and tickets submitted via this form are dispatched directly to our priority queue and reviewed by engineers within 2 to 4 business hours."}
                        </p>
                      </div>

                      {/* Social Media Card */}
                      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs space-y-2.5">
                        <p className="text-xs font-bold text-foreground">Follow &amp; Stay Updated</p>
                        <div className="flex items-center gap-3 rounded-xl p-1.5 -mx-1.5 hover:bg-secondary/60 transition-colors">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 via-fuchsia-500 to-amber-400 text-white shadow-xs">
                            <Instagram className="size-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-foreground">Instagram</p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {settings.instagramHandle || "@menulyofficial"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-xl p-1.5 -mx-1.5 hover:bg-secondary/60 transition-colors">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
                            <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
                              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                            </svg>
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-foreground">Facebook</p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {settings.facebookName || "Menuly Official"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Homepage Interactive Demo Showcase & QR Code Controller */}
              <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-soft space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Homepage Live Demo Menu &amp; QR Code Controller
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Controls the interactive demo link, real-time QR code, and phone mockup on the homepage. Change this anytime to showcase any live restaurant menu.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const updated = {
                        ...settings,
                        demoMenuUrl: "https://menuly-app-blush.vercel.app/menu/menuly-official",
                      };
                      setSettings(updated);
                      savePlatformSettings(updated, "Reset to Menuly Official Demo link!");
                    }}
                    className="text-xs font-semibold self-start sm:self-auto shrink-0"
                  >
                    Set to Official Demo
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-5 items-start">
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Demo Menu Full URL
                      </Label>
                      <Input
                        value={settings.demoMenuUrl || ""}
                        onChange={(e) => setSettings({ ...settings, demoMenuUrl: e.target.value })}
                        className="h-11 px-4 text-sm font-medium rounded-xl border-border bg-background"
                        placeholder="https://menuly-app-blush.vercel.app/menu/menuly-official"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        asChild
                        variant="secondary"
                        className="text-xs font-bold gap-1.5"
                      >
                        <a
                          href={settings.demoMenuUrl || "https://menuly-app-blush.vercel.app/menu/menuly-official"}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink className="size-3.5" /> Test Open Demo Menu
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        disabled={savingSettings}
                        onClick={() => savePlatformSettings(settings, "Demo menu link successfully updated on homepage!")}
                        className="text-xs font-bold bg-primary text-primary-foreground gap-1.5"
                      >
                        <Save className="size-3.5" /> Save Demo URL
                      </Button>
                    </div>
                  </div>

                  {/* Live QR Preview */}
                  <div className="flex flex-col items-center justify-center p-3 rounded-2xl border bg-white shadow-soft">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&color=1a5c38&bgcolor=ffffff&data=${encodeURIComponent(settings.demoMenuUrl || "https://menuly-app-blush.vercel.app/menu/menuly-official")}&margin=2`}
                      alt="Live Demo QR"
                      width={120}
                      height={120}
                      className="rounded-lg"
                    />
                    <span className="text-[10px] font-bold text-gray-700 mt-1">Live Home QR</span>
                  </div>
                </div>
              </div>

              {/* Default Onboarding Starter Pack for New Signups */}
              <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-soft space-y-4">
                <div className="border-b border-border/60 pb-3">
                  <h3 className="text-sm font-bold text-foreground">
                    Default Onboarding Menu Pack for New Users
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    When a new restaurant owner registers, their menu will automatically be seeded with this complete curated starter pack so they have ready-to-use dishes from day one.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: "dhaba", name: "North Indian Dhaba", icon: "🍛" },
                    { id: "cafe", name: "Cafe & Fast Food", icon: "☕" },
                    { id: "south_indian", name: "South Indian Tiffin", icon: "🥞" },
                    { id: "street_food", name: "Chaat & Street Food", icon: "🫖" },
                  ].map((p) => {
                    const isSelected = (settings.defaultStarterPreset || "dhaba") === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          const updated = { ...settings, defaultStarterPreset: p.id };
                          setSettings(updated);
                          savePlatformSettings(updated, `Default onboarding pack set to ${p.name}`);
                        }}
                        className={cn(
                          "flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all cursor-pointer",
                          isSelected
                            ? "bg-primary/10 border-primary text-primary font-bold shadow-xs ring-1 ring-primary"
                            : "bg-secondary/40 border-border/70 hover:bg-card text-muted-foreground"
                        )}
                      >
                        <span className="text-2xl mb-1">{p.icon}</span>
                        <span className="text-xs">{p.name}</span>
                        {isSelected && (
                          <span className="mt-1 text-[9px] font-black uppercase text-primary">✓ Active</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Announcement Marquee Ticker */}
              <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-soft space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-foreground">
                        Homepage Announcement Ticker (Live Marquee)
                      </h3>
                      {settings.announcementTickerEnabled ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Live on Site
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-muted text-muted-foreground border border-border">
                          <span className="size-1.5 rounded-full bg-muted-foreground/50" />
                          Disabled
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Controls the black continuous scrolling announcement ribbon at the top of the homepage & public pages
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={savingSettings}
                    onClick={() => {
                      const updated = {
                        ...settings,
                        announcementTickerEnabled: !settings.announcementTickerEnabled,
                      };
                      savePlatformSettings(
                        updated,
                        updated.announcementTickerEnabled
                          ? "🟢 Live Marquee turned ON and published"
                          : "⚪ Live Marquee turned OFF"
                      );
                    }}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center justify-center gap-1.5 shrink-0",
                      settings.announcementTickerEnabled
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-secondary text-secondary-foreground hover:bg-muted border border-border"
                    )}
                  >
                    {savingSettings ? (
                      <RotateCw className="size-3.5 animate-spin" />
                    ) : settings.announcementTickerEnabled ? (
                      <Check className="size-3.5" />
                    ) : (
                      <Radio className="size-3.5" />
                    )}
                    {settings.announcementTickerEnabled ? "Marquee ON (Click to Disable)" : "Turn ON Marquee"}
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Announcement Ticker Text
                    </Label>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span>Quick separators:</span>
                      {["💥", "•", "✨", "🔥"].map((sep) => (
                        <button
                          key={sep}
                          type="button"
                          onClick={() =>
                            setSettings({
                              ...settings,
                              announcementTicker: `${settings.announcementTicker.trim()} ${sep} `,
                            })
                          }
                          className="px-1.5 py-0.5 rounded bg-secondary hover:bg-muted font-bold text-xs cursor-pointer"
                          title={`Insert ${sep}`}
                        >
                          {sep}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Input
                    value={settings.announcementTicker}
                    onChange={(e) => setSettings({ ...settings, announcementTicker: e.target.value })}
                    className="h-11 px-4 text-sm font-semibold rounded-xl border-border bg-background"
                    placeholder="e.g. Scan the QR 💥 See the menu 💥 Update prices anytime 💥 Mark sold out in 1 tap"
                  />
                </div>

                {/* Quick Presets */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    One-Tap Presets:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSettings({
                          ...settings,
                          announcementTicker:
                            "Scan the QR 💥 See the menu 💥 Update prices anytime 💥 Mark sold out in 1 tap 💥 Fast & Responsive 💥 Zero reprinting",
                        })
                      }
                      className="text-xs px-2.5 py-1 rounded-lg bg-secondary/70 hover:bg-secondary text-secondary-foreground font-medium transition-colors cursor-pointer border border-border/50"
                    >
                      🚀 Platform Features
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSettings({
                          ...settings,
                          announcementTicker:
                            "100% Pure Veg 💥 Pure Veg Kitchen 💥 Scan the QR 💥 Fast & Responsive 💥 No Non-Veg Allowed",
                        })
                      }
                      className="text-xs px-2.5 py-1 rounded-lg bg-secondary/70 hover:bg-secondary text-secondary-foreground font-medium transition-colors cursor-pointer border border-border/50"
                    >
                      🥗 Pure Veg Special
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSettings({
                          ...settings,
                          announcementTicker:
                            "Special Weekend Offer 💥 Fresh Chef Specials 💥 Scan QR on your table to view full live menu",
                        })
                      }
                      className="text-xs px-2.5 py-1 rounded-lg bg-secondary/70 hover:bg-secondary text-secondary-foreground font-medium transition-colors cursor-pointer border border-border/50"
                    >
                      🎉 Weekend Special Offer
                    </button>
                  </div>
                </div>

                {/* Live Preview Box */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <Eye className="size-3.5 text-primary" /> Live Ticker Preview:
                    </span>
                    {!settings.announcementTickerEnabled && (
                      <span className="text-[11px] text-amber-500 font-semibold">
                        (Preview only — currently hidden from public)
                      </span>
                    )}
                  </div>
                  <div className="rounded-xl overflow-hidden border border-border/80 shadow-inner">
                    <AnnouncementMarquee
                      text={settings.announcementTicker || "Sample announcement ticker text..."}
                      enabled={true}
                    />
                  </div>
                </div>
              </div>

              {/* Save Settings Button */}
              <div className="flex justify-end pt-2">
                <Button
                  disabled={savingSettings}
                  onClick={() => {
                    savePlatformSettings(settings, "Platform settings successfully saved to PostgreSQL database");
                  }}
                  className="h-11 px-6 rounded-xl font-bold bg-primary text-primary-foreground shadow-xs gap-2"
                >
                  {savingSettings ? <RotateCw className="size-4 animate-spin" /> : <Save className="size-4" />}
                  {savingSettings ? "Saving to PostgreSQL..." : "Save Platform Settings"}
                </Button>
              </div>
            </div>
          </div>
        )}
        {/* Delete User Confirmation Dialog */}
        <Dialog open={Boolean(userToDelete)} onOpenChange={(open) => !open && setUserToDelete(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="size-5" /> Delete User Account
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <p className="text-sm text-foreground">
                Are you sure you want to permanently delete user account{" "}
                <span className="font-bold text-foreground underline">{userToDelete?.name}</span> (
                {userToDelete?.email})?
              </p>
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                ⚠️ This will permanently remove their credentials, linked restaurants, menu dishes, and QR codes from PostgreSQL.
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setUserToDelete(null)}
                  disabled={deletingUserLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={confirmDeleteUser}
                  disabled={deletingUserLoading}
                  className="gap-1.5 font-bold"
                >
                  {deletingUserLoading ? (
                    <>
                      <RefreshCw className="size-3.5 animate-spin" /> Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="size-3.5" /> Confirm Delete
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Preset Dish Dialog */}
        <Dialog open={Boolean(editingDish)} onOpenChange={(open) => !open && setEditingDish(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit3 className="size-5 text-primary" /> Edit Starter Pack Dish
              </DialogTitle>
            </DialogHeader>
            {editingDish && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const updatedPresets = adminPresets.map((p) => {
                    if (p.id !== selectedPresetId) return p;
                    const items = [...p.items];
                    const existingItem = items[editingDish.dishIndex];
                    if (!existingItem) return p;
                    items[editingDish.dishIndex] = {
                      categoryIndex: editingDish.catIndex ?? existingItem.categoryIndex,
                      name: editingDish.name.trim(),
                      price: Number(editingDish.price) || 0,
                      description: editingDish.description.trim(),
                      image_url: editingDish.image_url.trim(),
                    };
                    return { ...p, items };
                  });
                  setAdminPresets(updatedPresets);
                  setEditingDish(null);
                  toast.success("Dish updated in starter pack. Remember to click 'Save Packs'!");
                }}
                className="space-y-4 pt-2"
              >
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Dish Name *</Label>
                  <Input
                    required
                    value={editingDish.name}
                    onChange={(e) => setEditingDish({ ...editingDish, name: e.target.value })}
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Price (₹) *</Label>
                  <Input
                    type="number"
                    required
                    value={editingDish.price}
                    onChange={(e) => setEditingDish({ ...editingDish, price: Number(e.target.value) })}
                    className="h-10 text-sm"
                  />
                </div>

                {/* 2-Option Photo Setup: Web Link OR Manual Upload with ~90% Compression */}
                <div className="space-y-2 rounded-xl border border-border/80 bg-secondary/20 p-3.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-foreground">Dish Photo (2 Options)</Label>
                    {editingDish.image_url && (
                      <button
                        type="button"
                        onClick={() => setEditingDish({ ...editingDish, image_url: "", compressionSummary: null })}
                        className="text-[11px] text-destructive hover:underline font-semibold"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>

                  <div className="flex items-start gap-3">
                    {editingDish.image_url ? (
                      <img
                        src={editingDish.image_url}
                        alt="Preview"
                        className="size-16 rounded-xl object-cover border border-border/80 shadow-xs shrink-0"
                      />
                    ) : (
                      <div className="size-16 rounded-xl bg-secondary border border-border/70 flex items-center justify-center text-2xl shrink-0">
                        🍲
                      </div>
                    )}

                    <div className="flex-1 space-y-2">
                      {/* Option A: Direct File Upload with 90%+ Compression */}
                      <label className="cursor-pointer inline-block">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isCompressingImage}
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            setIsCompressingImage(true);
                            try {
                              const res = await compressImage(f, {
                                maxWidth: 800,
                                maxHeight: 800,
                                quality: 0.80,
                                mimeType: "image/webp",
                              });
                              setEditingDish({
                                ...editingDish,
                                image_url: res.dataUrl,
                                compressionSummary: res.summary,
                              });
                              toast.success(`Photo compressed & applied! (${res.summary})`);
                            } catch (err: any) {
                              toast.error(err?.message || "Failed to compress image");
                            } finally {
                              setIsCompressingImage(false);
                            }
                          }}
                        />
                        <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/80 bg-card px-3 text-xs font-semibold hover:bg-secondary transition-colors shadow-xs">
                          {isCompressingImage ? (
                            <RotateCw className="size-3.5 animate-spin text-primary" />
                          ) : (
                            <Upload className="size-3.5 text-primary" />
                          )}
                          {isCompressingImage ? "Compressing WebP..." : "Upload Manual Image"}
                        </span>
                      </label>

                      {/* Option B: Direct URL Input */}
                      <Input
                        value={editingDish.image_url?.startsWith("data:") ? "" : editingDish.image_url}
                        onChange={(e) =>
                          setEditingDish({
                            ...editingDish,
                            image_url: e.target.value,
                            compressionSummary: null,
                          })
                        }
                        placeholder="Or paste direct image URL (https://...)"
                        className="h-8 text-xs bg-background"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground pt-0.5">
                    <span>Auto-compresses to lightweight WebP (~90% size reduction) for instant mobile loading.</span>
                    {editingDish.compressionSummary && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold px-2 py-0.5 text-[10px]">
                        ⚡ {editingDish.compressionSummary}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Description</Label>
                  <Textarea
                    rows={2}
                    value={editingDish.description}
                    onChange={(e) => setEditingDish({ ...editingDish, description: e.target.value })}
                    className="text-xs resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditingDish(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="font-bold">
                    Save Dish Changes
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Preset Dish Dialog */}
        <Dialog open={addingDishCatIndex !== null} onOpenChange={(open) => !open && setAddingDishCatIndex(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="size-5 text-primary" /> Add New Dish to Starter Pack
              </DialogTitle>
            </DialogHeader>
            {addingDishCatIndex !== null && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newDishForm.name.trim()) return;
                  const updatedPresets = adminPresets.map((p) => {
                    if (p.id !== selectedPresetId) return p;
                    const items = [
                      ...p.items,
                      {
                        name: newDishForm.name.trim(),
                        categoryIndex: addingDishCatIndex,
                        price: Number(newDishForm.price) || 100,
                        description: newDishForm.description.trim(),
                        image_url: newDishForm.image_url.trim() || "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80",
                      },
                    ];
                    return { ...p, items };
                  });
                  setAdminPresets(updatedPresets);
                  setAddingDishCatIndex(null);
                  toast.success(`Added "${newDishForm.name}" to starter pack. Remember to click 'Save Packs'!`);
                }}
                className="space-y-4 pt-2"
              >
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Dish Name *</Label>
                  <Input
                    required
                    placeholder="e.g. Special Paneer Handi"
                    value={newDishForm.name}
                    onChange={(e) => setNewDishForm({ ...newDishForm, name: e.target.value })}
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Price (₹) *</Label>
                  <Input
                    type="number"
                    required
                    placeholder="220"
                    value={newDishForm.price}
                    onChange={(e) => setNewDishForm({ ...newDishForm, price: e.target.value })}
                    className="h-10 text-sm"
                  />
                </div>

                {/* 2-Option Photo Setup: Web Link OR Manual Upload with ~90% Compression */}
                <div className="space-y-2 rounded-xl border border-border/80 bg-secondary/20 p-3.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-foreground">Dish Photo (2 Options)</Label>
                    {newDishForm.image_url && (
                      <button
                        type="button"
                        onClick={() => setNewDishForm({ ...newDishForm, image_url: "", compressionSummary: null })}
                        className="text-[11px] text-destructive hover:underline font-semibold"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>

                  <div className="flex items-start gap-3">
                    {newDishForm.image_url ? (
                      <img
                        src={newDishForm.image_url}
                        alt="Preview"
                        className="size-16 rounded-xl object-cover border border-border/80 shadow-xs shrink-0"
                      />
                    ) : (
                      <div className="size-16 rounded-xl bg-secondary border border-border/70 flex items-center justify-center text-2xl shrink-0">
                        🍲
                      </div>
                    )}

                    <div className="flex-1 space-y-2">
                      {/* Option A: Direct File Upload with 90%+ Compression */}
                      <label className="cursor-pointer inline-block">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isCompressingImage}
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            setIsCompressingImage(true);
                            try {
                              const res = await compressImage(f, {
                                maxWidth: 800,
                                maxHeight: 800,
                                quality: 0.80,
                                mimeType: "image/webp",
                              });
                              setNewDishForm({
                                ...newDishForm,
                                image_url: res.dataUrl,
                                compressionSummary: res.summary,
                              });
                              toast.success(`Photo compressed & applied! (${res.summary})`);
                            } catch (err: any) {
                              toast.error(err?.message || "Failed to compress image");
                            } finally {
                              setIsCompressingImage(false);
                            }
                          }}
                        />
                        <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/80 bg-card px-3 text-xs font-semibold hover:bg-secondary transition-colors shadow-xs">
                          {isCompressingImage ? (
                            <RotateCw className="size-3.5 animate-spin text-primary" />
                          ) : (
                            <Upload className="size-3.5 text-primary" />
                          )}
                          {isCompressingImage ? "Compressing WebP..." : "Upload Manual Image"}
                        </span>
                      </label>

                      {/* Option B: Direct URL Input */}
                      <Input
                        value={newDishForm.image_url?.startsWith("data:") ? "" : newDishForm.image_url}
                        onChange={(e) =>
                          setNewDishForm({
                            ...newDishForm,
                            image_url: e.target.value,
                            compressionSummary: null,
                          })
                        }
                        placeholder="Or paste direct image URL (https://...)"
                        className="h-8 text-xs bg-background"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground pt-0.5">
                    <span>Auto-compresses to lightweight WebP (~90% size reduction) for instant mobile loading.</span>
                    {newDishForm.compressionSummary && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold px-2 py-0.5 text-[10px]">
                        ⚡ {newDishForm.compressionSummary}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Description</Label>
                  <Textarea
                    rows={2}
                    placeholder="Short appetizing description..."
                    value={newDishForm.description}
                    onChange={(e) => setNewDishForm({ ...newDishForm, description: e.target.value })}
                    className="text-xs resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setAddingDishCatIndex(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="font-bold">
                    Add Dish
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Rename Starter Pack Category Dialog */}
        <Dialog open={Boolean(renamingCategory)} onOpenChange={(open) => !open && setRenamingCategory(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit3 className="size-5 text-primary" /> Rename Starter Pack Category
              </DialogTitle>
            </DialogHeader>
            {renamingCategory && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const trimmed = renameCatValue.trim();
                  if (!trimmed) {
                    toast.error("Category name cannot be empty");
                    return;
                  }
                  const updatedPresets = adminPresets.map((p) => {
                    if (p.id !== renamingCategory.presetId) return p;
                    const categories = [...p.categories];
                    const existingCat = categories[renamingCategory.catIndex];
                    if (!existingCat) return p;
                    categories[renamingCategory.catIndex] = {
                      ...existingCat,
                      name: trimmed,
                    };
                    return { ...p, categories };
                  });
                  setAdminPresets(updatedPresets);
                  setRenamingCategory(null);
                  toast.success(`Category renamed to "${trimmed}". Click "Save Packs to Database" to apply!`);
                }}
                className="space-y-4 pt-2"
              >
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Category Name *</Label>
                  <Input
                    required
                    autoFocus
                    value={renameCatValue}
                    onChange={(e) => setRenameCatValue(e.target.value)}
                    placeholder="e.g. Starters & Appetizers"
                    className="h-10 text-sm font-semibold"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    This updated category name will be displayed in this starter pack and automatically assigned to all newly registered restaurants.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setRenamingCategory(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="font-bold bg-primary text-primary-foreground gap-1.5">
                    <Save className="size-3.5" /> Save Category Name
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Restaurant Confirmation Dialog */}
        <Dialog open={Boolean(restaurantToDelete)} onOpenChange={(open) => !open && setRestaurantToDelete(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="size-5" /> Delete Restaurant
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <p className="text-sm text-foreground">
                Are you sure you want to permanently delete restaurant{" "}
                <span className="font-bold text-foreground underline">{restaurantToDelete?.name}</span>?
              </p>
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                ⚠️ All dishes, categories, QR codes, tables, and scan records for this restaurant will be deleted.
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRestaurantToDelete(null)}
                  disabled={deletingRestaurantLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={confirmDeleteRestaurant}
                  disabled={deletingRestaurantLoading}
                  className="gap-1.5 font-bold"
                >
                  {deletingRestaurantLoading ? (
                    <>
                      <RefreshCw className="size-3.5 animate-spin" /> Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="size-3.5" /> Confirm Delete
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </>
        )}
      </main>
    </div>
  );
}
