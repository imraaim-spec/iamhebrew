import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createVerbDrill } from "./actions";
import { VerbDrillForm } from "@/components/verb-drill-form";
import { TENSE_LABELS } from "@/lib/hebrew-verbs";

export default async function VerbDrillsPage() {
  const supabase = await createClient();
  const { data: drills } = await supabase
    .from("verb_drills")
    .select("id, infinitive, translation, tense")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <h1 className="text-2xl font-semibold">Verb Drills</h1>

      <VerbDrillForm action={createVerbDrill} />

      <ul className="flex flex-col gap-2">
        {drills && drills.length > 0 ? (
          drills.map((drill) => (
            <li key={drill.id}>
              <Link
                href={`/teacher/verbs/${drill.id}`}
                className="block rounded-lg border border-black/[.08] p-4 hover:bg-black/[.02] dark:border-white/[.145] dark:hover:bg-white/[.03]"
              >
                <div dir="auto" className="font-medium">
                  {drill.infinitive} — {drill.translation}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  {TENSE_LABELS[drill.tense]}
                </div>
              </Link>
            </li>
          ))
        ) : (
          <p className="text-zinc-600 dark:text-zinc-400">
            No verb drills yet — create your first one above.
          </p>
        )}
      </ul>
    </div>
  );
}
