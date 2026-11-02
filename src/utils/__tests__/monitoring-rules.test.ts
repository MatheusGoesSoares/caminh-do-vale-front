import { describe, it, expect } from 'vitest';
import {
  evaluateEnvironmentalStatus,
  evaluateTemperatureAlert,
  evaluateHumidityAlert,
  isReadingStale,
  calculateViolationDuration,
  formatDuration,
  DEFAULT_MONITORING_CONFIG,
} from '@/utils/monitoring-rules';
import type { EnvironmentalLimits } from '@/types';

interface ReadingInput {
  temperatureC: number | null;
  relativeHumidity: number | null;
  measuredAt: string;
}

function makeReading(overrides: Partial<ReadingInput> = {}): ReadingInput {
  return {
    temperatureC: 5,
    relativeHumidity: 92,
    measuredAt: new Date().toISOString(),
    ...overrides,
  };
}

const uvaLimits: EnvironmentalLimits = {
  temperatureMinC: -1,
  temperatureMaxC: 0,
  relativeHumidityMin: 90,
  relativeHumidityMax: 95,
};

const mangaLimits: EnvironmentalLimits = {
  temperatureMinC: 13,
  temperatureMaxC: 13,
  relativeHumidityMin: 90,
  relativeHumidityMax: 95,
};

const goiabaLimits: EnvironmentalLimits = {
  temperatureMinC: 8,
  temperatureMaxC: 10,
  relativeHumidityMin: 90,
  relativeHumidityMax: 95,
};

const bananaLimits: EnvironmentalLimits = {
  temperatureMinC: 13,
  temperatureMaxC: 14,
  relativeHumidityMin: 90,
  relativeHumidityMax: 95,
};

describe('evaluateEnvironmentalStatus', () => {
  it('should return "no_data" when temperature and humidity are null', () => {
    const reading = makeReading({ temperatureC: null, relativeHumidity: null });
    expect(evaluateEnvironmentalStatus(reading, uvaLimits)).toBe('no_data');
  });

  it('should return "stale" when reading is older than maxReadingAgeMs', () => {
    const old = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    const reading = makeReading({ temperatureC: -0.5, relativeHumidity: 92, measuredAt: old });
    expect(evaluateEnvironmentalStatus(reading, uvaLimits)).toBe('stale');
  });

  it('should return "optimal" when all values are within limits (wide range)', () => {
    const wideLimits: EnvironmentalLimits = {
      temperatureMinC: 2,
      temperatureMaxC: 12,
      relativeHumidityMin: 85,
      relativeHumidityMax: 95,
    };
    const reading = makeReading({ temperatureC: 7, relativeHumidity: 90 });
    expect(evaluateEnvironmentalStatus(reading, wideLimits)).toBe('optimal');
  });

  it('should return "warning" for narrow-range fruits even when within limits', () => {
    const reading = makeReading({ temperatureC: -0.5, relativeHumidity: 92 });
    expect(evaluateEnvironmentalStatus(reading, uvaLimits)).toBe('warning');
  });

  it('should return "warning" for banana at 13.5°C due to narrow range + 2°C margin', () => {
    const reading = makeReading({ temperatureC: 13.5, relativeHumidity: 92 });
    expect(evaluateEnvironmentalStatus(reading, bananaLimits)).toBe('warning');
  });

  it('should return "warning" when temperature is within warning margin of lower limit', () => {
    // Goiaba limits: 8–10°C, warning margin 2°C → warning zone: 8..10 (min+margin)
    const reading = makeReading({ temperatureC: 9, relativeHumidity: 92 });
    expect(evaluateEnvironmentalStatus(reading, goiabaLimits)).toBe('warning');
  });

  it('should return "warning" when temperature is within warning margin of upper limit', () => {
    // Use wider limits for a cleaner test of the warning zone
    const wideLimits: EnvironmentalLimits = {
      temperatureMinC: 5,
      temperatureMaxC: 15,
      relativeHumidityMin: 85,
      relativeHumidityMax: 95,
    };
    // temp 14 → within upper warning zone (15 - 2 = 13, so 14 > 13 triggers warning)
    const r = makeReading({ temperatureC: 14, relativeHumidity: 90 });
    expect(evaluateEnvironmentalStatus(r, wideLimits)).toBe('warning');
  });

  it('should return "critical" when temperature exceeds limits', () => {
    // Manga at 18°C (limit is 13°C)
    const reading = makeReading({ temperatureC: 18, relativeHumidity: 92 });
    expect(evaluateEnvironmentalStatus(reading, mangaLimits)).toBe('critical');
  });

  it('should return "critical" when humidity exceeds limits', () => {
    const reading = makeReading({ temperatureC: -0.5, relativeHumidity: 98 });
    expect(evaluateEnvironmentalStatus(reading, uvaLimits)).toBe('critical');
  });

  it('should return "warning" when humidity is within warning margin', () => {
    // Uva humidity 90–95, warning margin 5% → warning zone: 90..95 (entire range triggers warning for low side)
    // Use wider limits
    const wideLimits: EnvironmentalLimits = {
      temperatureMinC: 5,
      temperatureMaxC: 15,
      relativeHumidityMin: 70,
      relativeHumidityMax: 95,
    };
    // humidity 73 → within warning zone (70 + 5 = 75, so 73 > 70 but < 75 → warning)
    const reading = makeReading({ temperatureC: 10, relativeHumidity: 73 });
    expect(evaluateEnvironmentalStatus(reading, wideLimits)).toBe('warning');
  });

  it('should prioritize "critical" over "warning"', () => {
    // Temperature critical + humidity warning
    const reading = makeReading({ temperatureC: 25, relativeHumidity: 91 });
    expect(evaluateEnvironmentalStatus(reading, mangaLimits)).toBe('critical');
  });

  it('should prioritize "stale" over environmental checks', () => {
    const old = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    const reading = makeReading({ temperatureC: 25, relativeHumidity: 50, measuredAt: old });
    expect(evaluateEnvironmentalStatus(reading, mangaLimits)).toBe('stale');
  });
});

