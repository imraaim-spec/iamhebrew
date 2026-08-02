import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createListeningExercise } from "./actions";
import { ListeningExerciseForm } from "@/components/listening-exercise-form";
import { computeAssignedStudentIdsByItem } from "@/lib/assignment-status";
import { FilterableContentList, type FilterableItem } from "@/components/filterable-content-list";

export default async function ListeningExercisesPage() {
  const supabase = await createClient();
  const { data: exercises } = await supabase
    .from("listening_exercises")
    .select("id, title, language, created_at")
    .order("created_at", { ascending: false });

  const { data: students } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .eq("role", "student")
    .order("email", { ascending: true });

  const { data: assignmentRows } = await supabase
    .from("listening_assignments")
    .select("exercise_id, student_id");
  const { data: exclusionRows } = await supabase
    .from("assignment_exclusions")
    .select("item_id, student_id")
    .eq("item_type", "listening");

  const assignedByExercise = computeAssignedStudentIdsByItem({
    allStudentIds: (students ?? []).map((s) => s.id),
    assignmentRows: (assignmentRows ?? []).map((a) => ({
      itemId: a.exercise_id,
      studentId: a.student_id,
    })),
    exclusionRows: (exclusionRows ?? []).map((e) => ({
      itemId: e.item_id,
      studentId: e.student_id,
    })),
  });

  const studentOptions = (students ?? []).map((s) => ({
    id: s.id,
    label: s.full_name || s.email,
  }));

  const items: FilterableItem[] = (exercises ?? []).map((exercise) => ({
    id: exercise.id,
    searchText: exercise.title,
    language: exercise.language,
    assignedStudentIds: Array.from(assignedByExercise.get(exercise.id) ?? []),
    node: (
      <Link
        href={`/teacher/listening/${exercise.id}`}
        className="block rounded-md border border-border bg-surface p-4 hover:bg-bg-alt"
      >
        <div className="font-medium">{exercise.title}</div>
      </Link>
    ),
  }));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <h1 className="text-2xl">Listening Exercises</h1>

      <ListeningExerciseForm action={createListeningExercise} />

      <FilterableContentList
        items={items}
        students={studentOptions}
        emptyMessage="No listening exercises yet — create your first one above."
      />
    </div>
  );
}
