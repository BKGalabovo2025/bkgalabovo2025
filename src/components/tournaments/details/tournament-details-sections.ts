/**
 * Единен източник на истина за подстраниците (секциите) на турнир.
 * Всяка секция съответства на реален маршрут в
 * `src/app/(protected)/tournaments/[id]/(tabs)/<pathSuffix>/page.tsx`.
 * Навигацията (TournamentDetailsNav) и тестовете за цялост четат от тук.
 */
export type TournamentSectionId =
  "participants" | "bracket" | "matches" | "results";

export interface TournamentSection {
  id: TournamentSectionId;
  label: string;
  /** Суфикс след `/tournaments/[id]`; празен низ = индексната страница. */
  pathSuffix: string;
  tooltip: string;
  accent?: "blue" | "emerald" | "amber";
}

export const TOURNAMENT_DETAILS_SECTIONS: readonly TournamentSection[] = [
  {
    id: "participants",
    label: "Участници",
    pathSuffix: "",
    tooltip: "Списък с всички регистрирани участници в турнира",
  },
  {
    id: "bracket",
    label: "Схема",
    pathSuffix: "/bracket",
    tooltip: "Визуална схема на турнира по кръгове и категории",
    accent: "blue",
  },
  {
    id: "matches",
    label: "Мачове",
    pathSuffix: "/matches",
    tooltip: "Всички изиграни и предстоящи мачове (Бергер схема)",
    accent: "amber",
  },
  {
    id: "results",
    label: "Резултати",
    pathSuffix: "/results",
    tooltip: "Крайно класиране, износ към Excel/PDF и точки",
    accent: "emerald",
  },
];

/** Определя активната секция по текущия път (най-дългото съвпадение печели). */
export function getActiveTournamentSectionId(
  pathname: string,
  tournamentId: string
): TournamentSectionId | null {
  const base = `/tournaments/${tournamentId}`;
  if (pathname === base || pathname === `${base}/participants`) {
    return "participants";
  }
  const match = [...TOURNAMENT_DETAILS_SECTIONS]
    .filter(
      (s) => s.pathSuffix && pathname.startsWith(`${base}${s.pathSuffix}`)
    )
    .sort((a, b) => b.pathSuffix.length - a.pathSuffix.length)[0];
  return match ? match.id : null;
}
