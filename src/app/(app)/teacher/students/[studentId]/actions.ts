"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function addComment(studentId: string, formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || !["teacher", "commission", "admin"].includes(profile.role)) {
    redirect("/login");
  }

  const supabase = await createClient();
  const comment_text = String(formData.get("comment_text"));
  const lesson_id = String(formData.get("lesson_id") || "") || null;

  const { error } = await supabase.from("teacher_comments").insert({
    teacher_id: profile!.id,
    student_id: studentId,
    lesson_id,
    comment_text,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/teacher/students/${studentId}`);
}
