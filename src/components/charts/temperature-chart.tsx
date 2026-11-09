import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import type { SensorReading, EnvironmentalLimits, TimeRange } from "@/types";

interface TemperatureChartProps {
  readings: SensorReading[];
  limits: EnvironmentalLimits;
  timeRange: TimeRange;
  shipmentLabel?: string;
  loading?: boolean;
}

interface ChartDataPoint {
  time: number;
  temperature: number | null;
  outsideLimits: boolean;
}

function formatTimeAxis(timestamp: number, timeRange: TimeRange): string {
  const pattern = timeRange === "5m" || timeRange === "30m" ? "HH:mm:ss" : "HH:mm";
  return format(new Date(timestamp), pattern, { locale: ptBR });
}

function CustomTooltip({
  active,
  payload,
  limits,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartDataPoint }>;
  label?: number;
  limits: EnvironmentalLimits;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  if (point.temperature === null) return null;

  const dateStr = format(new Date(point.time), "dd/MM/yyyy HH:mm", {
    locale: ptBR,
  });
  const inRange =
    point.temperature >= limits.temperatureMinC &&
    point.temperature <= limits.temperatureMaxC;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-md">
      <p className="mb-1 text-xs text-[#5B7264]">{dateStr}</p>
      <p className="text-sm font-semibold text-[#123A24]">
        {point.temperature.toFixed(1)} °C
      </p>
      <p
        className={`mt-1 text-xs font-medium ${inRange ? "text-[#1F8A4D]" : "text-[#D94F4F]"}`}
      >
        {inRange ? "Dentro dos limites" : "Fora dos limites"}
      </p>
    </div>
  );
}

export function TemperatureChart({
  readings,
  limits,
  shipmentLabel,
  loading,
  timeRange,
}: TemperatureChartProps) {
  const data = useMemo<ChartDataPoint[]>(() => {
    return readings
      .filter((r) => r.temperatureC !== null)
      .map((r) => ({
        time: new Date(r.measuredAt).getTime(),
        temperature: r.temperatureC,
        outsideLimits:
          r.temperatureC !== null &&
          (r.temperatureC < limits.temperatureMinC ||
            r.temperatureC > limits.temperatureMaxC),
      }))
      .sort((a, b) => a.time - b.time);
  }, [readings, limits]);

  const idealTemp = (limits.temperatureMinC + limits.temperatureMaxC) / 2;

  const yDomain = useMemo(() => {
    if (data.length === 0)
      return [limits.temperatureMinC - 5, limits.temperatureMaxC + 5];
    const temps = data
      .map((d) => d.temperature)
      .filter((t): t is number => t !== null);
    const min = Math.min(...temps, limits.temperatureMinC);
    const max = Math.max(...temps, limits.temperatureMaxC);
    const padding = Math.max((max - min) * 0.15, 2);
    return [Math.floor(min - padding), Math.ceil(max + padding)];
  }, [data, limits]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#BFE3C8] border-t-[#1A7A44]" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-lg bg-white text-[#5B7264]">
        <svg
          className="mb-2 h-10 w-10 opacity-40"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
        <p className="text-sm">Sem dados de temperatura disponíveis</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {shipmentLabel && (
        <p className="mb-2 text-xs font-medium text-[#5B7264]">
          {shipmentLabel}
        </p>
      )}
      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={data}
          margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E6F4EA" />
          <XAxis
            dataKey="time"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(v) => formatTimeAxis(v, timeRange)}
            stroke="#5B7264"
            fontSize={11}
            tickLine={false}
          />
          <YAxis
            domain={yDomain}
            stroke="#5B7264"
            fontSize={11}
            tickLine={false}
            tickFormatter={(v: number) => `${v}°`}
            width={40}
          />
          <Tooltip
            content={<CustomTooltip limits={limits} />}
            cursor={{ stroke: "#BFE3C8", strokeDasharray: "4 4" }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "#5B7264" }}
            formatter={() => "Temperatura (°C)"}
          />
          <ReferenceArea
            y1={limits.temperatureMinC}
            y2={limits.temperatureMaxC}
            fill="#E6F4EA"
            fillOpacity={0.6}
            strokeDasharray="4 4"
            stroke="#BFE3C8"
            strokeOpacity={0.5}
          />
          <ReferenceLine
            y={idealTemp}
            stroke="#1A7A44"
            strokeDasharray="6 4"
            strokeOpacity={0.5}
            label={{
              value: `Ideal: ${idealTemp.toFixed(1)}°C`,
              position: "insideTopRight",
              fill: "#1A7A44",
              fontSize: 10,
            }}
          />
          <Line
            type="monotone"
            dataKey="temperature"
            stroke="#1A7A44"
            strokeWidth={2}
            dot={(props: Record<string, unknown>) => {
              const { cx, cy, payload } = props as {
                cx: number;
                cy: number;
                payload: ChartDataPoint;
              };
              if (!payload.outsideLimits) return <circle key={`dot-${cx}`} r={0} />;
              return (
                <circle
                  key={`dot-alert-${cx}`}
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill="#D94F4F"
                  stroke="#fff"
                  strokeWidth={1.5}
                />
              );
            }}
            activeDot={{
              r: 5,
              fill: "#1A7A44",
              stroke: "#fff",
              strokeWidth: 2,
            }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
