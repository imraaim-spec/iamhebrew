import { createClient } from "@/lib/supabase/server";
import { PatternBackdrop } from "@/components/pattern-backdrop";
import {
  StudentWall,
  type WallLesson,
  type WallTask,
} from "@/components/student-wall";
import { initialFor } from "@/lib/content-types";

function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

/**
 * Consecutive days ending today or yesterday on which the student recorded
 * at least one attempt. Yesterday still counts so the streak doesn't look
 * broken first thing in the morning before they've practised.
 */
function computeStreak(dates: Set<string>): number {
  if (dates.size === 0) return 0;
  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  const cursor = new Date(today);
  if (!dates.has(iso(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!dates.has(iso(cursor))) return 0;
  }

  let streak = 0;
  while (dates.has(iso(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export default async function StudentHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single()
    : { data: null };

  // RLS restricts each of these to only what's assigned to the current
  // student (or assigned to everyone) — no manual filtering needed.
  const { data: deckAssignments } = await supabase
    .from("assignments")
    .select("assigned_at, custom_name, deck:decks(id, title)");
  const { data: listeningAssignments } = await supabase
    .from("listening_assignments")
    .select("assigned_at, exercise:listening_exercises(id, title)");
  const { data: verbAssignments } = await supabase
    .from("verb_drill_assignments")
    .select("assigned_at, drill:verb_drills(id, infinitive, translation)");
  const { data: fillBlankAssignments } = await supabase
    .from("fill_blank_assignments")
    .select("assigned_at, drill:fill_blank_drills(id, title)");

  const { data: notes } = user
    ? await supabase
        .from("lesson_notes")
        .select("lesson_date, notes_text, notion_url")
        .eq("student_id", user.id)
    : { data: null };

  // Attempt history, used for practised status, accuracy and the streak.
  const { data: cardAttempts } = user
    ? await supabase
        .from("attempts")
        .select("is_correct, attempted_at, card:cards(deck_id)")
        .eq("student_id", user.id)
    : { data: null };
  const { data: verbAttempts } = user
    ? await supabase
        .from("verb_drill_attempts")
        .select("drill_id")
        .eq("student_id", user.id)
    : { data: null };
  const { data: listeningAttemptRows } = user
    ? await supabase
        .from("listening_attempts")
        .select("exercise_id")
        .eq("student_id", user.id)
    : { data: null };
  const { data: fillAttempts } = user
    ? await supabase
        .from("fill_blank_attempts")
        .select("drill_id")
        .eq("student_id", user.id)
    : { data: null };

  // Per-deck correct/total, so a practised deck can show a real score.
  const deckScores = new Map<string, { correct: number; total: number }>();
  const activeDates = new Set<string>();
  let overallCorrect = 0;
  let overallTotal = 0;

  for (const a of cardAttempts ?? []) {
    const deckId = (a.card as unknown as { deck_id: string } | null)?.deck_id;
    overallTotal += 1;
    if (a.is_correct) overallCorrect += 1;
    if (a.attempted_at) activeDates.add(dateKey(a.attempted_at as string));
    if (!deckId) continue;
    const entry = deckScores.get(deckId) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (a.is_correct) entry.correct += 1;
    deckScores.set(deckId, entry);
  }

  const practisedVerbs = new Set((verbAttempts ?? []).map((r) => r.drill_id));
  const practisedListening = new Set(
    (listeningAttemptRows ?? []).map((r) => r.exercise_id)
  );
  const practisedFill = new Set((fillAttempts ?? []).map((r) => r.drill_id));

  const days = new Map<string, WallLesson>();

  function getDay(date: string): WallLesson {
    let day = days.get(date);
    if (!day) {
      day = {
        date,
        dateLabel: new Date(date).toLocaleDateString(undefined, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        notesText: null,
        notionUrl: null,
        tasks: [],
      };
      days.set(date, day);
    }
    return day;
  }

  function push(date: string, task: WallTask) {
    getDay(dateKey(date)).tasks.push(task);
  }

  for (const a of deckAssignments ?? []) {
    if (!a.deck) continue;
    const deck = a.deck as unknown as { id: string; title: string };
    const score = deckScores.get(deck.id);
    push(a.assigned_at, {
      type: "flashcards",
      id: deck.id,
      title: (a.custom_name as string | null) ?? deck.title,
      href: `/student/decks/${deck.id}/study`,
      practised: !!score,
      scoreLabel: score ? `${score.correct} / ${score.total} correct` : null,
    });
  }
  for (const a of listeningAssignments ?? []) {
    if (!a.exercise) continue;
    const exercise = a.exercise as unknown as { id: string; title: string };
    push(a.assigned_at, {
      type: "listening",
      id: exercise.id,
      title: exercise.title,
      href: `/student/listening/${exercise.id}`,
      practised: practisedListening.has(exercise.id),
      scoreLabel: null,
    });
  }
  for (const a of verbAssignments ?? []) {
    if (!a.drill) continue;
    const drill = a.drill as unknown as {
      id: string;
      infinitive: string;
      translation: string;
    };
    push(a.assigned_at, {
      type: "verbs",
      id: drill.id,
      title: `${drill.infinitive} — ${drill.translation}`,
      href: `/student/verbs/${drill.id}`,
      practised: practisedVerbs.has(drill.id),
      scoreLabel: null,
    });
  }
  for (const a of fillBlankAssignments ?? []) {
    if (!a.drill) continue;
    const drill = a.drill as unknown as { id: string; title: string };
    push(a.assigned_at, {
      type: "fill",
      id: drill.id,
      title: drill.title,
      href: `/student/fill-blanks/${drill.id}`,
      practised: practisedFill.has(drill.id),
      scoreLabel: null,
    });
  }

  for (const note of notes ?? []) {
    const day = getDay(note.lesson_date);
    day.notesText = note.notes_text;
    day.notionUrl = note.notion_url;
  }

  const lessons = Array.from(days.values()).sort((a, b) =>
    a.date < b.date ? 1 : -1
  );

  const email = profile?.email ?? user?.email ?? "";
  const fullName = profile?.full_name ?? null;
  const greetingName = fullName?.trim().split(/\s+/)[0] || email.split("@")[0];

  return (
    <>
      <PatternBackdrop />
      <div className="relative z-10">
        <StudentWall
          greetingName={greetingName}
          initial={initialFor(fullName, email)}
          accuracyPct={
            overallTotal > 0
              ? Math.round((overallCorrect / overallTotal) * 100)
              : null
          }
          streakDays={computeStreak(activeDates)}
          lessons={lessons}
        />
      </div>
    </>
  );
}
