"use client";

import { useState } from "react";
import { logAttempt } from "@/lib/actions/attempts";

type Flashcard = {
  id: string;
  content: { front: string; back: string; audio_url?: string };
};

export function FlashcardStudy({ cards }: { cards: Flashcard[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState({ knew: 0, total: 0 });
  const [done, setDone] = useState(false);

  if (cards.length === 0) {
    return (
      <p className="text-zinc-600 dark:text-zinc-400">
        No flashcards in this deck yet.
      </p>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-xl font-medium">
          Done! {results.knew} / {results.total} known
        </p>
        <button
          onClick={() => {
            setIndex(0);
            setFlipped(false);
            setResults({ knew: 0, total: 0 });
            setDone(false);
          }}
          className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background"
        >
          Study again
        </button>
      </div>
    );
  }

  const card = cards[index];

  async function mark(knew: boolean) {
    await logAttempt(card.id, knew);
    setResults((r) => ({ knew: r.knew + (knew ? 1 : 0), total: r.total + 1 }));
    if (index + 1 >= cards.length) {
      setDone(true);
    } else {
      setIndex(index + 1);
      setFlipped(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm text-zinc-500">
        Card {index + 1} of {cards.length}
      </p>

      <button
        onClick={() => setFlipped((f) => !f)}
        dir="auto"
        className="flex h-56 w-full max-w-md items-center justify-center rounded-2xl border border-black/[.08] bg-white p-8 text-center text-2xl font-medium shadow-sm dark:border-white/[.145] dark:bg-zinc-900"
      >
        {flipped ? card.content.back : card.content.front}
      </button>

      {card.content.audio_url && (
        <audio controls src={card.content.audio_url} className="h-8" />
      )}

      <p className="text-sm text-zinc-500">Tap the card to flip it</p>

      {flipped && (
        <div className="flex gap-4">
          <button
            onClick={() => mark(false)}
            className="rounded-full border border-red-400 px-5 py-2 text-sm font-medium text-red-600 dark:text-red-400"
          >
            Didn&apos;t know
          </button>
          <button
            onClick={() => mark(true)}
            className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background"
          >
            Knew it
          </button>
        </div>
      )}
    </div>
  );
}
