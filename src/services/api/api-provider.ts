import type { DataService } from "./data-service";
import type {
  AlertFilters,
  AlertType,
  AppNotification,
  DashboardSummary,
  EnvironmentalStatus,
  FruitStorageProfile,
  GeoPosition,
  LogisticsStatus,
  MonitoringAlert,
  SensorReading,
  Shipment,
  ShipmentFilters,
  TimeRange,
} from "@/types";
import { formatAlertType } from "@/utils/format";
import { ApiError, getAllPages, getData, postData } from "./http";
import type {
  ApiAlert,
  ApiDevice,
  ApiFruit,
  ApiFruitParameter,
  ApiLocation,
  ApiReading,
  ApiShipment,
  ApiShipmentStatus,
  ApiShipmentSummary,
  ApiVehicle,
} from "./backend-types";

const SHIPMENT_PREFIX = "VG-";
const LOOKUP_TTL_MS = 60_000;
const RANGE_MS: Partial<Record<TimeRange, number>> = {
  "1h": 3_600_000,
  "6h": 6 * 3_600_000,
  "24h": 24 * 3_600_000,
  "7d": 7 * 24 * 3_600_000,
};

const logisticsByStatus: Record<ApiShipmentStatus, LogisticsStatus> = {
  planned: "pending",
  active: "in_transit",
  completed: "delivered",
  cancelled: "cancelled",
};

