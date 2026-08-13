"use client";

import { useState } from "react";

export type ActivityRow = {
  id: string;
  isCorrect: boolean;
  label: string;
  deckTitle: string | null;
  timeLabel: string;
};

const COLLAPSED_COUNT = 5;

export function RecentActivity({ rows }: { rows: ActivityRow[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? rows : rows.slice(0, COLLAPSED_COUNT);

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-heading text-sm font-bold">Recent activity</h2>
        {rows.length > COLLAPSED_COUNT && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-[12.5px] font-semibold text-accent hover:underline"
          >
            {expanded ? "Show less" : `See all ${rows.length}`}
          </button>
        )}
      </div>
      <div className="flex flex-col">
        {visible.map((row) => (
          <div
            key={row.id}
            className="flex items-center justify-between gap-4 border-t border-border/60 py-2 text-[13px]"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={`h-[7px] w-[7px] shrink-0 rounded-full ${
                  row.isCorrect ? "bg-ok" : "bg-bad"
                }`}
              />
              <span
                className={`font-semibold ${
                  row.isCorrect ? "text-ok" : "text-bad"
                }`}
              >
                {row.isCorrect ? "Correct" : "Incorrect"}
              </span>
              <span className="truncate text-text-faint">
                · {row.timeLabel}
              </span>
            </div>
            <span dir="auto" className="truncate text-text-muted">
              {row.label}
              {row.deckTitle ? ` (${row.deckTitle})` : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
