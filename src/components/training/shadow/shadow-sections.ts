export interface ShadowSection {
  id: string;
  label: string;
  href: string;
  tooltip?: string;
}

export const SHADOW_SECTIONS: ShadowSection[] = [
  {
    id: "setup",
    label: "Настройки & Треньор",
    href: "/training/shadow",
    tooltip:
      "Конфигуратор на възрастови групи, кортове, състезатели и жива тренировка",
  },
  {
    id: "history",
    label: "История на сесиите",
    href: "/training/shadow/history",
    tooltip:
      "Архив на проведените тренировки, индивидуално RPE, Heatmap и лидерборд",
  },
];

export function getActiveShadowSection(pathname: string): string {
  if (pathname.startsWith("/training/shadow/history")) return "history";
  return "setup";
}
