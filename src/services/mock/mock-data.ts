import type {
  SensorReading,
  GeoPosition,
  Shipment,
  MonitoringAlert,
  DashboardSummary,
  AppNotification,
} from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const now = new Date();

function hoursAgo(h: number): Date {
  return new Date(now.getTime() - h * 3_600_000);
}

function minutesAgo(m: number): Date {
  return new Date(now.getTime() - m * 60_000);
}

function iso(d: Date): string {
  return d.toISOString();
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function jitter(base: number, amplitude: number): number {
  return base + (Math.random() - 0.5) * 2 * amplitude;
}

// Generate evenly-spaced readings over the last `hours` hours.
// `tempFn` and `humFn` receive the reading index (0 = oldest) and total count.
function generateReadings(
  shipmentId: string,
  sensorId: string,
  hours: number,
  count: number,
  tempFn: (i: number, n: number) => number | null,
  humFn: (i: number, n: number) => number | null,
  stopBeforeMinutes = 0
): SensorReading[] {
  const readings: SensorReading[] = [];
  const spanMs = hours * 3_600_000;
  const effectiveCount = stopBeforeMinutes > 0
    ? Math.max(1, Math.floor(count * (1 - stopBeforeMinutes / (hours * 60))))
    : count;

  for (let i = 0; i < effectiveCount; i++) {
    const t = i / (count - 1);
    const measuredAt = new Date(now.getTime() - spanMs + t * (spanMs - stopBeforeMinutes * 60_000));
    readings.push({
      id: `reading-${shipmentId}-${String(i).padStart(3, "0")}`,
      sensorId,
      shipmentId,
      temperatureC: tempFn(i, effectiveCount),
      relativeHumidity: humFn(i, effectiveCount),
      measuredAt: iso(measuredAt),
      receivedAt: iso(new Date(measuredAt.getTime() + 2000 + Math.random() * 3000)),
    });
  }
  return readings;
}

// Generate positions along a polyline route.
function generatePositions(
  _shipmentId: string,
  waypoints: [number, number][],
  count: number,
  hours: number,
  progress: number // 0..1  how far along the route the vehicle currently is
): GeoPosition[] {
  const positions: GeoPosition[] = [];
  const spanMs = hours * 3_600_000;

  for (let i = 0; i < count; i++) {
    const t = (i / (count - 1)) * progress;
    // Walk through waypoint segments
    const segCount = waypoints.length - 1;
    const segFloat = t * segCount;
    const segIdx = Math.min(Math.floor(segFloat), segCount - 1);
    const segT = segFloat - segIdx;

    const lat = lerp(waypoints[segIdx][0], waypoints[segIdx + 1][0], segT);
    const lng = lerp(waypoints[segIdx][1], waypoints[segIdx + 1][1], segT);

    positions.push({
      latitude: lat + (Math.random() - 0.5) * 0.005,
      longitude: lng + (Math.random() - 0.5) * 0.005,
      recordedAt: iso(new Date(now.getTime() - spanMs + (i / (count - 1)) * spanMs)),
      accuracyMeters: 5 + Math.random() * 15,
    });
  }
  return positions;
}

// ---------------------------------------------------------------------------
// Route waypoints (approximate highway waypoints in Brazil)
// ---------------------------------------------------------------------------

// Petrolina → São Paulo via Montes Claros, Belo Horizonte
const routePetrolinaSP: [number, number][] = [
  [-9.3891, -40.5027],   // Petrolina
  [-11.4034, -41.2811],  // Irecê
  [-14.8611, -42.0794],  // Guanambi
  [-16.7350, -43.8615],  // Montes Claros
  [-19.9167, -43.9345],  // Belo Horizonte
  [-22.2062, -45.1860],  // Varginha
  [-23.5505, -46.6333],  // São Paulo
];

// Juazeiro → Salvador via Feira de Santana
const routeJuazeiroSalvador: [number, number][] = [
  [-9.4113, -40.5036],   // Juazeiro
  [-10.5073, -40.1867],  // Euclides da Cunha
  [-11.7684, -39.2812],  // Serrinha
  [-12.2669, -38.9666],  // Feira de Santana
  [-12.9714, -38.5014],  // Salvador
];

// Petrolina → Recife via Arcoverde
const routePetrolinaRecife: [number, number][] = [
  [-9.3891, -40.5027],   // Petrolina
  [-8.8137, -38.9832],   // Serra Talhada
  [-8.4186, -37.0542],   // Arcoverde
  [-8.2830, -35.9711],   // Caruaru
  [-8.0476, -34.8770],   // Recife
];

// Juazeiro → Brasília via Barreiras
const routeJuazeiroBrasilia: [number, number][] = [
  [-9.4113, -40.5036],   // Juazeiro
  [-11.0000, -43.0000],  // Ibotirama
  [-12.1528, -44.9930],  // Barreiras
  [-13.5000, -46.0000],  // Posse
  [-15.7939, -47.8828],  // Brasília
];

// Petrolina → Fortaleza via Crato, Juazeiro do Norte
const routePetrolinaFortaleza: [number, number][] = [
  [-9.3891, -40.5027],   // Petrolina
  [-8.3569, -39.3174],   // Salgueiro
  [-7.2306, -39.4103],   // Juazeiro do Norte
  [-6.3572, -39.0530],   // Iguatu
  [-4.9764, -39.0156],   // Quixadá
  [-3.7172, -38.5433],   // Fortaleza
];

// ---------------------------------------------------------------------------
// Shipments
// ---------------------------------------------------------------------------

export const mockShipments: Shipment[] = [
  {
    id: "CV-1001",
    batchId: "UVA-041",
    fruitProfileId: "uva-mesa-padrao",
    fruitName: "Uva de mesa",
    maturityStage: "Padrão pós-colheita",
    quantityKg: 12000,
    vehicleId: "TR-001",
    sensorIds: ["SNS-001"],
    origin: "Petrolina, PE",
    destination: "São Paulo, SP",
    logisticsStatus: "in_transit",
    environmentalStatus: "optimal",
    environmentalLimits: {
      temperatureMinC: -1,
      temperatureMaxC: 0,
      relativeHumidityMin: 90,
      relativeHumidityMax: 95,
    },
    latestReading: {
      id: "reading-CV-1001-latest",
      sensorId: "SNS-001",
      shipmentId: "CV-1001",
      temperatureC: -0.5,
      relativeHumidity: 92,
      measuredAt: iso(minutesAgo(5)),
      receivedAt: iso(minutesAgo(4)),
    },
    latestPosition: {
      latitude: -16.735,
      longitude: -43.8615,
      recordedAt: iso(minutesAgo(5)),
      accuracyMeters: 8,
    },
    startedAt: iso(hoursAgo(18)),
    createdAt: iso(hoursAgo(20)),
  },
  {
    id: "CV-1002",
    batchId: "MNG-018",
    fruitProfileId: "manga-verde-madura",
    fruitName: "Manga",
    variety: "Tommy Atkins",
    maturityStage: "Verde-madura",
    quantityKg: 8000,
    vehicleId: "TR-003",
    sensorIds: ["SNS-003"],
    origin: "Juazeiro, BA",
    destination: "Salvador, BA",
    logisticsStatus: "in_transit",
    environmentalStatus: "critical",
    environmentalLimits: {
      temperatureMinC: 13,
      temperatureMaxC: 13,
      relativeHumidityMin: 90,
      relativeHumidityMax: 95,
    },
    latestReading: {
      id: "reading-CV-1002-latest",
      sensorId: "SNS-003",
      shipmentId: "CV-1002",
      temperatureC: 18.2,
      relativeHumidity: 88,
      measuredAt: iso(minutesAgo(3)),
      receivedAt: iso(minutesAgo(2)),
    },
    latestPosition: {
      latitude: -12.2669,
      longitude: -38.9666,
      recordedAt: iso(minutesAgo(3)),
      accuracyMeters: 10,
    },
    startedAt: iso(hoursAgo(8)),
    createdAt: iso(hoursAgo(10)),
  },
  {
    id: "CV-1003",
    batchId: "GOI-007",
    fruitProfileId: "goiaba-verde-madura",
    fruitName: "Goiaba",
    maturityStage: "Verde-madura/parcialmente madura",
    quantityKg: 5000,
    vehicleId: "TR-005",
    sensorIds: ["SNS-005"],
    origin: "Petrolina, PE",
    destination: "Recife, PE",
    logisticsStatus: "in_transit",
    environmentalStatus: "warning",
    environmentalLimits: {
      temperatureMinC: 8,
      temperatureMaxC: 10,
      relativeHumidityMin: 90,
      relativeHumidityMax: 95,
    },
    latestReading: {
      id: "reading-CV-1003-latest",
      sensorId: "SNS-005",
      shipmentId: "CV-1003",
      temperatureC: 9.1,
      relativeHumidity: 78,
      measuredAt: iso(minutesAgo(8)),
      receivedAt: iso(minutesAgo(7)),
    },
    latestPosition: {
      latitude: -8.4186,
      longitude: -37.0542,
      recordedAt: iso(minutesAgo(8)),
      accuracyMeters: 12,
    },
    startedAt: iso(hoursAgo(6)),
    createdAt: iso(hoursAgo(7)),
  },
  {
    id: "CV-1004",
    batchId: "BAN-033",
    fruitProfileId: "banana-verde-madura",
    fruitName: "Banana",
    maturityStage: "Verde-madura",
    quantityKg: 15000,
    vehicleId: "TR-008",
    sensorIds: ["SNS-008"],
    origin: "Juazeiro, BA",
    destination: "Brasília, DF",
    logisticsStatus: "in_transit",
    environmentalStatus: "stale",
    environmentalLimits: {
      temperatureMinC: 13,
      temperatureMaxC: 14,
      relativeHumidityMin: 90,
      relativeHumidityMax: 95,
    },
    latestReading: {
      id: "reading-CV-1004-latest",
      sensorId: "SNS-008",
      shipmentId: "CV-1004",
      temperatureC: 13.5,
      relativeHumidity: 91,
      measuredAt: iso(hoursAgo(2.5)),
      receivedAt: iso(hoursAgo(2.4)),
    },
    latestPosition: {
      latitude: -12.1528,
      longitude: -44.993,
      recordedAt: iso(hoursAgo(2.5)),
      accuracyMeters: 20,
    },
    startedAt: iso(hoursAgo(14)),
    createdAt: iso(hoursAgo(16)),
  },
  {
    id: "CV-1005",
    batchId: "MEL-012",
    fruitProfileId: "melao-honeydew-padrao",
    fruitName: "Melão honeydew",
    maturityStage: "Padrão pós-colheita",
    quantityKg: 10000,
    vehicleId: "TR-002",
    sensorIds: ["SNS-002"],
    origin: "Petrolina, PE",
    destination: "Fortaleza, CE",
    logisticsStatus: "delivered",
    environmentalStatus: "optimal",
    environmentalLimits: {
      temperatureMinC: 7,
      temperatureMaxC: 10,
      relativeHumidityMin: 85,
      relativeHumidityMax: 90,
    },
    latestReading: {
      id: "reading-CV-1005-latest",
      sensorId: "SNS-002",
      shipmentId: "CV-1005",
      temperatureC: 8.5,
      relativeHumidity: 87,
      measuredAt: iso(hoursAgo(1)),
      receivedAt: iso(hoursAgo(0.9)),
    },
    latestPosition: {
      latitude: -3.7172,
      longitude: -38.5433,
      recordedAt: iso(hoursAgo(1)),
      accuracyMeters: 6,
    },
    startedAt: iso(hoursAgo(36)),
    completedAt: iso(hoursAgo(1)),
    createdAt: iso(hoursAgo(38)),
  },
  {
    id: "CV-1006",
    batchId: "MAM-055",
    fruitProfileId: "mamao-verde-maduro",
    fruitName: "Mamão",
    maturityStage: "Verde-maduro",
    quantityKg: 7000,
    vehicleId: "TR-010",
    sensorIds: ["SNS-010"],
    origin: "Petrolina, PE",
    destination: "Rio de Janeiro, RJ",
    logisticsStatus: "pending",
    environmentalStatus: "no_data",
    environmentalLimits: {
      temperatureMinC: 13,
      temperatureMaxC: 13,
      relativeHumidityMin: 90,
      relativeHumidityMax: 95,
    },
    startedAt: undefined,
    createdAt: iso(hoursAgo(2)),
  },
];

// ---------------------------------------------------------------------------
// Sensor readings (48 per in-transit shipment ≈ 24h every 30min)
// ---------------------------------------------------------------------------

const readingsCV1001 = generateReadings(
  "CV-1001", "SNS-001", 24, 48,
  (_i, _n) => jitter(-0.5, 0.3),              // stable around -0.5°C
  (_i, _n) => jitter(92, 1.5),                // stable around 92%
);

const readingsCV1002 = generateReadings(
  "CV-1002", "SNS-003", 24, 48,
  (i, n) => {
    // Starts ok at 13°C, rises steadily over the last 6 hours
    const t = i / (n - 1);
    if (t < 0.6) return jitter(13, 0.4);
    const rampT = (t - 0.6) / 0.4;
    return jitter(lerp(13, 18.2, rampT), 0.3);
  },
  (i, n) => {
    const t = i / (n - 1);
    if (t < 0.7) return jitter(92, 1);
    const rampT = (t - 0.7) / 0.3;
    return jitter(lerp(92, 88, rampT), 0.8);
  },
);

const readingsCV1003 = generateReadings(
  "CV-1003", "SNS-005", 24, 48,
  (_i, _n) => jitter(9.1, 0.5),               // temp is fine
  (i, n) => {
    // Humidity drops gradually over last 8 hours
    const t = i / (n - 1);
    if (t < 0.5) return jitter(92, 1.2);
    const rampT = (t - 0.5) / 0.5;
    return jitter(lerp(92, 78, rampT), 1);
  },
);

// Banana: readings stop 2.5 hours ago
const readingsCV1004 = generateReadings(
  "CV-1004", "SNS-008", 24, 48,
  () => jitter(13.5, 0.3),
  () => jitter(91, 1),
  150, // stop 150 minutes before now
);

// Melão delivered — full 24h of readings
const readingsCV1005 = generateReadings(
  "CV-1005", "SNS-002", 36, 72,
  () => jitter(8.5, 0.6),
  () => jitter(87, 1.2),
);

export const mockReadings = new Map<string, SensorReading[]>([
  ["CV-1001", readingsCV1001],
  ["CV-1002", readingsCV1002],
  ["CV-1003", readingsCV1003],
  ["CV-1004", readingsCV1004],
  ["CV-1005", readingsCV1005],
]);

// ---------------------------------------------------------------------------
// Positions
// ---------------------------------------------------------------------------

const posCV1001 = generatePositions("CV-1001", routePetrolinaSP, 12, 18, 0.5);
const posCV1002 = generatePositions("CV-1002", routeJuazeiroSalvador, 10, 8, 0.75);
const posCV1003 = generatePositions("CV-1003", routePetrolinaRecife, 10, 6, 0.55);
const posCV1004 = generatePositions("CV-1004", routeJuazeiroBrasilia, 12, 14, 0.45);
const posCV1005 = generatePositions("CV-1005", routePetrolinaFortaleza, 15, 36, 1.0);
const posCV1006: GeoPosition[] = [
  {
    latitude: -9.3891,
    longitude: -40.5027,
    recordedAt: iso(hoursAgo(2)),
    accuracyMeters: 5,
  },
];

export const mockPositions = new Map<string, GeoPosition[]>([
  ["CV-1001", posCV1001],
  ["CV-1002", posCV1002],
  ["CV-1003", posCV1003],
  ["CV-1004", posCV1004],
  ["CV-1005", posCV1005],
  ["CV-1006", posCV1006],
]);

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

export const mockAlerts: MonitoringAlert[] = [
  {
    id: "ALT-001",
    shipmentId: "CV-1002",
    sensorId: "SNS-003",
    type: "temperature_high",
    severity: "critical",
    status: "active",
    startedAt: iso(hoursAgo(3.5)),
    message: "Temperatura acima do limite — Carga CV-1002 (Manga Tommy Atkins). Leitura atual: 18,2 °C, limite: 13 °C.",
    durationMs: 3.5 * 3_600_000,
  },
  {
    id: "ALT-002",
    shipmentId: "CV-1003",
    sensorId: "SNS-005",
    type: "humidity_low",
    severity: "warning",
    status: "active",
    startedAt: iso(hoursAgo(4)),
    message: "Umidade inferior ao recomendado — Lote GOI-007 (Goiaba). Leitura atual: 78%, limite: 90%.",
    durationMs: 4 * 3_600_000,
  },
  {
    id: "ALT-003",
    shipmentId: "CV-1004",
    sensorId: "SNS-008",
    type: "sensor_offline",
    severity: "warning",
    status: "active",
    startedAt: iso(hoursAgo(2.5)),
    message: "Sensor sem comunicação — Veículo TR-008 (Banana). Última leitura há mais de 2 horas.",
    durationMs: 2.5 * 3_600_000,
  },
  {
    id: "ALT-004",
    shipmentId: "CV-1001",
    sensorId: "SNS-001",
    type: "temperature_low",
    severity: "warning",
    status: "resolved",
    startedAt: iso(hoursAgo(12)),
    resolvedAt: iso(hoursAgo(11.5)),
    acknowledgedAt: iso(hoursAgo(11.8)),
    message: "Temperatura abaixo do limite — Carga CV-1001 (Uva de mesa). Leitura: -1,8 °C, limite: -1 °C.",
    durationMs: 0.5 * 3_600_000,
  },
  {
    id: "ALT-005",
    shipmentId: "CV-1005",
    sensorId: "SNS-002",
    type: "temperature_high",
    severity: "warning",
    status: "resolved",
    startedAt: iso(hoursAgo(20)),
    resolvedAt: iso(hoursAgo(19)),
    acknowledgedAt: iso(hoursAgo(19.5)),
    message: "Temperatura elevada — Carga CV-1005 (Melão honeydew). Pico registrado: 11,2 °C, limite: 10 °C.",
    durationMs: 1 * 3_600_000,
  },
  {
    id: "ALT-006",
    shipmentId: "CV-1002",
    sensorId: "SNS-003",
    type: "humidity_low",
    severity: "warning",
    status: "active",
    startedAt: iso(hoursAgo(2)),
    message: "Umidade abaixo do recomendado — Carga CV-1002 (Manga). Leitura: 88%, limite: 90%.",
    durationMs: 2 * 3_600_000,
  },
];

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export const mockNotifications: AppNotification[] = [
  {
    id: "NTF-001",
    title: "Alerta crítico de temperatura",
    message: "Manga Tommy Atkins (CV-1002): temperatura atingiu 18,2 °C — muito acima do limite de 13 °C.",
    type: "critical",
    read: false,
    createdAt: iso(hoursAgo(3.5)),
    shipmentId: "CV-1002",
  },
  {
    id: "NTF-002",
    title: "Umidade baixa detectada",
    message: "Goiaba (CV-1003): umidade caiu para 78% — abaixo do mínimo de 90%.",
    type: "warning",
    read: false,
    createdAt: iso(hoursAgo(4)),
    shipmentId: "CV-1003",
  },
  {
    id: "NTF-003",
    title: "Sensor sem comunicação",
    message: "Veículo TR-008 (CV-1004): sem dados há mais de 2 horas.",
    type: "warning",
    read: false,
    createdAt: iso(hoursAgo(2.5)),
    shipmentId: "CV-1004",
  },
  {
    id: "NTF-004",
    title: "Entrega concluída",
    message: "Melão honeydew (CV-1005) entregue em Fortaleza, CE com sucesso.",
    type: "success",
    read: true,
    createdAt: iso(hoursAgo(1)),
    shipmentId: "CV-1005",
  },
  {
    id: "NTF-005",
    title: "Alerta resolvido",
    message: "Uva de mesa (CV-1001): temperatura voltou ao intervalo normal após breve queda.",
    type: "info",
    read: true,
    createdAt: iso(hoursAgo(11.5)),
    shipmentId: "CV-1001",
  },
  {
    id: "NTF-006",
    title: "Nova carga cadastrada",
    message: "Mamão (CV-1006) aguardando carregamento para Rio de Janeiro, RJ.",
    type: "info",
    read: true,
    createdAt: iso(hoursAgo(2)),
    shipmentId: "CV-1006",
  },
];

// ---------------------------------------------------------------------------
// Dashboard summary
// ---------------------------------------------------------------------------

export const mockDashboardSummary: DashboardSummary = {
  shipmentsInTransit: mockShipments.filter(
    (s) => s.logisticsStatus === "in_transit"
  ).length,
  shipmentsOptimal: mockShipments.filter(
    (s) =>
      s.logisticsStatus === "in_transit" &&
      s.environmentalStatus === "optimal"
  ).length,
  activeAlerts: mockAlerts.filter((a) => a.status === "active").length,
  completedDeliveries: mockShipments.filter(
    (s) => s.logisticsStatus === "delivered"
  ).length,
  sensorsOffline: mockAlerts.filter(
    (a) => a.type === "sensor_offline" && a.status === "active"
  ).length,
};
