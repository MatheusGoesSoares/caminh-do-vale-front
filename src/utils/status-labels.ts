import type { LogisticsStatus, EnvironmentalStatus, AlertType } from '@/types';

export const logisticsStatusLabels: Record<LogisticsStatus, string> = {
  pending: 'Aguardando',
  loading: 'Carregando',
  in_transit: 'Em trânsito',
  stopped: 'Parado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

export const environmentalStatusLabels: Record<EnvironmentalStatus, string> = {
  optimal: 'Ideal',
  warning: 'Atenção',
  critical: 'Crítico',
  no_data: 'Sem dados',
  stale: 'Desatualizado',
};

export const environmentalBadgeVariant: Record<EnvironmentalStatus, string> = {
  optimal: 'success',
  warning: 'warning',
  critical: 'critical',
  no_data: 'neutral',
  stale: 'muted',
};

export const logisticsBadgeVariant: Record<LogisticsStatus, string> = {
  pending: 'neutral',
  loading: 'info',
  in_transit: 'info',
  stopped: 'warning',
  delivered: 'success',
  cancelled: 'muted',
};

export const alertTypeLabels: Record<AlertType, string> = {
  temperature_low: 'Temperatura baixa',
  temperature_high: 'Temperatura elevada',
  humidity_low: 'Umidade baixa',
  humidity_high: 'Umidade elevada',
  shock: 'Impacto',
  sensor_offline: 'Sensor offline',
  location_unavailable: 'Localização indisponível',
};
