import { describe, expect, it } from "vitest";

import { formatPrice } from "@/lib/currency";
import { GeneralService } from "@/types";

describe("Club services (General services) catalog cards", () => {
  const sampleClubService: GeneralService = {
    id: "svc_racket_stringing",
    siteId: "bkgalabovo",
    name: "Наплитане на ракета с кордаж на клиента",
    description:
      "Професионално наплитане на електронна машина с точно зададени килограми (напр. 10.5 - 12.5 кг). Включва преглед на втулките и смяна при нужда.",
    price: 10,
    currency: "EUR",
    performerName: "Георги Петров",
    performerType: "internal",
    pricingUnit: "fixed",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: { userId: "user_1", userName: "Admin" },
  };

  it("форматира цената и единицата правилно", () => {
    expect(formatPrice(sampleClubService.price)).toContain("10");
    expect(formatPrice(sampleClubService.price)).toContain("€");
  });

  it("разпознава единицата за таксуване коректно", () => {
    const getPricingUnitLabel = (unit: string) => {
      switch (unit) {
        case "per_hour":
          return "На час";
        case "per_session":
          return "На сесия";
        case "fixed":
        default:
          return "Фиксирана";
      }
    };

    expect(getPricingUnitLabel("fixed")).toBe("Фиксирана");
    expect(getPricingUnitLabel("per_hour")).toBe("На час");
    expect(getPricingUnitLabel("per_session")).toBe("На сесия");
  });

  it("разпознава дали услугата е наем на корт за отваряне на резервация", () => {
    const isCourt = (name: string, id: string) =>
      name.toLowerCase().includes("наем на корт") ||
      id.startsWith("court_rental");

    expect(isCourt("Наем на корт за любители", "svc_1")).toBe(true);
    expect(isCourt("Шкафче за личен багаж", "svc_locker")).toBe(false);
    expect(isCourt("Произволна услуга", "court_rental_weekend")).toBe(true);
  });
});
