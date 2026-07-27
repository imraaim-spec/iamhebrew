export type Tense = "present" | "past" | "future";

export const TENSE_LABELS: Record<string, string> = {
  present: "הווה (Present)",
  past: "עבר (Past)",
  future: "עתיד (Future)",
};

export const TENSE_SLOTS: Record<string, { key: string; label: string }[]> = {
  present: [
    { key: "ms", label: "זכר יחיד (הוא / אתה)" },
    { key: "fs", label: "נקבה יחיד (היא / את)" },
    { key: "mp", label: "זכר רבים (הם / אתם)" },
    { key: "fp", label: "נקבה רבים (הן / אתן)" },
  ],
  past: [
    { key: "ani", label: "אני" },
    { key: "ata", label: "אתה" },
    { key: "at", label: "את" },
    { key: "hu", label: "הוא" },
    { key: "hi", label: "היא" },
    { key: "anachnu", label: "אנחנו" },
    { key: "atem", label: "אתם" },
    { key: "aten", label: "אתן" },
    { key: "hem", label: "הם" },
    { key: "hen", label: "הן" },
  ],
  future: [
    { key: "ani", label: "אני" },
    { key: "ata", label: "אתה" },
    { key: "at", label: "את" },
    { key: "hu", label: "הוא" },
    { key: "hi", label: "היא" },
    { key: "anachnu", label: "אנחנו" },
    { key: "atem", label: "אתם" },
    { key: "aten", label: "אתן" },
    { key: "hem", label: "הם" },
    { key: "hen", label: "הן" },
  ],
};
