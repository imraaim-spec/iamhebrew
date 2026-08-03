"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function addStudent(formData: FormData) {
  const email = (formData.get("email") as string).trim().toLowerCase();
  const fullName = formData.get("full_name") as string;

  const supabase = await createClient();
  await supabase
    .from("allowed_emails")
    .insert({ email, full_name: fullName || null, role: "student" });

  revalidatePath("/teacher/students");
  redirect("/teacher/students");
}

export async function addStudentsBulk(formData: FormData) {
  const raw = (formData.get("emails") as string) || "";
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const emailPattern = /[^\s,;<>]+@[^\s,;<>]+\.[^\s,;<>]+/;

  const rows = lines.flatMap((line) => {
    const match = line.match(emailPattern);
    if (!match) return [];
    const email = match[0].toLowerCase();
    const name = line.replace(match[0], "").replace(/[,;<>]/g, "").trim();
    return [{ email, full_name: name || null, role: "student" as const }];
  });

  if (rows.length === 0) return;

  const supabase = await createClient();
  // ignoreDuplicates: true so re-pasting a list, or accidentally including
  // an email that's already registered (e.g. the teacher's), never
  // overwrites an existing row.
  await supabase
    .from("allowed_emails")
    .upsert(rows, { onConflict: "email", ignoreDuplicates: true });

  revalidatePath("/teacher/students");
  redirect("/teacher/students");
}

export async function removeStudent(email: string) {
  const supabase = await createClient();
  await supabase.from("allowed_emails").delete().eq("email", email);
  revalidatePath("/teacher/students");
}
