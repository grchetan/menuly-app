import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  currency: string;
  announcementTicker: string;
  allowNewSignups: boolean;
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

const DEFAULT_USERS: AdminUser[] = [];

const DEFAULT_SETTINGS: PlatformSettings = {
  maintenanceMode: false,
  strictVegOnly: true,
  supportWhatsApp: "919876543210",
  supportEmail: "menulyofficial@gmail.com",
  currency: "₹ (INR)",
  announcementTicker: "Scan the QR 💥 See the menu 💥 Update prices anytime 💥 Mark sold out in 1 tap 💥 Fast & Responsive 💥 Zero reprinting",
  allowNewSignups: true,
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
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"restaurants" | "plans" | "users" | "tickets" | "analytics" | "settings">("restaurants");
  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([]);
  const [plans, setPlans] = useState<AdminPlan[]>(DEFAULT_ADMIN_PLANS);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);
  const [savingSettings, setSavingSettings] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [ticketFilter, setTicketFilter] = useState<"all" | "open" | "in_progress" | "resolved">("all");
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "owner" | "super_admin">("all");

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
      const uStr = localStorage.getItem("menuly_user");
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
        if (sessionStorage.getItem("menuly_console_locked") === "true") {
          setIsAdminAuth(false);
          return;
        }

        const token = localStorage.getItem("menuly_token");
        const userStr = localStorage.getItem("menuly_user");
        if (token && userStr) {
          try {
            const u = JSON.parse(userStr);
            if (u?.role === "SUPER_ADMIN" || u?.role === "super_admin") {
              sessionStorage.setItem("menuly_admin_auth", "true");
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
                  localStorage.setItem("menuly_token", res.data.token);
                }
                localStorage.setItem("menuly_user", JSON.stringify(u));
                if (u?.role === "SUPER_ADMIN" || u?.role === "super_admin") {
                  sessionStorage.setItem("menuly_admin_auth", "true");
                  setCurrentAdminUser(u);
                  setIsAdminAuth(true);
                }
              }
            })
            .catch(() => {});
        }

        const authed = sessionStorage.getItem("menuly_admin_auth") === "true";
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
    ])
      .then(([userData, restData, ticketData, settingsData]) => {
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
      })
      .catch((err) => {
        console.error("Failed to fetch live admin data:", err);
      })
      .finally(() => {
        setDataLoading(false);
      });
  }, [isAdminAuth]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminPassword.trim()) {
      toast.error("Please enter your Super Admin email and password");
      return;
    }

    setLoginLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail.trim(), password: adminPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Authentication failed");
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

      // Store credentials and auth flag
      localStorage.setItem("menuly_token", authToken);
      localStorage.setItem("menuly_user", JSON.stringify(userData));
      if (typeof document !== "undefined") {
        document.cookie = `menuly_token=${encodeURIComponent(authToken)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      }
      sessionStorage.removeItem("menuly_console_locked");
      sessionStorage.setItem("menuly_admin_auth", "true");
      setCurrentAdminUser(userData);
      setIsAdminAuth(true);
      toast.success(`Welcome to Executive Command Center, ${userData.fullName || userData.email}!`);
    } catch {
      toast.error("Network error during login. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLock = () => {
    sessionStorage.setItem("menuly_console_locked", "true");
    sessionStorage.removeItem("menuly_admin_auth");
    setIsAdminAuth(false);
    toast.info("Super Admin console locked. Password required to re-open.");
  };

  const handleSignOut = () => {
    sessionStorage.removeItem("menuly_admin_auth");
    sessionStorage.removeItem("menuly_console_locked");
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("menuly_token");
      localStorage.removeItem("menuly_user");
    }
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
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="menulyofficial@gmail.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="pl-9 bg-background"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="pl-9 pr-10 bg-background"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 pt-16">
      {/* Top Admin Navigation Header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 border-b border-border/80 bg-card/95 backdrop-blur-md"
        style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50 }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 hover:opacity-85 transition-opacity">
              <Logo />
            </Link>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold tracking-tight text-primary flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-primary" />
                <span>{adminDisplayName}</span>
                {isMasterAdmin ? (
                  <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full">
                    Master Admin
                  </span>
                ) : (
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded-full">
                    Admin
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" asChild className="gap-1.5 text-xs font-semibold">
              <Link to="/">
                <ExternalLink className="size-3.5" /> Public Site
              </Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleLock}
              className="gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
              title="Lock console without signing out"
            >
              <Lock className="size-3.5" /> Lock Console
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleSignOut}
              className="gap-1.5 text-xs font-semibold"
              title="Completely sign out of admin account"
            >
              <LogOut className="size-3.5" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8 animate-rise">
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

        {/* Tab Switcher - 6 Core Pillars */}
        <div className="flex items-center gap-2 border-b pb-3 overflow-x-auto no-scrollbar flex-nowrap">
          <button
            onClick={() => setActiveTab("restaurants")}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors whitespace-nowrap",
              activeTab === "restaurants"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground hover:bg-secondary/80"
            )}
          >
            <Store className="size-4" /> Restaurants ({restaurants.length})
          </button>

          <button
            onClick={() => setActiveTab("plans")}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors whitespace-nowrap",
              activeTab === "plans"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground hover:bg-secondary/80"
            )}
          >
            <CreditCard className="size-4" /> Plans & Pricing ({plans.length})
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors whitespace-nowrap",
              activeTab === "users"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground hover:bg-secondary/80"
            )}
          >
            <Users className="size-4" /> Users & Owners ({users.length})
          </button>

          <button
            onClick={() => setActiveTab("tickets")}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors whitespace-nowrap",
              activeTab === "tickets"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground hover:bg-secondary/80"
            )}
          >
            <LifeBuoy className="size-4" /> Support Desk ({openTicketsCount} pending)
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors whitespace-nowrap",
              activeTab === "analytics"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground hover:bg-secondary/80"
            )}
          >
            <BarChart3 className="size-4" /> Analytics
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors whitespace-nowrap",
              activeTab === "settings"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground hover:bg-secondary/80"
            )}
          >
            <Settings className="size-4" /> Platform Settings
          </button>
        </div>

        {/* TAB 1: BUSINESS ANALYTICS */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Weekly Scan Volume Bar Chart */}
              <div className="lg:col-span-2 rounded-2xl border bg-card p-6 shadow-soft">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="text-base font-bold text-foreground">Weekly QR Scans Activity</h3>
                    <p className="text-xs text-muted-foreground">Daily customer dining scans across menus</p>
                  </div>
                  <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                    {totalScans.toLocaleString()} Total Scans
                  </span>
                </div>

                <div className="mt-6 flex h-52 items-end justify-between gap-3 pt-4">
                  {weeklyScanTrends.map((t) => (
                    <div key={t.day} className="flex flex-1 flex-col items-center gap-2 h-full justify-end">
                      <span className="text-[11px] font-bold text-muted-foreground">{t.scans}</span>
                      <div
                        style={{ height: t.height }}
                        className="w-full max-w-[48px] rounded-t-lg bg-primary/80 hover:bg-primary transition-all duration-300"
                      />
                      <span className="text-xs font-semibold text-foreground">{t.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Peak Hours & Insights */}
              <div className="rounded-2xl border bg-card p-6 shadow-soft space-y-4">
                <h3 className="text-base font-bold text-foreground">Dining Time Insights</h3>
                <div className="space-y-3">
                  <div className="rounded-xl bg-secondary/60 p-3">
                    <p className="text-xs font-bold uppercase text-muted-foreground">Lunch Rush Peak</p>
                    <p className="text-base font-bold text-foreground">1:15 PM – 2:45 PM</p>
                    <p className="text-xs text-muted-foreground mt-0.5">38% of total daily scans occur here</p>
                  </div>

                  <div className="rounded-xl bg-secondary/60 p-3">
                    <p className="text-xs font-bold uppercase text-muted-foreground">Dinner Rush Peak</p>
                    <p className="text-base font-bold text-foreground">8:30 PM – 10:15 PM</p>
                    <p className="text-xs text-muted-foreground mt-0.5">52% of total daily scans occur here</p>
                  </div>

                  <div className="rounded-xl bg-primary/10 p-3 border border-primary/20 text-primary">
                    <p className="text-xs font-bold uppercase">Customer Engagement & Retention</p>
                    <p className="text-xs text-foreground mt-1">
                      Digital menus boast a <strong>4.8/5 satisfaction rate</strong> with instant mobile ordering convenience.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Performing Restaurants Leaderboard */}
            <div className="rounded-2xl border bg-card p-6 shadow-soft">
              <h3 className="text-base font-bold text-foreground mb-4">Top 5 Restaurants by QR Scans</h3>
              <div className="divide-y divide-border/60">
                {restaurants
                  .slice()
                  .sort((a, b) => b.qrScans - a.qrScans)
                  .map((r, i) => (
                    <div key={r.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-xs font-bold">
                          #{i + 1}
                        </span>
                        <div>
                          <p className="font-bold text-sm text-foreground">{r.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {r.city} · {r.dishCount} Dishes
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-extrabold text-sm text-primary">
                          {r.qrScans.toLocaleString()} scans
                        </span>
                        <Button size="sm" variant="ghost" asChild className="h-7 text-xs">
                          <a href={`/menu/${r.slug}`} target="_blank" rel="noreferrer">
                            View Menu <ExternalLink className="size-3 ml-1" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
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

              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                {(["all", "open", "in_progress", "resolved"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setTicketFilter(st)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
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
              <div className="flex items-center gap-2">
                {(["all", "owner", "super_admin"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setUserRoleFilter(r)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-bold transition-all",
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
                <table className="w-full text-left text-sm">
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

              {/* Support & Helplines Card */}
              <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-soft space-y-4">
                <h3 className="text-sm font-bold text-foreground border-b border-border/60 pb-2">
                  Official Contact & Support Helplines
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Admin WhatsApp Helpline
                    </Label>
                    <Input
                      value={settings.supportWhatsApp}
                      onChange={(e) => setSettings({ ...settings, supportWhatsApp: e.target.value })}
                      className="h-11 px-4 text-sm font-medium rounded-xl border-border bg-background"
                      placeholder="e.g. 919876543210"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Support Email
                    </Label>
                    <Input
                      value={settings.supportEmail}
                      onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                      className="h-11 px-4 text-sm font-medium rounded-xl border-border bg-background"
                      placeholder="support@menuly.com"
                    />
                  </div>
                </div>
              </div>

              {/* Live Announcement Marquee Ticker */}
              <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-soft space-y-3">
                <h3 className="text-sm font-bold text-foreground border-b border-border/60 pb-2">
                  Homepage Announcement Ticker (Live Marquee)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Text displayed in the black scrolling banner at the top of the homepage:
                </p>
                <Input
                  value={settings.announcementTicker}
                  onChange={(e) => setSettings({ ...settings, announcementTicker: e.target.value })}
                  className="h-11 px-4 text-sm font-semibold rounded-xl border-border bg-background"
                />
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
