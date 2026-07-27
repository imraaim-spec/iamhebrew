"use server";

import { createClient } from "@/lib/supabase/server";

export async function logListeningAttempt(
  exerciseId: string,
  correctCount: number,
  total: number,
  response?: unknown
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("listening_attempts").insert({
    student_id: user.id,
    exercise_id: exerciseId,
    correct_count: correctCount,
    total,
    response: response ?? null,
  });
}
