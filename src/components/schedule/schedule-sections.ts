export type ScheduleSectionId = "events" | "courts" | "recovery";

export interface ScheduleSectionConfig {
  id: ScheduleSectionId;
  label: string;
  /** Празен низ = индексна секция (/schedule). */
  pathSuffix: string;
  tooltip: string;
}

export const SCHEDULE_SECTIONS: readonly ScheduleSectionConfig[] = [
  {
    id: "events",
    label: "Тренировки & Събития",
    pathSuffix: "",
    tooltip: "Тренировки, състезания, лагери и клубни събития",
  },
  {
    id: "courts",
    label: "Резервация на кортове",
    pathSuffix: "courts",
    tooltip: "Дневен график и история на резервациите на кортове",
  },
  {
    id: "recovery",
    label: "Резервация за възстановяване",
    pathSuffix: "recovery",
    tooltip: "Резервации за процедури във Recovery Zone",
  },
] as const;

export function getScheduleSectionHref(id: ScheduleSectionId): string {
  const section = SCHEDULE_SECTIONS.find((s) => s.id === id);
  return section?.pathSuffix ? `/schedule/${section.pathSuffix}` : "/schedule";
}

export function getActiveScheduleSectionId(
  pathname: string
): ScheduleSectionId | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized === "/schedule") return "events";
  if (!normalized.startsWith("/schedule/")) return null;
  const segment = normalized.slice("/schedule/".length).split("/")[0];
  const match = SCHEDULE_SECTIONS.find((s) => s.pathSuffix === segment);
  return match ? match.id : null;
}

/** Подизгледи в рамките на секция, зададени чрез ?view= */
export const EVENT_VIEWS = ["current", "upcoming", "past"] as const;
export type EventView = (typeof EVENT_VIEWS)[number];
export const RESERVATION_VIEWS = ["schedule", "history"] as const;
export type ReservationView = (typeof RESERVATION_VIEWS)[number];
