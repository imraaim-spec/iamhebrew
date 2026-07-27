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
      className="flex h-12 items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
    >
      Sign out
    </button>
  );
}
