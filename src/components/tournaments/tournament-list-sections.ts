import { CheckCircle2, Layers, Trophy } from "lucide-react";

export type TournamentListSectionId = "all" | "active" | "completed";

export interface TournamentListSectionConfig {
  id: TournamentListSectionId;
  label: string;
  pathSuffix: string;
  tooltip: string;
  icon: typeof Trophy;
}

export const TOURNAMENT_LIST_SECTIONS: readonly TournamentListSectionConfig[] =
  [
    {
      id: "all",
      label: "Всички турнири",
      pathSuffix: "",
      tooltip: "Пълен списък на турнирите на клуба",
      icon: Layers,
    },
    {
      id: "active",
      label: "Активни & Предстоящи",
      pathSuffix: "active",
      tooltip: "Турнири със записване, предстоящи или в ход",
      icon: Trophy,
    },
    {
      id: "completed",
      label: "Приключили (Архив)",
      pathSuffix: "completed",
      tooltip: "Завършили турнири с крайно класиране",
      icon: CheckCircle2,
    },
  ] as const;

export function getTournamentListSectionHref(
  id: TournamentListSectionId
): string {
  const section = TOURNAMENT_LIST_SECTIONS.find((s) => s.id === id);
  return section?.pathSuffix
    ? `/tournaments/${section.pathSuffix}`
    : "/tournaments";
}

export function getActiveTournamentListSectionId(
  pathname: string
): TournamentListSectionId | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized === "/tournaments") return "all";
  if (!normalized.startsWith("/tournaments/")) return null;

  const segment = normalized.slice("/tournaments/".length).split("/")[0];
  const match = TOURNAMENT_LIST_SECTIONS.find((s) => s.pathSuffix === segment);
  return match ? match.id : null;
}
