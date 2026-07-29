"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateHebrewAudioUrl } from "@/lib/tts";
import { extractSpeakableText } from "@/lib/cloze";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function parseSegments(raw: string): string[] {
  // Two-or-more blank lines mark a new piece; a single blank line stays
  // inside one (e.g. between an example question and its answer).
  return raw
    .split(/\n[ \t]*\n[ \t]*\n+/)
    .map((b) => b.trim())
    .filter(Boolean);
}

async function generateAudioUrls(
  supabase: SupabaseServerClient,
  segments: string[]
): Promise<(string | null)[]> {
  const urls: (string | null)[] = [];
  for (const segment of segments) {
    const speakable = extractSpeakableText(segment);
    urls.push(await generateHebrewAudioUrl(supabase, "fill-blanks", speakable));
  }
  return urls;
}

async function saveAssignments(
  supabase: SupabaseServerClient,
  drillId: string,
  formData: FormData
) {
  const everyone = formData.get("everyone") === "on";
  const studentIds = formData.getAll("students").map((v) => String(v));

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
}

export async function createFillBlankDrill(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const raw = (formData.get("batch") as string) || "";
  if (!name) return;

  const segments = parseSegments(raw);
  if (segments.length === 0) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const audioUrls = await generateAudioUrls(supabase, segments);

  const { data: drill, error } = await supabase
    .from("fill_blank_drills")
    .insert({ title: name, description, segments, audio_urls: audioUrls, created_by: user.id })
    .select("id")
    .single();
  if (error) throw new Error(`Failed to save drill: ${error.message}`);

  await saveAssignments(supabase, drill.id, formData);

  revalidatePath("/teacher/fill-blanks");
  redirect(`/teacher/fill-blanks/${drill.id}`);
}

export async function updateFillBlankDrill(drillId: string, formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const raw = (formData.get("batch") as string) || "";
  if (!name) return;

  const segments = parseSegments(raw);
  if (segments.length === 0) return;

  const supabase = await createClient();
  const audioUrls = await generateAudioUrls(supabase, segments);

  const { error } = await supabase
    .from("fill_blank_drills")
    .update({ title: name, description, segments, audio_urls: audioUrls })
    .eq("id", drillId);
  if (error) throw new Error(`Failed to update drill: ${error.message}`);

  revalidatePath(`/teacher/fill-blanks/${drillId}`);
  redirect(`/teacher/fill-blanks/${drillId}`);
}

export async function deleteFillBlankSegment(drillId: string, segmentIndex: number) {
  const supabase = await createClient();

  const { data: drill, error: fetchError } = await supabase
    .from("fill_blank_drills")
    .select("segments, audio_urls")
    .eq("id", drillId)
    .single();
  if (fetchError) throw new Error(`Failed to load drill: ${fetchError.message}`);

  const segments = (drill.segments as string[]).filter((_, i) => i !== segmentIndex);
  const audioUrls = ((drill.audio_urls as (string | null)[]) ?? []).filter(
    (_, i) => i !== segmentIndex
  );

  const { error } = await supabase
    .from("fill_blank_drills")
    .update({ segments, audio_urls: audioUrls })
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

  const { error: deleteError } = await supabase
    .from("fill_blank_assignments")
    .delete()
    .eq("drill_id", drillId);
  if (deleteError) {
    throw new Error(`Failed to clear previous assignment: ${deleteError.message}`);
  }

  await saveAssignments(supabase, drillId, formData);

  revalidatePath(`/teacher/fill-blanks/${drillId}`);
}
