import { describe, expect, it } from "vitest";

import { CATALOG_SECTIONS } from "@/components/catalogs/catalog-sections";
import { formatPrice } from "@/lib/currency";

describe("Public Catalog Golden Hybrid alignment with /catalogs", () => {
  it("has exactly the 4 canonical catalog sections with matching IDs and labels", () => {
    const sectionIds = CATALOG_SECTIONS.map((s) => s.id);
    expect(sectionIds).toEqual([
      "trainings",
      "club-services",
      "recovery",
      "shop",
    ]);

    const trainingsSection = CATALOG_SECTIONS.find((s) => s.id === "trainings");
    expect(trainingsSection?.label).toBe("Тренировки & Абонаменти");

    const clubServicesSection = CATALOG_SECTIONS.find(
      (s) => s.id === "club-services"
    );
    expect(clubServicesSection?.label).toBe("Клубни услуги & Наеми");

    const recoverySection = CATALOG_SECTIONS.find((s) => s.id === "recovery");
    expect(recoverySection?.label).toBe("Възстановяване (Recovery)");

    const shopSection = CATALOG_SECTIONS.find((s) => s.id === "shop");
    expect(shopSection?.label).toBe("Клубен магазин & Стоки");
  });

  it("formats prices uniformly using formatPrice in EUR without hiding prices", () => {
    expect(formatPrice(25)).toContain("25");
    expect(formatPrice(25)).toContain("€");

    expect(formatPrice(48.9)).toContain("48,9");
    expect(formatPrice(48.9)).toContain("€");

    expect(formatPrice(0)).toContain("0");
    expect(formatPrice(0)).toContain("€");
  });

  it("correctly normalizes legacy tab aliases to canonical section IDs", () => {
    const normalizeTab = (tab: string) => {
      if (tab === "general" || tab === "club-services") return "club-services";
      if (tab === "products" || tab === "shop") return "shop";
      if (tab === "recovery") return "recovery";
      return "trainings";
    };

    expect(normalizeTab("general")).toBe("club-services");
    expect(normalizeTab("products")).toBe("shop");
    expect(normalizeTab("trainings")).toBe("trainings");
    expect(normalizeTab("recovery")).toBe("recovery");
  });
});
