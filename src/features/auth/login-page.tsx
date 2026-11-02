import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Loader2, LogIn } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { login, useSession } from "@/hooks/use-session";
import { API_BASE_URL } from "@/services/api/http";
import logo from "@/assets/brand/logo-horizontal-yellow-v.png";

type ServerState = "waking" | "ready" | "unreachable";

function useWakeServer(): ServerState {
  const [state, setState] = useState<ServerState>("waking");
  useEffect(() => {
    let cancelled = false;
    fetch(`${new URL(API_BASE_URL).origin}/`, { signal: AbortSignal.timeout(90_000) })
      .then((res) => !cancelled && setState(res.ok ? "ready" : "unreachable"))
      .catch(() => !cancelled && setState("unreachable"));
    return () => {
      cancelled = true;
    };
  }, []);
  return state;
}

const serverLabel: Record<ServerState, string> = {
  waking: "Conectando ao servidor… a primeira conexão pode levar até 1 minuto.",
  ready: "Servidor conectado.",
  unreachable: "Não foi possível falar com o servidor. Verifique sua internet.",
};

export default function LoginPage() {
  const session = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const server = useWakeServer();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? "/";
  if (session) return <Navigate to={from} replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4"
      style={{ background: "linear-gradient(145deg, #1a7a44 0%, #1F8A4D 30%, #16643A 70%, #124e2e 100%)" }}
    >
      <div
        className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #BFE3C8 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute top-1/4 left-1/4 h-64 w-64 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #F2C94C 0%, transparent 70%)" }}
      />
      <svg
        className="pointer-events-none absolute bottom-0 left-0 w-full"
        viewBox="0 0 1440 200"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path fill="rgba(47, 168, 102, 0.18)" d="M0,110 C240,70 480,150 720,112 C960,74 1200,96 1440,84 L1440,200 L0,200Z" />
        <path fill="rgba(191, 227, 200, 0.08)" d="M0,150 C300,126 600,176 900,150 C1140,130 1300,142 1440,140 L1440,200 L0,200Z" />
      </svg>

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          <img src={logo} alt="Caminho do Vale" className="mx-auto h-20 w-auto object-contain" />

          <h1 className="mt-6 text-center text-xl font-bold text-[#123A24]">Entrar no painel</h1>
          <p className="mt-1 text-center text-sm text-[#5B7264]">
            Monitorando cada carga, <span className="font-semibold text-[#1A7A44]">do vale ao destino.</span>
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <Input
              id="email"
              label="E-mail"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
            <Input
              id="password"
              label="Senha"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <p className="rounded-lg bg-[#FCE8E6] px-3 py-2 text-sm text-[#B03A3A]" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={submitting || !email || !password}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              {submitting ? "Entrando…" : "Entrar"}
            </Button>
          </form>

          <p
            className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-[#5B7264]"
            aria-live="polite"
          >
            {server === "waking" && <Loader2 className="h-3 w-3 shrink-0 animate-spin" />}
            {server === "ready" && <span className="h-2 w-2 shrink-0 rounded-full bg-[#1F8A4D]" />}
            {server === "unreachable" && <span className="h-2 w-2 shrink-0 rounded-full bg-[#D94F4F]" />}
            {serverLabel[server]}
          </p>
        </div>

        <p className="mt-6 text-center text-xs uppercase tracking-wider text-[#BFE3C8]/60">
          Vale do São Francisco &bull; Petrolina &bull; Juazeiro
        </p>
      </div>
    </div>
  );
}
