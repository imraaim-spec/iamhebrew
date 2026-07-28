import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createFillBlankDrill } from "./actions";

export default async function FillBlankDrillsPage() {
  const supabase = await createClient();
  const { data: drills } = await supabase
    .from("fill_blank_drills")
    .select("id, title, description, segments")
    .order("created_at", { ascending: false });

  const { data: students } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .eq("role", "student")
    .order("email", { ascending: true });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <h1 className="text-2xl font-semibold">Fill in the Blanks</h1>

      <form
        action={createFillBlankDrill}
        className="flex flex-col gap-3 rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]"
      >
        <h2 className="font-medium">New drill</h2>

        <input
          name="name"
          placeholder="Name, e.g. Geography basics"
          required
          className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
        />
        <textarea
          name="description"
          placeholder="Description (optional)"
          rows={2}
          className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
        />

        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Mark each blank with square brackets around the correct answer
          (use a slash for more than one acceptable answer, e.g.{" "}
          <code>[הולך/צועד]</code>). Separate the drill&apos;s pieces with{" "}
          <strong>two</strong> blank lines — leave just one blank line
          within a single piece (e.g. between an example question and its
          answer). Each piece becomes its own numbered screen the student
          pages through.
        </p>
        <pre className="rounded bg-black/[.03] p-2 text-xs text-zinc-600 dark:bg-white/[.05] dark:text-zinc-400">
{`איפה פריז?

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
          placeholder="Paste your pieces here..."
          required
          dir="auto"
          className="rounded border border-black/[.08] px-3 py-2 font-mono text-sm dark:border-white/[.145] dark:bg-black"
        />

        <div className="flex flex-col gap-1 border-t border-black/[.08] pt-3 dark:border-white/[.145]">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="everyone" />
            Visible to all students
          </label>
          {students && students.length > 0 && (
            <>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Or choose specific students:
              </p>
              {students.map((student) => (
                <label key={student.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="students" value={student.id} />
                  {student.full_name || student.email}
                </label>
              ))}
            </>
          )}
        </div>

        <button
          type="submit"
          className="self-start rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Create drill
        </button>
      </form>

      <ul className="flex flex-col gap-2">
        {drills && drills.length > 0 ? (
          drills.map((drill) => (
            <li key={drill.id}>
              <Link
                href={`/teacher/fill-blanks/${drill.id}`}
                className="block rounded-lg border border-black/[.08] p-4 hover:bg-black/[.02] dark:border-white/[.145] dark:hover:bg-white/[.03]"
              >
                <div className="font-medium">{drill.title}</div>
                {drill.description && (
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    {drill.description}
                  </div>
                )}
                <div className="text-sm text-zinc-500">
                  {(drill.segments as string[]).length} piece
                  {(drill.segments as string[]).length === 1 ? "" : "s"}
                </div>
              </Link>
            </li>
          ))
        ) : (
          <p className="text-zinc-600 dark:text-zinc-400">
            No drills yet — create your first one above.
          </p>
        )}
      </ul>
    </div>
  );
}
