"use server";

import { createClient } from "@/lib/supabase/server";

export async function logAttempt(
  cardId: string,
  isCorrect: boolean,
  response?: unknown
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("attempts").insert({
    student_id: user.id,
    card_id: cardId,
    is_correct: isCorrect,
    response: response ?? null,
  });
}
