"use client";

import { useState } from "react";
import { FlashcardStudy } from "@/components/flashcard-study";
import { MultipleChoiceStudy } from "@/components/multiple-choice-study";

type Flashcard = {
  id: string;
  content: { front: string; back: string; audio_url?: string };
};

export function StudySession({ cards }: { cards: Flashcard[] }) {
  const [mode, setMode] = useState<"flashcards" | "multiple_choice">(
    "flashcards"
  );

  const tabClass = (active: boolean) =>
    `rounded-full px-4 py-2 text-sm font-medium ${
      active
        ? "bg-foreground text-background"
        : "border border-black/[.08] dark:border-white/[.145]"
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
        <FlashcardStudy cards={cards} />
      ) : (
        <MultipleChoiceStudy cards={cards} />
      )}
    </div>
  );
}
