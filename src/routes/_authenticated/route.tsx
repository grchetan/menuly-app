import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // 1. If user is authenticated with custom JWT token, allow access
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("menuly_token");
      if (token) return;
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
