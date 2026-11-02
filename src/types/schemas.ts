import { z } from "zod";

const isoDateString = z.string().regex(
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
  "Formato ISO 8601 esperado"
);

export const SensorReadingSchema = z.object({
  id: z.string().min(1),
  sensorId: z.string().min(1),
  shipmentId: z.string().min(1),
  temperatureC: z.number().nullable(),
  relativeHumidity: z.number().min(0).max(100).nullable(),
  measuredAt: isoDateString,
  receivedAt: isoDateString.optional(),
});

export const GeoPositionSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  recordedAt: isoDateString,
  accuracyMeters: z.number().min(0).optional(),
});

export const EnvironmentalLimitsSchema = z
  .object({
    temperatureMinC: z.number(),
    temperatureMaxC: z.number(),
    relativeHumidityMin: z.number().min(0).max(100),
    relativeHumidityMax: z.number().min(0).max(100),
    policyId: z.string().optional(),
  })
  .refine((d) => d.temperatureMinC <= d.temperatureMaxC, {
    message: "temperatureMinC não pode ser maior que temperatureMaxC",
  })
  .refine((d) => d.relativeHumidityMin <= d.relativeHumidityMax, {
    message: "relativeHumidityMin não pode ser maior que relativeHumidityMax",
  });

const LogisticsStatusSchema = z.enum([
  "pending",
  "loading",
  "in_transit",
  "stopped",
  "delivered",
  "cancelled",
]);

const EnvironmentalStatusSchema = z.enum([
  "optimal",
  "warning",
  "critical",
  "no_data",
  "stale",
]);

export const ShipmentSchema = z.object({
  id: z.string().min(1),
  batchId: z.string().min(1),
  fruitProfileId: z.string().min(1),
  fruitName: z.string().min(1),
  variety: z.string().optional(),
  maturityStage: z.string().optional(),
  quantityKg: z.number().positive().optional(),
  vehicleId: z.string().optional(),
  sensorIds: z.array(z.string().min(1)),
  origin: z.string().min(1),
  destination: z.string().min(1),
  logisticsStatus: LogisticsStatusSchema,
  environmentalStatus: EnvironmentalStatusSchema,
  environmentalLimits: z.object({
    temperatureMinC: z.number(),
    temperatureMaxC: z.number(),
    relativeHumidityMin: z.number().min(0).max(100),
    relativeHumidityMax: z.number().min(0).max(100),
    policyId: z.string().optional(),
  }),
  latestReading: SensorReadingSchema.optional(),
  latestPosition: GeoPositionSchema.optional(),
  startedAt: isoDateString.optional(),
  completedAt: isoDateString.optional(),
  createdAt: isoDateString,
});

const AlertTypeSchema = z.enum([
  "temperature_low",
  "temperature_high",
  "humidity_low",
  "humidity_high",
  "shock",
  "sensor_offline",
  "location_unavailable",
]);

const AlertSeveritySchema = z.enum(["warning", "critical"]);
const AlertStatusSchema = z.enum(["active", "resolved"]);

export const MonitoringAlertSchema = z.object({
  id: z.string().min(1),
  shipmentId: z.string().min(1),
  sensorId: z.string().optional(),
  type: AlertTypeSchema,
  severity: AlertSeveritySchema,
  status: AlertStatusSchema,
  startedAt: isoDateString,
  resolvedAt: isoDateString.optional(),
  acknowledgedAt: isoDateString.optional(),
  message: z.string().min(1),
  durationMs: z.number().min(0).optional(),
});

export const FruitStorageProfileSchema = z
  .object({
    id: z.string().min(1),
    fruit: z.string().min(1),
    variety: z.string().optional(),
    maturityStage: z.string().min(1),
    temperatureMinC: z.number(),
    temperatureMaxC: z.number(),
    relativeHumidityMin: z.number().min(0).max(100),
    relativeHumidityMax: z.number().min(0).max(100),
    sourceUrl: z.string().url(),
    notes: z.string().optional(),
  })
  .refine((d) => d.temperatureMinC <= d.temperatureMaxC, {
    message: "temperatureMinC não pode ser maior que temperatureMaxC",
  })
  .refine((d) => d.relativeHumidityMin <= d.relativeHumidityMax, {
    message: "relativeHumidityMin não pode ser maior que relativeHumidityMax",
  });

export const DashboardSummarySchema = z.object({
  shipmentsInTransit: z.number().int().min(0),
  shipmentsOptimal: z.number().int().min(0),
  activeAlerts: z.number().int().min(0),
  completedDeliveries: z.number().int().min(0),
  sensorsOffline: z.number().int().min(0),
});
