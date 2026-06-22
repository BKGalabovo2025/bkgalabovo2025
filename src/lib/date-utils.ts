import { format, isValid } from "date-fns";
import { bg } from "date-fns/locale";

export type DateInput = Date | string | number;


/**
 * Standard date format for the application.
 * Example: "5 май 2026 г."
 */
const formatDateDisplay = (date: DateInput) => {
  const d = new Date(date);
  if (!isValid(d)) return "Невалидна дата";
  return format(d, "d MMMM yyyy 'г.'", { locale: bg });
};

/**
 * Detailed date and time format.
 * Example: "5 май 2026 г., 15:30 ч."
 */
export const formatDateTimeDisplay = (date: DateInput) => {
  const d = new Date(date);
  if (!isValid(d)) return "Невалидна дата";
  return format(d, "d MMMM yyyy 'г.', HH:mm 'ч.'", { locale: bg });
};

/**
 * ISO date string for form inputs (yyyy-MM-dd).
 */
export const formatDateInput = (date: DateInput | undefined) => {
  if (!date) return "";
  const d = new Date(date);
  if (!isValid(d)) return "";
  return format(d, "yyyy-MM-dd");
};

/**
 * ISO date-time string for datetime-local form inputs (yyyy-MM-ddTHH:mm).
 */
export const formatDateTimeLocal = (
  date: DateInput | undefined
) => {
  if (!date) return "";
  const d = new Date(date);
  if (!isValid(d)) return "";
  // Adjust for timezone offset to get local time string
  const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

/**
 * Converts various date types to ISO string, or undefined if null/invalid.
 */
export const toISOStringOrUndefined = (date: unknown): string | undefined => {
  if (!date) return undefined;

  // Handle Firebase Timestamp
  if (
    typeof date === "object" &&
    "toDate" in date &&
    typeof date.toDate === "function"
  ) {
    return date.toDate().toISOString();
  }

  const d = new Date(date as string | number | Date);
  return isValid(d) ? d.toISOString() : undefined;
};

/**
 * Month and year display.
 * Example: "Май 2026"
 */
const formatMonthYear = (date: DateInput) => {
  const d = new Date(date);
  if (!isValid(d)) return "Невалидна дата";
  return format(d, "MMMM yyyy", { locale: bg });
};

/**
 * Short date format.
 * Example: "05.05.2026"
 */
export const formatDateShort = (date: DateInput) => {
  const d = new Date(date);
  if (!isValid(d)) return "Невалидна дата";
  return format(d, "dd.MM.yyyy");
};

/**
 * Formats a time range.
 * If same day: "05 май 2026, 15:30 - 16:30 ч."
 * If different days: "05 май 2026, 15:30 ч. - 06 май 2026, 16:30 ч."
 */
export const formatTimeRange = (
  start: DateInput,
  end: DateInput
) => {
  const s = new Date(start);
  const e = new Date(end);

  if (!isValid(s) || !isValid(e)) return "Невалиден интервал";

  const isSameDay = format(s, "yyyyMMdd") === format(e, "yyyyMMdd");

  if (isSameDay) {
    return `${format(s, "dd MMM yyyy, HH:mm", { locale: bg })} - ${format(e, "HH:mm", { locale: bg })} ч.`;
  }

  return `${format(s, "dd MMM yyyy, HH:mm", { locale: bg })} ч. - ${format(e, "dd MMM yyyy, HH:mm", { locale: bg })} ч.`;
};
