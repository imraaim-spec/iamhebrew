import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VerbDrillStudy } from "@/components/verb-drill-study";

export default async function StudentVerbDrillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS ensures this returns null (and we 404) if the drill isn't
  // actually assigned to this student.
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
