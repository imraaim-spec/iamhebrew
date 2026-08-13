"use client";

import { useState } from "react";
import { SubmitButton } from "@/components/submit-button";

export type AssignableOption = { id: string; label: string };

export type AssignableType = "deck" | "listening" | "verb" | "fillblank";

const TYPE_LABELS: Record<AssignableType, string> = {
  deck: "Flash cards",
  listening: "Listening exercise",
  verb: "Verb drill",
  fillblank: "Fill in the blanks",
};

export function AddAssignmentForm({
  actions,
  options,
}: {
  actions: Record<AssignableType, (formData: FormData) => void>;
  options: Record<AssignableType, AssignableOption[]>;
}) {
  const [type, setType] = useState<AssignableType | "">("");

  const selectClass =
    "rounded-sm border border-border bg-surface px-3 py-2 text-sm text-text";

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3">
      <h3 className="text-sm font-semibold text-text-faint">Add more</h3>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as AssignableType | "")}
          className={selectClass}
        >
          <option value="">Choose a type...</option>
          {(Object.keys(TYPE_LABELS) as AssignableType[]).map((key) => (
            <option key={key} value={key}>
              {TYPE_LABELS[key]}
            </option>
          ))}
        </select>

        {type &&
          (options[type].length > 0 ? (
            <form
              key={type}
              action={actions[type]}
              className="flex flex-1 flex-wrap items-center gap-2"
            >
              <select
                name="item_id"
                required
                defaultValue=""
                className={`min-w-[200px] flex-1 ${selectClass}`}
              >
                <option value="" disabled>
                  Choose which one...
                </option>
                {options[type].map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
              <SubmitButton className="rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent-hover disabled:opacity-60">
                Assign
              </SubmitButton>
            </form>
          ) : (
            <p className="text-sm text-text-faint">
              Nothing left to add of this type.
            </p>
          ))}
      </div>
    </div>
  );
}
