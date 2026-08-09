"use client";

import { useState } from "react";
import { LANGUAGE_LABELS } from "@/lib/language";
import { SubmitButton } from "@/components/submit-button";

export type AssignableOption = { id: string; label: string; language: string | null };

export function AssignExistingItemForm({
  action,
  options,
  placeholder,
  defaultLanguage,
}: {
  action: (formData: FormData) => void;
  options: AssignableOption[];
  placeholder: string;
  defaultLanguage?: string | null;
}) {
  const [language, setLanguage] = useState(defaultLanguage ?? "");

  if (options.length === 0) {
    return <p className="text-sm text-text-faint">Nothing else to add.</p>;
  }

  const filtered = language
    ? options.filter((o) => (o.language ?? "") === language)
    : options;

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="rounded-sm border border-border bg-surface px-2 py-1.5 text-sm text-text"
      >
        <option value="">All languages</option>
        {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <select
        name="item_id"
        required
        defaultValue=""
        className="min-w-[180px] flex-1 rounded-sm border border-border bg-surface px-2 py-1.5 text-sm text-text"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {filtered.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <SubmitButton className="rounded-sm bg-accent px-3 py-1.5 text-sm font-semibold text-bg hover:bg-accent-hover disabled:opacity-60">
        Assign
      </SubmitButton>
    </form>
  );
}
