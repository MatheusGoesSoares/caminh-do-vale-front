import { readFileSync } from "node:fs";
import type { Page, Request } from "@playwright/test";

/**
 * Simulated backend for the interface tests. It answers every /api/v1 call with the shapes of
 * docs/API.md (envelope {"data": ...}, lists with pagination, errors {"detail": ...}), keeps state
 * during the test (create a trip and it shows in the list; start it and its status changes) and
 * records what the screen sent, so the tests also check the contract with the API.
 */

export const QR_CODE = `data:image/svg+xml;base64,${readFileSync(new URL("./qr-demo.svg", import.meta.url)).toString("base64")}`;
export const SECRET = "JBSWY3DPEHPK3PXP";
export const RECOVERY_CODES = ["K7QF-2M9X", "P4ZD-8WNC", "T6HB-3RJV", "Y9LE-5GQA", "C2VN-7XKP", "M8RT-4DZF", "H3WJ-9BLS", "Q5NC-6TYE", "F1GX-2PMV", "B7KD-8HQR"];
export const VALID_CODE = "246810";
export const VALID_RECOVERY = "K7QF-2M9X";
export const INVITE_LINK = "http://localhost:5180/redefinir-senha?uid=MTA&token=convite-demo";

export const USERS = {
  admin: { id: 1, name: "Administradora Demo", email: "admin@example.com", role: "admin" },
  seller: { id: 7, name: "Vendedora Demo", email: "vendedora@example.com", role: "seller" },
  buyer: { id: 5, name: "Comprador Demo", email: "comprador@example.com", role: "buyer" },
  driver: { id: 9, name: "Motorista Demo", email: "motorista@example.com", role: "driver" },
} as const;
export const USER = USERS.seller;
export type Role = keyof typeof USERS;

export type Scenario = {
  /** true: first access (QR Code); false: account already has the authenticator. */
  setupRequired?: boolean;
  /** The login step expired (mfa_token older than 5 minutes). */
  expired?: boolean;
};

export type Call = { method: string; path: string; query: URLSearchParams; body: Record<string, unknown>; raw: string };

const page1 = <T,>(data: T[]) => ({ data, pagination: { next: null, previous: null, count: data.length } });
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const tokens = (user: (typeof USERS)[Role]) => ({ access: "access-demo", refresh: "refresh-demo", user });

const LIMITS = {
  temperature_min_c: 10, temperature_max_c: 13, temperature_critical_margin_c: 3,
  humidity_min_pct: 85, humidity_max_pct: 90, humidity_critical_margin_pct: 10, impact_max_g: 2.5,
};

type Shipment = {
  id: number; origin: number; destination: number; vehicle: number; device: number; created_by: number;
  buyer: number | null; driver: number | null; status: string; started_at: string; ended_at: string | null;
  items: { id: number; shipment: number; fruit: number; fruit_name: string; lot: string; quantity_kg: string }[];
  created_at: string;
};

function trip(id: number, status: string, fruit: [number, string], lot: string, extra: Partial<Shipment> = {}): Shipment {
  return {
    id, origin: 2, destination: 4, vehicle: 1, device: 2, created_by: 7, buyer: 5, driver: 9, status,
    started_at: status === "planned" ? minutesAgo(-60) : minutesAgo(150), ended_at: status === "delivered" ? minutesAgo(10) : null,
    items: [{ id, shipment: id, fruit: fruit[0], fruit_name: fruit[1], lot, quantity_kg: "4500.00" }],
    created_at: minutesAgo(200), ...extra,
  };
}

/** Readings of the last 2.5 h, newest first (as the backend returns them). */
function readings(shipment: number) {
  return Array.from({ length: 30 }, (_, i) => {
    const t = 29 - i;
    return {
      id: shipment * 100 + i, shipment, device: 2, sequence: 1000 + i, recorded_at: minutesAgo(t * 5), received_at: minutesAgo(t * 5),
      temperature_c: (11.4 + Math.sin(i / 4) * 0.9 + (i > 24 ? 1.6 : 0)).toFixed(2),
      humidity_pct: (87.5 + Math.cos(i / 5) * 1.4).toFixed(2), impact_peak_g: "0.30", network: "wifi",
    };
  }).reverse();
}

