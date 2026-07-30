import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createListeningExercise } from "./actions";
import { ListeningExerciseForm } from "@/components/listening-exercise-form";

export default async function ListeningExercisesPage() {
  const supabase = await createClient();
  const { data: exercises } = await supabase
    .from("listening_exercises")
    .select("id, title, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <h1 className="text-2xl">Listening Exercises</h1>

      <ListeningExerciseForm action={createListeningExercise} />

      <ul className="flex flex-col gap-2">
        {exercises && exercises.length > 0 ? (
          exercises.map((exercise) => (
            <li key={exercise.id}>
              <Link
                href={`/teacher/listening/${exercise.id}`}
                className="block rounded-md border border-border bg-surface p-4 hover:bg-bg-alt"
              >
                <div className="font-medium">{exercise.title}</div>
              </Link>
            </li>
          ))
        ) : (
          <p className="text-text-muted">
            No listening exercises yet — create your first one above.
          </p>
        )}
      </ul>
    </div>
  );
}
