import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { isDemoMode } from "@/lib/restaurant";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // 1. If user is authenticated with custom JWT token, allow access
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("menuly_token");
      if (token) return;
    }

    // 2. Fallback to demo mode only if explicitly enabled
    if (isDemoMode() && typeof window !== "undefined") {
      return;
    }

    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user) return;
    } catch {
      // ignore
    }

    throw redirect({ to: "/auth" });
  },
  component: () => <Outlet />,
});
