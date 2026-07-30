import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { deleteCourse, removeCourseItem, setCourseAssignments } from "../actions";
import { disambiguateLabels } from "@/lib/disambiguate";

const TYPE_LABELS: Record<string, string> = {
  deck: "Flashcards",
  listening: "Listening",
  verb: "Verb Drill",
  fillblank: "Fill in the Blanks",
};

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, description")
    .eq("id", id)
    .single();

  if (!course) notFound();

  const { data: items } = await supabase
    .from("course_items")
    .select("id, item_type, item_id")
    .eq("course_id", id);

  const deckIds = (items ?? []).filter((i) => i.item_type === "deck").map((i) => i.item_id);
  const listeningIds = (items ?? [])
    .filter((i) => i.item_type === "listening")
    .map((i) => i.item_id);
  const verbIds = (items ?? []).filter((i) => i.item_type === "verb").map((i) => i.item_id);
  const fillBlankIds = (items ?? [])
    .filter((i) => i.item_type === "fillblank")
    .map((i) => i.item_id);

  const decks = deckIds.length
    ? (await supabase.from("decks").select("id, title").in("id", deckIds)).data ?? []
    : [];
  const listeningExercises = listeningIds.length
    ? (await supabase.from("listening_exercises").select("id, title").in("id", listeningIds))
        .data ?? []
    : [];
  const verbDrills = verbIds.length
    ? (
        await supabase
          .from("verb_drills")
          .select("id, infinitive, translation")
          .in("id", verbIds)
      ).data ?? []
    : [];
  const fillBlankDrills = fillBlankIds.length
    ? (await supabase.from("fill_blank_drills").select("id, title").in("id", fillBlankIds))
        .data ?? []
    : [];

  const titleByDeckId = disambiguateLabels(decks, (d) => d.title);
  const titleByListeningId = disambiguateLabels(listeningExercises, (e) => e.title);
  const titleByVerbId = disambiguateLabels(
    verbDrills,
    (v) => `${v.infinitive} — ${v.translation}`
  );
  const titleByFillBlankId = disambiguateLabels(fillBlankDrills, (d) => d.title);

  function itemTitle(itemType: string, itemId: string): string {
    if (itemType === "deck") return titleByDeckId.get(itemId) ?? "(deleted deck)";
    if (itemType === "listening")
      return titleByListeningId.get(itemId) ?? "(deleted listening exercise)";
    if (itemType === "verb") return titleByVerbId.get(itemId) ?? "(deleted verb drill)";
    if (itemType === "fillblank")
      return titleByFillBlankId.get(itemId) ?? "(deleted fill-in-the-blank drill)";
    return "(unknown)";
  }

  const { data: students } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "student")
    .order("full_name");

  const assignedStudentIds = new Set<string>();
  if (students && students.length > 0 && items && items.length > 0) {
    const checks = await Promise.all(
      students.map(async (student) => {
        let allAssigned = true;
        if (deckIds.length > 0) {
          const { count } = await supabase
            .from("assignments")
            .select("id", { count: "exact", head: true })
            .eq("student_id", student.id)
            .in("deck_id", deckIds);
          if ((count ?? 0) < deckIds.length) allAssigned = false;
        }
        if (allAssigned && listeningIds.length > 0) {
          const { count } = await supabase
            .from("listening_assignments")
            .select("id", { count: "exact", head: true })
            .eq("student_id", student.id)
            .in("exercise_id", listeningIds);
          if ((count ?? 0) < listeningIds.length) allAssigned = false;
        }
        if (allAssigned && verbIds.length > 0) {
          const { count } = await supabase
            .from("verb_drill_assignments")
            .select("id", { count: "exact", head: true })
            .eq("student_id", student.id)
            .in("drill_id", verbIds);
          if ((count ?? 0) < verbIds.length) allAssigned = false;
        }
        if (allAssigned && fillBlankIds.length > 0) {
          const { count } = await supabase
            .from("fill_blank_assignments")
            .select("id", { count: "exact", head: true })
            .eq("student_id", student.id)
            .in("drill_id", fillBlankIds);
          if ((count ?? 0) < fillBlankIds.length) allAssigned = false;
        }
        return { studentId: student.id, allAssigned };
      })
    );
    for (const c of checks) {
      if (c.allAssigned) assignedStudentIds.add(c.studentId);
    }
  }

  const deleteCourseWithId = deleteCourse.bind(null, id);
  const setCourseAssignmentsWithId = setCourseAssignments.bind(null, id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">{course.title}</h1>
        {course.description && (
          <p className="text-zinc-600 dark:text-zinc-400">{course.description}</p>
        )}
      </div>

      <ul className="flex flex-col gap-2">
        {items && items.length > 0 ? (
          items.map((item) => {
            const removeItemWithIds = removeCourseItem.bind(null, item.id, id);
            return (
              <li
                key={item.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]"
              >
                <div>
                  <div className="text-xs font-medium uppercase text-zinc-500">
                    {TYPE_LABELS[item.item_type] ?? item.item_type}
                  </div>
                  <div dir="auto">{itemTitle(item.item_type, item.item_id)}</div>
                </div>
                <form action={removeItemWithIds}>
                  <button
                    type="submit"
                    className="shrink-0 text-sm text-red-600 hover:underline dark:text-red-400"
                  >
                    Remove
                  </button>
                </form>
              </li>
            );
          })
        ) : (
          <p className="text-zinc-600 dark:text-zinc-400">
            No items in this course yet.
          </p>
        )}
      </ul>

      {students && students.length > 0 && items && items.length > 0 && (
        <form
          action={setCourseAssignmentsWithId}
          className="flex flex-col gap-3 rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]"
        >
          <h2 className="font-medium">Assign to students</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Check a student to give them every item in this course. Uncheck
            to remove all of this course&apos;s items from that student.
          </p>
          <div className="flex flex-col gap-1">
            {students.map((student) => (
              <label key={student.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="students"
                  value={student.id}
                  defaultChecked={assignedStudentIds.has(student.id)}
                />
                {student.full_name || student.email}
              </label>
            ))}
          </div>
          <button
            type="submit"
            className="self-start rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Save assignment
          </button>
        </form>
      )}

      <ConfirmDeleteButton
        action={deleteCourseWithId}
        label="Delete this course"
        confirmMessage={`Delete the course "${course.title}"? This won't unassign anything already given to students — it just removes the course bundle itself.`}
      />
    </div>
  );
}
