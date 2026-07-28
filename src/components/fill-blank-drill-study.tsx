"use client";

import { useEffect, useMemo, useState } from "react";
import { logFillBlankAttempt } from "@/lib/actions/fill-blank-attempts";
import { parseClozeTemplate, normalizeAnswer } from "@/lib/cloze";

export function FillBlankDrillStudy({
  drillId,
  title,
  segments,
}: {
  drillId: string;
  title: string;
  segments: string[];
}) {
  const [index, setIndex] = useState(0);

  if (segments.length === 0) {
    return (
      <p className="text-zinc-600 dark:text-zinc-400">
        No pieces in this drill yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-zinc-500">
          Piece {index + 1} of {segments.length}
        </p>
      </div>

      <FillBlankPiece
        key={index}
        drillId={drillId}
        segmentIndex={index}
        template={segments[index]}
      />

      {segments.length > 1 && (
        <div className="flex justify-center gap-3">
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="rounded-full border border-black/[.08] px-4 py-2 text-sm disabled:opacity-40 dark:border-white/[.145]"
          >
            ‹ Previous
          </button>
          <button
            onClick={() => setIndex((i) => Math.min(segments.length - 1, i + 1))}
            disabled={index === segments.length - 1}
            className="rounded-full border border-black/[.08] px-4 py-2 text-sm disabled:opacity-40 dark:border-white/[.145]"
          >
            Next ›
          </button>
        </div>
      )}
    </div>
  );
}

function FillBlankPiece({
  drillId,
  segmentIndex,
  template,
}: {
  drillId: string;
  segmentIndex: number;
  template: string;
}) {
  const segments = useMemo(() => parseClozeTemplate(template), [template]);
  const blankCount = segments.filter((s) => "blank" in s).length;
  const storageKey = `fillblank:${drillId}:${segmentIndex}`;

  const [inputs, setInputs] = useState<string[]>(() => {
    if (typeof window === "undefined") return Array(blankCount).fill("");
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === blankCount) return parsed;
      }
    } catch {
      // ignore malformed/unavailable storage
    }
    return Array(blankCount).fill("");
  });
  const [checked, setChecked] = useState<boolean[] | null>(null);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(inputs));
  }, [inputs, storageKey]);

  function updateInput(blankIdx: number, value: string) {
    setInputs((prev) => {
      const next = [...prev];
      next[blankIdx] = value;
      return next;
    });
    setChecked(null);
  }

  function check() {
    let blankIdx = -1;
    const results = segments
      .filter((s): s is { blank: true; answers: string[] } => "blank" in s)
      .map((seg) => {
        blankIdx++;
        const given = inputs[blankIdx] ?? "";
        if (given.trim() === "") return false;
        const normalizedGiven = normalizeAnswer(given);
        return seg.answers.some((a) => normalizeAnswer(a) === normalizedGiven);
      });
    setChecked(results);

    const correctCount = results.filter(Boolean).length;
    logFillBlankAttempt(drillId, segmentIndex, correctCount, blankCount, { inputs });
  }

  function showAnswers() {
    const newInputs: string[] = [];
    let blankIdx = -1;
    for (const seg of segments) {
      if ("blank" in seg) {
        blankIdx++;
        newInputs[blankIdx] = seg.answers[0];
      }
    }
    setInputs(newInputs);
    setChecked(null);
  }

  function clear() {
    setInputs(Array(blankCount).fill(""));
    setChecked(null);
  }

  let blankIndex = -1;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-black/[.08] bg-[#fdfaf3] p-6 dark:border-white/[.145] dark:bg-zinc-900">
      <p dir="rtl" className="whitespace-pre-wrap text-xl leading-loose">
        {segments.map((seg, i) => {
          if ("text" in seg) {
            return <span key={i}>{seg.text}</span>;
          }
          blankIndex++;
          const bi = blankIndex;
          const value = inputs[bi] ?? "";
          const isEmpty = value.trim() === "";
          const isCorrect = checked?.[bi];

          let style = "border-black/[.15] dark:border-white/[.2]";
          if (checked !== null && !isEmpty) {
            style = isCorrect
              ? "border-green-500 bg-green-50 dark:bg-green-950"
              : "border-red-500 bg-red-50 dark:bg-red-950";
          }

          return (
            <input
              key={i}
              value={value}
              onChange={(e) => updateInput(bi, e.target.value)}
              dir="rtl"
              className={`mx-1 inline-block w-48 rounded border bg-white px-3 py-1 text-center align-baseline text-xl dark:bg-black ${style}`}
            />
          );
        })}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={check}
          className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          בדוק
        </button>
        <button
          onClick={showAnswers}
          className="rounded-full border border-black/[.08] px-4 py-2 text-sm dark:border-white/[.145]"
        >
          הצג תשובות
        </button>
        <button
          onClick={clear}
          className="rounded-full border border-black/[.08] px-4 py-2 text-sm dark:border-white/[.145]"
        >
          נקה
        </button>
        {checked && (
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            נכון: {checked.filter(Boolean).length} מתוך {blankCount}
          </span>
        )}
      </div>
    </div>
  );
}
