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
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import type { SensorReading, EnvironmentalLimits, TimeRange } from "@/types";

interface CombinedChartProps {
  readings: SensorReading[];
  limits: EnvironmentalLimits;
  timeRange: TimeRange;
  loading?: boolean;
}

interface ChartDataPoint {
  time: number;
  temperature: number | null;
  humidity: number | null;
}

function formatTimeAxis(timestamp: number, _timeRange: TimeRange): string {
  return format(new Date(timestamp), "HH:mm", { locale: ptBR });
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload: ChartDataPoint;
    dataKey: string;
    color: string;
  }>;
  label?: number;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  const dateStr = format(new Date(point.time), "dd/MM/yyyy HH:mm", {
    locale: ptBR,
  });

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-md">
      <p className="mb-2 text-xs text-[#5B7264]">{dateStr}</p>
      {point.temperature !== null && (
        <p className="text-sm text-[#1A7A44]">
          <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#1A7A44]" />
          Temperatura: {point.temperature.toFixed(1)} °C
        </p>
      )}
      {point.humidity !== null && (
        <p className="mt-1 text-sm text-[#427DA5]">
          <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#427DA5]" />
          Umidade: {point.humidity.toFixed(1)}%
        </p>
      )}
    </div>
  );
}

export function CombinedChart({
  readings,
  limits,
  loading,
  timeRange,
}: CombinedChartProps) {
  const data = useMemo<ChartDataPoint[]>(() => {
    return readings
      .map((r) => ({
        time: new Date(r.measuredAt).getTime(),
        temperature: r.temperatureC,
        humidity: r.relativeHumidity,
      }))
      .sort((a, b) => a.time - b.time);
  }, [readings]);

  const tempDomain = useMemo(() => {
    const temps = data
      .map((d) => d.temperature)
      .filter((t): t is number => t !== null);
    if (temps.length === 0)
      return [limits.temperatureMinC - 5, limits.temperatureMaxC + 5];
    const min = Math.min(...temps, limits.temperatureMinC);
    const max = Math.max(...temps, limits.temperatureMaxC);
    const pad = Math.max((max - min) * 0.15, 2);
    return [Math.floor(min - pad), Math.ceil(max + pad)];
  }, [data, limits]);

  const humDomain = useMemo(() => {
    const hums = data
      .map((d) => d.humidity)
      .filter((h): h is number => h !== null);
    if (hums.length === 0)
      return [
        Math.max(0, limits.relativeHumidityMin - 15),
        Math.min(100, limits.relativeHumidityMax + 10),
      ];
    const min = Math.min(...hums, limits.relativeHumidityMin);
    const max = Math.max(...hums, limits.relativeHumidityMax);
    const pad = Math.max((max - min) * 0.15, 5);
    return [
      Math.max(0, Math.floor(min - pad)),
      Math.min(100, Math.ceil(max + pad)),
    ];
  }, [data, limits]);

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#BFE3C8] border-t-[#1A7A44]" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-72 flex-col items-center justify-center rounded-lg bg-white text-[#5B7264]">
        <p className="text-sm">Sem dados ambientais disponíveis</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={data}
        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
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
          yAxisId="temp"
          domain={tempDomain}
          stroke="#1A7A44"
          fontSize={11}
          tickLine={false}
          tickFormatter={(v: number) => `${v}°`}
          width={40}
        />
        <YAxis
          yAxisId="hum"
          orientation="right"
          domain={humDomain}
          stroke="#427DA5"
          fontSize={11}
          tickLine={false}
          tickFormatter={(v: number) => `${v}%`}
          width={44}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ stroke: "#BFE3C8", strokeDasharray: "4 4" }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "#5B7264" }} />
        <ReferenceArea
          yAxisId="temp"
          y1={limits.temperatureMinC}
          y2={limits.temperatureMaxC}
          fill="#E6F4EA"
          fillOpacity={0.4}
        />
        <ReferenceArea
          yAxisId="hum"
          y1={limits.relativeHumidityMin}
          y2={limits.relativeHumidityMax}
          fill="#dbeafe"
          fillOpacity={0.2}
        />
        <Line
          yAxisId="temp"
          type="monotone"
          dataKey="temperature"
          stroke="#1A7A44"
          strokeWidth={2}
          name="Temperatura (°C)"
          dot={false}
          activeDot={{
            r: 4,
            fill: "#1A7A44",
            stroke: "#fff",
            strokeWidth: 2,
          }}
          connectNulls
        />
        <Line
          yAxisId="hum"
          type="monotone"
          dataKey="humidity"
          stroke="#427DA5"
          strokeWidth={2}
          name="Umidade (%)"
          dot={false}
          activeDot={{
            r: 4,
            fill: "#427DA5",
            stroke: "#fff",
            strokeWidth: 2,
          }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
