"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createDeck(formData: FormData) {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const language = (formData.get("language") as string) || null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("decks").insert({
    title,
    description: description || null,
    language,
    created_by: user.id,
  });

  revalidatePath("/teacher/decks");
}

export async function updateDeck(deckId: string, formData: FormData) {
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const language = (formData.get("language") as string) || null;
  if (!title) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("decks")
    .update({ title, description, language })
    .eq("id", deckId);
  if (error) throw new Error(`Failed to update deck: ${error.message}`);

  revalidatePath(`/teacher/decks/${deckId}`);
  revalidatePath("/teacher/decks");
}
