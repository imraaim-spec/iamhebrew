import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type CardContent = {
  front?: string;
  back?: string;
  question?: string;
};

type AttemptRow = {
  id: string;
  is_correct: boolean;
  attempted_at: string;
  card: {
    id: string;
    content: CardContent;
    deck: { id: string; title: string } | null;
  } | null;
};

function cardLabel(content: CardContent | undefined) {
  if (!content) return "(deleted card)";
  if (content.front) return content.front;
  if (content.question) return content.question;
  return "(card)";
}

export default async function StudentProgressPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .eq("id", id)
    .eq("role", "student")
    .single();

  if (!student) notFound();

  const { data: attempts } = await supabase
    .from("attempts")
    .select(
      "id, is_correct, attempted_at, card:cards(id, content, deck:decks(id, title))"
    )
    .eq("student_id", id)
    .order("attempted_at", { ascending: false })
    .returns<AttemptRow[]>();

  const all = attempts ?? [];
  const totalCount = all.length;
  const correctCount = all.filter((a) => a.is_correct).length;
  const overallPct = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  // Per-deck breakdown
  const deckStats = new Map<string, { title: string; total: number; correct: number }>();
  for (const a of all) {
    const deck = a.card?.deck;
    if (!deck) continue;
    const entry = deckStats.get(deck.id) ?? { title: deck.title, total: 0, correct: 0 };
    entry.total += 1;
    if (a.is_correct) entry.correct += 1;
    deckStats.set(deck.id, entry);
  }

  // Weak spots: cards with the most incorrect answers, worst accuracy first
  const cardStats = new Map<
    string,
    { label: string; total: number; correct: number }
  >();
  for (const a of all) {
    if (!a.card) continue;
    const entry =
      cardStats.get(a.card.id) ??
      { label: cardLabel(a.card.content), total: 0, correct: 0 };
    entry.total += 1;
    if (a.is_correct) entry.correct += 1;
    cardStats.set(a.card.id, entry);
  }
  const weakSpots = Array.from(cardStats.values())
    .filter((c) => c.correct < c.total)
    .sort((a, b) => a.correct / a.total - b.correct / b.total)
    .slice(0, 10);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">
          {student.full_name || student.email}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">{student.email}</p>
      </div>

      <div className="rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]">
        <h2 className="mb-2 font-medium">Overall</h2>
        {totalCount > 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">
            {correctCount} / {totalCount} correct ({overallPct}%)
          </p>
        ) : (
          <p className="text-zinc-600 dark:text-zinc-400">
            No activity yet — nothing practiced.
          </p>
        )}
      </div>

      {deckStats.size > 0 && (
        <div className="rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]">
          <h2 className="mb-2 font-medium">By deck</h2>
          <ul className="flex flex-col gap-1">
            {Array.from(deckStats.values()).map((d) => (
              <li key={d.title} className="text-sm text-zinc-600 dark:text-zinc-400">
                {d.title}: {d.correct} / {d.total} correct (
                {Math.round((d.correct / d.total) * 100)}%)
              </li>
            ))}
          </ul>
        </div>
      )}

      {weakSpots.length > 0 && (
        <div className="rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]">
          <h2 className="mb-2 font-medium">Weak spots</h2>
          <ul className="flex flex-col gap-1">
            {weakSpots.map((w, i) => (
              <li key={i} dir="auto" className="text-sm text-zinc-600 dark:text-zinc-400">
                {w.label} — {w.correct} / {w.total} correct
              </li>
            ))}
          </ul>
        </div>
      )}

      {all.length > 0 && (
        <div className="rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]">
          <h2 className="mb-2 font-medium">Recent activity</h2>
          <ul className="flex flex-col gap-1">
            {all.slice(0, 20).map((a) => (
              <li
                key={a.id}
                dir="auto"
                className="flex items-center justify-between gap-4 text-sm text-zinc-600 dark:text-zinc-400"
              >
                <span>
                  {cardLabel(a.card?.content)}
                  {a.card?.deck ? ` (${a.card.deck.title})` : ""}
                </span>
                <span className={a.is_correct ? "text-green-600" : "text-red-600"}>
                  {a.is_correct ? "Correct" : "Incorrect"} ·{" "}
                  {new Date(a.attempted_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
