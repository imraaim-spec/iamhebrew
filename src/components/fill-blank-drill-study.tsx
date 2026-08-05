"use client";

import { useEffect, useMemo, useState } from "react";
import { logFillBlankAttempt } from "@/lib/actions/fill-blank-attempts";
import { parseClozeTemplate, normalizeAnswer } from "@/lib/cloze";

export function FillBlankDrillStudy({
  drillId,
  title,
  segments,
  audioUrls,
}: {
  drillId: string;
  title: string;
  segments: string[];
  audioUrls?: (string | null)[];
}) {
  const [index, setIndex] = useState(0);

  if (segments.length === 0) {
    return (
      <p className="text-text-muted">
        No pieces in this drill yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl">{title}</h1>
        <p className="text-sm text-text-faint">
          Piece {index + 1} of {segments.length}
        </p>
      </div>

      <FillBlankPiece
        key={index}
        drillId={drillId}
        segmentIndex={index}
        template={segments[index]}
        audioUrl={audioUrls?.[index] ?? null}
      />

      {segments.length > 1 && (
        <div className="flex justify-center gap-3">
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="rounded-sm border border-border px-4 py-2 text-sm text-text-muted disabled:opacity-40"
          >
            ‹ Previous
          </button>
          <button
            onClick={() => setIndex((i) => Math.min(segments.length - 1, i + 1))}
            disabled={index === segments.length - 1}
            className="rounded-sm border border-border px-4 py-2 text-sm text-text-muted disabled:opacity-40"
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
  audioUrl,
}: {
  drillId: string;
  segmentIndex: number;
  template: string;
  audioUrl: string | null;
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
  const [checked, setChecked] = useState<(boolean | null)[]>(() =>
    Array(blankCount).fill(null)
  );

  const blankAnswers = useMemo(
    () => segments.filter((s): s is { blank: true; answers: string[] } => "blank" in s),
    [segments]
  );

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(inputs));
  }, [inputs, storageKey]);

  function isBlankCorrect(blankIdx: number): boolean {
    const given = inputs[blankIdx] ?? "";
    if (given.trim() === "") return false;
    const normalizedGiven = normalizeAnswer(given);
    return blankAnswers[blankIdx].answers.some((a) => normalizeAnswer(a) === normalizedGiven);
  }

  function updateInput(blankIdx: number, value: string) {
    setInputs((prev) => {
      const next = [...prev];
      next[blankIdx] = value;
      return next;
    });
    setChecked((prev) => {
      const next = [...prev];
      next[blankIdx] = null;
      return next;
    });
  }

  function checkOne(blankIdx: number) {
    const result = isBlankCorrect(blankIdx);
    setChecked((prev) => {
      const next = [...prev];
      next[blankIdx] = result;
      return next;
    });
    logFillBlankAttempt(drillId, segmentIndex, result ? 1 : 0, 1, {
      inputs,
      blankIndex: blankIdx,
    });
  }

  function checkAll() {
    const results = blankAnswers.map((_, blankIdx) => isBlankCorrect(blankIdx));
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
    setChecked(Array(blankCount).fill(null));
  }

  function clear() {
    setInputs(Array(blankCount).fill(""));
    setChecked(Array(blankCount).fill(null));
  }

  let blankIndex = -1;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-bg-alt p-6">
      {audioUrl && <audio controls src={audioUrl} className="w-full" />}

      <p dir="rtl" className="whitespace-pre-wrap text-xl leading-loose">
        {segments.map((seg, i) => {
          if ("text" in seg) {
            return <span key={i}>{seg.text}</span>;
          }
          blankIndex++;
          const bi = blankIndex;
          const value = inputs[bi] ?? "";
          const isEmpty = value.trim() === "";
          const result = checked[bi];

          let style = "border-border";
          if (result !== null && !isEmpty) {
            style = result
              ? "border-green-500 bg-green-50"
              : "border-red-500 bg-red-50";
          }

          return (
            <span key={i} className="mx-1 inline-flex items-center gap-1 align-baseline">
              <input
                value={value}
                onChange={(e) => updateInput(bi, e.target.value)}
                dir="rtl"
                className={`inline-block w-48 rounded-sm border bg-surface px-3 py-1 text-center text-xl text-text ${style}`}
              />
              <button
                type="button"
                onClick={() => checkOne(bi)}
                disabled={isEmpty}
                title="בדוק תשובה זו"
                className="rounded-sm border border-border px-2 py-1 text-sm text-text-muted hover:bg-bg-alt disabled:opacity-40"
              >
                ✓
              </button>
            </span>
          );
        })}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={checkAll}
          className="rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent-hover"
        >
          בדוק הכל
        </button>
        <button
          onClick={showAnswers}
          className="rounded-sm border border-border px-4 py-2 text-sm text-text-muted hover:bg-bg-alt"
        >
          הצג תשובות
        </button>
        <button
          onClick={clear}
          className="rounded-sm border border-border px-4 py-2 text-sm text-text-muted hover:bg-bg-alt"
        >
          נקה
        </button>
        {checked.some((c) => c !== null) && (
          <span className="text-sm text-text-muted">
            נכון: {checked.filter(Boolean).length} מתוך {blankCount}
          </span>
        )}
      </div>
    </div>
  );
}
