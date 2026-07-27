import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudySession } from "@/components/study-session";

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

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">{deck.title}</h1>
      <StudySession cards={cards ?? []} />
    </div>
  );
}
