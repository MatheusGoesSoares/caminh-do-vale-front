import { useSyncExternalStore } from "react";
import { getSession, setSession, subscribeSession, type Session } from "@/services/api/session";
import { postData } from "@/services/api/http";
import type { ApiLoginResponse } from "@/services/api/backend-types";

export function useSession(): Session | null {
  return useSyncExternalStore(subscribeSession, getSession);
}

/** Admins and operators can change data (start/finish trips, acknowledge/resolve alerts); viewers only read. */
export function useCanOperate(): boolean {
  const role = useSession()?.user.role;
  return role === "admin" || role === "operator";
}

export async function login(email: string, password: string): Promise<void> {
  const data = await postData<ApiLoginResponse>("/auth/login", { email, password });
  setSession({ access: data.access, refresh: data.refresh, user: data.user });
}

export function logout(): void {
  setSession(null);
}
