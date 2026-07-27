import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VerbDrillStudy } from "@/components/verb-drill-study";

export default async function VerbDrillStudyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: drill } = await supabase
    .from("verb_drills")
    .select("id, infinitive, translation, tense, forms, audio_urls")
    .eq("id", id)
    .single();

  if (!drill) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <VerbDrillStudy drill={drill} />
    </div>
  );
}
