import { describe, expect, it } from "vitest";

import { SiteConfig } from "../config/sites";
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
  getTripProtocolNumber,
  getTripReportNumber,
  getTripStatementNumber,
} from "../lib/business-trip-numbers";
import {
  cleanProtocolText,
  formatOrgName,
  generateDefaultProtocolText,
  isFemalePerson,
} from "../lib/business-trip-protocol";
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
      expect(text).toContain("Спортния календар на БФ Бадминтон");
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
      expect(healed).toContain("Спортния календар на БФ Бадминтон");
      expect(healed).toContain("съгласно Устава на сдружението");
      expect(healed).not.toContain("Той запозна");
      expect(healed).not.toContain("поканата от БФ Бадминтон");
      expect(healed).not.toContain("ЗЮЛНЦ");
      expect(healed).not.toContain("чл. 32");
    });
  });
});
