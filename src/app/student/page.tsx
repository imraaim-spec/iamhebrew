import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const TYPE_LABELS: Record<string, string> = {
  deck: "Flashcards",
  listening: "Listening",
  verb: "Verb Drill",
  fillblank: "Fill in the Blanks",
};

export default async function StudentHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // RLS already restricts each of these to only what's assigned to the
  // current student (or assigned to everyone) — no manual filtering needed.
  const { data: decks } = await supabase
    .from("decks")
    .select("id, title")
    .order("created_at", { ascending: false });
  const { data: listeningExercises } = await supabase
    .from("listening_exercises")
    .select("id, title")
    .order("created_at", { ascending: false });
  const { data: verbDrills } = await supabase
    .from("verb_drills")
    .select("id, infinitive, translation")
    .order("created_at", { ascending: false });
  const { data: fillBlankDrills } = await supabase
    .from("fill_blank_drills")
    .select("id, title")
    .order("created_at", { ascending: false });

  // Custom per-student deck nicknames, if the teacher set any.
  const { data: myDeckAssignments } = user
    ? await supabase
        .from("assignments")
        .select("deck_id, custom_name")
        .eq("student_id", user.id)
    : { data: null };
  const customNameByDeck = new Map(
    (myDeckAssignments ?? [])
      .filter((a) => a.custom_name)
      .map((a) => [a.deck_id, a.custom_name as string])
  );

  const items = [
    ...(decks ?? []).map((d) => ({
      type: "deck" as const,
      id: d.id,
      title: customNameByDeck.get(d.id) ?? d.title,
      href: `/student/decks/${d.id}/study`,
    })),
    ...(listeningExercises ?? []).map((e) => ({
      type: "listening" as const,
      id: e.id,
      title: e.title,
      href: `/student/listening/${e.id}`,
    })),
    ...(verbDrills ?? []).map((v) => ({
      type: "verb" as const,
      id: v.id,
      title: `${v.infinitive} — ${v.translation}`,
      href: `/student/verbs/${v.id}`,
    })),
    ...(fillBlankDrills ?? []).map((d) => ({
      type: "fillblank" as const,
      id: d.id,
      title: d.title,
      href: `/student/fill-blanks/${d.id}`,
    })),
  ];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">My Assignments</h1>

      <ul className="flex flex-col gap-2">
        {items.length > 0 ? (
          items.map((item) => (
            <li key={`${item.type}-${item.id}`}>
              <Link
                href={item.href}
                className="block rounded-lg border border-black/[.08] p-4 hover:bg-black/[.02] dark:border-white/[.145] dark:hover:bg-white/[.03]"
              >
                <div className="text-xs font-medium uppercase text-zinc-500">
                  {TYPE_LABELS[item.type]}
                </div>
                <div dir="auto" className="font-medium">
                  {item.title}
                </div>
              </Link>
            </li>
          ))
        ) : (
          <p className="text-zinc-600 dark:text-zinc-400">
            Nothing assigned yet — check back after your teacher assigns you
            something.
          </p>
        )}
      </ul>
    </div>
  );
}
