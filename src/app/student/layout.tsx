import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/");

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <nav className="flex items-center gap-6 border-b border-black/[.08] px-8 py-4 dark:border-white/[.145]">
        <span className="font-semibold">iamhebrew</span>
        <Link href="/student" className="text-sm font-medium">
          My Wall
        </Link>
        <Link href="/" className="ml-auto text-sm text-zinc-500">
          Back to site
        </Link>
      </nav>
      <div className="flex-1 p-8">{children}</div>
    </div>
  );
}
