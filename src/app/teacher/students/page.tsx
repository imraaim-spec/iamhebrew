import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { addStudent, addStudentsBulk, removeStudent } from "./actions";

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

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <h1 className="text-2xl font-semibold">Students</h1>

      <form
        action={addStudent}
        className="flex flex-col gap-3 rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]"
      >
        <h2 className="font-medium">Add student</h2>
        <input
          name="email"
          type="email"
          placeholder="Student's Gmail address"
          required
          className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
        />
        <input
          name="full_name"
          placeholder="Name (optional)"
          className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
        />
        <button
          type="submit"
          className="self-start rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Add student
        </button>
      </form>

      <form
        action={addStudentsBulk}
        className="flex flex-col gap-3 rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]"
      >
        <h2 className="font-medium">Add a list of students</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Paste one student per line, copied straight from a spreadsheet or
          contact list. Any of these work:
        </p>
        <pre className="rounded bg-black/[.03] p-2 text-xs text-zinc-600 dark:bg-white/[.05] dark:text-zinc-400">
{`student1@gmail.com
student2@gmail.com, Dana Levi
Yossi Cohen, student3@gmail.com`}
        </pre>
        <textarea
          name="emails"
          rows={6}
          placeholder="Paste your list here..."
          required
          className="rounded border border-black/[.08] px-3 py-2 font-mono text-sm dark:border-white/[.145] dark:bg-black"
        />
        <button
          type="submit"
          className="self-start rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Add list
        </button>
      </form>

      <ul className="flex flex-col gap-2">
        {students && students.length > 0 ? (
          students.map((student) => {
            const removeStudentWithEmail = removeStudent.bind(null, student.email);
            const profileId = profileIdByEmail.get(student.email);
            return (
              <li
                key={student.email}
                className="flex items-center justify-between gap-4 rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]"
              >
                <div>
                  <div className="font-medium">
                    {student.full_name || student.email}
                  </div>
                  {student.full_name && (
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      {student.email}
                    </div>
                  )}
                  {profileId ? (
                    <Link
                      href={`/teacher/students/${profileId}/progress`}
                      className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                    >
                      View progress
                    </Link>
                  ) : (
                    <span className="text-sm text-zinc-400">
                      Hasn&apos;t signed in yet
                    </span>
                  )}
                </div>
                <form action={removeStudentWithEmail}>
                  <button
                    type="submit"
                    className="text-sm text-red-600 hover:underline dark:text-red-400"
                  >
                    Remove
                  </button>
                </form>
              </li>
            );
          })
        ) : (
          <p className="text-zinc-600 dark:text-zinc-400">
            No students yet — add one above using their Gmail address.
          </p>
        )}
      </ul>
    </div>
  );
}
