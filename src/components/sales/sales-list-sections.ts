import { CheckCircle2, Clock, Layers } from "lucide-react";

export type SalesListSectionId = "all" | "pending" | "paid";

export interface SalesListSectionConfig {
  id: SalesListSectionId;
  label: string;
  pathSuffix: string;
  tooltip: string;
  icon: typeof Layers;
}

export const SALES_LIST_SECTIONS: readonly SalesListSectionConfig[] = [
  {
    id: "all",
    label: "Всички продажби",
    pathSuffix: "",
    tooltip: "Пълен финансов дневник на продажбите",
    icon: Layers,
  },
  {
    id: "pending",
    label: "Чакащи плащане",
    pathSuffix: "pending",
    tooltip: "Продажби с висящо плащане",
    icon: Clock,
  },
  {
    id: "paid",
    label: "Платени",
    pathSuffix: "paid",
    tooltip: "Успешно платени продажби и фактури",
    icon: CheckCircle2,
  },
] as const;

export function getSalesListSectionHref(id: SalesListSectionId): string {
  const section = SALES_LIST_SECTIONS.find((s) => s.id === id);
  return section?.pathSuffix ? `/sales/${section.pathSuffix}` : "/sales";
}

export function getActiveSalesListSectionId(
  pathname: string
): SalesListSectionId | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized === "/sales") return "all";
  if (!normalized.startsWith("/sales/")) return null;

  const segment = normalized.slice("/sales/".length).split("/")[0];
  const match = SALES_LIST_SECTIONS.find((s) => s.pathSuffix === segment);
  return match ? match.id : null;
}
