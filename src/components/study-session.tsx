"use client";

import { useState } from "react";
import { FlashcardStudy } from "@/components/flashcard-study";
import { MultipleChoiceStudy } from "@/components/multiple-choice-study";

type Flashcard = {
  id: string;
  content: { front: string; back: string; audio_url?: string };
};

export function StudySession({
  cards,
  dueCardIds,
  srsEnabled = false,
}: {
  cards: Flashcard[];
  dueCardIds?: string[];
  srsEnabled?: boolean;
}) {
  const [mode, setMode] = useState<"flashcards" | "multiple_choice">(
    "flashcards"
  );

  const tabClass = (active: boolean) =>
    `rounded-sm px-4 py-2 text-sm font-semibold ${
      active
        ? "bg-accent text-bg"
        : "border border-border text-text-muted"
    }`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-center gap-2">
        <button onClick={() => setMode("flashcards")} className={tabClass(mode === "flashcards")}>
          Flashcards
        </button>
        <button
          onClick={() => setMode("multiple_choice")}
          className={tabClass(mode === "multiple_choice")}
        >
          Multiple choice
        </button>
      </div>

      {mode === "flashcards" ? (
        <FlashcardStudy
          cards={cards}
          dueCardIds={dueCardIds}
          srsEnabled={srsEnabled}
        />
      ) : (
        <MultipleChoiceStudy cards={cards} />
      )}
    </div>
  );
}
