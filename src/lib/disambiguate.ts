export function disambiguateLabels<T extends { id: string }>(
  items: T[],
  labelFn: (item: T) => string
): Map<string, string> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const label = labelFn(item);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  const result = new Map<string, string>();
  for (const item of items) {
    const label = labelFn(item);
    const isDuplicate = (counts.get(label) ?? 0) > 1;
    result.set(item.id, isDuplicate ? `${label} (#${item.id.slice(0, 6)})` : label);
  }
  return result;
}
