"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createDeck(formData: FormData) {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("decks").insert({
    title,
    description: description || null,
    created_by: user.id,
  });

  revalidatePath("/teacher/decks");
}
