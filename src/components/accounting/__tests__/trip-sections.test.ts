import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  getActiveTripSectionId,
  getTripSectionHref,
  TRIP_DETAIL_SECTIONS,
} from "@/components/business-trips/details/trip-details-sections";

const TRIP_ROUTE_DIR = path.resolve(
  process.cwd(),
  "src/app/(protected)/accounting/trips/[id]/(tabs)"
);

describe("trip detail sections (/accounting/trips/[id]/*)", () => {
  it("има уникални id, pathSuffix и генерирани href", () => {
    const ids = TRIP_DETAIL_SECTIONS.map((s) => s.id);
    const suffixes = TRIP_DETAIL_SECTIONS.map((s) => s.pathSuffix);
    const hrefs = TRIP_DETAIL_SECTIONS.map((s) =>
      getTripSectionHref("trip-1", s.id)
    );

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(suffixes).size).toBe(suffixes.length);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("съдържа всички 7 секции с валидни етикети, подсказки и икони", () => {
    expect(TRIP_DETAIL_SECTIONS.map((s) => s.id)).toEqual([
      "overview",
      "expenses",
      "order",
      "protocol",
      "athletes",
      "report",
      "manage",
    ]);

    for (const section of TRIP_DETAIL_SECTIONS) {
      expect(section.label.trim().length).toBeGreaterThan(0);
      expect(section.tooltip.trim().length).toBeGreaterThan(0);
      expect(section.icon).toBeDefined();
    }
  });

  it.each(TRIP_DETAIL_SECTIONS.map((s) => [s.id, s.pathSuffix] as const))(
    "секция %s сочи към съществуваща page.tsx",
    (_id, suffix) => {
      const file = suffix
        ? path.join(TRIP_ROUTE_DIR, suffix, "page.tsx")
        : path.join(TRIP_ROUTE_DIR, "page.tsx");
      expect(fs.existsSync(file)).toBe(true);
    }
  );

  it("всяка поддиректория с page.tsx под (tabs) е регистрирана в TRIP_DETAIL_SECTIONS", () => {
    const dirs = fs
      .readdirSync(TRIP_ROUTE_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    const registeredSuffixes = TRIP_DETAIL_SECTIONS.map((s) => s.pathSuffix);
    for (const dir of dirs) {
      expect(registeredSuffixes).toContain(dir);
    }
  });

  it("генерира коректни маршрути /accounting/trips/[id]/* за всяка секция", () => {
    const tripId = "trip-abc";
    expect(getTripSectionHref(tripId, "overview")).toBe(
      "/accounting/trips/trip-abc"
    );
    expect(getTripSectionHref(tripId, "expenses")).toBe(
      "/accounting/trips/trip-abc/expenses"
    );
    expect(getTripSectionHref(tripId, "order")).toBe(
      "/accounting/trips/trip-abc/order"
    );
    expect(getTripSectionHref(tripId, "protocol")).toBe(
      "/accounting/trips/trip-abc/protocol"
    );
    expect(getTripSectionHref(tripId, "athletes")).toBe(
      "/accounting/trips/trip-abc/athletes"
    );
    expect(getTripSectionHref(tripId, "report")).toBe(
      "/accounting/trips/trip-abc/report"
    );
    expect(getTripSectionHref(tripId, "manage")).toBe(
      "/accounting/trips/trip-abc/manage"
    );
  });

  it("определя активната секция по pathname и tripId", () => {
    const tripId = "trip-abc";
    expect(getActiveTripSectionId("/accounting/trips/trip-abc", tripId)).toBe(
      "overview"
    );
    expect(getActiveTripSectionId("/accounting/trips/trip-abc/", tripId)).toBe(
      "overview"
    );
    expect(
      getActiveTripSectionId("/accounting/trips/trip-abc/expenses", tripId)
    ).toBe("expenses");
    expect(
      getActiveTripSectionId("/accounting/trips/trip-abc/order", tripId)
    ).toBe("order");
    expect(
      getActiveTripSectionId("/accounting/trips/trip-abc/protocol", tripId)
    ).toBe("protocol");
    expect(
      getActiveTripSectionId("/accounting/trips/trip-abc/athletes", tripId)
    ).toBe("athletes");
    expect(
      getActiveTripSectionId("/accounting/trips/trip-abc/report", tripId)
    ).toBe("report");
    expect(
      getActiveTripSectionId("/accounting/trips/trip-abc/manage", tripId)
    ).toBe("manage");

    expect(
      getActiveTripSectionId("/accounting/trips/trip-abc/unknown", tripId)
    ).toBeNull();
    expect(
      getActiveTripSectionId("/accounting/trips/other-trip/expenses", tripId)
    ).toBeNull();
    expect(getActiveTripSectionId("/accounting", tripId)).toBeNull();
  });
});
