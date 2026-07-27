"use client";

import { useState } from "react";

const inputClass =
  "rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black";

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
      className="flex flex-col gap-3 rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]"
    >
      <h2 className="font-medium">New listening exercise</h2>

      <input
        name="title"
        placeholder="Title, e.g. Ordering coffee"
        required
        className={inputClass}
      />

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
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No player will be shown — use this when the student will listen on
          a separate device (e.g. you playing it in person, or a recording
          shared another way).
        </p>
      )}

      <label className="text-sm text-zinc-600 dark:text-zinc-400">
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

      <button
        type="submit"
        className="self-start rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
      >
        Create exercise
      </button>
    </form>
  );
}
