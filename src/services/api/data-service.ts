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
  resolveAlert(id: string): Promise<void>;
  startShipment(id: string): Promise<void>;
  finishShipment(id: string): Promise<void>;
  /** Creates a new planned trip with the same route, vehicle, board and cargo; returns its id. */
  repeatShipment(id: string): Promise<string>;
  getFruitProfiles(): Promise<FruitStorageProfile[]>;
  getNotifications(): Promise<AppNotification[]>;
}
