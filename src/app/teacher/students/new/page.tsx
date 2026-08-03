import Link from "next/link";
import { addStudent, addStudentsBulk } from "../actions";
import { SubmitButton } from "@/components/submit-button";

export default function NewStudentPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl">Add student</h1>
        <Link href="/teacher/students" className="text-sm text-text-muted hover:underline">
          Back to students
        </Link>
      </div>

      <form
        action={addStudent}
        className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4"
      >
        <h2 className="font-heading font-bold">Add one student</h2>
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
        <SubmitButton className="self-start rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent-hover disabled:opacity-60">
          Add student
        </SubmitButton>
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
        <SubmitButton className="self-start rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent-hover disabled:opacity-60">
          Add list
        </SubmitButton>
      </form>
    </div>
  );
}
