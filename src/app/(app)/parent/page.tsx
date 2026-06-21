import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";

export default async function ParentDashboard() {
  const profile = await getCurrentProfile();
  if (profile?.role !== "parent") redirect("/login");

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-navy">Farzandim</h1>
      <p className="mt-2 text-ink/70">
        Mastery %, teacher comment va bildirishnomalar shu yerda ko&apos;rinadi.
      </p>
    </div>
  );
}
