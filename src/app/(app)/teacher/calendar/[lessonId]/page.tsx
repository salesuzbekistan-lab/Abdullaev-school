import { redirect, notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { LESSON_STATUS_LABELS, STAGE_TYPE_LABELS, STAGE_TYPE_ORDER } from "@/lib/curriculum";
import { updateLesson, setLessonStatus, upsertStage } from "./actions";

export default async function LessonDetailPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const profile = await getCurrentProfile();
  if (!profile || !["teacher", "commission", "admin"].includes(profile.role)) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, title, scheduled_date, status, theory_content, video_url, subjects(name), classes(name)")
    .eq("id", lessonId)
    .single();

  if (!lesson) notFound();

  const { data: stages } = await supabase
    .from("homework_stages")
    .select("id, stage_type, stage_order, pass_threshold, content")
    .eq("lesson_id", lessonId)
    .order("stage_order");

  const subjectName = (lesson.subjects as unknown as { name: string } | null)?.name;
  const className = (lesson.classes as unknown as { name: string } | null)?.name;
  const stageByOrder = new Map((stages ?? []).map((s) => [s.stage_order, s]));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-sm text-ink/60">
          {subjectName} / {className}
        </p>
        <h1 className="font-display text-3xl font-semibold text-navy">{lesson.title}</h1>
        <p className="mt-1 text-sm text-ink/70">
          Holat: <strong>{LESSON_STATUS_LABELS[lesson.status] ?? lesson.status}</strong>
        </p>
      </div>

      <div className="flex gap-3">
        <form action={setLessonStatus.bind(null, lessonId, "draft")}>
          <button
            type="submit"
            disabled={lesson.status === "draft"}
            className="rounded-md border border-navy px-4 py-2 text-navy disabled:opacity-40"
          >
            Qoralamaga qaytarish
          </button>
        </form>
        <form action={setLessonStatus.bind(null, lessonId, "scheduled")}>
          <button
            type="submit"
            disabled={lesson.status === "scheduled"}
            className="rounded-md border border-navy px-4 py-2 text-navy disabled:opacity-40"
          >
            Rejalashtirilgan deb belgilash
          </button>
        </form>
        <form action={setLessonStatus.bind(null, lessonId, "published")}>
          <button
            type="submit"
            disabled={lesson.status === "published"}
            className="rounded-md bg-gold px-4 py-2 text-ink disabled:opacity-40"
          >
            Tasdiqlash va chop etish
          </button>
        </form>
      </div>

      <form
        action={updateLesson.bind(null, lessonId)}
        className="flex max-w-xl flex-col gap-3 rounded-lg border border-ink/10 bg-white p-5"
      >
        <h2 className="font-display text-xl text-navy">Dars ma&apos;lumotlari</h2>
        <input
          name="title"
          defaultValue={lesson.title}
          required
          className="rounded-md border border-ink/20 px-4 py-2"
        />
        <input
          name="scheduled_date"
          type="date"
          defaultValue={lesson.scheduled_date}
          required
          className="rounded-md border border-ink/20 px-4 py-2"
        />
        <input
          name="video_url"
          placeholder="Video havola (ixtiyoriy)"
          defaultValue={lesson.video_url ?? ""}
          className="rounded-md border border-ink/20 px-4 py-2"
        />
        <textarea
          name="theory_content"
          defaultValue={lesson.theory_content ?? ""}
          rows={4}
          className="rounded-md border border-ink/20 px-4 py-2"
        />
        <button type="submit" className="rounded-md bg-navy px-4 py-2 text-parchment">
          Saqlash
        </button>
      </form>

      <div className="flex flex-col gap-4">
        <h2 className="font-display text-xl text-navy">Uy vazifa bosqichlari (4 ta)</h2>
        {STAGE_TYPE_ORDER.map((stageType, idx) => {
          const stageOrder = idx + 1;
          const existing = stageByOrder.get(stageOrder);
          return (
            <form
              key={stageType}
              action={upsertStage.bind(null, lessonId)}
              className="flex flex-col gap-2 rounded-lg border border-ink/10 bg-white p-5"
            >
              <input type="hidden" name="stage_type" value={stageType} />
              <input type="hidden" name="stage_order" value={stageOrder} />
              <h3 className="font-display text-lg text-navy">{STAGE_TYPE_LABELS[stageType]}</h3>
              <label className="text-xs text-ink/60">O&apos;tish chegarasi (0-1)</label>
              <input
                name="pass_threshold"
                defaultValue={existing?.pass_threshold ?? "0.750"}
                className="w-32 rounded-md border border-ink/20 px-3 py-1.5 text-sm"
              />
              <label className="text-xs text-ink/60">Savollar (JSON)</label>
              <textarea
                name="content"
                defaultValue={JSON.stringify(existing?.content ?? { questions: [] }, null, 2)}
                rows={8}
                className="rounded-md border border-ink/20 px-3 py-2 font-mono text-xs"
              />
              <button
                type="submit"
                className="self-start rounded-md border border-navy px-4 py-1.5 text-sm text-navy"
              >
                {existing ? "Yangilash" : "Qo'shish"}
              </button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
