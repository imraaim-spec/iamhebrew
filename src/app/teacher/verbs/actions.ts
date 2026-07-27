"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateHebrewAudioUrl } from "@/lib/tts";
import { TENSE_SLOTS } from "@/lib/hebrew-verbs";

export async function createVerbDrill(formData: FormData) {
  const infinitive = formData.get("infinitive") as string;
  const translation = formData.get("translation") as string;
  const tense = formData.get("tense") as string;
  if (!infinitive?.trim() || !translation?.trim() || !TENSE_SLOTS[tense]) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const forms: Record<string, string> = {};
  const audioUrls: Record<string, string> = {};

  for (const slot of TENSE_SLOTS[tense]) {
    const value = (formData.get(`form_${slot.key}`) as string)?.trim();
    if (!value) continue;
    forms[slot.key] = value;
    const audioUrl = await generateHebrewAudioUrl(supabase, "verbs", value);
    if (audioUrl) audioUrls[slot.key] = audioUrl;
  }

  // Need at least 2 forms to make a "fill in the missing one" drill.
  if (Object.keys(forms).length < 2) return;

  const { error } = await supabase.from("verb_drills").insert({
    infinitive,
    translation,
    tense,
    forms,
    audio_urls: audioUrls,
    created_by: user.id,
  });
  if (error) throw new Error(`Failed to save verb drill: ${error.message}`);

  revalidatePath("/teacher/verbs");
}

export async function deleteVerbDrill(id: string) {
  const supabase = await createClient();
  await supabase.from("verb_drills").delete().eq("id", id);
  revalidatePath("/teacher/verbs");
  redirect("/teacher/verbs");
}

export async function setVerbDrillAssignments(drillId: string, formData: FormData) {
  const supabase = await createClient();
  const everyone = formData.get("everyone") === "on";
  const studentIds = formData.getAll("students").map((v) => String(v));

  await supabase.from("verb_drill_assignments").delete().eq("drill_id", drillId);

  if (everyone) {
    await supabase
      .from("verb_drill_assignments")
      .insert({ drill_id: drillId, student_id: null });
  } else if (studentIds.length > 0) {
    await supabase.from("verb_drill_assignments").insert(
      studentIds.map((studentId) => ({ drill_id: drillId, student_id: studentId }))
    );
  }

  revalidatePath(`/teacher/verbs/${drillId}`);
}
