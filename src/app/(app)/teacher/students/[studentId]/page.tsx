import { redirect, notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { addComment } from "./actions";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const profile = await getCurrentProfile();
  if (!profile || !["teacher", "commission", "admin"].includes(profile.role)) {
    redirect("/login");
  }

  const supabase = await createClient();

  const { data: student } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", studentId)
    .single();

  if (!student) notFound();

  const [{ data: mastery }, { data: comments }, { data: recentLessons }] = await Promise.all([
    supabase.from("mastery_scores").select("mastery_pct, subjects(name)").eq("student_id", studentId),
    supabase
      .from("teacher_comments")
      .select("id, comment_text, created_at, lessons(title)")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false }),
    supabase
      .from("lessons")
      .select("id, title")
      .order("scheduled_date", { ascending: false })
      .limit(20),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-navy">{student.full_name}</h1>
        <div className="mt-2 flex flex-wrap gap-4">
          {mastery?.map((m, i) => (
            <p key={i} className="text-ink/70">
              {(m.subjects as unknown as { name: string } | null)?.name}:{" "}
              <strong className="text-gold-ink">{Math.round(m.mastery_pct * 100)}%</strong>
            </p>
          ))}
        </div>
      </div>

      {profile.role === "teacher" && (
        <form
          action={addComment.bind(null, studentId)}
          className="flex max-w-xl flex-col gap-3 rounded-lg border border-ink/10 bg-white p-5"
        >
          <h2 className="font-display text-xl text-navy">Izoh qoldirish</h2>
          <label htmlFor="lesson_id" className="sr-only">
            Bog&apos;liq dars
          </label>
          <select id="lesson_id" name="lesson_id" className="rounded-md border border-ink/20 px-4 py-2">
            <option value="">(darsga bog&apos;lanmagan)</option>
            {recentLessons?.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
          <label htmlFor="comment_text" className="sr-only">
            Izoh matni
          </label>
          <textarea
            id="comment_text"
            name="comment_text"
            required
            rows={3}
            placeholder="Izoh matni"
            className="rounded-md border border-ink/20 px-4 py-2"
          />
          <button type="submit" className="self-start rounded-md bg-navy px-4 py-2 text-parchment">
            Yuborish
          </button>
        </form>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="font-display text-xl text-navy">Izohlar tarixi</h2>
        {comments?.map((c) => (
          <div key={c.id} className="rounded-lg border border-ink/10 bg-white p-4">
            <p className="text-xs text-ink/70">
              {new Date(c.created_at).toLocaleDateString("uz-UZ")}
              {c.lessons ? ` · ${(c.lessons as unknown as { title: string }).title}` : ""}
            </p>
            <p className="mt-1 text-ink/80">{c.comment_text}</p>
          </div>
        ))}
        {(!comments || comments.length === 0) && (
          <p className="text-ink/70">Hali izoh yozilmagan.</p>
        )}
      </div>
    </div>
  );
}
