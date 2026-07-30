"use client";

import { useEffect, useMemo, useState } from "react";
import { logListeningAttempt } from "@/lib/actions/listening-attempts";
import { parseClozeTemplate, normalizeAnswer, getYouTubeEmbedUrl } from "@/lib/cloze";

type ListeningExercise = {
  id: string;
  template: string;
  audio_url: string | null;
  youtube_url: string | null;
  youtube_start: number | null;
};

export function ClozeListeningStudy({ exercise }: { exercise: ListeningExercise }) {
  const segments = useMemo(
    () => parseClozeTemplate(exercise.template),
    [exercise.template]
  );
  const blankCount = segments.filter((s) => "blank" in s).length;
  const storageKey = `listening:${exercise.id}`;

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
    logListeningAttempt(exercise.id, correctCount, blankCount, { inputs });
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

  const embedUrl = exercise.youtube_url
    ? getYouTubeEmbedUrl(exercise.youtube_url, exercise.youtube_start ?? undefined)
    : null;

  let blankIndex = -1;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-bg-alt p-6">
      {exercise.audio_url && (
        <audio controls src={exercise.audio_url} className="w-full" />
      )}

      {!exercise.audio_url && !embedUrl && (
        <p className="text-sm text-text-faint">
          🎧 Listen on your other device, then fill in what you hear.
        </p>
      )}

      {embedUrl && (
        <div className="aspect-video w-full overflow-hidden rounded-md">
          <iframe
            src={embedUrl}
            className="h-full w-full"
            allow="accelerate-encryption; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

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

          let style = "border-border";
          if (checked !== null && !isEmpty) {
            style = isCorrect
              ? "border-green-500 bg-green-50"
              : "border-red-500 bg-red-50";
          }

          return (
            <input
              key={i}
              value={value}
              onChange={(e) => updateInput(bi, e.target.value)}
              dir="rtl"
              className={`mx-1 inline-block w-48 rounded-sm border bg-surface px-3 py-1 text-center align-baseline text-xl text-text ${style}`}
            />
          );
        })}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={check}
          className="rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent-hover"
        >
          בדוק
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
        {checked && (
          <span className="text-sm text-text-muted">
            נכון: {checked.filter(Boolean).length} מתוך {blankCount}
          </span>
        )}
      </div>
    </div>
  );
}
