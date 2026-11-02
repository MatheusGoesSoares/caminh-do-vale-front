import { Link } from "react-router-dom";
import {
  Thermometer,
  Droplets,
  MapPin,
  ArrowRight,
  Truck,
  Clock,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Shipment } from "@/types";
import {
  formatLogisticsStatus,
  formatEnvironmentalStatus,
  formatTemperature,
  formatHumidity,
  formatRelativeTime,
  getEnvironmentalBadgeVariant,
  getLogisticsBadgeVariant,
} from "@/utils/format";

interface ShipmentCardProps {
  shipment: Shipment;
  compact?: boolean;
}

const badgeColors: Record<string, string> = {
  success: "bg-[#1F8A4D]/10 text-[#1F8A4D]",
  warning: "bg-[#E08A2E]/10 text-[#E08A2E]",
  critical: "bg-[#D94F4F]/10 text-[#D94F4F]",
  info: "bg-[#427DA5]/10 text-[#427DA5]",
  neutral: "bg-[#5B7264]/10 text-[#5B7264]",
  muted: "bg-[#BFE3C8]/10 text-[#5B7264]",
};

function StatusBadge({
  label,
  variant,
}: {
  label: string;
  variant: string;
}) {
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

function TempIndicator({ value, min, max }: { value: number | null; min: number; max: number }) {
  if (value === null) return <span className="text-[#5B7264]">—</span>;
  const isLow = value < min;
  const isHigh = value > max;
  const color = isLow || isHigh ? "text-[#D94F4F]" : "text-[#1F8A4D]";
  return <span className={cn("font-medium", color)}>{formatTemperature(value)}</span>;
}

function HumidityIndicator({ value, min, max }: { value: number | null; min: number; max: number }) {
  if (value === null) return <span className="text-[#5B7264]">—</span>;
  const isLow = value < min;
  const isHigh = value > max;
  const color = isLow || isHigh ? "text-[#E08A2E]" : "text-[#1F8A4D]";
  return <span className={cn("font-medium", color)}>{formatHumidity(value)}</span>;
}

export function ShipmentCard({ shipment, compact }: ShipmentCardProps) {
  const temp = shipment.latestReading?.temperatureC ?? null;
  const humidity = shipment.latestReading?.relativeHumidity ?? null;
  const limits = shipment.environmentalLimits;
  const lastUpdate = shipment.latestReading?.measuredAt;

  if (compact) {
    return (
      <Link
        to={`/cargas/${shipment.id}`}
        className="flex items-center gap-4 rounded-lg border border-[#E6F4EA] bg-white px-4 py-3 transition-colors hover:bg-[#F4FAF5]"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#123A24]">
              {shipment.id}
            </span>
            <span className="text-xs text-[#5B7264]">
              {shipment.fruitName}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-[#5B7264]">
            <span>{shipment.origin}</span>
            <ArrowRight className="h-3 w-3 flex-shrink-0" />
            <span>{shipment.destination}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1">
            <Thermometer className="h-3.5 w-3.5 text-[#5B7264]" />
            <TempIndicator value={temp} min={limits.temperatureMinC} max={limits.temperatureMaxC} />
          </div>
          <div className="flex items-center gap-1">
            <Droplets className="h-3.5 w-3.5 text-[#5B7264]" />
            <HumidityIndicator value={humidity} min={limits.relativeHumidityMin} max={limits.relativeHumidityMax} />
          </div>
        </div>

        <StatusBadge
          label={formatEnvironmentalStatus(shipment.environmentalStatus)}
          variant={getEnvironmentalBadgeVariant(shipment.environmentalStatus)}
        />

        <ChevronRight className="h-4 w-4 flex-shrink-0 text-[#BFE3C8]" />
      </Link>
    );
  }

  return (
    <Link
      to={`/cargas/${shipment.id}`}
      className="group flex flex-col rounded-xl border border-[#E6F4EA] bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-[#BFE3C8]"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-[#123A24]">
              {shipment.id}
            </h3>
            <span className="text-sm text-[#5B7264]">
              Lote {shipment.batchId}
            </span>
          </div>
          <p className="mt-1 text-sm font-medium text-[#1A7A44]">
            {shipment.fruitName}
            {shipment.variety && (
              <span className="font-normal text-[#5B7264]">
                {" "}· {shipment.variety}
              </span>
            )}
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-[#BFE3C8] transition-transform group-hover:translate-x-0.5" />
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-sm text-[#5B7264]">
        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="truncate">{shipment.origin}</span>
        <ArrowRight className="h-3 w-3 flex-shrink-0" />
        <span className="truncate">{shipment.destination}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 rounded-lg bg-[#F4FAF5] px-3 py-2">
          <Thermometer className="h-4 w-4 text-[#1F8A4D]" />
          <div>
            <p className="text-xs text-[#5B7264]">Temperatura</p>
            <TempIndicator value={temp} min={limits.temperatureMinC} max={limits.temperatureMaxC} />
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-[#F4FAF5] px-3 py-2">
          <Droplets className="h-4 w-4 text-[#427DA5]" />
          <div>
            <p className="text-xs text-[#5B7264]">Umidade</p>
            <HumidityIndicator value={humidity} min={limits.relativeHumidityMin} max={limits.relativeHumidityMax} />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusBadge
            label={formatLogisticsStatus(shipment.logisticsStatus)}
            variant={getLogisticsBadgeVariant(shipment.logisticsStatus)}
          />
          <StatusBadge
            label={formatEnvironmentalStatus(shipment.environmentalStatus)}
            variant={getEnvironmentalBadgeVariant(shipment.environmentalStatus)}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-[#E6F4EA] pt-3 text-xs text-[#5B7264]">
        <div className="flex items-center gap-1">
          <Truck className="h-3.5 w-3.5" />
          <span>{shipment.vehicleId ?? "—"}</span>
        </div>
        {lastUpdate && (
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatRelativeTime(lastUpdate)}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
