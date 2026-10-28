import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  Shield,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Mail,
  Lock,
  User,
  KeyRound,
  CheckCircle2,
  Eye,
  EyeOff,
  QrCode,
  Store,
  Check,
  RefreshCw,
  Phone,
  Copy,
  ClipboardPaste,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { AnimatedQR } from "@/components/AnimatedQR";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import authImage from "@/assets/auth-image.png";

type AuthMode = "login" | "signup" | "otp" | "phone_setup" | "otp_phone" | "forgot" | "reset";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): { mode?: "signup" } =>
    s["mode"] === "signup" ? { mode: "signup" } : {},
  head: () => ({
    meta: [
      { title: "Restaurant Sign In & Registration — Menuly" },
      { name: "description", content: "Access your restaurant's digital menu dashboard and live analytics." },
      { property: "og:title", content: "Restaurant Sign In & Registration — Menuly" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  const [checkingSession, setCheckingSession] = useState(true);
  const [mode, setMode] = useState<AuthMode>(search.mode === "signup" ? "signup" : "login");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [otpType, setOtpType] = useState<"SIGNUP" | "PASSWORD_RESET">("SIGNUP");

  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Real-time Email Availability Check States for Signup
  const [emailCheckStatus, setEmailCheckStatus] = useState<"idle" | "checking" | "exists" | "available">("idle");
  const [emailCheckMsg, setEmailCheckMsg] = useState("");

  // 1. Session Auto-Detection on Mount (With Smooth Skeleton Loading)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("menuly_token");
    if (token) {
      const userStr = localStorage.getItem("menuly_user");
      let destination = "/dashboard";
      try {
        const u = userStr ? JSON.parse(userStr) : null;
        if (u?.role === "SUPER_ADMIN" || u?.role === "super_admin") {
          destination = "/admin";
        }
      } catch {
        // fallback to /dashboard
      }

      const timer = setTimeout(() => {
        navigate({ to: destination as any, replace: true });
      }, 400);

      return () => {
        clearTimeout(timer);
      };
    }

    setCheckingSession(false);
    return undefined;
  }, [navigate]);

  // Resend OTP Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Real-time debounced email availability check in Signup mode
  useEffect(() => {
    if (mode !== "signup") {
      setEmailCheckStatus("idle");
      setEmailCheckMsg("");
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const isValidFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);

    if (!isValidFormat) {
      setEmailCheckStatus("idle");
      setEmailCheckMsg("");
      return;
    }

    setEmailCheckStatus("checking");

    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/auth/check-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail }),
        });
        const data = await res.json();
        if (data.success && data.data?.exists && data.data?.isVerified) {
          setEmailCheckStatus("exists");
          setEmailCheckMsg("This email is already registered with Menuly.");
        } else if (data.success && (!data.data?.exists || !data.data?.isVerified)) {
          setEmailCheckStatus("available");
          setEmailCheckMsg("Email is available for registration.");
        } else {
          setEmailCheckStatus("idle");
        }
      } catch {
        setEmailCheckStatus("idle");
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [email, mode]);

  // Instant check on email input blur
  const handleEmailBlur = async () => {
    if (mode !== "signup") return;
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return;
    if (emailCheckStatus === "checking" || emailCheckStatus === "idle") {
      try {
        setEmailCheckStatus("checking");
        const res = await fetch("/api/auth/check-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail }),
        });
        const data = await res.json();
        if (data.success && data.data?.exists && data.data?.isVerified) {
          setEmailCheckStatus("exists");
          setEmailCheckMsg("This email is already registered with Menuly.");
        } else if (data.success && (!data.data?.exists || !data.data?.isVerified)) {
          setEmailCheckStatus("available");
          setEmailCheckMsg("Email is available for registration.");
        }
      } catch {
        setEmailCheckStatus("idle");
      }
    }
  };

  const saveAuthSession = (token: string, user: unknown) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("menuly_token", token);
      localStorage.setItem("menuly_user", JSON.stringify(user));
      document.cookie = `menuly_token=${encodeURIComponent(token)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    }
  };

  const handlePasteOtp = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        const clipText = await navigator.clipboard.readText();
        const digits = clipText.replace(/\D/g, "").slice(0, 6);
        if (digits.length === 6) {
          setOtp(digits);
          toast.success("6-digit code pasted from clipboard!");
          return;
        }
      }
      toast.info("Please copy a 6-digit code first or enter manually.");
    } catch {
      toast.info("Please paste or type the 6-digit code directly into the boxes.");
    }
  };

  const handleCopyOtp = (code: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      toast.success("Verification code copied to clipboard!");
    }
  };

  // 1. Submit Signup
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 6) {
      toast.error("Please enter a password of at least 6 characters.");
      return;
    }

    // Fast-fail client-side if already verified as existing
    if (emailCheckStatus === "exists") {
      toast.error("This email is already registered! Please log in instead.", {
        action: {
          label: "Log In",
          onClick: () => {
            setMode("login");
            setEmailCheckStatus("idle");
          },
        },
      });
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          password,
          fullName,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (
          res.status === 409 ||
          data.error?.toLowerCase().includes("already exists") ||
          data.data?.code === "EMAIL_ALREADY_EXISTS"
        ) {
          setEmailCheckStatus("exists");
          setEmailCheckMsg("This email is already registered.");
          toast.error("An account with this email already exists!", {
            action: {
              label: "Log In Instead",
              onClick: () => {
                setMode("login");
                setEmailCheckStatus("idle");
              },
            },
          });
          return;
        }
        throw new Error(data.error || "Signup failed");
      }
      if (data.data?.devOtp) {
        setDevOtp(data.data.devOtp);
      }
      toast.success(data.message || "Step 1: Verification code sent to your email!");
      setOtpType("SIGNUP");
      setCooldown(60);
      setMode("otp");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  // 2. Submit Login (Supports Email OR WhatsApp Mobile Number)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Please enter your email or mobile number and password.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: email.trim(),
          email: email.trim(),
          password,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.data?.requiresVerification) {
          if (data.data?.devOtp) {
            setDevOtp(data.data.devOtp);
          }
          toast.info(data.message || "Please verify your email to continue.");
          setOtpType("SIGNUP");
          setCooldown(60);
          setMode("otp");
          return;
        }
        throw new Error(data.error || data.message || "Invalid credentials");
      }

      saveAuthSession(data.data.token, data.data.user);
      toast.success("Welcome back! Redirecting to dashboard...");

      if (data.data.user?.role === "SUPER_ADMIN") {
        navigate({ to: "/admin" });
      } else {
        navigate({ to: "/dashboard" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  // 3. Verify Email / Reset OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter the complete 6-digit verification code");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, type: otpType }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Verification failed");
      }

      if (otpType === "SIGNUP") {
        saveAuthSession(data.data.token, data.data.user);
        toast.success("Email verified! Step 2: Link your WhatsApp mobile number.");
        setOtp("");
        setDevOtp("");
        setMode("phone_setup");
      } else {
        toast.success("Code confirmed. Please set your new password.");
        setMode("reset");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  // 3b. Send WhatsApp Phone Verification Code (Step 2)
  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/send-phone-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone: cleanPhone }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to send WhatsApp verification code");
      }
      if (data.data?.devOtp) {
        setDevOtp(data.data.devOtp);
      }
      toast.success(data.message || "WhatsApp verification code sent!");
      setCooldown(60);
      setOtp("");
      setMode("otp_phone");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  // 3c. Verify WhatsApp Phone Code & Finish Onboarding
  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter the complete 6-digit WhatsApp verification code");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/verify-phone-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone, otp }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "WhatsApp verification failed");
      }
      if (data.data?.token && data.data?.user) {
        saveAuthSession(data.data.token, data.data.user);
      }
      toast.success("WhatsApp linked successfully! Welcome to Menuly.");
      navigate({ to: "/dashboard" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  // 3d. Resend Phone WhatsApp OTP
  const handleResendPhoneOtp = async () => {
    if (cooldown > 0) return;
    setBusy(true);
    try {
      const res = await fetch("/api/auth/send-phone-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to resend WhatsApp code");
      }
      if (data.data?.devOtp) {
        setDevOtp(data.data.devOtp);
      }
      toast.success("New verification code sent to your WhatsApp!");
      setCooldown(60);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  // 4. Resend Email OTP
  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setBusy(true);
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: otpType }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to resend code");
      }
      if (data.data?.devOtp) {
        setDevOtp(data.data.devOtp);
      }
      toast.success("New verification code sent to your email!");
      setCooldown(60);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  // 5. Forgot Password Request (Supports Email OR WhatsApp Mobile Number)
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your registered email or mobile number");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: email.trim(),
          email: email.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to request password reset");
      }
      if (data.data?.devOtp) {
        setDevOtp(data.data.devOtp);
      }
      if (data.data?.email) {
        setEmail(data.data.email);
      }
      toast.success(data.message || "A 6-digit reset code has been sent!");
      setOtpType("PASSWORD_RESET");
      setCooldown(60);
      setMode("otp");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  // 6. Reset Password Submit
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to reset password");
      }
      toast.success("Password updated successfully! Please log in.");
      setPassword(newPassword);
      setMode("login");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  // ---------------------------------------------------------------------------
  // SKELETON LOADER: Displayed while checking if session exists
  // ---------------------------------------------------------------------------
  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-hero px-4 py-12">
        <div className="w-full max-w-md rounded-3xl border border-border/80 bg-card p-8 sm:p-10 shadow-lift text-center space-y-6">
          <div className="flex justify-center">
            <div className="relative size-16 overflow-hidden rounded-2xl bg-primary/10 p-2 shadow-inner ring-4 ring-primary/20 animate-pulse">
              <AnimatedQR className="!rounded-xl" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-5 w-44 mx-auto rounded-full bg-muted animate-pulse" />
            <div className="h-3.5 w-60 mx-auto rounded-full bg-muted/60 animate-pulse" />
          </div>
          <div className="h-2 w-full max-w-[200px] mx-auto rounded-full bg-muted overflow-hidden">
            <div className="h-full w-1/2 bg-primary rounded-full animate-progress" />
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            Verifying your restaurant credentials...
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-3.5" /> Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-hero px-4 py-8 sm:py-12">
      {/* Floating Top-Left "Back to Home" Link */}
      <div className="fixed top-4 left-4 sm:top-6 sm:left-8 z-30">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/90 px-3.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-card shadow-xs backdrop-blur-md transition-all hover:-translate-x-0.5"
        >
          <ArrowLeft className="size-3.5 text-primary" /> Back to Home
        </Link>
      </div>

      {/* Decorative Background Lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 -translate-x-1/2 -translate-y-1/2 size-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 size-80 rounded-full bg-accent/15 blur-3xl" />
      </div>

      {/* Main Responsive Executive Auth Container (Fixed Consistent Height on Desktop) */}
      <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-3xl border border-border/80 bg-card shadow-lift backdrop-blur-xl lg:h-[640px]">
        <div className="grid lg:grid-cols-12 h-full">
          
          {/* ================================================================= */}
          {/* LEFT COLUMN: Visual Brand Image Panel (Strictly Fixed on Desktop)   */}
          {/* ================================================================= */}
          <div className="hidden lg:relative lg:block lg:col-span-6 h-full overflow-hidden bg-muted border-r border-border/50 select-none">
            <img
              src={authImage}
              alt="Menuly Digital Dining"
              className="absolute inset-0 size-full object-cover object-right select-none pointer-events-none"
              loading="eager"
            />
          </div>

          {/* ================================================================= */}
          {/* RIGHT COLUMN: The Auth Form Card (Consistent Height & Layout)     */}
          {/* ================================================================= */}
          <div className="col-span-12 lg:col-span-6 p-6 sm:p-10 flex flex-col justify-between h-full overflow-y-auto no-scrollbar">
            
            {/* Mobile Header Brand */}
            <div className="lg:hidden mb-6 flex justify-between items-center">
              <Link to="/" className="inline-block hover:opacity-90 transition-opacity">
                <Logo />
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-secondary/80 px-3 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all"
              >
                <ArrowLeft className="size-3 text-primary" /> Home
              </Link>
            </div>

            {/* --------------------------------------------------------------- */}
            {/* MODE: LOGIN OR SIGNUP                                           */}
            {/* --------------------------------------------------------------- */}
            {(mode === "login" || mode === "signup") && (
              <div className="flex flex-col justify-between flex-1 space-y-4">
                
                {/* Mode Segmented Pill Switcher with Gliding Animated Pill */}
                <div className="relative flex items-center p-1 rounded-2xl bg-secondary/80 border border-border/80 select-none">
                  {/* Sliding Active Pill Indicator */}
                  <div
                    className={cn(
                      "absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl bg-card shadow-xs border border-border/40 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none",
                      mode === "login" ? "left-1 translate-x-0" : "left-1 translate-x-[calc(100%+0px)]"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setEmailCheckStatus("idle");
                    }}
                    className={cn(
                      "relative z-10 flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-colors duration-200 cursor-pointer text-center",
                      mode === "login"
                        ? "text-foreground font-extrabold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Log In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setEmailCheckStatus("idle");
                    }}
                    className={cn(
                      "relative z-10 flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-colors duration-200 cursor-pointer text-center",
                      mode === "signup"
                        ? "text-foreground font-extrabold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Create Account
                  </button>
                </div>

                {/* Animated Form Body (Transitions smoothly between Login & Signup) */}
                <div key={mode} className="animate-auth-swap space-y-4 my-auto py-1">
                  <div>
                    <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                      {mode === "login" ? "Welcome back" : "Get your digital menu"}
                    </h1>
                    <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                      {mode === "login"
                        ? "Sign in to manage dishes, tables, and view live customer scans."
                        : "Create your restaurant account and launch your dynamic QR code in 2 minutes."}
                    </p>
                  </div>

                  <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="space-y-3.5">
                    {/* Full Name for Signup */}
                    {mode === "signup" && (
                      <div className="space-y-1 animate-auth-swap">
                        <Label htmlFor="fullName" className="text-xs font-bold text-foreground">
                          Restaurant or Owner Name
                        </Label>
                        <div className="relative">
                          <Input
                            id="fullName"
                            type="text"
                            required
                            placeholder="e.g. Royal Kitchen or Chef Rajesh"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="pl-10 h-10 sm:h-11 rounded-xl text-sm"
                          />
                          <Store className="absolute left-3.5 top-2.5 sm:top-3 size-4 text-muted-foreground" />
                        </div>
                      </div>
                    )}

                    {/* Email / Identifier Input with Real-time Availability & Instant Duplicate Detection */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email" className="text-xs font-bold text-foreground">
                          {mode === "login" ? "Email Address or Mobile Number" : "Email Address"}
                        </Label>
                        {mode === "signup" && emailCheckStatus === "available" && (
                          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in">
                            <CheckCircle2 className="size-3 text-emerald-500" /> Email available
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Input
                          id="email"
                          type={mode === "login" ? "text" : "email"}
                          required
                          placeholder={mode === "login" ? "chef@restaurant.com or 98765 43210" : "chef@restaurant.com"}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onBlur={handleEmailBlur}
                          className={cn(
                            "pl-10 pr-10 h-10 sm:h-11 rounded-xl text-sm transition-all",
                            mode === "signup" &&
                              emailCheckStatus === "exists" &&
                              "border-amber-500/80 focus-visible:ring-amber-500/30 bg-amber-500/5",
                            mode === "signup" &&
                              emailCheckStatus === "available" &&
                              "border-emerald-500/70 focus-visible:ring-emerald-500/20"
                          )}
                        />
                        {mode === "login" && phone.length > 0 ? (
                          <Phone className="absolute left-3.5 top-2.5 sm:top-3 size-4 text-muted-foreground" />
                        ) : (
                          <Mail className="absolute left-3.5 top-2.5 sm:top-3 size-4 text-muted-foreground" />
                        )}
                        
                        {/* Real-time Indicator Icon */}
                        {mode === "signup" && (
                          <div className="absolute right-3.5 top-2.5 sm:top-3 flex items-center pointer-events-none">
                            {emailCheckStatus === "checking" && (
                              <RefreshCw className="size-4 animate-spin text-muted-foreground" />
                            )}
                            {emailCheckStatus === "exists" && (
                              <AlertCircle className="size-4 text-amber-500 animate-in zoom-in-75" />
                            )}
                            {emailCheckStatus === "available" && (
                              <CheckCircle2 className="size-4 text-emerald-500 animate-in zoom-in-75" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Smart Dynamic Banner: When Email is already registered */}
                      {mode === "signup" && emailCheckStatus === "exists" && (
                        <div className="flex items-center justify-between gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs">
                              !
                            </span>
                            <div className="min-w-0">
                              <p className="font-bold text-amber-900 dark:text-amber-200 leading-tight">
                                Already Registered
                              </p>
                              <p className="text-[11px] text-amber-700/90 dark:text-amber-300/80 truncate">
                                An account exists for this email.
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setMode("login");
                              setEmailCheckStatus("idle");
                              toast.info("Switched to Log In. Enter your password to continue.");
                            }}
                            className="shrink-0 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white transition-all font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                          >
                            Log In <ArrowRight className="size-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Password Input with Show/Hide Toggle */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-xs font-bold text-foreground">
                          Password
                        </Label>
                        {mode === "login" && (
                          <button
                            type="button"
                            onClick={() => setMode("forgot")}
                            className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          required
                          minLength={6}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10 h-10 sm:h-11 rounded-xl text-sm"
                        />
                        <Lock className="absolute left-3.5 top-2.5 sm:top-3 size-4 text-muted-foreground" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-2.5 sm:top-3 text-muted-foreground hover:text-foreground cursor-pointer"
                          title={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4 text-muted-foreground" />}
                        </button>
                      </div>
                      {mode === "signup" && (
                        <p className="text-[11px] text-muted-foreground">Minimum 6 characters with letters and numbers.</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      disabled={busy}
                      onClick={(e) => {
                        if (mode === "signup" && emailCheckStatus === "exists") {
                          e.preventDefault();
                          setMode("login");
                          setEmailCheckStatus("idle");
                          toast.info("Switched to Log In. Enter your password to continue.");
                        }
                      }}
                      className={cn(
                        "w-full h-10 sm:h-11 rounded-xl font-bold shadow-soft transition-all duration-200 cursor-pointer text-sm hover:brightness-105 active:scale-[0.99]",
                        mode === "signup" && emailCheckStatus === "exists" && "bg-amber-600 hover:bg-amber-700 text-white"
                      )}
                    >
                      {busy ? (
                        <span className="flex items-center justify-center gap-2">
                          <RefreshCw className="size-4 animate-spin text-primary-foreground" />
                          {mode === "login" ? "Signing In..." : "Creating Account..."}
                        </span>
                      ) : mode === "login" ? (
                        "Sign In to Dashboard"
                      ) : emailCheckStatus === "exists" ? (
                        "Email Registered — Switch to Log In"
                      ) : (
                        "Create Account & Verify Email"
                      )}
                    </Button>
                  </form>

                  <div className="text-center text-xs text-muted-foreground pt-1">
                    {mode === "login" ? (
                      <p>
                        New to Menuly?{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setMode("signup");
                            setEmailCheckStatus("idle");
                          }}
                          className="font-bold text-primary hover:underline cursor-pointer"
                        >
                          Create an account for free
                        </button>
                      </p>
                    ) : (
                      <p>
                        Already have an account?{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setMode("login");
                            setEmailCheckStatus("idle");
                          }}
                          className="font-bold text-primary hover:underline cursor-pointer"
                        >
                          Sign in here
                        </button>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* --------------------------------------------------------------- */}
            {/* MODE: EMAIL OTP VERIFICATION (STEP 1)                           */}
            {/* --------------------------------------------------------------- */}
            {mode === "otp" && (
              <div key="otp" className="animate-auth-swap flex flex-col justify-between flex-1 space-y-4 my-auto py-1">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                    <Shield className="size-3.5" /> Single-Use Verification Code
                  </span>
                  <h1 className="mt-3 font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                    {otpType === "SIGNUP" ? "Check your email" : "Check your verification code"}
                  </h1>
                  <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    We sent a 6-digit verification code to:
                    <br />
                    <span className="font-semibold text-foreground font-mono bg-muted/60 px-2 py-0.5 rounded-md inline-block mt-1">
                      {email}
                    </span>
                  </p>
                </div>

                {devOtp && (
                  <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-center shadow-xs">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-primary">
                      <Sparkles className="size-4 text-amber-500 animate-pulse" />
                      <span>Verification Code:</span>
                    </div>
                    <div className="my-2.5 flex items-center justify-center">
                      <span className="rounded-xl border border-primary/30 bg-background px-5 py-2 font-mono text-2xl font-black tracking-widest text-primary shadow-xs">
                        {devOtp}
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setOtp(devOtp)}
                        className="h-8 gap-1.5 rounded-xl border-primary/30 bg-primary/10 text-xs font-bold text-primary hover:bg-primary/20 cursor-pointer"
                      >
                        <CheckCircle2 className="size-3.5" /> 1-Click Auto-Fill Code
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyOtp(devOtp)}
                        className="h-8 gap-1.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Copy OTP to clipboard"
                      >
                        <Copy className="size-3.5" /> Copy Code
                      </Button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Label htmlFor="otp" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Enter 6-Digit Code
                    </Label>
                    <div className="flex justify-center py-2">
                      <InputOTP maxLength={6} value={otp} onChange={(value) => setOtp(value)}>
                        <InputOTPGroup className="gap-2 sm:gap-2.5">
                          <InputOTPSlot index={0} className="size-11 sm:size-12 text-lg font-bold border-2 rounded-xl focus:border-primary" />
                          <InputOTPSlot index={1} className="size-11 sm:size-12 text-lg font-bold border-2 rounded-xl focus:border-primary" />
                          <InputOTPSlot index={2} className="size-11 sm:size-12 text-lg font-bold border-2 rounded-xl focus:border-primary" />
                          <InputOTPSlot index={3} className="size-11 sm:size-12 text-lg font-bold border-2 rounded-xl focus:border-primary" />
                          <InputOTPSlot index={4} className="size-11 sm:size-12 text-lg font-bold border-2 rounded-xl focus:border-primary" />
                          <InputOTPSlot index={5} className="size-11 sm:size-12 text-lg font-bold border-2 rounded-xl focus:border-primary" />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={handlePasteOtp}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer bg-primary/5 hover:bg-primary/10 px-3 py-1 rounded-lg border border-primary/20 transition-colors"
                      >
                        <ClipboardPaste className="size-3.5" /> Paste Code from Clipboard
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Expires in 10 minutes</p>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={busy || otp.length !== 6}
                    className="w-full h-11 rounded-xl font-bold shadow-soft transition-all duration-200 cursor-pointer"
                  >
                    {busy ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw className="size-4 animate-spin text-primary-foreground" />
                        Verifying Code...
                      </span>
                    ) : otpType === "SIGNUP" ? (
                      <span className="flex items-center justify-center gap-2">
                        Verify Email & Next Step <ArrowRight className="size-4" />
                      </span>
                    ) : (
                      "Verify & Reset Password"
                    )}
                  </Button>
                </form>

                <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs">
                  <button
                    type="button"
                    onClick={() => setMode(otpType === "SIGNUP" ? "signup" : "forgot")}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground font-medium cursor-pointer"
                  >
                    <ArrowLeft className="size-3.5" /> Back / Edit email
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={cooldown > 0 || busy}
                    className="font-bold text-primary disabled:text-muted-foreground transition-colors cursor-pointer"
                  >
                    {cooldown > 0 ? `Resend code (${cooldown}s)` : "Resend code"}
                  </button>
                </div>
              </div>
            )}

            {/* --------------------------------------------------------------- */}
            {/* MODE: STEP 2 - PHONE SETUP (LINK WHATSAPP NUMBER)               */}
            {/* --------------------------------------------------------------- */}
            {mode === "phone_setup" && (
              <div key="phone_setup" className="animate-auth-swap flex flex-col justify-between flex-1 space-y-4 my-auto py-1">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <Phone className="size-3.5" /> Step 2 of 2: WhatsApp Link
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-3 text-emerald-500" /> Email Verified
                    </span>
                  </div>
                  <h1 className="mt-3 font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                    Connect WhatsApp
                  </h1>
                  <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Link your mobile number to receive instant order alerts, daily sales reports, and enable 1-click WhatsApp login.
                  </p>
                </div>

                <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="phoneSetupInput" className="text-xs font-bold text-foreground">
                      WhatsApp Mobile Number
                    </Label>
                    <div className="relative flex rounded-xl border border-border/80 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 overflow-hidden bg-background">
                      <div className="flex items-center gap-1.5 bg-muted/60 px-3 border-r border-border/60 text-xs font-bold text-foreground select-none shrink-0">
                        <span className="text-sm">🇮🇳</span>
                        <span>+91</span>
                      </div>
                      <Input
                        id="phoneSetupInput"
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className="border-0 rounded-none shadow-none focus-visible:ring-0 h-11 text-sm font-semibold tracking-wide"
                        autoFocus
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      We will send a 6-digit WhatsApp OTP verification code to this number.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <Button
                      type="submit"
                      size="lg"
                      disabled={busy || !phone.trim() || phone.replace(/\D/g, "").length < 10}
                      className="w-full h-11 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft transition-all duration-200 cursor-pointer"
                    >
                      {busy ? (
                        <span className="flex items-center justify-center gap-2">
                          <RefreshCw className="size-4 animate-spin text-white" />
                          Sending WhatsApp Code...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          Send WhatsApp Code <ArrowRight className="size-4" />
                        </span>
                      )}
                    </Button>

                    <button
                      type="button"
                      onClick={() => {
                        toast.info("WhatsApp setup skipped. You can link it anytime from Settings.");
                        navigate({ to: "/dashboard" });
                      }}
                      className="w-full py-2 text-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      Skip for now & go to Dashboard →
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* --------------------------------------------------------------- */}
            {/* MODE: STEP 2 - WHATSAPP OTP VERIFICATION                        */}
            {/* --------------------------------------------------------------- */}
            {mode === "otp_phone" && (
              <div key="otp_phone" className="animate-auth-swap flex flex-col justify-between flex-1 space-y-4 my-auto py-1">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <Phone className="size-3.5" /> WhatsApp Verification
                  </span>
                  <h1 className="mt-3 font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                    Check your WhatsApp
                  </h1>
                  <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    We sent a 6-digit verification code via WhatsApp to:
                    <br />
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md inline-block mt-1 text-sm tracking-wide">
                      {(() => {
                        const digits = phone.replace(/\D/g, "");
                        return digits.length === 10
                          ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
                          : `+${digits}`;
                      })()}
                    </span>
                  </p>
                </div>

                {devOtp && (
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-center shadow-xs">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <Sparkles className="size-4 text-emerald-500 animate-pulse" />
                      <span>WhatsApp Code:</span>
                    </div>
                    <div className="my-2.5 flex items-center justify-center">
                      <span className="rounded-xl border border-emerald-500/30 bg-background px-5 py-2 font-mono text-2xl font-black tracking-widest text-emerald-600 shadow-xs">
                        {devOtp}
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setOtp(devOtp)}
                        className="h-8 gap-1.5 rounded-xl border-emerald-500/30 bg-emerald-500/10 text-xs font-bold text-emerald-600 hover:bg-emerald-500/20 cursor-pointer"
                      >
                        <CheckCircle2 className="size-3.5" /> 1-Click Auto-Fill Code
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyOtp(devOtp)}
                        className="h-8 gap-1.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Copy OTP to clipboard"
                      >
                        <Copy className="size-3.5" /> Copy Code
                      </Button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleVerifyPhoneOtp} className="space-y-5">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Label htmlFor="otpPhoneInput" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Enter 6-Digit WhatsApp Code
                    </Label>
                    <div className="flex justify-center py-2">
                      <InputOTP maxLength={6} value={otp} onChange={(value) => setOtp(value)}>
                        <InputOTPGroup className="gap-2 sm:gap-2.5">
                          <InputOTPSlot index={0} className="size-11 sm:size-12 text-lg font-bold border-2 rounded-xl focus:border-emerald-500" />
                          <InputOTPSlot index={1} className="size-11 sm:size-12 text-lg font-bold border-2 rounded-xl focus:border-emerald-500" />
                          <InputOTPSlot index={2} className="size-11 sm:size-12 text-lg font-bold border-2 rounded-xl focus:border-emerald-500" />
                          <InputOTPSlot index={3} className="size-11 sm:size-12 text-lg font-bold border-2 rounded-xl focus:border-emerald-500" />
                          <InputOTPSlot index={4} className="size-11 sm:size-12 text-lg font-bold border-2 rounded-xl focus:border-emerald-500" />
                          <InputOTPSlot index={5} className="size-11 sm:size-12 text-lg font-bold border-2 rounded-xl focus:border-emerald-500" />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={handlePasteOtp}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:underline cursor-pointer bg-emerald-500/5 hover:bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 transition-colors"
                      >
                        <ClipboardPaste className="size-3.5" /> Paste Code from Clipboard
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Expires in 10 minutes</p>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={busy || otp.length !== 6}
                    className="w-full h-11 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft transition-all duration-200 cursor-pointer"
                  >
                    {busy ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw className="size-4 animate-spin text-white" />
                        Verifying WhatsApp...
                      </span>
                    ) : (
                      "Verify & Launch Dashboard"
                    )}
                  </Button>
                </form>

                <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs">
                  <button
                    type="button"
                    onClick={() => setMode("phone_setup")}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground font-medium cursor-pointer"
                  >
                    <ArrowLeft className="size-3.5" /> Edit phone number
                  </button>

                  <button
                    type="button"
                    onClick={handleResendPhoneOtp}
                    disabled={cooldown > 0 || busy}
                    className="font-bold text-emerald-600 disabled:text-muted-foreground transition-colors cursor-pointer"
                  >
                    {cooldown > 0 ? `Resend code (${cooldown}s)` : "Resend code"}
                  </button>
                </div>
              </div>
            )}

            {/* --------------------------------------------------------------- */}
            {/* MODE: FORGOT PASSWORD (EMAIL OR PHONE)                          */}
            {/* --------------------------------------------------------------- */}
            {mode === "forgot" && (
              <div key="forgot" className="animate-auth-swap flex flex-col justify-between flex-1 space-y-4 my-auto py-1">
                <div>
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-semibold mb-3 cursor-pointer"
                  >
                    <ArrowLeft className="size-3.5" /> Back to Log In
                  </button>
                  <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                    Reset Password
                  </h1>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                    Enter your registered email address or mobile number. We'll send you a 6-digit OTP code to verify and reset your password.
                  </p>
                </div>

                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="forgotEmail" className="text-xs font-bold text-foreground">
                      Email Address or Mobile Number
                    </Label>
                    <div className="relative">
                      <Input
                        id="forgotEmail"
                        type="text"
                        required
                        placeholder="chef@restaurant.com or 98765 43210"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11 rounded-xl text-sm"
                        autoFocus
                      />
                      <Mail className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
                    </div>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-1">
                      <Shield className="size-3 text-primary" />
                      We verify that this account exists in our database before dispatching code.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={busy}
                    className="w-full h-11 rounded-xl font-bold shadow-soft transition-all duration-200 cursor-pointer"
                  >
                    {busy ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw className="size-4 animate-spin text-primary-foreground" />
                        Sending Reset Code...
                      </span>
                    ) : (
                      "Send Verification Code"
                    )}
                  </Button>
                </form>
              </div>
            )}

            {/* --------------------------------------------------------------- */}
            {/* MODE: SET NEW PASSWORD                                          */}
            {/* --------------------------------------------------------------- */}
            {mode === "reset" && (
              <div key="reset" className="animate-auth-swap flex flex-col justify-between flex-1 space-y-4 my-auto py-1">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                    <KeyRound className="size-3.5" /> Set New Password
                  </span>
                  <h1 className="mt-3 font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                    Create New Password
                  </h1>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                    Set a new strong password for <b>{email}</b>.
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="newPassword" className="text-xs font-bold text-foreground">
                      New Password (minimum 6 characters)
                    </Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        required
                        minLength={6}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pl-10 pr-10 h-11 rounded-xl text-sm"
                        autoFocus
                      />
                      <Lock className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={busy}
                    className="w-full h-11 rounded-xl font-bold shadow-soft transition-all duration-200 cursor-pointer"
                  >
                    {busy ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw className="size-4 animate-spin text-primary-foreground" />
                        Saving New Password...
                      </span>
                    ) : (
                      "Save Password & Log In"
                    )}
                  </Button>
                </form>
              </div>
            )}

            {/* Global Back to Website Footer Link */}
            <div className="pt-3 border-t border-border/50 text-center">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
              >
                <ArrowLeft className="size-3.5 group-hover:-translate-x-0.5 transition-transform" /> Return to public website
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
