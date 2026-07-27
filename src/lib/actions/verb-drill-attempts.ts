"use server";

import { createClient } from "@/lib/supabase/server";

export async function logVerbDrillAttempt(
  drillId: string,
  formKey: string,
  isCorrect: boolean,
  givenAnswer: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("verb_drill_attempts").insert({
    student_id: user.id,
    drill_id: drillId,
    form_key: formKey,
    is_correct: isCorrect,
    given_answer: givenAnswer,
  });
}
