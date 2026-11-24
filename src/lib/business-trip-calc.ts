import { differenceInCalendarDays } from "date-fns";

import { BusinessTrip, TripExpense } from "@/types/business-trip.types";

export const EUR_TO_BGN_RATE = 1.95583;

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

/**
 * Определя дневната ставка на човек.
 * Ръчно зададена ставка (включително 0) се зачита, освен ако не е
 * позната повредена стойност от старо двойно делене на 2
 * (т.е. точно половината от ставката „без нощувка", напр. 5.50 при 11 €).
 */
export function resolvePersonRate(
  ovRate: number | undefined,
  isNoStay: boolean,
  noStayRate: number,
  fullRate: number
): number {
  if (ovRate != null) {
    const isLegacyHalved =
      noStayRate > 0 && Math.abs(ovRate - noStayRate / 2) < 0.005;
    if (!isLegacyHalved) {
      return ovRate;
    }
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
  // Треньорът винаги е отделен запис с ключ "coach".
  // Защита от дублиране: ако coachId или "coach" присъства и в participantsIds,
  // го филтрираме, за да гарантираме, че при треньор-състезател (напр. Мира Георгиева)
  // НЯМА двойно начисляване на дневни/нощувки за едно и също лице.
  const filteredParticipantIds = (trip.participantsIds || []).filter(
    (id) => id !== "coach" && id !== trip.coachId
  );
  const allIds = ["coach", ...filteredParticipantIds];

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
  totalFleetDistanceKm: number;
  vehiclesCount: number;
  calcFuelLiters: number;
  calcFuelEUR: number;
  calcPublicTransportEUR: number;
}

export interface VehicleFuelBreakdownItem {
  index: number;
  label: string;
  driverId?: string;
  driverName: string;
  driverRole: string;
  brand: string;
  regNumber: string;
  fuelType: string;
  fuelNorm: number;
  distanceKm: number;
  calcFuelLiters: number;
  calcFuelEUR: number;
  calcFuelBGN: number;
}

/**
 * Изчислява ефективните километри и транспортни разходи по командировка:
 * - При режим "daily_commute" (ежедневно пътуване без нощувка):
 *     Ако децата отпаднат на ден 2 от 3-дневен турнир, курсовете стават 2.
 *     Ефективни км = actualTripsCount * singleRoundTripKm (или actualDays * singleRoundTripKm)
 * - При режим "single" (еднократно отиване и връщане с престой на място):
 *     Курсът е 1 (общо в двете посоки), независимо колко дни е продължил престоят.
 */
function getActivePersonDays(
  trip: BusinessTrip,
  plannedDays: number
): number[] {
  const overrides = trip.participantOverrides ?? {};
  const teamDays = trip.actualDays != null ? trip.actualDays : plannedDays;
  const filteredParticipantIds = (trip.participantsIds || []).filter(
    (id) => id !== "coach" && id !== trip.coachId
  );
  const ids = ["coach", ...filteredParticipantIds];
  return ids
    .filter((id) => !overrides[id]?.excluded)
    .map((id) => overrides[id]?.actualDays ?? teamDays);
}

/**
 * Дни на пътуване на МПС: ако няма изрично зададени курсове, превозното
 * средство пътува толкова дни, колкото е присъствал най-дълго участвалият
 * (неизключен) човек. Така резултатът не зависи само от отметката на треньора
 * и съвпада с Ведомостта.
 */
function resolveTripDays(trip: BusinessTrip, plannedDays: number): number {
  const days = getActivePersonDays(trip, plannedDays);
  if (days.length > 0) return Math.max(...days);
  return trip.actualDays != null ? trip.actualDays : plannedDays;
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
  fuelPricePerLiterEUR = 0
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

  const primaryFuelNorm = vehicle?.fuelNorm ?? 0;
  const primaryFuelLiters =
    effectiveDistanceKm > 0 && primaryFuelNorm > 0
      ? (effectiveDistanceKm / 100) * primaryFuelNorm
      : 0;

  const extraVehicles = (trip.additionalVehicles ?? []).filter(
    (av) =>
      Boolean(av.brand?.trim()) ||
      Boolean(av.regNumber?.trim()) ||
      (av.fuelNorm ?? 0) > 0 ||
      Boolean(av.driverId) ||
      Boolean(av.driverName?.trim())
  );

  let extraDistanceKm = 0;
  let extraFuelLiters = 0;
  for (const av of extraVehicles) {
    const avDist =
      av.distanceKm != null && av.distanceKm > 0
        ? av.distanceKm
        : effectiveDistanceKm;
    const avNorm = av.fuelNorm ?? 0;
    extraDistanceKm += avDist;
    if (avDist > 0 && avNorm > 0) {
      extraFuelLiters += (avDist / 100) * avNorm;
    }
  }

  const totalFleetDistanceKm =
    Math.round((effectiveDistanceKm + extraDistanceKm) * 10) / 10;
  const calcFuelLiters =
    Math.round((primaryFuelLiters + extraFuelLiters) * 100) / 100;

  const calcFuelEUR =
    calcFuelLiters > 0
      ? Math.round(calcFuelLiters * fuelPricePerLiterEUR * 100) / 100
      : 0;

  let calcPublicTransportEUR = 0;
  if (trip.transportType === "public" && trip.publicTransportDailyFareEUR) {
    const dailyFare = trip.publicTransportDailyFareEUR;
    const personDays = getActivePersonDays(trip, plannedDays);
    const totalPersonDays =
      trip.publicTransportDaysCount != null
        ? personDays.length * trip.publicTransportDaysCount
        : personDays.reduce((sum, d) => sum + d, 0);
    calcPublicTransportEUR =
      Math.round(dailyFare * totalPersonDays * 100) / 100;
  }

  return {
    isDailyCommute,
    singleRoundTripKm,
    plannedTripsCount,
    actualTripsCount,
    effectiveDistanceKm,
    totalFleetDistanceKm,
    vehiclesCount: 1 + extraVehicles.length,
    calcFuelLiters,
    calcFuelEUR,
    calcPublicTransportEUR,
  };
}

/**
 * Връща детайлна разбивка на горивото и пробега за всеки автомобил (1-ви, 2-ри, 3-ти),
 * използвана в Пътния лист, Заповедта, Доклада и счетоводните обобщения.
 */
export function calculateTripVehiclesBreakdown(
  trip: BusinessTrip,
  fuelPricePerLiterEUR = 0,
  coachNameOverride?: string
): VehicleFuelBreakdownItem[] {
  const transportCalc = calculateTripTransportTotals(
    trip,
    fuelPricePerLiterEUR
  );
  const primaryDist = transportCalc.effectiveDistanceKm;
  const roundedPricePerLiterBGN =
    Math.round(fuelPricePerLiterEUR * EUR_TO_BGN_RATE * 100) / 100;

  const computeCost = (liters: number) => {
    const exactLiters = Math.round(liters * 100) / 100;
    const bgn = Math.round(liters * roundedPricePerLiterBGN * 100) / 100;
    const eur =
      bgn > 0
        ? Math.round((bgn / EUR_TO_BGN_RATE) * 100) / 100
        : Math.round(liters * fuelPricePerLiterEUR * 100) / 100;
    return { calcFuelLiters: exactLiters, calcFuelBGN: bgn, calcFuelEUR: eur };
  };

  const primaryNorm = trip.vehicle?.fuelNorm ?? 0;
  const primaryLiters =
    primaryDist > 0 && primaryNorm > 0 ? (primaryDist / 100) * primaryNorm : 0;

  const items: VehicleFuelBreakdownItem[] = [
    {
      index: 1,
      label:
        (trip.additionalVehicles?.length ?? 0) > 0
          ? "Автомобил 1 (Основен)"
          : "Основен автомобил",
      driverId: trip.coachId,
      driverName: coachNameOverride || trip.coachName || "Ръководител / Водач",
      driverRole: trip.coachRole || "Ръководител / Водач",
      brand: trip.vehicle?.brand || "—",
      regNumber: trip.vehicle?.regNumber || "—",
      fuelType: trip.vehicle?.fuelType || "бензин/дизел",
      fuelNorm: primaryNorm,
      distanceKm: primaryDist,
      ...computeCost(primaryLiters),
    },
  ];

  const extras = trip.additionalVehicles ?? [];
  extras.forEach((av, idx) => {
    const hasData =
      Boolean(av.brand?.trim()) ||
      Boolean(av.regNumber?.trim()) ||
      (av.fuelNorm ?? 0) > 0 ||
      Boolean(av.driverId) ||
      Boolean(av.driverName?.trim());
    if (!hasData) return;

    const avDist =
      av.distanceKm != null && av.distanceKm > 0 ? av.distanceKm : primaryDist;
    const avNorm = av.fuelNorm ?? 0;
    const avLiters = avDist > 0 && avNorm > 0 ? (avDist / 100) * avNorm : 0;
    items.push({
      index: idx + 2,
      label: `Автомобил ${idx + 2}`,
      driverId: av.driverId,
      driverName: av.driverName || "Допълнителен водач",
      driverRole: av.driverRole || "Водач на МПС",
      brand: av.brand || "—",
      regNumber: av.regNumber || "—",
      fuelType: av.fuelType || trip.vehicle?.fuelType || "бензин/дизел",
      fuelNorm: avNorm,
      distanceKm: avDist,
      ...computeCost(avLiters),
    });
  });

  return items;
}

/**
 * Връща изминатите служебни километри на конкретен член като водач в дадена командировка
 * (както като основен треньор/водач, така и като водач на 2-ри или 3-ти автомобил).
 */
export function getDriverDistanceKmForTrip(
  trip: BusinessTrip,
  memberId: string
): number {
  if (trip.transportType !== "fuel_only") return 0;
  const transportCalc = calculateTripTransportTotals(trip);
  let totalKm = 0;
  if (trip.coachId === memberId) {
    totalKm += transportCalc.effectiveDistanceKm;
  }
  for (const av of trip.additionalVehicles ?? []) {
    if (av.driverId === memberId) {
      totalKm +=
        av.distanceKm != null && av.distanceKm > 0
          ? av.distanceKm
          : transportCalc.effectiveDistanceKm;
    }
  }
  return Math.round(totalKm * 10) / 10;
}

/**
 * Връща общия брой пътуващи лица в командировката (уникални състезатели + ръководител).
 */
export function getTripTotalTravelersCount(trip: BusinessTrip): number {
  const uniqueIds = new Set<string>(
    (trip.participantsIds || []).filter((id) => id && id !== "coach")
  );
  if (trip.coachId) {
    uniqueIds.add(trip.coachId);
  }
  return uniqueIds.size;
}

/**
 * Връща true, когато командировката е с лично МПС (fuel_only), пътуват повече от 6 души
 * и все още не е добавен 2-ри или 3-ти автомобил.
 */
export function needsMultiVehicleNotice(trip: BusinessTrip): boolean {
  if (trip.transportType !== "fuel_only") return false;
  if (getTripTotalTravelersCount(trip) <= 6) return false;
  const activeExtras = (trip.additionalVehicles ?? []).filter(
    (av) =>
      Boolean(av.brand?.trim()) ||
      Boolean(av.regNumber?.trim()) ||
      (av.fuelNorm ?? 0) > 0 ||
      Boolean(av.driverId) ||
      Boolean(av.driverName?.trim())
  );
  return activeExtras.length === 0;
}

export interface TripExpensesSummary {
  nonFuelExpensesEUR: number;
  nonFuelExpensesBGN: number;
  hasFuelReceipts: boolean;
  avgFuelPricePerLiterEUR: number;
  calcFuelLiters: number;
  calcFuelEUR: number;
  calcFuelBGN: number;
  effectiveFuelEUR: number;
  effectiveFuelBGN: number;
  invoicedPlusFuelEUR: number;
  invoicedPlusFuelBGN: number;
  calcPerDiemEUR: number;
  calcPerDiemBGN: number;
  calcAccomEUR: number;
  totalEstimatedCostEUR: number;
  totalEstimatedCostBGN: number;
}

/**
 * Единна функция за обобщаване на разходите (фактури + гориво по пътен лист + ведомост),
 * така че картичките (Обзор, Разходи, Доклад) и PDF документите да показват идентични суми.
 * Важно: разходите от тип "fuel" съдържат единична цена на литър (€/л), а не обща сума!
 */
export function calculateTripExpensesSummary(
  trip: BusinessTrip,
  expenses: TripExpense[] = []
): TripExpensesSummary {
  const nonFuelExpenses = expenses.filter((e) => e.expenseType !== "fuel");
  const fuelExpenses = expenses.filter((e) => e.expenseType === "fuel");

  const nonFuelExpensesEUR =
    Math.round(
      nonFuelExpenses.reduce((sum, e) => sum + (e.amountEUR || 0), 0) * 100
    ) / 100;
  const nonFuelExpensesBGN =
    Math.round(nonFuelExpensesEUR * EUR_TO_BGN_RATE * 100) / 100;

  const avgFuelPricePerLiterEUR =
    fuelExpenses.length > 0
      ? fuelExpenses.reduce((sum, e) => sum + (e.amountEUR || 0), 0) /
        fuelExpenses.length
      : 0;

  const transportCalc = calculateTripTransportTotals(
    trip,
    avgFuelPricePerLiterEUR
  );

  // Същата формула за гориво като в Пътния лист и Ведомостта (PDF), сумирана за всички МПС (1..3)
  const vehiclesBreakdown = calculateTripVehiclesBreakdown(
    trip,
    avgFuelPricePerLiterEUR
  );
  const totalLitersExact = vehiclesBreakdown.reduce(
    (sum, v) =>
      sum +
      (v.distanceKm > 0 && v.fuelNorm > 0
        ? (v.distanceKm / 100) * v.fuelNorm
        : 0),
    0
  );

  const roundedPricePerLiterBGN =
    Math.round(avgFuelPricePerLiterEUR * EUR_TO_BGN_RATE * 100) / 100;
  const calcFuelBGN =
    Math.round(totalLitersExact * roundedPricePerLiterBGN * 100) / 100;
  const calcFuelEUR =
    calcFuelBGN > 0
      ? Math.round((calcFuelBGN / EUR_TO_BGN_RATE) * 100) / 100
      : 0;

  const invoicedPlusFuelEUR =
    Math.round((nonFuelExpensesEUR + calcFuelEUR) * 100) / 100;
  const invoicedPlusFuelBGN =
    Math.round(invoicedPlusFuelEUR * EUR_TO_BGN_RATE * 100) / 100;

  const statementTotals = calculateTripStatementTotals(trip);

  const foodExpensesEUR = expenses
    .filter((e) => e.expenseType === "food")
    .reduce((sum, e) => sum + (e.amountEUR || 0), 0);
  const accomExpensesEUR = expenses
    .filter((e) => e.expenseType === "accommodation")
    .reduce((sum, e) => sum + (e.amountEUR || 0), 0);
  const entryExpensesEUR = expenses
    .filter((e) => e.expenseType === "entry_fee")
    .reduce((sum, e) => sum + (e.amountEUR || 0), 0);

  // Ако има фактура за храна/нощувка/такса, тя вече е в nonFuelExpensesEUR; иначе взимаме изчислените по ведомост/заповед
  const effectivePerDiemEUR =
    foodExpensesEUR > 0 ? 0 : statementTotals.calcPerDiemEUR;
  const effectiveAccomEUR =
    accomExpensesEUR > 0 ? 0 : statementTotals.calcAccomEUR;
  const effectiveEntryEUR =
    entryExpensesEUR > 0 ? 0 : trip.financials.entryFeeEUR || 0;
  const effectiveFuelEUR =
    fuelExpenses.length > 0 ? calcFuelEUR : transportCalc.calcFuelEUR;
  const effectiveFuelBGN =
    Math.round(effectiveFuelEUR * EUR_TO_BGN_RATE * 100) / 100;

  const totalEstimatedCostEUR =
    Math.round(
      (nonFuelExpensesEUR +
        effectiveFuelEUR +
        effectivePerDiemEUR +
        effectiveAccomEUR +
        effectiveEntryEUR +
        transportCalc.calcPublicTransportEUR) *
        100
    ) / 100;
  const totalEstimatedCostBGN =
    Math.round(totalEstimatedCostEUR * EUR_TO_BGN_RATE * 100) / 100;

  return {
    nonFuelExpensesEUR,
    nonFuelExpensesBGN,
    hasFuelReceipts: fuelExpenses.length > 0,
    avgFuelPricePerLiterEUR,
    calcFuelLiters: Math.round(totalLitersExact * 100) / 100,
    calcFuelEUR,
    calcFuelBGN,
    effectiveFuelEUR,
    effectiveFuelBGN,
    invoicedPlusFuelEUR,
    invoicedPlusFuelBGN,
    calcPerDiemEUR: statementTotals.calcPerDiemEUR,
    calcPerDiemBGN:
      Math.round(statementTotals.calcPerDiemEUR * EUR_TO_BGN_RATE * 100) / 100,
    calcAccomEUR: statementTotals.calcAccomEUR,
    totalEstimatedCostEUR,
    totalEstimatedCostBGN,
  };
}

export const COACH_ORIGIN_ONE_WAY_KM = 48;
export const COACH_ORIGIN_ROUND_TRIP_KM = 96;

export function isCoachMiraGeorgieva(
  coachName?: string,
  coachFirstName?: string,
  coachLastName?: string
): boolean {
  const full = `${coachFirstName || ""} ${coachLastName || ""}`
    .trim()
    .toLowerCase();
  const raw = (coachName || "").trim().toLowerCase();
  return (
    raw.includes("мира") ||
    full.includes("мира георгиева") ||
    (coachFirstName?.trim().toLowerCase() === "мира" &&
      coachLastName?.trim().toLowerCase() === "георгиева")
  );
}

/**
 * Определя дали командировката ползва специалния маршрут на треньора с лично МПС:
 * гр. Хасково -> гр. Гълъбово (СЗ „Енергетик“) -> Дестинация -> гр. Гълъбово (СЗ „Енергетик“) -> гр. Хасково.
 * Важи САМО при transportType === "fuel_only" (лично МПС). При безплатен, клубен или обществен транспорт НЕ важи.
 */
export function usesCoachOriginRoute(
  trip: Pick<BusinessTrip, "transportType" | "coachName" | "vehicle">,
  coachMember?: { firstName?: string; lastName?: string } | null
): boolean {
  if (trip.transportType !== "fuel_only") return false;
  if (trip.vehicle?.includeCoachOriginLeg === false) return false;
  if (trip.vehicle?.includeCoachOriginLeg === true) return true;
  return (
    isCoachMiraGeorgieva(
      trip.coachName,
      coachMember?.firstName,
      coachMember?.lastName
    ) || !trip.coachName
  );
}

export function buildTripRouteLabel(
  trip: Pick<
    BusinessTrip,
    "transportType" | "coachName" | "vehicle" | "destination"
  >,
  coachMember?: { firstName?: string; lastName?: string } | null,
  fallbackDest = "___________"
): string {
  const dest = (trip.destination || "").trim() || fallbackDest;
  if (usesCoachOriginRoute(trip, coachMember)) {
    const origin = trip.vehicle?.coachOriginCity?.trim() || "гр. Хасково";
    const pickup =
      trip.vehicle?.pickupPoint?.trim() ||
      "гр. Гълъбово (Спортна зала „Енергетик“)";
    return `${origin} — ${pickup} — ${dest} — ${pickup} — ${origin}`;
  }
  return `гр. Гълъбово — ${dest} — гр. Гълъбово`;
}

export function buildTripRouteDescription(
  trip: Pick<
    BusinessTrip,
    "transportType" | "coachName" | "vehicle" | "destination"
  >,
  coachMember?: { firstName?: string; lastName?: string } | null
): string | null {
  if (!usesCoachOriginRoute(trip, coachMember)) return null;
  const dest = (trip.destination || "").trim() || "мястото на състезанието";
  const origin = trip.vehicle?.coachOriginCity?.trim() || "гр. Хасково";
  const pickup =
    trip.vehicle?.pickupPoint?.trim() ||
    "гр. Гълъбово (Спортна зала „Енергетик“)";
  return `Маршрут с лично МПС: тръгване от ${origin} до ${pickup} за вземане на състезателите, придвижване до ${dest}, връщане на състезателите до ${pickup} и прибиране в ${origin}.`;
}

/**
 * Форматира името на населеното място/залата без дублиране на „гр. / град / гр./място“.
 */
export function formatDestPlace(dest?: string | null): string {
  const trimmed = (dest || "").trim();
  if (!trimmed) return "посочената дестинация";
  if (
    /^(гр\.|град\s)/iu.test(trimmed) ||
    /(зала|спорт|дворец|клуб|гр\.|град\s)/iu.test(trimmed)
  ) {
    return trimmed;
  }
  return `гр. ${trimmed}`;
}
