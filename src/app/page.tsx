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
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center gap-6 py-32 px-16 bg-white dark:bg-black">
        <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
          iamhebrew
        </h1>

        {!user && (
          <>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Not signed in.
            </p>
            <GoogleSignInButton />
          </>
        )}

        {user && profile && (
          <>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Signed in as{" "}
              <span className="font-medium">{profile.email}</span> (
              {profile.role})
            </p>
            {profile.role === "teacher" && (
              <Link
                href="/teacher/decks"
                className="flex h-12 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
              >
                Go to teacher dashboard
              </Link>
            )}
            {profile.role === "student" && (
              <Link
                href="/student"
                className="flex h-12 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
              >
                Go to my assignments
              </Link>
            )}
            <SignOutButton />
          </>
        )}

        {user && !profile && (
          <>
            <p className="max-w-sm text-center text-lg text-zinc-600 dark:text-zinc-400">
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
