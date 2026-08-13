"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CONTENT_TYPES,
  CONTENT_TYPE_ORDER,
  type ContentType,
} from "@/lib/content-types";

export type WallTask = {
  type: ContentType;
  id: string;
  title: string;
  href: string;
  /** True once the student has recorded at least one attempt on it. */
  practised: boolean;
  /** Short status line, e.g. "6 / 7 correct". Null when never attempted. */
  scoreLabel: string | null;
};

export type WallLesson = {
  date: string;
  dateLabel: string;
  notesText: string | null;
  notionUrl: string | null;
  tasks: WallTask[];
};

export function StudentWall({
  greetingName,
  initial,
  accuracyPct,
  streakDays,
  lessons,
}: {
  greetingName: string;
  initial: string;
  accuracyPct: number | null;
  streakDays: number;
  lessons: WallLesson[];
}) {
  const [view, setView] = useState<"lesson" | "type">("lesson");

  const allTasks = lessons.flatMap((l) => l.tasks);
  const countsByType = CONTENT_TYPE_ORDER.map((key) => ({
    meta: CONTENT_TYPES[key],
    count: allTasks.filter((t) => t.type === key).length,
  }));

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-5">
      <GreetingCard
        greetingName={greetingName}
        initial={initial}
        accuracyPct={accuracyPct}
        streakDays={streakDays}
      />

      <div className="flex gap-4 overflow-x-auto pb-1">
        {countsByType.map(({ meta, count }) => (
          <button
            key={meta.key}
            onClick={() => setView("type")}
            className="flex w-[74px] shrink-0 flex-col items-center gap-1.5 transition-opacity hover:opacity-75"
          >
            <span className="relative flex h-[60px] w-[60px] items-center justify-center rounded-full bg-surface ring-2 ring-offset-2 ring-offset-bg"
              style={{ boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.04)" }}
            >
              <span
                className={`flex h-[54px] w-[54px] items-center justify-center rounded-full ${meta.tintClass} ${meta.textClass} font-heading text-sm font-bold`}
              >
                {meta.glyph}
              </span>
              <span
                className={`absolute -bottom-1 -right-1 rounded-full ${meta.bgClass} border-2 border-bg px-1.5 text-[10px] font-bold text-white`}
              >
                {count}
              </span>
            </span>
            <span className="text-center text-[11px] font-semibold leading-tight text-text-muted">
              {meta.label}
            </span>
          </button>
        ))}
      </div>

      <ViewToggle view={view} onChange={setView} />

      {allTasks.length === 0 && lessons.length === 0 ? (
        <p className="text-text-muted">
          Nothing here yet — check back after your next lesson.
        </p>
      ) : view === "lesson" ? (
        <LessonList lessons={lessons} />
      ) : (
        <TypeList tasks={allTasks} />
      )}
    </div>
  );
}

