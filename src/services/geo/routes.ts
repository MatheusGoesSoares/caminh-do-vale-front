// Simulated trip geography. The backend has no coordinates or GPS, so the route is the real road path
// between the origin and destination cities (OSRM) and the truck position is estimated from elapsed time.

export type LatLng = [number, number];

export interface RoadRoute {
  path: LatLng[];
  distanceM: number;
  durationS: number;
  /** True when the road service failed and the path is a straight line. */
  approximate: boolean;
}

// Cities already registered in the backend; others are looked up on OpenStreetMap.
const KNOWN_CITIES: Record<string, LatLng> = {
  "petrolina-pe": [-9.3986, -40.5008],
  "juazeiro-ba": [-9.4163, -40.5033],
  "recife-pe": [-8.0476, -34.877],
  "sao paulo-sp": [-23.5505, -46.6333],
  "salvador-ba": [-12.9777, -38.5016],
};

const CACHE_PREFIX = "cdv.geo.v1.";
const MAX_POINTS = 400;
const FALLBACK_SPEED_MS = 60 / 3.6;

function cityKey(address: string): string {
  return address
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s*[-/,]\s*/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function cached<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function remember<T>(key: string, value: T): T {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the value is still returned, just not kept.
  }
  return value;
}

export async function geocodeCity(address: string): Promise<LatLng | null> {
  const key = cityKey(address);
  if (KNOWN_CITIES[key]) return KNOWN_CITIES[key];
  const hit = cached<LatLng>(`city.${key}`);
  if (hit) return hit;

  const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=br&limit=1&q=${encodeURIComponent(address)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const [place] = (await res.json()) as { lat: string; lon: string }[];
  return place ? remember(`city.${key}`, [Number(place.lat), Number(place.lon)]) : null;
}

function haversineM([lat1, lng1]: LatLng, [lat2, lng2]: LatLng): number {
  const rad = Math.PI / 180;
  const a =
    Math.sin(((lat2 - lat1) * rad) / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lng2 - lng1) * rad) / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(a));
}

function downsample(path: LatLng[]): LatLng[] {
  if (path.length <= MAX_POINTS) return path;
  const step = (path.length - 1) / (MAX_POINTS - 1);
  return Array.from({ length: MAX_POINTS }, (_, i) => path[Math.round(i * step)]);
}

export async function roadRoute(from: LatLng, to: LatLng): Promise<RoadRoute> {
  const key = `route.${from.map((n) => n.toFixed(4)).join(",")};${to.map((n) => n.toFixed(4)).join(",")}`;
  const hit = cached<RoadRoute>(key);
  if (hit) return hit;

  try {
    const coords = `${from[1]},${from[0]};${to[1]},${to[0]}`;
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
    );
    const body = (await res.json()) as {
      code: string;
      routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[];
    };
    const route = body.routes?.[0];
    if (body.code !== "Ok" || !route) throw new Error(body.code);
    return remember(key, {
      path: downsample(route.geometry.coordinates.map(([lng, lat]) => [lat, lng] as LatLng)),
      distanceM: route.distance,
      durationS: route.duration,
      approximate: false,
    });
  } catch {
    // Not cached, so the next load tries the road service again.
    const distanceM = haversineM(from, to) * 1.3;
    return { path: [from, to], distanceM, durationS: distanceM / FALLBACK_SPEED_MS, approximate: true };
  }
}

/** Point at `fraction` (0..1) of the path length, plus the part of the path already covered. */
export function pointAlong(path: LatLng[], fraction: number): { point: LatLng; covered: LatLng[] } {
  if (path.length < 2) return { point: path[0], covered: path.slice(0, 1) };
  const segments = path.slice(1).map((p, i) => haversineM(path[i], p));
  const total = segments.reduce((a, b) => a + b, 0);
  let remaining = Math.min(Math.max(fraction, 0), 1) * total;

  for (let i = 0; i < segments.length; i++) {
    if (remaining <= segments[i] || i === segments.length - 1) {
      const t = segments[i] === 0 ? 0 : Math.min(remaining / segments[i], 1);
      const [a, b] = [path[i], path[i + 1]];
      const point: LatLng = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      return { point, covered: [...path.slice(0, i + 1), point] };
    }
    remaining -= segments[i];
  }
  return { point: path[path.length - 1], covered: path };
}