describe('evaluateTemperatureAlert', () => {
  it('should return null when temperature is null', () => {
    expect(evaluateTemperatureAlert(null, uvaLimits)).toBeNull();
  });

  it('should return null when temperature is well within limits', () => {
    // Goiaba 8–10°C, value 9°C but with 2°C margin the entire range is warning zone
    // Use wide limits for a clean "within" test
    const wideLimits: EnvironmentalLimits = {
      temperatureMinC: 0,
      temperatureMaxC: 20,
      relativeHumidityMin: 80,
      relativeHumidityMax: 95,
    };
    expect(evaluateTemperatureAlert(10, wideLimits)).toBeNull();
  });

  it('should return temperature_low warning when near lower limit', () => {
    // Wide limits 0–20°C, warning margin 2°C → warning zone below: 0..2
    const wideLimits: EnvironmentalLimits = {
      temperatureMinC: 0,
      temperatureMaxC: 20,
      relativeHumidityMin: 80,
      relativeHumidityMax: 95,
    };
    const result = evaluateTemperatureAlert(1, wideLimits);
    expect(result).toEqual({ type: 'temperature_low', severity: 'warning' });
  });

  it('should return temperature_high warning when near upper limit', () => {
    const wideLimits: EnvironmentalLimits = {
      temperatureMinC: 0,
      temperatureMaxC: 20,
      relativeHumidityMin: 80,
      relativeHumidityMax: 95,
    };
    // 19°C → within upper warning zone (20 - 2 = 18, so 19 > 18)
    const result = evaluateTemperatureAlert(19, wideLimits);
    expect(result).toEqual({ type: 'temperature_high', severity: 'warning' });
  });

  it('should return temperature_low critical when below limits', () => {
    // Uva -1..0°C, temp -3 → below min
    const result = evaluateTemperatureAlert(-3, uvaLimits);
    expect(result).toEqual({ type: 'temperature_low', severity: 'critical' });
  });

  it('should return temperature_high critical when above limits', () => {
    // Manga 13..13°C, temp 18 → above max
    const result = evaluateTemperatureAlert(18, mangaLimits);
    expect(result).toEqual({ type: 'temperature_high', severity: 'critical' });
  });

  it('should handle single-value temperature range (min === max)', () => {
    // Manga: 13–13°C. With warningMargin=2, min+margin=15 and max-margin=11
    // Any value triggers either low or high warning since the range is a point
    // 13°C: check min+margin=15 → 13 < 15 → temperature_low warning
    const result = evaluateTemperatureAlert(13, mangaLimits);
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('warning');
  });

  it('should respect custom config margins', () => {
    const tightConfig = { ...DEFAULT_MONITORING_CONFIG, warningMarginC: 0.5 };
    // Goiaba 8–10°C with 0.5 margin → 9°C is safely in range
    const result = evaluateTemperatureAlert(9, goiabaLimits, tightConfig);
    expect(result).toBeNull();
  });
});

