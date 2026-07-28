export type ClozeSegment = { text: string } | { blank: true; answers: string[] };

// Parses text like "הילד [הולך/צועד] לבית הספר" into alternating plain-text
// and blank segments. A blank's answers are separated by "/".
export function parseClozeTemplate(template: string): ClozeSegment[] {
  const segments: ClozeSegment[] = [];
  const regex = /\[([^\]]+)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(template)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: template.slice(lastIndex, match.index) });
    }
    const answers = match[1]
      .split("/")
      .map((a) => a.trim())
      .filter(Boolean);
    segments.push({ blank: true, answers });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < template.length) {
    segments.push({ text: template.slice(lastIndex) });
  }
  return segments;
}

// Lenient comparison: ignores niqqud (Hebrew vowel points), punctuation,
// case, and extra whitespace, so small typing differences don't count wrong.
export function normalizeAnswer(value: string): string {
  return value
    .normalize("NFC")
    .replace(/[֑-ׇ]/g, "")
    .replace(/[.,!?;:'"״׳\-—]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// Text to read aloud for a cloze passage's audio — skips the answers
// entirely, since hearing them would give away the exercise.
export function extractSpeakableText(template: string): string {
  return parseClozeTemplate(template)
    .filter((s): s is { text: string } => "text" in s)
    .map((s) => s.text.trim())
    .filter(Boolean)
    .join(" ");
}

export function getYouTubeEmbedUrl(url: string, startSeconds?: number): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (!match) return null;
  const params = new URLSearchParams();
  if (startSeconds) params.set("start", String(Math.floor(startSeconds)));
  const query = params.toString();
  return `https://www.youtube.com/embed/${match[1]}${query ? `?${query}` : ""}`;
}
