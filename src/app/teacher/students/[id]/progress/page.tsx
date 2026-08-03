import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createDeckForStudent,
  createFillBlankDrillForStudent,
  createListeningExerciseForStudent,
  deleteLessonNote,
  saveLessonNote,
  setStudentAssignments,
} from "../actions";
import { assignCourseToStudent } from "@/app/teacher/courses/actions";
import { disambiguateLabels } from "@/lib/disambiguate";
import { groupByLanguage } from "@/lib/language";
import { CreateStudentContentForm } from "@/components/create-student-content-form";

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
    .select("id, title, language")
    .order("title", { ascending: true })
    .order("id", { ascending: true });
  const { data: listeningExercises } = await supabase
    .from("listening_exercises")
    .select("id, title")
    .order("title", { ascending: true })
    .order("id", { ascending: true });
  const { data: verbDrills } = await supabase
    .from("verb_drills")
    .select("id, infinitive, translation, language")
    .order("infinitive", { ascending: true })
    .order("id", { ascending: true });
  const { data: fillBlankDrills } = await supabase
    .from("fill_blank_drills")
    .select("id, title, language")
    .order("title", { ascending: true })
    .order("id", { ascending: true });

  const deckGroups = groupByLanguage(decks ?? []);
  const verbGroups = groupByLanguage(verbDrills ?? []);
  const fillBlankGroups = groupByLanguage(fillBlankDrills ?? []);

  const deckLabels = disambiguateLabels(decks ?? [], (d) => d.title);
  const listeningLabels = disambiguateLabels(listeningExercises ?? [], (e) => e.title);
  const verbLabels = disambiguateLabels(
    verbDrills ?? [],
    (v) => `${v.infinitive} — ${v.translation}`
  );
  const fillBlankLabels = disambiguateLabels(fillBlankDrills ?? [], (d) => d.title);

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
  const { data: exclusions } = await supabase
    .from("assignment_exclusions")
    .select("item_type, item_id")
    .eq("student_id", id);

  const excludedIds = (itemType: string) =>
    new Set((exclusions ?? []).filter((e) => e.item_type === itemType).map((e) => e.item_id));
  const excludedDeckIds = excludedIds("deck");
  const excludedListeningIds = excludedIds("listening");
  const excludedVerbIds = excludedIds("verb");
  const excludedFillBlankIds = excludedIds("fillblank");

  const deckStatus = new Map(
    (decks ?? []).map((d) => {
      const rows = (deckAssignments ?? []).filter((a) => a.deck_id === d.id);
      const everyone = rows.some((r) => r.student_id === null);
      const individuallyAssigned = rows.some((r) => r.student_id === id);
      return [
        d.id,
        { everyone, assigned: individuallyAssigned || (everyone && !excludedDeckIds.has(d.id)) },
      ] as const;
    })
  );
  const listeningStatus = new Map(
    (listeningExercises ?? []).map((e) => {
      const rows = (listeningAssignments ?? []).filter((a) => a.exercise_id === e.id);
      const everyone = rows.some((r) => r.student_id === null);
      const individuallyAssigned = rows.some((r) => r.student_id === id);
      return [
        e.id,
        {
          everyone,
          assigned: individuallyAssigned || (everyone && !excludedListeningIds.has(e.id)),
        },
      ] as const;
    })
  );
  const verbStatus = new Map(
    (verbDrills ?? []).map((v) => {
      const rows = (verbAssignments ?? []).filter((a) => a.drill_id === v.id);
      const everyone = rows.some((r) => r.student_id === null);
      const individuallyAssigned = rows.some((r) => r.student_id === id);
      return [
        v.id,
        { everyone, assigned: individuallyAssigned || (everyone && !excludedVerbIds.has(v.id)) },
      ] as const;
    })
  );
  const fillBlankStatus = new Map(
    (fillBlankDrills ?? []).map((d) => {
      const rows = (fillBlankAssignments ?? []).filter((a) => a.drill_id === d.id);
      const everyone = rows.some((r) => r.student_id === null);
      const individuallyAssigned = rows.some((r) => r.student_id === id);
      return [
        d.id,
        {
          everyone,
          assigned: individuallyAssigned || (everyone && !excludedFillBlankIds.has(d.id)),
        },
      ] as const;
    })
  );

  const setStudentAssignmentsWithId = setStudentAssignments.bind(null, id);
  const saveLessonNoteWithId = saveLessonNote.bind(null, id);
  const createDeckForStudentWithId = createDeckForStudent.bind(null, id);
  const createFillBlankDrillForStudentWithId = createFillBlankDrillForStudent.bind(
    null,
    id
  );
  const createListeningExerciseForStudentWithId = createListeningExerciseForStudent.bind(
    null,
    id
  );

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, description")
    .order("title", { ascending: true });

  const { data: lessonNotes } = await supabase
    .from("lesson_notes")
    .select("id, lesson_date, title, notes_text, notion_url")
    .eq("student_id", id)
    .order("lesson_date", { ascending: false });

  const noteBeingEdited = editDate
    ? (lessonNotes ?? []).find((n) => n.lesson_date === editDate)
    : null;
  const todayIso = new Date().toISOString().slice(0, 10);

  // Individually-assigned content (not "everyone" items, which aren't tied
  // to any particular lesson) grouped by the day it was assigned, to build
  // a per-lesson breakdown of what was given each session.
  const dateKey = (iso: string) => iso.slice(0, 10);

  const { data: deckAssignmentsForLessons } = await supabase
    .from("assignments")
    .select("assigned_at, deck:decks(id, title)")
    .eq("student_id", id);
  const { data: listeningAssignmentsForLessons } = await supabase
    .from("listening_assignments")
    .select("assigned_at, exercise:listening_exercises(id, title)")
    .eq("student_id", id);
  const { data: verbAssignmentsForLessons } = await supabase
    .from("verb_drill_assignments")
    .select("assigned_at, drill:verb_drills(id, infinitive, translation)")
    .eq("student_id", id);
  const { data: fillBlankAssignmentsForLessons } = await supabase
    .from("fill_blank_assignments")
    .select("assigned_at, drill:fill_blank_drills(id, title)")
    .eq("student_id", id);

  type LessonTask = { label: string; typeLabel: string };
  type LessonNoteRow = {
    id: string;
    lesson_date: string;
    title: string | null;
    notes_text: string | null;
    notion_url: string | null;
  };
  type LessonCabinetEntry = {
    date: string;
    note: LessonNoteRow | null;
    tasks: LessonTask[];
  };

  const lessonsByDate = new Map<string, LessonCabinetEntry>();
  function getLessonEntry(date: string): LessonCabinetEntry {
    let entry = lessonsByDate.get(date);
    if (!entry) {
      entry = { date, note: null, tasks: [] };
      lessonsByDate.set(date, entry);
    }
    return entry;
  }

  for (const a of deckAssignmentsForLessons ?? []) {
    const deck = a.deck as unknown as { id: string; title: string } | null;
    if (!deck) continue;
    getLessonEntry(dateKey(a.assigned_at)).tasks.push({
      label: deck.title,
      typeLabel: "Deck",
    });
  }
  for (const a of listeningAssignmentsForLessons ?? []) {
    const exercise = a.exercise as unknown as { id: string; title: string } | null;
    if (!exercise) continue;
    getLessonEntry(dateKey(a.assigned_at)).tasks.push({
      label: exercise.title,
      typeLabel: "Listening",
    });
  }
  for (const a of verbAssignmentsForLessons ?? []) {
    const drill = a.drill as unknown as {
      id: string;
      infinitive: string;
      translation: string;
    } | null;
    if (!drill) continue;
    getLessonEntry(dateKey(a.assigned_at)).tasks.push({
      label: `${drill.infinitive} — ${drill.translation}`,
      typeLabel: "Verb Drill",
    });
  }
  for (const a of fillBlankAssignmentsForLessons ?? []) {
    const drill = a.drill as unknown as { id: string; title: string } | null;
    if (!drill) continue;
    getLessonEntry(dateKey(a.assigned_at)).tasks.push({
      label: drill.title,
      typeLabel: "Fill in the Blanks",
    });
  }
  for (const note of lessonNotes ?? []) {
    getLessonEntry(note.lesson_date).note = note;
  }

  const lessonCabinet = Array.from(lessonsByDate.values()).sort((a, b) =>
    a.date < b.date ? 1 : -1
  );

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
        <h1 className="text-2xl">
          {student.full_name || student.email}
        </h1>
        <p className="text-text-muted">{student.email}</p>
      </div>

      <CreateStudentContentForm
        createDeckAction={createDeckForStudentWithId}
        createFillBlankAction={createFillBlankDrillForStudentWithId}
        createListeningAction={createListeningExerciseForStudentWithId}
      />

      <form
        action={setStudentAssignmentsWithId}
        className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4"
      >
        <h2 className="font-heading font-bold">Assigned content</h2>
        <p className="text-sm text-text-muted">
          Check everything this student should have access to, then save.
          Items shared with everyone are checked by default — uncheck one to
          remove it for just this student, without affecting anyone else.
        </p>

        {decks && decks.length > 0 && (
          <div>
            <h3 className="mb-1 text-sm font-semibold text-text-faint">Decks</h3>
            <div className="flex flex-col gap-3">
              {deckGroups.map((group) => (
                <div key={group.key}>
                  <h4 className="mb-1 text-xs font-semibold text-text-faint">
                    {group.label}
                  </h4>
                  <div className="flex flex-col gap-1">
                    {group.items.map((deck) => {
                      const status = deckStatus.get(deck.id);
                      return (
                        <label key={deck.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            name="decks"
                            value={deck.id}
                            defaultChecked={status?.assigned}
                          />
                          <span dir="auto">{deckLabels.get(deck.id)}</span>
                          {status?.everyone && (
                            <span className="text-xs text-text-faint">(everyone)</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {listeningExercises && listeningExercises.length > 0 && (
          <div>
            <h3 className="mb-1 text-sm font-semibold text-text-faint">
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
                      defaultChecked={status?.assigned}
                    />
                    <span dir="auto">{listeningLabels.get(exercise.id)}</span>
                    {status?.everyone && (
                      <span className="text-xs text-text-faint">(everyone)</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {verbDrills && verbDrills.length > 0 && (
          <div>
            <h3 className="mb-1 text-sm font-semibold text-text-faint">Verb Drills</h3>
            <div className="flex flex-col gap-3">
              {verbGroups.map((group) => (
                <div key={group.key}>
                  <h4 className="mb-1 text-xs font-semibold text-text-faint">
                    {group.label}
                  </h4>
                  <div className="flex flex-col gap-1">
                    {group.items.map((drill) => {
                      const status = verbStatus.get(drill.id);
                      return (
                        <label key={drill.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            name="verbs"
                            value={drill.id}
                            defaultChecked={status?.assigned}
                          />
                          <span dir="auto">{verbLabels.get(drill.id)}</span>
                          {status?.everyone && (
                            <span className="text-xs text-text-faint">(everyone)</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {fillBlankDrills && fillBlankDrills.length > 0 && (
          <div>
            <h3 className="mb-1 text-sm font-semibold text-text-faint">
              Fill in the Blanks
            </h3>
            <div className="flex flex-col gap-3">
              {fillBlankGroups.map((group) => (
                <div key={group.key}>
                  <h4 className="mb-1 text-xs font-semibold text-text-faint">
                    {group.label}
                  </h4>
                  <div className="flex flex-col gap-1">
                    {group.items.map((drill) => {
                      const status = fillBlankStatus.get(drill.id);
                      return (
                        <label key={drill.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            name="fillblanks"
                            value={drill.id}
                            defaultChecked={status?.assigned}
                          />
                          <span dir="auto">{fillBlankLabels.get(drill.id)}</span>
                          {status?.everyone && (
                            <span className="text-xs text-text-faint">(everyone)</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!decks?.length &&
          !listeningExercises?.length &&
          !verbDrills?.length &&
          !fillBlankDrills?.length && (
            <p className="text-sm text-text-muted">
              Nothing created yet — build a deck, listening exercise, verb
              drill, or fill-in-the-blank drill first.
            </p>
          )}

        <button
          type="submit"
          className="self-start rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent-hover"
        >
          Save assignments
        </button>
      </form>

      {courses && courses.length > 0 && (
        <div className="flex flex-col gap-2 rounded-md border border-border bg-surface p-4">
          <h2 className="font-heading font-bold">Assign a course</h2>
          <p className="text-sm text-text-muted">
            Instantly assigns everything bundled in that course to this
            student.
          </p>
          {courses.map((course) => {
            const assignCourseWithIds = assignCourseToStudent.bind(null, course.id, id);
            return (
              <form
                key={course.id}
                action={assignCourseWithIds}
                className="flex items-center justify-between gap-4 border-t border-border pt-2"
              >
                <div>
                  <div className="font-medium">{course.title}</div>
                  {course.description && (
                    <div className="text-sm text-text-muted">
                      {course.description}
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className="shrink-0 rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent-hover"
                >
                  Assign
                </button>
              </form>
            );
          })}
        </div>
      )}

      <form
        action={saveLessonNoteWithId}
        className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4"
      >
        <h2 className="font-heading font-bold">
          {noteBeingEdited ? "Edit lesson" : "Add a lesson"}
        </h2>
        <p className="text-sm text-text-muted">
          One entry per day — everything assigned that day (from the
          checklist above or the &quot;create new content&quot; section)
          automatically groups under it below. Paste a Notion link only if
          that page is shared publicly (&quot;Share to web&quot;), otherwise
          the student won&apos;t be able to open it.
        </p>
        <div className="flex gap-3">
          <label className="text-sm text-text-muted">
            Date
            <input
              type="date"
              name="lesson_date"
              defaultValue={noteBeingEdited?.lesson_date ?? todayIso}
              required
              className="mt-1 block rounded-sm border border-border bg-surface px-3 py-2 text-text"
            />
          </label>
          <label className="flex-1 text-sm text-text-muted">
            Title
            <input
              name="title"
              defaultValue={noteBeingEdited?.title ?? ""}
              placeholder="e.g. Lesson 3"
              className="mt-1 block w-full rounded-sm border border-border bg-surface px-3 py-2 text-text"
            />
          </label>
        </div>
        <textarea
          name="notes_text"
          defaultValue={noteBeingEdited?.notes_text ?? ""}
          placeholder="Notes for this lesson (optional)"
          rows={4}
          dir="auto"
          className="rounded-sm border border-border bg-surface px-3 py-2 text-text"
        />
        <input
          name="notion_url"
          defaultValue={noteBeingEdited?.notion_url ?? ""}
          placeholder="Notion page link (optional)"
          className="rounded-sm border border-border bg-surface px-3 py-2 text-text"
        />
        <button
          type="submit"
          className="self-start rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent-hover"
        >
          {noteBeingEdited ? "Save changes" : "Add lesson"}
        </button>
      </form>

      {lessonCabinet.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="font-heading font-bold">Lessons</h2>
          {lessonCabinet.map((lesson) => {
            const tasksByType = new Map<string, LessonTask[]>();
            for (const task of lesson.tasks) {
              const list = tasksByType.get(task.typeLabel) ?? [];
              list.push(task);
              tasksByType.set(task.typeLabel, list);
            }

            return (
              <div
                key={lesson.date}
                className="flex flex-col gap-2 rounded-md border border-border bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase text-text-faint">
                      {new Date(lesson.date).toLocaleDateString()}
                    </div>
                    <div className="font-heading font-bold">
                      {lesson.note?.title || "Untitled lesson"}
                    </div>
                  </div>
                  {lesson.note && (
                    <div className="flex shrink-0 gap-3">
                      <a
                        href={`?edit_date=${lesson.note.lesson_date}`}
                        className="text-sm text-text-faint hover:underline"
                      >
                        Edit
                      </a>
                      <form action={deleteLessonNote.bind(null, lesson.note.id, id)}>
                        <button
                          type="submit"
                          className="text-sm text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                {lesson.note?.notes_text && (
                  <p dir="auto" className="whitespace-pre-wrap text-sm">
                    {lesson.note.notes_text}
                  </p>
                )}
                {lesson.note?.notion_url && (
                  <a
                    href={lesson.note.notion_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-accent-2 hover:underline"
                  >
                    Notion link
                  </a>
                )}

                {tasksByType.size > 0 ? (
                  <div className="flex flex-col gap-2 border-t border-border pt-2">
                    {Array.from(tasksByType.entries()).map(([typeLabel, tasks]) => (
                      <div key={typeLabel}>
                        <div className="text-xs font-semibold text-text-faint">
                          {typeLabel}
                        </div>
                        <ul className="text-sm">
                          {tasks.map((task, i) => (
                            <li key={i} dir="auto">
                              {task.label}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-faint">
                    Nothing individually assigned this day.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-md border border-border bg-surface p-4">
        <h2 className="mb-2 font-heading font-bold">Overall</h2>
        {totalCount > 0 ? (
          <p className="text-text-muted">
            {correctCount} / {totalCount} correct ({overallPct}%)
          </p>
        ) : (
          <p className="text-text-muted">
            No activity yet — nothing practiced.
          </p>
        )}
      </div>

      {deckStats.size > 0 && (
        <div className="rounded-md border border-border bg-surface p-4">
          <h2 className="mb-2 font-heading font-bold">By deck</h2>
          <ul className="flex flex-col gap-1">
            {Array.from(deckStats.values()).map((d) => (
              <li key={d.title} className="text-sm text-text-muted">
                {d.title}: {d.correct} / {d.total} correct (
                {Math.round((d.correct / d.total) * 100)}%)
              </li>
            ))}
          </ul>
        </div>
      )}

      {weakSpots.length > 0 && (
        <div className="rounded-md border border-border bg-surface p-4">
          <h2 className="mb-2 font-heading font-bold">Weak spots</h2>
          <ul className="flex flex-col gap-1">
            {weakSpots.map((w, i) => (
              <li key={i} dir="auto" className="text-sm text-text-muted">
                {w.label} — {w.correct} / {w.total} correct
              </li>
            ))}
          </ul>
        </div>
      )}

      {all.length > 0 && (
        <div className="rounded-md border border-border bg-surface p-4">
          <h2 className="mb-2 font-heading font-bold">Recent activity</h2>
          <ul className="flex flex-col gap-1">
            {all.slice(0, 20).map((a) => (
              <li
                key={a.id}
                dir="auto"
                className="flex items-center justify-between gap-4 text-sm text-text-muted"
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
