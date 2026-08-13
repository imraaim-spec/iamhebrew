import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudySession } from "@/components/study-session";
import { todayIso } from "@/lib/srs";

export default async function StudentStudyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS ensures this returns null (and we 404) if the deck isn't actually
  // assigned to this student — guessing a deck ID in the URL can't work.
  const { data: deck } = await supabase
    .from("decks")
    .select("id, title")
    .eq("id", id)
    .single();

  if (!deck) notFound();

  const { data: cards } = await supabase
    .from("cards")
    .select("id, content")
    .eq("deck_id", id)
    .eq("type", "flashcard")
    .order("created_at", { ascending: true });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // A card is due if it's never been reviewed (no schedule row) or its
  // scheduled date has arrived.
  const cardIds = (cards ?? []).map((c) => c.id);
  const { data: schedules } = user && cardIds.length
    ? await supabase
        .from("card_schedules")
        .select("card_id, due_on")
        .eq("student_id", user.id)
        .in("card_id", cardIds)
    : { data: null };

  const scheduledById = new Map(
    (schedules ?? []).map((s) => [s.card_id as string, s.due_on as string])
  );
  const today = todayIso();
  const dueCardIds = cardIds.filter((cardId) => {
    const dueOn = scheduledById.get(cardId);
    return dueOn === undefined || dueOn <= today;
  });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">{deck.title}</h1>
      <StudySession cards={cards ?? []} dueCardIds={dueCardIds} srsEnabled />
    </div>
  );
}
