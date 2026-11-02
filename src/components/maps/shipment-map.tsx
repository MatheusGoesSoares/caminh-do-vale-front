import { lazy, Suspense } from "react";
import type { Shipment, GeoPosition } from "@/types";

const ShipmentMapInner = lazy(() =>
  import("./shipment-map-inner").then((m) => ({ default: m.ShipmentMapInner }))
);

interface ShipmentMapProps {
  shipments: Shipment[];
  selectedShipmentId?: string;
  onShipmentSelect?: (id: string) => void;
  height?: string;
  showRoute?: boolean;
  positions?: GeoPosition[];
}

function MapFallback({ height = "400px" }: { height?: string }) {
  return (
    <div
      style={{ height }}
      className="flex items-center justify-center rounded-lg bg-[#E6F4EA]"
    >
      <div className="text-center text-[#5B7264]">
        <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-[#BFE3C8] border-t-[#1A7A44]" />
        <p className="text-sm">Carregando mapa…</p>
      </div>
    </div>
  );
}

export function ShipmentMap(props: ShipmentMapProps) {
  return (
    <Suspense fallback={<MapFallback height={props.height} />}>
      <ShipmentMapInner {...props} />
    </Suspense>
  );
}
