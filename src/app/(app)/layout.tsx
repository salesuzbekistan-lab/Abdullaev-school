import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { signOut } from "@/app/login/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <div className="flex min-h-full flex-1 flex-col bg-parchment">
      <header className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
        <span className="font-display text-xl font-semibold text-navy">Abdullayev School</span>
        <div className="flex items-center gap-4 text-sm text-ink/80">
          <span>
            {profile.full_name} · {profile.role}
          </span>
          <form action={signOut}>
            <button type="submit" className="text-navy underline">
              Chiqish
            </button>
          </form>
        </div>
      </header>
      <main className="flex flex-1 flex-col px-6 py-8">{children}</main>
    </div>
  );
}
