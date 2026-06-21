"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile, type UserRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createUser(formData: FormData) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") {
    throw new Error("Faqat administrator yangi hisob yarata oladi.");
  }

  const email = String(formData.get("email") ?? "");
  const fullName = String(formData.get("full_name") ?? "");
  const role = String(formData.get("role") ?? "") as UserRole;

  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email);
  if (error || !data.user) {
    throw new Error(error?.message ?? "Foydalanuvchi yaratilmadi.");
  }

  const { error: profileError } = await admin
    .from("profiles")
    .insert({ id: data.user.id, full_name: fullName, role });

  if (profileError) {
    throw new Error(profileError.message);
  }

  revalidatePath("/admin/users");
}
