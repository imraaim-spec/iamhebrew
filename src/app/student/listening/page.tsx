import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function StudentListeningPage() {
  const supabase = await createClient();

  // RLS restricts this to exercises assigned to the current student
  // (or assigned to everyone) — same pattern as decks.
  const { data: exercises } = await supabase
    .from("listening_exercises")
    .select("id, title")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Listening Exercises</h1>

      <ul className="flex flex-col gap-2">
        {exercises && exercises.length > 0 ? (
          exercises.map((exercise) => (
            <li key={exercise.id}>
              <Link
                href={`/student/listening/${exercise.id}`}
                className="block rounded-lg border border-black/[.08] p-4 hover:bg-black/[.02] dark:border-white/[.145] dark:hover:bg-white/[.03]"
              >
                <div className="font-medium">{exercise.title}</div>
              </Link>
            </li>
          ))
        ) : (
          <p className="text-zinc-600 dark:text-zinc-400">
            No listening exercises assigned yet.
          </p>
        )}
      </ul>
    </div>
  );
}
