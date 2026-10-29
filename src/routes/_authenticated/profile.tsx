import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  User,
  Store,
  Mail,
  Lock,
  Smartphone,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Eye,
  EyeOff,
  ExternalLink,
  Sparkles,
  KeyRound,
  QrCode,
  LayoutDashboard,
  UtensilsCrossed,
  Clock,
  Upload,
  Save,
  Image as ImageIcon,
  ClipboardPaste,
  AlertTriangle,
  RotateCcw,
  Shield,
  FileText,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { myMenuQuery, setDemoMode, uploadImage, updateRestaurantHelper } from "@/lib/restaurant";
import { compressImage } from "@/lib/image-compress";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/profile")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My Profile & Account Security — Menuly" },
      { name: "description", content: "Manage your restaurant owner profile, update email and password, and review account security." },
      { property: "og:title", content: "My Profile & Account Security — Menuly" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery(myMenuQuery);
  const restaurant = data?.restaurant;

  // Local user state from localStorage
  const [currentUser, setCurrentUser] = useState<{
    id?: string;
    userId?: string;
    email?: string;
    fullName?: string;
    role?: string;
    phone?: string | null;
  } | null>(null);

  // Mobile active tab view: "profile" | "security"
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");

  // Form states: Profile
  const [fullName, setFullName] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [email, setEmail] = useState("");
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [logoSummary, setLogoSummary] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverSummary, setCoverSummary] = useState<string | null>(null);
  const [isCompressingCover, setIsCompressingCover] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Phone WhatsApp OTP Verification States
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneDevOtp, setPhoneDevOtp] = useState("");
  const [phoneToVerify, setPhoneToVerify] = useState("");
  const [phoneCooldown, setPhoneCooldown] = useState(0);
  const [isSendingPhoneOtp, setIsSendingPhoneOtp] = useState(false);
  const [isVerifyingPhoneOtp, setIsVerifyingPhoneOtp] = useState(false);

  // Resend OTP Cooldown timer
  useEffect(() => {
    if (phoneCooldown <= 0) return;
    const timer = setInterval(() => {
      setPhoneCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [phoneCooldown]);

  // Form states: Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  // Initialize from cache/session & fetch fresh /api/auth/me
  useEffect(() => {
    if (typeof window !== "undefined") {
      const uStr = localStorage.getItem("menuly_user");
      if (uStr) {
        try {
          const u = JSON.parse(uStr);
          setCurrentUser(u);
          if (u.fullName) setFullName(u.fullName);
          if (u.email) setEmail(u.email);
          if (u.phone) {
            setVerifiedPhone(u.phone);
            setPhone(u.phone);
          }
        } catch {
          // ignore
        }
      }

      // Re-validate against /api/auth/me to get the freshest phone verification status
      const token = localStorage.getItem("menuly_token");
      if (token) {
        fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.json())
          .then((resData) => {
            if (resData.success && resData.data?.user) {
              const u = resData.data.user;
              setCurrentUser((prev) => ({ ...prev, ...u }));
              if (u.fullName) setFullName(u.fullName);
              if (u.email) setEmail(u.email);
              if (u.phone) {
                setVerifiedPhone(u.phone);
                setPhone((p) => p || u.phone);
              }
            }
          })
          .catch(() => {});
      }
    }
  }, []);

  // Update when restaurant data loads
  useEffect(() => {
    if (restaurant) {
      if (restaurant.name) setRestaurantName(restaurant.name);
      if (restaurant.phone) {
        setPhone((prev) => prev || restaurant.phone || "");
        if (!verifiedPhone && restaurant.phone) {
          setVerifiedPhone(restaurant.phone);
        }
      }
      if (restaurant.address) setAddress(restaurant.address);
      if (restaurant.description) setDescription(restaurant.description);
      if (restaurant.logo_url) setLogo(restaurant.logo_url);
      if (restaurant.cover_url) setCoverImage(restaurant.cover_url);
    }
  }, [restaurant, verifiedPhone]);

  // Derived Phone Verification States
  const cleanPhoneDigits = phone.replace(/\D/g, "").slice(-10);
  const cleanVerifiedDigits = verifiedPhone.replace(/\D/g, "").slice(-10);
  const isPhoneVerified = Boolean(cleanVerifiedDigits && cleanPhoneDigits === cleanVerifiedDigits);
  const isPhoneChanged = cleanPhoneDigits !== cleanVerifiedDigits;

  // Handle Send WhatsApp OTP
  const handleSendPhoneOtp = async () => {
    if (cleanPhoneDigits.length !== 10) {
      toast.error("Please enter a valid 10-digit WhatsApp number (e.g. 9876543210).");
      return;
    }
    setIsSendingPhoneOtp(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("menuly_token") : null;
      const res = await fetch("/api/auth/profile/send-phone-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          email: email || currentUser?.email,
          phone: cleanPhoneDigits,
        }),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || "Failed to send WhatsApp verification code.");
      }

      setPhoneToVerify(cleanPhoneDigits);
      setPhoneOtp("");
      if (resData.data?.devOtp) {
        setPhoneDevOtp(resData.data.devOtp);
      }
      setPhoneCooldown(60);
      setIsPhoneModalOpen(true);
      toast.success(resData.message || `Verification code sent to WhatsApp: +91 ${cleanPhoneDigits}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setIsSendingPhoneOtp(false);
    }
  };

  // Handle Verify WhatsApp OTP
  const handleVerifyPhoneOtp = async () => {
    if (phoneOtp.length !== 6) {
      toast.error("Please enter the complete 6-digit WhatsApp OTP.");
      return;
    }
    setIsVerifyingPhoneOtp(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("menuly_token") : null;
      const res = await fetch("/api/auth/profile/verify-phone-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          email: email || currentUser?.email,
          phone: phoneToVerify,
          otp: phoneOtp,
        }),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || "Incorrect verification code.");
      }

      const formatted = resData.data?.phone || `+91${phoneToVerify}`;
      setVerifiedPhone(formatted);
      setPhone(formatted);

      if (resData.data?.token && typeof window !== "undefined") {
        localStorage.setItem("menuly_token", resData.data.token);
        document.cookie = `menuly_token=${encodeURIComponent(resData.data.token)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      }
      if (typeof window !== "undefined") {
        const storedUser = localStorage.getItem("menuly_user");
        if (storedUser) {
          try {
            const u = JSON.parse(storedUser);
            u.phone = formatted;
            localStorage.setItem("menuly_user", JSON.stringify(u));
            setCurrentUser(u);
          } catch {}
        }
      }

      setIsPhoneModalOpen(false);
      setPhoneOtp("");
      toast.success("WhatsApp number verified and linked to your account successfully!");
      qc.invalidateQueries({ queryKey: myMenuQuery.queryKey });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setIsVerifyingPhoneOtp(false);
    }
  };

  // Clipboard Paste Helper for WhatsApp OTP
  const handlePastePhoneOtp = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        const digits = text.replace(/\D/g, "").slice(0, 6);
        if (digits.length === 6) {
          setPhoneOtp(digits);
          toast.success("6-digit code pasted from clipboard!");
          return;
        }
      }
      toast.info("Please copy a 6-digit code first or enter manually.");
    } catch {
      toast.info("Could not read from clipboard. Please enter code manually.");
    }
  };

  // Handle Logo Upload in Profile
  async function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const res = await uploadImage(f, "logo");
      setLogo(res.url);
      setLogoSummary(res.summary);
      toast.success(`Restaurant logo compressed & updated! (${res.summary})`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  // Handle Profile Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    // Security: Mobile number changes MUST be verified via WhatsApp OTP
    if (isPhoneChanged && cleanPhoneDigits.length > 0) {
      toast.error("WhatsApp verification required: Please click 'Verify via WhatsApp' to verify this mobile number first.");
      handleSendPhoneOtp();
      return;
    }

    setSavingProfile(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("menuly_token") : null;
      if (token) {
        const res = await fetch("/api/auth/profile/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fullName,
            email,
            restaurantName,
            phone: verifiedPhone || undefined,
            logoUrl: logo,
          }),
        });

        const resData = await res.json();
        if (!res.ok || !resData.success) {
          throw new Error(resData.error || "Failed to update profile.");
        }

        // Update local storage with new token and user
        if (resData.data?.token && typeof window !== "undefined") {
          localStorage.setItem("menuly_token", resData.data.token);
          localStorage.setItem("menuly_user", JSON.stringify(resData.data.user));
          document.cookie = `menuly_token=${encodeURIComponent(resData.data.token)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
          setCurrentUser(resData.data.user);
        }
      }

      // Always sync linked restaurant details (including address, logo & cover banner)
      await updateRestaurantHelper({
        name: restaurantName,
        phone: verifiedPhone || null,
        address: address.trim() || null,
        description: description.trim() || null,
        logoUrl: logo,
        coverUrl: coverImage,
      });

      toast.success("Profile, address & banner photo saved successfully!");
      qc.invalidateQueries({ queryKey: myMenuQuery.queryKey });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Please enter your current password.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match.");
      return;
    }

    setChangingPw(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("menuly_token") : null;
      const res = await fetch("/api/auth/profile/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || "Failed to change password.");
      }

      toast.success("Password changed successfully! Keep it safe.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setChangingPw(false);
    }
  };

  const handleSignOut = async () => {
    setDemoMode(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("menuly_token");
      localStorage.removeItem("menuly_user");
      localStorage.removeItem("menuly_demo_mode");
      localStorage.removeItem("menuly_demo_menu");
      sessionStorage.removeItem("menuly_admin_auth");
      document.cookie = "menuly_token=; path=/; max-age=0";
    }
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut().catch(() => {});
    navigate({ to: "/auth", replace: true });
  };

  const liveMenuUrl = restaurant?.slug ? `/menu/${restaurant.slug}` : "/menu";

  return (
    <AppShell title="My Profile & Settings">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 pb-12 min-w-0">
        
        {/* ================================================================= */}
        {/* 1. PROFILE EXECUTIVE HEADER BANNER (MOBILE FIRST LUXURY DESIGN)   */}
        {/* ================================================================= */}
        <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/5 p-4 sm:p-6 lg:p-7 shadow-soft">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-3.5 sm:gap-5 w-full sm:w-auto min-w-0">
              {/* Avatar circle with initials */}
              <div className="relative size-14 sm:size-18 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-tr from-primary to-accent p-0.5 shadow-sm">
                <div className="flex size-full items-center justify-center rounded-[14px] bg-card font-display text-xl sm:text-2xl font-black text-foreground">
                  {(fullName || restaurant?.name || "R").charAt(0).toUpperCase()}
                </div>
              </div>

              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <h2 className="font-display text-base sm:text-2xl font-black text-foreground truncate max-w-[220px] sm:max-w-md">
                    {fullName || restaurant?.name || "Restaurant Partner"}
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                    <ShieldCheck className="size-3" /> Verified
                  </span>
                  {currentUser?.role === "SUPER_ADMIN" && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-amber-700 dark:text-amber-400">
                      <Sparkles className="size-3" /> Admin
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5 truncate">
                  <Mail className="size-3.5 shrink-0 text-muted-foreground/70" />
                  <span className="truncate">{email || currentUser?.email || "owner@menuly.app"}</span>
                </p>

                {restaurant?.slug && (
                  <div className="pt-0.5 flex items-center gap-1.5 max-w-full">
                    <a
                      href={liveMenuUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/10 hover:bg-primary/15 px-2.5 py-1 text-xs font-mono font-bold text-primary transition-all max-w-full truncate"
                      title={`Open /menu/${restaurant.slug}`}
                    >
                      <UtensilsCrossed className="size-3 shrink-0" />
                      <span className="truncate">/menu/{restaurant.slug}</span>
                      <ExternalLink className="size-3 shrink-0 opacity-70" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Action Shortcuts (Mobile-optimized 2x2 grid) */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-border/60">
              <Button asChild variant="outline" size="sm" className="rounded-xl h-10 sm:h-9 text-xs font-bold shadow-xs justify-center cursor-pointer">
                <Link to="/dashboard">
                  <LayoutDashboard className="size-3.5 text-primary" /> Dashboard
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="rounded-xl h-10 sm:h-9 text-xs font-bold shadow-xs justify-center cursor-pointer">
                <Link to="/my-menu">
                  <UtensilsCrossed className="size-3.5 text-emerald-600" /> My Menu
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="rounded-xl h-10 sm:h-9 text-xs font-bold shadow-xs justify-center cursor-pointer">
                <Link to="/qr">
                  <QrCode className="size-3.5 text-amber-600" /> QR Studio
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="rounded-xl h-10 sm:h-9 text-xs font-bold shadow-xs justify-center text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 cursor-pointer"
              >
                <LogOut className="size-3.5" /> Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* MOBILE SEGMENTED VIEW SWITCHER (Profile & Brand vs Security)       */}
        {/* ================================================================= */}
        <div className="flex lg:hidden rounded-2xl bg-muted/60 p-1 border border-border/80 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer",
              activeTab === "profile"
                ? "bg-card text-foreground shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Store className="size-3.5 text-primary" /> Profile & Brand
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer",
              activeTab === "security"
                ? "bg-card text-foreground shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <KeyRound className="size-3.5 text-amber-600" /> Security & Login
          </button>
        </div>

        {/* ================================================================= */}
        {/* 2-COLUMN MAIN SETTINGS GRID                                      */}
        {/* ================================================================= */}
        <div className="grid gap-6 lg:gap-8 lg:grid-cols-12">
          
          {/* LEFT COLUMN: Profile & Restaurant Identity (7 cols) */}
          <div className={cn("lg:col-span-7 space-y-6", activeTab !== "profile" && "hidden lg:block")}>
            <div className="rounded-3xl border border-border/80 bg-card p-4 sm:p-6 lg:p-8 shadow-soft">
              <div className="flex items-center gap-2.5 pb-4 border-b border-border/60">
                <div className="rounded-xl bg-primary/10 p-2 text-primary">
                  <User className="size-5" />
                </div>
                <div>
                  <h2 className="font-display text-base sm:text-lg font-bold text-foreground">Profile & Restaurant Details</h2>
                  <p className="text-xs text-muted-foreground">Update your owner contact information and brand identity.</p>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="mt-5 space-y-4 sm:space-y-5">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="profileFullName" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <User className="size-3.5 text-primary" /> Owner or Manager Name
                  </Label>
                  <div className="relative">
                    <Input
                      id="profileFullName"
                      type="text"
                      placeholder="e.g. Chef Rajesh Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10 h-11 rounded-2xl text-base sm:text-sm bg-background border-border/80 focus:border-primary/50"
                    />
                    <User className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
                  </div>
                </div>

                {/* Restaurant Brand Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="profileRestName" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Store className="size-3.5 text-primary" /> Restaurant / Cafe Name
                  </Label>
                  <div className="relative">
                    <Input
                      id="profileRestName"
                      type="text"
                      placeholder="e.g. Royal Spice Dining"
                      value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                      className="pl-10 h-11 rounded-2xl text-base sm:text-sm bg-background border-border/80 focus:border-primary/50"
                    />
                    <Store className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    This name appears on customer digital menus, QR posters, and receipts.
                  </p>
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <Label htmlFor="profileEmail" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Mail className="size-3.5 text-primary" /> Registered Email Address
                  </Label>
                  <div className="relative">
                    <Input
                      id="profileEmail"
                      type="email"
                      required
                      placeholder="owner@restaurant.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11 rounded-2xl text-base sm:text-sm bg-background border-border/80 focus:border-primary/50"
                    />
                    <Mail className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Used for OTP login authentication and critical platform notifications.
                  </p>
                </div>

                {/* Contact & WhatsApp Phone Number */}
                <div className="space-y-2 rounded-2xl border border-border/80 bg-muted/20 p-3.5 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <Label htmlFor="profilePhone" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Smartphone className="size-3.5 text-primary" /> Contact & WhatsApp Mobile Number
                    </Label>
                    {isPhoneVerified ? (
                      <span className="self-start sm:self-auto inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="size-3" /> WhatsApp Verified
                      </span>
                    ) : isPhoneChanged && cleanPhoneDigits.length >= 10 ? (
                      <span className="self-start sm:self-auto inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="size-3" /> OTP Verification Required
                      </span>
                    ) : (
                      <span className="self-start sm:self-auto text-[11px] text-muted-foreground font-medium">
                        {verifiedPhone ? "Verified Number" : "Unverified"}
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <Input
                      id="profilePhone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={cn(
                        "pl-10 h-11 rounded-2xl text-base sm:text-sm bg-background font-mono tracking-wide",
                        isPhoneVerified
                          ? "border-emerald-500/40 focus:border-emerald-500"
                          : isPhoneChanged && cleanPhoneDigits.length >= 10
                          ? "border-amber-500/60 focus:border-amber-500"
                          : ""
                      )}
                    />
                    <Smartphone className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
                  </div>

                  {/* Verification action buttons */}
                  {isPhoneChanged && cleanPhoneDigits.length >= 10 && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        disabled={isSendingPhoneOtp}
                        onClick={handleSendPhoneOtp}
                        className="w-full sm:w-auto rounded-xl h-10 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft gap-2 cursor-pointer justify-center"
                      >
                        {isSendingPhoneOtp ? (
                          <>
                            <RefreshCw className="size-3.5 animate-spin" /> Sending WhatsApp OTP...
                          </>
                        ) : (
                          <>
                            <Smartphone className="size-3.5" /> Verify via WhatsApp OTP
                          </>
                        )}
                      </Button>
                      {verifiedPhone && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setPhone(verifiedPhone)}
                          className="w-full sm:w-auto rounded-xl h-9 px-3 text-xs text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer justify-center"
                        >
                          <RotateCcw className="size-3" /> Revert to {verifiedPhone}
                        </Button>
                      )}
                    </div>
                  )}

                  {isPhoneVerified ? (
                    <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 p-2.5 flex items-start gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600 mt-0.5" />
                      <p className="leading-snug">
                        <strong>Verified:</strong> Customers can contact your restaurant directly, and you can log in using WhatsApp OTP.
                      </p>
                    </div>
                  ) : isPhoneChanged ? (
                    <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
                      <AlertTriangle className="size-3.5 shrink-0 text-amber-600 mt-0.5" />
                      <p className="leading-snug">
                        <strong>Security Check:</strong> Mobile number changes require WhatsApp OTP verification before saving.
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">
                      Used for customer WhatsApp orders, password resets, and critical platform notifications.
                    </p>
                  )}
                </div>

                {/* Restaurant Address / Location */}
                <div className="space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <Label htmlFor="profileAddress" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-primary" /> Restaurant Address & City Location
                    </Label>
                    <span className="self-start sm:self-auto text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                      Visible on Live Menu
                    </span>
                  </div>
                  <div className="relative">
                    <Input
                      id="profileAddress"
                      type="text"
                      placeholder="e.g. 14, MG Road, Indore, Madhya Pradesh"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="pl-10 h-11 rounded-2xl text-base sm:text-sm bg-background border-border/80 focus:border-primary/50"
                    />
                    <MapPin className="absolute left-3.5 top-3.5 size-4 text-muted-foreground pointer-events-none" />
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    This address will appear with a map pin on your public digital menu header so customers can easily find your location.
                  </p>
                </div>

                {/* Restaurant Story / Tagline / About (Community & Storefront Profile) */}
                <div className="space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <Label htmlFor="profileDescription" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <FileText className="size-3.5 text-primary" /> Restaurant Story & Tagline
                    </Label>
                    <span className="self-start sm:self-auto text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                      Community Showcase
                    </span>
                  </div>
                  <textarea
                    id="profileDescription"
                    rows={2}
                    placeholder="e.g. Authentic charcoal tandoori specials, artisanal rooftop cafe dining, and slow-cooked curries."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-2xl p-3 text-base sm:text-sm bg-background border border-border/80 focus:border-primary/50 resize-none outline-none leading-relaxed"
                  />
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    Featured on your public restaurant storefront page and community discovery card.
                  </p>
                </div>

                {/* Restaurant Brand Logo Upload (Fully Responsive) */}
                <div className="space-y-2 pt-2 border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <ImageIcon className="size-3.5 text-primary" /> Restaurant Logo & Monogram
                    </Label>
                    <span className="text-[10px] text-muted-foreground">Appears in QR Code & Menu</span>
                  </div>
                  <div className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3.5">
                    <div className="relative size-16 sm:size-18 shrink-0 overflow-hidden rounded-2xl border border-border/80 bg-background shadow-xs flex items-center justify-center">
                      {logo ? (
                        <img
                          src={logo}
                          alt="Restaurant Logo"
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="size-full bg-primary/10 flex flex-col items-center justify-center text-primary font-bold">
                          <ImageIcon className="size-6 text-primary/60" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5 w-full">
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="cursor-pointer">
                          <input type="file" accept="image/*" className="hidden" onChange={onLogo} />
                          <span className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border/80 bg-card px-3 text-xs font-bold hover:bg-secondary transition-colors shadow-xs cursor-pointer">
                            <Upload className="size-3.5 text-primary" /> {logo ? "Change Logo" : "Upload Logo"}
                          </span>
                        </label>
                        {logo && (
                          <button
                            type="button"
                            onClick={() => {
                              setLogo(null);
                              setLogoSummary(null);
                            }}
                            className="text-xs text-destructive hover:underline font-semibold cursor-pointer py-1 px-1.5"
                          >
                            Remove Logo
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        Auto-compressed with WebP for ultra-fast QR scan
                      </p>
                      {logoSummary && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                          {logoSummary}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Header Banner Cover Image (Fully Responsive) */}
                <div className="space-y-2 pt-2 border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Sparkles className="size-3.5 text-primary" /> Menu Header Cover Banner Photo
                    </Label>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                      Luxury Ambience
                    </span>
                  </div>
                  <div className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 sm:p-4 space-y-3">
                    <div className="relative w-full h-32 sm:h-36 rounded-2xl overflow-hidden border border-border/80 bg-card shadow-xs">
                      {coverImage ? (
                        <img
                          src={coverImage}
                          alt="Cover Banner"
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="size-full bg-gradient-to-br from-secondary/80 to-muted flex flex-col items-center justify-center text-muted-foreground text-xs font-semibold gap-1">
                          <ImageIcon className="size-6 opacity-40" />
                          Default Dining Ambience Banner
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isCompressingCover}
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            setIsCompressingCover(true);
                            try {
                              const res = await compressImage(f, {
                                maxWidth: 1200,
                                maxHeight: 600,
                                quality: 0.80,
                                mimeType: "image/webp",
                              });
                              setCoverImage(res.dataUrl);
                              setCoverSummary(res.summary);
                              toast.success(`Banner photo compressed & applied! (${res.summary})`);
                            } catch (err: any) {
                              toast.error(err?.message || "Failed to compress image");
                            } finally {
                              setIsCompressingCover(false);
                            }
                          }}
                        />
                        <span className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border/80 bg-card px-3 text-xs font-bold hover:bg-secondary transition-colors shadow-xs cursor-pointer">
                          {isCompressingCover ? <RefreshCw className="size-3.5 animate-spin text-primary" /> : <Upload className="size-3.5 text-primary" />}
                          {isCompressingCover ? "Compressing WebP..." : (coverImage ? "Change Banner Photo" : "Upload Banner Photo")}
                        </span>
                      </label>

                      {coverImage && (
                        <button
                          type="button"
                          onClick={() => {
                            setCoverImage(null);
                            setCoverSummary(null);
                          }}
                          className="text-xs text-destructive hover:underline font-semibold cursor-pointer py-1 px-2"
                        >
                          Reset to Default
                        </button>
                      )}

                      {coverSummary && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold px-2 py-0.5 text-[10px]">
                          {coverSummary}
                        </span>
                      )}
                    </div>

                    {/* Direct URL Input */}
                    <Input
                      value={coverImage?.startsWith("data:") ? "" : (coverImage || "")}
                      onChange={(e) => {
                        setCoverImage(e.target.value || null);
                        setCoverSummary(null);
                      }}
                      placeholder="Or paste direct image URL (https://...)"
                      className="h-10 rounded-xl text-xs bg-background"
                    />

                    <p className="text-[11px] text-muted-foreground leading-normal">
                      This banner photo appears as an ambient luxury background on your customer menu header (~90% auto-compressed).
                    </p>
                  </div>
                </div>

                {/* Bottom Save Action Bar */}
                <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground text-center sm:text-left">
                    Updates will sync across your live digital menu and QR templates.
                  </p>
                  <Button
                    type="submit"
                    disabled={savingProfile}
                    className="w-full sm:w-auto gap-2 rounded-2xl h-12 sm:h-11 px-6 font-bold shadow-soft transition-all duration-200 cursor-pointer text-sm"
                  >
                    {savingProfile ? (
                      <>
                        <RefreshCw className="size-4 animate-spin" /> Saving Changes...
                      </>
                    ) : (
                      <>
                        <Save className="size-4" /> Save Profile Details
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: Password & Security (5 cols) */}
          <div className={cn("lg:col-span-5 space-y-6", activeTab !== "security" && "hidden lg:block")}>
            
            {/* Password Change Card */}
            <div className="rounded-3xl border border-border/80 bg-card p-4 sm:p-6 lg:p-8 shadow-soft">
              <div className="flex items-center gap-2.5 pb-4 border-b border-border/60">
                <div className="rounded-xl bg-accent/20 p-2 text-accent-foreground">
                  <KeyRound className="size-5" />
                </div>
                <div>
                  <h2 className="font-display text-base sm:text-lg font-bold text-foreground">Security & Password</h2>
                  <p className="text-xs text-muted-foreground">Update your account login password.</p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="mt-5 space-y-4">
                {/* Current Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="currentPassword" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Lock className="size-3.5 text-muted-foreground" /> Current Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPw ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="pl-10 pr-10 h-11 rounded-2xl text-base sm:text-sm bg-background border-border/80 focus:border-primary/50"
                    />
                    <Lock className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showCurrentPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <KeyRound className="size-3.5 text-muted-foreground" /> New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPw ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10 pr-10 h-11 rounded-2xl text-base sm:text-sm bg-background border-border/80 focus:border-primary/50"
                    />
                    <KeyRound className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showNewPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Minimum 6 characters with letters and numbers.</p>
                </div>

                {/* Confirm New Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Lock className="size-3.5 text-muted-foreground" /> Confirm New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showNewPw ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 h-11 rounded-2xl text-base sm:text-sm bg-background border-border/80 focus:border-primary/50"
                    />
                    <Lock className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={changingPw}
                    className="w-full gap-2 rounded-2xl h-12 sm:h-11 font-bold shadow-soft transition-all duration-200 cursor-pointer text-sm"
                  >
                    {changingPw ? (
                      <>
                        <RefreshCw className="size-4 animate-spin" /> Updating Password...
                      </>
                    ) : (
                      <>
                        <KeyRound className="size-4" /> Update Password
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>

            {/* Account & Server Telemetry Card */}
            <div className="rounded-3xl border border-border/80 bg-card p-4 sm:p-6 shadow-soft space-y-3.5">
              <h3 className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Shield className="size-3.5 text-primary" /> Account & Security Status
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Account Role</span>
                  <span className="font-bold font-mono text-foreground">{currentUser?.role || "RESTAURANT_OWNER"}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Authentication</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="size-3.5" /> OTP & Bcrypt Active
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Data Region</span>
                  <span className="font-medium text-foreground">Mumbai (AWS ap-south-1)</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-muted-foreground">Support Helpdesk</span>
                  <Link to="/support" className="font-bold text-primary hover:underline">
                    Submit a Ticket &rarr;
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* ================================================================= */}
      {/* 3. WHATSAPP PHONE OTP VERIFICATION MODAL (MOBILE FRIENDLY)        */}
      {/* ================================================================= */}
      <Dialog open={isPhoneModalOpen} onOpenChange={setIsPhoneModalOpen}>
        <DialogContent className="max-w-[94vw] sm:max-w-md rounded-3xl p-5 sm:p-7 border-border/80 bg-card shadow-2xl">
          <DialogHeader className="text-left space-y-2">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <Smartphone className="size-5" />
              </div>
              <div>
                <DialogTitle className="font-display text-base sm:text-lg font-bold text-foreground">
                  Verify WhatsApp Number
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Menuly Security: Verify ownership before saving this mobile number.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="rounded-2xl bg-muted/40 p-3 sm:p-3.5 border border-border/60 flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Smartphone className="size-3.5 text-emerald-500" /> WhatsApp Mobile:
              </span>
              <span className="font-mono font-bold text-foreground text-sm">+91 {phoneToVerify}</span>
            </div>

            {/* 6-Digit OTP slots */}
            <div className="space-y-2.5 text-center">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Enter 6-Digit Verification Code
              </Label>
              <div className="flex justify-center py-1">
                <InputOTP maxLength={6} value={phoneOtp} onChange={(v) => setPhoneOtp(v)}>
                  <InputOTPGroup className="gap-1.5 sm:gap-2.5">
                    <InputOTPSlot index={0} className="size-10 sm:size-12 text-base sm:text-lg font-bold border-2 rounded-xl focus:border-emerald-500" />
                    <InputOTPSlot index={1} className="size-10 sm:size-12 text-base sm:text-lg font-bold border-2 rounded-xl focus:border-emerald-500" />
                    <InputOTPSlot index={2} className="size-10 sm:size-12 text-base sm:text-lg font-bold border-2 rounded-xl focus:border-emerald-500" />
                    <InputOTPSlot index={3} className="size-10 sm:size-12 text-base sm:text-lg font-bold border-2 rounded-xl focus:border-emerald-500" />
                    <InputOTPSlot index={4} className="size-10 sm:size-12 text-base sm:text-lg font-bold border-2 rounded-xl focus:border-emerald-500" />
                    <InputOTPSlot index={5} className="size-10 sm:size-12 text-base sm:text-lg font-bold border-2 rounded-xl focus:border-emerald-500" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {/* Paste from clipboard */}
              <div className="flex items-center justify-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={handlePastePhoneOtp}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer bg-emerald-500/10 hover:bg-emerald-500/15 px-3 py-1.5 rounded-xl border border-emerald-500/20 transition-colors"
                >
                  <ClipboardPaste className="size-3.5" /> Paste Code from Clipboard
                </button>
              </div>

              {/* Dev OTP helper */}
              {phoneDevOtp && (
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={() => setPhoneOtp(phoneDevOtp)}
                    className="text-[11px] font-mono text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-lg cursor-pointer hover:underline border border-emerald-500/20"
                  >
                    Dev OTP: <strong>{phoneDevOtp}</strong> (Click to auto-fill)
                  </button>
                </div>
              )}
            </div>

            {/* Resend Cooldown */}
            <div className="text-center text-xs text-muted-foreground">
              Didn't receive the WhatsApp message?{" "}
              <button
                type="button"
                disabled={phoneCooldown > 0 || isSendingPhoneOtp}
                onClick={handleSendPhoneOtp}
                className="font-bold text-emerald-600 dark:text-emerald-400 disabled:text-muted-foreground cursor-pointer hover:underline"
              >
                {phoneCooldown > 0 ? `Resend code (${phoneCooldown}s)` : "Resend WhatsApp Code"}
              </button>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPhoneModalOpen(false)}
                className="flex-1 rounded-2xl h-11 cursor-pointer font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleVerifyPhoneOtp}
                disabled={phoneOtp.length !== 6 || isVerifyingPhoneOtp}
                className="flex-1 rounded-2xl h-11 font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-soft"
              >
                {isVerifyingPhoneOtp ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="size-4 animate-spin" /> Verifying...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-4" /> Verify & Link
                  </span>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
