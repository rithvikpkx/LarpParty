import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { publicSupabaseEnv } from "./env";

let admin: SupabaseClient | null = null;

/**
 * Service-role client. Bypasses RLS, so it must only be used inside server
 * actions after the caller has been authorized.
 */
export function adminSupabase(): SupabaseClient {
  if (!admin) {
    const { url } = publicSupabaseEnv();
    const secret = process.env.SUPABASE_SECRET_KEY;
    if (!secret) throw new Error("Missing SUPABASE_SECRET_KEY (server-only).");
    admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return admin;
}