function createState(scenario: Scenario) {
  return {
    scenario,
    nextId: 16,
    shipments: [
      trip(13, "active", [1, "Manga"], "MG-2411-01"),
      trip(14, "delivered", [2, "Uva"], "UV-2411-02", { origin: 3 }),
      trip(15, "planned", [1, "Manga"], "MG-2411-03"),
    ] as Shipment[],
    alerts: [
      { id: 7, shipment: 13, type: "temperature", severity: "warning", status: "open", message: "", measured_value: "13.60", violated_limit: "13.00", created_at: minutesAgo(25), acknowledged_by_name: null as string | null, acknowledged_at: null as string | null, resolved_at: null as string | null },
      { id: 8, shipment: 13, type: "shock", severity: "critical", status: "open", message: "Impacto de 3.1 g", measured_value: "3.10", violated_limit: "2.50", created_at: minutesAgo(70), acknowledged_by_name: null as string | null, acknowledged_at: null as string | null, resolved_at: null as string | null },
    ],
    locations: [
      { id: 2, name: "Packing House Juazeiro", type: "warehouse", address: "Juazeiro - BA", owner: 7, is_active: true },
      { id: 3, name: "Fazenda Boa Vista", type: "farm", address: "Petrolina - PE", owner: 7, is_active: true },
      { id: 4, name: "CEAGESP", type: "distribution_center", address: "São Paulo - SP", owner: null, is_active: true },
    ],
    vehicles: [
      { id: 1, plate: "QWE1A23", model: "Baú refrigerado", owner: 7, is_active: true },
      { id: 2, plate: "RTY4B56", model: "Truck frigorífico", owner: null, is_active: true },
    ],
    users: [
      { ...USERS.admin, is_active: true, has_password: true, has_2fa: true, last_login: minutesAgo(30), date_joined: minutesAgo(60 * 24 * 20) },
      { ...USERS.seller, is_active: true, has_password: true, has_2fa: true, last_login: minutesAgo(90), date_joined: minutesAgo(60 * 24 * 18) },
      { ...USERS.buyer, is_active: true, has_password: true, has_2fa: true, last_login: minutesAgo(400), date_joined: minutesAgo(60 * 24 * 10) },
      { ...USERS.driver, is_active: true, has_password: false, has_2fa: false, last_login: null as string | null, date_joined: minutesAgo(60) },
    ],
  };
}
type State = ReturnType<typeof createState>;

function summary(state: State, s: Shipment) {
  const latest = readings(s.id)[0];
  return {
    shipment_id: s.id, status: s.status, fruits: s.items.map((i) => ({ id: i.fruit, name: i.fruit_name })),
    device: { id: 2, uid: "VSF-002", online: true, connection: "wifi", last_seen_at: minutesAgo(1) },
    latest_reading: s.status === "planned" ? null : { recorded_at: latest.recorded_at, temperature_c: Number(latest.temperature_c), humidity_pct: Number(latest.humidity_pct), impact_peak_g: 0.3 },
    limits: LIMITS, limits_warning: null,
    open_alerts: state.alerts.filter((a) => a.shipment === s.id && a.status !== "resolved").length,
    current_status: s.status === "active" ? "warning" : "normal",
  };
}

