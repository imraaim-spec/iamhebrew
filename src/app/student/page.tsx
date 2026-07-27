import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function StudentDecksPage() {
  const supabase = await createClient();

  // RLS already restricts this to only the decks assigned to the current
  // student (or assigned to everyone) — no manual filtering needed here.
  const { data: decks } = await supabase
    .from("decks")
    .select("id, title, description")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">My Decks</h1>

      <ul className="flex flex-col gap-2">
        {decks && decks.length > 0 ? (
          decks.map((deck) => (
            <li key={deck.id}>
              <Link
                href={`/student/decks/${deck.id}/study`}
                className="block rounded-lg border border-black/[.08] p-4 hover:bg-black/[.02] dark:border-white/[.145] dark:hover:bg-white/[.03]"
              >
                <div className="font-medium">{deck.title}</div>
                {deck.description && (
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    {deck.description}
                  </div>
                )}
              </Link>
            </li>
          ))
        ) : (
          <p className="text-zinc-600 dark:text-zinc-400">
            No decks assigned yet — check back after your teacher assigns
            you one.
          </p>
        )}
      </ul>
    </div>
  );
}
