import { Briefcase, Landmark, Layers } from "lucide-react";

export type AccountingSectionId = "all" | "non-commercial" | "commercial";

export interface AccountingSectionConfig {
  id: AccountingSectionId;
  label: string;
  /** Празен низ = индексна секция (/accounting). */
  pathSuffix: string;
  tooltip: string;
  icon: typeof Layers;
}

export const ACCOUNTING_SECTIONS: readonly AccountingSectionConfig[] = [
  {
    id: "all",
    label: "Всички дейности",
    pathSuffix: "",
    tooltip: "Всички командировки за периода",
    icon: Layers,
  },
  {
    id: "non-commercial",
    label: "Нестопанска дейност",
    pathSuffix: "non-commercial",
    tooltip: "Командировки по нестопанска дейност",
    icon: Landmark,
  },
  {
    id: "commercial",
    label: "Стопанска дейност",
    pathSuffix: "commercial",
    tooltip: "Командировки по стопанска дейност",
    icon: Briefcase,
  },
] as const;

export function getAccountingSectionHref(id: AccountingSectionId): string {
  const section = ACCOUNTING_SECTIONS.find((s) => s.id === id);
  return section?.pathSuffix
    ? `/accounting/${section.pathSuffix}`
    : "/accounting";
}

export function getActiveAccountingSectionId(
  pathname: string
): AccountingSectionId | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized === "/accounting") return "all";
  if (!normalized.startsWith("/accounting/")) return null;
  const segment = normalized.slice("/accounting/".length).split("/")[0];
  const match = ACCOUNTING_SECTIONS.find((s) => s.pathSuffix === segment);
  return match ? match.id : null;
}
