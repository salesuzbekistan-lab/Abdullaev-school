import { redirect } from "next/navigation";
import { getCurrentProfile, dashboardPathForRole } from "@/lib/auth";

export default async function Home() {
  const profile = await getCurrentProfile();
  redirect(profile ? dashboardPathForRole(profile.role) : "/login");
}
