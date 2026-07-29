"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setStudentAssignments(studentId: string, formData: FormData) {
  const supabase = await createClient();

  const deckIds = formData.getAll("decks").map(String);
  const listeningIds = formData.getAll("listening").map(String);
  const verbIds = formData.getAll("verbs").map(String);
  const fillBlankIds = formData.getAll("fillblanks").map(String);

  const { error: deckDeleteError } = await supabase
    .from("assignments")
    .delete()
    .eq("student_id", studentId);
  if (deckDeleteError) {
    throw new Error(`Failed to update deck assignments: ${deckDeleteError.message}`);
  }
  if (deckIds.length > 0) {
    const { error } = await supabase
      .from("assignments")
      .insert(deckIds.map((deck_id) => ({ deck_id, student_id: studentId })));
    if (error) throw new Error(`Failed to save deck assignments: ${error.message}`);
  }

  const { error: listeningDeleteError } = await supabase
    .from("listening_assignments")
    .delete()
    .eq("student_id", studentId);
  if (listeningDeleteError) {
    throw new Error(`Failed to update listening assignments: ${listeningDeleteError.message}`);
  }
  if (listeningIds.length > 0) {
    const { error } = await supabase
      .from("listening_assignments")
      .insert(listeningIds.map((exercise_id) => ({ exercise_id, student_id: studentId })));
    if (error) throw new Error(`Failed to save listening assignments: ${error.message}`);
  }

  const { error: verbDeleteError } = await supabase
    .from("verb_drill_assignments")
    .delete()
    .eq("student_id", studentId);
  if (verbDeleteError) {
    throw new Error(`Failed to update verb drill assignments: ${verbDeleteError.message}`);
  }
  if (verbIds.length > 0) {
    const { error } = await supabase
      .from("verb_drill_assignments")
      .insert(verbIds.map((drill_id) => ({ drill_id, student_id: studentId })));
    if (error) throw new Error(`Failed to save verb drill assignments: ${error.message}`);
  }

  const { error: fillBlankDeleteError } = await supabase
    .from("fill_blank_assignments")
    .delete()
    .eq("student_id", studentId);
  if (fillBlankDeleteError) {
    throw new Error(`Failed to update fill-in-the-blank assignments: ${fillBlankDeleteError.message}`);
  }
  if (fillBlankIds.length > 0) {
    const { error } = await supabase
      .from("fill_blank_assignments")
      .insert(fillBlankIds.map((drill_id) => ({ drill_id, student_id: studentId })));
    if (error) throw new Error(`Failed to save fill-in-the-blank assignments: ${error.message}`);
  }

  revalidatePath(`/teacher/students/${studentId}/progress`);
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
