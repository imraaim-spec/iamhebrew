"use client";

import { useState } from "react";

/**
 * Switches a student's work between the two ways of looking at it: what
 * happened in each lesson, or everything of one kind gathered together.
 *
 * Both views are rendered on the server and passed in as slots, so the
 * toggle stays a thin client shell around server-rendered content.
 */
export function ProfileViewToggle({
  lessonView,
  typeView,
}: {
  lessonView: React.ReactNode;
  typeView: React.ReactNode;
}) {
  const [view, setView] = useState<"lesson" | "type">("lesson");

  const cls = (active: boolean) =>
    `rounded-full px-[18px] py-2 text-[13.5px] font-semibold transition-colors ${
      active ? "bg-surface text-text shadow-sm" : "text-text-muted"
    }`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex w-fit rounded-full bg-bg-alt p-[3px]">
        <button
          onClick={() => setView("lesson")}
          className={cls(view === "lesson")}
        >
          By lesson
        </button>
        <button onClick={() => setView("type")} className={cls(view === "type")}>
          By type
        </button>
      </div>
      {view === "lesson" ? lessonView : typeView}
    </div>
  );
}
