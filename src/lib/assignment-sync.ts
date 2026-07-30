import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

// Syncs assignment of a single item (a deck, listening exercise, verb
// drill, or fill-in-the-blank drill) across all students, from a form that
// has an "everyone" checkbox plus a per-student checklist. When "everyone"
// is on, the per-student checklist is read as opt-outs (recorded in
// assignment_exclusions) rather than individual assignment rows, so a
// teacher can uncheck a single student without unassigning the item from
// everyone else.
export async function syncItemAssignments(
  supabase: SupabaseServerClient,
  opts: {
    assignmentTable: string;
    idColumn: string;
    itemType: string;
    itemId: string;
    everyone: boolean;
    checkedStudentIds: Set<string>;
    customNameFor?: (studentId: string) => string | null;
  }
) {
  const { assignmentTable, idColumn, itemType, itemId, everyone, checkedStudentIds, customNameFor } =
    opts;

  if (everyone) {
    const { error: upsertError } = await supabase
      .from(assignmentTable)
      .upsert({ [idColumn]: itemId, student_id: null }, { onConflict: `${idColumn},student_id` });
    if (upsertError) throw new Error(`Failed to save assignment: ${upsertError.message}`);

    const { error: deleteIndividualError } = await supabase
      .from(assignmentTable)
      .delete()
      .eq(idColumn, itemId)
      .not("student_id", "is", null);
    if (deleteIndividualError) {
      throw new Error(
        `Failed to clean up individual assignments: ${deleteIndividualError.message}`
      );
    }

    const { data: allStudents, error: studentsError } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "student");
    if (studentsError) throw new Error(`Failed to load students: ${studentsError.message}`);

    const { error: exclusionDeleteError } = await supabase
      .from("assignment_exclusions")
      .delete()
      .eq("item_type", itemType)
      .eq("item_id", itemId);
    if (exclusionDeleteError) {
      throw new Error(`Failed to update exclusions: ${exclusionDeleteError.message}`);
    }

    const excludedStudentIds = (allStudents ?? [])
      .map((s) => s.id as string)
      .filter((sid) => !checkedStudentIds.has(sid));
    if (excludedStudentIds.length > 0) {
      const { error } = await supabase.from("assignment_exclusions").insert(
        excludedStudentIds.map((student_id) => ({
          student_id,
          item_type: itemType,
          item_id: itemId,
        }))
      );
      if (error) throw new Error(`Failed to save exclusions: ${error.message}`);
    }
  } else {
    const { error: deleteError } = await supabase
      .from(assignmentTable)
      .delete()
      .eq(idColumn, itemId);
    if (deleteError) throw new Error(`Failed to clear previous assignment: ${deleteError.message}`);

    if (checkedStudentIds.size > 0) {
      const { error } = await supabase.from(assignmentTable).insert(
        Array.from(checkedStudentIds).map((studentId) => ({
          [idColumn]: itemId,
          student_id: studentId,
          ...(customNameFor ? { custom_name: customNameFor(studentId) } : {}),
        }))
      );
      if (error) throw new Error(`Failed to save assignment: ${error.message}`);
    }

    const { error: exclusionDeleteError } = await supabase
      .from("assignment_exclusions")
      .delete()
      .eq("item_type", itemType)
      .eq("item_id", itemId);
    if (exclusionDeleteError) {
      throw new Error(`Failed to clear exclusions: ${exclusionDeleteError.message}`);
    }
  }
}
