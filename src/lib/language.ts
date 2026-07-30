export const LANGUAGE_LABELS: Record<string, string> = {
  english: "English",
  russian: "Russian",
};

export type Language = keyof typeof LANGUAGE_LABELS;

const GROUP_ORDER = ["english", "russian", "unspecified"];

export function groupByLanguage<T extends { language: string | null }>(
  items: T[]
): { key: string; label: string; items: T[] }[] {
  const groups: Record<string, T[]> = {};
  for (const item of items) {
    const key = item.language ?? "unspecified";
    (groups[key] ??= []).push(item);
  }
  return GROUP_ORDER.filter((key) => groups[key]?.length).map((key) => ({
    key,
    label: key === "unspecified" ? "Not tagged yet" : LANGUAGE_LABELS[key],
    items: groups[key],
  }));
}