function answer(state: State, call: Call): { status: number; body: unknown } {
  const { method, path, body } = call;
  const ok = (data: unknown, status = 200) => ({ status, body: { data } });
  const list = (data: unknown[]) => ({ status: 200, body: page1(data) });
  const fail = (status: number, payload: unknown) => ({ status, body: payload });
  const { scenario } = state;

  // ----- Login and password -----
  if (path === "/auth/login") {
    if (body.password !== "senha-correta") return fail(400, { non_field_errors: ["E-mail ou senha inválidos."] });
    return ok({ mfa_required: true, mfa_setup_required: scenario.setupRequired ?? false, mfa_token: "mfa-demo", expires_in: 300 });
  }
  if (path.startsWith("/auth/2fa/") && scenario.expired) return fail(401, { detail: "Sessão de login expirada. Entre com e-mail e senha de novo." });
  if (path === "/auth/2fa/setup") return ok({ qr_code: QR_CODE, secret: SECRET, otpauth_uri: `otpauth://totp/demo?secret=${SECRET}` });
  if (path === "/auth/2fa/activate") return body.code === VALID_CODE ? ok({ ...tokens(USER), recovery_codes: RECOVERY_CODES }) : fail(400, { detail: "Código inválido." });
  if (path === "/auth/2fa/verify") {
    if (body.recovery_code) return body.recovery_code === VALID_RECOVERY ? ok(tokens(USER)) : fail(400, { detail: "Código de recuperação inválido ou já utilizado." });
    return body.code === VALID_CODE ? ok(tokens(USER)) : fail(400, { detail: "Código inválido ou vencido." });
  }
  if (path === "/auth/logout") return ok({ detail: "Logout realizado com sucesso." });
  if (path === "/auth/password-reset") return ok({ detail: "Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha." });
  if (path === "/auth/password-reset/confirm") return body.token === "token-valido" ? ok({ detail: "Senha alterada com sucesso." }) : fail(400, { detail: "Link inválido ou expirado." });

  // ----- Users (platform) -----
  if (path === "/auth/users" && method === "GET") {
    const role = call.query.get("role");
    if (!role) return ok(state.users);
    return ok(state.users.filter((u) => u.role === role).map((u) => ({ id: u.id, name: u.name })));
  }
  if (path === "/auth/users" && method === "POST") {
    const user = { id: 30, name: String(body.name), email: String(body.email), role: String(body.role), is_active: true, has_password: false, has_2fa: false, last_login: null, date_joined: minutesAgo(0) };
    state.users.push(user as (typeof state.users)[number]);
    return ok({ user, invite_sent: false, password_setup_link: INVITE_LINK }, 201);
  }
  let m = /^\/auth\/users\/(\d+)(\/invite|\/reset-2fa)?$/.exec(path);
  if (m) {
    const user = state.users.find((u) => u.id === Number(m![1]));
    if (!user) return fail(404, { detail: "Não encontrado." });
    if (m[2] === "/invite") return ok({ invite_sent: false, password_setup_link: INVITE_LINK });
    if (m[2] === "/reset-2fa") { user.has_2fa = false; return ok({ detail: "2FA removido. No próximo login a pessoa configura o autenticador de novo." }); }
    Object.assign(user, body);
    return ok(user);
  }

  // ----- Trips -----
  if (path === "/shipments" && method === "GET") return list(state.shipments);
  if (path === "/shipments/current") return ok(state.shipments.filter((s) => s.driver === USERS.driver.id && ["planned", "active", "delivered"].includes(s.status)));
  if (path === "/shipments" && method === "POST") {
    const items = (body.items as { fruit: number; lot: string; quantity_kg: string }[]) ?? [];
    const id = state.nextId++;
    const created = trip(id, "planned", [items[0]?.fruit ?? 1, items[0]?.fruit === 2 ? "Uva" : "Manga"], items[0]?.lot ?? "", {
      origin: Number(body.origin), destination: Number(body.destination), vehicle: Number(body.vehicle), device: Number(body.device),
      buyer: (body.buyer as number) ?? null, driver: (body.driver as number) ?? null, started_at: String(body.started_at),
    });
    state.shipments.push(created);
    return ok(created, 201);
  }
  m = /^\/shipments\/(\d+)(\/[a-z]+)?$/.exec(path);
  if (m) {
    const s = state.shipments.find((x) => x.id === Number(m![1]));
    if (!s) return fail(404, { detail: "Não encontrado." });
    const action = m[2];
    if (!action) return ok(s);
    if (action === "/summary") return ok(summary(state, s));
    if (action === "/readings") return list(s.status === "planned" ? [] : readings(s.id));
    if (action === "/start") { s.status = "active"; s.started_at = minutesAgo(0); return ok(s); }
    if (action === "/finish") { s.status = "delivered"; s.ended_at = minutesAgo(0); return ok(s); }
    if (action === "/confirm") {
      if (!/name="condition"\r\n\r\n(good|damaged|critical)/.test(call.raw)) return fail(400, { detail: "Informe uma condição válida: good, damaged ou critical." });
      if (!/name="condition"\r\n\r\ngood/.test(call.raw) && !call.raw.includes('name="photos"')) return fail(400, { detail: "Com avaria, envie ao menos uma fotografia como prova." });
      s.status = "completed";
      return ok({ id: 1, shipment: s.id, condition: "damaged", photos: [] });
    }
  }

  // ----- Alerts -----
  if (path === "/alerts") return list(state.alerts);
  m = /^\/alerts\/(\d+)\/(ack|resolve)$/.exec(path);
  if (m) {
    const alert = state.alerts.find((a) => a.id === Number(m![1]));
    if (!alert) return fail(404, { detail: "Não encontrado." });
    if (m[2] === "ack") { alert.status = "acknowledged"; alert.acknowledged_at = minutesAgo(0); alert.acknowledged_by_name = "Vendedora Demo"; }
    else { alert.status = "resolved"; alert.resolved_at = minutesAgo(0); }
    return ok(alert);
  }

  // ----- Registrations -----
  if (path === "/locations" && method === "GET") return list(state.locations);
  if (path === "/vehicles" && method === "GET") return list(state.vehicles);
  if (path === "/locations" && method === "POST") { const l = { id: 20 + state.locations.length, owner: 7, ...body } as (typeof state.locations)[number]; state.locations.push(l); return ok(l, 201); }
  if (path === "/vehicles" && method === "POST") { const v = { id: 20 + state.vehicles.length, owner: 7, ...body } as (typeof state.vehicles)[number]; state.vehicles.push(v); return ok(v, 201); }
  m = /^\/(locations|vehicles)\/(\d+)$/.exec(path);
  if (m && method === "PATCH") {
    const items = (m[1] === "locations" ? state.locations : state.vehicles) as { id: number }[];
    const item = items.find((x) => x.id === Number(m![2]));
    if (item) Object.assign(item, body);
    return ok(item);
  }
  if (path === "/devices") return list([{ id: 2, uid: "VSF-002", name: "Placa 2", is_active: true, online: true, last_seen_at: minutesAgo(1), last_connection_type: "wifi", wifi_ssid: "x" }]);
  if (path === "/fruits") return list([
    { id: 1, name: "Manga", description: "", is_active: true, limits: { temperature_min_c: "10", temperature_max_c: "13", humidity_min_pct: "85", humidity_max_pct: "90" } },
    { id: 2, name: "Uva", description: "", is_active: true, limits: { temperature_min_c: "0", temperature_max_c: "2", humidity_min_pct: "90", humidity_max_pct: "95" } },
  ]);
  if (path === "/fruit-parameters") return list([]);

  // ----- Assistant -----
  if (path === "/chat") {
    const target = body.shipment_id ? `VG-${body.shipment_id}` : "suas cargas";
    return ok({ answer: `Sobre **${target}**:\n- Temperatura atual: **13,0 °C** (ideal 10–13 °C)\n- Umidade: **88%**\nHá 1 alerta de temperatura aberto.`, shipments: [13] });
  }

  if (path === "" && method === "GET") return { status: 200, body: {} }; // the login screen wakes the server up
  return fail(404, { detail: "Não encontrado." });
}

