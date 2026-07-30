import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deleteVerbDrill, setVerbDrillAssignments } from "../actions";
import { TENSE_SLOTS, TENSE_LABELS } from "@/lib/hebrew-verbs";

export default async function VerbDrillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: drill } = await supabase
    .from("verb_drills")
    .select("id, infinitive, translation, tense, forms")
    .eq("id", id)
    .single();

  if (!drill) notFound();

  const slots = TENSE_SLOTS[drill.tense] ?? [];
  const forms = drill.forms as Record<string, string>;

  const { data: students } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .eq("role", "student")
    .order("email", { ascending: true });

  const { data: currentAssignments } = await supabase
    .from("verb_drill_assignments")
    .select("student_id")
    .eq("drill_id", id);

  const assignedToEveryone =
    currentAssignments?.some((a) => a.student_id === null) ?? false;
  const assignedStudentIds = new Set(
    (currentAssignments ?? [])
      .filter((a) => a.student_id !== null)
      .map((a) => a.student_id)
  );

  const setVerbDrillAssignmentsWithId = setVerbDrillAssignments.bind(null, id);
  const deleteVerbDrillWithId = deleteVerbDrill.bind(null, id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 dir="auto" className="text-2xl">
            {drill.infinitive} — {drill.translation}
          </h1>
          <p className="text-text-muted">{TENSE_LABELS[drill.tense]}</p>
        </div>
        <Link
          href={`/teacher/verbs/${id}/study`}
          className="shrink-0 rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent-hover"
        >
          Preview
        </Link>
      </div>

      <ul
        dir="auto"
        className="grid grid-cols-2 gap-1 rounded-md border border-border bg-surface p-4"
      >
        {slots.map((slot) => (
          <li key={slot.key} className="text-sm">
            <span className="text-text-faint">{slot.label}: </span>
            {forms[slot.key] ?? <span className="text-text-faint">—</span>}
          </li>
        ))}
      </ul>

      <form
        action={setVerbDrillAssignmentsWithId}
        className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4"
      >
        <h2 className="font-heading font-bold">Assign this drill</h2>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="everyone" defaultChecked={assignedToEveryone} />
          Visible to all students
        </label>

        {students && students.length > 0 ? (
          <div className="flex flex-col gap-1 border-t border-border pt-3">
            <p className="text-sm text-text-muted">
              Or choose specific students:
            </p>
            {students.map((student) => (
              <label key={student.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="students"
                  value={student.id}
                  defaultChecked={assignedStudentIds.has(student.id)}
                />
                {student.full_name || student.email}
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted">
            No students have signed in yet. Add them on the Students page,
            then ask them to sign in once.
          </p>
        )}

        <button
          type="submit"
          className="self-start rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent-hover"
        >
          Save assignment
        </button>
      </form>

      <form action={deleteVerbDrillWithId}>
        <button type="submit" className="text-sm text-red-600 hover:underline">
          Delete this verb drill
        </button>
      </form>
    </div>
  );
}
