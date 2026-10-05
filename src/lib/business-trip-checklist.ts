/**
 * business-trip-checklist.ts
 *
 * Изчислява списък с липсващи или непълни елементи за дадена командировка.
 * Използва се в BusinessTripManagerDialog за показване на напомняния.
 */

import { BusinessTrip, TripExpense } from "@/types/business-trip.types";

export type CheckSeverity = "error" | "warning" | "info";

export interface TripCheckItem {
  id: string;
  severity: CheckSeverity;
  category: "document" | "finance" | "legal" | "signature" | "data";
  message: string;
  hint?: string;
}

// ─── Помощни типове ───────────────────────────────────────────────────────────

interface CheckContext {
  trip: BusinessTrip;
  expenses: TripExpense[];
  hasFuelExpense: boolean;
  hasTransportExpense: boolean;
  hasAccomExpense: boolean;
  hasEntryFeeExpense: boolean;
  needsTransport: boolean;
  needsAccom: boolean;
  needsPerDiem: boolean;
}

// ─── Проверки по категории ─────────────────────────────────────────────────────

function checkGeneralData(ctx: CheckContext): TripCheckItem[] {
  const { trip } = ctx;
  const issues: TripCheckItem[] = [];

  const hasDecision = Boolean(
    (trip.usDecision && trip.usDecision.trim() !== "") ||
    trip.decisionDownloadedAt
  );

  if (!hasDecision) {
    issues.push({
      id: "missing_us_decision",
      severity: "error",
      category: "legal",
      message: "Липсва Решение на УС",
      hint: "Въведете номера и датата на протокола на УС или изтеглете Решението на УС (PDF).",
    });
  }
  if (!trip.destination || trip.destination.trim() === "") {
    issues.push({
      id: "missing_destination",
      severity: "error",
      category: "data",
      message: "Липсва дестинация (Место на провеждане)",
      hint: "Въведете града и залата на провеждане на турнира.",
    });
  }
  if (!trip.participantsIds || trip.participantsIds.length === 0) {
    issues.push({
      id: "missing_participants",
      severity: "error",
      category: "data",
      message: "Не са избрани командировани лица",
      hint: "Добавете поне един участник (треньор или състезател) в командировката.",
    });
  }
  if (!trip.expensesCoverage) {
    issues.push({
      id: "missing_coverage",
      severity: "error",
      category: "finance",
      message: 'Не е избран "Тип разход" (Покрити разходи)',
      hint: "Изберете какви разходи поема клубът: само транспорт, само дневни, пълен пакет и т.н.",
    });
  }
  return issues;
}

function checkFuelTransport(ctx: CheckContext): TripCheckItem[] {
  const { trip, hasFuelExpense, needsTransport } = ctx;
  const issues: TripCheckItem[] = [];

  if (!trip.vehicle?.brand || !trip.vehicle.regNumber) {
    issues.push({
      id: "fuel_missing_vehicle",
      severity: "error",
      category: "legal",
      message: "Лично МПС: Липсват данни за автомобила (марка / рег. №)",
      hint: "Въведете марката и регистрационния номер на личното МПС.",
    });
  }
  if (!trip.vehicle?.fuelNorm || trip.vehicle.fuelNorm <= 0) {
    issues.push({
      id: "fuel_missing_norm",
      severity: "warning",
      category: "legal",
      message: "Лично МПС: Не е въведена разходна норма (л/100 км)",
      hint: "Разходната норма е необходима за отчитане на горивото по официални разходни норми (Пътен лист).",
    });
  }
  if (!trip.vehicle?.distanceKm || trip.vehicle.distanceKm <= 0) {
    issues.push({
      id: "fuel_missing_distance",
      severity: "warning",
      category: "finance",
      message: "Лично МПС: Не е въведено разстояние по маршрута (км)",
      hint: "Въведете разстоянието по маршрута (напр. Гълъбово – София = 200 км).",
    });
  }
  if (!hasFuelExpense && needsTransport) {
    issues.push({
      id: "fuel_missing_expense",
      severity: "error",
      category: "finance",
      message: "Лично МПС: Липсва фактура/бон за гориво",
      hint: 'Добавете разход от тип "Гориво". Счетоводството изисква оригинален бон или фактура на клуба.',
    });
  }
  if (!trip.fuelDownloadedAt) {
    issues.push({
      id: "fuel_report_not_printed",
      severity: "warning",
      category: "document",
      message: "Отчетът за гориво (Пътен лист) не е изтеглен/отпечатан",
      hint: 'Натиснете „Отчет гориво (PDF)" и разпечатайте – необходим е за счетоводния архив.',
    });
  }
  return issues;
}

