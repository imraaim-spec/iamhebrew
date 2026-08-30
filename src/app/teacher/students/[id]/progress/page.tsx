import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  assignItemToStudent,
  createDeckForStudent,
  createFillBlankDrillForStudent,
  createListeningExerciseForStudent,
  deleteLessonNote,
  saveLessonNote,
  setStudentLanguage,
  unassignItemFromStudent,
} from "../actions";
import { assignCourseToStudent } from "@/app/teacher/courses/actions";
import { disambiguateLabels } from "@/lib/disambiguate";
import { LANGUAGE_LABELS } from "@/lib/language";
import { MATURE_INTERVAL_DAYS } from "@/lib/srs";
import { CreateStudentContentForm } from "@/components/create-student-content-form";
import { StudentProfileHeader } from "@/components/student-profile-header";
import { AccuracyDonut } from "@/components/accuracy-donut";
import { RecentActivity } from "@/components/recent-activity";
import { AddAssignmentForm } from "@/components/add-assignment-form";

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
    .select("id, email, full_name, language")
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
    .select("id, title, language")
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

  const assignDeckToStudent = assignItemToStudent.bind(null, id, "deck");
  const assignListeningToStudent = assignItemToStudent.bind(null, id, "listening");
  const assignVerbToStudent = assignItemToStudent.bind(null, id, "verb");
  const assignFillBlankToStudent = assignItemToStudent.bind(null, id, "fillblank");
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

  type LessonTask = {
    label: string;
    typeLabel: string;
    href: string;
    itemType: "deck" | "listening" | "verb" | "fillblank";
    itemId: string;
  };
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
      href: `/teacher/decks/${deck.id}/study`,
      itemType: "deck",
      itemId: deck.id,
    });
  }
  for (const a of listeningAssignmentsForLessons ?? []) {
    const exercise = a.exercise as unknown as { id: string; title: string } | null;
    if (!exercise) continue;
    getLessonEntry(dateKey(a.assigned_at)).tasks.push({
      label: exercise.title,
      typeLabel: "Listening",
      href: `/teacher/listening/${exercise.id}/study`,
      itemType: "listening",
      itemId: exercise.id,
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
      href: `/teacher/verbs/${drill.id}/study`,
      itemType: "verb",
      itemId: drill.id,
    });
  }
  for (const a of fillBlankAssignmentsForLessons ?? []) {
    const drill = a.drill as unknown as { id: string; title: string } | null;
    if (!drill) continue;
    getLessonEntry(dateKey(a.assigned_at)).tasks.push({
      label: drill.title,
      typeLabel: "Fill in the Blanks",
      href: `/teacher/fill-blanks/${drill.id}/study`,
      itemType: "fillblank",
      itemId: drill.id,
    });
  }
  for (const note of lessonNotes ?? []) {
    getLessonEntry(note.lesson_date).note = note;
  }

  const lessonCabinet = Array.from(lessonsByDate.values()).sort((a, b) =>
    a.date < b.date ? 1 : -1
  );

  // Language is a property of the student, not something to pick per
  // assignment: only hide content tagged as a *different* language.
  // Untagged content stays visible since most older material has no tag.
  const languageFits = (itemLanguage: string | null) =>
    !student.language || !itemLanguage || itemLanguage === student.language;

  const ASSIGNED_SECTIONS = [
    {
      type: "deck" as const,
      title: "Flash cards",
      items: decks ?? [],
      status: deckStatus,
      labels: deckLabels,
      hrefFor: (itemId: string) => `/teacher/decks/${itemId}/study`,
    },
    {
      type: "listening" as const,
      title: "Listening exercises",
      items: listeningExercises ?? [],
      status: listeningStatus,
      labels: listeningLabels,
      hrefFor: (itemId: string) => `/teacher/listening/${itemId}/study`,
    },
    {
      type: "verb" as const,
      title: "Verb drills",
      items: verbDrills ?? [],
      status: verbStatus,
      labels: verbLabels,
      hrefFor: (itemId: string) => `/teacher/verbs/${itemId}/study`,
    },
    {
      type: "fillblank" as const,
      title: "Fill in the blanks",
      items: fillBlankDrills ?? [],
      status: fillBlankStatus,
      labels: fillBlankLabels,
      hrefFor: (itemId: string) => `/teacher/fill-blanks/${itemId}/study`,
    },
  ];

  function assignableOptions(type: (typeof ASSIGNED_SECTIONS)[number]["type"]) {
    const section = ASSIGNED_SECTIONS.find((s) => s.type === type)!;
    return section.items
      .filter(
        (item) =>
          !section.status.get(item.id)?.assigned &&
          languageFits((item as { language: string | null }).language)
      )
      .map((item) => ({
        id: item.id,
        label: section.labels.get(item.id) ?? item.id,
      }));
  }

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

  // Per-deck breakdown: review counts and accuracy from the attempt log,
  // plus where each deck stands in the spaced-repetition schedule.
  type DeckStat = {
    title: string;
    total: number;
    correct: number;
    lastStudied: string | null;
    started: number;
    mature: number;
    dueToday: number;
  };
  const deckStats = new Map<string, DeckStat>();
  function deckStat(deckId: string, title: string): DeckStat {
    const entry = deckStats.get(deckId) ?? {
      title,
      total: 0,
      correct: 0,
      lastStudied: null,
      started: 0,
      mature: 0,
      dueToday: 0,
    };
    deckStats.set(deckId, entry);
    return entry;
  }

  for (const a of all) {
    const deck = a.card?.deck;
    if (!deck) continue;
    const entry = deckStat(deck.id, deck.title);
    entry.total += 1;
    if (a.is_correct) entry.correct += 1;
    // Attempts come back newest-first, so the first one seen per deck wins.
    if (!entry.lastStudied) entry.lastStudied = a.attempted_at;
  }

  const { data: cardSchedules } = await supabase
    .from("card_schedules")
    .select("interval_days, due_on, card:cards(id, deck:decks(id, title))")
    .eq("student_id", id)
    .returns<
      {
        interval_days: number;
        due_on: string;
        card: { id: string; deck: { id: string; title: string } | null } | null;
      }[]
    >();

  const todayForDue = todayIso;
  for (const s of cardSchedules ?? []) {
    const deck = s.card?.deck;
    if (!deck) continue;
    const entry = deckStat(deck.id, deck.title);
    entry.started += 1;
    if (s.interval_days >= MATURE_INTERVAL_DAYS) entry.mature += 1;
    if (s.due_on <= todayForDue) entry.dueToday += 1;
  }

  const deckCardCounts = new Map<string, number>();
  const { data: deckCardRows } = await supabase.from("cards").select("deck_id").eq("type", "flashcard");
  for (const row of deckCardRows ?? []) {
    deckCardCounts.set(row.deck_id, (deckCardCounts.get(row.deck_id) ?? 0) + 1);
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

  const countAssigned = (statuses: Map<string, { assigned: boolean }>) =>
    Array.from(statuses.values()).filter((s) => s.assigned).length;
  const activeDrillCount =
    countAssigned(deckStatus) +
    countAssigned(listeningStatus) +
    countAssigned(verbStatus) +
    countAssigned(fillBlankStatus);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <StudentProfileHeader
        fullName={student.full_name}
        email={student.email}
        lessonCount={lessonCabinet.length}
        accuracyPct={totalCount > 0 ? overallPct : null}
        activeDrillCount={activeDrillCount}
      >
        <form
          action={setStudentLanguage.bind(null, id)}
          className="flex items-center gap-2"
        >
          <label className="text-sm text-text-muted">
            Studies in
            <select
              key={student.language ?? "none"}
              name="language"
              defaultValue={student.language ?? ""}
              className="ml-2 rounded-sm border border-border bg-surface px-2 py-1.5 text-sm text-text"
            >
              <option value="">Not set</option>
              {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-sm border border-border px-3 py-1.5 text-sm text-text-muted hover:bg-bg-alt"
          >
            Save
          </button>
        </form>
      </StudentProfileHeader>

      <CreateStudentContentForm
        key={student.language ?? "none"}
        createDeckAction={createDeckForStudentWithId}
        createFillBlankAction={createFillBlankDrillForStudentWithId}
        createListeningAction={createListeningExerciseForStudentWithId}
        defaultLanguage={student.language}
      />

      <div className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4">
        <h2 className="font-heading font-bold">Assigned content</h2>

        {(() => {
          const everyoneRows = ASSIGNED_SECTIONS.flatMap((section) =>
            section.items
              .filter((i) => section.status.get(i.id)?.everyone)
              .map((item) => ({ section, item }))
          );
          if (everyoneRows.length === 0) return null;
          return (
            <div className="flex flex-col gap-1 border-t border-border pt-3">
              <h3 className="text-sm font-semibold text-text-faint">
                Shared with everyone
              </h3>
              <ul className="flex flex-col gap-1">
                {everyoneRows.map(({ section, item }) => (
                  <li
                    key={`${section.type}-${item.id}`}
                    className="flex items-baseline justify-between gap-3 text-sm"
                  >
                    <Link
                      href={section.hrefFor(item.id)}
                      dir="auto"
                      className="text-accent-2 hover:underline"
                    >
                      {section.labels.get(item.id)}
                    </Link>
                    <form
                      action={unassignItemFromStudent.bind(null, id, section.type, item.id)}
                    >
                      <button type="submit" className="text-xs text-red-600 hover:underline">
                        Remove for this student
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          );
        })()}

        <div className="border-t border-border pt-3">
          <AddAssignmentForm
            actions={{
              deck: assignDeckToStudent,
              listening: assignListeningToStudent,
              verb: assignVerbToStudent,
              fillblank: assignFillBlankToStudent,
            }}
            options={{
              deck: assignableOptions("deck"),
              listening: assignableOptions("listening"),
              verb: assignableOptions("verb"),
              fillblank: assignableOptions("fillblank"),
            }}
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-3">
          <h3 className="text-sm font-semibold text-text-faint">By lesson</h3>
          {lessonCabinet.length > 0 ? (
            lessonCabinet.map((lesson) => {
              const tasksByType = new Map<string, LessonTask[]>();
              for (const task of lesson.tasks) {
                const list = tasksByType.get(task.typeLabel) ?? [];
                list.push(task);
                tasksByType.set(task.typeLabel, list);
              }

              return (
                <div
                  key={lesson.date}
                  className="flex flex-col gap-2 rounded-md border border-border p-4"
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
                          <ul className="flex flex-col gap-1 text-sm">
                            {tasks.map((task, i) => (
                              <li
                                key={i}
                                dir="auto"
                                className="flex items-baseline justify-between gap-3"
                              >
                                <Link
                                  href={task.href}
                                  className="text-accent-2 hover:underline"
                                >
                                  {task.label}
                                </Link>
                                <form
                                  action={unassignItemFromStudent.bind(
                                    null,
                                    id,
                                    task.itemType,
                                    task.itemId
                                  )}
                                >
                                  <button
                                    type="submit"
                                    className="text-xs text-red-600 hover:underline"
                                  >
                                    Remove
                                  </button>
                                </form>
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
            })
          ) : (
            <p className="text-sm text-text-muted">
              Nothing assigned to a specific lesson yet.
            </p>
          )}
        </div>
      </div>

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
          One entry per day — everything assigned that day (from &quot;Add
          more&quot; above or the &quot;create new content&quot; section)
          automatically groups under it in &quot;Assigned content&quot;
          above. Paste a Notion link only if that page is shared publicly
          (&quot;Share to web&quot;), otherwise the student won&apos;t be
          able to open it.
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


      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-5">
          <h2 className="mb-3 font-heading text-sm font-bold">Overall</h2>
          <div className="flex items-center gap-4">
            <AccuracyDonut pct={totalCount > 0 ? overallPct : null} />
            <p className="text-[13.5px] text-text-muted">
              {totalCount > 0
                ? `${correctCount} / ${totalCount} correct across all drills`
                : "No activity yet — nothing practised."}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-5">
          <h2 className="mb-3 font-heading text-sm font-bold">Weak spots</h2>
          {weakSpots.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {weakSpots.map((w, i) => (
                <span
                  key={i}
                  dir="auto"
                  className="rounded-full bg-bad-tint px-3 py-1.5 text-[12.5px] font-semibold text-bad"
                  title={`${w.correct} / ${w.total} correct`}
                >
                  {w.label}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[13.5px] text-text-muted">
              Nothing standing out yet.
            </p>
          )}
        </div>
      </div>

      {deckStats.size > 0 && (
        <div className="rounded-md border border-border bg-surface p-4">
          <h2 className="mb-2 font-heading font-bold">By deck</h2>
          <p className="mb-3 text-sm text-text-muted">
            &quot;Learned&quot; means the card&apos;s review gap has stretched
            past {MATURE_INTERVAL_DAYS} days — it&apos;s sticking rather than
            still being drilled.
          </p>
          <ul className="flex flex-col gap-3">
            {Array.from(deckStats.entries()).map(([deckId, d]) => {
              const totalCards = deckCardCounts.get(deckId) ?? 0;
              return (
                <li key={deckId} className="border-t border-border pt-2 text-sm">
                  <div dir="auto" className="font-medium text-text">
                    {d.title}
                  </div>
                  <div className="text-text-muted">
                    {d.total > 0 ? (
                      <>
                        {d.correct} / {d.total} correct (
                        {Math.round((d.correct / d.total) * 100)}%)
                      </>
                    ) : (
                      "Not practised yet"
                    )}
                    {d.lastStudied && (
                      <> · last studied {new Date(d.lastStudied).toLocaleDateString()}</>
                    )}
                  </div>
                  <div className="text-text-faint">
                    {d.started} of {totalCards || d.started} cards started ·{" "}
                    {d.mature} learned · {d.dueToday} due today
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {all.length > 0 && (
        <RecentActivity
          rows={all.slice(0, 30).map((a) => ({
            id: a.id,
            isCorrect: a.is_correct,
            label: cardLabel(a.card?.content),
            deckTitle: a.card?.deck?.title ?? null,
            timeLabel: new Date(a.attempted_at).toLocaleString(undefined, {
              month: "numeric",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            }),
          }))}
        />
      )}
    </div>
  );
}
