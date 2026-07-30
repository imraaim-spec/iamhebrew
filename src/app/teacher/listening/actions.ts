"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { syncItemAssignments } from "@/lib/assignment-sync";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function uploadListeningAudio(
  supabase: SupabaseServerClient,
  formData: FormData
): Promise<string | null> {
  const file = formData.get("audio");
  if (!(file instanceof File) || file.size === 0) return null;

  const ext = file.name.split(".").pop() || "mp3";
  const path = `listening/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("audio")
    .upload(path, file, { contentType: file.type });
  if (error) throw new Error(`Failed to upload audio: ${error.message}`);

  const { data } = supabase.storage.from("audio").getPublicUrl(path);
  return data.publicUrl;
}

export async function createListeningExercise(formData: FormData) {
  const title = formData.get("title") as string;
  const template = formData.get("template") as string;
  if (!title?.trim() || !template?.trim()) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const audioSourceType = formData.get("audio_source_type") as string;

  let audioUrl: string | null = null;
  let youtubeUrl: string | null = null;
  let youtubeStart: number | null = null;

  if (audioSourceType === "youtube") {
    youtubeUrl = (formData.get("youtube_url") as string)?.trim() || null;
    if (!youtubeUrl) return;
    const startRaw = formData.get("youtube_start") as string;
    youtubeStart = startRaw ? Number(startRaw) : null;
  } else if (audioSourceType === "upload") {
    audioUrl = await uploadListeningAudio(supabase, formData);
    if (!audioUrl) return;
  }
  // audioSourceType === "none": leave audioUrl/youtubeUrl null — the
  // student will listen on a separate device.

  await supabase.from("listening_exercises").insert({
    title,
    template,
    audio_url: audioUrl,
    youtube_url: youtubeUrl,
    youtube_start: youtubeStart,
    created_by: user.id,
  });

  revalidatePath("/teacher/listening");
}

export async function deleteListeningExercise(id: string) {
  const supabase = await createClient();
  await supabase.from("listening_exercises").delete().eq("id", id);
  revalidatePath("/teacher/listening");
  redirect("/teacher/listening");
}

export async function setListeningAssignments(exerciseId: string, formData: FormData) {
  const supabase = await createClient();
  const everyone = formData.get("everyone") === "on";
  const checkedStudentIds = new Set(formData.getAll("students").map((v) => String(v)));

  await syncItemAssignments(supabase, {
    assignmentTable: "listening_assignments",
    idColumn: "exercise_id",
    itemType: "listening",
    itemId: exerciseId,
    everyone,
    checkedStudentIds,
  });

  revalidatePath(`/teacher/listening/${exerciseId}`);
  revalidatePath("/student");
}
