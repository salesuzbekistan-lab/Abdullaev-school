import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function TeacherStudentsPage() {
  const profile = await getCurrentProfile();
  if (!profile || !["teacher", "commission", "admin"].includes(profile.role)) {
    redirect("/login");
  }

  const supabase = await createClient();

  const { data: students } = await supabase
    .from("profiles")
    .select("id, full_name, mastery_scores(mastery_pct, subjects(name))")
    .eq("role", "student")
    .order("full_name");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-navy">O&apos;quvchilar</h1>
        <p className="mt-2 text-ink/70">O&apos;zlashtirish foizi va izohlar shu yerdan boshqariladi.</p>
      </div>

      <table className="w-full max-w-2xl text-left text-sm">
        <thead className="text-ink/60">
          <tr>
            <th className="py-2">Ism</th>
            <th className="py-2">Matematika</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {students?.map((s) => {
            const mastery = (
              s.mastery_scores as unknown as { mastery_pct: number; subjects: { name: string } | null }[]
            )?.[0];
            return (
              <tr key={s.id} className="border-t border-ink/10">
                <td className="py-2">{s.full_name}</td>
                <td className="py-2">
                  {mastery ? `${Math.round(mastery.mastery_pct * 100)}%` : "—"}
                </td>
                <td className="py-2">
                  <Link href={`/teacher/students/${s.id}`} className="text-navy underline">
                    Batafsil
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