function num(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function toShipmentId(id: number): string {
  return `${SHIPMENT_PREFIX}${id}`;
}

function fromShipmentId(id: string): number | null {
  const match = /(\d+)$/.exec(id);
  return match ? Number(match[1]) : null;
}

interface Lookups {
  locations: Map<number, ApiLocation>;
  vehicles: Map<number, ApiVehicle>;
  devices: Map<number, ApiDevice>;
}

function byId<T extends { id: number }>(items: T[]): Map<number, T> {
  return new Map(items.map((i) => [i.id, i]));
}

function environmentalStatus(summary: ApiShipmentSummary): EnvironmentalStatus {
  if (summary.current_status === "no_data") return "no_data";
  if (summary.status === "active" && !summary.device.online) return "stale";
  if (summary.current_status === "normal") return "optimal";
  return summary.current_status;
}

function alertType(alert: ApiAlert): AlertType {
  if (alert.type === "shock") return "shock";
  const above = (num(alert.measured_value) ?? 0) > (num(alert.violated_limit) ?? 0);
  if (alert.type === "temperature") return above ? "temperature_high" : "temperature_low";
  return above ? "humidity_high" : "humidity_low";
}

function mapAlert(alert: ApiAlert): MonitoringAlert {
  const type = alertType(alert);
  const end = alert.resolved_at ? new Date(alert.resolved_at).getTime() : Date.now();
  return {
    id: String(alert.id),
    shipmentId: toShipmentId(alert.shipment),
    type,
    severity: alert.severity,
    status: alert.status === "resolved" ? "resolved" : "active",
    startedAt: alert.created_at,
    resolvedAt: alert.resolved_at ?? undefined,
    acknowledgedAt: alert.acknowledged_at ?? undefined,
    message: alert.message || `${formatAlertType(type)}: ${alert.measured_value}`,
    durationMs: end - new Date(alert.created_at).getTime(),
  };
}

function mapReading(reading: ApiReading, devices: Map<number, ApiDevice>): SensorReading {
  return {
    id: String(reading.id),
    sensorId: devices.get(reading.device)?.uid ?? String(reading.device),
    shipmentId: toShipmentId(reading.shipment),
    temperatureC: num(reading.temperature_c),
    relativeHumidity: num(reading.humidity_pct),
    measuredAt: reading.recorded_at,
    receivedAt: reading.received_at,
  };
}

function matchesSearch(s: Shipment, q: string): boolean {
  return [s.id, s.batchId, s.fruitName, s.origin, s.destination, s.vehicleId ?? "", ...s.sensorIds]
    .some((field) => field.toLowerCase().includes(q));
}

export class ApiDataProvider implements DataService {
  private lookups: { value: Promise<Lookups>; at: number } | null = null;

  private getLookups(): Promise<Lookups> {
    if (!this.lookups || Date.now() - this.lookups.at > LOOKUP_TTL_MS) {
      const value = Promise.all([
        getAllPages<ApiLocation>("/locations?page_size=500"),
        getAllPages<ApiVehicle>("/vehicles?page_size=500"),
        getAllPages<ApiDevice>("/devices?page_size=500"),
      ]).then(([locations, vehicles, devices]) => ({
        locations: byId(locations),
        vehicles: byId(vehicles),
        devices: byId(devices),
      }));
      value.catch(() => (this.lookups = null));
      this.lookups = { value, at: Date.now() };
    }
    return this.lookups.value;
  }

  private mapShipment(api: ApiShipment, summary: ApiShipmentSummary, lookups: Lookups): Shipment {
    const limits = summary.limits;
    const latest = summary.latest_reading;
    const device = lookups.devices.get(api.device);
    const id = toShipmentId(api.id);
    const quantity = api.items.reduce((sum, i) => sum + (num(i.quantity_kg) ?? 0), 0);

    return {
      id,
      batchId: api.items.map((i) => i.lot).join(", ") || "—",
      fruitProfileId: api.items.map((i) => i.fruit).join(","),
      fruitName: api.items.map((i) => i.fruit_name).join(" + ") || "Sem carga",
      quantityKg: quantity || undefined,
      vehicleId: lookups.vehicles.get(api.vehicle)?.plate,
      sensorIds: device ? [device.uid] : [],
      origin: lookups.locations.get(api.origin)?.name ?? `Local ${api.origin}`,
      destination: lookups.locations.get(api.destination)?.name ?? `Local ${api.destination}`,
      logisticsStatus: logisticsByStatus[api.status],
      environmentalStatus: environmentalStatus(summary),
      environmentalLimits: {
        temperatureMinC: limits?.temperature_min_c ?? 0,
        temperatureMaxC: limits?.temperature_max_c ?? 0,
        relativeHumidityMin: limits?.humidity_min_pct ?? 0,
        relativeHumidityMax: limits?.humidity_max_pct ?? 0,
      },
      latestReading: latest
        ? {
            id: `${id}-latest`,
            sensorId: device?.uid ?? summary.device.uid,
            shipmentId: id,
            temperatureC: latest.temperature_c,
            relativeHumidity: latest.humidity_pct,
            measuredAt: latest.recorded_at,
          }
        : undefined,
      startedAt: api.status === "planned" ? undefined : api.started_at,
      completedAt: api.ended_at ?? undefined,
      createdAt: api.created_at,
    };
  }

  private async loadShipments(): Promise<Shipment[]> {
    const [shipments, lookups] = await Promise.all([
      getAllPages<ApiShipment>("/shipments?page_size=500"),
      this.getLookups(),
    ]);
    const summaries = await Promise.all(
      shipments.map((s) => getData<ApiShipmentSummary>(`/shipments/${s.id}/summary`))
    );
    return shipments.map((s, i) => this.mapShipment(s, summaries[i], lookups));
  }

  async getDashboardSummary(): Promise<DashboardSummary> {
    const [shipments, alerts, lookups] = await Promise.all([
      this.loadShipments(),
      this.getAlerts({ status: "active" }),
      this.getLookups(),
    ]);
    const active = shipments.filter((s) => s.logisticsStatus === "in_transit");
    return {
      shipmentsInTransit: active.length,
      shipmentsOptimal: active.filter((s) => s.environmentalStatus === "optimal").length,
      activeAlerts: alerts.length,
      completedDeliveries: shipments.filter((s) => s.logisticsStatus === "delivered").length,
      sensorsOffline: [...lookups.devices.values()].filter((d) => d.is_active && !d.online).length,
    };
  }

  async getShipments(filters?: ShipmentFilters): Promise<Shipment[]> {
    let result = await this.loadShipments();
    const q = filters?.search?.trim().toLowerCase();
    if (q) result = result.filter((s) => matchesSearch(s, q));
    if (filters?.fruitName) {
      const fruit = filters.fruitName.toLowerCase();
      result = result.filter((s) => s.fruitName.toLowerCase().includes(fruit));
    }
    if (filters?.logisticsStatus) result = result.filter((s) => s.logisticsStatus === filters.logisticsStatus);
    if (filters?.environmentalStatus)
      result = result.filter((s) => s.environmentalStatus === filters.environmentalStatus);
    if (filters?.vehicleId) result = result.filter((s) => s.vehicleId === filters.vehicleId);
    if (filters?.batchId) {
      const lot = filters.batchId.toLowerCase();
      result = result.filter((s) => s.batchId.toLowerCase().includes(lot));
    }
    return result;
  }

  async getShipmentById(id: string): Promise<Shipment | null> {
    const apiId = fromShipmentId(id);
    if (apiId === null) return null;
    try {
      const [shipment, summary, lookups] = await Promise.all([
        getData<ApiShipment>(`/shipments/${apiId}`),
        getData<ApiShipmentSummary>(`/shipments/${apiId}/summary`),
        this.getLookups(),
      ]);
      return this.mapShipment(shipment, summary, lookups);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  }

  async getLatestReadings(shipmentId: string): Promise<SensorReading | null> {
    const shipment = await this.getShipmentById(shipmentId);
    return shipment?.latestReading ?? null;
  }

  async getReadingHistory(shipmentId: string, range: TimeRange): Promise<SensorReading[]> {
    const apiId = fromShipmentId(shipmentId);
    if (apiId === null) return [];
    const params = new URLSearchParams({ page_size: "500" });
    const span = RANGE_MS[range];
    if (span) params.set("start", new Date(Date.now() - span).toISOString());

    const [readings, lookups] = await Promise.all([
      getAllPages<ApiReading>(`/shipments/${apiId}/readings?${params}`),
      this.getLookups(),
    ]);
    return readings.map((r) => mapReading(r, lookups.devices)).reverse();
  }

  // The backend has no GPS data yet.
  async getShipmentPositions(_shipmentId: string): Promise<GeoPosition[]> {
    return [];
  }

  async getAlerts(filters?: AlertFilters): Promise<MonitoringAlert[]> {
    const params = new URLSearchParams({ page_size: "500" });
    if (filters?.severity) params.set("severity", filters.severity);
    if (filters?.status === "resolved") params.set("status", "resolved");
    const shipment = filters?.shipmentId ? fromShipmentId(filters.shipmentId) : null;
    if (shipment !== null) params.set("shipment", String(shipment));

    let alerts = (await getAllPages<ApiAlert>(`/alerts?${params}`)).map(mapAlert);
    if (filters?.status === "active") alerts = alerts.filter((a) => a.status === "active");
    if (filters?.type) alerts = alerts.filter((a) => a.type === filters.type);
    return alerts;
  }

  async acknowledgeAlert(id: string): Promise<void> {
    await postData(`/alerts/${id}/ack`);
  }

  async getFruitProfiles(): Promise<FruitStorageProfile[]> {
    const [fruits, parameters] = await Promise.all([
      getAllPages<ApiFruit>("/fruits?page_size=500"),
      getAllPages<ApiFruitParameter>("/fruit-parameters?page_size=500"),
    ]);
    const sourceByFruit = new Map(parameters.filter((p) => p.is_active).map((p) => [p.fruit, p.source]));

    return fruits
      .filter((f) => f.limits)
      .map((f) => ({
        id: String(f.id),
        fruit: f.name,
        maturityStage: "—",
        temperatureMinC: num(f.limits!.temperature_min_c) ?? 0,
        temperatureMaxC: num(f.limits!.temperature_max_c) ?? 0,
        relativeHumidityMin: num(f.limits!.humidity_min_pct) ?? 0,
        relativeHumidityMax: num(f.limits!.humidity_max_pct) ?? 0,
        sourceUrl: sourceByFruit.get(f.id) ?? "",
        notes: f.description || undefined,
      }));
  }

  // The backend has no notifications endpoint; active alerts play that role.
  async getNotifications(): Promise<AppNotification[]> {
    const alerts = await this.getAlerts({ status: "active" });
    return alerts.map((a) => ({
      id: `alert-${a.id}`,
      title: `${formatAlertType(a.type)} — ${a.shipmentId}`,
      message: a.message,
      type: a.severity,
      read: !!a.acknowledgedAt,
      createdAt: a.startedAt,
      shipmentId: a.shipmentId,
    }));
  }
}
