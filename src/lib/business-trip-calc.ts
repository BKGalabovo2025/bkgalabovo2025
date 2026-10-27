import { differenceInCalendarDays } from "date-fns";

import { BusinessTrip } from "@/types/business-trip.types";

/**
 * Определя валидните ставки за командировка (в EUR):
 * - При базова ставка > 15 (напр. стандартна пълна ставка 22 € по Наредбата за командировките):
 *     fullRate = basePerDiemEUR (22 €)
 *     noStayRate = 50% от нея (11 €)
 * - При базова ставка <= 15 и > 0 (напр. командировка, създадена директно без нощувка със ставка 11 €):
 *     noStayRate = basePerDiemEUR (11 €) — НЕ се дели втори път на 2 (не става 5.50 €!)
 *     fullRate = basePerDiemEUR * 2 (22 €)
 * - При липса на дневни (0 €):
 *     fullRate = 0 €, noStayRate = 0 €
 */
export function getEffectiveTripRates(basePerDiemEUR: number): {
  fullRate: number;
  noStayRate: number;
} {
  if (basePerDiemEUR > 15) {
    return {
      fullRate: basePerDiemEUR,
      noStayRate: Math.round(basePerDiemEUR * 0.5 * 100) / 100,
    };
  }
  if (basePerDiemEUR > 0) {
    return {
      fullRate: Math.round(basePerDiemEUR * 2 * 100) / 100,
      noStayRate: basePerDiemEUR,
    };
  }
  return { fullRate: 0, noStayRate: 0 };
}

/**
 * Проверява дали видът покрити разходи изключва нощувки (само храна / само транспорт)
 */
export function isTripCoverageWithoutAccom(
  coverage?: string,
  accomRateEUR = 0,
  basePerDiemEUR = 0
): boolean {
  if (
    coverage === "food_only" ||
    coverage === "transport_only" ||
    coverage === "transport_and_food"
  ) {
    return true;
  }
  if (
    coverage !== "food_and_sleep" &&
    coverage !== "transport_food_sleep" &&
    accomRateEUR === 0 &&
    basePerDiemEUR > 0 &&
    basePerDiemEUR <= 15
  ) {
    return true;
  }
  return false;
}

export interface PersonStatementCalculation {
  id: string;
  days: number;
  nights: number;
  stayedOvernight: boolean;
  isNoStay: boolean;
  perDiemRateEUR: number;
  diemTotalEUR: number;
  accomTotalEUR: number;
  totalEUR: number;
}

export interface TripStatementTotals {
  calcPerDiemEUR: number;
  calcAccomEUR: number;
  activePeopleCount: number;
  plannedDays: number;
  plannedNights: number;
  personTotals: PersonStatementCalculation[];
}

interface PersonCalculationParams {
  id: string;
  ov?: {
    actualDays?: number;
    actualNights?: number;
    stayedOvernight?: boolean;
    perDiemRateEUR?: number;
  };
  defDays: number;
  defNights: number;
  coverageExcludesAccom: boolean;
  accomRateEUR: number;
  fullRate: number;
  noStayRate: number;
}

function resolvePersonNights(
  coverageExcludesAccom: boolean,
  ovNights: number | undefined,
  ovStayed: boolean | undefined,
  defNights: number
): number {
  if (coverageExcludesAccom) return 0;
  if (ovNights != null) return ovNights;
  if (ovStayed === false) return 0;
  return defNights;
}

function resolvePersonRate(
  ovRate: number | undefined,
  isNoStay: boolean,
  noStayRate: number,
  fullRate: number
): number {
  // Санитизация: ако е запазено старо грешно 5.50 (<= 6 при нормална ставка >= 11), го коригираме
  if (ovRate != null && ovRate > 6) {
    return ovRate;
  }
  return isNoStay ? noStayRate : fullRate;
}

