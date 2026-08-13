/**
 * One place defining how each kind of content presents itself — the label
 * students and teachers read, the two-letter glyph used in circles and
 * pills, and the colour it carries throughout both dashboards.
 *
 * Colours are Tailwind class fragments rather than raw hex so they stay
 * tied to the tokens in globals.css.
 */

export type ContentType = "flashcards" | "verbs" | "listening" | "fill";

export type ContentTypeMeta = {
  key: ContentType;
  label: string;
  glyph: string;
  /** Solid fill — circles, filled buttons. Pairs with white text. */
  bgClass: string;
  /** Pale wash — pill backgrounds behind coloured text. */
  tintClass: string;
  /** Text colour matching the solid fill. */
  textClass: string;
  /** Border matching the solid fill. */
  borderClass: string;
  /** Where the teacher goes to create or manage this type. */
  teacherHref: string;
};

export const CONTENT_TYPES: Record<ContentType, ContentTypeMeta> = {
  flashcards: {
    key: "flashcards",
    label: "Flash Cards",
    glyph: "FC",
    bgClass: "bg-type-flashcards",
    tintClass: "bg-type-flashcards-tint",
    textClass: "text-type-flashcards",
    borderClass: "border-type-flashcards",
    teacherHref: "/teacher/decks",
  },
  verbs: {
    key: "verbs",
    label: "Verb Drills",
    glyph: "VB",
    bgClass: "bg-type-verbs",
    tintClass: "bg-type-verbs-tint",
    textClass: "text-type-verbs",
    borderClass: "border-type-verbs",
    teacherHref: "/teacher/verbs",
  },
  listening: {
    key: "listening",
    label: "Listening",
    glyph: "LI",
    bgClass: "bg-type-listening",
    tintClass: "bg-type-listening-tint",
    textClass: "text-type-listening",
    borderClass: "border-type-listening",
    teacherHref: "/teacher/listening",
  },
  fill: {
    key: "fill",
    label: "Fill in the Blanks",
    glyph: "FB",
    bgClass: "bg-type-fill",
    tintClass: "bg-type-fill-tint",
    textClass: "text-type-fill",
    borderClass: "border-type-fill",
    teacherHref: "/teacher/fill-blanks",
  },
};

export const CONTENT_TYPE_ORDER: ContentType[] = [
  "flashcards",
  "verbs",
  "listening",
  "fill",
];

/** Initial shown in a student's avatar circle. */
export function initialFor(name: string | null, email: string): string {
  const source = name?.trim() || email;
  return source.charAt(0).toUpperCase();
}
