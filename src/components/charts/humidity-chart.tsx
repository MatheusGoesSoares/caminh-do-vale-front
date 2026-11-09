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

interface HumidityChartProps {
  readings: SensorReading[];
  limits: EnvironmentalLimits;
  timeRange: TimeRange;
  shipmentLabel?: string;
  loading?: boolean;
}

interface ChartDataPoint {
  time: number;
  humidity: number | null;
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
  if (point.humidity === null) return null;

  const dateStr = format(new Date(point.time), "dd/MM/yyyy HH:mm", {
    locale: ptBR,
  });
  const inRange =
    point.humidity >= limits.relativeHumidityMin &&
    point.humidity <= limits.relativeHumidityMax;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-md">
      <p className="mb-1 text-xs text-[#5B7264]">{dateStr}</p>
      <p className="text-sm font-semibold text-[#123A24]">
        {point.humidity.toFixed(1)}%
      </p>
      <p
        className={`mt-1 text-xs font-medium ${inRange ? "text-[#1F8A4D]" : "text-[#D94F4F]"}`}
      >
        {inRange ? "Dentro dos limites" : "Fora dos limites"}
      </p>
    </div>
  );
}

export function HumidityChart({
  readings,
  limits,
  shipmentLabel,
  loading,
  timeRange,
}: HumidityChartProps) {
  const data = useMemo<ChartDataPoint[]>(() => {
    return readings
      .filter((r) => r.relativeHumidity !== null)
      .map((r) => ({
        time: new Date(r.measuredAt).getTime(),
        humidity: r.relativeHumidity,
        outsideLimits:
          r.relativeHumidity !== null &&
          (r.relativeHumidity < limits.relativeHumidityMin ||
            r.relativeHumidity > limits.relativeHumidityMax),
      }))
      .sort((a, b) => a.time - b.time);
  }, [readings, limits]);

  const idealHumidity =
    (limits.relativeHumidityMin + limits.relativeHumidityMax) / 2;

  const yDomain = useMemo(() => {
    if (data.length === 0)
      return [
        Math.max(0, limits.relativeHumidityMin - 15),
        Math.min(100, limits.relativeHumidityMax + 10),
      ];
    const values = data
      .map((d) => d.humidity)
      .filter((h): h is number => h !== null);
    const min = Math.min(...values, limits.relativeHumidityMin);
    const max = Math.max(...values, limits.relativeHumidityMax);
    const padding = Math.max((max - min) * 0.15, 5);
    return [
      Math.max(0, Math.floor(min - padding)),
      Math.min(100, Math.ceil(max + padding)),
    ];
  }, [data, limits]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#BFE3C8] border-t-[#427DA5]" />
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
        <p className="text-sm">Sem dados de umidade disponíveis</p>
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
            tickFormatter={(v: number) => `${v}%`}
            width={44}
          />
          <Tooltip
            content={<CustomTooltip limits={limits} />}
            cursor={{ stroke: "#BFE3C8", strokeDasharray: "4 4" }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "#5B7264" }}
            formatter={() => "Umidade Relativa (%)"}
          />
          <ReferenceArea
            y1={limits.relativeHumidityMin}
            y2={limits.relativeHumidityMax}
            fill="#dbeafe"
            fillOpacity={0.35}
            strokeDasharray="4 4"
            stroke="#93c5fd"
            strokeOpacity={0.5}
          />
          <ReferenceLine
            y={idealHumidity}
            stroke="#427DA5"
            strokeDasharray="6 4"
            strokeOpacity={0.5}
            label={{
              value: `Ideal: ${idealHumidity.toFixed(0)}%`,
              position: "insideTopRight",
              fill: "#427DA5",
              fontSize: 10,
            }}
          />
          <Line
            type="monotone"
            dataKey="humidity"
            stroke="#427DA5"
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
              fill: "#427DA5",
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
