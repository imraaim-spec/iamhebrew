import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createDeck } from "./actions";
import { LANGUAGE_LABELS } from "@/lib/language";
import { computeAssignedStudentIdsByItem } from "@/lib/assignment-status";
import { FilterableContentList, type FilterableItem } from "@/components/filterable-content-list";

export default async function DecksPage() {
  const supabase = await createClient();
  const { data: decks } = await supabase
    .from("decks")
    .select("id, title, description, language, created_at")
    .order("created_at", { ascending: false });

  const { data: students } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .eq("role", "student")
    .order("email", { ascending: true });

  const { data: assignmentRows } = await supabase
    .from("assignments")
    .select("deck_id, student_id");
  const { data: exclusionRows } = await supabase
    .from("assignment_exclusions")
    .select("item_id, student_id")
    .eq("item_type", "deck");

  const assignedByDeck = computeAssignedStudentIdsByItem({
    allStudentIds: (students ?? []).map((s) => s.id),
    assignmentRows: (assignmentRows ?? []).map((a) => ({
      itemId: a.deck_id,
      studentId: a.student_id,
    })),
    exclusionRows: (exclusionRows ?? []).map((e) => ({
      itemId: e.item_id,
      studentId: e.student_id,
    })),
  });

  const studentOptions = (students ?? []).map((s) => ({
    id: s.id,
    label: s.full_name || s.email,
  }));

  const items: FilterableItem[] = (decks ?? []).map((deck) => ({
    id: deck.id,
    searchText: `${deck.title} ${deck.description ?? ""}`,
    language: deck.language,
    assignedStudentIds: Array.from(assignedByDeck.get(deck.id) ?? []),
    node: (
      <Link
        href={`/teacher/decks/${deck.id}`}
        className="block rounded-md border border-border bg-surface p-4 hover:bg-bg-alt"
      >
        <div className="font-medium">{deck.title}</div>
        {deck.description && (
          <div className="text-sm text-text-muted">{deck.description}</div>
        )}
      </Link>
    ),
  }));

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
        <select
          name="language"
          defaultValue=""
          className="rounded-sm border border-border bg-surface px-3 py-2 text-text"
        >
          <option value="">Language (not set)</option>
          {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="self-start rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent-hover"
        >
          Create deck
        </button>
      </form>

      <FilterableContentList
        items={items}
        students={studentOptions}
        emptyMessage="No decks yet — create your first one above."
      />
    </div>
  );
}
