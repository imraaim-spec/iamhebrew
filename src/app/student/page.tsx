import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const TYPE_LABELS: Record<string, string> = {
  deck: "Flashcards",
  listening: "Listening",
  verb: "Verb Drill",
  fillblank: "Fill in the Blanks",
};

type WallTask = {
  type: "deck" | "listening" | "verb" | "fillblank";
  id: string;
  title: string;
  href: string;
};

type WallDay = {
  date: string;
  notesText: string | null;
  notionUrl: string | null;
  tasks: WallTask[];
};

function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

export default async function StudentHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  const days = new Map<string, WallDay>();

  function getDay(date: string): WallDay {
    let day = days.get(date);
    if (!day) {
      day = { date, notesText: null, notionUrl: null, tasks: [] };
      days.set(date, day);
    }
    return day;
  }

  for (const a of deckAssignments ?? []) {
    if (!a.deck) continue;
    const deck = a.deck as unknown as { id: string; title: string };
    getDay(dateKey(a.assigned_at)).tasks.push({
      type: "deck",
      id: deck.id,
      title: (a.custom_name as string | null) ?? deck.title,
      href: `/student/decks/${deck.id}/study`,
    });
  }
  for (const a of listeningAssignments ?? []) {
    if (!a.exercise) continue;
    const exercise = a.exercise as unknown as { id: string; title: string };
    getDay(dateKey(a.assigned_at)).tasks.push({
      type: "listening",
      id: exercise.id,
      title: exercise.title,
      href: `/student/listening/${exercise.id}`,
    });
  }
  for (const a of verbAssignments ?? []) {
    if (!a.drill) continue;
    const drill = a.drill as unknown as {
      id: string;
      infinitive: string;
      translation: string;
    };
    getDay(dateKey(a.assigned_at)).tasks.push({
      type: "verb",
      id: drill.id,
      title: `${drill.infinitive} — ${drill.translation}`,
      href: `/student/verbs/${drill.id}`,
    });
  }
  for (const a of fillBlankAssignments ?? []) {
    if (!a.drill) continue;
    const drill = a.drill as unknown as { id: string; title: string };
    getDay(dateKey(a.assigned_at)).tasks.push({
      type: "fillblank",
      id: drill.id,
      title: drill.title,
      href: `/student/fill-blanks/${drill.id}`,
    });
  }
  for (const note of notes ?? []) {
    const day = getDay(note.lesson_date);
    day.notesText = note.notes_text;
    day.notionUrl = note.notion_url;
  }

  const sortedDays = Array.from(days.values()).sort((a, b) =>
    a.date < b.date ? 1 : -1
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">My Wall</h1>

      {sortedDays.length > 0 ? (
        <div className="flex flex-col gap-6">
          {sortedDays.map((day) => (
            <div
              key={day.date}
              className="flex flex-col gap-3 rounded-2xl border border-black/[.08] bg-white p-5 shadow-sm dark:border-white/[.145] dark:bg-zinc-900"
            >
              <div className="text-sm font-medium text-zinc-500">
                {new Date(day.date).toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>

              {day.notesText && (
                <p dir="auto" className="whitespace-pre-wrap text-sm">
                  {day.notesText}
                </p>
              )}

              {day.notionUrl && (
                <iframe
                  src={day.notionUrl}
                  className="h-96 w-full rounded-lg border border-black/[.08] dark:border-white/[.145]"
                />
              )}

              {day.tasks.length > 0 && (
                <div className="flex flex-col gap-2">
                  {day.tasks.map((task) => (
                    <Link
                      key={`${task.type}-${task.id}`}
                      href={task.href}
                      className="block rounded-lg border border-black/[.08] p-3 hover:bg-black/[.02] dark:border-white/[.145] dark:hover:bg-white/[.05]"
                    >
                      <div className="text-xs font-medium uppercase text-zinc-500">
                        {TYPE_LABELS[task.type]}
                      </div>
                      <div dir="auto" className="font-medium">
                        {task.title}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-zinc-600 dark:text-zinc-400">
          Nothing here yet — check back after your next lesson.
        </p>
      )}
    </div>
  );
}
