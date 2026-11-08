import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicSupabaseEnv } from "./env";

/** A Supabase client acting as the calling browser's user, read from request cookies. */
export async function userSupabase() {
  const cookieStore = await cookies();
  const { url, key } = publicSupabaseEnv();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSet) {
        // Server actions may set cookies (e.g. a refreshed session). Server
        // components may not, and that is fine to ignore.
        try {
          for (const { name, value, options } of toSet) cookieStore.set(name, value, options);
        } catch {}
      },
    },
  });
}
