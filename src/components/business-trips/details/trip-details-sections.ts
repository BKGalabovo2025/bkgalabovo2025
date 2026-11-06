import {
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Info,
  Receipt,
  Users,
} from "lucide-react";

export type TripDetailSectionId =
  "overview" | "expenses" | "order" | "protocol" | "athletes" | "report";

export interface TripDetailSectionConfig {
  id: TripDetailSectionId;
  label: string;
  pathSuffix: string;
  tooltip: string;
  icon: typeof Info;
}

export const TRIP_DETAIL_SECTIONS: readonly TripDetailSectionConfig[] = [
  {
    id: "overview",
    label: "Общ преглед",
    pathSuffix: "",
    tooltip: "Основни данни за командировката, треньор, дати и статус",
    icon: Info,
  },
  {
    id: "expenses",
    label: "Разходи & Фактури",
    pathSuffix: "expenses",
    tooltip: "Пълен опис на разходите: гориво, нощувки, дневни и такси",
    icon: Receipt,
  },
  {
    id: "order",
    label: "Заповед (PDF)",
    pathSuffix: "order",
    tooltip: "Официална заповед за командировка с електронен печат",
    icon: FileText,
  },
  {
    id: "protocol",
    label: "Решение на УС",
    pathSuffix: "protocol",
    tooltip: "Протокол и решение на Управителния съвет",
    icon: FileCheck2,
  },
  {
    id: "athletes",
    label: "Състезатели & Подписи",
    pathSuffix: "athletes",
    tooltip: "Пътуващи състезатели и електронни подписи за пътуването",
    icon: Users,
  },
  {
    id: "report",
    label: "Доклад & Отчет",
    pathSuffix: "report",
    tooltip: "Спортно-технически доклад и финансово отчитане",
    icon: FileSpreadsheet,
  },
] as const;

export function getTripSectionHref(
  tripId: string,
  sectionId: TripDetailSectionId
): string {
  const section = TRIP_DETAIL_SECTIONS.find((s) => s.id === sectionId);
  return section?.pathSuffix
    ? `/accounting/trips/${tripId}/${section.pathSuffix}`
    : `/accounting/trips/${tripId}`;
}

export function getActiveTripSectionId(
  pathname: string,
  tripId: string
): TripDetailSectionId | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const base = `/accounting/trips/${tripId}`;

  if (normalized === base) return "overview";
  if (!normalized.startsWith(`${base}/`)) return null;

  const segment = normalized.slice(`${base}/`.length).split("/")[0];
  const match = TRIP_DETAIL_SECTIONS.find((s) => s.pathSuffix === segment);
  return match ? match.id : null;
}
