"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createCourse(formData: FormData) {
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  if (!title) return;

  const deckIds = formData.getAll("decks").map(String);
  const listeningIds = formData.getAll("listening").map(String);
  const verbIds = formData.getAll("verbs").map(String);
  const fillBlankIds = formData.getAll("fillblanks").map(String);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: course, error } = await supabase
    .from("courses")
    .insert({ title, description, created_by: user.id })
    .select("id")
    .single();
  if (error) throw new Error(`Failed to create course: ${error.message}`);

  const items = [
    ...deckIds.map((item_id) => ({ course_id: course.id, item_type: "deck", item_id })),
    ...listeningIds.map((item_id) => ({ course_id: course.id, item_type: "listening", item_id })),
    ...verbIds.map((item_id) => ({ course_id: course.id, item_type: "verb", item_id })),
    ...fillBlankIds.map((item_id) => ({ course_id: course.id, item_type: "fillblank", item_id })),
  ];

  if (items.length > 0) {
    const { error: itemsError } = await supabase.from("course_items").insert(items);
    if (itemsError) throw new Error(`Failed to add course items: ${itemsError.message}`);
  }

  revalidatePath("/teacher/courses");
  redirect(`/teacher/courses/${course.id}`);
}

export async function removeCourseItem(courseItemId: string, courseId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("course_items").delete().eq("id", courseItemId);
  if (error) throw new Error(`Failed to remove item: ${error.message}`);
  revalidatePath(`/teacher/courses/${courseId}`);
}

export async function deleteCourse(courseId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("courses").delete().eq("id", courseId);
  if (error) throw new Error(`Failed to delete course: ${error.message}`);
  revalidatePath("/teacher/courses");
  redirect("/teacher/courses");
}

export async function assignCourseToStudent(courseId: string, studentId: string) {
  const supabase = await createClient();

  const { data: items, error } = await supabase
    .from("course_items")
    .select("item_type, item_id")
    .eq("course_id", courseId);
  if (error) throw new Error(`Failed to load course items: ${error.message}`);

  const deckRows = (items ?? [])
    .filter((i) => i.item_type === "deck")
    .map((i) => ({ deck_id: i.item_id, student_id: studentId }));
  const listeningRows = (items ?? [])
    .filter((i) => i.item_type === "listening")
    .map((i) => ({ exercise_id: i.item_id, student_id: studentId }));
  const verbRows = (items ?? [])
    .filter((i) => i.item_type === "verb")
    .map((i) => ({ drill_id: i.item_id, student_id: studentId }));
  const fillBlankRows = (items ?? [])
    .filter((i) => i.item_type === "fillblank")
    .map((i) => ({ drill_id: i.item_id, student_id: studentId }));

  if (deckRows.length > 0) {
    const { error: e } = await supabase
      .from("assignments")
      .upsert(deckRows, { onConflict: "deck_id,student_id", ignoreDuplicates: true });
    if (e) throw new Error(`Failed to assign decks: ${e.message}`);
  }
  if (listeningRows.length > 0) {
    const { error: e } = await supabase
      .from("listening_assignments")
      .upsert(listeningRows, { onConflict: "exercise_id,student_id", ignoreDuplicates: true });
    if (e) throw new Error(`Failed to assign listening exercises: ${e.message}`);
  }
  if (verbRows.length > 0) {
    const { error: e } = await supabase
      .from("verb_drill_assignments")
      .upsert(verbRows, { onConflict: "drill_id,student_id", ignoreDuplicates: true });
    if (e) throw new Error(`Failed to assign verb drills: ${e.message}`);
  }
  if (fillBlankRows.length > 0) {
    const { error: e } = await supabase
      .from("fill_blank_assignments")
      .upsert(fillBlankRows, { onConflict: "drill_id,student_id", ignoreDuplicates: true });
    if (e) throw new Error(`Failed to assign fill-in-the-blank drills: ${e.message}`);
  }

  revalidatePath(`/teacher/students/${studentId}/progress`);
  revalidatePath("/student");
}
