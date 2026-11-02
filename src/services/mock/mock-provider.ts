import type { DataService } from "../api/data-service";
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
import { fruitProfiles } from "@/config/fruit-profiles";
import {
  mockShipments,
  mockReadings,
  mockPositions,
  mockAlerts,
  mockNotifications,
  mockDashboardSummary,
} from "./mock-data";

function delay(min = 200, max = 500): Promise<void> {
  const ms = min + Math.random() * (max - min);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function matchesSearch(shipment: Shipment, search: string): boolean {
  const q = search.toLowerCase();
  return (
    shipment.id.toLowerCase().includes(q) ||
    shipment.batchId.toLowerCase().includes(q) ||
    shipment.fruitName.toLowerCase().includes(q) ||
    (shipment.variety?.toLowerCase().includes(q) ?? false) ||
    shipment.origin.toLowerCase().includes(q) ||
    shipment.destination.toLowerCase().includes(q) ||
    (shipment.vehicleId?.toLowerCase().includes(q) ?? false)
  );
}

function filterReadingsByRange(
  readings: SensorReading[],
  range: TimeRange
): SensorReading[] {
  const now = Date.now();
  const cutoffs: Record<string, number> = {
    "1h": 3_600_000,
    "6h": 6 * 3_600_000,
    "24h": 24 * 3_600_000,
    "7d": 7 * 24 * 3_600_000,
  };

  if (range === "custom" || !(range in cutoffs)) return readings;

  const cutoff = now - cutoffs[range];
  return readings.filter((r) => new Date(r.measuredAt).getTime() >= cutoff);
}

// Mutable copy so acknowledgeAlert can mutate
const alerts = [...mockAlerts];

export class MockDataProvider implements DataService {
  async getDashboardSummary(): Promise<DashboardSummary> {
    await delay();
    return { ...mockDashboardSummary };
  }

  async getShipments(filters?: ShipmentFilters): Promise<Shipment[]> {
    await delay();
    let result = [...mockShipments];

    if (filters?.search) {
      result = result.filter((s) => matchesSearch(s, filters.search!));
    }
    if (filters?.fruitName) {
      result = result.filter(
        (s) => s.fruitName.toLowerCase() === filters.fruitName!.toLowerCase()
      );
    }
    if (filters?.logisticsStatus) {
      result = result.filter(
        (s) => s.logisticsStatus === filters.logisticsStatus
      );
    }
    if (filters?.environmentalStatus) {
      result = result.filter(
        (s) => s.environmentalStatus === filters.environmentalStatus
      );
    }
    if (filters?.vehicleId) {
      result = result.filter((s) => s.vehicleId === filters.vehicleId);
    }
    if (filters?.batchId) {
      result = result.filter(
        (s) => s.batchId.toLowerCase().includes(filters.batchId!.toLowerCase())
      );
    }

    return result;
  }

  async getShipmentById(id: string): Promise<Shipment | null> {
    await delay();
    return mockShipments.find((s) => s.id === id) ?? null;
  }

  async getLatestReadings(shipmentId: string): Promise<SensorReading | null> {
    await delay();
    const readings = mockReadings.get(shipmentId);
    if (!readings || readings.length === 0) return null;
    return readings[readings.length - 1];
  }

  async getReadingHistory(
    shipmentId: string,
    range: TimeRange
  ): Promise<SensorReading[]> {
    await delay();
    const readings = mockReadings.get(shipmentId);
    if (!readings) return [];
    return filterReadingsByRange(readings, range);
  }

  async getShipmentPositions(shipmentId: string): Promise<GeoPosition[]> {
    await delay();
    return mockPositions.get(shipmentId) ?? [];
  }

  async getAlerts(filters?: AlertFilters): Promise<MonitoringAlert[]> {
    await delay();
    let result = [...alerts];

    if (filters?.severity) {
      result = result.filter((a) => a.severity === filters.severity);
    }
    if (filters?.status) {
      result = result.filter((a) => a.status === filters.status);
    }
    if (filters?.type) {
      result = result.filter((a) => a.type === filters.type);
    }
    if (filters?.shipmentId) {
      result = result.filter((a) => a.shipmentId === filters.shipmentId);
    }

    return result;
  }

  async acknowledgeAlert(id: string): Promise<void> {
    await delay();
    const alert = alerts.find((a) => a.id === id);
    if (alert) {
      alert.acknowledgedAt = new Date().toISOString();
    }
  }

  async getFruitProfiles(): Promise<FruitStorageProfile[]> {
    await delay();
    return [...fruitProfiles];
  }

  async getNotifications(): Promise<AppNotification[]> {
    await delay();
    return [...mockNotifications];
  }
}
