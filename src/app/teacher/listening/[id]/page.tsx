import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  deleteListeningExercise,
  setListeningAssignments,
  updateListeningExerciseLanguage,
} from "../actions";
import { LANGUAGE_LABELS } from "@/lib/language";

export default async function ListeningExerciseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: exercise } = await supabase
    .from("listening_exercises")
    .select("id, title, template, language")
    .eq("id", id)
    .single();

  if (!exercise) notFound();

  const { data: students } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .eq("role", "student")
    .order("email", { ascending: true });

  const { data: currentAssignments } = await supabase
    .from("listening_assignments")
    .select("student_id")
    .eq("exercise_id", id);
  const { data: exclusions } = await supabase
    .from("assignment_exclusions")
    .select("student_id")
    .eq("item_type", "listening")
    .eq("item_id", id);

  const assignedToEveryone =
    currentAssignments?.some((a) => a.student_id === null) ?? false;
  const excludedStudentIds = new Set((exclusions ?? []).map((e) => e.student_id));
  const individuallyAssignedIds = new Set(
    (currentAssignments ?? [])
      .filter((a) => a.student_id !== null)
      .map((a) => a.student_id)
  );
  const assignedStudentIds = new Set(
    (students ?? [])
      .map((s) => s.id)
      .filter(
        (sid) =>
          individuallyAssignedIds.has(sid) ||
          (assignedToEveryone && !excludedStudentIds.has(sid))
      )
  );

  const setListeningAssignmentsWithId = setListeningAssignments.bind(null, id);
  const deleteListeningExerciseWithId = deleteListeningExercise.bind(null, id);
  const updateListeningExerciseLanguageWithId = updateListeningExerciseLanguage.bind(null, id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl">{exercise.title}</h1>
        <Link
          href={`/teacher/listening/${id}/study`}
          className="shrink-0 rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent-hover"
        >
          Preview
        </Link>
      </div>

      <p dir="auto" className="whitespace-pre-wrap text-text-muted">
        {exercise.template}
      </p>

      <form
        action={updateListeningExerciseLanguageWithId}
        className="flex items-center gap-3 rounded-md border border-border bg-surface p-4"
      >
        <label className="flex items-center gap-2 text-sm text-text-muted">
          Language
          <select
            name="language"
            defaultValue={exercise.language ?? ""}
            className="rounded-sm border border-border bg-surface px-3 py-2 text-text"
          >
            <option value="">Not set</option>
            {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-sm border border-border px-3 py-2 text-sm text-text-muted hover:bg-bg-alt"
        >
          Save
        </button>
      </form>

      <form
        action={setListeningAssignmentsWithId}
        className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4"
      >
        <h2 className="font-heading font-bold">Assign this exercise</h2>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="everyone" defaultChecked={assignedToEveryone} />
          Visible to all students
        </label>

        {students && students.length > 0 ? (
          <div className="flex flex-col gap-1 border-t border-border pt-3">
            <p className="text-sm text-text-muted">
              {assignedToEveryone
                ? "Everyone has this exercise by default — uncheck a student to remove it for just them:"
                : "Or choose specific students:"}
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
            then ask them to sign in once — after that, they&apos;ll appear
            here to assign exercises to.
          </p>
        )}

        <button
          type="submit"
          className="self-start rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent-hover"
        >
          Save assignment
        </button>
      </form>

      <form action={deleteListeningExerciseWithId}>
        <button type="submit" className="text-sm text-red-600 hover:underline">
          Delete this exercise
        </button>
      </form>
    </div>
  );
}
