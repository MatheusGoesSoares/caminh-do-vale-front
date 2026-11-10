import { afterEach, describe, expect, it, vi } from "vitest";
import { geocodeCity, pointAlong, roadRoute, type LatLng } from "../routes";

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("pointAlong", () => {
  const path: LatLng[] = [
    [0, 0],
    [0, 1],
    [0, 2],
  ];

  it("starts at the origin and ends at the destination", () => {
    expect(pointAlong(path, 0).point).toEqual([0, 0]);
    expect(pointAlong(path, 1).point).toEqual([0, 2]);
  });

  it("places the truck by distance and returns the covered part", () => {
    const half = pointAlong(path, 0.5);
    expect(half.point[0]).toBeCloseTo(0);
    expect(half.point[1]).toBeCloseTo(1);
    const quarter = pointAlong(path, 0.25);
    expect(quarter.point[1]).toBeCloseTo(0.5);
    expect(quarter.covered).toEqual([[0, 0], quarter.point]);
  });

  it("clamps progress outside 0..1", () => {
    expect(pointAlong(path, 3).point).toEqual([0, 2]);
    expect(pointAlong(path, -1).point).toEqual([0, 0]);
  });
});

describe("geocodeCity", () => {
  it("uses the built-in coordinates for backend cities, ignoring accents and spacing", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await geocodeCity("São Paulo - SP")).toEqual([-23.5505, -46.6333]);
    expect(await geocodeCity("Juazeiro-BA")).toEqual([-9.4163, -40.5033]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("looks up unknown cities once and remembers them", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify([{ lat: "-7.1", lon: "-34.8" }])));
    vi.stubGlobal("fetch", fetchMock);
    expect(await geocodeCity("João Pessoa - PB")).toEqual([-7.1, -34.8]);
    expect(await geocodeCity("João Pessoa - PB")).toEqual([-7.1, -34.8]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("roadRoute", () => {
  it("uses the road path from the routing service", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            code: "Ok",
            routes: [{ distance: 2_242_000, duration: 112_680, geometry: { coordinates: [[-40.5, -9.4], [-46.6, -23.5]] } }],
          })
        )
      )
    );
    const route = await roadRoute([-9.4, -40.5], [-23.5, -46.6]);
    expect(route).toMatchObject({ distanceM: 2_242_000, durationS: 112_680, approximate: false });
    expect(route.path).toEqual([
      [-9.4, -40.5],
      [-23.5, -46.6],
    ]);
  });

  it("falls back to an approximate straight line when the service fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    const route = await roadRoute([-9.4, -40.5], [-8.05, -34.88]);
    expect(route.approximate).toBe(true);
    expect(route.path).toHaveLength(2);
    expect(route.durationS).toBeGreaterThan(0);
  });
});