/** City coordinates and a straight route, instead of the public Nominatim and OSRM services. */
async function mockMaps(page: Page) {
  const cities: Record<string, [number, number]> = { juazeiro: [-9.41, -40.5], petrolina: [-9.39, -40.5], "são paulo": [-23.55, -46.63], recife: [-8.05, -34.9] };
  await page.route(/nominatim\.openstreetmap\.org/, (route) => {
    const q = (new URL(route.request().url()).searchParams.get("q") ?? "").toLowerCase();
    const hit = Object.entries(cities).find(([name]) => q.includes(name))?.[1];
    return route.fulfill({ contentType: "application/json", body: JSON.stringify(hit ? [{ lat: String(hit[0]), lon: String(hit[1]) }] : []) });
  });
  await page.route(/router\.project-osrm\.org/, (route) => {
    const coords = decodeURIComponent(new URL(route.request().url()).pathname.split("/driving/")[1] ?? "")
      .split(";").map((p) => p.split(",").map(Number));
    // Straight line; distance in meters (about 111 km per degree) and duration at 60 km/h.
    const [[lng1, lat1], [lng2, lat2]] = coords;
    const distance = Math.hypot(lng2 - lng1, lat2 - lat1) * 111_000;
    const body = { code: "Ok", routes: [{ distance, duration: distance / 16.7, geometry: { type: "LineString", coordinates: coords } }] };
    return route.fulfill({ contentType: "application/json", body: JSON.stringify(body) });
  });
}

/** Starts the simulated backend for this page and returns the list of calls the screen made. */
export async function mockApi(page: Page, scenario: Scenario = {}): Promise<Call[]> {
  const state = createState(scenario);
  const calls: Call[] = [];
  await mockMaps(page);
  await page.route(/\/api\/v1(\/|$|\?)/, async (route) => {
    const request: Request = route.request();
    if (request.method() === "OPTIONS") {
      return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" } });
    }
    const url = new URL(request.url());
    const path = url.pathname.replace(/^.*\/api\/v1/, "").replace(/\/$/, "");
    const raw = request.postDataBuffer()?.toString("latin1") ?? "";
    let body: Record<string, unknown> = {};
    try {
      body = request.postDataJSON() ?? {};
    } catch {
      // multipart (photos) or empty
    }
    const call = { method: request.method(), path, query: url.searchParams, body, raw };
    calls.push(call);
    const { status, body: payload } = answer(state, call);
    await route.fulfill({ status, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(payload) });
  });
  return calls;
}

/** Opens the panel already logged in with the given role (the login itself is covered in login.spec.ts). */
export async function loginAs(page: Page, role: Role) {
  const user = USERS[role];
  await page.addInitScript((session) => {
    localStorage.setItem("cdv.session", JSON.stringify(session));
    localStorage.setItem("cdv.assistant.seen", "1");
  }, { access: "access-demo", refresh: "refresh-demo", twoFactor: true, user });
  return mockApi(page);
}
