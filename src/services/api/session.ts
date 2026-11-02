export type UserRole = "admin" | "operator" | "viewer";

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: UserRole | null;
}

export interface Session {
  access: string;
  refresh: string;
  user: SessionUser;
}

const STORAGE_KEY = "cdv.session";
const listeners = new Set<() => void>();

function read(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

let current: Session | null = read();

export function getSession(): Session | null {
  return current;
}

export function setSession(session: Session | null): void {
  current = session;
  if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  else localStorage.removeItem(STORAGE_KEY);
  listeners.forEach((fn) => fn());
}

export function updateAccessToken(access: string): void {
  if (current) setSession({ ...current, access });
}

export function subscribeSession(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
