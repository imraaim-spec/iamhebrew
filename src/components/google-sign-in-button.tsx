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
      className="flex h-12 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
    >
      Sign in with Google
    </button>
  );
}
