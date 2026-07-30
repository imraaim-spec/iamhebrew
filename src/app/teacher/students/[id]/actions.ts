"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function syncAssignmentsForType(
  supabase: SupabaseServerClient,
  opts: {
    assignmentTable: string;
    idColumn: string;
    itemType: string;
    studentId: string;
    checkedIds: Set<string>;
  }
) {
  const { assignmentTable, idColumn, itemType, studentId, checkedIds } = opts;

  const { data: everyoneRows, error: everyoneError } = await supabase
    .from(assignmentTable)
    .select(idColumn)
    .is("student_id", null);
  if (everyoneError) {
    throw new Error(`Failed to load ${itemType} defaults: ${everyoneError.message}`);
  }
  const everyoneIds = new Set(
    (everyoneRows ?? []).map((r) => (r as unknown as Record<string, string>)[idColumn])
  );

  const { error: deleteError } = await supabase
    .from(assignmentTable)
    .delete()
    .eq("student_id", studentId);
  if (deleteError) {
    throw new Error(`Failed to update ${itemType} assignments: ${deleteError.message}`);
  }

  const individualIds = Array.from(checkedIds).filter((id) => !everyoneIds.has(id));
  if (individualIds.length > 0) {
    const { error } = await supabase
      .from(assignmentTable)
      .insert(individualIds.map((item_id) => ({ [idColumn]: item_id, student_id: studentId })));
    if (error) throw new Error(`Failed to save ${itemType} assignments: ${error.message}`);
  }

  const { error: exclusionDeleteError } = await supabase
    .from("assignment_exclusions")
    .delete()
    .eq("student_id", studentId)
    .eq("item_type", itemType);
  if (exclusionDeleteError) {
    throw new Error(`Failed to update ${itemType} exclusions: ${exclusionDeleteError.message}`);
  }

  const excludedIds = Array.from(everyoneIds).filter((id) => !checkedIds.has(id));
  if (excludedIds.length > 0) {
    const { error } = await supabase.from("assignment_exclusions").insert(
      excludedIds.map((item_id) => ({
        student_id: studentId,
        item_type: itemType,
        item_id,
      }))
    );
    if (error) throw new Error(`Failed to save ${itemType} exclusions: ${error.message}`);
  }
}

export async function setStudentAssignments(studentId: string, formData: FormData) {
  const supabase = await createClient();

  await syncAssignmentsForType(supabase, {
    assignmentTable: "assignments",
    idColumn: "deck_id",
    itemType: "deck",
    studentId,
    checkedIds: new Set(formData.getAll("decks").map(String)),
  });
  await syncAssignmentsForType(supabase, {
    assignmentTable: "listening_assignments",
    idColumn: "exercise_id",
    itemType: "listening",
    studentId,
    checkedIds: new Set(formData.getAll("listening").map(String)),
  });
  await syncAssignmentsForType(supabase, {
    assignmentTable: "verb_drill_assignments",
    idColumn: "drill_id",
    itemType: "verb",
    studentId,
    checkedIds: new Set(formData.getAll("verbs").map(String)),
  });
  await syncAssignmentsForType(supabase, {
    assignmentTable: "fill_blank_assignments",
    idColumn: "drill_id",
    itemType: "fillblank",
    studentId,
    checkedIds: new Set(formData.getAll("fillblanks").map(String)),
  });

  revalidatePath(`/teacher/students/${studentId}/progress`);
  revalidatePath("/student");
}

export async function saveLessonNote(studentId: string, formData: FormData) {
  const lessonDate = formData.get("lesson_date") as string;
  const notesText = (formData.get("notes_text") as string)?.trim() || null;
  const notionUrl = (formData.get("notion_url") as string)?.trim() || null;
  if (!lessonDate) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("lesson_notes").upsert(
    {
      student_id: studentId,
      lesson_date: lessonDate,
      notes_text: notesText,
      notion_url: notionUrl,
      created_by: user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "student_id,lesson_date" }
  );
  if (error) throw new Error(`Failed to save note: ${error.message}`);

  revalidatePath(`/teacher/students/${studentId}/progress`);
}

export async function deleteLessonNote(noteId: string, studentId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("lesson_notes").delete().eq("id", noteId);
  if (error) throw new Error(`Failed to delete note: ${error.message}`);
  revalidatePath(`/teacher/students/${studentId}/progress`);
}
