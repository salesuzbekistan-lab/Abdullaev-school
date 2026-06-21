import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function ParentDashboard() {
  const profile = await getCurrentProfile();
  if (profile?.role !== "parent") redirect("/login");

  const supabase = await createClient();

  const { data: links } = await supabase
    .from("student_parents")
    .select("student_id")
    .eq("parent_id", profile.id);

  const children = await Promise.all(
    (links ?? []).map(async (link) => {
      const studentId = link.student_id;

      const [{ data: studentProfile }, { data: mastery }, { data: comments }] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", studentId).single(),
        supabase.from("mastery_scores").select("mastery_pct, subjects(name)").eq("student_id", studentId),
        supabase
          .from("teacher_comments")
          .select("id, comment_text, created_at, lessons(title)")
          .eq("student_id", studentId)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      return {
        studentId,
        fullName: studentProfile?.full_name ?? "Noma'lum",
        mastery: mastery ?? [],
        comments: comments ?? [],
      };
    }),
  );

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-display text-3xl font-semibold text-navy">Farzandim</h1>
        <p className="mt-2 text-ink/70">Mastery %, teacher comment va bildirishnomalar shu yerda.</p>
      </div>

      {children.map((child) => (
        <div key={child.studentId} className="flex flex-col gap-4 rounded-lg border border-ink/10 bg-white p-5">
          <h2 className="font-display text-2xl text-navy">{child.fullName}</h2>

          <div className="flex gap-4">
            {child.mastery.map((m, i) => (
              <div key={i} className="rounded-lg border border-ink/10 px-4 py-3">
                <p className="text-xs uppercase text-ink/50">
                  {(m.subjects as unknown as { name: string } | null)?.name}
                </p>
                <p className="font-display text-xl text-gold">{Math.round(m.mastery_pct * 100)}%</p>
              </div>
            ))}
            {child.mastery.length === 0 && (
              <p className="text-ink/60">Hali baholar mavjud emas.</p>
            )}
          </div>

          <div>
            <h3 className="font-medium text-navy">O&apos;qituvchi izohlari</h3>
            <div className="mt-2 flex flex-col gap-2">
              {child.comments.map((c) => (
                <div key={c.id} className="rounded-md border border-ink/10 p-3">
                  <p className="text-xs text-ink/50">
                    {new Date(c.created_at).toLocaleDateString("uz-UZ")}
                    {c.lessons ? ` · ${(c.lessons as unknown as { title: string }).title}` : ""}
                  </p>
                  <p className="mt-1 text-ink/80">{c.comment_text}</p>
                </div>
              ))}
              {child.comments.length === 0 && (
                <p className="text-ink/60">Hali izoh yozilmagan.</p>
              )}
            </div>
          </div>
        </div>
      ))}

      {children.length === 0 && <p className="text-ink/60">Hech qaysi farzand bog&apos;lanmagan.</p>}
    </div>
  );
}
