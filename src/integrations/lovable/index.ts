import { supabase } from "../supabase/client";

type OAuthProvider = "google" | "github" | "facebook" | "twitter" | "discord";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const lovable = {
  auth: {
    signInWithOAuth: async (provider: OAuthProvider, opts?: SignInOptions) => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          ...(opts?.redirect_uri !== undefined && { redirectTo: opts.redirect_uri }),
          ...(opts?.extraParams !== undefined && { queryParams: opts.extraParams }),
        },
      });
      if (error) return { error };
      if (data?.url) {
        window.location.href = data.url;
        return { redirected: true };
      }
      return { redirected: false };
    },
  },
};
