export interface PlannerSection {
  id: string;
  label: string;
  href: string;
  badge?: string;
}

export const PLANNER_SECTIONS: readonly PlannerSection[] = [
  { id: "upcoming", label: "Предстоящи тренировки", href: "/training/planner" },
  {
    id: "archive",
    label: "Архив на сесиите",
    href: "/training/planner/archive",
  },
] as const;

export function getActivePlannerSection(pathname: string): string {
  if (pathname.startsWith("/training/planner/archive")) {
    return "archive";
  }
  return "upcoming";
}
