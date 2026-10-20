import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  Shield,
  ArrowLeft,
  Mail,
  Lock,
  User,
  KeyRound,
  CheckCircle2,
  Eye,
  EyeOff,
  Zap,
  Smartphone,
  TrendingUp,
  QrCode,
  Store,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { AnimatedQR } from "@/components/AnimatedQR";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "signup" | "otp" | "forgot" | "reset";

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

  const saveAuthSession = (token: string, user: unknown) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("menuly_token", token);
      localStorage.setItem("menuly_user", JSON.stringify(user));
      document.cookie = `menuly_token=${encodeURIComponent(token)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    }
  };

  // 1. Submit Signup
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || password.length < 6) {
      toast.error("Please enter a valid email and a password of at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Signup failed");
      }
      if (data.data?.devOtp) {
        setDevOtp(data.data.devOtp);
      }
      toast.success(data.message || "Verification code sent to your email!");
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

  // 2. Submit Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Please enter your email and password.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
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

  // 3. Verify OTP
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
        toast.success("Email verified successfully! Welcome to Menuly.");
        navigate({ to: "/dashboard" });
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

  // 4. Resend OTP
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

  // 5. Forgot Password Request
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your registered email address");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to request password reset");
      }
      if (data.data?.devOtp) {
        setDevOtp(data.data.devOtp);
      }
      toast.success("If this email is registered, a 6-digit reset code has been sent!");
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
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-hero px-4 py-8 sm:py-12">
      {/* Decorative Background Lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 -translate-x-1/2 -translate-y-1/2 size-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 size-80 rounded-full bg-accent/15 blur-3xl" />
      </div>

      {/* Main Responsive Executive Auth Container (2-Column on Desktop) */}
      <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-3xl border border-border/80 bg-card shadow-lift backdrop-blur-xl">
        <div className="grid lg:grid-cols-12">
          
          {/* ================================================================= */}
          {/* LEFT COLUMN: Feature Showcase & Trust Panel (Desktop Only)         */}
          {/* ================================================================= */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-between bg-gradient-to-b from-[#0f172a] via-[#111c2e] to-[#0b1322] p-8 text-white border-r border-border/50">
            <div>
              {/* Brand Top */}
              <Link to="/" className="inline-block hover:opacity-90 transition-opacity">
                <Logo />
              </Link>

              <div className="mt-8">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-foreground">
                  <Sparkles className="size-3 text-amber-400" /> Dining Reimagined
                </span>
                <h2 className="mt-4 font-display text-2xl font-bold leading-tight">
                  The Complete Digital Menu Suite for Restaurants & Cafes
                </h2>
                <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                  Join hundreds of top dining spaces eliminating paper reprint costs and tracking customer visits in real time.
                </p>
              </div>

              {/* Feature Points */}
              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="rounded-xl bg-primary/20 p-2 text-primary shrink-0 border border-primary/30">
                    <Zap className="size-4 text-emerald-400" />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-slate-100">Instant Live Updates</h3>
                    <p className="text-[11px] text-slate-400">Change dish prices, names or mark 86 sold-out in 1 tap without reprints.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="rounded-xl bg-primary/20 p-2 text-primary shrink-0 border border-primary/30">
                    <Smartphone className="size-4 text-blue-400" />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-slate-100">Zero App Required</h3>
                    <p className="text-[11px] text-slate-400">Guests simply point their iPhone or Android camera to browse in &lt;1 second.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="rounded-xl bg-primary/20 p-2 text-primary shrink-0 border border-primary/30">
                    <TrendingUp className="size-4 text-amber-400" />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-slate-100">Real-Time Diner Telemetry</h3>
                    <p className="text-[11px] text-slate-400">Track daily QR scans, peak visit hours, and customer interest live.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="rounded-xl bg-primary/20 p-2 text-primary shrink-0 border border-primary/30">
                    <Shield className="size-4 text-purple-400" />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-slate-100">Bank-Grade OTP Protection</h3>
                    <p className="text-[11px] text-slate-400">Direct Gmail verification codes keep your restaurant account safe.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Trust Badge */}
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-400" /> Mumbai Edge CDN
              </span>
              <span>Fast &bull; Reliable &bull; Secure</span>
            </div>
          </div>

          {/* ================================================================= */}
          {/* RIGHT COLUMN: The Auth Form Card                                 */}
          {/* ================================================================= */}
          <div className="col-span-12 lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
            
            {/* Mobile Header Brand */}
            <div className="lg:hidden mb-6 flex justify-between items-center">
              <Link to="/" className="inline-block hover:opacity-90 transition-opacity">
                <Logo />
              </Link>
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <Shield className="size-3 text-primary" /> Secure Auth
              </span>
            </div>

            {/* --------------------------------------------------------------- */}
            {/* MODE: LOGIN OR SIGNUP                                           */}
            {/* --------------------------------------------------------------- */}
            {(mode === "login" || mode === "signup") && (
              <div className="space-y-6">
                
                {/* Mode Segmented Pill Switcher */}
                <div className="flex items-center p-1 rounded-2xl bg-secondary/80 border border-border/80">
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className={cn(
                      "flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer",
                      mode === "login"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Log In
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className={cn(
                      "flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer",
                      mode === "signup"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Create Account
                  </button>
                </div>

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

                <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="space-y-4">
                  {/* Full Name for Signup */}
                  {mode === "signup" && (
                    <div className="space-y-1.5">
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
                          className="pl-10 h-11 rounded-xl text-sm"
                        />
                        <Store className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                      </div>
                    </div>
                  )}

                  {/* Email Input */}
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-bold text-foreground">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        required
                        placeholder="chef@restaurant.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11 rounded-xl text-sm"
                      />
                      <Mail className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Password Input with Show/Hide Toggle */}
                  <div className="space-y-1.5">
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
                        className="pl-10 pr-10 h-11 rounded-xl text-sm"
                      />
                      <Lock className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground cursor-pointer"
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
                    className="w-full h-11 rounded-xl font-bold shadow-soft transition-all duration-200 cursor-pointer text-sm"
                  >
                    {busy ? (
                      <span className="flex items-center gap-2">
                        <span className="size-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                        Please wait...
                      </span>
                    ) : mode === "login" ? (
                      "Sign In to Dashboard"
                    ) : (
                      "Create Account & Verify OTP"
                    )}
                  </Button>
                </form>

                <div className="text-center text-xs text-muted-foreground pt-2">
                  {mode === "login" ? (
                    <p>
                      New to Menuly?{" "}
                      <button
                        type="button"
                        onClick={() => setMode("signup")}
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
                        onClick={() => setMode("login")}
                        className="font-bold text-primary hover:underline cursor-pointer"
                      >
                        Sign in here
                      </button>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* --------------------------------------------------------------- */}
            {/* MODE: OTP VERIFICATION                                          */}
            {/* --------------------------------------------------------------- */}
            {mode === "otp" && (
              <div className="space-y-6">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                    <Shield className="size-3.5" /> Single-Use Verification Code
                  </span>
                  <h1 className="mt-3 font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                    Check your email
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
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setOtp(devOtp)}
                      className="h-8 gap-1.5 rounded-xl border-primary/30 bg-primary/10 text-xs font-bold text-primary hover:bg-primary/20 cursor-pointer"
                    >
                      <CheckCircle2 className="size-3.5" /> 1-Click Auto-Fill Code
                    </Button>
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
                    <p className="text-[11px] text-muted-foreground">Expires in 10 minutes</p>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={busy || otp.length !== 6}
                    className="w-full h-11 rounded-xl font-bold shadow-soft transition-all duration-200 cursor-pointer"
                  >
                    {busy ? "Verifying..." : "Verify & Launch Menu"}
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
            {/* MODE: FORGOT PASSWORD                                           */}
            {/* --------------------------------------------------------------- */}
            {mode === "forgot" && (
              <div className="space-y-6">
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
                    Enter your registered email address. We'll send you a 6-digit OTP code to verify and reset your password.
                  </p>
                </div>

                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="forgotEmail" className="text-xs font-bold text-foreground">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Input
                        id="forgotEmail"
                        type="email"
                        required
                        placeholder="chef@restaurant.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11 rounded-xl text-sm"
                        autoFocus
                      />
                      <Mail className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={busy}
                    className="w-full h-11 rounded-xl font-bold shadow-soft transition-all duration-200 cursor-pointer"
                  >
                    {busy ? "Sending Code..." : "Send Verification Code"}
                  </Button>
                </form>
              </div>
            )}

            {/* --------------------------------------------------------------- */}
            {/* MODE: SET NEW PASSWORD                                          */}
            {/* --------------------------------------------------------------- */}
            {mode === "reset" && (
              <div className="space-y-6">
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
                    {busy ? "Updating..." : "Save Password & Log In"}
                  </Button>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
