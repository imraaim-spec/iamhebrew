"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const supabase = createClient();
  const router = useRouter();

  async function signOut() {
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <button
      onClick={signOut}
      className="flex h-12 items-center justify-center rounded-sm border border-border px-6 text-sm font-semibold text-text-muted transition-colors hover:bg-bg-alt"
    >
      Sign out
    </button>
  );
}
