import { useState, useMemo, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  X,
  ChevronLeft,
  Truck,
  ThermometerSun,
  Droplets,
  Eye,
  List,
  Navigation,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge, Button } from "@/components/ui";
import { useShipments } from "@/hooks/use-data-service";
import { useSimulatedRoutes } from "@/hooks/use-simulated-routes";
import {
  formatTemperature,
  formatHumidity,
  formatEnvironmentalStatus,
  getEnvironmentalBadgeVariant,
  formatRelativeTime,
} from "@/utils/format";
import type { Shipment, EnvironmentalStatus } from "@/types";

const ShipmentMap = lazy(() =>
  import("@/components/maps/shipment-map").then((m) => ({ default: m.ShipmentMap }))
);

function MapLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full bg-[#F4FAF5] rounded-xl">
      <div className="text-center space-y-2">
        <MapPin className="h-8 w-8 text-[#BFE3C8] mx-auto animate-pulse" />
        <p className="text-sm text-[#5B7264]">Carregando mapa...</p>
      </div>
    </div>
  );
}

const statusColorMap: Record<EnvironmentalStatus, string> = {
  optimal: "bg-[#1F8A4D]",
  warning: "bg-[#E08A2E]",
  critical: "bg-[#D94F4F]",
  stale: "bg-[#5B7264]",
  no_data: "bg-[#BFE3C8]",
};

