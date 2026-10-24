import { describe, expect, it } from "vitest";

import {
  calculateTripStatementTotals,
  calculateTripTransportTotals,
  getEffectiveTripRates,
  isTripCoverageWithoutAccom,
} from "../lib/business-trip-calc";
import {
  getTripAttendanceNumber,
  getTripBaseNumber,
  getTripDecisionNumber,
  getTripFuelNumber,
  getTripOrderNumber,
  getTripReportNumber,
  getTripStatementNumber,
} from "../lib/business-trip-numbers";
import { BusinessTrip } from "../types/business-trip.types";

describe("Business Trip Per Diem & Accounting Calculations", () => {
  describe("getEffectiveTripRates", () => {
    it("should calculate 11 EUR no-stay rate for 22 EUR base rate", () => {
      const { fullRate, noStayRate } = getEffectiveTripRates(22);
      expect(fullRate).toBe(22);
      expect(noStayRate).toBe(11);
    });

    it("should keep 11 EUR as no-stay rate for 11 EUR base rate without dividing by 2 again", () => {
      // User scenario: trip created without overnight with 11 EUR statutory rate
      const { fullRate, noStayRate } = getEffectiveTripRates(11);
      expect(noStayRate).toBe(11); // NEVER 5.50 EUR
      expect(fullRate).toBe(22);
    });

    it("should return zero when base per diem is 0", () => {
      const { fullRate, noStayRate } = getEffectiveTripRates(0);
      expect(fullRate).toBe(0);
      expect(noStayRate).toBe(0);
    });
  });

  describe("isTripCoverageWithoutAccom", () => {
    it("should detect food_only, transport_only, and transport_and_food as without accommodation", () => {
      expect(isTripCoverageWithoutAccom("food_only")).toBe(true);
      expect(isTripCoverageWithoutAccom("transport_only")).toBe(true);
      expect(isTripCoverageWithoutAccom("transport_and_food")).toBe(true);
      expect(isTripCoverageWithoutAccom("food_and_sleep")).toBe(false);
      expect(isTripCoverageWithoutAccom("transport_food_sleep")).toBe(false);
    });
  });

  describe("calculateTripStatementTotals (User Scenarios)", () => {
    it("User Scenario 1: 2-day trip created without overnight (11 EUR) -> 2 days without overnight must be 22 EUR per person", () => {
      const trip: BusinessTrip = {
        id: "trip-user-1",
        siteId: "bkgalabovo",
        title: "Турнир Хасково (без нощувка)",
        destination: "Хасково",
        startDate: "2026-05-16T08:00:00.000Z",
        endDate: "2026-05-17T18:00:00.000Z",
        coachId: "coach-1",
        participantsIds: ["ath-1", "ath-2"],
        transportType: "club_paid",
        expensesCoverage: "food_only",
        financials: {
          perDiemRateEUR: 11,
          accommodationRateEUR: 0,
          isCommercialActivity: false,
        },
        status: "approved",
      };

      const result = calculateTripStatementTotals(trip);

      expect(result.plannedDays).toBe(2);
      expect(result.plannedNights).toBe(0); // Без планирани нощувки
      expect(result.activePeopleCount).toBe(3); // coach + 2 athletes

      // Every person should get 2 days * 11 EUR = 22 EUR (NOT 2 * 5.50 = 11 EUR)
      result.personTotals.forEach((p) => {
        expect(p.days).toBe(2);
        expect(p.nights).toBe(0);
        expect(p.stayedOvernight).toBe(false);
        expect(p.perDiemRateEUR).toBe(11);
        expect(p.diemTotalEUR).toBe(22);
        expect(p.accomTotalEUR).toBe(0);
        expect(p.totalEUR).toBe(22);
      });

      expect(result.calcPerDiemEUR).toBe(66); // 3 people * 22 EUR
      expect(result.calcAccomEUR).toBe(0);
    });

    it("User Scenario 2: 2-day trip created with overnight (22 EUR), but athletes stayed 0 nights -> 22 EUR per athlete", () => {
      const trip: BusinessTrip = {
        id: "trip-user-2",
        siteId: "bkgalabovo",
        title: "Държавно първенство София",
        destination: "София",
        startDate: "2026-06-01T08:00:00.000Z",
        endDate: "2026-06-02T18:00:00.000Z",
        coachId: "coach-1",
        participantsIds: ["ath-1"],
        transportType: "club_paid",
        expensesCoverage: "food_and_sleep",
        financials: {
          perDiemRateEUR: 22,
          accommodationRateEUR: 20,
          isCommercialActivity: false,
        },
        participantOverrides: {
          // Coach stayed 1 night
          coach: {
            actualDays: 2,
            actualNights: 1,
            stayedOvernight: true,
          },
          // Athlete stayed 0 nights (2 days without overnight)
          "ath-1": {
            actualDays: 2,
            actualNights: 0,
            stayedOvernight: false,
            note: "Отпаднал от турнира (без нощувка)",
          },
        },
        status: "approved",
      };

      const result = calculateTripStatementTotals(trip);

      const coachCalc = result.personTotals.find((p) => p.id === "coach")!;
      expect(coachCalc.days).toBe(2);
      expect(coachCalc.nights).toBe(1);
      expect(coachCalc.stayedOvernight).toBe(true);
      expect(coachCalc.perDiemRateEUR).toBe(22);
      expect(coachCalc.diemTotalEUR).toBe(44); // 2 * 22 EUR
      expect(coachCalc.accomTotalEUR).toBe(20); // 1 * 20 EUR
      expect(coachCalc.totalEUR).toBe(64);

      const athleteCalc = result.personTotals.find((p) => p.id === "ath-1")!;
      expect(athleteCalc.days).toBe(2);
      expect(athleteCalc.nights).toBe(0);
      expect(athleteCalc.stayedOvernight).toBe(false);
      expect(athleteCalc.perDiemRateEUR).toBe(11); // 50% of 22 EUR = 11 EUR
      expect(athleteCalc.diemTotalEUR).toBe(22); // 2 * 11 EUR (NOT 2 * 5.50 EUR!)
      expect(athleteCalc.accomTotalEUR).toBe(0);
      expect(athleteCalc.totalEUR).toBe(22);

      expect(result.calcPerDiemEUR).toBe(66); // 44 + 22
      expect(result.calcAccomEUR).toBe(20);
    });

    it("User Scenario 3: Legacy corrupt override with 5.50 EUR is automatically healed to 11 EUR", () => {
      const trip: BusinessTrip = {
        id: "trip-legacy",
        siteId: "bkgalabovo",
        title: "Турнир с предишна грешка 5.50 EUR",
        destination: "Пловдив",
        startDate: "2026-07-10T08:00:00.000Z",
        endDate: "2026-07-11T18:00:00.000Z",
        coachId: "coach-1",
        participantsIds: ["ath-1"],
        transportType: "club_paid",
        expensesCoverage: "food_only",
        financials: {
          perDiemRateEUR: 11,
          accommodationRateEUR: 0,
          isCommercialActivity: false,
        },
        participantOverrides: {
          "ath-1": {
            actualDays: 2,
            actualNights: 0,
            stayedOvernight: false,
            perDiemRateEUR: 5.5, // Corrupt legacy value
          },
        },
        status: "approved",
      };

      const result = calculateTripStatementTotals(trip);
      const athleteCalc = result.personTotals.find((p) => p.id === "ath-1")!;

      expect(athleteCalc.perDiemRateEUR).toBe(11); // Sanitized from 5.5 to 11
      expect(athleteCalc.diemTotalEUR).toBe(22); // 2 * 11 EUR = 22 EUR
    });
  });

  describe("calculateTripTransportTotals (User Commute & Early Return Scenarios)", () => {
    it("User Scenario A: 3-day Parvomay tournament without overnight, daily commute. Kids drop out on Day 2 -> 2 round trips * 140 km = 280 km", () => {
      const trip: BusinessTrip = {
        id: "trip-parvomay-commute",
        siteId: "bkgalabovo",
        title: "ДЛШ под 11 г. Първомай (ежедневно пътуване)",
        destination: "Първомай",
        startDate: "2026-06-10T08:00:00.000Z",
        endDate: "2026-06-12T18:00:00.000Z", // 3 planned days
        coachId: "coach-1",
        participantsIds: ["child-1", "child-2"],
        transportType: "fuel_only",
        expensesCoverage: "transport_and_food",
        vehicle: {
          brand: "Toyota Avensis",
          regNumber: "CT1234AB",
          fuelType: "diesel",
          fuelNorm: 6.5,
          commuteMode: "daily_commute",
          singleRoundTripKm: 140, // 1 round trip
          plannedTripsCount: 3,
        },
        financials: {
          perDiemRateEUR: 11,
          accommodationRateEUR: 0,
          isCommercialActivity: false,
        },
        actualDays: 2, // Returned after day 2
        status: "completed",
      };

      const result = calculateTripTransportTotals(trip, 1.35);
      expect(result.isDailyCommute).toBe(true);
      expect(result.actualTripsCount).toBe(2);
      expect(result.effectiveDistanceKm).toBe(280); // 2 * 140 km
      expect(result.calcFuelLiters).toBeCloseTo(18.2, 1);
      expect(result.calcFuelEUR).toBeCloseTo(24.57, 2);
    });

    it("User Scenario B: 3-day Sofia tournament without hotel cost (free lodging). Stayed overnight, kids dropped out Day 2 -> 1 single round trip", () => {
      const trip: BusinessTrip = {
        id: "trip-sofia-single",
        siteId: "bkgalabovo",
        title: "ДЛШ под 19 г. София (безплатен престой)",
        destination: "София",
        startDate: "2026-06-15T08:00:00.000Z",
        endDate: "2026-06-17T18:00:00.000Z", // 3 planned days
        coachId: "coach-1",
        participantsIds: ["child-1"],
        transportType: "fuel_only",
        expensesCoverage: "transport_and_food", // No hotel cost for club
        vehicle: {
          brand: "Toyota Avensis",
          regNumber: "CT1234AB",
          fuelType: "diesel",
          fuelNorm: 7.0,
          commuteMode: "single", // Stayed in Sofia! Not daily commute!
          distanceKm: 500, // Galabovo - Sofia - Galabovo total
        },
        financials: {
          perDiemRateEUR: 11,
          accommodationRateEUR: 0,
          isCommercialActivity: false,
        },
        actualDays: 2, // Returned on Day 2
        status: "completed",
      };

      const result = calculateTripTransportTotals(trip, 1.35);
      expect(result.isDailyCommute).toBe(false);
      expect(result.actualTripsCount).toBe(1);
      expect(result.effectiveDistanceKm).toBe(500); // exactly 1 round trip, NOT multiplied by days!
    });
  });

  describe("business-trip-numbers unique document identifiers", () => {
    it("should generate proper suffix codes for all document types", () => {
      const trip: BusinessTrip = {
        orderNumber: 1,
        title: 'Зона "Южна България"',
        destination: "Пловдив",
        startDate: "2026-01-18T07:00:00.000Z",
        endDate: "2026-01-18T18:00:00.000Z",
        coachId: "coach-1",
        participantsIds: [],
        status: "draft",
        transportType: "fuel_only",
        siteId: "bkgalabovo",
        financials: {
          perDiemRateEUR: 11,
          accommodationRateEUR: 0,
          isCommercialActivity: false,
        },
      };

      expect(getTripBaseNumber(trip)).toBe("1");
      expect(getTripOrderNumber(trip)).toBe("1-НР");
      expect(getTripDecisionNumber(trip)).toBe("1-УС");
      expect(getTripStatementNumber(trip)).toBe("1-ВД");
      expect(getTripFuelNumber(trip)).toBe("1-ПЛ");
      expect(getTripAttendanceNumber(trip)).toBe("1-ПС");
      expect(getTripReportNumber(trip)).toBe("1-ДК");
    });

    it("should handle trips without orderNumber with placeholder", () => {
      const trip = { siteId: "bkgalabovo" } as unknown as BusinessTrip;
      expect(getTripBaseNumber(trip)).toBe("____");
      expect(getTripOrderNumber(trip)).toBe("____");
      expect(getTripDecisionNumber(trip)).toBe("____");
      expect(getTripStatementNumber(trip)).toBe("____");
    });

    it("should preserve manual decision numbers if not auto-generated", () => {
      const trip: BusinessTrip = {
        orderNumber: 2,
        usDecision: "Протокол 45/2026",
        title: "Турнир",
        destination: "Варна",
        startDate: "2026-02-18T07:00:00.000Z",
        endDate: "2026-02-19T18:00:00.000Z",
        coachId: "coach-1",
        participantsIds: [],
        status: "approved",
        siteId: "bkgalabovo",
        financials: {
          perDiemRateEUR: 22,
          accommodationRateEUR: 20,
          isCommercialActivity: false,
        },
        transportType: "public",
      };

      expect(getTripDecisionNumber(trip)).toBe("Протокол 45/2026");
      expect(getTripOrderNumber(trip)).toBe("2-НР");
      expect(getTripStatementNumber(trip)).toBe("2-ВД");
    });
  });
});