function GreetingCard({
  greetingName,
  initial,
  accuracyPct,
  streakDays,
}: {
  greetingName: string;
  initial: string;
  accuracyPct: number | null;
  streakDays: number;
}) {
  const subtitle =
    streakDays > 0 && accuracyPct !== null
      ? `${streakDays}-day streak · ${accuracyPct}% accuracy`
      : accuracyPct !== null
        ? `${accuracyPct}% accuracy so far`
        : "Your practice will show up here";

  return (
    <div
      className="flex items-center gap-4 rounded-xl p-6 text-white"
      style={{
        background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
      }}
    >
      <span className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full bg-white/25 font-heading text-2xl font-bold">
        {initial}
      </span>
      <div className="flex-1">
        <div className="font-heading text-xl font-bold">
          Shalom, {greetingName}
        </div>
        <div className="mt-0.5 text-sm text-white/90">{subtitle}</div>
        {accuracyPct !== null && (
          <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-white/30">
            <div
              className="h-full rounded-full bg-white"
              style={{ width: `${accuracyPct}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ViewToggle({
  view,
  onChange,
}: {
  view: "lesson" | "type";
  onChange: (v: "lesson" | "type") => void;
}) {
  const cls = (active: boolean) =>
    `rounded-full px-[18px] py-2 text-[13.5px] font-semibold transition-colors ${
      active ? "bg-surface text-text shadow-sm" : "text-text-muted"
    }`;
  return (
    <div className="flex w-fit rounded-full bg-bg-alt p-[3px]">
      <button onClick={() => onChange("lesson")} className={cls(view === "lesson")}>
        By lesson
      </button>
      <button onClick={() => onChange("type")} className={cls(view === "type")}>
        By type
      </button>
    </div>
  );
}

function LessonList({ lessons }: { lessons: WallLesson[] }) {
  return (
    <div className="flex flex-col gap-4">
      {lessons.map((lesson) => {
        const done = lesson.tasks.filter((t) => t.practised).length;
        const pct = lesson.tasks.length
          ? Math.round((done / lesson.tasks.length) * 100)
          : 0;
        const firstType = lesson.tasks[0]?.type;
        const meta = firstType ? CONTENT_TYPES[firstType] : null;

        return (
          <div
            key={lesson.date}
            className="animate-rise-in overflow-hidden rounded-xl border border-border bg-surface"
          >
            <div className="flex items-center gap-2.5 px-4 pt-4">
              <span
                className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  meta ? `${meta.tintClass} ${meta.textClass}` : "bg-bg-alt text-text-muted"
                }`}
              >
                {meta ? meta.glyph : "—"}
              </span>
              <div className="flex-1 text-[11.5px] font-semibold text-text-faint">
                {lesson.dateLabel}
              </div>
              {lesson.tasks.length > 0 && (
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-bold ${
                    meta ? `${meta.tintClass} ${meta.textClass}` : "bg-bg-alt text-text-muted"
                  }`}
                >
                  {pct}%
                </span>
              )}
            </div>

            <div className="flex flex-col gap-3 px-4 pb-4 pt-3">
              {lesson.notesText && (
                <p dir="auto" className="whitespace-pre-wrap text-sm">
                  {lesson.notesText}
                </p>
              )}

              {lesson.notionUrl && (
                <a
                  href={lesson.notionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-accent hover:underline"
                >
                  Open the lesson page ↗
                </a>
              )}

              {lesson.tasks.length > 0 && (
                <>
                  <div className="h-1.5 overflow-hidden rounded-full bg-bg-alt">
                    <div
                      className={`h-full rounded-full ${meta ? meta.bgClass : "bg-accent"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-[12.5px] font-semibold text-text-muted">
                    {done} / {lesson.tasks.length} practised
                  </div>
                  <div className="flex flex-col gap-2">
                    {lesson.tasks.map((task) => (
                      <TaskRow key={`${task.type}-${task.id}`} task={task} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TypeList({ tasks }: { tasks: WallTask[] }) {
  return (
    <div className="flex flex-col gap-4">
      {CONTENT_TYPE_ORDER.map((key) => {
        const meta = CONTENT_TYPES[key];
        const group = tasks.filter((t) => t.type === key);
        return (
          <div
            key={key}
            className="animate-rise-in rounded-xl border border-border bg-surface p-4"
          >
            <div className="mb-3 flex items-center gap-2.5">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full ${meta.bgClass} font-heading text-xs font-bold text-white`}
              >
                {meta.glyph}
              </span>
              <span className="font-heading text-[14.5px] font-bold">
                {meta.label}
              </span>
              <span className="rounded-full bg-bg-alt px-2.5 py-0.5 text-[11.5px] font-semibold text-text-muted">
                {group.length}
              </span>
            </div>
            {group.length > 0 ? (
              <div className="flex flex-col gap-2">
                {group.map((task) => (
                  <TaskRow key={`${task.type}-${task.id}`} task={task} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted">Nothing assigned yet.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TaskRow({ task }: { task: WallTask }) {
  const meta = CONTENT_TYPES[task.type];
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-bg-alt/60 px-3.5 py-2.5">
      <div className="min-w-0">
        <div dir="auto" className="truncate text-[13.5px] font-semibold">
          {task.title}
        </div>
        <div
          className={`mt-0.5 text-[11.5px] font-semibold ${
            task.practised ? "text-ok" : "text-text-faint"
          }`}
        >
          {task.practised
            ? task.scoreLabel
              ? `Practised · ${task.scoreLabel}`
              : "Practised"
            : "Not started yet"}
        </div>
      </div>
      <Link
        href={task.href}
        className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
          task.practised
            ? `border ${meta.borderClass} ${meta.textClass} hover:bg-bg-alt`
            : `${meta.bgClass} text-white hover:opacity-90`
        }`}
      >
        {task.practised ? "Review" : "Start"}
      </Link>
    </div>
  );
}
