import type {
  DashboardSummary,
  Shipment,
  ShipmentFilters,
  SensorReading,
  TimeRange,
  GeoPosition,
  MonitoringAlert,
  AlertFilters,
  AppNotification,
  FruitStorageProfile,
} from "@/types";

export interface DataService {
  getDashboardSummary(): Promise<DashboardSummary>;
  getShipments(filters?: ShipmentFilters): Promise<Shipment[]>;
  getShipmentById(id: string): Promise<Shipment | null>;
  getLatestReadings(shipmentId: string): Promise<SensorReading | null>;
  getReadingHistory(
    shipmentId: string,
    range: TimeRange
  ): Promise<SensorReading[]>;
  getShipmentPositions(shipmentId: string): Promise<GeoPosition[]>;
  getAlerts(filters?: AlertFilters): Promise<MonitoringAlert[]>;
  acknowledgeAlert(id: string): Promise<void>;
  getFruitProfiles(): Promise<FruitStorageProfile[]>;
  getNotifications(): Promise<AppNotification[]>;
}

export type DataProviderType = "mock" | "api";
