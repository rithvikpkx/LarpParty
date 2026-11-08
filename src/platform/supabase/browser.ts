"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { publicSupabaseEnv } from "./env";

let client: SupabaseClient | null = null;

/**
 * The one Supabase client a browser tab uses. It stores the anonymous session in
 * cookies so server actions can see who is calling. Views must not import this;
 * they go through platform hooks.
 */
export function browserSupabase(): SupabaseClient {
  if (!client) {
    const { url, key } = publicSupabaseEnv();
    client = createBrowserClient(url, key);
  }
  return client;
}
