import type { InquiryStatus } from "@/types/inquiry.types";

export type InquirySectionId = "all" | InquiryStatus;

export interface InquirySectionConfig {
  id: InquirySectionId;
  label: string;
  /** Празен низ = индексна секция (/inquiries). */
  pathSuffix: string;
  tooltip: string;
}

export const INQUIRY_SECTIONS: readonly InquirySectionConfig[] = [
  { id: "all", label: "Всички", pathSuffix: "", tooltip: "Всички запитвания" },
  {
    id: "new",
    label: "Нови",
    pathSuffix: "new",
    tooltip: "Нови, необработени запитвания",
  },
  {
    id: "contacted",
    label: "Свързан",
    pathSuffix: "contacted",
    tooltip: "Запитвания, с които е осъществена връзка",
  },
  {
    id: "enrolled",
    label: "Записан",
    pathSuffix: "enrolled",
    tooltip: "Записани участници",
  },
  {
    id: "archived",
    label: "Архив",
    pathSuffix: "archived",
    tooltip: "Архивирани запитвания",
  },
] as const;

export function getInquirySectionHref(id: InquirySectionId): string {
  const section = INQUIRY_SECTIONS.find((s) => s.id === id);
  return section?.pathSuffix
    ? `/inquiries/${section.pathSuffix}`
    : "/inquiries";
}

export function getActiveInquirySectionId(
  pathname: string
): InquirySectionId | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized === "/inquiries") return "all";
  if (!normalized.startsWith("/inquiries/")) return null;
  const segment = normalized.slice("/inquiries/".length).split("/")[0];
  const match = INQUIRY_SECTIONS.find((s) => s.pathSuffix === segment);
  return match ? match.id : null;
}
