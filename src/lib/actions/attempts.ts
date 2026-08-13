"use server";

import { createClient } from "@/lib/supabase/server";
import { applyReview, dueDateIso, newSchedule, type CardSchedule } from "@/lib/srs";

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

// Records the attempt and moves the card's spaced-repetition schedule on.
// `schedule` is false when a teacher is previewing a deck, so their practice
// runs don't create review schedules for themselves.
export async function reviewCard(cardId: string, knew: boolean, schedule: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("attempts").insert({
    student_id: user.id,
    card_id: cardId,
    is_correct: knew,
    response: null,
  });

  if (!schedule) return;

  const { data: existing } = await supabase
    .from("card_schedules")
    .select("interval_days, ease, repetitions, lapses")
    .eq("student_id", user.id)
    .eq("card_id", cardId)
    .maybeSingle();

  const current: CardSchedule = existing
    ? {
        intervalDays: existing.interval_days,
        ease: Number(existing.ease),
        repetitions: existing.repetitions,
        lapses: existing.lapses,
      }
    : newSchedule();

  const next = applyReview(current, knew);

  const { error } = await supabase.from("card_schedules").upsert(
    {
      student_id: user.id,
      card_id: cardId,
      interval_days: next.intervalDays,
      ease: next.ease,
      repetitions: next.repetitions,
      lapses: next.lapses,
      due_on: dueDateIso(next.intervalDays),
      last_reviewed_at: new Date().toISOString(),
    },
    { onConflict: "student_id,card_id" }
  );
  if (error) throw new Error(`Failed to save review schedule: ${error.message}`);
}
