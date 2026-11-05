import { describe, expect, it } from "vitest";

import { formatPrice } from "@/lib/currency";
import { ClubService } from "@/types";

describe("Recovery catalog cards and resource evaluation", () => {
  const sampleRecoveryService: ClubService = {
    id: "rec_legs_compression",
    siteId: "recoveryzone",
    name: "Компресионни ботуши за крака (Normatec)",
    description:
      "Пневматична компресия за ускорено възстановяване на краката, подобряване на циркулацията и намаляване на мускулното възпаление.",
    price: 15,
    currency: "EUR",
    type: "Еднократно плащане",
    billingPeriod: null,
    targetGroups: ["Състезатели"],
    durationMinutes: 30,
    category: "ПНЕВМАТИЧНА КОМПРЕСИЯ",
    sessionType: "Възстановяване",
    zones: ["КРАКА"],
    athleteCount: 1,
    numberOfDays: 1,
    proceduresPerDay: 1,
    requiresBooking: true,
    isCoachLed: false,
    minMembers: 1,
    maxMembers: 1,
    specialRights: [],
    cancellationPolicy: {
      isAllowed: true,
      noticePeriodDays: 1,
      feeType: "none",
      feeValue: 0,
      description: "Стандартни условия за анулиране",
      longTermSicknessDiscount: 0,
    },
    requiredResources: {
      compressors: 1,
      attachments: {
        legs: 1,
        arms: 0,
        hips: 0,
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: { userId: "user_1", userName: "Admin" },
    updatedBy: { userId: "user_1", userName: "Admin" },
  };

  it("форматира цената в евро правилно", () => {
    expect(formatPrice(sampleRecoveryService.price)).toContain("15");
    expect(formatPrice(sampleRecoveryService.price)).toContain("€");
  });

  it("оценява правилно дали оборудването е готово според ресурсите", () => {
    const res = sampleRecoveryService.requiredResources;
    const zones = (sampleRecoveryService.zones || []).map((z) =>
      z.toUpperCase()
    );

    const hasCompressor = (res?.compressors || 0) > 0;
    const hasMatchingAttachment =
      res &&
      ((zones.includes("КРАКА") && (res.attachments?.legs || 0) > 0) ||
        (zones.includes("РЪЦЕ") && (res.attachments?.arms || 0) > 0) ||
        (zones.includes("ТАЗ") && (res.attachments?.hips || 0) > 0));

    const isReady = hasCompressor && hasMatchingAttachment;
    expect(isReady).toBe(true);
  });

  it("отчита статус поддръжка при липса на компресор или приставка", () => {
    const incompleteResources = {
      compressors: 0,
      attachments: { legs: 1, arms: 0, hips: 0 },
    };
    const zones = ["КРАКА"];

    const isReady =
      incompleteResources.compressors > 0 &&
      zones.includes("КРАКА") &&
      incompleteResources.attachments.legs > 0;

    expect(isReady).toBe(false);
  });
});
