import { useState, useMemo } from "react";
import {
  Activity,
  Bell,
  AlertTriangle,
  ThermometerSun,
  Droplets,
  WifiOff,
  MapPin,
  CheckCircle,
  Clock,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, Badge, Button, Input, Select, Skeleton, EmptyState, Tabs } from "@/components/ui";
import { useAlerts, useAcknowledgeAlert, useShipments } from "@/hooks/use-data-service";
import { formatAlertType, formatRelativeTime, formatDateTime } from "@/utils/format";
import type { MonitoringAlert, AlertType } from "@/types";

function getAlertIcon(type: AlertType) {
  switch (type) {
    case "temperature_low":
    case "temperature_high":
      return ThermometerSun;
    case "humidity_low":
    case "humidity_high":
      return Droplets;
    case "shock":
      return Activity;
    case "sensor_offline":
      return WifiOff;
    case "location_unavailable":
      return MapPin;
  }
}

function getAlertDuration(alert: MonitoringAlert): string {
  const start = new Date(alert.startedAt).getTime();
  const end = alert.resolvedAt ? new Date(alert.resolvedAt).getTime() : Date.now();
  const diffMs = end - start;

  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}min`;
  return `${minutes}min`;
}

function AlertCard({
  alert,
  shipmentName,
  onAcknowledge,
  isAcknowledging,
}: {
  alert: MonitoringAlert;
  shipmentName?: string;
  onAcknowledge: (id: string) => void;
  isAcknowledging: boolean;
}) {
  const Icon = getAlertIcon(alert.type);
  const isCritical = alert.severity === "critical";
  const isActive = alert.status === "active";

  return (
    <Card
      className={cn(
        "border-l-4 transition-shadow",
        isCritical ? "border-l-[#D94F4F]" : "border-l-[#E08A2E]",
        isActive && "hover:shadow-md"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
            isCritical ? "bg-[#D94F4F]/10" : "bg-[#E08A2E]/10"
          )}
        >
          <Icon
            className={cn("h-4.5 w-4.5", isCritical ? "text-[#D94F4F]" : "text-[#E08A2E]")}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={isCritical ? "critical" : "warning"}>
                  {isCritical ? "Crítico" : "Atenção"}
                </Badge>
                <Badge variant="neutral">{formatAlertType(alert.type)}</Badge>
                {!isActive && (
                  <Badge variant="success">Resolvido</Badge>
                )}
              </div>
              <p className="text-sm font-medium text-[#123A24] mt-1.5">{alert.message}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-[#5B7264]">
                <span>Carga: {alert.shipmentId}</span>
                {shipmentName && <span>{shipmentName}</span>}
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Início: {formatRelativeTime(alert.startedAt)}
                </span>
                <span>Duração: {getAlertDuration(alert)}</span>
              </div>
            </div>
          </div>

          {alert.resolvedAt && (
            <p className="text-xs text-[#1F8A4D] mt-2 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Resolvido: {formatDateTime(alert.resolvedAt)}
            </p>
          )}

          {alert.acknowledgedAt && (
            <p className="text-xs text-[#5B7264] mt-1 flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Reconhecido: {formatDateTime(alert.acknowledgedAt)}
            </p>
          )}

          {isActive && !alert.acknowledgedAt && (
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => onAcknowledge(alert.id)}
              disabled={isAcknowledging}
            >
              <Shield className="h-3.5 w-3.5" />
              Reconhecer
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function SummaryBar({
  criticalCount,
  warningCount,
  totalCount,
}: {
  criticalCount: number;
  warningCount: number;
  totalCount: number;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <div className="flex items-center gap-2 rounded-lg bg-[#D94F4F]/10 px-3 py-1.5">
        <AlertTriangle className="h-4 w-4 text-[#D94F4F]" />
        <span className="text-sm font-semibold text-[#D94F4F]">{criticalCount}</span>
        <span className="text-xs text-[#D94F4F]/80">crítico{criticalCount !== 1 ? "s" : ""}</span>
      </div>
      <div className="flex items-center gap-2 rounded-lg bg-[#E08A2E]/10 px-3 py-1.5">
        <AlertTriangle className="h-4 w-4 text-[#E08A2E]" />
        <span className="text-sm font-semibold text-[#E08A2E]">{warningCount}</span>
        <span className="text-xs text-[#E08A2E]/80">atenção</span>
      </div>
      <div className="flex items-center gap-2 rounded-lg bg-[#E6F4EA] px-3 py-1.5">
        <Bell className="h-4 w-4 text-[#5B7264]" />
        <span className="text-sm font-semibold text-[#123A24]">{totalCount}</span>
        <span className="text-xs text-[#5B7264]">total</span>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-[#E6F4EA] bg-white p-5">
          <div className="flex items-start gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AlertsPage() {
  const [activeTab, setActiveTab] = useState("active");
  const [severityFilter, setSeverityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");

  const { data: alerts, isLoading: alertsLoading } = useAlerts();
  const { data: shipments } = useShipments();
  const acknowledgeMutation = useAcknowledgeAlert();

  const shipmentNameMap = useMemo(() => {
    if (!shipments) return new Map<string, string>();
    return new Map(shipments.map((s) => [s.id, s.fruitName]));
  }, [shipments]);

  const filteredAlerts = useMemo(() => {
    if (!alerts) return [];

    return alerts.filter((a) => {
      if (activeTab === "active" && a.status !== "active") return false;
      if (activeTab === "resolved" && a.status !== "resolved") return false;
      if (severityFilter && a.severity !== severityFilter) return false;
      if (typeFilter && a.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !a.shipmentId.toLowerCase().includes(q) &&
          !a.message.toLowerCase().includes(q) &&
          !(shipmentNameMap.get(a.shipmentId)?.toLowerCase().includes(q))
        ) {
          return false;
        }
      }
      return true;
    });
  }, [alerts, activeTab, severityFilter, typeFilter, search, shipmentNameMap]);

  const activeAlerts = useMemo(() => alerts?.filter((a) => a.status === "active") ?? [], [alerts]);
  const criticalCount = activeAlerts.filter((a) => a.severity === "critical").length;
  const warningCount = activeAlerts.filter((a) => a.severity === "warning").length;

  const tabs = [
    { id: "active", label: `Ativos (${activeAlerts.length})` },
    { id: "resolved", label: "Resolvidos" },
    { id: "all", label: "Todos" },
  ];

  const severityOptions = [
    { value: "", label: "Todas as severidades" },
    { value: "critical", label: "Crítico" },
    { value: "warning", label: "Atenção" },
  ];

  const typeOptions = [
    { value: "", label: "Todos os tipos" },
    { value: "temperature_high", label: "Temperatura alta" },
    { value: "temperature_low", label: "Temperatura baixa" },
    { value: "humidity_high", label: "Umidade alta" },
    { value: "humidity_low", label: "Umidade baixa" },
    { value: "shock", label: "Impacto" },
    { value: "sensor_offline", label: "Sensor offline" },
    { value: "location_unavailable", label: "Localização indisponível" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-[#123A24]">Central de Alertas</h1>
          {activeAlerts.length > 0 && (
            <Badge variant="critical">{activeAlerts.length} ativo{activeAlerts.length !== 1 ? "s" : ""}</Badge>
          )}
        </div>
        <p className="text-sm text-[#5B7264] mt-1">
          Gerencie e acompanhe os alertas de monitoramento
        </p>
      </div>

      <SummaryBar
        criticalCount={criticalCount}
        warningCount={warningCount}
        totalCount={alerts?.length ?? 0}
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 max-w-xs">
          <Input
            search
            placeholder="Buscar por carga ou mensagem..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            options={severityOptions}
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-52">
          <Select
            options={typeOptions}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Alert list */}
      {alertsLoading ? (
        <LoadingSkeleton />
      ) : filteredAlerts.length === 0 ? (
        <EmptyState
          icon={activeTab === "active" ? CheckCircle : Bell}
          title={
            activeTab === "active"
              ? "Nenhum alerta ativo"
              : "Nenhum alerta encontrado"
          }
          description={
            activeTab === "active"
              ? "Todas as cargas estão dentro dos parâmetros normais."
              : "Nenhum alerta corresponde aos filtros selecionados."
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              shipmentName={shipmentNameMap.get(alert.shipmentId)}
              onAcknowledge={(id) => acknowledgeMutation.mutate(id)}
              isAcknowledging={acknowledgeMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
