import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createFillBlankBatch, createListeningExercise } from "./actions";
import { ListeningExerciseForm } from "@/components/listening-exercise-form";

export default async function ListeningExercisesPage() {
  const supabase = await createClient();
  const { data: exercises } = await supabase
    .from("listening_exercises")
    .select("id, title, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <h1 className="text-2xl font-semibold">Listening Exercises</h1>

      <ListeningExerciseForm action={createListeningExercise} />

      <form
        action={createFillBlankBatch}
        className="flex flex-col gap-3 rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]"
      >
        <h2 className="font-medium">Add a batch of fill-in-the-blank exercises</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No audio needed for these — just text with blanks. First line is
          the topic name. Mark each blank with square brackets around the
          correct answer (use a slash for more than one acceptable answer,
          e.g. <code>[הולך/צועד]</code>). Separate exercises with a blank
          line — leave <strong>two</strong> blank lines between exercises so
          a single blank line can still be used within one.
        </p>
        <pre className="rounded bg-black/[.03] p-2 text-xs text-zinc-600 dark:bg-white/[.05] dark:text-zinc-400">
{`קצת גאוגרפיה

איפה פריז?

בצרפת
איפה מוזיאון הלובר?
[בפריז]


איפה ניו יורק?

באמריקה בארצות הברית
איפה רוקפלר סנטר?
[בניו יורק]`}
        </pre>
        <textarea
          name="batch"
          rows={12}
          placeholder="Paste your topic and exercises here..."
          required
          dir="auto"
          className="rounded border border-black/[.08] px-3 py-2 font-mono text-sm dark:border-white/[.145] dark:bg-black"
        />
        <button
          type="submit"
          className="self-start rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Add batch
        </button>
      </form>

      <ul className="flex flex-col gap-2">
        {exercises && exercises.length > 0 ? (
          exercises.map((exercise) => (
            <li key={exercise.id}>
              <Link
                href={`/teacher/listening/${exercise.id}`}
                className="block rounded-lg border border-black/[.08] p-4 hover:bg-black/[.02] dark:border-white/[.145] dark:hover:bg-white/[.03]"
              >
                <div className="font-medium">{exercise.title}</div>
              </Link>
            </li>
          ))
        ) : (
          <p className="text-zinc-600 dark:text-zinc-400">
            No listening exercises yet — create your first one above.
          </p>
        )}
      </ul>
    </div>
  );
}
