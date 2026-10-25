import { BusinessTrip } from "@/types/business-trip.types";

/**
 * Старите автоматични номера се извличаха от случайния ID на командировката
 * (напр. "BIMHJM-УС"). Тях третираме като „неръчни“ и ги заместваме с
 * поредния номер на системата.
 */
const LEGACY_AUTO_DECISION = /^[A-Z0-9А-ЯІЈ]{6,8}-(УС|YC|US)$/i;

export function isAutoDecision(usDecision?: string | null): boolean {
  const v = (usDecision ?? "").trim();
  return v === "" || LEGACY_AUTO_DECISION.test(v);
}

/** Основен пореден номер на командировката (число като стринг, напр. "1") */
export function getTripBaseNumber(trip: BusinessTrip): string {
  return trip.orderNumber ? String(trip.orderNumber) : "____";
}

/**
 * Пореден номер на Нареждането / Заповедта: „<№>-НР“.
 * Например: "1-НР"
 */
export function getTripOrderNumber(trip: BusinessTrip): string {
  const base = getTripBaseNumber(trip);
  return base === "____" ? "____" : `${base}-НР`;
}

/**
 * Номер на Решението на УС: ръчно въведеният (ако не е автогенериран), иначе „<№>-УС“.
 * Например: "1-УС"
 */
export function getTripDecisionNumber(trip: BusinessTrip): string {
  if (trip.usDecision && !isAutoDecision(trip.usDecision)) {
    return trip.usDecision.trim();
  }
  const base = getTripBaseNumber(trip);
  return base === "____" ? "____" : `${base}-УС`;
}

/** Пореден номер на Ведомостта за изплатени суми: „<№>-ВД“ */
export function getTripStatementNumber(trip: BusinessTrip): string {
  const base = getTripBaseNumber(trip);
  return base === "____" ? "____" : `${base}-ВД`;
}

/** Пореден номер на Пътния лист / Отчета за гориво: „<№>-ПЛ“ */
export function getTripFuelNumber(trip: BusinessTrip): string {
  const base = getTripBaseNumber(trip);
  return base === "____" ? "____" : `${base}-ПЛ`;
}

/** Пореден номер на Присъствения лист / Списъка: „<№>-ПС“ */
export function getTripAttendanceNumber(trip: BusinessTrip): string {
  const base = getTripBaseNumber(trip);
  return base === "____" ? "____" : `${base}-ПС`;
}

/** Пореден номер на Доклада за резултатите: „<№>-ДК“ */
export function getTripReportNumber(trip: BusinessTrip): string {
  const base = getTripBaseNumber(trip);
  return base === "____" ? "____" : `${base}-ДК`;
}

/**
 * Номер на Протокола от заседание на УС: ръчно въведеният (ако не е автогенериран), иначе „<№>-ПР“.
 * Например: "1-ПР"
 */
const LEGACY_AUTO_PROTOCOL = /^[A-Z0-9А-ЯІЈ]{6,8}-(ПР|PR)$/i;

export function isAutoProtocol(usProtocol?: string | null): boolean {
  const v = (usProtocol ?? "").trim();
  return v === "" || LEGACY_AUTO_PROTOCOL.test(v);
}

export function getTripProtocolNumber(trip: BusinessTrip): string {
  if (trip.usProtocolNumber && !isAutoProtocol(trip.usProtocolNumber)) {
    return trip.usProtocolNumber.trim();
  }
  const base = getTripBaseNumber(trip);
  return base === "____" ? "____" : `${base}-ПР`;
}

/** Връща копие на командировката с нормализирани номера на протокол и решение. */
export function resolveTripNumbers<T extends BusinessTrip>(trip: T): T {
  return {
    ...trip,
    usDecision: getTripDecisionNumber(trip),
    usProtocolNumber: getTripProtocolNumber(trip),
  };
}
