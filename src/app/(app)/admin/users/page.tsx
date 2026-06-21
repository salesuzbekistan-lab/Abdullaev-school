import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createUser } from "./actions";

export default async function AdminUsersPage() {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") redirect("/login");

  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .order("full_name");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-navy">Hisoblarni boshqarish</h1>
        <p className="mt-2 text-ink/70">
          Rollar faqat shu yerdan tayinlanadi — o&apos;z-o&apos;ziga ro&apos;yxatdan o&apos;tish yo&apos;q.
        </p>
      </div>

      <form action={createUser} className="flex max-w-md flex-col gap-3">
        <input
          name="full_name"
          placeholder="To'liq ism"
          required
          className="rounded-md border border-ink/20 bg-white px-4 py-2"
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="rounded-md border border-ink/20 bg-white px-4 py-2"
        />
        <select
          name="role"
          required
          className="rounded-md border border-ink/20 bg-white px-4 py-2"
        >
          <option value="student">Student</option>
          <option value="parent">Parent</option>
          <option value="teacher">Teacher</option>
          <option value="commission">Commission</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit" className="rounded-md bg-navy px-4 py-2 text-parchment">
          Taklif yuborish
        </button>
      </form>

      <table className="w-full max-w-2xl text-left text-sm">
        <thead className="text-ink/60">
          <tr>
            <th className="py-2">Ism</th>
            <th className="py-2">Rol</th>
          </tr>
        </thead>
        <tbody>
          {profiles?.map((p) => (
            <tr key={p.id} className="border-t border-ink/10">
              <td className="py-2">{p.full_name}</td>
              <td className="py-2">{p.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
