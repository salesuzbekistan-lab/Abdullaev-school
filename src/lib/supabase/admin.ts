import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client for admin-only user/role provisioning. Roles in this
 * app are never self-assigned at signup — only an admin creates accounts
 * (student/parent/teacher/commission), so this client must stay server-only
 * (route handlers / server actions guarded by an admin role check).
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
