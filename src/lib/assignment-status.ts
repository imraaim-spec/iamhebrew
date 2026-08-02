// Given every assignment row (student_id null = "everyone") and every
// per-student exclusion row for one content type, works out which
// students actually have access to each item — used to power the
// "student assigned to" filter on teacher content lists.
export function computeAssignedStudentIdsByItem(opts: {
  allStudentIds: string[];
  assignmentRows: { itemId: string; studentId: string | null }[];
  exclusionRows: { itemId: string; studentId: string }[];
}): Map<string, Set<string>> {
  const byItem = new Map<string, { everyone: boolean; individual: Set<string> }>();
  for (const row of opts.assignmentRows) {
    const entry = byItem.get(row.itemId) ?? { everyone: false, individual: new Set<string>() };
    if (row.studentId === null) entry.everyone = true;
    else entry.individual.add(row.studentId);
    byItem.set(row.itemId, entry);
  }

  const excludedByItem = new Map<string, Set<string>>();
  for (const row of opts.exclusionRows) {
    const set = excludedByItem.get(row.itemId) ?? new Set<string>();
    set.add(row.studentId);
    excludedByItem.set(row.itemId, set);
  }

  const result = new Map<string, Set<string>>();
  for (const [itemId, entry] of byItem) {
    const excluded = excludedByItem.get(itemId) ?? new Set<string>();
    const assigned = new Set<string>();
    if (entry.everyone) {
      for (const sid of opts.allStudentIds) {
        if (!excluded.has(sid)) assigned.add(sid);
      }
    }
    for (const sid of entry.individual) assigned.add(sid);
    result.set(itemId, assigned);
  }
  return result;
}
