import { describe, expect, it } from "vitest";

import { Service } from "@/app/(protected)/finances/services/service.types";
import { formatPrice } from "@/lib/currency";

describe("Service card and training catalog categorization", () => {
  const sampleService: Service = {
    id: "svc_1766512498700",
    name: "Месечен абонамент - Деца до 13 г. (3 пъти седмично)",
    description:
      "Включва 12 тренировки на месец с лицензиран треньор, право на състезателна картотека към БФБадминтон и клубна фланелка при редовно посещение.",
    price: 30,
    currency: "EUR",
    type: "Абонамент",
    targetGroups: ["Деца"],
    billingPeriod: "Месечен",
    isCoachLed: true,
    requiresBooking: false,
    grantsLicense: true,
    grantsApparel: true,
    minMembers: 1,
    maxMembers: 16,
  };

  it("форматира цената в евро правилно", () => {
    expect(formatPrice(sampleService.price)).toContain("30");
    expect(formatPrice(sampleService.price)).toContain("€");
    expect(formatPrice(30.5)).toContain("30,5");
  });

  it("идентифицира правилно абонаментната природа и правата", () => {
    const isSubscription = [
      "Абонамент",
      "Годишен абонамент",
      "Членски внос",
    ].includes(sampleService.type);

    expect(isSubscription).toBe(true);
    expect(sampleService.grantsLicense).toBe(true);
    expect(sampleService.grantsApparel).toBe(true);
  });

  it("категоризира услугите в правилните групи без дублиране", () => {
    const services: Service[] = [
      sampleService,
      {
        ...sampleService,
        id: "svc_amateur",
        name: "Любители Абонамент",
        targetGroups: ["Любители"],
      },
      {
        ...sampleService,
        id: "svc_annual",
        name: "Годишен абонамент",
        type: "Годишен абонамент",
      },
      {
        ...sampleService,
        id: "svc_single",
        name: "Еднократно посещение",
        type: "Еднократно плащане",
        price: 5,
      },
      {
        ...sampleService,
        id: "svc_custom",
        name: "Специален турнирен пакет",
        type: "Турнирна такса",
      },
    ];

    const amateurSubs = services.filter(
      (s) =>
        (s.type === "Абонамент" || s.type === "Годишен абонамент") &&
        s.targetGroups?.includes("Любители")
    );
    const monthlySubs = services.filter(
      (s) => s.type === "Абонамент" && !s.targetGroups?.includes("Любители")
    );
    const annualSubs = services.filter(
      (s) =>
        s.type === "Годишен абонамент" && !s.targetGroups?.includes("Любители")
    );
    const membershipFees = services.filter(
      (s) => s.type === "Членски внос" && !s.targetGroups?.includes("Любители")
    );
    const oneTime = services.filter((s) => s.type === "Еднократно плащане");

    const displayedIds = new Set([
      ...monthlySubs.map((s) => s.id),
      ...annualSubs.map((s) => s.id),
      ...amateurSubs.map((s) => s.id),
      ...membershipFees.map((s) => s.id),
      ...oneTime.map((s) => s.id),
    ]);
    const otherServices = services.filter((s) => !displayedIds.has(s.id));

    expect(monthlySubs).toHaveLength(1);
    expect(monthlySubs[0].id).toBe("svc_1766512498700");
    expect(amateurSubs).toHaveLength(1);
    expect(amateurSubs[0].id).toBe("svc_amateur");
    expect(annualSubs).toHaveLength(1);
    expect(annualSubs[0].id).toBe("svc_annual");
    expect(oneTime).toHaveLength(1);
    expect(oneTime[0].id).toBe("svc_single");
    // Fallback handles unknown/custom service types
    expect(otherServices).toHaveLength(1);
    expect(otherServices[0].id).toBe("svc_custom");
  });
});
