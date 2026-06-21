import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { STAGE_TYPE_LABELS } from "@/lib/curriculum";

type StageRow = {
  id: string;
  stage_order: number;
  stage_type: string;
  submissions: { score: number }[];
};

type LessonRow = {
  id: string;
  title: string;
  scheduled_date: string;
  subjects: { name: string } | null;
  homework_stages: StageRow[];
};

export default async function StudentDashboard() {
  const profile = await getCurrentProfile();
  if (profile?.role !== "student") redirect("/login");

  const supabase = await createClient();

  const [{ data: mastery }, { data: lessons }] = await Promise.all([
    supabase.from("mastery_scores").select("mastery_pct, subjects(name)"),
    supabase
      .from("lessons")
      .select("id, title, scheduled_date, subjects(name), homework_stages(id, stage_order, stage_type, submissions(score))")
      .order("scheduled_date", { ascending: false })
      .returns<LessonRow[]>(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-navy">Mening darslarim</h1>
        <p className="mt-2 text-ink/70">Bugungi va o&apos;tgan darslar, uy vazifalari shu yerda.</p>
      </div>

      {mastery && mastery.length > 0 && (
        <div className="flex gap-4">
          {mastery.map((m, i) => {
            const subjectName = (m.subjects as unknown as { name: string } | null)?.name;
            return (
              <div key={i} className="rounded-lg border border-ink/10 bg-white px-5 py-4">
                <p className="text-xs uppercase text-ink/50">{subjectName}</p>
                <p className="font-display text-2xl text-gold">
                  {Math.round(m.mastery_pct * 100)}%
                </p>
                <p className="text-xs text-ink/50">o&apos;zlashtirish</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {lessons?.map((l) => {
          const stages = (l.homework_stages ?? []).slice().sort((a, b) => a.stage_order - b.stage_order);
          const passedCount = stages.filter((s) => s.submissions?.[0]?.score >= 0.75).length;
          return (
            <Link
              key={l.id}
              href={`/student/lessons/${l.id}`}
              className="flex flex-col gap-1 rounded-lg border border-ink/10 bg-white p-5 hover:border-navy"
            >
              <p className="text-xs text-ink/50">
                {l.scheduled_date} · {(l.subjects as unknown as { name: string } | null)?.name}
              </p>
              <p className="font-display text-lg text-navy">{l.title}</p>
              <p className="text-sm text-ink/70">
                {passedCount}/{stages.length} bosqich bajarildi
              </p>
              <p className="text-xs text-ink/40">
                {stages.map((s) => STAGE_TYPE_LABELS[s.stage_type]?.split(". ")[1]).join(" · ")}
              </p>
            </Link>
          );
        })}
        {(!lessons || lessons.length === 0) && (
          <p className="text-ink/60">Hozircha sizga ochilgan dars yo&apos;q.</p>
        )}
      </div>
    </div>
  );
}
