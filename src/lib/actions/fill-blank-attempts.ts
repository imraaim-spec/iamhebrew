"use server";

import { createClient } from "@/lib/supabase/server";

export async function logFillBlankAttempt(
  drillId: string,
  segmentIndex: number,
  correctCount: number,
  total: number,
  response?: unknown
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("fill_blank_attempts").insert({
    student_id: user.id,
    drill_id: drillId,
    segment_index: segmentIndex,
    correct_count: correctCount,
    total,
    response: response ?? null,
  });
}
