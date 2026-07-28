import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FillBlankDrillStudy } from "@/components/fill-blank-drill-study";

export default async function StudentFillBlankDrillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS ensures this returns null (and we 404) if the drill isn't
  // actually assigned to this student.
  const { data: drill } = await supabase
    .from("fill_blank_drills")
    .select("id, title, segments, audio_urls")
    .eq("id", id)
    .single();

  if (!drill) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <FillBlankDrillStudy
        drillId={drill.id}
        title={drill.title}
        segments={drill.segments as string[]}
        audioUrls={drill.audio_urls as (string | null)[]}
      />
    </div>
  );
}
