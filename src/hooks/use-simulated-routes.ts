import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { geocodeCity, pointAlong, roadRoute, type LatLng, type RoadRoute } from "@/services/geo/routes";
import type { Shipment } from "@/types";

export interface SimulatedRoute {
  full: LatLng[];
  covered: LatLng[];
  progress: number;
  distanceKm: number;
  durationH: number;
  approximate: boolean;
}

function pairKey(s: Shipment): string | null {
  return s.originAddress && s.destinationAddress ? `${s.originAddress}|${s.destinationAddress}` : null;
}

function progressOf(shipment: Shipment, route: RoadRoute, now: number): number {
  if (shipment.logisticsStatus === "pending") return 0;
  if (shipment.logisticsStatus !== "in_transit") return 1;
  if (!shipment.startedAt) return 0;
  return (now - new Date(shipment.startedAt).getTime()) / 1000 / route.durationS;
}

function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/**
 * Adds a simulated `latestPosition` to each shipment: the real road route between the origin and
 * destination cities, with the truck placed by elapsed time over the estimated trip duration.
 */
export function useSimulatedRoutes(shipments: Shipment[] | undefined) {
  const pairs = useMemo(
    () => [...new Set((shipments ?? []).map(pairKey).filter((k): k is string => !!k))].sort(),
    [shipments]
  );

  const { data: roads } = useQuery({
    queryKey: ["road-routes", pairs],
    enabled: pairs.length > 0,
    staleTime: Infinity,
    queryFn: async () => {
      const result = new Map<string, RoadRoute>();
      // One at a time: the public geocoder allows about one request per second.
      for (const pair of pairs) {
        const [from, to] = pair.split("|");
        const a = await geocodeCity(from);
        const b = await geocodeCity(to);
        if (a && b) result.set(pair, await roadRoute(a, b));
      }
      return result;
    },
  });

  const now = useNow(30_000);

  return useMemo(() => {
    const routes = new Map<string, SimulatedRoute>();
    const withPositions = (shipments ?? []).map((s) => {
      const key = pairKey(s);
      const road = key ? roads?.get(key) : undefined;
      if (!road) return s;
      const progress = Math.min(Math.max(progressOf(s, road, now), 0), 1);
      const { point, covered } = pointAlong(road.path, progress);
      routes.set(s.id, {
        full: road.path,
        covered,
        progress,
        distanceKm: road.distanceM / 1000,
        durationH: road.durationS / 3600,
        approximate: road.approximate,
      });
      return { ...s, latestPosition: { latitude: point[0], longitude: point[1], recordedAt: new Date(now).toISOString() } };
    });
    return { shipments: withPositions, routes };
  }, [shipments, roads, now]);
}
