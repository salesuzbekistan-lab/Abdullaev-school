import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";

export default async function TeacherDashboard() {
  const profile = await getCurrentProfile();
  if (profile?.role !== "teacher" && profile?.role !== "commission") redirect("/login");

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-navy">
        Sinflarim va content calendar
      </h1>
      <p className="mt-2 text-ink/70">
        Dars rejalashtirish, baholash navbati va o&apos;quvchilarga izoh yozish shu yerda
        bo&apos;ladi.
      </p>
      <Link
        href="/teacher/calendar"
        className="mt-4 inline-block rounded-md bg-navy px-4 py-2 text-parchment"
      >
        Content calendar&apos;ni ochish
      </Link>
    </div>
  );
}
