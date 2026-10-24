/**
 * Calendar year validity helpers for sports documents.
 * All club documents, federation licenses, competitor cards, declarations,
 * and amateur contracts are valid until 31.12 of the respective calendar year.
 */

export interface CalendarYearValidity {
  year: number;
  validUntilDateStr: string;
  isExpired: boolean;
  currentYear: number;
  daysRemaining: number;
  badgeText: string;
}

export function getCalendarYearValidity(
  dateOrTimestamp?: string | number | Date | null
): CalendarYearValidity {
  const d = dateOrTimestamp ? new Date(dateOrTimestamp) : new Date();
  const validDate = isNaN(d.getTime()) ? new Date() : d;

  const year = validDate.getFullYear();
  // Valid until 31 December 23:59:59 of that year
  const validUntil = new Date(year, 11, 31, 23, 59, 59, 999);
  const now = new Date();
  const currentYear = now.getFullYear();

  const isExpired = year < currentYear;
  const diffMs = validUntil.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const badgeText = isExpired
    ? `Изтекъл на 31.12.${year} г.`
    : `Валиден за ${year} г. (до 31.12)`;

  return {
    year,
    validUntilDateStr: `31.12.${year} г.`,
    isExpired,
    currentYear,
    daysRemaining,
    badgeText,
  };
}

export function formatValidityBadgeText(
  validity: CalendarYearValidity | null
): {
  label: string;
  badgeClass: string;
  isExpired: boolean;
} {
  if (!validity) {
    return {
      label: "Няма данни за валидност",
      badgeClass: "bg-zinc-100 text-zinc-600 border-zinc-200",
      isExpired: false,
    };
  }

  if (validity.isExpired) {
    return {
      label: `Изтекъл на ${validity.validUntilDateStr} (Изисква подновяване за ${validity.currentYear} г.)`,
      badgeClass: "bg-rose-50 text-rose-700 border-rose-200/80 font-bold",
      isExpired: true,
    };
  }

  return {
    label: `Валиден за ${validity.year} г. (до ${validity.validUntilDateStr})`,
    badgeClass:
      "bg-emerald-50 text-emerald-800 border-emerald-200/80 font-semibold",
    isExpired: false,
  };
}
