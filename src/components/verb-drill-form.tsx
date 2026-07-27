"use client";

import { useState } from "react";
import { TENSE_SLOTS, TENSE_LABELS, type Tense } from "@/lib/hebrew-verbs";

const inputClass =
  "rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black";

export function VerbDrillForm({
  action,
}: {
  action: (formData: FormData) => void;
}) {
  const [tense, setTense] = useState<Tense>("present");

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]"
    >
      <h2 className="font-medium">New verb drill</h2>

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
          <label key={slot.key} className="text-sm text-zinc-600 dark:text-zinc-400">
            {slot.label}
            <input
              name={`form_${slot.key}`}
              dir="auto"
              className={`mt-1 block w-full ${inputClass}`}
            />
          </label>
        ))}
      </div>
      <p className="text-xs text-zinc-500">
        Fill in as many forms as you have — audio is generated
        automatically for each one you enter. At least 2 are needed.
      </p>

      <button
        type="submit"
        className="self-start rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
      >
        Create verb drill
      </button>
    </form>
  );
}
