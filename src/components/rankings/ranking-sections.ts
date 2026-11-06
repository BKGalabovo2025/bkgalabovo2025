export type RankingSectionId = "all" | "singles" | "doubles" | "mixed";

export interface RankingSectionConfig {
  id: RankingSectionId;
  label: string;
  /** Празен низ = индексна секция (/rankings). */
  pathSuffix: string;
  tooltip: string;
}

export const RANKING_SECTIONS: readonly RankingSectionConfig[] = [
  {
    id: "all",
    label: "Общо",
    pathSuffix: "",
    tooltip: "Общо класиране по всички категории",
  },
  {
    id: "singles",
    label: "Единично",
    pathSuffix: "singles",
    tooltip: "Класиране в единична категория",
  },
  {
    id: "doubles",
    label: "Двойки",
    pathSuffix: "doubles",
    tooltip: "Класиране в категория двойки",
  },
  {
    id: "mixed",
    label: "Смесени",
    pathSuffix: "mixed",
    tooltip: "Класиране в смесени двойки",
  },
] as const;

export function getRankingSectionHref(id: RankingSectionId): string {
  const section = RANKING_SECTIONS.find((s) => s.id === id);
  return section?.pathSuffix ? `/rankings/${section.pathSuffix}` : "/rankings";
}

export function getActiveRankingSectionId(
  pathname: string
): RankingSectionId | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized === "/rankings") return "all";
  if (!normalized.startsWith("/rankings/")) return null;
  const segment = normalized.slice("/rankings/".length).split("/")[0];
  const match = RANKING_SECTIONS.find((s) => s.pathSuffix === segment);
  return match ? match.id : null;
}
