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
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { myMenuQuery, setDemoMode } from "@/lib/restaurant";
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
  } | null>(null);

  // Form states: Profile
  const [fullName, setFullName] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Form states: Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  // Initialize from cache/session
  useEffect(() => {
    if (typeof window !== "undefined") {
      const uStr = localStorage.getItem("menuly_user");
      if (uStr) {
        try {
          const u = JSON.parse(uStr);
          setCurrentUser(u);
          if (u.fullName) setFullName(u.fullName);
          if (u.email) setEmail(u.email);
        } catch {
          // ignore
        }
      }
    }
  }, []);

  // Update when restaurant data loads
  useEffect(() => {
    if (restaurant) {
      if (restaurant.name) setRestaurantName(restaurant.name);
      if (restaurant.phone) setPhone(restaurant.phone);
    }
  }, [restaurant]);

  // Handle Profile Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setSavingProfile(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("menuly_token") : null;
      const res = await fetch("/api/auth/profile/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          fullName,
          email,
          restaurantName,
          phone,
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

      toast.success("Profile and restaurant details updated successfully!");
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
      <div className="max-w-6xl mx-auto space-y-8 py-6">
        
        {/* ================================================================= */}
        {/* 1. PROFILE EXECUTIVE HEADER BANNER                                 */}
        {/* ================================================================= */}
        <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-r from-card via-card to-primary/5 p-6 sm:p-8 shadow-lift">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-5">
              {/* Avatar circle with initials */}
              <div className="relative size-16 sm:size-20 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-tr from-primary to-accent p-0.5 shadow-md">
                <div className="flex size-full items-center justify-center rounded-2xl bg-card font-display text-2xl sm:text-3xl font-extrabold text-foreground">
                  {(fullName || restaurant?.name || "R").charAt(0).toUpperCase()}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-xl sm:text-2xl font-black text-foreground">
                    {fullName || restaurant?.name || "Restaurant Partner"}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="size-3" /> Verified Account
                  </span>
                  {currentUser?.role === "SUPER_ADMIN" && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      <Sparkles className="size-3" /> Super Admin
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                  <Mail className="size-3.5" /> {email || currentUser?.email || "owner@menuly.app"}
                </p>

                {restaurant?.slug && (
                  <div className="pt-1 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Digital Menu:</span>
                    <a
                      href={liveMenuUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-xs font-bold text-primary hover:underline"
                    >
                      /menu/{restaurant.slug} <ExternalLink className="size-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Action Shortcuts */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Button asChild variant="outline" size="sm" className="rounded-xl gap-1.5 font-bold shadow-xs">
                <Link to="/dashboard">
                  <LayoutDashboard className="size-3.5 text-primary" /> Dashboard
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="rounded-xl gap-1.5 font-bold shadow-xs">
                <Link to="/my-menu">
                  <UtensilsCrossed className="size-3.5 text-emerald-500" /> My Menu
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="rounded-xl gap-1.5 font-bold shadow-xs">
                <Link to="/qr">
                  <QrCode className="size-3.5 text-amber-500" /> QR Studio
                </Link>
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleSignOut}
                className="rounded-xl gap-1.5 font-bold shadow-xs cursor-pointer ml-auto sm:ml-0"
              >
                <LogOut className="size-3.5" /> Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 2-COLUMN MAIN SETTINGS GRID                                      */}
        {/* ================================================================= */}
        <div className="grid gap-8 lg:grid-cols-12">
          
          {/* LEFT COLUMN: Profile & Restaurant Identity (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-lift">
              <div className="flex items-center gap-2.5 pb-4 border-b border-border/60">
                <div className="rounded-xl bg-primary/10 p-2 text-primary">
                  <User className="size-5" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-foreground">Profile & Restaurant Details</h2>
                  <p className="text-xs text-muted-foreground">Update your owner contact information and brand identity.</p>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="mt-6 space-y-5">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="profileFullName" className="text-xs font-bold text-foreground">
                    Owner or Manager Name
                  </Label>
                  <div className="relative">
                    <Input
                      id="profileFullName"
                      type="text"
                      placeholder="e.g. Chef Rajesh Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10 h-11 rounded-xl text-sm"
                    />
                    <User className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                  </div>
                </div>

                {/* Restaurant Brand Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="profileRestName" className="text-xs font-bold text-foreground">
                    Restaurant / Cafe Name
                  </Label>
                  <div className="relative">
                    <Input
                      id="profileRestName"
                      type="text"
                      placeholder="e.g. Royal Spice Dining"
                      value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                      className="pl-10 h-11 rounded-xl text-sm"
                    />
                    <Store className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    This name appears on customer digital menus, QR posters, and receipts.
                  </p>
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <Label htmlFor="profileEmail" className="text-xs font-bold text-foreground">
                    Registered Email Address
                  </Label>
                  <div className="relative">
                    <Input
                      id="profileEmail"
                      type="email"
                      required
                      placeholder="owner@restaurant.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11 rounded-xl text-sm"
                    />
                    <Mail className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Used for OTP login authentication and critical platform notifications.
                  </p>
                </div>

                {/* Phone / WhatsApp */}
                <div className="space-y-1.5">
                  <Label htmlFor="profilePhone" className="text-xs font-bold text-foreground">
                    Contact & WhatsApp Number
                  </Label>
                  <div className="relative">
                    <Input
                      id="profilePhone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 h-11 rounded-xl text-sm"
                    />
                    <Smartphone className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={savingProfile}
                    className="gap-2 rounded-xl h-11 px-6 font-bold shadow-soft transition-all duration-200 cursor-pointer text-sm"
                  >
                    {savingProfile ? (
                      <>
                        <RefreshCw className="size-4 animate-spin" /> Saving Changes...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-4" /> Save Profile Details
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: Password & Security (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Password Change Card */}
            <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-lift">
              <div className="flex items-center gap-2.5 pb-4 border-b border-border/60">
                <div className="rounded-xl bg-accent/20 p-2 text-accent-foreground">
                  <KeyRound className="size-5" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-foreground">Security & Password</h2>
                  <p className="text-xs text-muted-foreground">Update your account login password.</p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
                {/* Current Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="currentPassword" className="text-xs font-bold text-foreground">
                    Current Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPw ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="pl-10 pr-10 h-11 rounded-xl text-sm"
                    />
                    <Lock className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showCurrentPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword" className="text-xs font-bold text-foreground">
                    New Password
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
                      className="pl-10 pr-10 h-11 rounded-xl text-sm"
                    />
                    <KeyRound className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showNewPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Minimum 6 characters with letters and numbers.</p>
                </div>

                {/* Confirm New Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs font-bold text-foreground">
                    Confirm New Password
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
                      className="pl-10 h-11 rounded-xl text-sm"
                    />
                    <Lock className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={changingPw}
                    className="w-full gap-2 rounded-xl h-11 font-bold shadow-soft transition-all duration-200 cursor-pointer text-sm"
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
            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-lift space-y-4">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Account & Edge Telemetry
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
    </AppShell>
  );
}
