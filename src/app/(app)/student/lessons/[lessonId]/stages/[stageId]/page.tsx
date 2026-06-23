import { redirect, notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { STAGE_TYPE_LABELS } from "@/lib/curriculum";
import { submitStage } from "./actions";

type Question = { prompt: string; choices: string[] };

export default async function StageQuizPage({
  params,
}: {
  params: Promise<{ lessonId: string; stageId: string }>;
}) {
  const { lessonId, stageId } = await params;
  const profile = await getCurrentProfile();
  if (profile?.role !== "student") redirect("/login");

  const supabase = await createClient();
  const { data: stage } = await supabase
    .from("homework_stages")
    .select("id, stage_type, pass_threshold, content, submissions(score, correct_count, total_count, answers)")
    .eq("id", stageId)
    .single();

  if (!stage) notFound();

  const questions: Question[] = (
    stage.content as { questions: { prompt: string; choices: string[] }[] }
  ).questions.map((q) => ({ prompt: q.prompt, choices: q.choices }));

  const submission = stage.submissions?.[0];
  const passed = submission && submission.score >= Number(stage.pass_threshold);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold text-navy">
        {STAGE_TYPE_LABELS[stage.stage_type] ?? stage.stage_type}
      </h1>

      {submission && (
        <div
          className={`rounded-lg border p-4 ${passed ? "border-navy bg-navy/5" : "border-error/30 bg-error/5"}`}
        >
          Natija: {submission.correct_count}/{submission.total_count} to&apos;g&apos;ri (
          {Math.round(submission.score * 100)}%) — {passed ? "o'tdingiz ✓" : "qayta urinib ko'ring"}
        </div>
      )}

      <form action={submitStage.bind(null, lessonId, stageId)} className="flex flex-col gap-6">
        {questions.map((q, i) => {
          const prevAnswer = submission?.answers?.[i];
          return (
            <fieldset key={i} className="rounded-lg border border-ink/10 bg-white p-4">
              <legend className="font-medium text-ink">
                {i + 1}. {q.prompt}
              </legend>
              <div className="mt-2 flex flex-col gap-2">
                {q.choices.map((choice, ci) => (
                  <label key={ci} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={`q${i}`}
                      value={ci}
                      required
                      defaultChecked={prevAnswer === ci}
                    />
                    {choice}
                  </label>
                ))}
              </div>
            </fieldset>
          );
        })}
        <button type="submit" className="self-start rounded-md bg-navy px-5 py-2 text-parchment">
          {submission ? "Qayta yuborish" : "Yuborish"}
        </button>
      </form>
    </div>
  );
}