function ShipmentListItem({
  shipment,
  isSelected,
  onClick,
}: {
  shipment: Shipment;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 rounded-lg border transition-colors",
        isSelected
          ? "border-[#1A7A44] bg-[#E6F4EA]"
          : "border-[#E6F4EA] hover:border-[#BFE3C8] bg-white"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={cn("h-2.5 w-2.5 rounded-full shrink-0", statusColorMap[shipment.environmentalStatus])}
            />
            <span className="text-sm font-semibold text-[#123A24] truncate">{shipment.id}</span>
          </div>
          <p className="text-xs text-[#5B7264] mt-0.5 truncate">{shipment.fruitName}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs font-medium text-[#123A24]">
            {formatTemperature(shipment.latestReading?.temperatureC ?? null)}
          </p>
          <p className="text-[10px] text-[#5B7264]">
            {formatHumidity(shipment.latestReading?.relativeHumidity ?? null)}
          </p>
        </div>
      </div>
    </button>
  );
}

function DetailPanel({
  shipment,
  onClose,
}: {
  shipment: Shipment;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-[#123A24]">{shipment.id}</h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-[#5B7264] hover:text-[#123A24] hover:bg-[#E6F4EA] transition-colors"
          aria-label="Fechar painel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant={getEnvironmentalBadgeVariant(shipment.environmentalStatus) as "success" | "warning" | "critical" | "info" | "neutral" | "muted"}>
          {formatEnvironmentalStatus(shipment.environmentalStatus)}
        </Badge>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-2 text-[#5B7264]">
          <Truck className="h-4 w-4 shrink-0" />
          <span>{shipment.fruitName}{shipment.variety ? ` — ${shipment.variety}` : ""}</span>
        </div>

        {shipment.vehicleId && (
          <div className="flex items-center gap-2 text-[#5B7264]">
            <Navigation className="h-4 w-4 shrink-0" />
            <span>Veículo: {shipment.vehicleId}</span>
          </div>
        )}

        {shipment.carrier && (
          <div className="flex items-center gap-2 text-[#5B7264]">
            <Building2 className="h-4 w-4 shrink-0" />
            <span>{shipment.carrier.name}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-[#5B7264]">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="truncate">{shipment.origin} → {shipment.destination}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-[#F4FAF5] p-3">
          <div className="flex items-center gap-1.5 text-xs text-[#5B7264] mb-1">
            <ThermometerSun className="h-3.5 w-3.5" />
            <span>Temperatura</span>
          </div>
          <p className="text-lg font-bold text-[#123A24]">
            {formatTemperature(shipment.latestReading?.temperatureC ?? null)}
          </p>
          <p className="text-[10px] text-[#5B7264]">
            Limite: {shipment.environmentalLimits.temperatureMinC}° a {shipment.environmentalLimits.temperatureMaxC}°C
          </p>
        </div>
        <div className="rounded-lg bg-[#F4FAF5] p-3">
          <div className="flex items-center gap-1.5 text-xs text-[#5B7264] mb-1">
            <Droplets className="h-3.5 w-3.5" />
            <span>Umidade</span>
          </div>
          <p className="text-lg font-bold text-[#123A24]">
            {formatHumidity(shipment.latestReading?.relativeHumidity ?? null)}
          </p>
          <p className="text-[10px] text-[#5B7264]">
            Limite: {shipment.environmentalLimits.relativeHumidityMin}% a {shipment.environmentalLimits.relativeHumidityMax}%
          </p>
        </div>
      </div>

      {shipment.latestReading?.measuredAt && (
        <p className="text-xs text-[#5B7264]">
          Última leitura: {formatRelativeTime(shipment.latestReading.measuredAt)}
        </p>
      )}

      <Link to={`/cargas/${shipment.id}`}>
        <Button variant="secondary" size="sm" className="w-full mt-2">
          <Eye className="h-4 w-4" />
          Ver detalhes
        </Button>
      </Link>
    </div>
  );
}

function Legend() {
  const items: { label: string; color: string }[] = [
    { label: "Ideal", color: "bg-[#1F8A4D]" },
    { label: "Atenção", color: "bg-[#E08A2E]" },
    { label: "Crítico", color: "bg-[#D94F4F]" },
    { label: "Desatualizado", color: "bg-[#5B7264]" },
    { label: "Sem dados", color: "bg-[#BFE3C8]" },
  ];

  return (
    <div className="flex flex-wrap gap-3 rounded-lg bg-white/90 backdrop-blur-sm px-3 py-2 shadow-sm border border-[#E6F4EA]">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span className={cn("h-2.5 w-2.5 rounded-full", item.color)} />
          <span className="text-xs text-[#5B7264]">{item.label}</span>
        </div>
      ))}
      <p className="basis-full text-[11px] text-[#5B7264]">
        Posição estimada pela rota real entre as cidades e pelo tempo de viagem (sem GPS).
      </p>
    </div>
  );
}

export default function TrackingPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // On small screens the list would cover most of the map.
  const [showList, setShowList] = useState(() => window.innerWidth >= 1024);

  const { data: rawShipments, isLoading } = useShipments();
  const { shipments, routes } = useSimulatedRoutes(rawShipments);

  const trackedShipments = useMemo(() => {
    return shipments.filter(
      (s) => s.latestPosition && ["in_transit", "loading", "stopped"].includes(s.logisticsStatus)
    );
  }, [shipments]);

  const selectedShipment = useMemo(
    () => trackedShipments.find((s) => s.id === selectedId) ?? null,
    [trackedShipments, selectedId]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <div className="text-center space-y-2">
          <MapPin className="h-8 w-8 text-[#BFE3C8] mx-auto animate-pulse" />
          <p className="text-sm text-[#5B7264]">Carregando mapa de transportes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-10rem)] flex rounded-xl overflow-hidden border border-[#E6F4EA]">
      {/* Left sidebar — shipment list */}
      <div
        className={cn(
          "absolute lg:relative z-20 top-0 left-0 h-full bg-white border-r border-[#E6F4EA] transition-all duration-200",
          showList ? "w-72" : "w-0 overflow-hidden"
        )}
      >
        <div className="p-3 border-b border-[#E6F4EA] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#123A24]">
            Veículos ({trackedShipments.length})
          </h2>
          <button
            onClick={() => setShowList(false)}
            className="p-1 rounded text-[#5B7264] hover:text-[#123A24] lg:hidden"
            aria-label="Fechar lista"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-3rem)] p-2 space-y-1.5">
          {trackedShipments.map((s) => (
            <ShipmentListItem
              key={s.id}
              shipment={s}
              isSelected={selectedId === s.id}
              onClick={() => setSelectedId(selectedId === s.id ? null : s.id)}
            />
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {!showList && (
          <button
            onClick={() => setShowList(true)}
            className="absolute top-3 left-14 z-10 p-2 rounded-lg bg-white shadow-md border border-[#E6F4EA] text-[#5B7264] hover:text-[#123A24] transition-colors"
            aria-label="Mostrar lista de veículos"
          >
            <List className="h-4 w-4" />
          </button>
        )}

        {/* Legend */}
        <div className="absolute top-3 right-3 z-10 hidden sm:block">
          <Legend />
        </div>

        <Suspense fallback={<MapLoadingFallback />}>
          <ShipmentMap
            shipments={trackedShipments}
            selectedShipmentId={selectedId ?? undefined}
            onShipmentSelect={(id) => setSelectedId(id)}
            routes={routes}
            height="100%"
          />
        </Suspense>
      </div>

      {/* Right detail panel */}
      {selectedShipment && (
        <>
          {/* Desktop: right sidebar */}
          <div className="hidden lg:block w-80 bg-white border-l border-[#E6F4EA] overflow-y-auto p-4">
            <DetailPanel shipment={selectedShipment} onClose={() => setSelectedId(null)} />
          </div>

          {/* Mobile: bottom sheet */}
          <div className="lg:hidden absolute bottom-0 left-0 right-0 z-20 bg-white rounded-t-2xl shadow-lg border-t border-[#E6F4EA] max-h-[60vh] overflow-y-auto p-4">
            <div className="w-10 h-1 bg-[#BFE3C8] rounded-full mx-auto mb-3" />
            <DetailPanel shipment={selectedShipment} onClose={() => setSelectedId(null)} />
          </div>
        </>
      )}
    </div>
  );
}
