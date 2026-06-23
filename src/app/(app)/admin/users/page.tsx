import Link from "next/link";
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
        <Link href="/teacher/calendar" className="mt-2 inline-block text-navy underline">
          Content calendar&apos;ni ochish
        </Link>
      </div>

      <form
        action={createUser}
        className="flex max-w-md flex-col gap-3 rounded-lg border border-ink/10 bg-white p-5"
      >
        <h2 className="font-display text-xl text-navy">Yangi hisob qo&apos;shish</h2>
        <label htmlFor="full_name" className="sr-only">
          To&apos;liq ism
        </label>
        <input
          id="full_name"
          name="full_name"
          placeholder="To'liq ism"
          required
          className="rounded-md border border-ink/20 bg-white px-4 py-2"
        />
        <label htmlFor="email" className="sr-only">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="Email"
          required
          autoComplete="email"
          className="rounded-md border border-ink/20 bg-white px-4 py-2"
        />
        <label htmlFor="role" className="sr-only">
          Rol
        </label>
        <select
          id="role"
          name="role"
          required
          defaultValue=""
          className="rounded-md border border-ink/20 bg-white px-4 py-2"
        >
          <option value="" disabled>
            Rolni tanlang
          </option>
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

      <div className="max-w-2xl overflow-x-auto">
        <table className="w-full min-w-max text-left text-sm">
          <thead className="text-ink/70">
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
    </div>
  );
}
