export default function AuthErrorPage() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center gap-4 bg-bg font-body">
      <h1 className="text-2xl">
        Sign-in failed
      </h1>
      <p className="text-text-muted">
        Something went wrong during sign-in. Please try again.
      </p>
      <a href="/" className="text-accent-2 underline">
        Back to home
      </a>
    </div>
  );
}
