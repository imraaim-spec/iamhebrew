"use client";

import { useState } from "react";
import { reviewCard } from "@/lib/actions/attempts";

type Flashcard = {
  id: string;
  content: { front: string; back: string; audio_url?: string };
};

export function FlashcardStudy({
  cards,
  dueCardIds,
  srsEnabled = false,
}: {
  cards: Flashcard[];
  dueCardIds?: string[];
  srsEnabled?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState({ knew: 0, total: 0 });
  const [done, setDone] = useState(false);
  const [practiseAll, setPractiseAll] = useState(false);

  const dueSet = new Set(dueCardIds ?? []);
  const queue =
    srsEnabled && !practiseAll ? cards.filter((c) => dueSet.has(c.id)) : cards;

  if (cards.length === 0) {
    return (
      <p className="text-text-muted">
        No flashcards in this deck yet.
      </p>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-xl font-medium">Nothing due today 🎉</p>
        <p className="text-sm text-text-muted">
          These words are scheduled for later — coming back to them only when
          they&apos;re about to slip is what makes them stick.
        </p>
        <button
          onClick={() => {
            setPractiseAll(true);
            setIndex(0);
            setFlipped(false);
            setResults({ knew: 0, total: 0 });
          }}
          className="rounded-sm border border-border px-5 py-2 text-sm font-semibold text-text-muted hover:bg-bg-alt"
        >
          Practise the whole deck anyway
        </button>
      </div>
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
            setPractiseAll(true);
            setIndex(0);
            setFlipped(false);
            setResults({ knew: 0, total: 0 });
            setDone(false);
          }}
          className="rounded-sm bg-accent px-5 py-2 text-sm font-semibold text-bg hover:bg-accent-hover"
        >
          Study again
        </button>
      </div>
    );
  }

  const card = queue[index];

  function goTo(newIndex: number) {
    if (newIndex < 0 || newIndex >= queue.length) return;
    setIndex(newIndex);
    setFlipped(false);
  }

  async function mark(knew: boolean) {
    await reviewCard(card.id, knew, srsEnabled);
    setResults((r) => ({ knew: r.knew + (knew ? 1 : 0), total: r.total + 1 }));
    if (index + 1 >= queue.length) {
      setDone(true);
    } else {
      setIndex(index + 1);
      setFlipped(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm text-text-faint">
        Card {index + 1} of {queue.length}
      </p>

      <div className="flex w-full max-w-md items-center gap-3">
        <button
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          aria-label="Previous card"
          className="shrink-0 rounded-sm border border-border px-3 py-2 text-lg disabled:opacity-30"
        >
          ‹
        </button>

        <button
          onClick={() => setFlipped((f) => !f)}
          dir="auto"
          className="flex h-56 flex-1 items-center justify-center rounded-lg border border-border bg-surface p-8 text-center text-2xl font-medium shadow-sm"
        >
          {flipped ? card.content.back : card.content.front}
        </button>

        <button
          onClick={() => goTo(index + 1)}
          disabled={index === queue.length - 1}
          aria-label="Next card"
          className="shrink-0 rounded-sm border border-border px-3 py-2 text-lg disabled:opacity-30"
        >
          ›
        </button>
      </div>

      {card.content.audio_url && (
        <audio controls src={card.content.audio_url} className="h-8" />
      )}

      <p className="text-sm text-text-faint">Tap the card to flip it</p>

      <div className="flex gap-4">
        <button
          onClick={() => mark(false)}
          className="rounded-sm border border-red-400 px-5 py-2 text-sm font-semibold text-red-600"
        >
          Don&apos;t know
        </button>
        <button
          onClick={() => mark(true)}
          className="rounded-sm bg-accent px-5 py-2 text-sm font-semibold text-bg hover:bg-accent-hover"
        >
          Know
        </button>
      </div>
    </div>
  );
}
