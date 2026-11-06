import { Building2, Handshake, Layers } from "lucide-react";

import type { SponsorCategory } from "@/types/certificates";

export type PartnerSectionId = "all" | "institutional" | "sponsors";

export interface PartnerSectionConfig {
  id: PartnerSectionId;
  label: string;
  /** Празен низ = индексна секция (/partners). */
  pathSuffix: string;
  tooltip: string;
  icon: typeof Handshake;
}

export const PARTNER_SECTIONS: readonly PartnerSectionConfig[] = [
  {
    id: "all",
    label: "Всички",
    pathSuffix: "",
    tooltip: "Всички партньори и спонсори",
    icon: Layers,
  },
  {
    id: "institutional",
    label: "Институции",
    pathSuffix: "institutional",
    tooltip: "Институционални и образователни партньори",
    icon: Building2,
  },
  {
    id: "sponsors",
    label: "Спонсори & Фирми",
    pathSuffix: "sponsors",
    tooltip: "Спортни, търговски и медийни партньори и спонсори",
    icon: Handshake,
  },
] as const;

export function getPartnerSectionHref(id: PartnerSectionId): string {
  const section = PARTNER_SECTIONS.find((s) => s.id === id);
  return section?.pathSuffix ? `/partners/${section.pathSuffix}` : "/partners";
}

export function getActivePartnerSectionId(
  pathname: string
): PartnerSectionId | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized === "/partners") return "all";
  if (!normalized.startsWith("/partners/")) return null;
  const segment = normalized.slice("/partners/".length).split("/")[0];
  const match = PARTNER_SECTIONS.find((s) => s.pathSuffix === segment);
  return match ? match.id : null;
}

const INSTITUTIONAL: readonly SponsorCategory[] = [
  "institutional",
  "educational",
];

export function partnerMatchesSection(
  category: SponsorCategory,
  section: PartnerSectionId
): boolean {
  if (section === "all") return true;
  const isInstitution = INSTITUTIONAL.includes(category);
  return section === "institutional" ? isInstitution : !isInstitution;
}
