import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import type {
  LogisticsStatus,
  EnvironmentalStatus,
  AlertType,
} from "@/types";

const logisticsLabels: Record<LogisticsStatus, string> = {
  pending: "Aguardando",
  loading: "Carregando",
  in_transit: "Em trânsito",
  stopped: "Parado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const environmentalLabels: Record<EnvironmentalStatus, string> = {
  optimal: "Ideal",
  warning: "Atenção",
  critical: "Crítico",
  no_data: "Sem dados",
  stale: "Desatualizado",
};

const alertTypeLabels: Record<AlertType, string> = {
  temperature_low: "Temperatura baixa",
  temperature_high: "Temperatura alta",
  humidity_low: "Umidade baixa",
  humidity_high: "Umidade alta",
  shock: "Impacto",
  sensor_offline: "Sensor offline",
  location_unavailable: "Localização indisponível",
};

export function formatLogisticsStatus(status: LogisticsStatus): string {
  return logisticsLabels[status] ?? status;
}

export function formatEnvironmentalStatus(status: EnvironmentalStatus): string {
  return environmentalLabels[status] ?? status;
}

export function getEnvironmentalBadgeVariant(
  status: EnvironmentalStatus
): string {
  const map: Record<EnvironmentalStatus, string> = {
    optimal: "success",
    warning: "warning",
    critical: "critical",
    no_data: "muted",
    stale: "neutral",
  };
  return map[status] ?? "neutral";
}

export function getLogisticsBadgeVariant(status: LogisticsStatus): string {
  const map: Record<LogisticsStatus, string> = {
    pending: "neutral",
    loading: "info",
    in_transit: "info",
    stopped: "warning",
    delivered: "success",
    cancelled: "muted",
  };
  return map[status] ?? "neutral";
}

export function formatTemperature(tempC: number | null): string {
  if (tempC === null || tempC === undefined) return "—";
  return `${tempC.toFixed(1)}°C`;
}

export function formatHumidity(humidity: number | null): string {
  if (humidity === null || humidity === undefined) return "—";
  return `${humidity.toFixed(0)}%`;
}

export function formatRelativeTime(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return "—";
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  } catch {
    return "—";
  }
}

export function formatDateTime(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return "—";
    return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
  } catch {
    return "—";
  }
}

export function formatAlertType(type: AlertType): string {
  return alertTypeLabels[type] ?? type;
}
