"use client";

import { useState } from "react";

const CARD_TYPES = [
  { value: "flashcard", label: "Flashcard" },
  { value: "fill_blank", label: "Fill in the blank" },
  { value: "multiple_choice", label: "Multiple choice" },
  { value: "audio_fill_blank", label: "Audio + fill in the blank" },
] as const;

const inputClass =
  "rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black";

export function CardForm({
  action,
}: {
  action: (formData: FormData) => void;
}) {
  const [type, setType] = useState<string>("flashcard");

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]"
    >
      <h2 className="font-medium">Add card</h2>

      <select
        name="type"
        value={type}
        onChange={(e) => setType(e.target.value)}
        className={inputClass}
      >
        {CARD_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      {type === "flashcard" && (
        <>
          <input
            name="front"
            placeholder="Front (Hebrew word/phrase)"
            required
            className={inputClass}
          />
          <input
            name="back"
            placeholder="Back (translation/answer)"
            required
            className={inputClass}
          />
          <label className="text-sm text-zinc-600 dark:text-zinc-400">
            Pronunciation audio override (optional — auto-generated from the
            front text if left blank)
            <input
              name="audio"
              type="file"
              accept="audio/*"
              className={`mt-1 block w-full ${inputClass}`}
            />
          </label>
        </>
      )}

      {type === "fill_blank" && (
        <>
          <input
            name="question"
            placeholder="Question, e.g. ___ shalom"
            required
            className={inputClass}
          />
          <input
            name="answer"
            placeholder="Correct answer"
            required
            className={inputClass}
          />
        </>
      )}

      {type === "multiple_choice" && (
        <>
          <input name="question" placeholder="Question" required className={inputClass} />
          <input name="option0" placeholder="Option 1" required className={inputClass} />
          <input name="option1" placeholder="Option 2" required className={inputClass} />
          <input name="option2" placeholder="Option 3 (optional)" className={inputClass} />
          <input name="option3" placeholder="Option 4 (optional)" className={inputClass} />
          <label className="text-sm text-zinc-600 dark:text-zinc-400">
            Correct option number (1-4)
            <input
              name="correctOption"
              type="number"
              min={1}
              max={4}
              defaultValue={1}
              required
              className={`mt-1 block ${inputClass}`}
            />
          </label>
        </>
      )}

      {type === "audio_fill_blank" && (
        <>
          <label className="text-sm text-zinc-600 dark:text-zinc-400">
            Audio (required) — the word or phrase the student will hear
            <input
              name="audio"
              type="file"
              accept="audio/*"
              required
              className={`mt-1 block w-full ${inputClass}`}
            />
          </label>
          <input
            name="question"
            placeholder="Question shown to student, e.g. Type what you hear"
            required
            className={inputClass}
          />
          <input
            name="answer"
            placeholder="Correct answer"
            required
            className={inputClass}
          />
        </>
      )}

      <button
        type="submit"
        className="self-start rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
      >
        Add card
      </button>
    </form>
  );
}
