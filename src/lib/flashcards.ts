// Tab comes for free when pasting two spreadsheet columns; "|" is the
// manual fallback since typing a real tab in a textarea just moves focus.
// Comma is deliberately NOT used as a separator — Hebrew, Russian, and
// English text all commonly contain commas of their own, which would
// otherwise split a phrase in the wrong place.
export function parseFlashcardLines(raw: string): { front: string; back: string }[] {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const result: { front: string; back: string }[] = [];
  for (const line of lines) {
    const separator = line.includes("\t") ? "\t" : "|";
    const [frontRaw, ...rest] = line.split(separator);
    const front = frontRaw?.trim();
    const back = rest.join(separator).trim();
    if (!front || !back) continue;
    result.push({ front, back });
  }
  return result;
}
