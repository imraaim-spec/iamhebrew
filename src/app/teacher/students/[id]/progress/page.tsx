import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  deleteLessonNote,
  saveLessonNote,
  setStudentAssignments,
} from "../actions";

type CardContent = {
  front?: string;
  back?: string;
  question?: string;
};

type AttemptRow = {
  id: string;
  is_correct: boolean;
  attempted_at: string;
  card: {
    id: string;
    content: CardContent;
    deck: { id: string; title: string } | null;
  } | null;
};

function cardLabel(content: CardContent | undefined) {
  if (!content) return "(deleted card)";
  if (content.front) return content.front;
  if (content.question) return content.question;
  return "(card)";
}

export default async function StudentProgressPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit_date?: string }>;
}) {
  const { id } = await params;
  const { edit_date: editDate } = await searchParams;
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .eq("id", id)
    .eq("role", "student")
    .single();

  if (!student) notFound();

  const { data: decks } = await supabase
    .from("decks")
    .select("id, title")
    .order("title", { ascending: true });
  const { data: listeningExercises } = await supabase
    .from("listening_exercises")
    .select("id, title")
    .order("title", { ascending: true });
  const { data: verbDrills } = await supabase
    .from("verb_drills")
    .select("id, infinitive, translation")
    .order("infinitive", { ascending: true });
  const { data: fillBlankDrills } = await supabase
    .from("fill_blank_drills")
    .select("id, title")
    .order("title", { ascending: true });

  const { data: deckAssignments } = await supabase
    .from("assignments")
    .select("deck_id, student_id");
  const { data: listeningAssignments } = await supabase
    .from("listening_assignments")
    .select("exercise_id, student_id");
  const { data: verbAssignments } = await supabase
    .from("verb_drill_assignments")
    .select("drill_id, student_id");
  const { data: fillBlankAssignments } = await supabase
    .from("fill_blank_assignments")
    .select("drill_id, student_id");

  const deckStatus = new Map(
    (decks ?? []).map((d) => {
      const rows = (deckAssignments ?? []).filter((a) => a.deck_id === d.id);
      return [
        d.id,
        {
          everyone: rows.some((r) => r.student_id === null),
          assigned: rows.some((r) => r.student_id === id),
        },
      ] as const;
    })
  );
  const listeningStatus = new Map(
    (listeningExercises ?? []).map((e) => {
      const rows = (listeningAssignments ?? []).filter((a) => a.exercise_id === e.id);
      return [
        e.id,
        {
          everyone: rows.some((r) => r.student_id === null),
          assigned: rows.some((r) => r.student_id === id),
        },
      ] as const;
    })
  );
  const verbStatus = new Map(
    (verbDrills ?? []).map((v) => {
      const rows = (verbAssignments ?? []).filter((a) => a.drill_id === v.id);
      return [
        v.id,
        {
          everyone: rows.some((r) => r.student_id === null),
          assigned: rows.some((r) => r.student_id === id),
        },
      ] as const;
    })
  );
  const fillBlankStatus = new Map(
    (fillBlankDrills ?? []).map((d) => {
      const rows = (fillBlankAssignments ?? []).filter((a) => a.drill_id === d.id);
      return [
        d.id,
        {
          everyone: rows.some((r) => r.student_id === null),
          assigned: rows.some((r) => r.student_id === id),
        },
      ] as const;
    })
  );

  const setStudentAssignmentsWithId = setStudentAssignments.bind(null, id);
  const saveLessonNoteWithId = saveLessonNote.bind(null, id);

  const { data: lessonNotes } = await supabase
    .from("lesson_notes")
    .select("id, lesson_date, notes_text, notion_url")
    .eq("student_id", id)
    .order("lesson_date", { ascending: false });

  const noteBeingEdited = editDate
    ? (lessonNotes ?? []).find((n) => n.lesson_date === editDate)
    : null;
  const todayIso = new Date().toISOString().slice(0, 10);

  const { data: attempts } = await supabase
    .from("attempts")
    .select(
      "id, is_correct, attempted_at, card:cards(id, content, deck:decks(id, title))"
    )
    .eq("student_id", id)
    .order("attempted_at", { ascending: false })
    .returns<AttemptRow[]>();

  const all = attempts ?? [];
  const totalCount = all.length;
  const correctCount = all.filter((a) => a.is_correct).length;
  const overallPct = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  // Per-deck breakdown
  const deckStats = new Map<string, { title: string; total: number; correct: number }>();
  for (const a of all) {
    const deck = a.card?.deck;
    if (!deck) continue;
    const entry = deckStats.get(deck.id) ?? { title: deck.title, total: 0, correct: 0 };
    entry.total += 1;
    if (a.is_correct) entry.correct += 1;
    deckStats.set(deck.id, entry);
  }

  // Weak spots: cards with the most incorrect answers, worst accuracy first
  const cardStats = new Map<
    string,
    { label: string; total: number; correct: number }
  >();
  for (const a of all) {
    if (!a.card) continue;
    const entry =
      cardStats.get(a.card.id) ??
      { label: cardLabel(a.card.content), total: 0, correct: 0 };
    entry.total += 1;
    if (a.is_correct) entry.correct += 1;
    cardStats.set(a.card.id, entry);
  }
  const weakSpots = Array.from(cardStats.values())
    .filter((c) => c.correct < c.total)
    .sort((a, b) => a.correct / a.total - b.correct / b.total)
    .slice(0, 10);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">
          {student.full_name || student.email}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">{student.email}</p>
      </div>

      <form
        action={setStudentAssignmentsWithId}
        className="flex flex-col gap-4 rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]"
      >
        <h2 className="font-medium">Assigned content</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Check everything this student should have access to, then save.
          Items already shared with everyone are checked and locked — no
          need to assign those individually.
        </p>

        {decks && decks.length > 0 && (
          <div>
            <h3 className="mb-1 text-sm font-medium text-zinc-500">Decks</h3>
            <div className="flex flex-col gap-1">
              {decks.map((deck) => {
                const status = deckStatus.get(deck.id);
                return (
                  <label key={deck.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="decks"
                      value={deck.id}
                      defaultChecked={status?.assigned || status?.everyone}
                      disabled={status?.everyone}
                    />
                    {deck.title}
                    {status?.everyone && (
                      <span className="text-xs text-zinc-400">(everyone)</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {listeningExercises && listeningExercises.length > 0 && (
          <div>
            <h3 className="mb-1 text-sm font-medium text-zinc-500">
              Listening Exercises
            </h3>
            <div className="flex flex-col gap-1">
              {listeningExercises.map((exercise) => {
                const status = listeningStatus.get(exercise.id);
                return (
                  <label key={exercise.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="listening"
                      value={exercise.id}
                      defaultChecked={status?.assigned || status?.everyone}
                      disabled={status?.everyone}
                    />
                    {exercise.title}
                    {status?.everyone && (
                      <span className="text-xs text-zinc-400">(everyone)</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {verbDrills && verbDrills.length > 0 && (
          <div>
            <h3 className="mb-1 text-sm font-medium text-zinc-500">Verb Drills</h3>
            <div className="flex flex-col gap-1">
              {verbDrills.map((drill) => {
                const status = verbStatus.get(drill.id);
                return (
                  <label key={drill.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="verbs"
                      value={drill.id}
                      defaultChecked={status?.assigned || status?.everyone}
                      disabled={status?.everyone}
                    />
                    <span dir="auto">
                      {drill.infinitive} — {drill.translation}
                    </span>
                    {status?.everyone && (
                      <span className="text-xs text-zinc-400">(everyone)</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {fillBlankDrills && fillBlankDrills.length > 0 && (
          <div>
            <h3 className="mb-1 text-sm font-medium text-zinc-500">
              Fill in the Blanks
            </h3>
            <div className="flex flex-col gap-1">
              {fillBlankDrills.map((drill) => {
                const status = fillBlankStatus.get(drill.id);
                return (
                  <label key={drill.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="fillblanks"
                      value={drill.id}
                      defaultChecked={status?.assigned || status?.everyone}
                      disabled={status?.everyone}
                    />
                    {drill.title}
                    {status?.everyone && (
                      <span className="text-xs text-zinc-400">(everyone)</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {!decks?.length &&
          !listeningExercises?.length &&
          !verbDrills?.length &&
          !fillBlankDrills?.length && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Nothing created yet — build a deck, listening exercise, verb
              drill, or fill-in-the-blank drill first.
            </p>
          )}

        <button
          type="submit"
          className="self-start rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Save assignments
        </button>
      </form>

      <form
        action={saveLessonNoteWithId}
        className="flex flex-col gap-3 rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]"
      >
        <h2 className="font-medium">
          {noteBeingEdited ? "Edit lesson note" : "Add a lesson note"}
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          One note per day — the student&apos;s wall groups everything
          assigned that day under this note. Paste a Notion link only if
          that page is shared publicly (&quot;Share to web&quot;), otherwise
          the student won&apos;t be able to open it.
        </p>
        <label className="text-sm text-zinc-600 dark:text-zinc-400">
          Date
          <input
            type="date"
            name="lesson_date"
            defaultValue={noteBeingEdited?.lesson_date ?? todayIso}
            required
            className="mt-1 block rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
          />
        </label>
        <textarea
          name="notes_text"
          defaultValue={noteBeingEdited?.notes_text ?? ""}
          placeholder="Notes for this lesson (optional)"
          rows={4}
          dir="auto"
          className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
        />
        <input
          name="notion_url"
          defaultValue={noteBeingEdited?.notion_url ?? ""}
          placeholder="Notion page link (optional)"
          className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
        />
        <button
          type="submit"
          className="self-start rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          {noteBeingEdited ? "Save changes" : "Add note"}
        </button>
      </form>

      {lessonNotes && lessonNotes.length > 0 && (
        <div className="flex flex-col gap-2">
          {lessonNotes.map((note) => {
            const deleteLessonNoteWithIds = deleteLessonNote.bind(null, note.id, id);
            return (
              <div
                key={note.id}
                className="flex items-start justify-between gap-4 rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]"
              >
                <div>
                  <div className="text-xs font-medium uppercase text-zinc-500">
                    {new Date(note.lesson_date).toLocaleDateString()}
                  </div>
                  {note.notes_text && (
                    <p dir="auto" className="whitespace-pre-wrap text-sm">
                      {note.notes_text}
                    </p>
                  )}
                  {note.notion_url && (
                    <a
                      href={note.notion_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Notion link
                    </a>
                  )}
                </div>
                <div className="flex shrink-0 gap-3">
                  <a
                    href={`?edit_date=${note.lesson_date}`}
                    className="text-sm text-zinc-500 hover:underline"
                  >
                    Edit
                  </a>
                  <form action={deleteLessonNoteWithIds}>
                    <button
                      type="submit"
                      className="text-sm text-red-600 hover:underline dark:text-red-400"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]">
        <h2 className="mb-2 font-medium">Overall</h2>
        {totalCount > 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">
            {correctCount} / {totalCount} correct ({overallPct}%)
          </p>
        ) : (
          <p className="text-zinc-600 dark:text-zinc-400">
            No activity yet — nothing practiced.
          </p>
        )}
      </div>

      {deckStats.size > 0 && (
        <div className="rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]">
          <h2 className="mb-2 font-medium">By deck</h2>
          <ul className="flex flex-col gap-1">
            {Array.from(deckStats.values()).map((d) => (
              <li key={d.title} className="text-sm text-zinc-600 dark:text-zinc-400">
                {d.title}: {d.correct} / {d.total} correct (
                {Math.round((d.correct / d.total) * 100)}%)
              </li>
            ))}
          </ul>
        </div>
      )}

      {weakSpots.length > 0 && (
        <div className="rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]">
          <h2 className="mb-2 font-medium">Weak spots</h2>
          <ul className="flex flex-col gap-1">
            {weakSpots.map((w, i) => (
              <li key={i} dir="auto" className="text-sm text-zinc-600 dark:text-zinc-400">
                {w.label} — {w.correct} / {w.total} correct
              </li>
            ))}
          </ul>
        </div>
      )}

      {all.length > 0 && (
        <div className="rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]">
          <h2 className="mb-2 font-medium">Recent activity</h2>
          <ul className="flex flex-col gap-1">
            {all.slice(0, 20).map((a) => (
              <li
                key={a.id}
                dir="auto"
                className="flex items-center justify-between gap-4 text-sm text-zinc-600 dark:text-zinc-400"
              >
                <span>
                  {cardLabel(a.card?.content)}
                  {a.card?.deck ? ` (${a.card.deck.title})` : ""}
                </span>
                <span className={a.is_correct ? "text-green-600" : "text-red-600"}>
                  {a.is_correct ? "Correct" : "Incorrect"} ·{" "}
                  {new Date(a.attempted_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
