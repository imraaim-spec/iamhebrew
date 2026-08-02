"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateHebrewAudioUrl, generateFillBlankAudioUrls } from "@/lib/tts";
import { parseFillBlankSegments } from "@/lib/cloze";
import { parseFlashcardLines } from "@/lib/flashcards";
import { uploadListeningAudio } from "@/app/teacher/listening/actions";

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

export async function createDeckForStudent(studentId: string, formData: FormData) {
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const language = (formData.get("language") as string) || null;
  const raw = (formData.get("cards") as string) || "";
  if (!title) return;

  const cards = parseFlashcardLines(raw);
  if (cards.length === 0) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: deck, error } = await supabase
    .from("decks")
    .insert({ title, description, language, created_by: user.id })
    .select("id")
    .single();
  if (error) throw new Error(`Failed to create deck: ${error.message}`);

  for (const { front, back } of cards) {
    const audioUrl = await generateHebrewAudioUrl(supabase, deck.id, front);
    const content = { front, back, ...(audioUrl ? { audio_url: audioUrl } : {}) };
    const { error: cardError } = await supabase
      .from("cards")
      .insert({ deck_id: deck.id, type: "flashcard", content });
    if (cardError) throw new Error(`Failed to save card: ${cardError.message}`);
  }

  const { error: assignError } = await supabase
    .from("assignments")
    .insert({ deck_id: deck.id, student_id: studentId });
  if (assignError) throw new Error(`Failed to assign deck: ${assignError.message}`);

  revalidatePath(`/teacher/students/${studentId}/progress`);
  revalidatePath("/student");
}

export async function createFillBlankDrillForStudent(studentId: string, formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const language = (formData.get("language") as string) || null;
  const raw = (formData.get("batch") as string) || "";
  if (!name) return;

  const segments = parseFillBlankSegments(raw);
  if (segments.length === 0) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const audioUrls = await generateFillBlankAudioUrls(supabase, segments);

  const { data: drill, error } = await supabase
    .from("fill_blank_drills")
    .insert({
      title: name,
      description,
      segments,
      audio_urls: audioUrls,
      language,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error) throw new Error(`Failed to save drill: ${error.message}`);

  const { error: assignError } = await supabase
    .from("fill_blank_assignments")
    .insert({ drill_id: drill.id, student_id: studentId });
  if (assignError) throw new Error(`Failed to assign drill: ${assignError.message}`);

  revalidatePath(`/teacher/students/${studentId}/progress`);
  revalidatePath("/student");
}

export async function createListeningExerciseForStudent(
  studentId: string,
  formData: FormData
) {
  const title = (formData.get("title") as string)?.trim();
  const template = (formData.get("template") as string)?.trim();
  const language = (formData.get("language") as string) || null;
  if (!title || !template) return;

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

  const { data: exercise, error } = await supabase
    .from("listening_exercises")
    .insert({
      title,
      template,
      audio_url: audioUrl,
      youtube_url: youtubeUrl,
      youtube_start: youtubeStart,
      language,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error) throw new Error(`Failed to create exercise: ${error.message}`);

  const { error: assignError } = await supabase
    .from("listening_assignments")
    .insert({ exercise_id: exercise.id, student_id: studentId });
  if (assignError) throw new Error(`Failed to assign exercise: ${assignError.message}`);

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
