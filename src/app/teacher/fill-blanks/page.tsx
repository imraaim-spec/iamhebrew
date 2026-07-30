import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { createFillBlankDrill, deleteFillBlankDrill } from "./actions";
import { LANGUAGE_LABELS } from "@/lib/language";

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
      <h1 className="text-2xl">Fill in the Blanks</h1>

      <form
        action={createFillBlankDrill}
        className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4"
      >
        <h2 className="font-heading font-bold">New drill</h2>

        <input
          name="name"
          placeholder="Name, e.g. Geography basics"
          required
          className="rounded-sm border border-border bg-surface px-3 py-2 text-text"
        />
        <textarea
          name="description"
          placeholder="Description (optional)"
          rows={2}
          className="rounded-sm border border-border bg-surface px-3 py-2 text-text"
        />
        <select
          name="language"
          defaultValue=""
          className="rounded-sm border border-border bg-surface px-3 py-2 text-text"
        >
          <option value="">Language (not set)</option>
          {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <p className="text-sm text-text-muted">
          Mark each blank with square brackets around the correct answer
          (use a slash for more than one acceptable answer, e.g.{" "}
          <code>[הולך/צועד]</code>). Separate the drill&apos;s pieces with{" "}
          <strong>two</strong> blank lines — leave just one blank line
          within a single piece (e.g. between an example question and its
          answer). Each piece becomes its own numbered screen the student
          pages through.
        </p>
        <pre className="rounded-sm bg-bg-alt p-2 text-xs text-text-muted">
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
          className="rounded-sm border border-border bg-surface px-3 py-2 font-mono text-sm text-text"
        />

        <div className="flex flex-col gap-1 border-t border-border pt-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="everyone" />
            Visible to all students
          </label>
          {students && students.length > 0 && (
            <>
              <p className="text-sm text-text-muted">
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
          className="self-start rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent-hover"
        >
          Create drill
        </button>
      </form>

      <ul className="flex flex-col gap-2">
        {drills && drills.length > 0 ? (
          drills.map((drill) => {
            const deleteFillBlankDrillWithId = deleteFillBlankDrill.bind(null, drill.id);
            return (
              <li
                key={drill.id}
                className="flex items-center justify-between gap-4 rounded-md border border-border bg-surface p-4 hover:bg-bg-alt"
              >
                <Link href={`/teacher/fill-blanks/${drill.id}`} className="flex-1">
                  <div className="font-medium">{drill.title}</div>
                  {drill.description && (
                    <div className="text-sm text-text-muted">
                      {drill.description}
                    </div>
                  )}
                  <div className="text-sm text-text-faint">
                    {(drill.segments as string[]).length} piece
                    {(drill.segments as string[]).length === 1 ? "" : "s"}
                  </div>
                </Link>
                <ConfirmDeleteButton
                  action={deleteFillBlankDrillWithId}
                  label="Delete"
                  confirmMessage={`Delete "${drill.title}" and all its pieces? This can't be undone.`}
                />
              </li>
            );
          })
        ) : (
          <p className="text-text-muted">
            No drills yet — create your first one above.
          </p>
        )}
      </ul>
    </div>
  );
}
