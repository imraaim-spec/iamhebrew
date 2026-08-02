"use client";

import { useMemo, useState, type ReactNode } from "react";
import { LANGUAGE_LABELS } from "@/lib/language";

export type FilterableItem = {
  id: string;
  searchText: string;
  language: string | null;
  assignedStudentIds: string[];
  node: ReactNode;
};

export function FilterableContentList({
  items,
  students,
  emptyMessage,
}: {
  items: FilterableItem[];
  students: { id: string; label: string }[];
  emptyMessage: string;
}) {
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("");
  const [studentId, setStudentId] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      if (language && (item.language ?? "") !== language) return false;
      if (studentId && !item.assignedStudentIds.includes(studentId)) return false;
      if (query && !item.searchText.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [items, search, language, studentId]);

  const hasActiveFilters = search || language || studentId;

  return (
    <div className="flex flex-col gap-3">
      {items.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface p-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="min-w-[160px] flex-1 rounded-sm border border-border bg-surface px-3 py-2 text-sm text-text"
          />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-sm border border-border bg-surface px-3 py-2 text-sm text-text"
          >
            <option value="">All languages</option>
            {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {students.length > 0 && (
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="rounded-sm border border-border bg-surface px-3 py-2 text-sm text-text"
            >
              <option value="">Any student</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          )}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setLanguage("");
                setStudentId("");
              }}
              className="text-sm text-text-muted hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {filtered.length > 0 ? (
          filtered.map((item) => <li key={item.id}>{item.node}</li>)
        ) : (
          <p className="text-text-muted">
            {items.length === 0 ? emptyMessage : "No items match these filters."}
          </p>
        )}
      </ul>
    </div>
  );
}