function checkClubTransport(ctx: CheckContext): TripCheckItem[] {
  const { hasFuelExpense, hasTransportExpense } = ctx;
  if (!hasTransportExpense && !hasFuelExpense) {
    return [
      {
        id: "club_missing_transport_expense",
        severity: "error",
        category: "finance",
        message: "Клубен транспорт: Липсва фактура за превоз",
        hint: 'Добавете разход от тип "Транспорт" с № на фактура от превозвача.',
      },
    ];
  }
  return [];
}

function checkPublicTransport(ctx: CheckContext): TripCheckItem[] {
  const { hasTransportExpense } = ctx;
  if (!hasTransportExpense) {
    return [
      {
        id: "public_missing_ticket_expense",
        severity: "warning",
        category: "finance",
        message: "Обществен транспорт: Не са въведени разходи за билети",
        hint: 'Добавете разход от тип "Транспорт". Счетоводството изисква оригиналните билети (отиване + връщане).',
      },
    ];
  }
  return [];
}

function checkAccommodation(ctx: CheckContext): TripCheckItem[] {
  const { trip, hasAccomExpense } = ctx;
  const issues: TripCheckItem[] = [];
  const hasRate =
    trip.financials.accommodationRateEUR != null &&
    trip.financials.accommodationRateEUR > 0;

  if (!hasRate && !hasAccomExpense) {
    issues.push({
      id: "accom_missing_all",
      severity: "error",
      category: "finance",
      message: "Нощувки: Не е въведена цена и липсва фактура",
      hint: 'Въведете цена на нощувка на човек (EUR) или добавете разход от тип "Нощувка" с фактура от хотела.',
    });
  } else if (!hasAccomExpense) {
    issues.push({
      id: "accom_missing_invoice",
      severity: "warning",
      category: "document",
      message: "Нощувки: Липсва фактура от хотел/квартира",
      hint: 'Добавете разход от тип "Нощувка" с № на фактурата на имото на клуба.',
    });
  }
  return issues;
}

function checkFinancials(ctx: CheckContext): TripCheckItem[] {
  const { trip, hasEntryFeeExpense, needsPerDiem } = ctx;
  const issues: TripCheckItem[] = [];

  if (
    needsPerDiem &&
    (!trip.financials.perDiemRateEUR || trip.financials.perDiemRateEUR <= 0)
  ) {
    issues.push({
      id: "perdiem_missing_rate",
      severity: "error",
      category: "finance",
      message: "Дневни пари: Не е зададена ставка (EUR/ден)",
      hint: "Стандартната норма по НКС за 2025/26 г. е €11.00 / ден.",
    });
  }
  if (
    trip.financials.entryFeeEUR &&
    trip.financials.entryFeeEUR > 0 &&
    !hasEntryFeeExpense
  ) {
    issues.push({
      id: "entry_fee_missing_invoice",
      severity: "warning",
      category: "document",
      message: "Входна такса: Не е добавена фактура/квитанция",
      hint: 'Добавете разход от тип "Входна такса" с официалната квитанция от организатора.',
    });
  }
  return issues;
}

