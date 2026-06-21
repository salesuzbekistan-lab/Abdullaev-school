import { createClient } from "@/lib/supabase/server";

export type UserRole = "student" | "parent" | "teacher" | "admin" | "commission";

export type Profile = {
  id: string;
  full_name: string;
  role: UserRole;
};

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", auth.user.id)
    .single();

  return profile ?? null;
}

export function dashboardPathForRole(role: UserRole): string {
  switch (role) {
    case "student":
      return "/student";
    case "parent":
      return "/parent";
    case "teacher":
    case "commission":
      return "/teacher";
    case "admin":
      return "/admin/users";
  }
}
