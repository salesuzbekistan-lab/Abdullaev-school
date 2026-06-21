"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

async function requireStaffOrTeacher() {
  const profile = await getCurrentProfile();
  if (!profile || !["teacher", "commission", "admin"].includes(profile.role)) {
    redirect("/login");
  }
  return profile!;
}

export async function createLesson(formData: FormData) {
  const profile = await requireStaffOrTeacher();
  const supabase = await createClient();

  const subject_id = String(formData.get("subject_id"));
  const class_id = String(formData.get("class_id"));
  const title = String(formData.get("title"));
  const scheduled_date = String(formData.get("scheduled_date"));
  const theory_content = String(formData.get("theory_content") ?? "");

  const { data, error } = await supabase
    .from("lessons")
    .insert({
      subject_id,
      class_id,
      title,
      scheduled_date,
      theory_content,
      status: "draft",
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/teacher/calendar");
  redirect(`/teacher/calendar/${data.id}`);
}
