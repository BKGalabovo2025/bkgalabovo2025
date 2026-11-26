import { describe, expect, it } from "vitest";

import { SiteConfig } from "../config/sites";
import {
  buildTripRouteDescription,
  buildTripRouteLabel,
  calculateTripExpensesSummary,
  calculateTripStatementTotals,
  calculateTripTransportTotals,
  calculateTripVehiclesBreakdown,
  COACH_ORIGIN_ONE_WAY_KM,
  COACH_ORIGIN_ROUND_TRIP_KM,
  getDriverDistanceKmForTrip,
  getEffectiveTripRates,
  isCoachMiraGeorgieva,
  isTripCoverageWithoutAccom,
  resolvePersonRate,
  usesCoachOriginRoute,
} from "../lib/business-trip-calc";
import {
  getTripAttendanceNumber,
  getTripBaseNumber,
  getTripDecisionNumber,
  getTripFuelNumber,
  getTripOrderNumber,
  getTripProtocolNumber,
  getTripReportNumber,
  getTripStatementNumber,
} from "../lib/business-trip-numbers";
import {
  cleanProtocolText,
  extractBoardMembers,
  formatOrgName,
  generateDefaultProtocolText,
  isFemalePerson,
} from "../lib/business-trip-protocol";
import {
  buildStaySectionText,
  generateDefaultReportText,
} from "../lib/business-trip-report";
import { BusinessTrip } from "../types/business-trip.types";
import { Member } from "../types/member.types";

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

  describe("resolvePersonRate", () => {
    it("heals only the legacy halved rate (5.50 when no-stay rate is 11)", () => {
      expect(resolvePersonRate(5.5, true, 11, 22)).toBe(11);
      expect(resolvePersonRate(5.5, false, 11, 22)).toBe(22);
    });

    it("keeps legitimate manual overrides, including small values and zero", () => {
      expect(resolvePersonRate(5, true, 11, 22)).toBe(5);
      expect(resolvePersonRate(0, true, 11, 22)).toBe(0);
      expect(resolvePersonRate(15, false, 11, 22)).toBe(15);
    });

    it("falls back to the standard rates when there is no override", () => {
      expect(resolvePersonRate(undefined, true, 11, 22)).toBe(11);
      expect(resolvePersonRate(undefined, false, 11, 22)).toBe(22);
    });
  });

  describe("excluded participants and overrides", () => {
    const baseTrip: BusinessTrip = {
      id: "trip-excl",
      siteId: "bkgalabovo",
      title: "Турнир",
      destination: "Хасково",
      startDate: "2026-05-16T08:00:00.000Z",
      endDate: "2026-05-17T18:00:00.000Z",
      coachId: "coach-1",
      participantsIds: ["ath-1", "ath-2", "ath-3"],
      transportType: "club_paid",
      expensesCoverage: "food_only",
      financials: {
        perDiemRateEUR: 11,
        accommodationRateEUR: 0,
        isCommercialActivity: false,
      },
      status: "approved",
    };

    it("does not count excluded participants in the statement", () => {
      const trip: BusinessTrip = {
        ...baseTrip,
        participantOverrides: { "ath-3": { excluded: true } },
      };
      const result = calculateTripStatementTotals(trip);
      expect(result.activePeopleCount).toBe(3); // coach + 2
      expect(result.calcPerDiemEUR).toBe(66); // 3 * 2 days * 11
    });

    it("supports a manual per diem override of 0 for one person", () => {
      const trip: BusinessTrip = {
        ...baseTrip,
        participantOverrides: { "ath-1": { perDiemRateEUR: 0 } },
      };
      const result = calculateTripStatementTotals(trip);
      const ath1 = result.personTotals.find((p) => p.id === "ath-1");
      expect(ath1?.diemTotalEUR).toBe(0);
      expect(result.calcPerDiemEUR).toBe(66); // coach + 2 athletes * 22
    });

    it("treats perDiemOverrideEUR of 0 as no per diem", () => {
      const trip: BusinessTrip = {
        ...baseTrip,
        financials: { ...baseTrip.financials, perDiemOverrideEUR: 0 },
      };
      expect(calculateTripStatementTotals(trip).calcPerDiemEUR).toBe(0);
    });
  });

  describe("calculateTripTransportTotals - public transport and days", () => {
    const publicTrip: BusinessTrip = {
      id: "trip-public",
      siteId: "bkgalabovo",
      title: "Турнир",
      destination: "София",
      startDate: "2026-05-16T08:00:00.000Z",
      endDate: "2026-05-17T18:00:00.000Z",
      coachId: "coach-1",
      participantsIds: ["ath-1", "ath-2"],
      transportType: "public",
      publicTransportDailyFareEUR: 10,
      expensesCoverage: "transport_and_food",
      financials: {
        perDiemRateEUR: 11,
        accommodationRateEUR: 0,
        isCommercialActivity: false,
      },
      status: "approved",
    };

    it("charges all people for every planned day by default", () => {
      expect(
        calculateTripTransportTotals(publicTrip).calcPublicTransportEUR
      ).toBe(
        60 // 3 people * 2 days * 10
      );
    });

    it("does not charge excluded participants", () => {
      const trip: BusinessTrip = {
        ...publicTrip,
        participantOverrides: { "ath-2": { excluded: true } },
      };
      expect(calculateTripTransportTotals(trip).calcPublicTransportEUR).toBe(
        40 // 2 people * 2 days * 10
      );
    });

    it("uses per-person days when no explicit public transport days are set", () => {
      const trip: BusinessTrip = {
        ...publicTrip,
        participantOverrides: { "ath-2": { actualDays: 1 } },
      };
      expect(calculateTripTransportTotals(trip).calcPublicTransportEUR).toBe(
        50 // (2 + 2 + 1) * 10
      );
    });

    it("daily commute trips follow the longest-attending active person, not only the coach", () => {
      const trip: BusinessTrip = {
        ...publicTrip,
        transportType: "fuel_only",
        vehicle: {
          commuteMode: "daily_commute",
          singleRoundTripKm: 100,
          distanceKm: 200,
          plannedTripsCount: 2,
        },
        participantOverrides: { coach: { actualDays: 1 } },
      };
      // athletes still attended 2 days -> vehicle made 2 trips
      expect(calculateTripTransportTotals(trip).actualTripsCount).toBe(2);
      expect(calculateTripTransportTotals(trip).effectiveDistanceKm).toBe(200);
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
      expect(getTripProtocolNumber(trip)).toBe("1-ПР");
    });

    it("should handle trips without orderNumber with placeholder", () => {
      const trip = { siteId: "bkgalabovo" } as unknown as BusinessTrip;
      expect(getTripBaseNumber(trip)).toBe("____");
      expect(getTripOrderNumber(trip)).toBe("____");
      expect(getTripDecisionNumber(trip)).toBe("____");
      expect(getTripProtocolNumber(trip)).toBe("____");
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
      expect(
        getTripProtocolNumber({ ...trip, usProtocolNumber: "07/2026" })
      ).toBe("07/2026");
      expect(getTripStatementNumber(trip)).toBe("2-ВД");
    });
  });

  describe("Board Protocol Generator (generateDefaultProtocolText)", () => {
    const mockSite = {
      id: "bkgalabovo",
      name: 'СНЦ "Бадминтон клуб Гълъбово"',
      shortName: "Бадминтон клуб Гълъбово",
      themeColor: "#1e3a8a",
      contact: {
        address: "гр. Гълъбово",
        phone: "+359 899 82 99 23",
        mol: "Мира Георгиева",
      },
    };

    const mockCoach = {
      id: "coach-1",
      firstName: "Пламен",
      lastName: "Михалев",
      isCoach: true,
    } as unknown as Member;

    const mockPlayer = {
      id: "player-1",
      firstName: "Георги",
      lastName: "Иванов",
      isCoach: false,
    } as unknown as Member;

    const mockMembers = {
      "coach-1": mockCoach,
      "player-1": mockPlayer,
    };

    const baseTrip: BusinessTrip = {
      orderNumber: 5,
      title: "Държавно първенство по бадминтон",
      destination: "Хасково",
      startDate: "2026-03-10T08:00:00.000Z",
      endDate: "2026-03-11T18:00:00.000Z",
      coachId: "coach-1",
      participantsIds: ["player-1"],
      status: "approved",
      siteId: "bkgalabovo",
      financials: {
        perDiemRateEUR: 22,
        accommodationRateEUR: 25,
        isCommercialActivity: false,
      },
      transportType: "public",
    };

    it("should generate complete protocol text with defaults", () => {
      const text = generateDefaultProtocolText(
        baseTrip,
        mockSite as unknown as SiteConfig,
        mockMembers
      );

      expect(text).toContain("протокол № 5-ПР");
      expect(text).toContain(
        "Управителния съвет на СНЦ „Бадминтон клуб Гълъбово“"
      );
      expect(text).not.toContain('„СНЦ "Бадминтон клуб Гълъбово"“');
      expect(text).toContain("Държавно първенство по бадминтон");
      expect(text).toContain("Пламен Михалев");
      expect(text).toContain("Георги Иванов");
      expect(text).toContain("№ 5-УС");
      expect(text).toContain("№ 5-НР");
      expect(text).toContain("5-ПР");
    });

    it("should allow custom overrides for date, time, location, chair and secretary", () => {
      const text = generateDefaultProtocolText(
        baseTrip,
        mockSite as unknown as SiteConfig,
        mockMembers,
        {
          meetingDate: "2026-03-08",
          meetingTime: "19:30 ч.",
          meetingLocation: "гр. Стара Загора, зала Тракия",
          meetingChair: "Иван Тодоров",
          meetingSecretary: "Мария Петрова",
          boardMembers: "1. Иван Тодоров\n2. Мария Петрова\n3. Димитър Стоянов",
        }
      );

      expect(text).toContain("08.03.2026 г.");
      expect(text).toContain("19:30 ч.");
      expect(text).toContain("гр. Стара Загора, зала Тракия");
      expect(text).toContain("Иван Тодоров");
      expect(text).toContain("Мария Петрова");
      expect(text).toContain("Димитър Стоянов");
    });

    it("should accurately reflect user's exact parameters: 9-ПР, 15.10.2026 г., 18:30 ч., зала Енергетик and 3 members", () => {
      const userTrip: BusinessTrip = {
        ...baseTrip,
        usProtocolNumber: "9-ПР",
        usDecisionDate: "15.10.2026 г.",
        usMeetingTime: "18:30 ч.",
        usMeetingLocation: 'Спортна зала "Енергетик" град Гълъбово',
        usMeetingChair: "Мира Георгиева",
        usMeetingSecretary: "Невена Георгиева",
        usBoardMembers:
          "1. Мира Георгиева — Председател на Управителния съвет\n2. Невена Георгиева - Член на Управителния съвет (редовно уведомен по установения ред)\n3. Наско Маджаров - Член на Управителния съвет (редовно уведомен по установения ред)",
      };

      expect(getTripProtocolNumber(userTrip)).toBe("9-ПР");

      const text = generateDefaultProtocolText(
        userTrip,
        mockSite as unknown as SiteConfig,
        mockMembers,
        {
          meetingDate: userTrip.usDecisionDate,
          meetingTime: userTrip.usMeetingTime,
          meetingLocation: userTrip.usMeetingLocation,
          meetingChair: userTrip.usMeetingChair,
          meetingSecretary: userTrip.usMeetingSecretary,
          boardMembers: userTrip.usBoardMembers,
          protocolNumber: userTrip.usProtocolNumber,
        }
      );

      expect(text).toContain("15.10.2026 г.");
      expect(text).toContain("18:30 ч.");
      expect(text).toContain('Спортна зала "Енергетик" град Гълъбово');
      expect(text).toContain("Мира Георгиева");
      expect(text).toContain("Невена Георгиева");
      expect(text).toContain("Наско Маджаров");
      expect(text).toContain("протокол № 9-ПР");
      // Проверка за женски род (Мира Георгиева) и състезателен календар
      expect(text).toContain(
        "За водещ заседанието бе определена Мира Георгиева"
      );
      expect(text).toContain("Тя запозна присъстващите");
      expect(text).toContain("официалната Наредба (регламент) на БФ Бадминтон");
      expect(text).toContain("съгласно Устава на сдружението кворум");
      expect(text).not.toContain("Той запозна");
      expect(text).not.toContain("поканата от БФ Бадминтон");
      expect(text).not.toContain("ЗЮЛНЦ");
      expect(text).not.toContain("чл. 32");
      // Проверка за изписване на името на клуба вместо "клубния отбор"
      expect(text).toContain(
        "1. Одобрява участието на „Бадминтон клуб Гълъбово“ в"
      );
      expect(text).not.toContain("Одобрява участието на клубния отбор");
    });

    it("should format organization name correctly without nested or doubled quotation marks", () => {
      expect(formatOrgName('СНЦ "Бадминтон клуб Гълъбово"')).toBe(
        "СНЦ „Бадминтон клуб Гълъбово“"
      );
      expect(formatOrgName('СНЦ "Бадминтон клуб Гълъбово"', true)).toBe(
        "СНЦ „БАДМИНТОН КЛУБ ГЪЛЪБОВО“"
      );
      expect(formatOrgName('„СНЦ "БАДМИНТОН КЛУБ ГЪЛЪБОВО""', true)).toBe(
        "СНЦ „БАДМИНТОН КЛУБ ГЪЛЪБОВО“"
      );
      expect(formatOrgName("Бадминтон клуб Гълъбово", true)).toBe(
        "„БАДМИНТОН КЛУБ ГЪЛЪБОВО“"
      );
      expect(formatOrgName("Бадминтон клуб Гълъбово")).toBe(
        "„Бадминтон клуб Гълъбово“"
      );
    });

    it("should clean up doubled quotation marks in stored protocol text", () => {
      const dirty =
        'ОТ ЗАСЕДАНИЕ НА УПРАВИТЕЛНИЯ СЪВЕТ НА „СНЦ "БАДМИНТОН КЛУБ ГЪЛЪБОВО"" се проведе заседание на „СНЦ "Бадминтон клуб Гълъбово"“.';
      const cleaned = cleanProtocolText(dirty);
      expect(cleaned).toContain("СНЦ „БАДМИНТОН КЛУБ ГЪЛЪБОВО“");
      expect(cleaned).toContain("СНЦ „Бадминтон клуб Гълъбово“");
      expect(cleaned).not.toContain('„СНЦ "БАДМИНТОН КЛУБ ГЪЛЪБОВО""');
      expect(cleaned).not.toContain('„СНЦ "Бадминтон клуб Гълъбово"“');
    });

    it("should accurately detect female names according to Bulgarian grammar", () => {
      expect(isFemalePerson("Мира Георгиева")).toBe(true);
      expect(isFemalePerson("Невена Георгиева")).toBe(true);
      expect(isFemalePerson("Мария Петрова")).toBe(true);
      expect(isFemalePerson("Пламен Михалев")).toBe(false);
      expect(isFemalePerson("Георги Иванов")).toBe(false);
      expect(isFemalePerson("Никола Иванов")).toBe(false);
      expect(isFemalePerson("Иван Тодоров")).toBe(false);
    });

    it("should heal legacy text with 'поканата от БФ Бадминтон' and male pronoun for female chair", () => {
      const legacy =
        "Думата бе дадена на Председателя на УС Мира Георгиева. Той запозна членовете с поканата от БФ Бадминтон, графика на състезанието и предложи клубна делегация. Присъства необходимият съгласно чл. 32 от ЗЮЛНЦ и разпоредбите на Устава кворум.";
      const healed = cleanProtocolText(legacy, true);
      expect(healed).toContain("Тя запозна");
      expect(healed).toContain(
        "официалната Наредба (регламент) на БФ Бадминтон"
      );
      expect(healed).toContain("съгласно Устава на сдружението");
      expect(healed).not.toContain("Той запозна");
      expect(healed).not.toContain("поканата от БФ Бадминтон");
      expect(healed).not.toContain("ЗЮЛНЦ");
      expect(healed).not.toContain("чл. 32");
    });

    it("should correctly extract board members from quorum text, excluding chair and placeholders", () => {
      const quorumText = `1. Мира Георгиева — Председател на Управителния съвет
2. Невена Георгиева - Член на Управителния съвет (редовно уведомен по установения ред)
3. Наско Маджаров - Член на Управителния съвет (редовно уведомен по установения ред)`;

      const members = extractBoardMembers(quorumText, "Мира Георгиева");
      expect(members).toEqual(["Невена Георгиева", "Наско Маджаров"]);

      // Generic placeholder should return empty array
      const genericText = `1. Мира Георгиева — Председател на Управителния съвет
2. Членове на Управителния съвет (редовно уведомени по установения ред)`;
      expect(extractBoardMembers(genericText, "Мира Георгиева")).toEqual([]);

      // Bullet points or plain lines
      const bulletText = `• Невена Георгиева
• Наско Маджаров`;
      expect(extractBoardMembers(bulletText)).toEqual([
        "Невена Георгиева",
        "Наско Маджаров",
      ]);
    });
  });

  describe("Business Trip Report - Daily Commute (Kasabyan Brothers Scenario)", () => {
    const membersDict: Record<string, Member> = {
      "coach-1": {
        id: "coach-1",
        firstName: "Мира",
        lastName: "Георгиева",
        isCoach: true,
      } as Member,
      "ath-1": {
        id: "ath-1",
        firstName: "Добромир",
        lastName: "Добрев",
      } as Member,
      "ath-2": {
        id: "ath-2",
        firstName: "Габриела",
        lastName: "Атанасова",
      } as Member,
      "ath-3": {
        id: "ath-3",
        firstName: "Неделин",
        lastName: "Маринов",
      } as Member,
      "ath-4": {
        id: "ath-4",
        firstName: "Живко",
        lastName: "Иванов",
      } as Member,
    };

    it("should generate correct stay and transport section for 3-day daily commute with free transport and food_only", () => {
      const trip: BusinessTrip = {
        id: "trip-kasabyan-2026",
        siteId: "bkgalabovo",
        title: "INTERNATIONAL TOURNAMENT „KASABYAN BROTHERS„ 2026",
        destination: "Хасково",
        startDate: "2026-01-09T08:00:00.000Z",
        endDate: "2026-01-11T18:00:00.000Z",
        coachId: "coach-1",
        coachName: "Мира Георгиева",
        coachRole: "Треньор",
        participantsIds: ["ath-1", "ath-2", "ath-3", "ath-4"],
        transportType: "free",
        expensesCoverage: "food_only",
        vehicle: {
          commuteMode: "daily_commute",
          singleRoundTripKm: 105,
          distanceKm: 315,
          plannedTripsCount: 3,
        },
        financials: {
          perDiemRateEUR: 11,
          accommodationRateEUR: 0,
          isCommercialActivity: false,
        },
        status: "approved",
      };

      const staySection = buildStaySectionText(trip, membersDict);

      // Must NOT contain overnight stays
      expect(staySection).not.toContain("2 нощувки на място");
      expect(staySection).not.toContain("нощувки на място");

      // Must explicitly mention daily commute and no hotel used
      expect(staySection).toContain(
        "• Престой и настаняване: Отборът участва в режим на ежедневно пътуване (всеки ден отиване и връщане без нощувка) в рамките на 3 дни. Не са ползвани хотелски услуги (без преспиване на място)."
      );

      // Must explicitly mention daily commute courses and km for free transport
      expect(staySection).toContain(
        "• Транспорт (ежедневно пътуване без нощувка): Организиран и осигурен безплатно (осъществени са 3 курса отиване и връщане по маршрут гр. Гълъбово – гр. Хасково – гр. Гълъбово, 1 курс = 105 км, общо 315 км, без транспортен разход за клуба)."
      );

      // Must mention per diem
      expect(staySection).toContain(
        "• Финансово обезпечаване: На командированите лица са начислени и изплатени полагащите се командировъчни пари (дневни в размер на 11.00 € на ден на лице съгласно Наредбата за командировките в страната), подробно отразени във Финансовата ведомост."
      );
    });

    it("should generate correct section 3 in full report text", () => {
      const trip: BusinessTrip = {
        id: "trip-kasabyan-2026",
        siteId: "bkgalabovo",
        title: "INTERNATIONAL TOURNAMENT „KASABYAN BROTHERS„ 2026",
        destination: "Хасково",
        startDate: "2026-01-09T08:00:00.000Z",
        endDate: "2026-01-11T18:00:00.000Z",
        coachId: "coach-1",
        coachName: "Мира Георгиева",
        coachRole: "Треньор",
        participantsIds: ["ath-1", "ath-2", "ath-3", "ath-4"],
        transportType: "free",
        expensesCoverage: "food_only",
        vehicle: {
          commuteMode: "daily_commute",
          singleRoundTripKm: 105,
          distanceKm: 315,
          plannedTripsCount: 3,
        },
        financials: {
          perDiemRateEUR: 11,
          accommodationRateEUR: 0,
          isCommercialActivity: false,
        },
        status: "approved",
      };

      const fullReport = generateDefaultReportText(trip, membersDict);

      expect(fullReport).toContain(
        "3. ТРАНСПОРТ, ПРЕСТОЙ И МАТЕРИАЛНО-ФИНАНСОВО ОБЕЗПЕЧАВАНЕ:"
      );
      expect(fullReport).toContain(
        "ежедневно пътуване (всеки ден отиване и връщане без нощувка)"
      );
      expect(fullReport).not.toContain("2 нощувки на място");
    });

    it("should format single-day commute and protocol file name accurately", () => {
      const trip: BusinessTrip = {
        id: "trip-single-day",
        siteId: "bkgalabovo",
        title: "Държавно отборно първенство за момчета и момичета под 13 г.",
        destination: "Хасково",
        startDate: "2026-03-14T08:00:00.000Z",
        endDate: "2026-03-15T18:00:00.000Z",
        actualDays: 1,
        coachId: "coach-1",
        coachName: "Мира Георгиева",
        coachRole: "Треньор",
        participantsIds: ["ath-1", "ath-2"],
        participantOverrides: {
          coach: { actualDays: 1 },
          "ath-1": { actualDays: 1 },
          "ath-2": {
            actualDays: 1,
            stayedOvernight: false,
            note: "индивидуална промяна",
          },
        },
        transportType: "free",
        expensesCoverage: "food_only",
        vehicle: {
          commuteMode: "daily_commute",
          distanceKm: 105,
          plannedTripsCount: 1,
        },
        financials: {
          perDiemRateEUR: 11,
          accommodationRateEUR: 0,
          isCommercialActivity: false,
        },
        matchProtocols: [
          {
            id: "proto-1",
            name: "Класиране -Държавно отборно първенство за момчета и момичета под 13 г..pdf",
            url: "https://example.com/proto.pdf",
            size: 1024,
            contentType: "application/pdf",
            createdAt: "2026-03-14T18:00:00.000Z",
          },
        ],
        attachMatchProtocols: true,
        status: "approved",
      };

      const fullReport = generateDefaultReportText(trip, membersDict);

      expect(fullReport).toContain(
        "Пътуването и участието се осъществиха в режим на еднодневно пътуване (отиване и връщане без нощувка), с индивидуална промяна за част от отбора"
      );
      expect(fullReport).toContain(
        "Приложени: Класиране -Държавно отборно първенство за момчета и момичета под 13 г..pdf"
      );
    });
  });

  describe("calculateTripExpensesSummary", () => {
    it("should compute fuel cost from liters * unit price and not sum unit price as flat EUR", () => {
      const trip: BusinessTrip = {
        id: "trip-summary-1",
        siteId: "bkgalabovo",
        title: "ДЛОП",
        destination: "Пловдив",
        startDate: "2026-04-10T08:00:00.000Z",
        endDate: "2026-04-10T18:00:00.000Z",
        coachId: "coach-1",
        participantsIds: ["ath-1"],
        transportType: "fuel_only",
        expensesCoverage: "transport_and_food",
        vehicle: {
          commuteMode: "daily_commute",
          singleRoundTripKm: 200,
          distanceKm: 200,
          plannedTripsCount: 1,
          fuelNorm: 10, // 20 liters
        },
        financials: {
          perDiemRateEUR: 11,
          accommodationRateEUR: 0,
          isCommercialActivity: false,
        },
        status: "approved",
      };

      const summary = calculateTripExpensesSummary(trip, [
        {
          id: "exp-fuel",
          tripId: "trip-summary-1",
          siteId: "bkgalabovo",
          expenseType: "fuel",
          amountEUR: 1.5, // €1.50 per liter (NOT flat invoice total)
          documentNumber: "0001",
          documentDate: "2026-04-10",
          createdAt: "2026-04-10T10:00:00.000Z",
        },
        {
          id: "exp-toll",
          tripId: "trip-summary-1",
          siteId: "bkgalabovo",
          expenseType: "other",
          amountEUR: 5,
          documentNumber: "0002",
          documentDate: "2026-04-10",
          createdAt: "2026-04-10T10:05:00.000Z",
        },
      ]);

      expect(summary.nonFuelExpensesEUR).toBe(5);
      expect(summary.calcFuelLiters).toBe(20);
      expect(summary.calcFuelEUR).toBeGreaterThan(29);
      expect(summary.invoicedPlusFuelEUR).toBeCloseTo(
        5 + summary.calcFuelEUR,
        2
      );
      expect(summary.calcPerDiemEUR).toBe(22); // coach + 1 athlete * 11 EUR
    });

    it("prevents double per-diem and accommodation when coach participates as athlete (coachIsAthlete)", () => {
      // Mira Georgieva as coach ("mira-georgieva") and also listed as participant
      const trip: BusinessTrip = {
        id: "trip-mira-1",
        siteId: "bkgalabovo",
        title: "Държавно първенство - жени",
        destination: "Хасково",
        startDate: "2026-05-15T08:00:00.000Z",
        endDate: "2026-05-16T18:00:00.000Z",
        coachId: "mira-georgieva",
        coachName: "Мира Георгиева",
        coachRole: "Треньор и състезател",
        coachIsAthlete: true,
        // Even if her ID is included in participantsIds alongside other athletes:
        participantsIds: ["mira-georgieva", "ath-2", "ath-3"],
        transportType: "club_paid",
        expensesCoverage: "food_and_sleep",
        financials: {
          perDiemRateEUR: 22,
          accommodationRateEUR: 25,
          isCommercialActivity: false,
        },
        status: "approved",
      };

      const statement = calculateTripStatementTotals(trip);

      // Should count exactly 3 distinct people: coach (Mira) + ath-2 + ath-3 (NOT 4 people!)
      expect(statement.activePeopleCount).toBe(3);
      expect(statement.personTotals).toHaveLength(3);

      // Verify that "mira-georgieva" is not duplicated in personTotals (only "coach", "ath-2", "ath-3")
      const personIds = statement.personTotals.map((p) => p.id);
      expect(personIds).toEqual(["coach", "ath-2", "ath-3"]);

      // 2 days * 22 EUR = 44 EUR per diem per person. 3 people = 132 EUR (NOT 176 EUR!)
      expect(statement.calcPerDiemEUR).toBe(3 * 44);

      // 1 night * 25 EUR = 25 EUR accommodation per person. 3 people = 75 EUR (NOT 100 EUR!)
      expect(statement.calcAccomEUR).toBe(3 * 25);
    });
  });

  describe("Coach Origin Route (Haskovo <-> Galabovo Energetik <-> Destination)", () => {
    it("recognizes Mira Georgieva and 48/96 km constants", () => {
      expect(COACH_ORIGIN_ONE_WAY_KM).toBe(48);
      expect(COACH_ORIGIN_ROUND_TRIP_KM).toBe(96);
      expect(isCoachMiraGeorgieva("Мира Георгиева")).toBe(true);
      expect(isCoachMiraGeorgieva(undefined, "Мира", "Георгиева")).toBe(true);
      expect(isCoachMiraGeorgieva("Иван Петров")).toBe(false);
    });

    it("applies Haskovo -> Energetik route ONLY for fuel_only, never for free/club_paid/public", () => {
      const baseTrip = {
        destination: "гр. София",
        coachName: "Мира Георгиева",
      };

      expect(
        usesCoachOriginRoute({ ...baseTrip, transportType: "fuel_only" })
      ).toBe(true);
      expect(usesCoachOriginRoute({ ...baseTrip, transportType: "free" })).toBe(
        false
      );
      expect(
        usesCoachOriginRoute({ ...baseTrip, transportType: "club_paid" })
      ).toBe(false);
      expect(
        usesCoachOriginRoute({ ...baseTrip, transportType: "public" })
      ).toBe(false);
      expect(
        usesCoachOriginRoute({
          ...baseTrip,
          transportType: "fuel_only",
          vehicle: { includeCoachOriginLeg: false },
        })
      ).toBe(false);
    });

    it("builds full Haskovo-Energetik-Destination route label and description for fuel_only", () => {
      const label = buildTripRouteLabel({
        transportType: "fuel_only",
        coachName: "Мира Георгиева",
        destination: "гр. София",
      });
      expect(label).toBe(
        "гр. Хасково — гр. Гълъбово (Спортна зала „Енергетик“) — гр. София — гр. Гълъбово (Спортна зала „Енергетик“) — гр. Хасково"
      );

      const desc = buildTripRouteDescription({
        transportType: "fuel_only",
        coachName: "Мира Георгиева",
        destination: "гр. Хасково",
      });
      expect(desc).toContain("гр. Хасково");
      expect(desc).toContain("Спортна зала „Енергетик“");

      const freeLabel = buildTripRouteLabel({
        transportType: "free",
        coachName: "Мира Георгиева",
        destination: "гр. София",
      });
      expect(freeLabel).toBe("гр. Гълъбово — гр. София — гр. Гълъбово");
      expect(
        buildTripRouteDescription({
          transportType: "free",
          coachName: "Мира Георгиева",
          destination: "гр. София",
        })
      ).toBeNull();
    });

    it("includes Haskovo-Energetik route in protocol & report text for fuel_only, and excludes it for free", () => {
      const baseTrip: BusinessTrip = {
        id: "t-route",
        orderNumber: 5,
        title: "Държавно първенство",
        destination: "гр. София",
        startDate: "2026-04-10T08:00:00.000Z",
        endDate: "2026-04-12T18:00:00.000Z",
        coachId: "mira",
        coachName: "Мира Георгиева",
        participantsIds: ["ath-1"],
        status: "approved",
        transportType: "fuel_only",
        siteId: "bkgalabovo",
        vehicle: {
          distanceKm: 616,
          fuelNorm: 6.5,
          commuteMode: "single",
        },
        financials: {
          perDiemRateEUR: 22,
          accommodationRateEUR: 25,
          isCommercialActivity: false,
        },
      };

      const site: SiteConfig = {
        id: "bkgalabovo",
        name: "Бадминтон клуб Гълъбово",
        shortName: "БК Гълъбово",
        domain: "bkgalabovo.bg",
        contact: {
          mol: "Мира Георгиева",
          email: "info@bkgalabovo.bg",
          phone: "0888000000",
          address: "гр. Гълъбово",
        },
        theme: {
          primaryColor: "#000000",
          accentColor: "#ffffff",
        },
      } as unknown as SiteConfig;

      const protocolFuel = generateDefaultProtocolText(baseTrip, site, {});
      expect(protocolFuel).toContain("гр. Хасково");
      expect(protocolFuel).toContain("Спортна зала „Енергетик“");

      const reportFuel = generateDefaultReportText(baseTrip, {}, false);
      expect(reportFuel).toContain("гр. Хасково");
      expect(reportFuel).toContain("Спортна зала „Енергетик“");

      const freeTrip: BusinessTrip = { ...baseTrip, transportType: "free" };
      const protocolFree = generateDefaultProtocolText(freeTrip, site, {});
      const reportFree = generateDefaultReportText(freeTrip, {}, false);
      expect(protocolFree).not.toContain("Спортна зала „Енергетик“");
      expect(reportFree).not.toContain("Спортна зала „Енергетик“");
    });
  });

  describe("Multi-vehicle trips (2nd and 3rd personal cars with shared fuel invoice)", () => {
    it("sums fuel liters and costs across 3 vehicles using one shared fuel price per liter", () => {
      const multiTrip: BusinessTrip = {
        id: "trip-multi-1",
        siteId: "bkgalabovo",
        title: "Държавно първенство - мъже и жени",
        destination: "Първомай",
        startDate: "2026-11-21T08:00:00.000Z",
        endDate: "2026-11-22T18:00:00.000Z",
        coachId: "coach-1",
        coachName: "Мира Георгиева",
        participantsIds: [
          "ath-1",
          "ath-2",
          "ath-3",
          "ath-4",
          "ath-5",
          "ath-6",
          "ath-7",
        ],
        transportType: "fuel_only",
        expensesCoverage: "transport_food_sleep",
        vehicle: {
          brand: "Toyota",
          regNumber: "X1111AA",
          fuelNorm: 6,
          distanceKm: 200, // 12 л
        },
        additionalVehicles: [
          {
            driverId: "ath-1",
            driverName: "Иван Петров",
            driverRole: "Водач / Състезател",
            brand: "VW Golf",
            regNumber: "CT2222BB",
            fuelNorm: 7,
            distanceKm: 150, // 10.5 л
          },
          {
            driverId: "ath-2",
            driverName: "Георги Стоев",
            driverRole: "Водач / Състезател",
            brand: "Ford Focus",
            regNumber: "CT3333CC",
            fuelNorm: 8,
            // без въведен собствен distanceKm -> наследява 200 км -> 16 л
          },
        ],
        financials: {
          perDiemRateEUR: 22,
          accommodationRateEUR: 25,
          isCommercialActivity: false,
        },
        status: "approved",
      };

      const breakdown = calculateTripVehiclesBreakdown(
        multiTrip,
        1.5,
        "Мира Георгиева"
      );
      expect(breakdown).toHaveLength(3);
      expect(breakdown[0].calcFuelLiters).toBe(12);
      expect(breakdown[1].calcFuelLiters).toBe(10.5);
      expect(breakdown[2].distanceKm).toBe(200);
      expect(breakdown[2].calcFuelLiters).toBe(16);

      const transport = calculateTripTransportTotals(multiTrip, 1.5);
      expect(transport.vehiclesCount).toBe(3);
      expect(transport.effectiveDistanceKm).toBe(200);
      expect(transport.totalFleetDistanceKm).toBe(550);
      expect(transport.calcFuelLiters).toBe(38.5);

      const summary = calculateTripExpensesSummary(multiTrip, [
        {
          id: "shared-fuel-1",
          tripId: "trip-multi-1",
          siteId: "bkgalabovo",
          expenseType: "fuel",
          amountEUR: 1.5,
          documentNumber: "0000123456",
          documentDate: "2026-11-21",
        },
      ]);
      expect(summary.calcFuelLiters).toBe(38.5);
      expect(summary.calcFuelEUR).toBeGreaterThan(57);

      expect(getDriverDistanceKmForTrip(multiTrip, "coach-1")).toBe(200);
      expect(getDriverDistanceKmForTrip(multiTrip, "ath-1")).toBe(150);
      expect(getDriverDistanceKmForTrip(multiTrip, "ath-2")).toBe(200);
      expect(getDriverDistanceKmForTrip(multiTrip, "ath-3")).toBe(0);
    });
  });

  describe("Audit regression guards (deduplication, fuel gating, public transport, hasEntryFee, isFemalePerson)", () => {
    it("deduplicates participantsIds, falls back to overrides[coachId], and honors stayedOvernight=false before actualNights", () => {
      const trip: BusinessTrip = {
        id: "trip-audit-1",
        siteId: "bkgalabovo",
        title: "Тест",
        destination: "София",
        startDate: "2026-06-01T08:00:00.000Z",
        endDate: "2026-06-03T18:00:00.000Z",
        coachId: "coach-1",
        participantsIds: ["ath-1", "ath-1", "ath-2"],
        transportType: "club_paid",
        expensesCoverage: "food_and_sleep",
        financials: {
          perDiemRateEUR: 22,
          accommodationRateEUR: 20,
          isCommercialActivity: false,
        },
        participantOverrides: {
          "coach-1": { actualDays: 2, actualNights: 1 },
          "ath-1": { actualDays: 2, actualNights: 2, stayedOvernight: false },
        },
        status: "approved",
      };

      const res = calculateTripStatementTotals(trip);
      expect(res.activePeopleCount).toBe(3);
      const coach = res.personTotals.find((p) => p.id === "coach")!;
      expect(coach.days).toBe(2);
      expect(coach.nights).toBe(1);
      const ath1 = res.personTotals.find((p) => p.id === "ath-1")!;
      expect(ath1.nights).toBe(0);
      expect(ath1.stayedOvernight).toBe(false);
      expect(ath1.perDiemRateEUR).toBe(11);
    });

    it("gates fuel liters/cost to fuel_only while preserving distanceKm, avoids double-counting public transport, and respects hasEntryFee=false", () => {
      const trip: BusinessTrip = {
        id: "trip-audit-2",
        siteId: "bkgalabovo",
        title: "Тест транспорт",
        destination: "София",
        startDate: "2026-06-01T08:00:00.000Z",
        endDate: "2026-06-02T18:00:00.000Z",
        coachId: "coach-1",
        participantsIds: ["ath-1"],
        transportType: "public",
        publicTransportDailyFareEUR: 15,
        expensesCoverage: "transport_and_food",
        vehicle: {
          fuelNorm: 8,
          distanceKm: 300,
        },
        financials: {
          perDiemRateEUR: 11,
          accommodationRateEUR: 0,
          entryFeeEUR: 50,
          hasEntryFee: false,
          isCommercialActivity: false,
        },
        status: "approved",
      };

      const transport = calculateTripTransportTotals(trip, 1.5);
      expect(transport.effectiveDistanceKm).toBe(300);
      expect(transport.calcFuelLiters).toBe(0);
      expect(transport.calcFuelEUR).toBe(0);

      const breakdown = calculateTripVehiclesBreakdown(trip, 1.5);
      expect(breakdown[0].distanceKm).toBe(300);
      expect(breakdown[0].calcFuelLiters).toBe(0);
      expect(breakdown[0].calcFuelEUR).toBe(0);

      const summary = calculateTripExpensesSummary(trip, [
        {
          id: "exp-ticket",
          tripId: "trip-audit-2",
          siteId: "bkgalabovo",
          expenseType: "transport",
          amountEUR: 40,
        },
      ]);
      // 40 (transport invoice) + 44 (2 people * 2 days * 11 EUR), NO publicTransport double-count, NO 50 EUR entryFee
      expect(summary.totalEstimatedCostEUR).toBe(84);
      expect(summary.calcFuelLiters).toBe(0);
    });

    it("does not false-match substring first names in isFemalePerson", () => {
      const membersDict: Record<string, Member> = {
        mira: {
          id: "mira",
          firstName: "Мира",
          lastName: "Георгиева",
          gender: "female",
        } as Member,
      };
      expect(isFemalePerson("Мирослав Петров", membersDict)).toBe(false);
      expect(isFemalePerson("Мира Георгиева", membersDict)).toBe(true);
    });
  });
});
