import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createCourse } from "./actions";
import { disambiguateLabels } from "@/lib/disambiguate";

export default async function CoursesPage() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, description")
    .order("created_at", { ascending: false });

  const { data: decks } = await supabase
    .from("decks")
    .select("id, title")
    .order("title")
    .order("id");
  const { data: listeningExercises } = await supabase
    .from("listening_exercises")
    .select("id, title")
    .order("title")
    .order("id");
  const { data: verbDrills } = await supabase
    .from("verb_drills")
    .select("id, infinitive, translation")
    .order("infinitive")
    .order("id");
  const { data: fillBlankDrills } = await supabase
    .from("fill_blank_drills")
    .select("id, title")
    .order("title")
    .order("id");

  const deckLabels = disambiguateLabels(decks ?? [], (d) => d.title);
  const listeningLabels = disambiguateLabels(listeningExercises ?? [], (e) => e.title);
  const verbLabels = disambiguateLabels(
    verbDrills ?? [],
    (v) => `${v.infinitive} — ${v.translation}`
  );
  const fillBlankLabels = disambiguateLabels(fillBlankDrills ?? [], (d) => d.title);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <h1 className="text-2xl">Courses</h1>

      <form
        action={createCourse}
        className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4"
      >
        <h2 className="font-heading font-bold">New course</h2>
        <p className="text-sm text-text-muted">
          Bundle existing content under one name, then assign the whole
          bundle to a student in one click from their page.
        </p>
        <input
          name="title"
          placeholder="Course name, e.g. Beginner Hebrew"
          required
          className="rounded-sm border border-border bg-surface px-3 py-2 text-text"
        />
        <textarea
          name="description"
          placeholder="Description (optional)"
          rows={2}
          className="rounded-sm border border-border bg-surface px-3 py-2 text-text"
        />

        {decks && decks.length > 0 && (
          <div>
            <h3 className="mb-1 text-sm font-semibold text-text-faint">Decks</h3>
            <div className="flex flex-col gap-1">
              {decks.map((d) => (
                <label key={d.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="decks" value={d.id} />
                  <span dir="auto">{deckLabels.get(d.id)}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {listeningExercises && listeningExercises.length > 0 && (
          <div>
            <h3 className="mb-1 text-sm font-semibold text-text-faint">
              Listening Exercises
            </h3>
            <div className="flex flex-col gap-1">
              {listeningExercises.map((e) => (
                <label key={e.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="listening" value={e.id} />
                  <span dir="auto">{listeningLabels.get(e.id)}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {verbDrills && verbDrills.length > 0 && (
          <div>
            <h3 className="mb-1 text-sm font-semibold text-text-faint">Verb Drills</h3>
            <div className="flex flex-col gap-1">
              {verbDrills.map((v) => (
                <label key={v.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="verbs" value={v.id} />
                  <span dir="auto">{verbLabels.get(v.id)}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {fillBlankDrills && fillBlankDrills.length > 0 && (
          <div>
            <h3 className="mb-1 text-sm font-semibold text-text-faint">
              Fill in the Blanks
            </h3>
            <div className="flex flex-col gap-1">
              {fillBlankDrills.map((d) => (
                <label key={d.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="fillblanks" value={d.id} />
                  <span dir="auto">{fillBlankLabels.get(d.id)}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          className="self-start rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent-hover"
        >
          Create course
        </button>
      </form>

      <ul className="flex flex-col gap-2">
        {courses && courses.length > 0 ? (
          courses.map((course) => (
            <li key={course.id}>
              <Link
                href={`/teacher/courses/${course.id}`}
                className="block rounded-md border border-border bg-surface p-4 hover:bg-bg-alt"
              >
                <div className="font-medium">{course.title}</div>
                {course.description && (
                  <div className="text-sm text-text-muted">
                    {course.description}
                  </div>
                )}
              </Link>
            </li>
          ))
        ) : (
          <p className="text-text-muted">
            No courses yet — create your first one above.
          </p>
        )}
      </ul>
    </div>
  );
}
