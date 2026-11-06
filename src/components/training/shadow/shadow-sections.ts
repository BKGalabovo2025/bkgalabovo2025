export interface ShadowSection {
  id: string;
  label: string;
  href: string;
  badge?: string;
}

export const SHADOW_SECTIONS: readonly ShadowSection[] = [
  { id: "setup", label: "Интерактивна зала", href: "/training/shadow" },
  {
    id: "history",
    label: "История и статистика",
    href: "/training/shadow/history",
  },
] as const;

export function getActiveShadowSection(pathname: string): string {
  if (pathname.startsWith("/training/shadow/history")) {
    return "history";
  }
  return "setup";
}
