"use client";

/**
 * Gives every device a stable anonymous Supabase user. The session lives in
 * cookies, so a refreshed phone is the same user and rejoins its room.
 * We never key identity on IP: a whole party shares one Wi-Fi address.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { CenterMessage, Screen, Spinner } from "@/components/ui";
import { browserSupabase } from "./supabase/browser";

const UserIdContext = createContext<string | null>(null);

export function useUserId(): string {
  const id = useContext(UserIdContext);
  if (!id) throw new Error("useUserId must be used inside <AuthGate>");
  return id;
}

async function ensureAnonymousUser(): Promise<string> {
  const auth = browserSupabase().auth;
  // getUser() validates the session with the server, so a deleted or expired
  // user is caught here instead of failing later in a server action.
  const { data } = await auth.getUser();
  if (data.user) return data.user.id;
  await auth.signOut().catch(() => {});
  const { data: signedIn, error } = await auth.signInAnonymously();
  if (error || !signedIn.user) throw new Error(error?.message ?? "Anonymous sign-in failed");
  return signedIn.user.id;
}

export function AuthGate({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    ensureAnonymousUser().then(
      (id) => !cancelled && setUserId(id),
      (e: unknown) => !cancelled && setError(e instanceof Error ? e.message : String(e)),
    );
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <Screen kind="phone">
        <CenterMessage title="Couldn't connect">
          <p className="muted">{error}</p>
        </CenterMessage>
      </Screen>
    );
  }
  if (!userId) {
    return (
      <Screen kind="phone">
        <div className="center-msg">
          <Spinner />
        </div>
      </Screen>
    );
  }
  return <UserIdContext.Provider value={userId}>{children}</UserIdContext.Provider>;
}
