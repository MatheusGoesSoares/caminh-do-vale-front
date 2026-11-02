import { getSession, setSession, updateAccessToken, type Session } from "./session";

// On Vercel, "/api/v1" goes through the proxy in vercel.json, so the backend's CORS list doesn't matter.
const onVercel = window.location.hostname.endsWith(".vercel.app");
const configuredBase = onVercel
  ? "/api/v1"
  : (import.meta.env.VITE_API_BASE_URL ?? "https://projeto-integrador-time1.onrender.com/api/v1");

export const API_BASE_URL = new URL(configuredBase, window.location.origin).href.replace(/\/$/, "");

// The free Render instance sleeps after 15 min idle; waking it can take ~1 min.
const REQUEST_TIMEOUT_MS = 90_000;

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export interface Paginated<T> {
  data: T[];
  pagination: { next: string | null; previous: string | null; count: number };
}

function errorMessage(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    if (typeof b.detail === "string") return b.detail;
    const first = Object.values(b).flat()[0];
    if (typeof first === "string") return first;
  }
  if (status === 0) return "Não foi possível conectar ao servidor.";
  return `Erro ${status} ao falar com o servidor.`;
}

async function send(url: string, init: RequestInit, token?: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    // The browser reports a CORS block and a network failure the same way.
    throw new ApiError(
      controller.signal.aborted
        ? "O servidor demorou demais para responder."
        : navigator.onLine
          ? `Não foi possível conectar ao servidor. Se continuar, confirme se ${window.location.origin} está liberado no back (CORS).`
          : "Sem conexão com a internet.",
      0
    );
  } finally {
    clearTimeout(timer);
  }
}

async function parse(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

let refreshing: Promise<string | null> | null = null;

// Concurrent 401s share one refresh call instead of each trying their own.
function refreshAccessToken(session: Session): Promise<string | null> {
  refreshing ??= (async () => {
    try {
      const res = await send(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        body: JSON.stringify({ refresh: session.refresh }),
      });
      if (!res.ok) return null;
      const body = (await parse(res)) as { data: { access: string } };
      updateAccessToken(body.data.access);
      return body.data.access;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

function toUrl(path: string): string {
  if (!path.startsWith("http")) return `${API_BASE_URL}${path}`;
  const { pathname, search } = new URL(path);
  return `${new URL(API_BASE_URL).origin}${pathname}${search}`;
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = toUrl(path);
  const session = getSession();
  let res = await send(url, init, session?.access);

  if (res.status === 401 && session) {
    const access = await refreshAccessToken(session);
    if (!access) {
      setSession(null);
      throw new ApiError("Sua sessão expirou. Entre novamente.", 401);
    }
    res = await send(url, init, access);
  }

  const body = await parse(res);
  if (!res.ok) throw new ApiError(errorMessage(body, res.status), res.status);
  return body as T;
}

export async function getData<T>(path: string): Promise<T> {
  return (await request<{ data: T }>(path)).data;
}

export async function postData<T>(path: string, payload?: unknown): Promise<T> {
  const body = await request<{ data: T }>(path, {
    method: "POST",
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
  return body.data;
}

export async function getAllPages<T>(path: string, maxPages = 20): Promise<T[]> {
  const items: T[] = [];
  let next: string | null = path;
  for (let page = 0; next && page < maxPages; page++) {
    const body: Paginated<T> = await request<Paginated<T>>(next);
    items.push(...body.data);
    next = body.pagination?.next ?? null;
  }
  return items;
}
