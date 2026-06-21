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

export async function updateLesson(lessonId: string, formData: FormData) {
  await requireStaffOrTeacher();
  const supabase = await createClient();

  const title = String(formData.get("title"));
  const scheduled_date = String(formData.get("scheduled_date"));
  const theory_content = String(formData.get("theory_content") ?? "");
  const video_url = String(formData.get("video_url") ?? "") || null;

  const { error } = await supabase
    .from("lessons")
    .update({ title, scheduled_date, theory_content, video_url })
    .eq("id", lessonId);

  if (error) throw new Error(error.message);

  revalidatePath(`/teacher/calendar/${lessonId}`);
  revalidatePath("/teacher/calendar");
}

export async function setLessonStatus(lessonId: string, status: "draft" | "scheduled" | "published") {
  const profile = await requireStaffOrTeacher();
  const supabase = await createClient();

  const { error } = await supabase
    .from("lessons")
    .update({
      status,
      ...(status !== "draft" ? { approved_by: profile.id, approved_at: new Date().toISOString() } : {}),
    })
    .eq("id", lessonId);

  if (error) throw new Error(error.message);

  revalidatePath(`/teacher/calendar/${lessonId}`);
  revalidatePath("/teacher/calendar");
}

export async function upsertStage(lessonId: string, formData: FormData) {
  await requireStaffOrTeacher();
  const supabase = await createClient();

  const stage_type = String(formData.get("stage_type"));
  const stage_order = Number(formData.get("stage_order"));
  const pass_threshold = String(formData.get("pass_threshold") ?? "0.750");
  const contentRaw = String(formData.get("content") ?? "{}");

  let content: unknown;
  try {
    content = JSON.parse(contentRaw);
  } catch {
    throw new Error("Content JSON noto'g'ri formatda");
  }

  const { error } = await supabase
    .from("homework_stages")
    .upsert(
      { lesson_id: lessonId, stage_type, stage_order, pass_threshold, content },
      { onConflict: "lesson_id,stage_order" },
    );

  if (error) throw new Error(error.message);

  revalidatePath(`/teacher/calendar/${lessonId}`);
}