function calculateSinglePersonStatement(
  params: PersonCalculationParams
): PersonStatementCalculation {
  const {
    id,
    ov,
    defDays,
    defNights,
    coverageExcludesAccom,
    accomRateEUR,
    fullRate,
    noStayRate,
  } = params;

  const days = ov?.actualDays != null ? ov.actualDays : defDays;
  const nights = resolvePersonNights(
    coverageExcludesAccom,
    ov?.actualNights,
    ov?.stayedOvernight,
    defNights
  );

  const stayedOvernight =
    !coverageExcludesAccom &&
    nights > 0 &&
    (ov?.stayedOvernight != null ? ov.stayedOvernight : true);

  const isNoStay = !stayedOvernight || nights === 0;
  const perDiemRate = resolvePersonRate(
    ov?.perDiemRateEUR,
    isNoStay,
    noStayRate,
    fullRate
  );

  const diemTotalEUR = Math.round(perDiemRate * days * 100) / 100;
  const accomTotalEUR = Math.round(accomRateEUR * nights * 100) / 100;

  return {
    id,
    days,
    nights,
    stayedOvernight,
    isNoStay,
    perDiemRateEUR: perDiemRate,
    diemTotalEUR,
    accomTotalEUR,
    totalEUR: Math.round((diemTotalEUR + accomTotalEUR) * 100) / 100,
  };
}

/**
 * Единна функция за изчисление на дневни и квартирни по командировка
 * Използва се синхронно във Ведомостта, Счетоводството и PDF документите.
 */
export function calculateTripStatementTotals(
  trip: BusinessTrip
): TripStatementTotals {
  const sDate = new Date(trip.startDate);
  const eDate = new Date(trip.endDate);
  const plannedDays = Math.max(1, differenceInCalendarDays(eDate, sDate) + 1);

  const basePerDiemEUR =
    trip.financials?.perDiemOverrideEUR ?? trip.financials?.perDiemRateEUR ?? 0;
  const rawAccomRateEUR = trip.financials?.accommodationRateEUR ?? 0;

  const isDailyCommute = trip.vehicle?.commuteMode === "daily_commute";
  const coverageExcludesAccom =
    isDailyCommute ||
    isTripCoverageWithoutAccom(
      trip.expensesCoverage,
      rawAccomRateEUR,
      basePerDiemEUR
    );

  const plannedNights = coverageExcludesAccom
    ? 0
    : Math.max(0, differenceInCalendarDays(eDate, sDate));

  const { fullRate, noStayRate } = getEffectiveTripRates(basePerDiemEUR);
  const accomRateEUR = coverageExcludesAccom ? 0 : rawAccomRateEUR;

  const defDays = trip.actualDays != null ? trip.actualDays : plannedDays;
  const defNights = coverageExcludesAccom
    ? 0
    : trip.actualNights != null
      ? trip.actualNights
      : plannedNights;

  const overrides = trip.participantOverrides ?? {};
  const allIds = ["coach", ...(trip.participantsIds || [])];

  let calcPerDiemEUR = 0;
  let calcAccomEUR = 0;
  let activePeopleCount = 0;
  const personTotals: PersonStatementCalculation[] = [];

  for (const id of allIds) {
    const ov = overrides[id];
    if (ov?.excluded) continue;

    activePeopleCount++;
    const pCalc = calculateSinglePersonStatement({
      id,
      ov,
      defDays,
      defNights,
      coverageExcludesAccom,
      accomRateEUR,
      fullRate,
      noStayRate,
    });

    calcPerDiemEUR += pCalc.diemTotalEUR;
    calcAccomEUR += pCalc.accomTotalEUR;
    personTotals.push(pCalc);
  }

  return {
    calcPerDiemEUR: Math.round(calcPerDiemEUR * 100) / 100,
    calcAccomEUR: Math.round(calcAccomEUR * 100) / 100,
    activePeopleCount,
    plannedDays,
    plannedNights,
    personTotals,
  };
}

export interface TripTransportCalculation {
  isDailyCommute: boolean;
  singleRoundTripKm: number;
  plannedTripsCount: number;
  actualTripsCount: number;
  effectiveDistanceKm: number;
  calcFuelLiters: number;
  calcFuelEUR: number;
  calcPublicTransportEUR: number;
}

