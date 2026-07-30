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
    <div className="flex min-h-screen flex-col bg-bg">
      <nav className="flex items-center gap-6 border-b border-border bg-surface px-8 py-4">
        <span className="font-heading font-bold text-text">iamhebrew</span>
        <Link href="/student" className="text-sm font-semibold text-text-muted hover:text-accent-2">
          My Wall
        </Link>
        <Link href="/" className="ml-auto text-sm text-text-faint hover:text-accent-2">
          Back to site
        </Link>
      </nav>
      <div className="flex-1 p-8">{children}</div>
    </div>
  );
}
