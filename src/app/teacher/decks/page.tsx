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
      <h1 className="text-2xl">Decks</h1>

      <form
        action={createDeck}
        className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4"
      >
        <h2 className="font-heading font-bold">New deck</h2>
        <input
          name="title"
          placeholder="Title, e.g. Lesson 5 — Verbs"
          required
          className="rounded-sm border border-border bg-surface px-3 py-2 text-text"
        />
        <textarea
          name="description"
          placeholder="Description (optional)"
          className="rounded-sm border border-border bg-surface px-3 py-2 text-text"
        />
        <button
          type="submit"
          className="self-start rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent-hover"
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
                className="block rounded-md border border-border bg-surface p-4 hover:bg-bg-alt"
              >
                <div className="font-medium">{deck.title}</div>
                {deck.description && (
                  <div className="text-sm text-text-muted">{deck.description}</div>
                )}
              </Link>
            </li>
          ))
        ) : (
          <p className="text-text-muted">No decks yet — create your first one above.</p>
        )}
      </ul>
    </div>
  );
}
