import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";

export default async function StudentDashboard() {
  const profile = await getCurrentProfile();
  if (profile?.role !== "student") redirect("/login");

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-navy">Mening darslarim</h1>
      <p className="mt-2 text-ink/70">
        Bugungi dars va uy vazifalari shu yerda ko&apos;rinadi.
      </p>
    </div>
  );
}
