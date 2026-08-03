import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { removeStudent } from "./actions";

function formatLessonDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function StudentsPage() {
  const supabase = await createClient();
  const { data: students } = await supabase
    .from("allowed_emails")
    .select("email, full_name, role, added_at")
    .eq("role", "student")
    .order("added_at", { ascending: false });

  const { data: studentProfiles } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("role", "student");

  const profileIdByEmail = new Map(
    (studentProfiles ?? []).map((p) => [p.email, p.id])
  );

  const { data: lessonNotes } = await supabase
    .from("lesson_notes")
    .select("student_id, lesson_date, title")
    .order("lesson_date", { ascending: false });

  const lastLessonByStudentId = new Map<string, { date: string; title: string | null }>();
  for (const note of lessonNotes ?? []) {
    if (!lastLessonByStudentId.has(note.student_id)) {
      lastLessonByStudentId.set(note.student_id, {
        date: note.lesson_date,
        title: note.title,
      });
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl">Students</h1>
        <Link
          href="/teacher/students/new"
          className="rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent-hover"
        >
          + Add student
        </Link>
      </div>

      <ul className="flex flex-col gap-2">
        {students && students.length > 0 ? (
          students.map((student) => {
            const removeStudentWithEmail = removeStudent.bind(null, student.email);
            const profileId = profileIdByEmail.get(student.email);
            const lastLesson = profileId ? lastLessonByStudentId.get(profileId) : undefined;

            const cardContent = (
              <>
                <div className="font-medium">
                  {student.full_name || student.email}
                </div>
                {student.full_name && (
                  <div className="text-sm text-text-muted">{student.email}</div>
                )}
                {profileId ? (
                  <div className="text-sm text-text-faint">
                    {lastLesson
                      ? `${formatLessonDate(lastLesson.date)}${
                          lastLesson.title ? `, ${lastLesson.title}` : ""
                        }`
                      : "No lessons logged yet"}
                  </div>
                ) : (
                  <div className="text-sm text-text-faint">
                    Hasn&apos;t signed in yet
                  </div>
                )}
              </>
            );

            return (
              <li
                key={student.email}
                className="flex items-center justify-between gap-4 rounded-md border border-border bg-surface p-4"
              >
                {profileId ? (
                  <Link
                    href={`/teacher/students/${profileId}/progress`}
                    className="flex-1 hover:opacity-80"
                  >
                    {cardContent}
                  </Link>
                ) : (
                  <div className="flex-1">{cardContent}</div>
                )}
                <form action={removeStudentWithEmail}>
                  <button
                    type="submit"
                    className="shrink-0 text-sm text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </form>
              </li>
            );
          })
        ) : (
          <p className="text-text-muted">
            No students yet — add one to get started.
          </p>
        )}
      </ul>
    </div>
  );
}
