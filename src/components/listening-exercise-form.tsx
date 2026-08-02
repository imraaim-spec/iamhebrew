"use client";

import { useState } from "react";
import { LANGUAGE_LABELS } from "@/lib/language";
import { SubmitButton } from "@/components/submit-button";

const inputClass = "rounded-sm border border-border bg-surface px-3 py-2 text-text";

export function ListeningExerciseForm({
  action,
}: {
  action: (formData: FormData) => void;
}) {
  const [audioSourceType, setAudioSourceType] = useState<
    "upload" | "youtube" | "none"
  >("upload");

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4"
    >
      <h2 className="font-heading font-bold">New listening exercise</h2>

      <input
        name="title"
        placeholder="Title, e.g. Ordering coffee"
        required
        className={inputClass}
      />

      <select name="language" defaultValue="" className={inputClass}>
        <option value="">Language (not set)</option>
        {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-1">
          <input
            type="radio"
            name="audio_source_type"
            value="upload"
            checked={audioSourceType === "upload"}
            onChange={() => setAudioSourceType("upload")}
          />
          Upload audio file
        </label>
        <label className="flex items-center gap-1">
          <input
            type="radio"
            name="audio_source_type"
            value="youtube"
            checked={audioSourceType === "youtube"}
            onChange={() => setAudioSourceType("youtube")}
          />
          YouTube link
        </label>
        <label className="flex items-center gap-1">
          <input
            type="radio"
            name="audio_source_type"
            value="none"
            checked={audioSourceType === "none"}
            onChange={() => setAudioSourceType("none")}
          />
          No audio (played on another device)
        </label>
      </div>

      {audioSourceType === "upload" && (
        <input name="audio" type="file" accept="audio/*" required className={inputClass} />
      )}

      {audioSourceType === "youtube" && (
        <>
          <input
            name="youtube_url"
            placeholder="YouTube link, e.g. https://youtube.com/watch?v=..."
            required
            className={inputClass}
          />
          <input
            name="youtube_start"
            type="number"
            min={0}
            placeholder="Start time in seconds (optional)"
            className={inputClass}
          />
        </>
      )}

      {audioSourceType === "none" && (
        <p className="text-sm text-text-muted">
          No player will be shown — use this when the student will listen on
          a separate device (e.g. you playing it in person, or a recording
          shared another way).
        </p>
      )}

      <label className="text-sm text-text-muted">
        Text with blanks — wrap the missing word(s) in square brackets; use a
        slash for more than one acceptable answer
        <textarea
          name="template"
          rows={4}
          required
          dir="auto"
          placeholder={"הילד [הולך/צועד] לבית הספר בבוקר."}
          className={`mt-1 block w-full font-mono text-sm ${inputClass}`}
        />
      </label>

      <SubmitButton
        pendingText="Uploading, don't click again..."
        className="self-start rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent-hover disabled:opacity-60"
      >
        Create exercise
      </SubmitButton>
    </form>
  );
}
