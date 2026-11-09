export type LogisticsStatus =
  | "pending"
  | "loading"
  | "in_transit"
  | "stopped"
  | "delivered"
  | "cancelled";

export type EnvironmentalStatus =
  | "optimal"
  | "warning"
  | "critical"
  | "no_data"
  | "stale";

export type AlertType =
  | "temperature_low"
  | "temperature_high"
  | "humidity_low"
  | "humidity_high"
  | "shock"
  | "sensor_offline"
  | "location_unavailable";

export type AlertSeverity = "warning" | "critical";

export type AlertStatus = "active" | "resolved";

export type TimeRange = "1h" | "6h" | "24h" | "7d" | "custom";

export type NotificationType = "info" | "warning" | "critical" | "success";

export interface SensorReading {
  id: string;
  sensorId: string;
  shipmentId: string;
  temperatureC: number | null;
  relativeHumidity: number | null;
  measuredAt: string;
  receivedAt?: string;
}

export interface GeoPosition {
  latitude: number;
  longitude: number;
  recordedAt: string;
  accuracyMeters?: number;
}

export interface EnvironmentalLimits {
  temperatureMinC: number;
  temperatureMaxC: number;
  relativeHumidityMin: number;
  relativeHumidityMax: number;
  policyId?: string;
}

export interface Shipment {
  id: string;
  batchId: string;
  fruitProfileId: string;
  fruitName: string;
  variety?: string;
  maturityStage?: string;
  quantityKg?: number;
  vehicleId?: string;
  carrier?: { id: string; name: string };
  sensorIds: string[];
  origin: string;
  destination: string;
  logisticsStatus: LogisticsStatus;
  environmentalStatus: EnvironmentalStatus;
  environmentalLimits: EnvironmentalLimits;
  latestReading?: SensorReading;
  latestPosition?: GeoPosition;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface MonitoringAlert {
  id: string;
  shipmentId: string;
  sensorId?: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  startedAt: string;
  resolvedAt?: string;
  acknowledgedAt?: string;
  message: string;
  durationMs?: number;
}

export interface FruitStorageProfile {
  id: string;
  fruit: string;
  variety?: string;
  maturityStage: string;
  temperatureMinC: number;
  temperatureMaxC: number;
  relativeHumidityMin: number;
  relativeHumidityMax: number;
  sourceUrl: string;
  notes?: string;
}

export interface DashboardSummary {
  shipmentsInTransit: number;
  shipmentsOptimal: number;
  activeAlerts: number;
  completedDeliveries: number;
  sensorsOffline: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  shipmentId?: string;
}

export interface ShipmentFilters {
  search?: string;
  fruitName?: string;
  logisticsStatus?: LogisticsStatus;
  environmentalStatus?: EnvironmentalStatus;
  vehicleId?: string;
  batchId?: string;
}

export interface AlertFilters {
  severity?: AlertSeverity;
  status?: AlertStatus;
  type?: AlertType;
  shipmentId?: string;
}
