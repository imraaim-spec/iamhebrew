"use client";

import { useState } from "react";
import { TENSE_SLOTS, TENSE_LABELS, type Tense } from "@/lib/hebrew-verbs";
import { LANGUAGE_LABELS } from "@/lib/language";

const inputClass = "rounded-sm border border-border bg-surface px-3 py-2 text-text";

export function VerbDrillForm({
  action,
}: {
  action: (formData: FormData) => void;
}) {
  const [tense, setTense] = useState<Tense>("present");

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4"
    >
      <h2 className="font-heading font-bold">New verb drill</h2>

      <input
        name="infinitive"
        dir="auto"
        placeholder="Infinitive, e.g. ללמוד"
        required
        className={inputClass}
      />
      <input
        name="translation"
        placeholder="Meaning, e.g. to learn / учиться"
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

      <select
        name="tense"
        value={tense}
        onChange={(e) => setTense(e.target.value as Tense)}
        className={inputClass}
      >
        {Object.entries(TENSE_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-2 gap-2">
        {TENSE_SLOTS[tense].map((slot) => (
          <label key={slot.key} className="text-sm text-text-muted">
            {slot.label}
            <input
              name={`form_${slot.key}`}
              dir="auto"
              className={`mt-1 block w-full ${inputClass}`}
            />
          </label>
        ))}
      </div>
      <p className="text-xs text-text-faint">
        Fill in as many forms as you have — audio is generated
        automatically for each one you enter. At least 2 are needed.
      </p>

      <button
        type="submit"
        className="self-start rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent-hover"
      >
        Create verb drill
      </button>
    </form>
  );
}
