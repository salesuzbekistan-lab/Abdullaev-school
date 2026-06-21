"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type Question = { prompt: string; choices: string[]; correct_index: number };

export async function submitStage(lessonId: string, stageId: string, formData: FormData) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "student") redirect("/login");

  const supabase = await createClient();
  const { data: stage } = await supabase
    .from("homework_stages")
    .select("content")
    .eq("id", stageId)
    .single();

  if (!stage) throw new Error("Bosqich topilmadi");

  const questions = (stage.content as { questions: Question[] }).questions;
  const answers = questions.map((_, i) => Number(formData.get(`q${i}`)));
  const correct_count = answers.filter((a, i) => a === questions[i].correct_index).length;
  const total_count = questions.length;
  const score = total_count > 0 ? correct_count / total_count : 0;

  const { error } = await supabase.from("submissions").upsert(
    {
      student_id: profile.id,
      homework_stage_id: stageId,
      answers,
      score,
      correct_count,
      total_count,
    },
    { onConflict: "student_id,homework_stage_id" },
  );

  if (error) throw new Error(error.message);

  revalidatePath(`/student/lessons/${lessonId}`);
  redirect(`/student/lessons/${lessonId}/stages/${stageId}?submitted=1`);
}
