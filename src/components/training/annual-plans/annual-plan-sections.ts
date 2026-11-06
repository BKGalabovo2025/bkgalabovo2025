export interface AnnualPlanSection {
  id: string;
  label: string;
  href: string;
  badge?: string;
}

export const ANNUAL_PLAN_SECTIONS: readonly AnnualPlanSection[] = [
  { id: "plans", label: "Годишни макроцикли", href: "/training/annual-plans" },
  {
    id: "templates",
    label: "Тренировъчни шаблони",
    href: "/training/annual-plans/templates",
  },
] as const;

export function getActiveAnnualPlanSection(pathname: string): string {
  if (pathname.startsWith("/training/annual-plans/templates")) {
    return "templates";
  }
  return "plans";
}
