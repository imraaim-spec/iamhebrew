import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import {
  deleteFillBlankDrill,
  deleteFillBlankSegment,
  setFillBlankAssignments,
} from "../actions";

export default async function FillBlankDrillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: drill } = await supabase
    .from("fill_blank_drills")
    .select("id, title, description, segments")
    .eq("id", id)
    .single();

  if (!drill) notFound();

  const segments = drill.segments as string[];

  const { data: students } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .eq("role", "student")
    .order("email", { ascending: true });

  const { data: currentAssignments } = await supabase
    .from("fill_blank_assignments")
    .select("student_id")
    .eq("drill_id", id);

  const assignedToEveryone =
    currentAssignments?.some((a) => a.student_id === null) ?? false;
  const assignedStudentIds = new Set(
    (currentAssignments ?? [])
      .filter((a) => a.student_id !== null)
      .map((a) => a.student_id)
  );

  const setFillBlankAssignmentsWithId = setFillBlankAssignments.bind(null, id);
  const deleteFillBlankDrillWithId = deleteFillBlankDrill.bind(null, id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{drill.title}</h1>
          {drill.description && (
            <p className="text-zinc-600 dark:text-zinc-400">{drill.description}</p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href={`/teacher/fill-blanks/${id}/edit`}
            className="rounded-full border border-black/[.08] px-4 py-2 text-sm dark:border-white/[.145]"
          >
            Edit
          </Link>
          <Link
            href={`/teacher/fill-blanks/${id}/study`}
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Preview
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {segments.map((segment, i) => {
          const deleteSegmentWithIds = deleteFillBlankSegment.bind(null, id, i);
          return (
            <div
              key={i}
              className="flex items-start justify-between gap-4 rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]"
            >
              <div>
                <div className="text-xs font-medium uppercase text-zinc-500">
                  Piece {i + 1}
                </div>
                <p dir="auto" className="whitespace-pre-wrap">
                  {segment}
                </p>
              </div>
              <form action={deleteSegmentWithIds}>
                <button
                  type="submit"
                  className="shrink-0 text-sm text-red-600 hover:underline dark:text-red-400"
                >
                  Remove
                </button>
              </form>
            </div>
          );
        })}
      </div>

      <form
        action={setFillBlankAssignmentsWithId}
        className="flex flex-col gap-3 rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]"
      >
        <h2 className="font-medium">Assign this drill</h2>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="everyone" defaultChecked={assignedToEveryone} />
          Visible to all students
        </label>

        {students && students.length > 0 ? (
          <div className="flex flex-col gap-1 border-t border-black/[.08] pt-3 dark:border-white/[.145]">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
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
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No students have signed in yet. Add them on the Students page,
            then ask them to sign in once.
          </p>
        )}

        <button
          type="submit"
          className="self-start rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Save assignment
        </button>
      </form>

      <ConfirmDeleteButton
        action={deleteFillBlankDrillWithId}
        label="Delete this drill"
        confirmMessage="Delete this whole drill and all its pieces? This can't be undone, and it will remove any student progress tied to it."
      />
    </div>
  );
}
