import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClozeListeningStudy } from "@/components/cloze-listening-study";

export default async function ListeningStudyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: exercise } = await supabase
    .from("listening_exercises")
    .select("id, title, template, audio_url, youtube_url, youtube_start")
    .eq("id", id)
    .single();

  if (!exercise) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">{exercise.title}</h1>
      <ClozeListeningStudy exercise={exercise} />
    </div>
  );
}
