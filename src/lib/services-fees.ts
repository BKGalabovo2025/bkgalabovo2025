/**
 * Central definitions and helpers for dynamic club fees and subscription options
 * pulled from the Services Catalog ("Каталози - Услуги", collection: clubServices).
 */

export interface ClubFeeOption {
  id: string;
  name: string;
  price: number;
  currency: string;
  type: string;
  targetGroups?: string[];
  label: string; // e.g. "Месечен абонамент - Дете ( 20 EUR )"
  radioLabel: string; // e.g. "Месечен абонамент - Дете (20 EUR)"
}

export const DEFAULT_CLUB_FEES: ClubFeeOption[] = [
  {
    id: "fee_child_1",
    name: "Месечен абонамент - едно дете",
    price: 20,
    currency: "EUR",
    type: "Абонамент",
    label: "Месечен абонамент - едно дете ( 20 EUR )",
    radioLabel: "Месечен абонамент – 1 дете (20 EUR)",
  },
  {
    id: "fee_child_2",
    name: "Месечен абонамент - 2 деца",
    price: 30,
    currency: "EUR",
    type: "Абонамент",
    label: "Месечен абонамент - 2 деца ( 30 EUR )",
    radioLabel: "Месечен абонамент – 2 деца (30 EUR)",
  },
  {
    id: "fee_child_2_plus",
    name: "Месечен абонамент - 2+ деца",
    price: 40,
    currency: "EUR",
    type: "Абонамент",
    label: "Месечен абонамент - 2+ деца ( 40 EUR )",
    radioLabel: "Месечен абонамент – 2+ деца (40 EUR)",
  },
  {
    id: "fee_single_visit",
    name: "Единично посещение",
    price: 3,
    currency: "EUR",
    type: "Еднократно плащане",
    label: "Единично посещение ( 3 EUR )",
    radioLabel: "Единично посещение (3 EUR)",
  },
];

export function formatClubFeeOption(service: {
  id?: string;
  name: string;
  price: number;
  currency?: string;
  type?: string;
  targetGroups?: string[];
}): ClubFeeOption {
  const currency = service.currency || "EUR";
  const name = (service.name || "").trim();
  const price = service.price ?? 0;
  return {
    id: service.id || `fee_${name.toLowerCase().replace(/\s+/g, "_")}`,
    name,
    price,
    currency,
    type: service.type || "Абонамент",
    targetGroups: service.targetGroups || [],
    label: `${name} ( ${price} ${currency} )`,
    radioLabel: `${name} (${price} ${currency})`,
  };
}

export function filterTrainingServicesForDocuments(
  services: Array<{
    id?: string;
    name: string;
    price: number;
    currency?: string;
    type?: string;
    targetGroups?: string[];
  }>
): ClubFeeOption[] {
  if (!services || services.length === 0) return DEFAULT_CLUB_FEES;

  // 1. Месечни абонаменти за деца (Абонамент, изключващ чисто любителските)
  const monthly = services
    .filter(
      (s) =>
        s.type === "Абонамент" &&
        (!s.targetGroups || !s.targetGroups.includes("Любители"))
    )
    .sort((a, b) => a.price - b.price);

  // 2. Еднократни посещения и персонални тренировки за деца / общи
  const oneTime = services
    .filter(
      (s) =>
        s.type === "Еднократно плащане" &&
        (!s.targetGroups || !s.targetGroups.includes("Любители"))
    )
    .sort((a, b) => a.price - b.price);

  const combined = [...monthly, ...oneTime];
  if (combined.length === 0) return DEFAULT_CLUB_FEES;

  return combined.map(formatClubFeeOption);
}

/**
 * Checks whether a saved participationType string matches a candidate option.
 */
export function isMatchingParticipation(
  selected: string | null | undefined,
  option: string | null | undefined
): boolean {
  if (!selected || !option) return false;
  const s = selected.toLowerCase().trim();
  const o = option.toLowerCase().trim();
  if (s === o) return true;
  // Match prefix or core identifiers (e.g. "1 дете", "2 деца", "2+ деца", "единично")
  if (s.includes("1 дете") && o.includes("1 дете")) return true;
  if (
    s.includes("едно дете") &&
    (o.includes("1 дете") || o.includes("едно дете"))
  )
    return true;
  if (
    s.includes("2 деца") &&
    !s.includes("2+") &&
    o.includes("2 деца") &&
    !o.includes("2+")
  )
    return true;
  if (s.includes("2+") && o.includes("2+")) return true;
  if (s.includes("единично") && o.includes("единично")) return true;
  if (s.includes("персонална") && o.includes("персонална")) return true;
  return o.startsWith(s.slice(0, 10));
}
