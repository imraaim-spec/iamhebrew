"use client";

import { useState } from "react";
import { logAttempt } from "@/lib/actions/attempts";

type Flashcard = {
  id: string;
  content: { front: string; back: string; audio_url?: string };
};

type Question = {
  card: Flashcard;
  options: string[];
  correctAnswer: string;
};

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function buildQuestions(cards: Flashcard[]): Question[] {
  return shuffle(cards).map((card) => {
    const correctAnswer = card.content.back;
    // De-duplicate by text, not just by card id — two different cards
    // (or leftover duplicate test data) can share identical answer text,
    // which would otherwise produce two visually identical options.
    const uniqueOtherAnswers = Array.from(
      new Set(
        cards
          .filter((c) => c.id !== card.id && c.content.back !== correctAnswer)
          .map((c) => c.content.back)
      )
    );
    const distractors = shuffle(uniqueOtherAnswers).slice(0, 3);
    const options = shuffle([correctAnswer, ...distractors]);
    return { card, options, correctAnswer };
  });
}

export function MultipleChoiceStudy({ cards }: { cards: Flashcard[] }) {
  const [questions, setQuestions] = useState(() => buildQuestions(cards));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [done, setDone] = useState(false);

  if (cards.length < 2) {
    return (
      <p className="text-text-muted">
        Add at least 2 flashcards to this deck to use multiple choice mode.
      </p>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-xl font-medium">
          Done! {score.correct} / {score.total} correct
        </p>
        <button
          onClick={() => {
            setQuestions(buildQuestions(cards));
            setIndex(0);
            setSelected(null);
            setScore({ correct: 0, total: 0 });
            setDone(false);
          }}
          className="rounded-sm bg-accent px-5 py-2 text-sm font-semibold text-bg hover:bg-accent-hover"
        >
          Play again
        </button>
      </div>
    );
  }

  const question = questions[index];
  const answered = selected !== null;

  function choose(option: string) {
    if (answered) return;
    setSelected(option);
    const isCorrect = option === question.correctAnswer;
    setScore((s) => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      total: s.total + 1,
    }));
    logAttempt(question.card.id, isCorrect);
  }

  function next() {
    if (index + 1 >= questions.length) {
      setDone(true);
    } else {
      setIndex(index + 1);
      setSelected(null);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm text-text-faint">
        Question {index + 1} of {questions.length}
      </p>

      <div
        dir="auto"
        className="flex h-32 w-full max-w-md items-center justify-center rounded-lg border border-border bg-surface p-8 text-center text-2xl font-medium shadow-sm"
      >
        {question.card.content.front}
      </div>

      {question.card.content.audio_url && (
        <audio controls src={question.card.content.audio_url} className="h-8" />
      )}

      <div className="grid w-full max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
        {question.options.map((option) => {
          const isCorrectOption = option === question.correctAnswer;
          const isSelected = option === selected;

          let style = "border-border";
          if (answered && isCorrectOption) {
            style = "border-green-500 bg-green-50";
          } else if (answered && isSelected && !isCorrectOption) {
            style = "border-red-500 bg-red-50";
          }

          return (
            <button
              key={option}
              onClick={() => choose(option)}
              disabled={answered}
              dir="auto"
              className={`rounded-md border px-4 py-3 text-left ${style}`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {answered && (
        <button
          onClick={next}
          className="rounded-sm bg-accent px-5 py-2 text-sm font-semibold text-bg hover:bg-accent-hover"
        >
          Next
        </button>
      )}
    </div>
  );
}
