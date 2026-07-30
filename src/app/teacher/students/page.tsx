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
      <h1 className="text-2xl">Students</h1>

      <form
        action={addStudent}
        className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4"
      >
        <h2 className="font-heading font-bold">Add student</h2>
        <input
          name="email"
          type="email"
          placeholder="Student's Gmail address"
          required
          className="rounded-sm border border-border bg-surface px-3 py-2 text-text"
        />
        <input
          name="full_name"
          placeholder="Name (optional)"
          className="rounded-sm border border-border bg-surface px-3 py-2 text-text"
        />
        <button
          type="submit"
          className="self-start rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent-hover"
        >
          Add student
        </button>
      </form>

      <form
        action={addStudentsBulk}
        className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4"
      >
        <h2 className="font-heading font-bold">Add a list of students</h2>
        <p className="text-sm text-text-muted">
          Paste one student per line, copied straight from a spreadsheet or
          contact list. Any of these work:
        </p>
        <pre className="rounded-sm bg-bg-alt p-2 text-xs text-text-muted">
{`student1@gmail.com
student2@gmail.com, Dana Levi
Yossi Cohen, student3@gmail.com`}
        </pre>
        <textarea
          name="emails"
          rows={6}
          placeholder="Paste your list here..."
          required
          className="rounded-sm border border-border bg-surface px-3 py-2 font-mono text-sm text-text"
        />
        <button
          type="submit"
          className="self-start rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent-hover"
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
                className="flex items-center justify-between gap-4 rounded-md border border-border bg-surface p-4"
              >
                <div>
                  <div className="font-medium">
                    {student.full_name || student.email}
                  </div>
                  {student.full_name && (
                    <div className="text-sm text-text-muted">
                      {student.email}
                    </div>
                  )}
                  {profileId ? (
                    <Link
                      href={`/teacher/students/${profileId}/progress`}
                      className="text-sm text-accent-2 hover:underline"
                    >
                      View progress
                    </Link>
                  ) : (
                    <span className="text-sm text-text-faint">
                      Hasn&apos;t signed in yet
                    </span>
                  )}
                </div>
                <form action={removeStudentWithEmail}>
                  <button
                    type="submit"
                    className="text-sm text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </form>
              </li>
            );
          })
        ) : (
          <p className="text-text-muted">
            No students yet — add one above using their Gmail address.
          </p>
        )}
      </ul>
    </div>
  );
}
