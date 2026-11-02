import type {
  EnvironmentalLimits,
  EnvironmentalStatus,
  AlertType,
  AlertSeverity,
  MonitoringAlert,
} from '@/types';

export interface MonitoringConfig {
  warningMarginC: number;
  criticalMarginC: number;
  warningMarginHumidity: number;
  maxReadingAgeMs: number;
  hysteresisC: number;
  hysteresisHumidity: number;
}

export const DEFAULT_MONITORING_CONFIG: MonitoringConfig = {
  warningMarginC: 2,
  criticalMarginC: 0,
  warningMarginHumidity: 5,
  maxReadingAgeMs: 15 * 60 * 1000,
  hysteresisC: 0.5,
  hysteresisHumidity: 2,
};

interface ReadingInput {
  temperatureC: number | null;
  relativeHumidity: number | null;
  measuredAt: string;
}

export function isReadingStale(measuredAt: string, maxAgeMs: number): boolean {
  const age = Date.now() - new Date(measuredAt).getTime();
  return age > maxAgeMs;
}

export function evaluateTemperatureAlert(
  tempC: number | null,
  limits: EnvironmentalLimits,
  config: MonitoringConfig = DEFAULT_MONITORING_CONFIG,
): { type: AlertType; severity: AlertSeverity } | null {
  if (tempC === null) return null;

  if (tempC < limits.temperatureMinC - config.criticalMarginC) {
    return { type: 'temperature_low', severity: 'critical' };
  }
  if (tempC > limits.temperatureMaxC + config.criticalMarginC) {
    return { type: 'temperature_high', severity: 'critical' };
  }
  if (tempC < limits.temperatureMinC + config.warningMarginC) {
    return { type: 'temperature_low', severity: 'warning' };
  }
  if (tempC > limits.temperatureMaxC - config.warningMarginC) {
    return { type: 'temperature_high', severity: 'warning' };
  }

  return null;
}

export function evaluateHumidityAlert(
  humidity: number | null,
  limits: EnvironmentalLimits,
  config: MonitoringConfig = DEFAULT_MONITORING_CONFIG,
): { type: AlertType; severity: AlertSeverity } | null {
  if (humidity === null) return null;

  if (humidity < limits.relativeHumidityMin) {
    return { type: 'humidity_low', severity: 'critical' };
  }
  if (humidity > limits.relativeHumidityMax) {
    return { type: 'humidity_high', severity: 'critical' };
  }
  if (humidity < limits.relativeHumidityMin + config.warningMarginHumidity) {
    return { type: 'humidity_low', severity: 'warning' };
  }
  if (humidity > limits.relativeHumidityMax - config.warningMarginHumidity) {
    return { type: 'humidity_high', severity: 'warning' };
  }

  return null;
}

export function evaluateEnvironmentalStatus(
  reading: ReadingInput,
  limits: EnvironmentalLimits,
  config: MonitoringConfig = DEFAULT_MONITORING_CONFIG,
): EnvironmentalStatus {
  if (reading.temperatureC === null && reading.relativeHumidity === null) {
    return 'no_data';
  }

  if (isReadingStale(reading.measuredAt, config.maxReadingAgeMs)) {
    return 'stale';
  }

  const tempAlert = evaluateTemperatureAlert(
    reading.temperatureC,
    limits,
    config,
  );
  const humidityAlert = evaluateHumidityAlert(
    reading.relativeHumidity,
    limits,
    config,
  );

  if (
    tempAlert?.severity === 'critical' ||
    humidityAlert?.severity === 'critical'
  ) {
    return 'critical';
  }

  if (
    tempAlert?.severity === 'warning' ||
    humidityAlert?.severity === 'warning'
  ) {
    return 'warning';
  }

  return 'optimal';
}

export function calculateViolationDuration(
  alerts: Pick<MonitoringAlert, 'startedAt' | 'resolvedAt'>[],
): number {
  return alerts.reduce((total, alert) => {
    const start = new Date(alert.startedAt).getTime();
    const end = alert.resolvedAt
      ? new Date(alert.resolvedAt).getTime()
      : Date.now();
    return total + (end - start);
  }, 0);
}

export function formatDuration(ms: number): string {
  if (ms < 60_000) return 'menos de 1 min';
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}
