import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { STAGE_TYPE_LABELS } from "@/lib/curriculum";

export default async function StudentLessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const profile = await getCurrentProfile();
  if (profile?.role !== "student") redirect("/login");

  const supabase = await createClient();

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, title, theory_content, video_url, scheduled_date, subjects(name)")
    .eq("id", lessonId)
    .single();

  if (!lesson) notFound();

  const { data: stages } = await supabase
    .from("homework_stages")
    .select("id, stage_order, stage_type, pass_threshold, submissions(score, correct_count, total_count)")
    .eq("lesson_id", lessonId)
    .order("stage_order");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-sm text-ink/70">
          {(lesson.subjects as unknown as { name: string } | null)?.name} · {lesson.scheduled_date}
        </p>
        <h1 className="font-display text-3xl font-semibold text-navy">{lesson.title}</h1>
      </div>

      {lesson.video_url && (
        <a
          href={lesson.video_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-navy underline"
        >
          Video darsni ochish (yangi oynada)
        </a>
      )}

      {lesson.theory_content && (
        <div className="rounded-lg border border-ink/10 bg-white p-5">
          <h2 className="font-display text-lg text-navy">Nazariy qism</h2>
          <p className="mt-2 whitespace-pre-wrap text-ink/80">{lesson.theory_content}</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="font-display text-lg text-navy">Uy vazifa bosqichlari</h2>
        {stages?.map((s) => {
          const submission = s.submissions?.[0];
          const passed = submission && submission.score >= Number(s.pass_threshold);
          return (
            <Link
              key={s.id}
              href={`/student/lessons/${lessonId}/stages/${s.id}`}
              className="flex items-center justify-between rounded-lg border border-ink/10 bg-white p-4 transition-colors hover:border-navy"
            >
              <span>{STAGE_TYPE_LABELS[s.stage_type] ?? s.stage_type}</span>
              {submission ? (
                <span className={passed ? "text-navy" : "text-error"}>
                  {submission.correct_count}/{submission.total_count} to&apos;g&apos;ri (
                  {Math.round(submission.score * 100)}%) {passed ? "✓" : "qayta urinish kerak"}
                </span>
              ) : (
                <span className="text-gold-ink">Boshlash →</span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
