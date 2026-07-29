import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createCourse } from "./actions";

export default async function CoursesPage() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, description")
    .order("created_at", { ascending: false });

  const { data: decks } = await supabase.from("decks").select("id, title").order("title");
  const { data: listeningExercises } = await supabase
    .from("listening_exercises")
    .select("id, title")
    .order("title");
  const { data: verbDrills } = await supabase
    .from("verb_drills")
    .select("id, infinitive, translation")
    .order("infinitive");
  const { data: fillBlankDrills } = await supabase
    .from("fill_blank_drills")
    .select("id, title")
    .order("title");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <h1 className="text-2xl font-semibold">Courses</h1>

      <form
        action={createCourse}
        className="flex flex-col gap-3 rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]"
      >
        <h2 className="font-medium">New course</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Bundle existing content under one name, then assign the whole
          bundle to a student in one click from their page.
        </p>
        <input
          name="title"
          placeholder="Course name, e.g. Beginner Hebrew"
          required
          className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
        />
        <textarea
          name="description"
          placeholder="Description (optional)"
          rows={2}
          className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
        />

        {decks && decks.length > 0 && (
          <div>
            <h3 className="mb-1 text-sm font-medium text-zinc-500">Decks</h3>
            <div className="flex flex-col gap-1">
              {decks.map((d) => (
                <label key={d.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="decks" value={d.id} />
                  {d.title}
                </label>
              ))}
            </div>
          </div>
        )}

        {listeningExercises && listeningExercises.length > 0 && (
          <div>
            <h3 className="mb-1 text-sm font-medium text-zinc-500">
              Listening Exercises
            </h3>
            <div className="flex flex-col gap-1">
              {listeningExercises.map((e) => (
                <label key={e.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="listening" value={e.id} />
                  {e.title}
                </label>
              ))}
            </div>
          </div>
        )}

        {verbDrills && verbDrills.length > 0 && (
          <div>
            <h3 className="mb-1 text-sm font-medium text-zinc-500">Verb Drills</h3>
            <div className="flex flex-col gap-1">
              {verbDrills.map((v) => (
                <label key={v.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="verbs" value={v.id} />
                  <span dir="auto">
                    {v.infinitive} — {v.translation}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {fillBlankDrills && fillBlankDrills.length > 0 && (
          <div>
            <h3 className="mb-1 text-sm font-medium text-zinc-500">
              Fill in the Blanks
            </h3>
            <div className="flex flex-col gap-1">
              {fillBlankDrills.map((d) => (
                <label key={d.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="fillblanks" value={d.id} />
                  {d.title}
                </label>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          className="self-start rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
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
                className="block rounded-lg border border-black/[.08] p-4 hover:bg-black/[.02] dark:border-white/[.145] dark:hover:bg-white/[.03]"
              >
                <div className="font-medium">{course.title}</div>
                {course.description && (
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    {course.description}
                  </div>
                )}
              </Link>
            </li>
          ))
        ) : (
          <p className="text-zinc-600 dark:text-zinc-400">
            No courses yet — create your first one above.
          </p>
        )}
      </ul>
    </div>
  );
}
