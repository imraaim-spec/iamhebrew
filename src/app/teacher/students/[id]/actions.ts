"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setStudentAssignments(studentId: string, formData: FormData) {
  const supabase = await createClient();

  const deckIds = formData.getAll("decks").map(String);
  const listeningIds = formData.getAll("listening").map(String);
  const verbIds = formData.getAll("verbs").map(String);

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

  revalidatePath(`/teacher/students/${studentId}/progress`);
}
