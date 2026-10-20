import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sparkles, Shield, ArrowLeft, Mail, Lock, User, RefreshCw, KeyRound, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { setDemoMode } from "@/lib/restaurant";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type AuthMode = "login" | "signup" | "otp" | "forgot" | "reset";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: "signup" } =>
    s["mode"] === "signup" ? { mode: "signup" } : {},
  head: () => ({
    meta: [
      { title: "Log in or Sign up — Menuly" },
      { name: "description", content: "Access your restaurant's digital menu dashboard." },
      { property: "og:title", content: "Log in or Sign up — Menuly" },
      { property: "og:description", content: "Access your restaurant's digital menu dashboard." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>(search.mode === "signup" ? "signup" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [otpType, setOtpType] = useState<"SIGNUP" | "PASSWORD_RESET">("SIGNUP");

  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Check if user is already logged in
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("menuly_token");
      if (token) {
        navigate({ to: "/dashboard", replace: true });
      }
    }
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
      // Set cookie for SSR/server fetch compatibility
      document.cookie = `menuly_token=${encodeURIComponent(token)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    }
  };

  // 1. Submit Signup
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
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
        toast.info(`OTP Code: ${data.data.devOtp}`, { duration: 10000 });
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
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        // If unverified, switch to OTP verification
        if (data.data?.requiresVerification) {
          if (data.data?.devOtp) {
            setDevOtp(data.data.devOtp);
            toast.info(`OTP Code: ${data.data.devOtp}`, { duration: 10000 });
          }
          toast.info(data.message || "Please verify your email to continue.");
          setOtpType("SIGNUP");
          setCooldown(60);
          setMode("otp");
          return;
        }
        throw new Error(data.error || data.message || "Login failed");
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

  // 3. Verify OTP (Signup / Password Reset)
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
        // Password reset OTP verified, move to set new password
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
        toast.info(`New OTP Code: ${data.data.devOtp}`, { duration: 10000 });
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
        toast.info(`Reset OTP Code: ${data.data.devOtp}`, { duration: 10000 });
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

  const enterDemoMode = () => {
    setDemoMode(true);
    toast.success("Demo Mode Activated! All features unlocked for testing.");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero px-4 py-8">
      <div className="w-full max-w-sm animate-rise rounded-3xl border border-border/80 bg-card p-7 shadow-lift">
        <Link to="/" className="inline-block hover:opacity-90 transition-opacity">
          <Logo />
        </Link>

        {/* ------------------------------------------------------------------ */}
        {/* MODE: OTP VERIFICATION                                            */}
        {/* ------------------------------------------------------------------ */}
        {mode === "otp" && (
          <div className="mt-5 space-y-5">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                <Shield className="size-3.5" /> Gmail OTP Verification
              </span>
              <h1 className="mt-3 text-2xl font-bold">Check your email</h1>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                We sent a 6-digit verification code from <b>menulyoffcial@gmail.com</b> to:
                <br />
                <span className="font-semibold text-foreground font-mono">{email}</span>
              </p>
            </div>

            {devOtp && (
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-center shadow-xs">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-primary">
                  <Sparkles className="size-4 text-amber-500 animate-pulse" />
                  <span>Your Verification Code:</span>
                </div>
                <div className="my-2 flex items-center justify-center">
                  <span className="rounded-xl border border-primary/30 bg-background px-4 py-1.5 font-mono text-2xl font-black tracking-widest text-primary shadow-xs">
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
                <p className="mt-2 text-[10px] text-muted-foreground">
                  (Gmail SMTP configure hone tak code yahan direct show ho raha hai)
                </p>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="flex flex-col items-center justify-center space-y-2">
                <Label htmlFor="otp" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Enter 6-Digit Code
                </Label>
                <div className="flex justify-center py-2">
                  <InputOTP maxLength={6} value={otp} onChange={(value) => setOtp(value)}>
                    <InputOTPGroup className="gap-1.5 sm:gap-2">
                      <InputOTPSlot index={0} className="size-11 sm:size-12 text-lg font-bold border rounded-xl" />
                      <InputOTPSlot index={1} className="size-11 sm:size-12 text-lg font-bold border rounded-xl" />
                      <InputOTPSlot index={2} className="size-11 sm:size-12 text-lg font-bold border rounded-xl" />
                      <InputOTPSlot index={3} className="size-11 sm:size-12 text-lg font-bold border rounded-xl" />
                      <InputOTPSlot index={4} className="size-11 sm:size-12 text-lg font-bold border rounded-xl" />
                      <InputOTPSlot index={5} className="size-11 sm:size-12 text-lg font-bold border rounded-xl" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <p className="text-[11px] text-muted-foreground">Code expires in 10 minutes</p>
              </div>

              <Button
                type="submit"
                className="w-full font-bold shadow-soft"
                size="lg"
                disabled={busy || otp.length !== 6}
              >
                {busy ? "Verifying..." : "Verify & Continue"}
              </Button>
            </form>

            <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
              <button
                type="button"
                onClick={() => setMode(otpType === "SIGNUP" ? "signup" : "forgot")}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground font-medium"
              >
                <ArrowLeft className="size-3.5" /> Back / Edit email
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={cooldown > 0 || busy}
                className="font-bold text-primary disabled:text-muted-foreground transition-colors"
              >
                {cooldown > 0 ? `Resend code (${cooldown}s)` : "Resend code"}
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* MODE: RESET PASSWORD                                              */}
        {/* ------------------------------------------------------------------ */}
        {mode === "reset" && (
          <div className="mt-5 space-y-5">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                <KeyRound className="size-3.5" /> Set New Password
              </span>
              <h1 className="mt-3 text-2xl font-bold">New Password</h1>
              <p className="mt-1 text-xs text-muted-foreground">
                Enter a strong password for <b>{email}</b>.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">New Password (min 6 characters)</Label>
                <Input
                  id="newPassword"
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoFocus
                />
              </div>

              <Button type="submit" className="w-full font-bold shadow-soft" size="lg" disabled={busy}>
                {busy ? "Updating..." : "Update Password & Log In"}
              </Button>
            </form>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* MODE: FORGOT PASSWORD                                             */}
        {/* ------------------------------------------------------------------ */}
        {mode === "forgot" && (
          <div className="mt-5 space-y-5">
            <div>
              <h1 className="text-2xl font-bold">Reset Password</h1>
              <p className="mt-1 text-xs text-muted-foreground">
                Enter your registered email address. We'll send you a 6-digit OTP code to reset your password.
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="forgotEmail">Email Address</Label>
                <Input
                  id="forgotEmail"
                  type="email"
                  required
                  placeholder="chef@restaurant.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
              </div>

              <Button type="submit" className="w-full font-bold shadow-soft" size="lg" disabled={busy}>
                {busy ? "Sending Code..." : "Send Verification Code"}
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground">
              Remembered your password?{" "}
              <button
                type="button"
                className="font-bold text-primary hover:underline"
                onClick={() => setMode("login")}
              >
                Back to login
              </button>
            </p>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* MODE: SIGNUP OR LOGIN                                             */}
        {/* ------------------------------------------------------------------ */}
        {(mode === "signup" || mode === "login") && (
          <>
            <h1 className="mt-5 text-2xl font-bold">
              {mode === "signup" ? "Create your account" : "Welcome back"}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {mode === "signup"
                ? "Start your digital Pure Veg menu in 2 minutes."
                : "Log in to manage your menu, tables & QR codes."}
            </p>

            <form onSubmit={mode === "signup" ? handleSignup : handleLogin} className="mt-5 space-y-3.5">
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Your Name or Restaurant Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="e.g. Chef Rajesh Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="chef@restaurant.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-[11px] text-primary hover:underline font-semibold"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                variant="secondary"
                className="w-full font-bold shadow-soft"
                size="lg"
                disabled={busy}
              >
                {busy ? "Please wait..." : mode === "signup" ? "Create Account & Send OTP" : "Log In"}
              </Button>
            </form>

            <p className="mt-5 text-center text-xs text-muted-foreground">
              {mode === "signup" ? "Already have an account?" : "New to Menuly?"}{" "}
              <button
                type="button"
                className="font-bold text-primary underline underline-offset-2"
                onClick={() => setMode(mode === "signup" ? "login" : "signup")}
              >
                {mode === "signup" ? "Log in" : "Create an account"}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
