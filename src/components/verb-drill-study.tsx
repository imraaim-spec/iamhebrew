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
      <p className="text-text-muted">
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
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-bg-alt p-6">
      <div dir="auto">
        <div className="text-xl font-semibold">{drill.infinitive}</div>
        <div className="text-sm text-text-muted">
          {drill.translation} · {TENSE_LABELS[drill.tense]}
        </div>
      </div>

      <div dir="rtl" className="grid grid-cols-2 gap-3">
        {slots.map((slot) => {
          if (!drill.forms[slot.key]) return null;

          if (slot.key === blankKey) {
            return (
              <div key={slot.key} className="flex flex-col gap-1">
                <span className="text-sm text-text-faint">{slot.label}</span>
                <input
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    setCorrect(null);
                  }}
                  dir="rtl"
                  className={`rounded-sm border px-3 py-2 bg-surface text-text ${
                    correct === null
                      ? "border-border"
                      : correct
                      ? "border-green-500 bg-green-50"
                      : "border-red-500 bg-red-50"
                  }`}
                />
                {correct === false && (
                  <span className="text-xs text-text-faint">
                    Correct answer: {drill.forms[blankKey]}
                  </span>
                )}
              </div>
            );
          }

          const audioUrl = drill.audio_urls[slot.key];
          return (
            <div key={slot.key} className="flex flex-col gap-1">
              <span className="text-sm text-text-faint">{slot.label}</span>
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
          className="rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent-hover"
        >
          בדוק
        </button>
        <button
          onClick={next}
          className="rounded-sm border border-border px-4 py-2 text-sm text-text-muted hover:bg-bg-alt"
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