describe('evaluateHumidityAlert', () => {
  it('should return null when humidity is null', () => {
    expect(evaluateHumidityAlert(null, uvaLimits)).toBeNull();
  });

  it('should return null when humidity is within limits', () => {
    const wideLimits: EnvironmentalLimits = {
      temperatureMinC: 0,
      temperatureMaxC: 20,
      relativeHumidityMin: 70,
      relativeHumidityMax: 95,
    };
    // 82% → well within 70+5=75..95-5=90
    expect(evaluateHumidityAlert(82, wideLimits)).toBeNull();
  });

  it('should return humidity_low critical when below minimum', () => {
    // Uva min 90%, value 78%
    const result = evaluateHumidityAlert(78, uvaLimits);
    expect(result).toEqual({ type: 'humidity_low', severity: 'critical' });
  });

  it('should return humidity_high critical when above maximum', () => {
    // Uva max 95%, value 98%
    const result = evaluateHumidityAlert(98, uvaLimits);
    expect(result).toEqual({ type: 'humidity_high', severity: 'critical' });
  });

  it('should return humidity_low warning when within warning margin of minimum', () => {
    const wideLimits: EnvironmentalLimits = {
      temperatureMinC: 0,
      temperatureMaxC: 20,
      relativeHumidityMin: 70,
      relativeHumidityMax: 95,
    };
    // 73% → above min (70) but within min+5=75 → warning
    const result = evaluateHumidityAlert(73, wideLimits);
    expect(result).toEqual({ type: 'humidity_low', severity: 'warning' });
  });

  it('should return humidity_high warning when within warning margin of maximum', () => {
    const wideLimits: EnvironmentalLimits = {
      temperatureMinC: 0,
      temperatureMaxC: 20,
      relativeHumidityMin: 70,
      relativeHumidityMax: 100,
    };
    // 97% → below max (100) but within max-5=95 → warning
    const result = evaluateHumidityAlert(97, wideLimits);
    expect(result).toEqual({ type: 'humidity_high', severity: 'warning' });
  });
});

describe('isReadingStale', () => {
  it('should return false for recent readings', () => {
    const recent = new Date().toISOString();
    expect(isReadingStale(recent, 15 * 60 * 1000)).toBe(false);
  });

  it('should return true for old readings', () => {
    const old = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    expect(isReadingStale(old, 15 * 60 * 1000)).toBe(true);
  });

  it('should handle custom maxAgeMs', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(isReadingStale(fiveMinAgo, 3 * 60 * 1000)).toBe(true);
    expect(isReadingStale(fiveMinAgo, 10 * 60 * 1000)).toBe(false);
  });

  it('should return false for readings exactly at the boundary', () => {
    const now = new Date();
    const atBoundary = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
    // At exactly the boundary, age === maxAge, not strictly greater
    expect(isReadingStale(atBoundary, 15 * 60 * 1000)).toBe(false);
  });
});

describe('calculateViolationDuration', () => {
  it('should return 0 for empty array', () => {
    expect(calculateViolationDuration([])).toBe(0);
  });

  it('should calculate duration for resolved alerts', () => {
    const start = new Date('2024-01-01T10:00:00Z');
    const end = new Date('2024-01-01T11:30:00Z');
    const alerts = [{ startedAt: start.toISOString(), resolvedAt: end.toISOString() }];
    expect(calculateViolationDuration(alerts)).toBe(90 * 60 * 1000);
  });

  it('should calculate duration for active (unresolved) alerts up to now', () => {
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
    const alerts = [{ startedAt: thirtyMinAgo.toISOString(), resolvedAt: undefined }];
    const duration = calculateViolationDuration(alerts);
    expect(duration).toBeGreaterThanOrEqual(29 * 60 * 1000);
    expect(duration).toBeLessThanOrEqual(31 * 60 * 1000);
  });

  it('should sum durations across multiple alerts', () => {
    const alerts = [
      { startedAt: '2024-01-01T10:00:00Z', resolvedAt: '2024-01-01T11:00:00Z' },
      { startedAt: '2024-01-01T14:00:00Z', resolvedAt: '2024-01-01T14:30:00Z' },
    ];
    expect(calculateViolationDuration(alerts)).toBe(90 * 60 * 1000);
  });
});

describe('formatDuration', () => {
  it('should format sub-minute durations', () => {
    expect(formatDuration(30_000)).toBe('menos de 1 min');
  });

  it('should format minutes', () => {
    expect(formatDuration(5 * 60_000)).toBe('5 min');
  });

  it('should format hours and minutes', () => {
    expect(formatDuration(90 * 60_000)).toBe('1h 30min');
  });

  it('should format exact hours', () => {
    expect(formatDuration(2 * 60 * 60_000)).toBe('2h');
  });

  it('should format days and hours', () => {
    expect(formatDuration(25 * 60 * 60_000)).toBe('1d 1h');
  });

  it('should format exact days', () => {
    expect(formatDuration(48 * 60 * 60_000)).toBe('2d');
  });
});
