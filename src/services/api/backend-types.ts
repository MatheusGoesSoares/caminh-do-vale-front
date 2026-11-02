// Response shapes of the backend (Django REST, repo Wendell8708/Projeto-Integrador-TIME1).
// DRF serializes DecimalField as strings; the /summary endpoint already sends numbers.
type Decimal = string;

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "operator" | "viewer" | null;
}

export interface ApiLoginResponse {
  access: string;
  refresh: string;
  user: ApiUser;
}

export interface ApiLocation {
  id: number;
  name: string;
  type: "farm" | "distribution_center" | "warehouse";
  address: string;
  is_active: boolean;
}

export interface ApiVehicle {
  id: number;
  plate: string;
  model: string;
  is_active: boolean;
}

export interface ApiDevice {
  id: number;
  uid: string;
  name: string;
  is_active: boolean;
  online: boolean;
  last_seen_at: string | null;
  last_connection_type: "wifi" | "2g" | "";
  wifi_ssid: string;
}

export interface ApiFruitLimits {
  temperature_min_c: Decimal;
  temperature_max_c: Decimal;
  temperature_critical_margin_c: Decimal;
  humidity_min_pct: Decimal;
  humidity_max_pct: Decimal;
  humidity_critical_margin_pct: Decimal;
  impact_max_g: Decimal | null;
}

export interface ApiFruit {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  limits: ApiFruitLimits | null;
}

export interface ApiFruitParameter extends ApiFruitLimits {
  id: number;
  fruit: number;
  source: string;
  is_active: boolean;
}

export interface ApiShipmentItem {
  id: number;
  shipment: number;
  fruit: number;
  fruit_name: string;
  lot: string;
  quantity_kg: Decimal;
}

export type ApiShipmentStatus = "planned" | "active" | "completed" | "cancelled";

export interface ApiShipment {
  id: number;
  origin: number;
  destination: number;
  vehicle: number;
  device: number;
  created_by: number | null;
  status: ApiShipmentStatus;
  started_at: string;
  ended_at: string | null;
  items: ApiShipmentItem[];
  created_at: string;
}

export interface ApiShipmentSummary {
  shipment_id: number;
  status: ApiShipmentStatus;
  fruits: { id: number; name: string }[];
  device: {
    id: number;
    uid: string;
    online: boolean;
    connection: "wifi" | "2g" | null;
    last_seen_at: string | null;
  };
  latest_reading: {
    recorded_at: string;
    temperature_c: number | null;
    humidity_pct: number | null;
    impact_peak_g: number | null;
  } | null;
  limits: {
    temperature_min_c: number;
    temperature_max_c: number;
    temperature_critical_margin_c: number;
    humidity_min_pct: number;
    humidity_max_pct: number;
    humidity_critical_margin_pct: number;
    impact_max_g: number | null;
  } | null;
  limits_warning: string | null;
  open_alerts: number;
  current_status: "no_data" | "normal" | "warning" | "critical";
}

export interface ApiReading {
  id: number;
  shipment: number;
  device: number;
  sequence: number;
  recorded_at: string;
  received_at: string;
  temperature_c: Decimal;
  humidity_pct: Decimal;
  impact_peak_g: Decimal | null;
  network: string;
}

export interface ApiAlert {
  id: number;
  shipment: number;
  type: "temperature" | "humidity" | "shock";
  severity: "warning" | "critical";
  status: "open" | "acknowledged" | "resolved";
  message: string;
  measured_value: Decimal;
  violated_limit: Decimal;
  created_at: string;
  acknowledged_by_name: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
}
