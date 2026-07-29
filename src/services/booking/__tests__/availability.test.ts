import { describe, it, expect } from "vitest";
import { calculateAvailability } from "../availability";
import { Reservation } from "@/types/reservation";
import { ResourceRequirements } from "@/types/booking.types";

describe("booking availability", () => {
  const targetDate = new Date("2026-08-01T12:00:00.000Z");

  const siteInventory: ResourceRequirements = {
    attachments: {
      arms: 2,
      hips: 2,
      legs: 2,
    },
    compressors: 2,
  };

  it("calculates availability slots within operating hours", () => {
    const slots = calculateAvailability([], targetDate, siteInventory, { start: 8, end: 12 });
    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0].isLocked).toBe(false);
    expect(slots[0].availableResources.compressors).toBe(2);
  });

  it("locks or reduces resources when reservations use resources", () => {
    const mockReservations: any[] = [
      {
        id: "res1",
        startTime: new Date("2026-08-01T09:00:00+03:00"), // 09:00 in Sofia
        endTime: new Date("2026-08-01T10:00:00+03:00"),
        status: "confirmed",
        siteId: "site1",
        memberId: "m1",
        clientName: "Иван",
        clientPhone: "123",
        serviceId: "s1",
        serviceName: "Компресия крака",
        isExclusive: true,
        usedResources: {
          attachments: { arms: 0, hips: 0, legs: 2 },
          compressors: 2,
        },
        createdAt: new Date("2026-07-01"),
      },
    ];

    const slots = calculateAvailability(mockReservations, targetDate, siteInventory, { start: 8, end: 12 });

    const reservedSlots = slots.filter((s) => s.availableResources.compressors === 0 || s.isLocked);
    expect(reservedSlots.length).toBeGreaterThan(0);
  });
});
