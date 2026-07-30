import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { SignOutButton } from "@/components/sign-out-button";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user
    ? (
        await supabase
          .from("profiles")
          .select("email, role")
          .eq("id", user.id)
          .single()
      ).data
    : null;

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-bg">
      <main className="flex w-full max-w-md flex-col items-center gap-6 rounded-lg bg-surface p-12 text-center shadow-sm">
        <h1 className="font-heading text-[length:var(--text-hero)] font-bold text-text">
          iamhebrew
        </h1>

        {!user && (
          <>
            <p className="text-text-muted">Not signed in.</p>
            <GoogleSignInButton />
          </>
        )}

        {user && profile && (
          <>
            <p className="text-text-muted">
              Signed in as{" "}
              <span className="font-semibold text-text">{profile.email}</span>{" "}
              ({profile.role})
            </p>
            {profile.role === "teacher" && (
              <Link
                href="/teacher/decks"
                className="flex h-12 items-center justify-center gap-2 rounded-sm bg-accent px-6 text-sm font-semibold text-bg transition-colors hover:bg-accent-hover"
              >
                Go to teacher dashboard
              </Link>
            )}
            {profile.role === "student" && (
              <Link
                href="/student"
                className="flex h-12 items-center justify-center gap-2 rounded-sm bg-accent px-6 text-sm font-semibold text-bg transition-colors hover:bg-accent-hover"
              >
                Go to my wall
              </Link>
            )}
            <SignOutButton />
          </>
        )}

        {user && !profile && (
          <>
            <p className="max-w-sm text-text-muted">
              This Google account isn&apos;t registered for this site yet.
              Contact your teacher to be added.
            </p>
            <SignOutButton />
          </>
        )}
      </main>
    </div>
  );
}