/**
 * Изчислява ефективните километри и транспортни разходи по командировка:
 * - При режим "daily_commute" (ежедневно пътуване без нощувка):
 *     Ако децата отпаднат на ден 2 от 3-дневен турнир, курсовете стават 2.
 *     Ефективни км = actualTripsCount * singleRoundTripKm (или actualDays * singleRoundTripKm)
 * - При режим "single" (еднократно отиване и връщане с престой на място):
 *     Курсът е 1 (общо в двете посоки), независимо колко дни е продължил престоят.
 */
function resolveTripDays(trip: BusinessTrip, plannedDays: number): number {
  const coachOverride = trip.participantOverrides?.["coach"];
  if (coachOverride?.actualDays != null) return coachOverride.actualDays;
  if (trip.actualDays != null) return trip.actualDays;
  return plannedDays;
}

function resolveSingleRoundTripKm(
  vehicle: BusinessTrip["vehicle"],
  isDailyCommute: boolean,
  plannedDays: number
): number {
  if (vehicle?.singleRoundTripKm && vehicle.singleRoundTripKm > 0) {
    return vehicle.singleRoundTripKm;
  }
  if (isDailyCommute && vehicle?.distanceKm && plannedDays > 0) {
    return Math.round((vehicle.distanceKm / plannedDays) * 100) / 100;
  }
  return vehicle?.distanceKm ?? 0;
}

function resolveActualTripsCount(
  vehicle: BusinessTrip["vehicle"],
  isDailyCommute: boolean,
  defDays: number
): number {
  if (vehicle?.actualTripsCount != null) return vehicle.actualTripsCount;
  return isDailyCommute ? defDays : 1;
}

/**
 * Изчислява ефективните километри и транспортни разходи по командировка:
 * - При режим "daily_commute" (ежедневно пътуване без нощувка):
 *     Ако децата отпаднат на ден 2 от 3-дневен турнир, курсовете стават 2.
 *     Ефективни км = actualTripsCount * singleRoundTripKm
 * - При режим "single" (еднократно отиване и връщане с престой на място):
 *     Курсът е 1 (общо в двете посоки), независимо колко дни е продължил престоят.
 */
export function calculateTripTransportTotals(
  trip: BusinessTrip,
  fuelPricePerLiterEUR = 1.35
): TripTransportCalculation {
  const sDate = new Date(trip.startDate);
  const eDate = new Date(trip.endDate);
  const plannedDays = Math.max(1, differenceInCalendarDays(eDate, sDate) + 1);

  const defDays = resolveTripDays(trip, plannedDays);
  const vehicle = trip.vehicle;
  const isDailyCommute = vehicle?.commuteMode === "daily_commute";

  const singleRoundTripKm = resolveSingleRoundTripKm(
    vehicle,
    isDailyCommute,
    plannedDays
  );
  const plannedTripsCount =
    vehicle?.plannedTripsCount ?? (isDailyCommute ? plannedDays : 1);
  const actualTripsCount = resolveActualTripsCount(
    vehicle,
    isDailyCommute,
    defDays
  );

  const effectiveDistanceKm = isDailyCommute
    ? Math.round(actualTripsCount * singleRoundTripKm * 10) / 10
    : (vehicle?.distanceKm ?? singleRoundTripKm);

  const fuelNorm = vehicle?.fuelNorm ?? 0;
  const calcFuelLiters =
    effectiveDistanceKm > 0 && fuelNorm > 0
      ? Math.round((effectiveDistanceKm / 100) * fuelNorm * 100) / 100
      : 0;

  const calcFuelEUR =
    calcFuelLiters > 0
      ? Math.round(calcFuelLiters * fuelPricePerLiterEUR * 100) / 100
      : 0;

  let calcPublicTransportEUR = 0;
  if (trip.transportType === "public" && trip.publicTransportDailyFareEUR) {
    const dailyFare = trip.publicTransportDailyFareEUR;
    const peopleCount = 1 + (trip.participantsIds?.length || 0);
    const travelDays = trip.publicTransportDaysCount ?? defDays;
    calcPublicTransportEUR =
      Math.round(dailyFare * peopleCount * travelDays * 100) / 100;
  }

  return {
    isDailyCommute,
    singleRoundTripKm,
    plannedTripsCount,
    actualTripsCount,
    effectiveDistanceKm,
    calcFuelLiters,
    calcFuelEUR,
    calcPublicTransportEUR,
  };
}
