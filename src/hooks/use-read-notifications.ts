import { useCallback, useMemo, useState } from "react";
import type { AppNotification } from "@/types";
import { useSession } from "./use-session";

// "Read" is a per-device, per-user flag; it doesn't acknowledge the alert on the backend.
function storageKey(userId: number | undefined) {
  return `cdv.read-notifications.${userId ?? "anon"}`;
}

function load(key: string): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(key) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

export function useReadNotifications(notifications: AppNotification[]) {
  const key = storageKey(useSession()?.user.id);
  const [state, setState] = useState(() => ({ key, ids: load(key) }));
  const ids = state.key === key ? state.ids : load(key);

  const save = useCallback(
    (next: Set<string>) => {
      localStorage.setItem(key, JSON.stringify([...next]));
      setState({ key, ids: next });
    },
    [key]
  );

  const withRead = useMemo(
    () => notifications.map((n) => (ids.has(n.id) ? { ...n, read: true } : n)),
    [notifications, ids]
  );

  const markRead = useCallback((id: string) => save(new Set(ids).add(id)), [ids, save]);

  // Keep only ids that still exist, so the stored list doesn't grow forever.
  const markAllRead = useCallback(() => save(new Set(notifications.map((n) => n.id))), [notifications, save]);

  return { notifications: withRead, markRead, markAllRead };
}
