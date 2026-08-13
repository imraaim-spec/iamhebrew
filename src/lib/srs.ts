// Spaced repetition scheduling, SM-2 (the SuperMemo/Anki algorithm).
//
// The study UI only offers "Know" / "Don't know", so the six-point quality
// scale SM-2 expects is collapsed to two points: a plain successful recall
// (4) and a failure (2). Anything below 3 resets the card, which is what
// makes a forgotten word come back tomorrow instead of weeks later.
//
// "Know" is deliberately 4 rather than 5: 5 means "perfect, no hesitation"
// and nudges the ease up every single time, which compounds into absurd
// gaps (a word answered right 7 times would vanish for ~4 years). At 4 the
// ease holds steady and only failures pull it down.

export type CardSchedule = {
  intervalDays: number;
  ease: number;
  repetitions: number;
  lapses: number;
};

export const INITIAL_EASE = 2.5;
export const MIN_EASE = 1.3;

// A year is long enough to count as "known for good" in a tutoring context,
// and keeps a word from disappearing for years on end.
export const MAX_INTERVAL_DAYS = 365;

// Once a card's interval passes this, it's considered properly learned
// rather than still being drilled.
export const MATURE_INTERVAL_DAYS = 21;

export function newSchedule(): CardSchedule {
  return { intervalDays: 0, ease: INITIAL_EASE, repetitions: 0, lapses: 0 };
}

export function applyReview(current: CardSchedule, knew: boolean): CardSchedule {
  const quality = knew ? 4 : 2;
  const gap = 5 - quality;
  const ease = Math.max(MIN_EASE, current.ease + (0.1 - gap * (0.08 + gap * 0.02)));

  if (!knew) {
    return { intervalDays: 1, ease, repetitions: 0, lapses: current.lapses + 1 };
  }

  const repetitions = current.repetitions + 1;
  let intervalDays: number;
  if (repetitions === 1) intervalDays = 1;
  else if (repetitions === 2) intervalDays = 6;
  else intervalDays = Math.round(current.intervalDays * ease);

  return {
    intervalDays: Math.min(MAX_INTERVAL_DAYS, Math.max(1, intervalDays)),
    ease,
    repetitions,
    lapses: current.lapses,
  };
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function dueDateIso(intervalDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + intervalDays);
  return d.toISOString().slice(0, 10);
}
