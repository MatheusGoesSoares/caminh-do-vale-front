import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Truck,
  Clock,
  Eye,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, Badge, Input, Select, Skeleton, EmptyState } from "@/components/ui";
import { useShipments } from "@/hooks/use-data-service";
import {
  formatEnvironmentalStatus,
  getEnvironmentalBadgeVariant,
  formatRelativeTime,
} from "@/utils/format";
import type { Shipment, EnvironmentalStatus } from "@/types";

function GaugeBar({
  value,
  min,
  max,
  unit,
  label,
  color,
}: {
  value: number | null;
  min: number;
  max: number;
  unit: string;
  label: string;
  color: string;
}) {
  if (value === null) {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-[#5B7264]">
          <span>{label}</span>
          <span>—</span>
        </div>
        <div className="h-2 w-full rounded-full bg-[#F4FAF5]" />
      </div>
    );
  }

  const rangeSpan = max - min;
  const padding = rangeSpan * 0.3;
  const visualMin = min - padding;
  const visualMax = max + padding;
  const visualRange = visualMax - visualMin;
  const clampedVal = Math.max(visualMin, Math.min(visualMax, value));
  const percent = ((clampedVal - visualMin) / visualRange) * 100;
  const inRange = value >= min && value <= max;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#5B7264]">{label}</span>
        <span className={cn("font-semibold", inRange ? "text-[#1F8A4D]" : "text-[#D94F4F]")}>
          {value.toFixed(1)}{unit}
        </span>
      </div>
      <div className="relative h-2 w-full rounded-full bg-[#F4FAF5]">
        {/* Acceptable range band */}
        <div
          className="absolute top-0 h-full rounded-full bg-[#E6F4EA]"
          style={{
            left: `${((min - visualMin) / visualRange) * 100}%`,
            width: `${(rangeSpan / visualRange) * 100}%`,
          }}
        />
        {/* Current value indicator */}
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm",
            inRange ? color : "bg-[#D94F4F]"
          )}
          style={{ left: `calc(${percent}% - 7px)` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-[#5B7264]">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

function MonitoringCard({ shipment }: { shipment: Shipment }) {
  const borderColor: Record<EnvironmentalStatus, string> = {
    optimal: "border-l-[#1F8A4D]",
    warning: "border-l-[#E08A2E]",
    critical: "border-l-[#D94F4F]",
    stale: "border-l-[#5B7264]",
    no_data: "border-l-[#BFE3C8]",
  };

  const temp = shipment.latestReading?.temperatureC ?? null;
  const hum = shipment.latestReading?.relativeHumidity ?? null;
  const limits = shipment.environmentalLimits;

  return (
    <Card
      className={cn(
        "border-l-4 transition-shadow hover:shadow-md",
        borderColor[shipment.environmentalStatus]
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#123A24]">{shipment.id}</span>
            <Badge variant={getEnvironmentalBadgeVariant(shipment.environmentalStatus) as "success" | "warning" | "critical" | "info" | "neutral" | "muted"}>
              {formatEnvironmentalStatus(shipment.environmentalStatus)}
            </Badge>
          </div>
          <p className="text-sm text-[#5B7264] mt-0.5">
            {shipment.fruitName}{shipment.variety ? ` — ${shipment.variety}` : ""}
          </p>
        </div>
        <Link
          to={`/cargas/${shipment.id}`}
          className="p-1.5 rounded-lg text-[#5B7264] hover:text-[#1A7A44] hover:bg-[#E6F4EA] transition-colors"
          aria-label={`Ver detalhes da carga ${shipment.id}`}
        >
          <Eye className="h-4 w-4" />
        </Link>
      </div>

      {shipment.vehicleId && (
        <div className="flex items-center gap-1.5 text-xs text-[#5B7264] mb-3">
          <Truck className="h-3.5 w-3.5" />
          <span>{shipment.vehicleId}</span>
        </div>
      )}

      <div className="space-y-3">
        <GaugeBar
          value={temp}
          min={limits.temperatureMinC}
          max={limits.temperatureMaxC}
          unit="°C"
          label="Temperatura"
          color="bg-[#1A7A44]"
        />
        <GaugeBar
          value={hum}
          min={limits.relativeHumidityMin}
          max={limits.relativeHumidityMax}
          unit="%"
          label="Umidade"
          color="bg-[#427DA5]"
        />
      </div>

      {shipment.latestReading?.measuredAt && (
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-[#E6F4EA]">
          <Clock className="h-3 w-3 text-[#5B7264]" />
          <span className="text-xs text-[#5B7264]">
            Última leitura: {formatRelativeTime(shipment.latestReading.measuredAt)}
          </span>
        </div>
      )}
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-[#E6F4EA] bg-white p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-32" />
          <div className="space-y-3">
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MonitoringPage() {
  const [search, setSearch] = useState("");
  const [fruitFilter, setFruitFilter] = useState("");
  const [envFilter, setEnvFilter] = useState("");

  const { data: shipments, isLoading } = useShipments();

  const activeShipments = useMemo(() => {
    if (!shipments) return [];
    return shipments.filter((s) => {
      if (!["in_transit", "loading", "stopped"].includes(s.logisticsStatus)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !s.id.toLowerCase().includes(q) &&
          !s.fruitName.toLowerCase().includes(q) &&
          !(s.vehicleId?.toLowerCase().includes(q))
        ) {
          return false;
        }
      }
      if (fruitFilter && s.fruitName !== fruitFilter) return false;
      if (envFilter && s.environmentalStatus !== envFilter) return false;
      return true;
    });
  }, [shipments, search, fruitFilter, envFilter]);

  const fruitOptions = useMemo(() => {
    if (!shipments) return [];
    const fruits = [...new Set(shipments.map((s) => s.fruitName))];
    return [{ value: "", label: "Todas as frutas" }, ...fruits.map((f) => ({ value: f, label: f }))];
  }, [shipments]);

  const envStatusOptions = [
    { value: "", label: "Todos os status" },
    { value: "optimal", label: "Ideal" },
    { value: "warning", label: "Atenção" },
    { value: "critical", label: "Crítico" },
    { value: "stale", label: "Desatualizado" },
    { value: "no_data", label: "Sem dados" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#123A24]">Monitoramento em Tempo Real</h1>
          <p className="text-sm text-[#5B7264] mt-1">
            {isLoading
              ? "Carregando..."
              : `${activeShipments.length} carga${activeShipments.length !== 1 ? "s" : ""} em monitoramento`}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#5B7264]">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: "3s" }} />
          <span>Atualização automática</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 max-w-xs">
          <Input
            search
            placeholder="Buscar carga, fruta ou veículo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            options={fruitOptions}
            value={fruitFilter}
            onChange={(e) => setFruitFilter(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            options={envStatusOptions}
            value={envFilter}
            onChange={(e) => setEnvFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : activeShipments.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="Nenhuma carga em monitoramento"
          description={
            search || fruitFilter || envFilter
              ? "Nenhuma carga encontrada com os filtros selecionados."
              : "Não há cargas em transporte no momento."
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeShipments.map((shipment) => (
            <MonitoringCard key={shipment.id} shipment={shipment} />
          ))}
        </div>
      )}
    </div>
  );
}
