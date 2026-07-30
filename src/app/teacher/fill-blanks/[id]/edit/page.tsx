import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateFillBlankDrill } from "../../actions";

export default async function EditFillBlankDrillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: drill } = await supabase
    .from("fill_blank_drills")
    .select("id, title, description, segments")
    .eq("id", id)
    .single();

  if (!drill) notFound();

  const updateFillBlankDrillWithId = updateFillBlankDrill.bind(null, id);
  const batchText = (drill.segments as string[]).join("\n\n\n");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <h1 className="text-2xl">Edit drill</h1>

      <form
        action={updateFillBlankDrillWithId}
        className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4"
      >
        <input
          name="name"
          defaultValue={drill.title}
          placeholder="Name"
          required
          className="rounded-sm border border-border bg-surface px-3 py-2 text-text"
        />
        <textarea
          name="description"
          defaultValue={drill.description ?? ""}
          placeholder="Description (optional)"
          rows={2}
          className="rounded-sm border border-border bg-surface px-3 py-2 text-text"
        />
        <p className="text-sm text-text-muted">
          Two blank lines between pieces, one blank line within a piece,
          blanks marked with square brackets.
        </p>
        <textarea
          name="batch"
          defaultValue={batchText}
          rows={16}
          required
          dir="auto"
          className="rounded-sm border border-border bg-surface px-3 py-2 font-mono text-sm text-text"
        />
        <button
          type="submit"
          className="self-start rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent-hover"
        >
          Save changes
        </button>
      </form>
    </div>
  );
}
