import { useState, Suspense, lazy, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Thermometer,
  Droplets,
  MapPin,
  Truck,
  Calendar,
  Package,
  Weight,
  Cpu,
  AlertTriangle,
  CheckCircle,
  Clock,
  Info,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useShipment,
  useReadingHistory,
  useShipmentPositions,
  useAlerts,
} from "@/hooks/use-data-service";
import type { TimeRange, MonitoringAlert } from "@/types";
import {
  formatLogisticsStatus,
  formatEnvironmentalStatus,
  getEnvironmentalBadgeVariant,
  getLogisticsBadgeVariant,
  formatTemperature,
  formatHumidity,
  formatRelativeTime,
  formatDateTime,
  formatAlertType,
} from "@/utils/format";

const TemperatureChart = lazy(() =>
  import("@/components/charts/temperature-chart").then((m) => ({
    default: m.TemperatureChart,
  }))
);
const HumidityChart = lazy(() =>
  import("@/components/charts/humidity-chart").then((m) => ({
    default: m.HumidityChart,
  }))
);
const ShipmentMap = lazy(() =>
  import("@/components/maps/shipment-map").then((m) => ({
    default: m.ShipmentMap,
  }))
);

const badgeColors: Record<string, string> = {
  success: "bg-[#1F8A4D]/10 text-[#1F8A4D]",
  warning: "bg-[#E08A2E]/10 text-[#E08A2E]",
  critical: "bg-[#D94F4F]/10 text-[#D94F4F]",
  info: "bg-[#427DA5]/10 text-[#427DA5]",
  neutral: "bg-[#5B7264]/10 text-[#5B7264]",
  muted: "bg-[#BFE3C8]/10 text-[#5B7264]",
};

function Badge({ label, variant }: { label: string; variant: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        badgeColors[variant] ?? badgeColors.neutral
      )}
    >
      {label}
    </span>
  );
}

const tabs = [
  { id: "overview", label: "Visão Geral" },
  { id: "environment", label: "Temperatura e Umidade" },
  { id: "tracking", label: "Rastreamento" },
  { id: "alerts", label: "Alertas" },
  { id: "history", label: "Histórico" },
] as const;

type TabId = (typeof tabs)[number]["id"];

function ChartSkeleton() {
  return (
    <div className="flex h-64 animate-pulse items-center justify-center rounded-lg bg-[#F4FAF5]">
      <span className="text-sm text-[#BFE3C8]">Carregando gráfico...</span>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E6F4EA]">
        <Icon className="h-4 w-4 text-[#1F8A4D]" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[#5B7264]">{label}</p>
        <p className="text-sm font-medium text-[#123A24] truncate">{value || "—"}</p>
      </div>
    </div>
  );
}

