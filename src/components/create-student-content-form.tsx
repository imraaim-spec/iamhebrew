"use client";

import { useState } from "react";
import { LANGUAGE_LABELS } from "@/lib/language";
import { SubmitButton } from "@/components/submit-button";

const inputClass = "rounded-sm border border-border bg-surface px-3 py-2 text-text";

function LanguageSelect({ defaultLanguage }: { defaultLanguage?: string | null }) {
  return (
    <select name="language" defaultValue={defaultLanguage ?? ""} className={inputClass}>
      <option value="">Language (not set)</option>
      {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}

export function CreateStudentContentForm({
  createDeckAction,
  createFillBlankAction,
  createListeningAction,
  defaultLanguage,
}: {
  createDeckAction: (formData: FormData) => void;
  createFillBlankAction: (formData: FormData) => void;
  createListeningAction: (formData: FormData) => void;
  defaultLanguage?: string | null;
}) {
  const [type, setType] = useState("");
  const [audioSourceType, setAudioSourceType] = useState<"upload" | "youtube" | "none">(
    "upload"
  );

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
      <h2 className="font-heading font-bold">Create new content for this student</h2>
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className={inputClass}
      >
        <option value="">Choose a type to create...</option>
        <option value="deck">Flash Cards</option>
        <option value="fillblank">Fill in the Blanks</option>
        <option value="listening">Listening Exercise</option>
      </select>

      {type === "deck" && (
        <form
          action={createDeckAction}
          className="flex flex-col gap-3 border-t border-border pt-3"
        >
          <input
            name="title"
            placeholder="Title, e.g. Lesson 5 — Verbs"
            required
            className={inputClass}
          />
          <textarea
            name="description"
            placeholder="Description (optional)"
            className={inputClass}
          />
          <LanguageSelect defaultLanguage={defaultLanguage} />
          <p className="text-sm text-text-muted">
            Paste one word/phrase per line — Hebrew and its translation.
            Pasting two columns straight from a spreadsheet works
            automatically; if typing by hand, separate the two with a pipe
            symbol ( | ). Pronunciation audio is generated automatically.
          </p>
          <textarea
            name="cards"
            rows={6}
            placeholder={"שלום | Hello"}
            required
            dir="auto"
            className={`font-mono text-sm ${inputClass}`}
          />
          <SubmitButton
            pendingText="Creating — this can take a while, don't click again..."
            className="self-start rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent-hover disabled:opacity-60"
          >
            Create and assign to this student
          </SubmitButton>
        </form>
      )}

      {type === "fillblank" && (
        <form
          action={createFillBlankAction}
          className="flex flex-col gap-3 border-t border-border pt-3"
        >
          <input
            name="name"
            placeholder="Name, e.g. Geography basics"
            required
            className={inputClass}
          />
          <textarea
            name="description"
            placeholder="Description (optional)"
            rows={2}
            className={inputClass}
          />
          <LanguageSelect defaultLanguage={defaultLanguage} />
          <p className="text-sm text-text-muted">
            Mark each blank with square brackets around the correct answer
            (use a slash for more than one acceptable answer). Separate the
            drill&apos;s pieces with <strong>two</strong> blank lines.
          </p>
          <textarea
            name="batch"
            rows={12}
            placeholder="Paste your pieces here..."
            required
            dir="auto"
            className={`font-mono text-sm ${inputClass}`}
          />
          <SubmitButton
            pendingText="Creating — this can take a while, don't click again..."
            className="self-start rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent-hover disabled:opacity-60"
          >
            Create and assign to this student
          </SubmitButton>
        </form>
      )}

      {type === "listening" && (
        <form
          action={createListeningAction}
          className="flex flex-col gap-3 border-t border-border pt-3"
        >
          <input
            name="title"
            placeholder="Title, e.g. Ordering coffee"
            required
            className={inputClass}
          />
          <LanguageSelect defaultLanguage={defaultLanguage} />

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

          <label className="text-sm text-text-muted">
            Text with blanks — wrap the missing word(s) in square brackets;
            use a slash for more than one acceptable answer
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
            pendingText="Creating — this can take a while, don't click again..."
            className="self-start rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent-hover disabled:opacity-60"
          >
            Create and assign to this student
          </SubmitButton>
        </form>
      )}
    </div>
  );
}
