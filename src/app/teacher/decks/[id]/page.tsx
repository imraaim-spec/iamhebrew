import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CardForm } from "@/components/card-form";
import {
  createCard,
  createFlashcardsBulk,
  deleteCard,
  setDeckAssignments,
} from "./actions";

function summarizeCard(type: string, content: Record<string, unknown>) {
  if (type === "flashcard") return `${content.front} → ${content.back}`;
  if (type === "fill_blank") return `${content.question} (answer: ${content.answer})`;
  if (type === "multiple_choice") {
    const options = content.options as string[];
    const correctIndex = content.correctIndex as number;
    return `${content.question} — options: ${options.join(", ")} (correct: ${options[correctIndex]})`;
  }
  return JSON.stringify(content);
}

const TYPE_LABELS: Record<string, string> = {
  flashcard: "Flashcard",
  fill_blank: "Fill in the blank",
  multiple_choice: "Multiple choice",
  audio_fill_blank: "Audio + fill in the blank",
};

export default async function DeckDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: deck } = await supabase
    .from("decks")
    .select("id, title, description")
    .eq("id", id)
    .single();

  if (!deck) notFound();

  const { data: cards } = await supabase
    .from("cards")
    .select("id, type, content")
    .eq("deck_id", id)
    .order("created_at", { ascending: true });

  const { data: students } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .eq("role", "student")
    .order("email", { ascending: true });

  const { data: currentAssignments } = await supabase
    .from("assignments")
    .select("student_id, custom_name")
    .eq("deck_id", id);

  const assignedToEveryone =
    currentAssignments?.some((a) => a.student_id === null) ?? false;
  const assignedStudentIds = new Set(
    (currentAssignments ?? [])
      .filter((a) => a.student_id !== null)
      .map((a) => a.student_id)
  );
  const customNameByStudent = new Map(
    (currentAssignments ?? [])
      .filter((a) => a.student_id !== null)
      .map((a) => [a.student_id as string, a.custom_name as string | null])
  );

  const createCardWithDeck = createCard.bind(null, id);
  const createFlashcardsBulkWithDeck = createFlashcardsBulk.bind(null, id);
  const setDeckAssignmentsWithDeck = setDeckAssignments.bind(null, id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{deck.title}</h1>
          {deck.description && (
            <p className="text-zinc-600 dark:text-zinc-400">{deck.description}</p>
          )}
        </div>
        <Link
          href={`/teacher/decks/${id}/study`}
          className="shrink-0 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Study this deck
        </Link>
      </div>

      <form
        action={setDeckAssignmentsWithDeck}
        className="flex flex-col gap-3 rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]"
      >
        <h2 className="font-medium">Assign this deck</h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="everyone"
            defaultChecked={assignedToEveryone}
          />
          Visible to all students
        </label>

        {students && students.length > 0 ? (
          <div className="flex flex-col gap-1 border-t border-black/[.08] pt-3 dark:border-white/[.145]">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Or choose specific students:
            </p>
            {students.map((student) => (
              <div key={student.id} className="flex items-center gap-2 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="students"
                    value={student.id}
                    defaultChecked={assignedStudentIds.has(student.id)}
                  />
                  {student.full_name || student.email}
                </label>
                <input
                  name={`custom_name_${student.id}`}
                  placeholder="Custom name for this student (optional)"
                  defaultValue={customNameByStudent.get(student.id) ?? ""}
                  className="rounded border border-black/[.08] px-2 py-1 text-xs dark:border-white/[.145] dark:bg-black"
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No students have signed in yet. Add them on the Students page,
            then ask them to sign in once — after that, they&apos;ll appear
            here to assign decks to.
          </p>
        )}

        <button
          type="submit"
          className="self-start rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Save assignment
        </button>
      </form>

      <CardForm action={createCardWithDeck} />

      <form
        action={createFlashcardsBulkWithDeck}
        className="flex flex-col gap-3 rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]"
      >
        <h2 className="font-medium">Add a list of flashcards</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Paste one word/phrase per line — Hebrew and its translation.
          Pasting two columns straight from a spreadsheet works
          automatically; if typing by hand, separate the two with a pipe
          symbol ( | ) instead of a comma, since Hebrew/English text often
          has commas of its own. Pronunciation audio is generated
          automatically for each one.
        </p>
        <pre className="rounded bg-black/[.03] p-2 text-xs text-zinc-600 dark:bg-white/[.05] dark:text-zinc-400">
{`שלום | Hello
תודה | Thank you
בבקשה | Please`}
        </pre>
        <textarea
          name="cards"
          rows={6}
          placeholder="Paste your list here..."
          required
          dir="auto"
          className="rounded border border-black/[.08] px-3 py-2 font-mono text-sm dark:border-white/[.145] dark:bg-black"
        />
        <button
          type="submit"
          className="self-start rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Add list
        </button>
      </form>

      <ul className="flex flex-col gap-2">
        {cards && cards.length > 0 ? (
          cards.map((card) => {
            const deleteCardWithIds = deleteCard.bind(null, card.id, id);
            return (
              <li
                key={card.id}
                className="flex items-start justify-between gap-4 rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]"
              >
                <div>
                  <div className="text-xs font-medium uppercase text-zinc-500">
                    {TYPE_LABELS[card.type] ?? card.type}
                  </div>
                  <div>{summarizeCard(card.type, card.content)}</div>
                  {typeof card.content.audio_url === "string" && (
                    <audio
                      controls
                      src={card.content.audio_url}
                      className="mt-2 h-8"
                    />
                  )}
                </div>
                <form action={deleteCardWithIds}>
                  <button
                    type="submit"
                    className="text-sm text-red-600 hover:underline dark:text-red-400"
                  >
                    Delete
                  </button>
                </form>
              </li>
            );
          })
        ) : (
          <p className="text-zinc-600 dark:text-zinc-400">
            No cards yet — add your first one above.
          </p>
        )}
      </ul>
    </div>
  );
}
