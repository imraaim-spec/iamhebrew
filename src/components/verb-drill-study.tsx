"use client";

import { useState } from "react";
import { normalizeAnswer } from "@/lib/cloze";
import { logVerbDrillAttempt } from "@/lib/actions/verb-drill-attempts";
import { TENSE_SLOTS, TENSE_LABELS } from "@/lib/hebrew-verbs";

type Drill = {
  id: string;
  infinitive: string;
  translation: string;
  tense: string;
  forms: Record<string, string>;
  audio_urls: Record<string, string>;
};

function pickRandomKey(keys: string[], exclude?: string): string {
  const pool = keys.length > 1 && exclude ? keys.filter((k) => k !== exclude) : keys;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function VerbDrillStudy({ drill }: { drill: Drill }) {
  const slots = TENSE_SLOTS[drill.tense] ?? [];
  const filledKeys = slots.map((s) => s.key).filter((k) => drill.forms[k]);

  const [blankKey, setBlankKey] = useState(() => pickRandomKey(filledKeys));
  const [value, setValue] = useState("");
  const [correct, setCorrect] = useState<boolean | null>(null);

  if (filledKeys.length < 2) {
    return (
      <p className="text-zinc-600 dark:text-zinc-400">
        This verb needs at least 2 filled-in forms to practice with.
      </p>
    );
  }

  function check() {
    const isCorrect = normalizeAnswer(value) === normalizeAnswer(drill.forms[blankKey]);
    setCorrect(isCorrect);
    logVerbDrillAttempt(drill.id, blankKey, isCorrect, value);
  }

  function next() {
    setBlankKey(pickRandomKey(filledKeys, blankKey));
    setValue("");
    setCorrect(null);
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-black/[.08] bg-[#fdfaf3] p-6 dark:border-white/[.145] dark:bg-zinc-900">
      <div dir="auto">
        <div className="text-xl font-semibold">{drill.infinitive}</div>
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          {drill.translation} · {TENSE_LABELS[drill.tense]}
        </div>
      </div>

      <div dir="rtl" className="grid grid-cols-2 gap-3">
        {slots.map((slot) => {
          if (!drill.forms[slot.key]) return null;

          if (slot.key === blankKey) {
            return (
              <div key={slot.key} className="flex flex-col gap-1">
                <span className="text-sm text-zinc-500">{slot.label}</span>
                <input
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    setCorrect(null);
                  }}
                  dir="rtl"
                  className={`rounded border px-3 py-2 dark:bg-black ${
                    correct === null
                      ? "border-black/[.15] dark:border-white/[.2]"
                      : correct
                      ? "border-green-500 bg-green-50 dark:bg-green-950"
                      : "border-red-500 bg-red-50 dark:bg-red-950"
                  }`}
                />
                {correct === false && (
                  <span className="text-xs text-zinc-500">
                    Correct answer: {drill.forms[blankKey]}
                  </span>
                )}
              </div>
            );
          }

          const audioUrl = drill.audio_urls[slot.key];
          return (
            <div key={slot.key} className="flex flex-col gap-1">
              <span className="text-sm text-zinc-500">{slot.label}</span>
              <div className="flex items-center gap-2">
                <span>{drill.forms[slot.key]}</span>
                {audioUrl && <audio controls src={audioUrl} className="h-6 max-w-[8rem]" />}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={check}
          className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          בדוק
        </button>
        <button
          onClick={next}
          className="rounded-full border border-black/[.08] px-4 py-2 text-sm dark:border-white/[.145]"
        >
          צורה הבאה
        </button>
        {correct !== null && drill.audio_urls[blankKey] && (
          <audio controls src={drill.audio_urls[blankKey]} className="h-8" />
        )}
      </div>
    </div>
  );
}
