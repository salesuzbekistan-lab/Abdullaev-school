import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { LESSON_STATUS_LABELS } from "@/lib/curriculum";
import { createLesson } from "./actions";

export default async function ContentCalendarPage() {
  const profile = await getCurrentProfile();
  if (!profile || !["teacher", "commission", "admin"].includes(profile.role)) {
    redirect("/login");
  }

  const supabase = await createClient();

  const [{ data: subjects }, { data: classes }, { data: lessons }] = await Promise.all([
    supabase.from("subjects").select("id, name").order("name"),
    supabase.from("classes").select("id, name").order("name"),
    supabase
      .from("lessons")
      .select("id, title, scheduled_date, status, subjects(name), classes(name), homework_stages(id)")
      .order("scheduled_date"),
  ]);

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-navy">Content calendar</h1>
        <p className="mt-2 text-ink/70">
          Komissiya va o&apos;qituvchilar darslarni oldindan (taxminan 1 chorak) rejalashtiradi.
          Qoralama → Rejalashtirilgan → Chop etilgan bosqichlari orqali tasdiqlanadi.
        </p>
      </div>

      <form
        action={createLesson}
        className="flex max-w-xl flex-col gap-3 rounded-lg border border-ink/10 bg-white p-5"
      >
        <h2 className="font-display text-xl text-navy">Yangi dars qo&apos;shish</h2>
        <select name="subject_id" required className="rounded-md border border-ink/20 px-4 py-2">
          {subjects?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select name="class_id" required className="rounded-md border border-ink/20 px-4 py-2">
          {classes?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          name="title"
          placeholder="Dars mavzusi"
          required
          className="rounded-md border border-ink/20 px-4 py-2"
        />
        <input
          name="scheduled_date"
          type="date"
          required
          className="rounded-md border border-ink/20 px-4 py-2"
        />
        <textarea
          name="theory_content"
          placeholder="Nazariy qism (qisqacha)"
          rows={3}
          className="rounded-md border border-ink/20 px-4 py-2"
        />
        <button type="submit" className="rounded-md bg-navy px-4 py-2 text-parchment">
          Qoralama sifatida saqlash
        </button>
      </form>

      <table className="w-full max-w-4xl text-left text-sm">
        <thead className="text-ink/60">
          <tr>
            <th className="py-2">Sana</th>
            <th className="py-2">Fan / Sinf</th>
            <th className="py-2">Mavzu</th>
            <th className="py-2">Uy vazifa</th>
            <th className="py-2">Holat</th>
          </tr>
        </thead>
        <tbody>
          {lessons?.map((l) => {
            const subjectName = (l.subjects as unknown as { name: string } | null)?.name;
            const className = (l.classes as unknown as { name: string } | null)?.name;
            const isToday = l.scheduled_date === todayStr;
            return (
              <tr
                key={l.id}
                className={`border-t border-ink/10 ${isToday ? "bg-gold/10" : ""}`}
              >
                <td className="py-2">{l.scheduled_date}</td>
                <td className="py-2">
                  {subjectName} / {className}
                </td>
                <td className="py-2">
                  <Link href={`/teacher/calendar/${l.id}`} className="text-navy underline">
                    {l.title}
                  </Link>
                </td>
                <td className="py-2">{l.homework_stages?.length ?? 0}/4 bosqich</td>
                <td className="py-2">{LESSON_STATUS_LABELS[l.status] ?? l.status}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
