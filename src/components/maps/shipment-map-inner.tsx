import { Fragment, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import "leaflet/dist/leaflet.css";
import type { Shipment, GeoPosition, EnvironmentalStatus } from "@/types";
import type { SimulatedRoute } from "@/hooks/use-simulated-routes";

const STATUS_COLORS: Record<EnvironmentalStatus, string> = {
  optimal: "#1F8A4D",
  warning: "#E08A2E",
  critical: "#D94F4F",
  stale: "#5B7264",
  no_data: "#BFE3C8",
};

function createMarkerIcon(status: EnvironmentalStatus) {
  const color = STATUS_COLORS[status];
  return L.divIcon({
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:${color};border:3px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
    ">
      <div style="width:8px;height:8px;border-radius:50%;background:#fff;opacity:0.9;"></div>
    </div>`,
  });
}

function MapFlyTo({
  lat,
  lng,
  zoom,
}: {
  lat: number;
  lng: number;
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], zoom, { duration: 1 });
  }, [map, lat, lng, zoom]);
  return null;
}

// Mobile browsers may treat a two-finger pinch on the map as page zoom; keep the gesture for the map.
function BlockPagePinchZoom() {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    const stopMultiTouch = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };
    const stopGesture = (e: Event) => e.preventDefault();
    el.addEventListener("touchmove", stopMultiTouch, { passive: false });
    el.addEventListener("gesturestart", stopGesture);
    el.addEventListener("gesturechange", stopGesture);
    return () => {
      el.removeEventListener("touchmove", stopMultiTouch);
      el.removeEventListener("gesturestart", stopGesture);
      el.removeEventListener("gesturechange", stopGesture);
    };
  }, [map]);
  return null;
}

function FitRoute({ path }: { path: [number, number][] }) {
  const map = useMap();
  const key = path.length ? `${path[0]}-${path[path.length - 1]}` : "";
  useEffect(() => {
    if (path.length > 1) map.fitBounds(L.latLngBounds(path), { padding: [40, 40], maxZoom: 11 });
    // Refit only when the route itself changes, not on every position update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  return null;
}

interface ShipmentMapInnerProps {
  shipments: Shipment[];
  selectedShipmentId?: string;
  onShipmentSelect?: (id: string) => void;
  height?: string;
  showRoute?: boolean;
  positions?: GeoPosition[];
  routes?: Map<string, SimulatedRoute>;
}

export function ShipmentMapInner({
  shipments,
  selectedShipmentId,
  onShipmentSelect,
  height = "400px",
  showRoute = false,
  positions = [],
  routes,
}: ShipmentMapInnerProps) {
  const mapRef = useRef<L.Map | null>(null);

  const selected = selectedShipmentId
    ? shipments.find((s) => s.id === selectedShipmentId)
    : null;

  const selectedRoute = selected ? routes?.get(selected.id) : undefined;
  const onlyRoute = !selected && shipments.length === 1 ? routes?.get(shipments[0].id) : undefined;
  const fitPath = (selectedRoute ?? onlyRoute)?.full;

  const flyTarget =
    !fitPath && selected?.latestPosition
      ? {
          lat: selected.latestPosition.latitude,
          lng: selected.latestPosition.longitude,
          zoom: 10,
        }
      : null;

  const routePositions: [number, number][] = positions
    .sort(
      (a, b) =>
        new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
    )
    .map((p) => [p.latitude, p.longitude]);

  return (
    <div style={{ height, width: "100%" }} className="isolate rounded-lg overflow-hidden">
      <MapContainer
        center={[-9.39, -40.5]}
        zoom={6}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
        scrollWheelZoom
        touchZoom
      >
        <BlockPagePinchZoom />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {fitPath && <FitRoute path={fitPath} />}

        {routes &&
          shipments.map((shipment) => {
            const route = routes.get(shipment.id);
            if (!route) return null;
            const highlighted = !selected || selected.id === shipment.id;
            return (
              <Fragment key={`route-${shipment.id}`}>
                <Polyline
                  positions={route.full}
                  pathOptions={{ color: "#1A7A44", weight: highlighted ? 4 : 2, opacity: highlighted ? 0.35 : 0.15, dashArray: "6 8" }}
                />
                {route.covered.length > 1 && (
                  <Polyline
                    positions={route.covered}
                    pathOptions={{ color: "#1A7A44", weight: highlighted ? 5 : 3, opacity: highlighted ? 0.9 : 0.4 }}
                  />
                )}
              </Fragment>
            );
          })}

        {flyTarget && (
          <MapFlyTo
            lat={flyTarget.lat}
            lng={flyTarget.lng}
            zoom={flyTarget.zoom}
          />
        )}

        {shipments.map((shipment) => {
          const pos = shipment.latestPosition;
          if (!pos) return null;

          const icon = createMarkerIcon(shipment.environmentalStatus);
          const lastUpdate = shipment.latestReading?.measuredAt;

          return (
            <Marker
              key={shipment.id}
              position={[pos.latitude, pos.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => onShipmentSelect?.(shipment.id),
              }}
            >
              <Popup>
                <div className="min-w-[180px] text-sm">
                  <p className="mb-1 font-bold text-[#123A24]">
                    {shipment.id}
                  </p>
                  <p className="text-[#5B7264]">
                    {shipment.fruitName}
                    {shipment.variety ? ` — ${shipment.variety}` : ""}
                  </p>
                  {shipment.vehicleId && (
                    <p className="text-[#5B7264]">
                      Veículo: {shipment.vehicleId}
                    </p>
                  )}
                  <div className="mt-2 border-t border-gray-100 pt-2">
                    {shipment.latestReading?.temperatureC != null && (
                      <p>
                        🌡️ {shipment.latestReading.temperatureC.toFixed(1)} °C
                      </p>
                    )}
                    {shipment.latestReading?.relativeHumidity != null && (
                      <p>
                        💧 {shipment.latestReading.relativeHumidity.toFixed(0)}%
                      </p>
                    )}
                  </div>
                  {routes?.get(shipment.id) && (
                    <p className="mt-1 text-xs text-[#5B7264]">
                      Posição estimada · {Math.round(routes.get(shipment.id)!.progress * 100)}% de{" "}
                      {Math.round(routes.get(shipment.id)!.distanceKm)} km
                      {routes.get(shipment.id)!.approximate && " (rota aproximada)"}
                    </p>
                  )}
                  {lastUpdate && (
                    <p className="mt-1 text-xs text-[#5B7264]">
                      Atualizado{" "}
                      {formatDistanceToNow(new Date(lastUpdate), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                      <br />
                      <span className="text-[10px]">
                        {format(new Date(lastUpdate), "dd/MM HH:mm", {
                          locale: ptBR,
                        })}
                      </span>
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {showRoute && routePositions.length > 1 && (
          <Polyline
            positions={routePositions}
            color="#1A7A44"
            weight={3}
            opacity={0.7}
            dashArray="8 6"
          />
        )}
      </MapContainer>
    </div>
  );
}
