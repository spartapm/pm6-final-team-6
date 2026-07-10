import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminConfig } from "./env";

let admin: SupabaseClient | null = null;

export function getSupabaseAdmin() {
  if (admin) return admin;
  const { url, serviceRoleKey } = getSupabaseAdminConfig();
  admin = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return admin;
}
