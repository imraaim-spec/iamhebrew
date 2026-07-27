import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createDeck } from "./actions";

export default async function DecksPage() {
  const supabase = await createClient();
  const { data: decks } = await supabase
    .from("decks")
    .select("id, title, description, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <h1 className="text-2xl font-semibold">Decks</h1>

      <form
        action={createDeck}
        className="flex flex-col gap-3 rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]"
      >
        <h2 className="font-medium">New deck</h2>
        <input
          name="title"
          placeholder="Title, e.g. Lesson 5 — Verbs"
          required
          className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
        />
        <textarea
          name="description"
          placeholder="Description (optional)"
          className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
        />
        <button
          type="submit"
          className="self-start rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Create deck
        </button>
      </form>

      <ul className="flex flex-col gap-2">
        {decks && decks.length > 0 ? (
          decks.map((deck) => (
            <li key={deck.id}>
              <Link
                href={`/teacher/decks/${deck.id}`}
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
            No decks yet — create your first one above.
          </p>
        )}
      </ul>
    </div>
  );
}
