import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { deleteCourse, removeCourseItem } from "../actions";

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

  const titleByDeckId = new Map(decks.map((d) => [d.id, d.title]));
  const titleByListeningId = new Map(listeningExercises.map((e) => [e.id, e.title]));
  const titleByVerbId = new Map(
    verbDrills.map((v) => [v.id, `${v.infinitive} — ${v.translation}`])
  );
  const titleByFillBlankId = new Map(fillBlankDrills.map((d) => [d.id, d.title]));

  function itemTitle(itemType: string, itemId: string): string {
    if (itemType === "deck") return titleByDeckId.get(itemId) ?? "(deleted deck)";
    if (itemType === "listening")
      return titleByListeningId.get(itemId) ?? "(deleted listening exercise)";
    if (itemType === "verb") return titleByVerbId.get(itemId) ?? "(deleted verb drill)";
    if (itemType === "fillblank")
      return titleByFillBlankId.get(itemId) ?? "(deleted fill-in-the-blank drill)";
    return "(unknown)";
  }

  const deleteCourseWithId = deleteCourse.bind(null, id);

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

      <ConfirmDeleteButton
        action={deleteCourseWithId}
        label="Delete this course"
        confirmMessage={`Delete the course "${course.title}"? This won't unassign anything already given to students — it just removes the course bundle itself.`}
      />
    </div>
  );
}