function AlertRow({ alert }: { alert: MonitoringAlert }) {
  const isActive = alert.status === "active";
  const isCritical = alert.severity === "critical";

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4",
        isActive
          ? isCritical
            ? "border-[#D94F4F]/20 bg-[#D94F4F]/5"
            : "border-[#E08A2E]/20 bg-[#E08A2E]/5"
          : "border-[#E6F4EA] bg-white"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isActive
            ? isCritical
              ? "bg-[#D94F4F]/10"
              : "bg-[#E08A2E]/10"
            : "bg-[#E6F4EA]"
        )}
      >
        {isActive ? (
          <AlertTriangle
            className={cn(
              "h-4 w-4",
              isCritical ? "text-[#D94F4F]" : "text-[#E08A2E]"
            )}
          />
        ) : (
          <CheckCircle className="h-4 w-4 text-[#1F8A4D]" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-[#123A24]">
            {formatAlertType(alert.type)}
          </p>
          <Badge
            label={isCritical ? "Crítico" : "Atenção"}
            variant={isCritical ? "critical" : "warning"}
          />
          {!isActive && (
            <Badge label="Resolvido" variant="success" />
          )}
        </div>
        <p className="mt-0.5 text-sm text-[#5B7264]">{alert.message}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#5B7264]">
          <span>Início: {formatDateTime(alert.startedAt)}</span>
          {alert.resolvedAt && (
            <span>Resolvido: {formatDateTime(alert.resolvedAt)}</span>
          )}
          {alert.acknowledgedAt && (
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Reconhecido
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface TimelineEvent {
  id: string;
  type: "positive" | "warning" | "critical" | "neutral";
  icon: React.ElementType;
  title: string;
  description: string;
  timestamp: string;
}

function Timeline({ events }: { events: TimelineEvent[] }) {
  const iconColors: Record<string, string> = {
    positive: "bg-[#1F8A4D]/10 text-[#1F8A4D] border-[#1F8A4D]/20",
    warning: "bg-[#E08A2E]/10 text-[#E08A2E] border-[#E08A2E]/20",
    critical: "bg-[#D94F4F]/10 text-[#D94F4F] border-[#D94F4F]/20",
    neutral: "bg-[#E6F4EA] text-[#5B7264] border-[#E6F4EA]",
  };

  return (
    <div className="relative space-y-0">
      {events.map((event, idx) => {
        const Icon = event.icon;
        const isLast = idx === events.length - 1;
        return (
          <div key={event.id} className="relative flex gap-4 pb-6">
            {!isLast && (
              <div className="absolute left-[15px] top-9 h-[calc(100%-20px)] w-px bg-[#E6F4EA]" />
            )}
            <div
              className={cn(
                "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                iconColors[event.type]
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 pt-0.5">
              <p className="text-sm font-medium text-[#123A24]">
                {event.title}
              </p>
              <p className="mt-0.5 text-sm text-[#5B7264]">
                {event.description}
              </p>
              <p className="mt-1 text-xs text-[#BFE3C8]">
                {formatDateTime(event.timestamp)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ShipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");

  const { data: shipment, isLoading: shipmentLoading } = useShipment(id ?? "");
  const { data: readings, isLoading: readingsLoading } = useReadingHistory(
    id ?? "",
    timeRange
  );
  const { data: positions } =
    useShipmentPositions(id ?? "");
  const { data: alerts, isLoading: alertsLoading } = useAlerts({
    shipmentId: id,
  });

  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    if (!shipment || !alerts) return [];

    const events: TimelineEvent[] = [];

    if (shipment.createdAt) {
      events.push({
        id: "created",
        type: "neutral",
        icon: Package,
        title: "Carga registrada",
        description: `Carga ${shipment.id} criada para ${shipment.fruitName}`,
        timestamp: shipment.createdAt,
      });
    }

    if (shipment.startedAt) {
      events.push({
        id: "started",
        type: "positive",
        icon: Truck,
        title: "Transporte iniciado",
        description: `Saída de ${shipment.origin}`,
        timestamp: shipment.startedAt,
      });
    }

    for (const alert of alerts) {
      events.push({
        id: `alert-start-${alert.id}`,
        type: alert.severity === "critical" ? "critical" : "warning",
        icon: AlertTriangle,
        title: formatAlertType(alert.type),
        description: alert.message,
        timestamp: alert.startedAt,
      });
      if (alert.resolvedAt) {
        events.push({
          id: `alert-resolve-${alert.id}`,
          type: "positive",
          icon: CheckCircle,
          title: `${formatAlertType(alert.type)} — Resolvido`,
          description: "Condição normalizada.",
          timestamp: alert.resolvedAt,
        });
      }
    }

    if (shipment.completedAt) {
      events.push({
        id: "completed",
        type: "positive",
        icon: CheckCircle,
        title: "Entrega concluída",
        description: `Chegada em ${shipment.destination}`,
        timestamp: shipment.completedAt,
      });
    }

    events.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return events;
  }, [shipment, alerts]);

  if (shipmentLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-40 animate-pulse rounded bg-[#E6F4EA]" />
        <div className="h-8 w-64 animate-pulse rounded bg-[#E6F4EA]" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-[#E6F4EA]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <XCircle className="h-12 w-12 text-[#D94F4F]" />
        <h2 className="mt-4 text-lg font-semibold text-[#123A24]">
          Carga não encontrada
        </h2>
        <p className="mt-1 text-sm text-[#5B7264]">
          A carga "{id}" não existe ou foi removida.
        </p>
        <Link
          to="/cargas"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#1A7A44] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para cargas
        </Link>
      </div>
    );
  }

  const limits = shipment.environmentalLimits;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        to="/cargas"
        className="inline-flex items-center gap-1 text-sm text-[#5B7264] hover:text-[#1A7A44] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para cargas
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#123A24]">
              {shipment.id}
            </h1>
            <Badge
              label={formatLogisticsStatus(shipment.logisticsStatus)}
              variant={getLogisticsBadgeVariant(shipment.logisticsStatus)}
            />
            <Badge
              label={formatEnvironmentalStatus(shipment.environmentalStatus)}
              variant={getEnvironmentalBadgeVariant(
                shipment.environmentalStatus
              )}
            />
          </div>
          <p className="mt-1 text-sm text-[#5B7264]">
            {shipment.fruitName}
            {shipment.variety && ` · ${shipment.variety}`} — Lote{" "}
            {shipment.batchId}
          </p>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <InfoItem
          icon={Package}
          label="Lote"
          value={shipment.batchId}
        />
        <InfoItem
          icon={Package}
          label="Fruta / Variedade"
          value={`${shipment.fruitName}${shipment.variety ? ` (${shipment.variety})` : ""}`}
        />
        <InfoItem
          icon={Info}
          label="Maturação"
          value={shipment.maturityStage ?? "—"}
        />
        <InfoItem
          icon={Weight}
          label="Peso"
          value={
            shipment.quantityKg ? `${shipment.quantityKg.toLocaleString("pt-BR")} kg` : "—"
          }
        />
        <InfoItem
          icon={MapPin}
          label="Origem"
          value={shipment.origin}
        />
        <InfoItem
          icon={MapPin}
          label="Destino"
          value={shipment.destination}
        />
        <InfoItem
          icon={Truck}
          label="Veículo"
          value={shipment.vehicleId ?? "—"}
        />
        <InfoItem
          icon={Cpu}
          label="Sensor(es)"
          value={shipment.sensorIds.join(", ") || "—"}
        />
        <InfoItem
          icon={Thermometer}
          label="Limites de temperatura"
          value={`${limits.temperatureMinC}°C a ${limits.temperatureMaxC}°C`}
        />
        <InfoItem
          icon={Droplets}
          label="Limites de umidade"
          value={`${limits.relativeHumidityMin}% a ${limits.relativeHumidityMax}%`}
        />
        {shipment.startedAt && (
          <InfoItem
            icon={Calendar}
            label="Início do transporte"
            value={formatDateTime(shipment.startedAt)}
          />
        )}
        {shipment.latestReading?.measuredAt && (
          <InfoItem
            icon={Clock}
            label="Última leitura"
            value={formatRelativeTime(shipment.latestReading.measuredAt)}
          />
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-[#E6F4EA]">
        <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Abas">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "border-[#1A7A44] text-[#1A7A44]"
                  : "border-transparent text-[#5B7264] hover:text-[#123A24] hover:border-[#BFE3C8]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div>
        {/* Overview */}
        {activeTab === "overview" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#123A24] uppercase tracking-wide">
                Leituras atuais
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-[#E6F4EA] bg-white p-4">
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-5 w-5 text-[#1F8A4D]" />
                    <span className="text-xs text-[#5B7264]">Temperatura</span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-[#123A24]">
                    {formatTemperature(
                      shipment.latestReading?.temperatureC ?? null
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-[#5B7264]">
                    Limite: {limits.temperatureMinC}°C a {limits.temperatureMaxC}
                    °C
                  </p>
                </div>
                <div className="rounded-xl border border-[#E6F4EA] bg-white p-4">
                  <div className="flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-[#427DA5]" />
                    <span className="text-xs text-[#5B7264]">Umidade</span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-[#123A24]">
                    {formatHumidity(
                      shipment.latestReading?.relativeHumidity ?? null
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-[#5B7264]">
                    Limite: {limits.relativeHumidityMin}% a{" "}
                    {limits.relativeHumidityMax}%
                  </p>
                </div>
              </div>

              {/* Active alerts summary */}
              {alerts && alerts.filter((a) => a.status === "active").length > 0 && (
                <div className="rounded-xl border border-[#D94F4F]/20 bg-[#D94F4F]/5 p-4">
                  <h4 className="flex items-center gap-2 text-sm font-medium text-[#D94F4F]">
                    <AlertTriangle className="h-4 w-4" />
                    Alertas ativos
                  </h4>
                  <ul className="mt-2 space-y-1">
                    {alerts
                      .filter((a) => a.status === "active")
                      .map((a) => (
                        <li
                          key={a.id}
                          className="text-sm text-[#123A24]"
                        >
                          {a.message}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Mini map */}
            {shipment.latestPosition && (
              <div className="overflow-hidden rounded-xl border border-[#E6F4EA]">
                <Suspense fallback={<ChartSkeleton />}>
                  <ShipmentMap
                    shipments={[shipment]}
                    selectedShipmentId={shipment.id}
                    positions={positions ?? []}
                    showRoute
                    height="320px"
                  />
                </Suspense>
              </div>
            )}
          </div>
        )}

        {/* Temperature & Humidity */}
        {activeTab === "environment" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              {(["1h", "6h", "24h", "7d"] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    timeRange === range
                      ? "bg-[#1A7A44] text-white"
                      : "bg-white text-[#5B7264] border border-[#E6F4EA] hover:border-[#BFE3C8]"
                  )}
                >
                  {range}
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-[#E6F4EA] bg-white p-4 sm:p-6">
              <h3 className="mb-4 text-sm font-semibold text-[#123A24]">
                Temperatura
              </h3>
              <Suspense fallback={<ChartSkeleton />}>
                <TemperatureChart
                  readings={readings ?? []}
                  limits={limits}
                  timeRange={timeRange}
                  loading={readingsLoading}
                />
              </Suspense>
            </div>

            <div className="rounded-xl border border-[#E6F4EA] bg-white p-4 sm:p-6">
              <h3 className="mb-4 text-sm font-semibold text-[#123A24]">
                Umidade relativa
              </h3>
              <Suspense fallback={<ChartSkeleton />}>
                <HumidityChart
                  readings={readings ?? []}
                  limits={limits}
                  timeRange={timeRange}
                  loading={readingsLoading}
                />
              </Suspense>
            </div>
          </div>
        )}

        {/* Tracking */}
        {activeTab === "tracking" && (
          <div className="space-y-6">
            <div className="overflow-hidden rounded-xl border border-[#E6F4EA]">
              <Suspense fallback={<ChartSkeleton />}>
                <ShipmentMap
                  shipments={[shipment]}
                  selectedShipmentId={shipment.id}
                  positions={positions ?? []}
                  showRoute
                  height="500px"
                />
              </Suspense>
            </div>

            {positions && positions.length > 0 && (
              <div className="rounded-xl border border-[#E6F4EA] bg-white">
                <div className="border-b border-[#E6F4EA] px-4 py-3">
                  <h3 className="text-sm font-semibold text-[#123A24]">
                    Histórico de posições
                  </h3>
                </div>
                <div className="divide-y divide-[#E6F4EA]">
                  {positions.map((pos, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 px-4 py-2.5"
                    >
                      <MapPin className="h-4 w-4 shrink-0 text-[#BFE3C8]" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-[#123A24]">
                          {pos.latitude.toFixed(4)}, {pos.longitude.toFixed(4)}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-[#5B7264]">
                        {formatDateTime(pos.recordedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Alerts */}
        {activeTab === "alerts" && (
          <div className="space-y-4">
            {alertsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-lg bg-[#E6F4EA]"
                />
              ))
            ) : !alerts || alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#BFE3C8] py-16">
                <CheckCircle className="h-10 w-10 text-[#1F8A4D]" />
                <h3 className="mt-3 text-sm font-medium text-[#123A24]">
                  Nenhum alerta registrado
                </h3>
                <p className="mt-1 text-xs text-[#5B7264]">
                  Esta carga não possui alertas.
                </p>
              </div>
            ) : (
              alerts.map((alert) => (
                <AlertRow key={alert.id} alert={alert} />
              ))
            )}
          </div>
        )}

        {/* History */}
        {activeTab === "history" && (
          <div>
            {timelineEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#BFE3C8] py-16">
                <Clock className="h-10 w-10 text-[#BFE3C8]" />
                <h3 className="mt-3 text-sm font-medium text-[#123A24]">
                  Sem eventos registrados
                </h3>
              </div>
            ) : (
              <div className="rounded-xl border border-[#E6F4EA] bg-white p-6">
                <Timeline events={timelineEvents} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
