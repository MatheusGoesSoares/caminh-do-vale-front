import { readFileSync } from "node:fs";
import type { Page, Request } from "@playwright/test";

/**
 * Simulated backend for the interface tests: answers every /api/v1 call with the shapes of
 * docs/API.md (envelope {"data": ...}, errors {"detail": ...}) and records what the screen sent,
 * so the tests also check the contract with the API.
 */

export const QR_CODE = `data:image/svg+xml;base64,${readFileSync(new URL("./qr-demo.svg", import.meta.url)).toString("base64")}`;
export const SECRET = "JBSWY3DPEHPK3PXP";
export const RECOVERY_CODES = ["K7QF-2M9X", "P4ZD-8WNC", "T6HB-3RJV", "Y9LE-5GQA", "C2VN-7XKP", "M8RT-4DZF", "H3WJ-9BLS", "Q5NC-6TYE", "F1GX-2PMV", "B7KD-8HQR"];
export const VALID_CODE = "246810";
export const VALID_RECOVERY = "K7QF-2M9X";
export const USER = { id: 7, name: "Vendedora Demo", email: "vendedora@example.com", role: "seller" };

export type Scenario = {
  /** true: first access (QR Code); false: account already has the authenticator. */
  setupRequired?: boolean;
  /** The login step expired (mfa_token older than 5 minutes). */
  expired?: boolean;
};

type Call = { method: string; path: string; body: Record<string, unknown> };

const page1 = <T,>(data: T[]) => ({ data, pagination: { next: null, previous: null, count: data.length } });
const now = () => new Date().toISOString();

const shipment = {
  id: 13, origin: 2, destination: 4, vehicle: 1, device: 2, created_by: 7, buyer: 5, driver: 9, status: "active",
  started_at: "2026-11-24T08:00:00Z", ended_at: null,
  items: [{ id: 1, shipment: 13, fruit: 1, fruit_name: "Manga", lot: "MG-2411-01", quantity_kg: "4500.00" }],
  created_at: "2026-11-24T07:00:00Z",
};
const summary = () => ({
  shipment_id: 13, status: "active", fruits: [{ id: 1, name: "Manga" }],
  device: { id: 2, uid: "VSF-002", online: true, connection: "wifi", last_seen_at: now() },
  latest_reading: { recorded_at: now(), temperature_c: 12.1, humidity_pct: 88.4, impact_peak_g: 0.3 },
  limits: { temperature_min_c: 10, temperature_max_c: 13, temperature_critical_margin_c: 3, humidity_min_pct: 85, humidity_max_pct: 90, humidity_critical_margin_pct: 10, impact_max_g: 2.5 },
  limits_warning: null, open_alerts: 0, current_status: "normal",
});

const tokens = { access: "access-demo", refresh: "refresh-demo", user: USER };

function answer(call: Call, scenario: Scenario): { status: number; body: unknown } {
  const { method, path, body } = call;
  const ok = (data: unknown, status = 200) => ({ status, body: { data } });
  const fail = (status: number, payload: unknown) => ({ status, body: payload });

  if (path === "/auth/login") {
    if (body.password !== "senha-correta") return fail(400, { non_field_errors: ["E-mail ou senha inválidos."] });
    return ok({ mfa_required: true, mfa_setup_required: scenario.setupRequired ?? false, mfa_token: "mfa-demo", expires_in: 300 });
  }
  if (path.startsWith("/auth/2fa/") && scenario.expired) {
    return fail(401, { detail: "Sessão de login expirada. Entre com e-mail e senha de novo." });
  }
  if (path === "/auth/2fa/setup") return ok({ qr_code: QR_CODE, secret: SECRET, otpauth_uri: `otpauth://totp/demo?secret=${SECRET}` });
  if (path === "/auth/2fa/activate") {
    return body.code === VALID_CODE ? ok({ ...tokens, recovery_codes: RECOVERY_CODES }) : fail(400, { detail: "Código inválido." });
  }
  if (path === "/auth/2fa/verify") {
    if (body.recovery_code) {
      return body.recovery_code === VALID_RECOVERY ? ok(tokens) : fail(400, { detail: "Código de recuperação inválido ou já utilizado." });
    }
    return body.code === VALID_CODE ? ok(tokens) : fail(400, { detail: "Código inválido ou vencido." });
  }
  if (path === "/auth/logout") return ok({ detail: "Logout realizado com sucesso." });
  if (path === "/auth/password-reset") return ok({ detail: "Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha." });
  if (path === "/auth/password-reset/confirm") {
    return body.token === "token-valido" ? ok({ detail: "Senha alterada com sucesso." }) : fail(400, { detail: "Link inválido ou expirado." });
  }

  // Data loaded by the panel after the login.
  if (method === "GET") {
    if (path === "/shipments") return { status: 200, body: page1([shipment]) };
    if (path === "/shipments/13") return ok(shipment);
    if (path === "/shipments/13/summary") return ok(summary());
    if (path.endsWith("/readings") || path === "/alerts" || path === "/fruit-parameters") return { status: 200, body: page1([]) };
    if (path === "/locations") return { status: 200, body: page1([
      { id: 2, name: "Packing House Juazeiro", type: "warehouse", address: "Juazeiro - BA", owner: 7, is_active: true },
      { id: 4, name: "CEAGESP", type: "distribution_center", address: "São Paulo - SP", owner: null, is_active: true },
    ]) };
    if (path === "/vehicles") return { status: 200, body: page1([{ id: 1, plate: "QWE1A23", model: "Baú refrigerado", owner: 7, is_active: true }]) };
    if (path === "/devices") return { status: 200, body: page1([{ id: 2, uid: "VSF-002", name: "Placa 2", is_active: true, online: true, last_seen_at: now(), last_connection_type: "wifi", wifi_ssid: "x" }]) };
    if (path === "/fruits") return { status: 200, body: page1([{ id: 1, name: "Manga", description: "", is_active: true, limits: null }]) };
    if (path === "") return { status: 200, body: {} }; // the login screen wakes the server up
  }
  return fail(404, { detail: "Não encontrado." });
}

/** Starts the simulated backend for this page and returns the list of calls the screen made. */
export async function mockApi(page: Page, scenario: Scenario = {}): Promise<Call[]> {
  const calls: Call[] = [];
  await page.route(/\/api\/v1(\/|$|\?)/, async (route) => {
    const request: Request = route.request();
    if (request.method() === "OPTIONS") {
      return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" } });
    }
    const url = new URL(request.url());
    const path = url.pathname.replace(/^.*\/api\/v1/, "").replace(/\/$/, "");
    let body: Record<string, unknown> = {};
    try {
      body = request.postDataJSON() ?? {};
    } catch {
      // not JSON (multipart or empty)
    }
    const call = { method: request.method(), path, body };
    calls.push(call);
    const { status, body: payload } = answer(call, scenario);
    await route.fulfill({ status, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(payload) });
  });
  return calls;
}
