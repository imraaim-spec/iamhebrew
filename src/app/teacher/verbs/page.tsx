import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createVerbDrill } from "./actions";
import { VerbDrillForm } from "@/components/verb-drill-form";
import { TENSE_LABELS } from "@/lib/hebrew-verbs";
import { computeAssignedStudentIdsByItem } from "@/lib/assignment-status";
import { FilterableContentList, type FilterableItem } from "@/components/filterable-content-list";

export default async function VerbDrillsPage() {
  const supabase = await createClient();
  const { data: drills } = await supabase
    .from("verb_drills")
    .select("id, infinitive, translation, tense, language")
    .order("created_at", { ascending: false });

  const { data: students } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .eq("role", "student")
    .order("email", { ascending: true });

  const { data: assignmentRows } = await supabase
    .from("verb_drill_assignments")
    .select("drill_id, student_id");
  const { data: exclusionRows } = await supabase
    .from("assignment_exclusions")
    .select("item_id, student_id")
    .eq("item_type", "verb");

  const assignedByDrill = computeAssignedStudentIdsByItem({
    allStudentIds: (students ?? []).map((s) => s.id),
    assignmentRows: (assignmentRows ?? []).map((a) => ({
      itemId: a.drill_id,
      studentId: a.student_id,
    })),
    exclusionRows: (exclusionRows ?? []).map((e) => ({
      itemId: e.item_id,
      studentId: e.student_id,
    })),
  });

  const studentOptions = (students ?? []).map((s) => ({
    id: s.id,
    label: s.full_name || s.email,
  }));

  const items: FilterableItem[] = (drills ?? []).map((drill) => ({
    id: drill.id,
    searchText: `${drill.infinitive} ${drill.translation}`,
    language: drill.language,
    assignedStudentIds: Array.from(assignedByDrill.get(drill.id) ?? []),
    node: (
      <Link
        href={`/teacher/verbs/${drill.id}`}
        className="block rounded-md border border-border bg-surface p-4 hover:bg-bg-alt"
      >
        <div dir="auto" className="font-medium">
          {drill.infinitive} — {drill.translation}
        </div>
        <div className="text-sm text-text-muted">{TENSE_LABELS[drill.tense]}</div>
      </Link>
    ),
  }));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <h1 className="text-2xl">Verb Drills</h1>

      <VerbDrillForm action={createVerbDrill} />

      <FilterableContentList
        items={items}
        students={studentOptions}
        emptyMessage="No verb drills yet — create your first one above."
      />
    </div>
  );
}
