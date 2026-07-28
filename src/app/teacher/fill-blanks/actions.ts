"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createFillBlankDrill(formData: FormData) {
  const raw = (formData.get("batch") as string) || "";
  const lines = raw.split(/\r?\n/);

  // First non-empty line is the drill's title.
  let i = 0;
  while (i < lines.length && !lines[i].trim()) i++;
  const title = lines[i]?.trim();
  if (!title) return;
  const rest = lines.slice(i + 1).join("\n");

  // Two-or-more blank lines mark a new piece; a single blank line stays
  // inside one (e.g. between an example question and its answer).
  const segments = rest
    .split(/\n[ \t]*\n[ \t]*\n+/)
    .map((b) => b.trim())
    .filter(Boolean);
  if (segments.length === 0) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("fill_blank_drills").insert({
    title,
    segments,
    created_by: user.id,
  });
  if (error) throw new Error(`Failed to save drill: ${error.message}`);

  revalidatePath("/teacher/fill-blanks");
}

export async function deleteFillBlankSegment(drillId: string, segmentIndex: number) {
  const supabase = await createClient();

  const { data: drill, error: fetchError } = await supabase
    .from("fill_blank_drills")
    .select("segments")
    .eq("id", drillId)
    .single();
  if (fetchError) throw new Error(`Failed to load drill: ${fetchError.message}`);

  const segments = (drill.segments as string[]).filter((_, i) => i !== segmentIndex);

  const { error } = await supabase
    .from("fill_blank_drills")
    .update({ segments })
    .eq("id", drillId);
  if (error) throw new Error(`Failed to remove piece: ${error.message}`);

  revalidatePath(`/teacher/fill-blanks/${drillId}`);
}

export async function deleteFillBlankDrill(drillId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("fill_blank_drills").delete().eq("id", drillId);
  if (error) throw new Error(`Failed to delete drill: ${error.message}`);
  revalidatePath("/teacher/fill-blanks");
  redirect("/teacher/fill-blanks");
}

export async function setFillBlankAssignments(drillId: string, formData: FormData) {
  const supabase = await createClient();
  const everyone = formData.get("everyone") === "on";
  const studentIds = formData.getAll("students").map((v) => String(v));

  const { error: deleteError } = await supabase
    .from("fill_blank_assignments")
    .delete()
    .eq("drill_id", drillId);
  if (deleteError) {
    throw new Error(`Failed to clear previous assignment: ${deleteError.message}`);
  }

  if (everyone) {
    const { error } = await supabase
      .from("fill_blank_assignments")
      .insert({ drill_id: drillId, student_id: null });
    if (error) throw new Error(`Failed to save assignment: ${error.message}`);
  } else if (studentIds.length > 0) {
    const { error } = await supabase.from("fill_blank_assignments").insert(
      studentIds.map((studentId) => ({ drill_id: drillId, student_id: studentId }))
    );
    if (error) throw new Error(`Failed to save assignment: ${error.message}`);
  }

  revalidatePath(`/teacher/fill-blanks/${drillId}`);
}
