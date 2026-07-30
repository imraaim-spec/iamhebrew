"use client";

import { createClient } from "@/lib/supabase/client";

export function GoogleSignInButton() {
  const supabase = createClient();

  async function signIn() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <button
      onClick={signIn}
      className="flex h-12 items-center justify-center gap-2 rounded-sm bg-accent px-6 text-sm font-semibold text-bg transition-colors hover:bg-accent-hover"
    >
      Sign in with Google
    </button>
  );
}
