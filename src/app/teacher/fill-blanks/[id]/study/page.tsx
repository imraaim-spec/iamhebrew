import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FillBlankDrillStudy } from "@/components/fill-blank-drill-study";

export default async function FillBlankDrillStudyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: drill } = await supabase
    .from("fill_blank_drills")
    .select("id, title, segments")
    .eq("id", id)
    .single();

  if (!drill) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <FillBlankDrillStudy
        drillId={drill.id}
        title={drill.title}
        segments={drill.segments as string[]}
      />
    </div>
  );
}