function checkDocuments(ctx: CheckContext): TripCheckItem[] {
  const { trip } = ctx;
  const issues: TripCheckItem[] = [];

  if (!trip.decisionDownloadedAt) {
    issues.push({
      id: "decision_not_printed",
      severity: "warning",
      category: "document",
      message: "Решението на УС не е изтеглено/отпечатано",
      hint: 'Натиснете „Решение на УС (PDF)" и разпечатайте. Подписва се от членовете на УС.',
    });
  }
  if (!trip.orderDownloadedAt) {
    issues.push({
      id: "order_not_printed",
      severity: "warning",
      category: "document",
      message: "Заповедта (Нареждането) не е изтеглена/отпечатана",
      hint: 'Натиснете „Нареждане (PDF)" и разпечатайте. Оригиналът се прилага към счетоводния архив.',
    });
  }
  if (!trip.statementDownloadedAt) {
    issues.push({
      id: "statement_not_printed",
      severity: "warning",
      category: "document",
      message: "Ведомостта не е изтеглена/отпечатана",
      hint: 'Натиснете „Ведомост (PDF)" и разпечатайте. Всички командировани лица подписват оригинала.',
    });
  }
  if (!trip.reportDownloadedAt) {
    const end = trip.endDate ? new Date(trip.endDate) : null;
    const now = new Date();
    const daysSinceEnd = end
      ? Math.floor((now.getTime() - end.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    if (daysSinceEnd > 3) {
      issues.push({
        id: "report_overdue",
        severity: "warning",
        category: "document",
        message: "Изтекъл 3-дневен срок за Доклад за извършената работа (НКС)",
        hint: `Събитието е приключило преди ${daysSinceEnd} дни. Командированият е длъжен да представи писмен отчет в 3-дневен срок след завръщането.`,
      });
    } else {
      issues.push({
        id: "report_not_printed",
        severity: "info",
        category: "document",
        message: "Докладът за извършената работа не е изтеглен/отпечатан",
        hint: 'Натиснете „Доклад (PDF)" и разпечатайте. Срок за отчитане: 3 дни от завръщането (съгласно НКС).',
      });
    }
  }
  return issues;
}

function checkSignatures(ctx: CheckContext): TripCheckItem[] {
  const { trip } = ctx;
  const issues: TripCheckItem[] = [];

  if (!trip.signatures?.coach) {
    issues.push({
      id: "signature_coach_missing",
      severity: "info",
      category: "signature",
      message: "Липсва електронен подпис на Командирования",
      hint: "Препоръчително: добавете цифров подпис на треньора/ръководителя за дигитален архив.",
    });
  }
  if (!trip.signatures?.chairman) {
    issues.push({
      id: "signature_chairman_missing",
      severity: "info",
      category: "signature",
      message: "Липсва електронен подпис на Председателя на УС",
      hint: "Препоръчително: добавете цифров подпис на Председателя на УС за дигитален архив.",
    });
  }
  return issues;
}

// ─── Основна публична функция ─────────────────────────────────────────────────

/**
 * Получава командировка + разходи и връща списък с проблеми.
 */
export function checkTripCompleteness(
  trip: BusinessTrip,
  expenses: TripExpense[]
): TripCheckItem[] {
  const coverage = trip.expensesCoverage ?? "";
  const transport = trip.transportType;

  const ctx: CheckContext = {
    trip,
    expenses,
    hasFuelExpense: expenses.some((e) => e.expenseType === "fuel"),
    hasTransportExpense: expenses.some((e) => e.expenseType === "transport"),
    hasAccomExpense: expenses.some((e) => e.expenseType === "accommodation"),
    hasEntryFeeExpense: expenses.some((e) => e.expenseType === "entry_fee"),
    needsTransport:
      coverage === "transport_only" ||
      coverage === "transport_and_food" ||
      coverage === "transport_food_sleep",
    needsAccom:
      coverage === "food_and_sleep" || coverage === "transport_food_sleep",
    needsPerDiem:
      coverage === "food_only" ||
      coverage === "food_and_sleep" ||
      coverage === "transport_and_food" ||
      coverage === "transport_food_sleep",
  };

  const issues: TripCheckItem[] = [
    ...checkGeneralData(ctx),
    ...(transport === "fuel_only" ? checkFuelTransport(ctx) : []),
    ...(transport === "club_paid" && ctx.needsTransport
      ? checkClubTransport(ctx)
      : []),
    ...(transport === "public" && ctx.needsTransport
      ? checkPublicTransport(ctx)
      : []),
    ...(ctx.needsAccom ? checkAccommodation(ctx) : []),
    ...checkFinancials(ctx),
    ...checkDocuments(ctx),
    ...checkSignatures(ctx),
  ];

  return issues;
}

/** Брой на проблеми по severity */
export function countBySeverity(items: TripCheckItem[]) {
  return {
    errors: items.filter((i) => i.severity === "error").length,
    warnings: items.filter((i) => i.severity === "warning").length,
    infos: items.filter((i) => i.severity === "info").length,
  };
}
