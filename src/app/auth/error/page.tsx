export default function AuthErrorPage() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center gap-4 bg-zinc-50 font-sans dark:bg-black">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
        Sign-in failed
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Something went wrong during sign-in. Please try again.
      </p>
      <a href="/" className="underline">
        Back to home
      </a>
    </div>
  );
}
