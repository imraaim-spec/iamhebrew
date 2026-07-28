"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function uploadAudioIfPresent(
  supabase: SupabaseServerClient,
  deckId: string,
  formData: FormData
): Promise<string | null> {
  const file = formData.get("audio");
  if (!(file instanceof File) || file.size === 0) return null;

  const ext = file.name.split(".").pop() || "webm";
  const path = `${deckId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("audio")
    .upload(path, file, { contentType: file.type });

  if (error) throw new Error(`Failed to upload audio: ${error.message}`);

  const { data } = supabase.storage.from("audio").getPublicUrl(path);
  return data.publicUrl;
}

// Auto-generates pronunciation audio for a Hebrew flashcard when the
// teacher didn't upload their own — used only for flashcards, since
// listening drills (audio_fill_blank) need real, uploaded audio.
async function generateHebrewAudioUrl(
  supabase: SupabaseServerClient,
  deckId: string,
  text: string
): Promise<string | null> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey || !text.trim()) return null;

  try {
    const res = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text },
          voice: { languageCode: "he-IL", name: "he-IL-Standard-A" },
          audioConfig: { audioEncoding: "MP3" },
        }),
      }
    );
    if (!res.ok) {
      console.error("TTS request failed", res.status, await res.text());
      return null;
    }

    const { audioContent } = (await res.json()) as { audioContent?: string };
    if (!audioContent) {
      console.error("TTS response had no audioContent");
      return null;
    }

    const buffer = Buffer.from(audioContent, "base64");
    const path = `${deckId}/${crypto.randomUUID()}.mp3`;

    const { error } = await supabase.storage
      .from("audio")
      .upload(path, buffer, { contentType: "audio/mpeg" });
    if (error) {
      console.error("TTS audio upload failed", error.message);
      return null;
    }

    const { data } = supabase.storage.from("audio").getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.error("TTS generation threw", err);
    return null;
  }
}

export async function createCard(deckId: string, formData: FormData) {
  const type = formData.get("type") as string;
  const supabase = await createClient();
  let content: Record<string, unknown>;

  if (type === "flashcard") {
    const front = formData.get("front") as string;
    const back = formData.get("back") as string;
    const audioUrl =
      (await uploadAudioIfPresent(supabase, deckId, formData)) ??
      (await generateHebrewAudioUrl(supabase, deckId, front));
    content = {
      front,
      back,
      ...(audioUrl ? { audio_url: audioUrl } : {}),
    };
  } else if (type === "fill_blank") {
    content = {
      question: formData.get("question") as string,
      answer: formData.get("answer") as string,
    };
  } else if (type === "multiple_choice") {
    const options = [
      formData.get("option0"),
      formData.get("option1"),
      formData.get("option2"),
      formData.get("option3"),
    ].filter((o): o is FormDataEntryValue => !!o && String(o).trim() !== "") as string[];

    content = {
      question: formData.get("question") as string,
      options,
      correctIndex: Number(formData.get("correctOption")) - 1,
    };
  } else if (type === "audio_fill_blank") {
    const audioUrl = await uploadAudioIfPresent(supabase, deckId, formData);
    if (!audioUrl) return;
    content = {
      question: formData.get("question") as string,
      answer: formData.get("answer") as string,
      audio_url: audioUrl,
    };
  } else {
    return;
  }

  await supabase.from("cards").insert({ deck_id: deckId, type, content });

  revalidatePath(`/teacher/decks/${deckId}`);
}

export async function createFlashcardsBulk(deckId: string, formData: FormData) {
  const raw = (formData.get("cards") as string) || "";
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const supabase = await createClient();

  for (const line of lines) {
    // Tab comes for free when pasting two spreadsheet columns; "|" is the
    // manual fallback since typing a real tab in a textarea just moves
    // focus. Comma is deliberately NOT used as a separator — Hebrew,
    // Russian, and English text all commonly contain commas of their own,
    // which would otherwise split a phrase in the wrong place.
    const separator = line.includes("\t") ? "\t" : "|";
    const [frontRaw, ...rest] = line.split(separator);
    const front = frontRaw?.trim();
    const back = rest.join(separator).trim();
    if (!front || !back) continue;

    const audioUrl = await generateHebrewAudioUrl(supabase, deckId, front);
    const content = {
      front,
      back,
      ...(audioUrl ? { audio_url: audioUrl } : {}),
    };

    await supabase.from("cards").insert({ deck_id: deckId, type: "flashcard", content });
  }

  revalidatePath(`/teacher/decks/${deckId}`);
}

export async function setDeckAssignments(deckId: string, formData: FormData) {
  const supabase = await createClient();
  const everyone = formData.get("everyone") === "on";
  const studentIds = formData.getAll("students").map((v) => String(v));

  // Replace the whole assignment set for this deck each time — simplest
  // way to keep it consistent with whatever's checked in the form.
  const { error: deleteError } = await supabase
    .from("assignments")
    .delete()
    .eq("deck_id", deckId);
  if (deleteError) {
    throw new Error(`Failed to clear previous assignment: ${deleteError.message}`);
  }

  if (everyone) {
    const { error } = await supabase
      .from("assignments")
      .insert({ deck_id: deckId, student_id: null });
    if (error) throw new Error(`Failed to save assignment: ${error.message}`);
  } else if (studentIds.length > 0) {
    const { error } = await supabase.from("assignments").insert(
      studentIds.map((studentId) => ({
        deck_id: deckId,
        student_id: studentId,
        custom_name: (formData.get(`custom_name_${studentId}`) as string)?.trim() || null,
      }))
    );
    if (error) throw new Error(`Failed to save assignment: ${error.message}`);
  }

  revalidatePath(`/teacher/decks/${deckId}`);
}

export async function deleteCard(cardId: string, deckId: string) {
  const supabase = await createClient();
  await supabase.from("cards").delete().eq("id", cardId);
  revalidatePath(`/teacher/decks/${deckId}`);
}

export async function deleteDeck(deckId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("decks").delete().eq("id", deckId);
  if (error) throw new Error(`Failed to delete deck: ${error.message}`);
  revalidatePath("/teacher/decks");
  redirect("/teacher/decks");
}
